const express = require('express');
const router = express.Router();
const config = require('../config.json');

// get the settings page
router.get('/', function (req, res) {
    res.setHeader('Content-Type', 'text/html');
    var data = {
        'activePage': 'settings'
    };
    res.render('settings', data)
});

// save the settings
router.post('/save-config', function (req, res) {
    res.setHeader('Content-Type', 'application/json');

    config.powermeters = req.body;
    var fs = require('fs');
    fs.writeFileSync(`${__dirname}/../config.json`, JSON.stringify(config, null, 4))

    res.end(JSON.stringify({
        success: true
    }));
});

// get app configurations
router.get('/get-config', function (req, res, next) {
    res.setHeader('Content-Type', 'application/json');

    res.end(JSON.stringify({
        powermeters: config.powermeters,
        serverPath: config.serverPath,
        socketPort: config.socketPort,
        monthToKeepData: config.monthToKeepData
    }));
});

module.exports = router;