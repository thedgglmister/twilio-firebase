'use strict';

var express = require('express');
var router = express.Router();
var twilioCaller = require('../lib/twilio-caller');

router.post('/', function(req, res) {
  var number = req.query.number;
  twilioCaller.lookupCall(number)
    .then(function(numberData) {
      res.send(numberData)
    })
    .catch(function(error) {
      console.log(error);
      res.sendStatus(500);
    });
});

module.exports = router;
