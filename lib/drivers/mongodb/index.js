const Promise = require('bluebird');
const { MongoClient } = require('mongodb');
const fs = require('fs');

const DriverBase = require('../driver-base');
const { logInfo } = require('../../utils/logger');
const Spinner = require('../../utils/spinner');
const { FORMATS } = require('../../constants');
const { backupParsersOptions, restoreParsersOptions } = require('./parsers');

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

    doBackup() {
        super.doBackup();

        const doBackupPromise = new Promise((resolve, reject) => {
            MongoClient.connect(this.uri, connectionOptions, async (err, client) => {
                try {
                    const db = client.db(this.database);
                    let collections = await db.collections();

                    if (collections.length === 0) {
                        reject('Database is empty');
                        return;
                    }

                    const backupFolder = await this._backupCollections(db);
                    resolve(backupFolder);
                } catch (err) {
                    reject(err);
                }
            });
        });

        return doBackupPromise
            .then(backupFolder => `Backup is ready. Backup folder : ${backupFolder}.`)
            .catch(err => `Error while backing up database. ${err}`);
    }

    doRestore() {
        super.doRestore();

        const doRestorePromise = new Promise((resolve, reject) => {
            MongoClient.connect(this.uri, { useNewUrlParser: true }, async (err, client) => {
                try {
                    const db = client.db(this.database);
                    let files = fs.readdirSync(this.path);

                    if (files.length === 0) {
                        reject('Files are not fould in backup folder');
                        return;
                    }

                    await this._dropCollections(db);
                    await this._restoreCollections(db);
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
        });

        return doRestorePromise
            .then(() => 'Database restored')
            .catch(err => `Error while restoring database. ${err}`);
    }

    async _backupCollections(db) {
        let collections = await db.collections();
        const parserOptions = backupParsersOptions[this.format];
        const backupFolder = `${this.path}${new Date().getTime()}_${this.database}`;
        fs.mkdirSync(backupFolder);

        await this._backupIndexes(db, backupFolder);

        while (collections.length !== 0) {
            const collection = collections.shift();

            if (!this._systemIndexesCollection(collection.collectionName)) {
                const fileName = `${backupFolder}/${collection.collectionName}.${this.format}`;
                await this._backupCollection(collection, fileName, parserOptions);
            }
        }
        return backupFolder;
    }

    async _backupCollection(collection, fileName, backupOptions) {
        const { transform, pipe } = backupOptions;
        const { collectionName } = collection;

        return new Promise((resolve, reject) => {
            const spinner = new Spinner(`Backing up ${collection.collectionName} ...`);
            spinner.run();

            const writeStream = fs.createWriteStream(fileName);
            const readStream = collection.find().stream({ transform });
            readStream.
                on('error', error => {
                    spinner.stop();
                    reject(`Can't back up ${collectionName}. ${error.message}`);
                }).
                on('end', () => {
                    spinner.stop();
                    resolve();
                });

            pipe(readStream, writeStream);
        });
    }

    async _backupIndexes(db, backupFolder) {
        let indexes = {};
        const collections = await db.collections();

        while (collections.length !== 0) {
            const collection = collections.shift();
            let collectionIndexes = await collection.indexes();
            indexes[collection.collectionName] = collectionIndexes.map(index => {
                delete index['ns'];
                return index;
            });
        }

        const { backupIndexes } = backupParsersOptions[this.format];
        backupIndexes(`${backupFolder}/system.indexes.${this.format}`, indexes);
    }

    async _restoreCollections(db) {
        let files = fs.readdirSync(this.path);
        let indexes = {};
        let systemIndexesFile = files.find(file => this._systemIndexesCollection(file));
        files = files.filter(file => !this._systemIndexesCollection(file));

        if (systemIndexesFile) {
            indexes = this._getIndexes(`${this.path}${systemIndexesFile}`);
        }

        while (files.length !== 0) {
            const file = files.shift();
            const dataFormat = this._getDataFormat(file);

            if (!dataFormat) {
                logInfo(`Can't read ${file}. Supported files : ${Object.values(FORMATS).join(',')}`);
                continue;
            }

            const collectionName = file.replace(`.${dataFormat}`, '');
            const collection = await db.createCollection(collectionName);
            const results = await this._restoreCollection(collection, `${this.path}${file}`, dataFormat, indexes[collection.collectionName]);

            if (results) {
                logInfo(`Inserted ${results.insertedCount} records. ${results.result.writeErrors.length + results.result.writeConcernErrors.length} errors`);
            }
        }
    }

    async _restoreCollection(collection, filePath, dataFormat, indexes) {
        const parserOptions = restoreParsersOptions[dataFormat];

        return new Promise(async (resolve, reject) => {
            const spinner = new Spinner(`Restoring ${collection.collectionName}`);
            spinner.run();

            const readStream = fs.createReadStream(filePath);
            readStream.on('error', error => {
                spinner.stop();
                reject(`Can't restore ${collection.collectionName}. ${error.message}`);
            });
            const documents = await parserOptions.readData(readStream);

            if (documents.length === 0) {
                spinner.stop();
                resolve();
                return;
            }

            const results = await collection.bulkWrite(documents.map(document => (
                {
                    'insertOne': {
                        'document': document
                    }
                }
            )));

            if (indexes) {
                await collection.createIndexes(indexes);
            }

            spinner.stop();
            resolve(results);
        });
    }

    _getIndexes(file) {
        const dataFormat = this._getDataFormat(file);

        if (!dataFormat) {
            logInfo(`Can't read ${file}. Supported files : ${Object.values(FORMATS).join(',')}`);
            return;
        }

        const { parseIndexes } = backupParsersOptions[dataFormat];
        return parseIndexes(file);
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

module.exports = MongoDBDriver;