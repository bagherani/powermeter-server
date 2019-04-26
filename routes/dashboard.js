var express = require('express');
var router = express.Router();
var pm = require('../controllers/pm-monitoring');
var db = require('../controllers/database');
var moment = require('moment-jalaali');
var config = require('../config.json');

var io = require('socket.io').listen(config.socketPort);

io.on('connection', function (socket) {
    pm.on('readingdone', (data) => {
        socket.emit('message', data);
    });
});

router.get('/', function (req, res, next) {
    res.setHeader('Content-Type', 'text/html');
    var data = {
        'activePage': ''
    };
    res.render('dashboard', data)
});

router.post('/download', function (req, res, next) {
    res.setHeader('Content-Type', 'text/plain');
    try {
        writeToCsv(req.body.path, 'p1')
            .then(function () {

                writeToCsv(req.body.path, 'p2')
                    .then(function () {
                        res.end('done');
                    })
            });
    } catch (ex) {
        console.log('error in writing to file', ex);
        res.end('error')
    }
});

router.get('/download', function (req, res, next) {
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

router.get('/settings', function (req, res, next) {
    res.setHeader('Content-Type', 'application/json');

    res.end(
        JSON.stringify({
            powermeters: config.powermeters,
            serverPath: config.serverPath,
            socketPort: config.socketPort
        }));
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