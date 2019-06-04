

const { logInfo } = require('../logger');

class DriverBase {

    constructor(params) {
        if (this.constructor === 'DriverBase') {
            throw new Error('Abstract class can not be constructed');
        }

        Object.keys(params).forEach(key => {
            if (Object.hasOwnProperty.call(params, key)) {
                this[key] = params[key];
            }
        });
    }

    validateConnection() {
        logInfo('Connecting to server ...');
    }

    validateDatabase() {
        logInfo('Checking if database exists ...');
    }

    doBackup() {
        logInfo('Start backing up');
    }

    doRestore() {
        logInfo('Start restoring database');
    }
}

module.exports = DriverBase;