const inquirer = require('inquirer');
const parser = require('connection-string');
const { logInfo } = require('../utils/logger');
const { connectionUri } = require('../questions');
const driver = require('../driver');

function parseConnectionUri(uri) {
    let obj;

    try {
        obj = parser(uri.trim());
    } catch (ex) {
        logInfo('Invalid connection uri');
    }

    if (!obj.protocol) {
        return;
    }

    const config = {
        protocol: obj.protocol,
        driver: driver.getDriverByProtocol(obj.protocol),
        uri: encodeURI(uri)
    };

    if (obj.path) {
        config.database = obj.path[0];
    }

    return config;
}

function validateConnectionUri(config) {
    if (!config.driver) {
        return { error: `Can't recognize database driver. ${config.protocol} protocol is invalid` };
    }

    if (!Object.hasOwnProperty.call(config, 'database')) {
        return { error: 'Connection uri doesn\'t contain database name.' };
    }
}

function checkConnection(config) {
    const db = driver.getDriverInstance(config);
    return db.validateConnection();
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
                    logInfo(result.error);
                    resolve();
                    return;
                }

                checkConnection(config, resolve)
                    .then(() => resolve(config))
                    .catch(err => {
                        logInfo(`Can't connect to server. ${err.message}`);
                        resolve();
                    });
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
