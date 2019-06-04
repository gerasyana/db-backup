const inquirer = require('inquirer');
const fs = require('fs');
const { logInfo } = require('../logger');
const { pathToBackupFolder } = require('../questions');

function getPathToBackupFolder() {
    return new Promise(resolve => {
        inquirer.prompt(pathToBackupFolder)
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

module.exports.getRestoreConfig = dbConfig => {
    return new Promise(async resolve => {
        let config = Object.assign(dbConfig, {});

        do {
            const uri = await getPathToBackupFolder(config);
            config = Object.assign(config, uri);
        } while (!Object.hasOwnProperty.call(config, 'path'));

        resolve(config);
    });
};
