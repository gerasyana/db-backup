const inquirer = require('inquirer');
const parser = require('connection-string');
const { logInfo } = require('../logger');
const { connectionUri } = require('../questions');
const driverUtil = require('../driver');

function parseConnectionUri(uri) {
    const obj = parser(uri.trim());
    if (!obj.protocol) {
        return;
    }
    const config = {
        driver: driverUtil.getDriverName(obj.protocol),
        uri: encodeURI(uri)
    };

    if (obj.path) {
        config.database = obj.path[0];
    }
    return config;
}

function validateConnectionUri(config) {
    if (!driverUtil.isDriverSupported(config.driver)) {
        return { error: `${config.driver} database is not supported` };
    }

    if (!Object.hasOwnProperty.call(config, 'database')) {
        return { error: 'Connection uri doesn\'t contain database name.' };
    }
}

function checkConnection(config, resolve) {
    const db = driverUtil.getDriverInstance(config);
    db.validateConnection()
        .then(() => {
            db.validateDatabase()
                .then(() => resolve(config))
                .catch(() => {
                    logInfo('Database doesn\'t exist. Please check database name');
                    resolve();
                });
        })
        .catch(err => {
            logInfo(`Can't connect to server. ${err.message}`);
            resolve();
        });
}

function getConnectionUriParsed() {
    return new Promise(resolve => {
        inquirer.prompt(connectionUri)
            .then(response => {
                const config = parseConnectionUri(response.uri);

                if (!config) {
                    logInfo('Invalid connection uri');
                    resolve();
                    return;
                }

                const result = validateConnectionUri(config);

                if (typeof result !== 'undefined') {
                    logInfo(`Invalid connection uri. ${result.error}`);
                    resolve();
                    return;
                }
                checkConnection(config, resolve);
            });
    });
}

module.exports.getConnectionUri = async () => {
    let connectionUriParsed = {};

    do {
        connectionUriParsed = await getConnectionUriParsed();
    } while (typeof connectionUriParsed === 'undefined');

    return connectionUriParsed;
};
