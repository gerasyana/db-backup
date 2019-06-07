const { SUPPORTED_PROTOROLS_BY_DRIVERS } = require('./constants');

function getDriverInstance(config) {
    const { driver } = config;
    if (isDriverSupported(driver)) {
        const Driver = require(`./drivers/${driver}/index.js`);
        return new Driver(config);
    }
    return;
}

function isDriverSupported(driver) {
    return Object.keys(SUPPORTED_PROTOROLS_BY_DRIVERS).includes(driver);
}

function getDriverByProtocol(protocol) {
    return Object.keys(SUPPORTED_PROTOROLS_BY_DRIVERS)
        .find(key => {
            const protocols = SUPPORTED_PROTOROLS_BY_DRIVERS[key];
            return protocols ? protocols.includes(protocol) : false;
        });
}

function getSupportedDrivers() {
    return Object.keys(SUPPORTED_PROTOROLS_BY_DRIVERS);
}

module.exports = {
    getDriverInstance,
    isDriverSupported,
    getDriverByProtocol,
    getSupportedDrivers
};