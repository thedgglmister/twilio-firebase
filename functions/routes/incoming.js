'use strict';

var express = require('express');
var router = express.Router();
var url = require('url');
var agentIdGroups = require('../lib/agent-ids');
var twimlGenerator = require('../lib/twiml-generator');


//returns the URL of the endpoint to hit when an initial incoming call concludes.
var huntActionUrl = function(req) {
  var pathname = '/phone/action/hunt';
  return url.format({
    protocol: 'https',
    host: req.host,
    pathname: pathname,
    query: {
      agentIdGroupIndex: 0,
    },
  });
}

//the endpoint hit by twilio when a new call comes in. forwards call to agents in group0. sets the action to the hunt action, which either keeps hunting, sends to voicemail, or sends to conference.
router.post('/', function(req, res) {
  console.log('in incoming');
  console.log('callSid: ', req.body.CallSid);

  var group0 = agentIdGroups[0];
  let actionUrl = huntActionUrl(req);
  let transferTwiml = twimlGenerator.transferTwiml({
    agentIds: group0,
    timeout: 10,
    action: actionUrl,
  })

  res.type('text/xml');
  res.send(transferTwiml);
});

module.exports = router;
