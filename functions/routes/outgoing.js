'use strict';

var express = require('express');
var router = express.Router();
var twimlGenerator = require('../lib/twiml-generator');
// var twilioCaller = require('../lib/twilio-caller');
// var modelUpdater = require('../lib/model');
// var configs = require('../lib/twilio-configs');
// var client = require('twilio')(configs.twilioAccountSid, configs.twilioAuthToken);
var url = require('url');

//returns the URL of the endpoint to hit when the outgoing call is concluded.
var outgoingActionUrl = function(req, fromAgentId) {
  var pathname = '/phone/action/outgoing';
  return url.format({
    protocol: 'https',
    host: req.host,
    pathname: pathname,
    query: {
      fromAgentId: fromAgentId,
    },
  });
};

router.post('/', function(req, res) {
  console.log('in outgoing');
  console.log('callSID: ', req.body.CallSid);
  console.log('toNumber: ', req.body.toNumber);
  console.log(req.body);

  var toNumber = req.body.toNumber;
  var fromAgentId = req.body.fromAgentId;
  //var parentSid = req.body.CallSid;

  let actionUrl = outgoingActionUrl(req, fromAgentId);

  let dialNumberTwiml = twimlGenerator.dialNumberTwiml({
    fromAgentId: fromAgentId,
    toNumber: toNumber,
    action: actionUrl,
  });

  res.type('text/xml');
  res.send(dialNumberTwiml);
});


// router.post('/answered/:fromAgentId', function(req, res) {
//   console.log("CALLBACK WORKED");
//   console.log('callSID: ', req.body.CallSid);
//   console.log('parentCallSID: ', req.body.ParentCallSid);
//   let fromAgentId = req.params.fromAgentId;
//   let childSid = req.body.CallSid;

//   modelUpdater.updateCurrentParentSid(fromAgentId, childSid, false)
//     .then(function() {
//       res.sendStatus(200);
//     });
//});





module.exports = router;
