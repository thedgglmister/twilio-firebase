'use strict';

var express = require('express');
var router = express.Router();
var twilioCaller = require('../lib/twilio-caller');

router.post('/:number', function(req, res) {
  // if (!req.session.agentId) {
  //   res.sendStatus(403);
  // }

  var number = req.params.number;
  twilioCaller.lookupCall(number)
    .then(function(numberData) {
      res.send(numberData)
    })
    .catch(function(error) {
      res.send(null);
      console.log(error.message);
    });
});

module.exports = router;
