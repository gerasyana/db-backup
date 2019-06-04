const JSON_FORMAT = 'json';
const BSON_FORMAT = 'bson';
const MONGODB = 'mongodb';

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
                name: 'Extended JSON',
                value: JSON_FORMAT
            }
        ]
    },
    FORMATS: {
        BSON_FORMAT,
        JSON_FORMAT
    },
    COMMANDS: { BACKUP, RESTORE }
};