const { logInfo } = require('../../utils/logger');
const Spinner = require('../../utils/spinner');

module.exports.wrapBackupStream = (readStream, name) => {
    const spinner = new Spinner(`Backing up ${name} ...`);
    spinner.run();

    readStream
        .on('error', error => {
            spinner.stop();
            logInfo(`Error while backing up ${name}`, error.message);
        })
        .on('end', () => {
            spinner.stopAndGoToNewLine();
        });
    return readStream;
};

