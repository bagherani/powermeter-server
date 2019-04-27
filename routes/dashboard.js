const express = require('express');
const router = express.Router();
const pm = require('../controllers/pm-monitoring');
const db = require('../controllers/database');
const moment = require('moment-jalaali');
const config = require('../config.json');

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

module.exports = router;