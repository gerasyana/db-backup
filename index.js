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


/*
const Promise = require('bluebird');
const { MongoClient } = require('mongodb');

Promise.promisifyAll(MongoClient);

MongoClient.connect('mongodb://admin:YanaGeras12061996@ds149706.mlab.com:49706/paper-games-test', { useNewUrlParser: true }, (err, client) => {
    const db = client.db('paper-games-test');
    const collection = db.collection('test2');

    let docs = [];
    for (let i = 500000; i < 1000000; i++) {
        docs.push({
            name: "name",
            firstName: 'firstName',
            age: 18,
            increment: i,
            date: new Date(),
            text: null,
            text2: undefined
        });
    }
    collection.insertMany(docs, { w: 1 });
});*/

/*
const { getDriverInstance } = require('./lib/driver');
const db = getDriverInstance({
    driver: 'mongodb',
    path: __dirname,
    uri: 'mongodb://admin:YanaGeras12061996@ds217976.mlab.com:17976/paper-games',
    database: 'paper-games',
    //uri: 'mongodb://admin:YanaGeras12061996@ds217976.mlab.com:17976/paper-games',
    //database: 'paper-games',
    format: 'json'
});

db.doBackup();*/

/*
const { getDriverInstance } = require('./lib/driver');
const db = getDriverInstance({
    driver: 'mongodb',
    uri: 'mongodb://admin:YanaGeras12061996@ds151994.mlab.com:51994/test-migrate',
    database: 'test-migrate',
    path: '/Users/yanagerasimchuk/self-education/projects/db-data-manupulate/1559630473194_paper-games-test/'
});
db.doRestore();*/


