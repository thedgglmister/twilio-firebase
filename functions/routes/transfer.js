'use strict';

var express = require('express');
var router = express.Router();
var twimlGenerator = require('../lib/twiml-generator');
var twilioCaller = require('../lib/twilio-caller');
var modelUpdater = require('../lib/model');
var url = require('url');


var transferCallbackUrl = function(req, name, number) {
  var pathname = '/phone/transfer/callback';
  return url.format({
    protocol: 'https',
    host: req.host,
    pathname: pathname,
    query: {
      toAgentId: req.query.toAgentId,
      origToAgentId: req.query.origToAgentId,
      name: name,
      number: number,
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
      origAgentId: req.query.origToAgentId,
    },
  });
};


router.post('/', function(req, res) {
  console.log('in transfer');
  console.log('fromAgent: ', req.query.fromAgentId);
  console.log('toAgent: ', req.query.toAgentId);
  console.log('origToAgent: ', req.query.origToAgentId);


  let fromAgentId = req.query.fromAgentId;

  modelUpdater.findAgentStatus(fromAgentId)
    .then(function(doc) {

      let callSid;
      let name;
      let number;

      if (doc.currentParentSid) {
        callSid = doc.currentParentSid;
        name = doc.currentCallName;
        number =  doc.currentCallNumber;
      }
      else if (doc.incomingCallSid) {
        callSid = doc.incomingCallSid;
        name = doc.incomingCallName;
        number =  doc.incomingCallNumber;
      }
      else if (doc.holdSid) {
        callSid = doc.holdSid;
        name = doc.holdName;
        number =  doc.holdNumber;
      }
      else {
        res.sendStatus(200);
      }

      var callbackUrl = transferCallbackUrl(req, name, number);
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
  let name = req.query.name;
  let number = req.query.number;


  let actionUrl = transferActionUrl(req);
  let options = {
    agentIds: [toAgentId],
    timeout: 10,
    action: actionUrl,
    name: name,
    number: number,
  };
  let transferTwiml
  if (toAgentId.startsWith('sip:')) {
    transferTwiml = twimlGenerator.sipTransferTwiml(options);
  }
  else {
    transferTwiml = twimlGenerator.transferTwiml(options);
  }

  res.type('text/xml');
  res.send(transferTwiml);
});

module.exports = router;
