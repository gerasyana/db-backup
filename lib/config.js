const { getConnectionUri } = require('./configs/connection-uri');
const { getBackupConfig } = require('./configs/backup-config');
const { getRestoreConfig } = require('./configs/restore-config');
const { COMMANDS } = require('./constants');

async function getBackupOptions() {
    let config = {};

    const dbConfig = await getConnectionUri();
    config = Object.assign(config, dbConfig);

    const backupConfig = await getBackupConfig(config);
    config = Object.assign(config, backupConfig);

    return config;
}

async function getRestoreOptions() {
    let config = {};

    const dbConfig = await getConnectionUri();
    config = Object.assign(config, dbConfig);

    const backupConfig = await getRestoreConfig(config);
    config = Object.assign(config, backupConfig);

    return config;
}

module.exports.getConfig = command => {
    switch (command) {
        case COMMANDS.BACKUP:
            return getBackupOptions();
        case COMMANDS.RESTORE:
            return getRestoreOptions();
        default:
            break;
    }
};

