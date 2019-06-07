const connectionUri = [{
    type: 'input',
    name: 'uri',
    message: 'Set connection uri',
    validate: uri => {
        if (!uri) {
            return 'Connection uri is not set';
        }
        return true;
    }
}];

const fullBackup = [
    {
        type: 'confirm',
        name: 'fullBackup',
        message: 'Make full database backup?',
        default: false
    }
];

const pathToSaveBackup = [
    {
        type: 'input',
        name: 'path',
        message: 'Set absolute path to save backup folder',
        default: process.cwd(),
        validate: path => {
            if (!path) {
                return 'Path is not set';
            }
            return true;
        }
    }
];

const pathToBackupFolder = [
    {
        type: 'input',
        name: 'path',
        message: 'Set absolute path to backup folder',
        validate: path => {
            if (!path) {
                return 'Path is not set';
            }
            return true;
        }
    }
];

function getFormats(choices) {
    return {
        type: 'list',
        name: 'format',
        message: 'Select file format',
        choices
    };
}

module.exports = {
    connectionUri,
    fullBackup,
    pathToSaveBackup,
    getFormats,
    pathToBackupFolder
};