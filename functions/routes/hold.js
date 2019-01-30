'use strict';

var express = require('express');
var router = express.Router();
var twimlGenerator = require('../lib/twiml-generator');
var twilioCaller = require('../lib/twilio-caller');
var modelUpdater = require('../lib/model');
var url = require('url');


var holdMusicUrl = function(req) {
  var pathName = `/phone/hold/enqueue/holdmusic/`;
  return url.format({
    protocol: 'https',
    host: req.get('host'),
    pathname: pathName
  });
};

var connectTransferUrl = function(req, parentSid, agentId) {
  var pathName = `/phone/transfer/connect/${parentSid}/${agentId}/`;
  return url.format({
    protocol: 'https',
    host: req.get('host'),
    pathname: pathName
  });
};


router.post('/:agentId/', function(req, res) {
  // if (!req.session.agentId) {
  //   res.sendStatus(403);
  // }
  console.log('moving to hold');
  var agentId = req.params.agentId;
  var currentParentSid;

  modelUpdater.findAgentStatus(agentId)
    .then(function(doc) {
      currentParentSid = doc.currentParentSid;
      var callbackUrl = holdMusicUrl(req);
      console.log('callback URL: ', callbackUrl);
      twilioCaller.updateCall(currentParentSid, callbackUrl)
        .then(function() {
          res.sendStatus(200);
        })
        .catch(function(error) {
          console.log(error);
          res.sendStatus(500);
        });
    });
});

router.post('/unhold/:agentId/', function(req, res) {
  // if (!req.session.agentId) {
  //   res.sendStatus(403);
  // }
  console.log('moving to unhold');
  var agentId = req.params.agentId;
  var currentParentSid;

  modelUpdater.findAgentStatus(agentId)
    .then(function(doc) {
      currentParentSid = doc.currentParentSid;
      var callbackUrl = connectTransferUrl(req, currentParentSid, agentId);
      console.log('callback URL: ', callbackUrl);
      twilioCaller.updateCall(currentParentSid, callbackUrl)
        .then(function() {
          res.sendStatus(200);
        })
        .catch(function(e) {
          res.send('The caller ended the call while on hold');
        });
    });
});

router.post('/enqueue/holdmusic', function(req, res) {
  //use action to store if caller hangs up. If they hang up, set agents document to null currentparentId. Then in unhold, check if its null, and if so call agent with twiml saying caller hung up?
  console.log('about to respond with enqueue twiml');
  res.type('text/xml');
  res.send(twimlGenerator.enqueueTwiml().toString());
});

module.exports = router;
