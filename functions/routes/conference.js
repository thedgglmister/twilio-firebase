'use strict';

var express = require('express');
var router = express.Router();
var twimlGenerator = require('../lib/twiml-generator');
var modelUpdater = require('../lib/model');
var url = require('url');
var twilioCaller = require('../lib/twilio-caller');


//URL can be edited to an endpoint to respond with custom twiml
var AGENT_WAIT_URL = 'http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical';


var connectConferenceUrl = function(req, parentSid) {
  var pathName = `/phone/conference/connect/${parentSid}/`;

  return url.format({
    protocol: 'https',
    host: req.get('host'),
    pathname: pathName
  });
};


router.post('/connect/:parentSid', function(req, res) {
  var parentSid = req.params.parentSid;

  res.type('text/xml');
  res.send(twimlGenerator.connectConferenceTwiml({
    callSid: parentSid,
    waitUrl: AGENT_WAIT_URL,
    startConferenceOnEnter: true, //?
    endConferenceOnExit: false, //?
  }).toString());
});


router.post('/move/:agentId/:childSid/', function(req, res) {
  // if (!req.session.agentId) {
  //   res.sendStatus(403);
  // }

  var agentId = req.params.agentId;
  var childSid = req.params.childSid;
  var currentParentSid;

  modelUpdater.findAgentStatus(agentId)
    .then(function(doc) {
      currentParentSid = doc.currentParentSid;
      return modelUpdater.updateAgentStatus([agentId], currentParentSid, true);
    })
    .then(function() {
      var callbackUrl = connectConferenceUrl(req, currentParentSid);
      twilioCaller.updateCall(childSid, callbackUrl);
    })
    .then(function() {
      res.sendStatus(200);
    });
});


router.post('/invite/:fromAgentId/:toAgentId/', function(req, res) {
  // if (!req.session.agentId) {
  //   res.sendStatus(403);
  // }

  var toAgentId = req.params.toAgentId;
  var fromAgentId = req.params.fromAgentId;
  var currentParentSid;

  modelUpdater.findAgentStatus(fromAgentId)
    .then(function(doc) {
      currentParentSid = doc.currentParentSid;
      return modelUpdater.updateAgentStatus([toAgentId], currentParentSid, false);
    })
    .then(function() {
      var callbackUrl = connectConferenceUrl(req, currentParentSid);

      twilioCaller.call(fromAgentId, toAgentId, callbackUrl)
        .then(function() {
          res.sendStatus(200);
        });
    });
});


module.exports = router;
