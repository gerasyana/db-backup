const { Spinner } = require('cli-spinner');

function logInfo() {
    if (arguments) {
        Object.values(arguments).forEach(msg => console.log(msg));
    }
}

function clearLogs() {
    console.clear();
}

function goToNextLine() {
    console.log();
}

function getSpinner(message) {
    const spinner = new Spinner(`%s ${message}`);
    spinner.setSpinnerString('⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏');
    return spinner;
}

module.exports = {
    logInfo,
    clearLogs,
    getSpinner,
    goToNextLine
};