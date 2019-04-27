const express = require('express');
const router = express.Router();
const config = require('../config.json')
// get the settings page
router.get('/', function (req, res) {
    res.setHeader('Content-Type', 'text/html');
    var data = {
        'activePage': 'settings'
    };
    res.render('settings', data)
});

// save the settings
router.post('/', function (req, res) {
    res.end();
});

router.get('/get-config', function (req, res, next) {
    res.setHeader('Content-Type', 'application/json');

    res.end(
        JSON.stringify({
            powermeters: config.powermeters,
            serverPath: config.serverPath,
            socketPort: config.socketPort
        }));
});

module.exports = router;