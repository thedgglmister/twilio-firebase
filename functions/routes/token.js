'use strict';

var express = require('express');
var router = express.Router();
var twilioCapabilityGenerator = require('../lib/twilio-capability-generator');

router.post('/', function (req, res) {
  console.log('in token');
  console.log('agentId:', req.query.agentId);
  res.send({
    token: twilioCapabilityGenerator(req.query.agentId),
    //agentId: req.query.agentId
  });
});

module.exports = router;
