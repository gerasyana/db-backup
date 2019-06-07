const mysql = require('mysql');
const fs = require('fs');
const DriverBase = require('../driver-base');
const { logInfo } = require('../../utils/logger');

class MySqlDriver extends DriverBase {

    constructor(config) {
        super(config);
        this.connection = mysql.createConnection(this.uri);
    }

    validateConnection() {
        super.validateConnection();

        return new Promise((resolve, reject) => this.connection.connect(err => { err ? reject(err) : resolve(); }));
    }

    doBackup() {
        super.doBackup();
    }

    doRestore() {
        super.doRestore();
    }

    async _backupTablesSchemas() {
        const tables = await this._getTables();

        if (!tables) {
            logInfo('Database is empty');
            return;
        }

        const folderName = `${this.path}/${new Date().getTime()}_${this.database}`;
        fs.mkdirSync(folderName);

        const stream = fs.createWriteStream();

        while (tables.length !== 0) {
            const schema = await this._getTableScheme(tables.shift());
            stream.write(schema.join('\n'));
        }
    }

    async _getTables() {
        return new Promise((resolve, reject) => {
            this.connection.query(`SHOW TABLES IN ${this.database}`, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async _getTableScheme(table) {
        return new Promise((resolve, reject) => {
            this.connection.query(`SHOW CREATE TABLE ${table}`, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

}

module.exports = MySqlDriver;