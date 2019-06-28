const express = require('express');
const router = express.Router();
const pm = require('../controllers/pm-monitoring');
const config = require('../config.json');
var db = require('../controllers/database');
const moment = require('moment');


const io = require('socket.io').listen(config.socketPort);

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

router.get('/server-is-alive', function (req, res, next) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
        success: true
    }));
});

router.get('/get-register-history', function (req, res, next) {
    var time = req.query.time;
    var pm = req.query.pm;
    var register = req.query.register.replace(' ', '').toLowerCase();

    var result = [];
    var hasError = false;

    db.removeAllListeners();
    db.on('READ_ERROR', (err) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            success: false,
            error: err,
            data: []
        }));
        hasError = true;
    });
    db.on('READ_SUCCESS', (row) => {
        var date = moment(row.id);
        result.push({
            time: `${date.format('jYYYY/jMM/jDD HH:mm:ss')}`,
            value: row[register]
        })
    });

    db.on('READ_DONE', () => {
        if (hasError)
            return;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            success: true,
            data: result
        }));
    });

    db.read(`p${pm}`, time)
});

module.exports = router;