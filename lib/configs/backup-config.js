const inquirer = require('inquirer');
const fs = require('fs');
const { logInfo } = require('../utils/logger');
const { getDataFormatsByDriver } = require('../utils/data-formats');
const { getFormats, pathToSaveBackup } = require('../questions');

function getDataFormats(dbConfig) {
    const formats = getDataFormatsByDriver(dbConfig.driver);
    return inquirer.prompt(getFormats(formats));
}

function getPathToSaveBackup() {
    return new Promise(resolve => {
        inquirer.prompt(pathToSaveBackup)
            .then(response => {
                if (response.path === process.cwd()) {
                    resolve(response);
                    return;
                }

                logInfo('Checking path ...');

                if (fs.existsSync(response.path)) {
                    logInfo('Path is valid');
                    resolve(response);
                } else {
                    logInfo('Path is invalid. Please check spelling.');
                    resolve();
                }
            });
    });
}

module.exports.getBackupConfig = async dbConfig => {
    let config = Object.assign(dbConfig, {});

    const dataFormat = await getDataFormats(dbConfig);
    config = Object.assign(config, dataFormat);

    do {
        const uri = await getPathToSaveBackup(config);
        config = Object.assign(config, uri);
    } while (!Object.hasOwnProperty.call(config, 'path'));

    return config;
};
