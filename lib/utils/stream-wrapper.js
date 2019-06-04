const logger = require('../logger');

module.exports.wrapBackupStream = (readStream, name, dataReadCallback) => {
    const spinner = logger.getSpinner(`Backing up ${name} ...`);
    spinner.start();
    
    readStream
        .on('error', error => {
            spinner.stop();
            logger.logInfo(`Error while backing up ${name}`, error.message);
        })
        .on('end', () => {
            spinner.stop();
            logger.goToNextLine();
            dataReadCallback();
        });
    return readStream;
};

module.exports.wrapRestoreStream = (readStream, name) => {
    const spinner = logger.getSpinner(`Restoring ${name} ...`);
    spinner.start();

    readStream
        .on('error', error => {
            spinner.stop();
            logger.logInfo(`Error while reading ${name}`, error.message);
        });
    return { readStream, spinner };
};


