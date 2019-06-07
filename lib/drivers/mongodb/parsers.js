const fs = require('fs');
const EJSON = require('mongodb-extended-json');
const BSONStream = require('bson-stream');
const BSON = require('bson');
const es = require('event-stream');
const { FORMATS } = require('../../constants');

const backupParsersOptions = {
    [FORMATS.JSON_FORMAT]: {
        transform: data => EJSON.stringify(data),
        pipe: (readStream, writeStream) => readStream.pipe(es.join('\n')).pipe(writeStream),
        backupIndexes: (fileName, data) => fs.appendFileSync(fileName, EJSON.stringify(data)),
        parseIndexes: fileName => {
            const data = fs.readFileSync(fileName);
            return EJSON.parse(data);
        }
    },
    [FORMATS.BSON_FORMAT]: {
        transform: data => BSON.serialize(data),
        pipe: (readStream, writeStream) => readStream.pipe(writeStream),
        backupIndexes: (fileName, data) => fs.appendFileSync(fileName, BSON.serialize(data)),
        parseIndexes: fileName => {
            const data = fs.readFileSync(fileName);
            return BSON.deserialize(data);
        }
    }
};

const restoreParsersOptions = {
    [FORMATS.JSON_FORMAT]: {
        readData: readStream => {
            return new Promise(resolve => {
                const documents = [];
                readStream.pipe(es.split())
                    .on('data', data => {
                        if (data) {
                            documents.push(EJSON.parse(data));
                        }
                    })
                    .on('end', () => { resolve(documents); });
            });
        }
    },
    [FORMATS.BSON_FORMAT]: {
        readData: readStream => {
            return new Promise(resolve => {
                const documents = [];
                readStream.pipe(new BSONStream())
                    .on('data', data => {
                        if (data) {
                            documents.push(data);
                        }
                    })
                    .on('end', () => { resolve(documents); });
            });
        }
    }
};

module.exports = {
    backupParsersOptions,
    restoreParsersOptions
};