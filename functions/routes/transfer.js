'use strict';

var express = require('express');
var router = express.Router();
var twimlGenerator = require('../lib/twiml-generator');
var twilioCaller = require('../lib/twilio-caller');
var modelUpdater = require('../lib/model');
var url = require('url');


var transferCallbackUrl = function(req) {
  var pathname = '/phone/transfer/callback';
  return url.format({
    protocol: 'https',
    host: req.host,
    pathname: pathname,
    query: {
      toAgentId: req.query.toAgentId,
    },
  });
};

var transferActionUrl = function(req) {
  var pathname = '/phone/action/transfer';
  return url.format({
    protocol: 'https',
    host: req.host,
    pathname: pathname,
    query: {
      agentId: req.query.toAgentId,
    },
  });
};


router.post('/', function(req, res) {
  console.log('in transfer');
  console.log('fromAgent: ', req.query.fromAgentId);
  console.log('toAgent: ', req.query.toAgentId);

  let fromAgentId = req.query.fromAgentId;

  modelUpdater.findAgentStatus(fromAgentId)
    .then(function(doc) {
      let callSid = doc.currentParentSid ? doc.currentParentSid : doc.holdSid;
      var callbackUrl = transferCallbackUrl(req);
      twilioCaller.updateCall(callSid, callbackUrl)
        .then(function() {
          res.sendStatus(200);
        })
        .catch(function(error) {
          console.log(error);
          res.sendStatus(500);
        });
    });
});


router.post('/callback', function(req, res) {
  console.log('in transfer callback');
  console.log('toAgentId: ', req.query.toAgentId);

  let toAgentId = req.query.toAgentId;

  let actionUrl = transferActionUrl(req);
  let transferTwiml = twimlGenerator.transferTwiml({
    agentIds: [toAgentId],
    timeout: 10,
    action: actionUrl,
  });

  res.type('text/xml');
  res.send(transferTwiml);
});

module.exports = router;
