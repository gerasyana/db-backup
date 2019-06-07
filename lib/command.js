
const { getConfig } = require('./config');
const { getDriverInstance } = require('./driver');
const { logInfo, clearLogs } = require('./utils/logger');
const { COMMANDS } = require('./constants');

module.exports.handleCommand = command => {
    getConfig(command).
        then(config => {

            clearLogs();

            processCommand(command, config)
                .then(message => {
                    logInfo(message);
                    process.exit();
                }).catch(err => {
                    logInfo(err);
                    process.exit();
                });
        });
};

function processCommand(command, config) {
    const db = getDriverInstance(config);

    switch (command) {
        case COMMANDS.BACKUP:
            return db.doBackup();
        case COMMANDS.RESTORE:
            return db.doRestore();
        default:
            break;
    }
}