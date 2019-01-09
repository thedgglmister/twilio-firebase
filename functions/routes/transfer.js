'use strict';

var express = require('express');
var router = express.Router();
var twimlGenerator = require('../lib/twiml-generator');
var twilioCaller = require('../lib/twilio-caller');
var modelUpdater = require('../lib/model');
var url = require('url');


var connectTransferUrl = function(req, parentSid, agentId) {
  var pathName = `/phone/transfer/connect/${parentSid}/${agentId}/`;
  return url.format({
    protocol: 'https',
    host: req.get('host'),
    pathname: pathName
  });
};


router.post('/:fromAgentId/:toAgentId', function(req, res) {
  // if (!req.session.agentId) {
  //   res.sendStatus(403);
  // }

  var toAgentId = req.params.toAgentId;
  var fromAgentId = req.params.fromAgentId;
  var currentParentSid;

  modelUpdater.findAgentStatus(fromAgentId)
    .then(function(doc) {
      currentParentSid = doc.currentParentSid;
      modelUpdater.updateAgentStatus(toAgentId, currentParentSid, false)
        .then(function() {
          var callbackUrl = connectTransferUrl(req, currentParentSid, toAgentId);
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
});


router.post('/connect/:parentSid/:agentId', function(req, res) {
  var parentSid = req.params.parentSid;
  var agentId = req.params.agentId;

  res.type('text/xml');
  res.send(twimlGenerator.transferTwiml({
    agentIds: [agentId],
    timeout: 15,
    action: `/phone/action/callback/${agentId}/${parentSid}/`,
  }).toString());
});

module.exports = router;
