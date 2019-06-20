const EventEmitter = require('events').EventEmitter;
const sqlite3 = require('sqlite3');
const config = require('../config.json');
const db = {};

config.powermeters.forEach(pm => {
    var dbName = `p${pm.id}`;
    if (db[dbName] != undefined)
        return;

    db[dbName] = new sqlite3.Database('../data/' + dbName + '.db');
    db[dbName].run(`create table if not exists pm(
        id   numeric primary key,
        v1   numeric,
        v2   numeric,
        v3   numeric,
        a1   numeric,
        a2   numeric,
        a3   numeric,
        aavg numeric,
        pf1  numeric,
        pf2  numeric,
        pf3  numeric,
        pavg numeric);`, (err) => { });
});

class Database extends EventEmitter {

    insert(dbName, data) {
        var params = {
            $id: Date.now()
        };

        Object.keys().forEach(key => {
            params['$' + key.toLowerCase().replace(' ', '')] = data[key];
        });

        db[dbName].run(
            `insert into pm(id,v1,v2,v3,a1,a2,a3,aavg,pf1,pf2,pf3,pavg) values
                ($id,$v1,$v2,$v3,$a1,$a2,$a3,$aavg,$pf1,$pf2,$pf3,$pfavg);`,
            params,
            err => {
                if (err != null) {
                    this.emit('INSERT_ERROR', err);
                }
                else {
                    this.emit('INSERT_SUCCESS', params.$id);
                }
            });
    }

    /**
     * delete records from all collections older than `fromTime` value
     * @param {number} fromTime
     */
    delete(dbName, fromTime) {
        var params = {
            $id: fromTime
        };

        db[dbName].run(`delete from pm where id <= $id;`,
            params,
            err => {
                if (err != null)
                    this.emit('DELETE_ERROR');
                else
                    this.emit('DELETE_SUCCESS');
                db[dbName].run('vacuum;', err => { });
            });
    }

    /**
     * get a cursor of all records of the given `collectionName` in the give date range.
     * @param {string} dbName 
     * @param {number} fromDate 
     * @param {number} toDate 
     */
    read(dbName, fromDate, toDate) {
        if (fromDate == undefined)
            fromDate = 0;
        if (toDate == undefined)
            toDate = 9999999999999;

        db[dbName].each(`select * from pm where id between $from and $to`, {
            $from: fromDate,
            $to: toDate
        }, (err, row) => {
            if (err != null) {
            }
            else {
                this.emit('READ_SUCCESS', row);
            }
        });
    }

}

module.exports = new Database();