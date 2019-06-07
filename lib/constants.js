const JSON_FORMAT = 'json';
const BSON_FORMAT = 'bson';

const MONGODB = 'mongodb';
const MYSQL = 'mysql';

const BACKUP = 'backup';
const RESTORE = 'restore';

module.exports = {
    DRIVERS: {
        MONGODB
    },
    FORMATS_BY_DRIVER: {
        [MONGODB]: [
            {
                name: 'BSON',
                value: BSON_FORMAT
            },
            {
                name: 'JSON',
                value: JSON_FORMAT
            }
        ]
    },
    FORMATS: {
        BSON_FORMAT,
        JSON_FORMAT
    },
    COMMANDS: { BACKUP, RESTORE },
    SUPPORTED_PROTOROLS_BY_DRIVERS: {
        [MONGODB]: ['mongodb', 'mongodb srv'],
        [MYSQL]: ['mysql', 'mysqlx']
    }
};