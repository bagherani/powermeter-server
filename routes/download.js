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
        console.log('error in writing to file', ex);
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

        var rows = db.getRegister(pm);
        var readCounter = 0;
        var writeCounter = 0;
        rows.forEach(function (row) {
            readCounter++;

            var date = moment(row['_id']);

            writer.write(`${date.format('jYYYY/jMM/jDD HH:mm:ss')},${date.format('jYYYY')},${date.format('jMM')},${date.format('jDD')},${date.format('HH:mm:ss')},${row['3926']},${row['3940']},${row['3954']},${row['3928']},${row['3942']},${row['3956']},${row['3912']},${row['3922']},${row['3936']},${row['3950']},${row['3906']}\n`,
                function () {
                    writeCounter++;
                });
        }, function (er) {
            if (er)
                rej(er);

            rows.close();

            var interval = setInterval(function () {
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