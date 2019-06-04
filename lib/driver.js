
const fs = require('fs');
const path = require('path');
const { DRIVERS } = require('./constants');

function getDriverInstance(config) {
    const { driver } = config;
    if (isDriverSupported(driver)) {
        const Driver = require(`./drivers/${driver}.js`);
        return new Driver(config);
    }
    return;
}

function isDriverSupported(driver) {
    return fs.existsSync(path.join(__dirname, `./drivers/${driver}.js`));
}

function getDriverName(protocol) {
    if (protocol.startsWith(DRIVERS.MONGODB)) {
        return DRIVERS.MONGODB;
    }
    return;
}

module.exports = {
    getDriverInstance,
    isDriverSupported,
    getDriverName
};