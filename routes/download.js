const express = require('express');
const router = express.Router();
const db = require('../controllers/database');
const moment = require('moment-jalaali');

router.get('/', function (req, res) {
    res.setHeader('Content-disposition', 'attachment; filename=p' + req.query.id + '.csv');
    res.set('Content-Type', 'text/csv');
    try {
        writeToCsv(__dirname, 'p' + req.query.id)
            .then(function () {
                res.status(200).sendFile(__dirname + '/p' + req.query.id + '.csv');
            });
    } catch (ex) {
        res.end('error')
    }
});


function writeToCsv(drivePath, pm) {
    return new Promise(function (res, rej) {
        var path = `${drivePath}/${pm}.csv`;
        path = require('path').normalize(path);
        var fs = require('fs');
        var writer = fs.createWriteStream(path);

        writer.write('Date,Year,Month,Day,Time,V1,V2,V3,A1,A2,A3,A_Average,PF1,PF2,PF3,PF_Average\n');

        db.read(pm);
        var readCounter = 0;
        var writeCounter = 0;
        db.removeAllListeners();
        db.on('READ_ERROR', (err) => {
            rej(err);
        });
        db.on('READ_SUCCESS', (row) => {
            readCounter++;
            var date = moment(row.id);
            writer.write(`${date.format('jYYYY/jMM/jDD HH:mm:ss')},${date.format('jYYYY')},${date.format('jMM')},${date.format('jDD')},${date.format('HH:mm:ss')},${row.v1},${row.v2},${row.v3},${row.a1},${row.a2},${row.a3},${row.aavg},${row.pf1},${row.pf2},${row.pf3},${row.pfavg}\n`,
                () => {
                    writeCounter++;
                });
        });
        db.on('READ_DONE', () => {
            var interval = setInterval(() => {
                if (readCounter == writeCounter) {
                    clearInterval(interval);
                    writer.close();
                    res();
                }
            }, 1000);
        });
    });
}

module.exports = router;