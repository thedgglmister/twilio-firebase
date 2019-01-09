'use strict';

var express = require('express');
var router = express.Router();
var twilioCapabilityGenerator = require('../lib/twilio-capability-generator');

router.post('/:agentId/', function (req, res) {
  // if (!req.session.agentId) {
  //   res.sendStatus(403);
  // }
  console.log('in token: ', req.params.agentId);
  res.send({
    token: twilioCapabilityGenerator(req.params.agentId),
    agentId: req.params.agentId
  });
});

module.exports = router;
