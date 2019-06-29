const EventEmitter = require('events').EventEmitter;
const sqlite3 = require('sqlite3');
const config = require('../config.json');
const db = {};
const cache = {};

config.powermeters.forEach(pm => {
    var dbName = `p${pm.id}`;
    if (db[dbName] != undefined)
        return;

    cache[dbName] = [];
    db[dbName] = new sqlite3.Database(`${__dirname}/../data/${dbName}.db`);
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
var objectKeys = [];
class Database extends EventEmitter {

    insert(dbName, data) {
        var params = {
            $id: Date.now()
        };

        if (objectKeys.length == 0)
            objectKeys = Object.keys(data);

        objectKeys.forEach(key => {
            params['$' + key.toLowerCase().replace(' ', '')] = data[key];
        });

        cache[dbName].push(params);

        // batch insert every 100 records to prevent io
        if (cache[dbName].length > 100) {
            var database = db[dbName];
            database.serialize(function () {
                var stmt = database.prepare(
                    `insert into pm(id,v1,v2,v3,a1,a2,a3,aavg,pf1,pf2,pf3,pavg) values
                    ($id,$v1,$v2,$v3,$a1,$a2,$a3,$aavg,$pf1,$pf2,$pf3,$pfavg);`);

                for (var i = 0; i < cache[dbName].length; i++) {
                    stmt.run(cache[dbName][i]);
                }
                stmt.finalize();
                cache[dbName] = [];
            });

        }
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

        var count = 0;
        var params = {
            $from: parseInt(fromDate),
            $to: parseInt(toDate)
        };

        db[dbName].get(`select count(*) as cnt from pm where id >= $from and id <= $to`, params, (err, row) => {
            if (err != null) {
                this.emit('READ_ERROR', err);
                return;
            }
            if (row == undefined || row.cnt == 0) {
                this.emit('READ_DONE');
                return;
            }
            count = row.cnt;
            db[dbName].each(`select * from pm where id >= $from and id <= $to order by id`, params, (err, row) => {
                if (err != null) {
                    this.emit('READ_ERROR', err);
                }
                else {
                    count--;
                    this.emit('READ_SUCCESS', row);
                    if (count <= 0)
                        this.emit('READ_DONE');
                }
            });
        });

    }

}

module.exports = new Database();