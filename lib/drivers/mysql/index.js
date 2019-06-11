const mysql = require('mysql');
const fs = require('fs');
const DriverBase = require('../driver-base');

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

        const doBackupPromise = new Promise((resolve, reject) => {
            this.connection.connect(async () => {
                const tables = await this._getTables();

                if (tables.length === 0) {
                    reject('Database is empty');
                    return;
                }

                const folderName = `${this.path}/${new Date().getTime()}_${this.database}`;
                fs.mkdirSync(folderName);

                await this.__backupTables(folderName, tables);
                resolve();
            });
        });

        return doBackupPromise;
    }

    doRestore() {
        super.doRestore();
    }

    async __backupTables(folderName, tables) {
        fs.mkdirSync(`${folderName}/schemas/`);
        fs.mkdirSync(`${folderName}/data/`);

        while (tables.length !== 0) {
            const table = tables.shift();
            await this._backupTableSchema(table);
            await this._backupTableData(table);
        }
    }

    async _backupTableSchema(folderName, table) {
        const stream = fs.createWriteStream(`${folderName}/schemas/${table}.sql`);

        /*Schema : 
           primary keys — unique identifiers such as the ISBN which apply to a single record
           indexes — commonly queried fields indexed to aid quick searching
           relationships — logical links between data fields
           functionality such as triggers and stored procedures.
       */

        const schema = await this._getTableScheme(table);
        stream.write(schema);
    }

    async _backupTableData(folderName, table) {
        const stream = fs.createWriteStream(`${folderName}/data/${table}.sql`);
        const columns = await this._getTableColumns(table);

        this.connection.query(`SELECT ${columns.join(',')} FROM ${table}`).stream()
            .on('data', data => {
                const values = Object.values(data).map(value => `${mysql.escape(value)}`);
                const query = `INSERT INTO ${table}(${columns.join(',')}) VALUES (${values});\n`;
                stream.write(query);
            });
    }

    async _getTables() {
        return new Promise((resolve, reject) => {
            this.connection.query(`SHOW TABLES IN ${this.database}`, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(Object.values(rows).map(row => row[`Tables_in_${this.database}`]));
                }
            });
        });
    }

    async _getTableColumns(table) {
        return new Promise((resolve, reject) => {
            this.connection.query(`SHOW COLUMNS FROM ${this.database}.${table}`, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map(row => row['Field']));
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
                    resolve(rows[0]['Create Table']);
                }
            });
        });
    }
}

module.exports = MySqlDriver;