var config = require('../config');
var express = require('express');
var router = express.Router();
var pm = require('../controllers/pm-monitoring');

var result = {
  isSuccess: true,
  message: "",
  data: Object.assign([], config.powermeters)
};

pm.on('readingdone', function (data) {
  result.data = data;
});

router.get('/', function (req, res, next) {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(result));
});

module.exports = router;