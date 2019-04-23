'use strict';

var express = require('express');
var router = express.Router();
var twimlGenerator = require('../lib/twiml-generator');
var twilioCaller = require('../lib/twilio-caller');
var modelUpdater = require('../lib/model');
var url = require('url');

//returns the URL of the endpoint to hit when a call should be sent to the holdingQueue.
var holdCallbackUrl = function(req, holdSid, name, number) {
  var pathname = '/phone/hold/callback';
  return url.format({
    protocol: 'https',
    host: req.host,
    pathname: pathname,
    query: {
      agentId: req.query.agentId,
      holdSid: holdSid,
      name: name,
      number: number,
    }
  });
};

//returns the URL of the endpoint to hit when a call is removed from the holdingQueue.
var enqueueActionUrl = function(req) {
  var pathname = '/phone/action/enqueue';
  return url.format({
    protocol: 'https',
    host: req.host,
    pathname: pathname,
    query: {
      agentId: req.query.agentId,
    },
  });
};

//returns the URL of the endpoint to hit when an a call should be transfered.
var transferCallbackUrl = function(req, name, number) {
  var pathname = '/phone/transfer/callback';
  return url.format({
    protocol: 'https',
    host: req.host,
    pathname: pathname,
    query: {
      toAgentId: req.query.agentId,
      name: name,
      number: number,
    },
  });
};


//endpoint hit by client when wanting to move call to hold. updates call to hit hold callback url.
router.post('/', function(req, res) {
  console.log('moving to hold');
  console.log('agentId: ', req.query.agentId);

  var agentId = req.query.agentId;

  modelUpdater.findAgentStatus(agentId)
    .then(function(doc) {
      console.log('123321');
      let callSid = doc.currentParentSid;
      let name = doc.currentCallName;
      let number = doc.currentCallNumber;
      // modelUpdater.updateHoldSid(agentId, callSid)
      //   .then(function() {
          var callbackUrl = holdCallbackUrl(req, callSid, name, number);
          twilioCaller.updateCall(callSid, callbackUrl)
            .then(function() {
              res.sendStatus(200);
            })
        // })
    })
    .catch(function(error) {
      console.log(error);
      res.sendStatus(500);
    });
});


//endpoint hit by client when wanting to move call off hold. updates call to hit transfer callback url.
router.post('/unhold', function(req, res) {
  console.log('in unhold');
  var agentId = req.query.agentId;

  modelUpdater.findAgentStatus(agentId)
    .then(function(doc) {
      let callSid = doc.holdSid;
      let name = doc.holdName;
      let number = doc.holdNumber;

      var callbackUrl = transferCallbackUrl(req, name, number);
      twilioCaller.updateCall(callSid, callbackUrl)
        .then(function() {
          res.sendStatus(200);
        })
        .catch(function(e) {
          console.log(e);
          res.sendStatus(500);
        });
    });
});



// router.post('/leave/callback/', function(req, res) {
//   console.log('in leave callback');

//   res.type('text/xml');
//   res.send(twimlGenerator.leaveTwiml().toString());
// });


//sends twiml to actually put the call in holdingQueue. updates holdSid in database. sets action to the enqueue action, which removes holdSid from database.
router.post('/callback', function(req, res) {
  //use action to store if caller hangs up. If they hang up, set agents document to null currentparentId. Then in unhold, check if its null, and if so call agent with twiml saying caller hung up?
  console.log('in hold callback');
  console.log('agentId: ', req.query.agentId);
  console.log('holdSid: ', req.query.holdSid);

  let agentId = req.query.agentId;
  let holdSid = req.query.holdSid;
  let name = req.query.name;
  let number = req.query.number;


  modelUpdater.updateHoldSid(agentId, holdSid, name, number)
    .then(() => {
      let actionUrl = enqueueActionUrl(req);
      let enqueueTwiml = twimlGenerator.enqueueTwiml({
        timeout: 15,
        action: actionUrl,
      });
      res.type('text/xml');
      res.send(enqueueTwiml);
    })
    .catch((e) => {
      console.log(e);
      res.sendStatus(500);
    });
});

module.exports = router;
