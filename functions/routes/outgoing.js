'use strict';

var express = require('express');
var router = express.Router();
var twimlGenerator = require('../lib/twiml-generator');
var twilioCaller = require('../lib/twilio-caller');
var modelUpdater = require('../lib/model');
var configs = require('../lib/twilio-configs');
var client = require('twilio')(configs.twilioAccountSid, configs.twilioAuthToken);

router.post('/', function(req, res) {
  console.log('outgoing call');
  console.log('callSID: ', req.body.CallSid);
  console.log('toNumber: ', req.body.toNumber);
  var toNumber = req.body.toNumber;
  var fromAgentId = req.body.fromAgentId;
  var host = req.get('host');
  var parentSid = req.body.CallSid;

  res.type('text/xml');
  res.send(twimlGenerator.callNumberTwiml(fromAgentId, toNumber, host).toString());
});


router.post('/answered/:fromAgentId', function(req, res) {
  console.log("CALLBACK WORKED");
  console.log('callSID: ', req.body.CallSid);
  console.log('parentCallSID: ', req.body.ParentCallSid);
  let fromAgentId = req.params.fromAgentId;
  let childSid = req.body.CallSid;

  modelUpdater.updateCurrentParentSid(fromAgentId, childSid, false)
    .then(function() {
      res.sendStatus(200);
    });
});



module.exports = router;