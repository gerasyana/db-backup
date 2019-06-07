function logInfo() {
    if (arguments) {
        Object.values(arguments).forEach(msg => console.log(msg));
    }
}

function clearLogs() {
    console.clear();
}

module.exports = {
    logInfo,
    clearLogs
};