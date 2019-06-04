const yargs = require('yargs');
const { COMMANDS } = require('./lib/constants');
const { handleCommand } = require('./lib/command');

yargs
    .command({
        command: COMMANDS.BACKUP,
        desc: 'Back up database',
        handler: () => handleCommand(COMMANDS.BACKUP)
    }).
    command({
        command: COMMANDS.RESTORE,
        desc: 'Restore database from backup',
        handler: () => handleCommand(COMMANDS.RESTORE)
    }).demandCommand(1, 'You need at least one command before moving on')
    .help()
    .argv;

