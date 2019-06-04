const Promise = require('bluebird');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const DriverBase = require('./driver-base');
const stream = require('../utils/stream-wrapper');
const { logInfo, goToNextLine } = require('../logger');
const { FORMATS } = require('../constants');

Promise.promisifyAll(MongoClient);
const systemRegex = /^.*system\..*$/;
const connectionOptions = {
    useNewUrlParser: true
};

class MongoDBDriver extends DriverBase {

    constructor(config) {
        super(config);
    }

    validateConnection() {
        super.validateConnection();

        return MongoClient.connect(this.uri, connectionOptions);
    }

    validateDatabase() {
        super.validateDatabase();

        return new Promise((resolve, reject) => {
            MongoClient.connect(this.uri, connectionOptions, (err, client) => {
                return client.db(this.database).stats().then(() => resolve())
                    .catch(() => reject());
            });
        });
    }

    doBackup() {
        super.doBackup();

        const doBackupPromise = new Promise(resolve => {
            MongoClient.connect(this.uri, connectionOptions, async (err, client) => {
                const db = client.db(this.database);
                const folderPath = await this._backupCollections(db);
                resolve(folderPath);
            });
        });

        return doBackupPromise
            .then(backupFolder => `Backup is ready. Path to backup is ${backupFolder}.`)
            .catch(err => `Error while backing up database. ${err.message}`);
    }

    doRestore() {
        super.doRestore();

        const doRestorePromise = new Promise(resolve => {
            MongoClient.connect(this.uri, { useNewUrlParser: true }, async (err, client) => {
                const db = client.db(this.database);
                await this._dropCollections(db);
                await this._restoreCollections(db);
                resolve();
            });
        });

        return doRestorePromise
            .then(() => 'Database restored successfully')
            .catch(err => `Error while restoring  database. ${err.message}`);
    }

    async _backupCollections(db) {
        let collections = await db.collections();
        const backup = backupParsers[this.format];
        const folderName = `${this.path}/${new Date().getTime()}_${this.database}`;
        fs.mkdirSync(folderName);

        while (collections.length !== 0) {
            const collection = collections.shift();

            if (!this._systemCollection(collection.collectionName)) { //TODO : backup and restore system collection
                const fileName = `${folderName}/${collection.collectionName}.${this.format}`;
                await backup(collection, fileName);
            }
        }
        return folderName;
    }

    async _restoreCollections(db) {
        let files = fs.readdirSync(this.path);

        if (!files) {
            logInfo('Files are not fould in backup folder');
            return;
        }

        while (files.length !== 0) {
            const file = files.shift();
            const dataFormat = this._getDataFormat(file);

            if (!dataFormat) {
                logInfo(`Can't read ${file}. Supported formats : ${Object.values(FORMATS).join(',')}`);
                return;
            }

            //TODO : restore system collections 
            const collectionName = file.replace(`.${dataFormat}`, '');
            const collection = await db.createCollection(collectionName);
            const results = await this._restoreCollection(collection, `${this.path}${file}`, dataFormat);
            logInfo(`Inserted ${results.insertedCount} records. ${results.result.writeErrors.length + results.result.writeConcernErrors.length} errors`);
        }
    }

    async _restoreCollection(collection, filePath, dataFormat) {
        const dataParser = readDataParsers[dataFormat];

        return new Promise(async resolve => {
            const { readStream, spinner } = stream.wrapRestoreStream(fs.createReadStream(filePath), collection.collectionName);
            const documents = await dataParser(readStream);
            const results = await collection.bulkWrite(documents.map(document => (
                {
                    'insertOne': {
                        'document': document
                    }
                }
            )));

            spinner.stop();
            goToNextLine();
            resolve(results);
        });
    }

    _dropCollections(db) {
        db.collections().then(async collections => {
            collections.forEach(async collection => {
                if (!this._systemCollection(collection.collectionName)) {
                    await collection.drop();
                }
            });
        });
    }

    _getDataFormat(fileName) {
        return Object.values(FORMATS).reduce((dataFormat, key) => {
            if (fileName.endsWith(`.${key}`)) {
                dataFormat = key;
            }
            return dataFormat;
        }, null);
    }

    _systemIndexesCollection(collectionName) {
        return collectionName.includes('system.indexes');
    }

    _systemCollection(collectionName) {
        return systemRegex.test(collectionName);
    }
}

const backupParsers = {
    [FORMATS.JSON_FORMAT]: (collection, fileName) => {
        return new Promise(resolve => {
            const EJSON = require('mongodb-extended-json');
            const es = require('event-stream');

            const writeStream = fs.createWriteStream(fileName);
            const readStream = stream.wrapBackupStream(collection.find().stream({
                transform: data => EJSON.stringify(data)
            }), collection.collectionName, resolve);
            readStream.pipe(es.join('\n')).pipe(writeStream);
        });
    },
    [FORMATS.BSON_FORMAT]: (collection, fileName) => {
        return new Promise(resolve => {
            const BSON = require('bson');

            const writeStream = fs.createWriteStream(fileName);
            const readStream = stream.wrapBackupStream(collection.find().stream({
                transform: data => BSON.serialize(data)
            }), collection.collectionName, resolve);
            readStream.pipe(writeStream);
        });
    }
};

const readDataParsers = {
    [FORMATS.JSON_FORMAT]: readStream => {
        const EJSON = require('mongodb-extended-json');
        const es = require('event-stream');

        return new Promise(resolve => {
            const documents = [];

            readStream.pipe(es.split())
                .on('data', data => {
                    documents.push(EJSON.parse(data));
                })
                .on('end', () => {
                    resolve(documents);
                });
        });
    },
    [FORMATS.BSON_FORMAT]: readStream => {
        const BSONStream = require('bson-stream');

        return new Promise(resolve => {
            const documents = [];

            readStream.pipe(new BSONStream())
                .on('data', data => {
                    documents.push(data);
                })
                .on('end', () => {
                    resolve(documents);
                });
        });
    }
};

module.exports = MongoDBDriver;