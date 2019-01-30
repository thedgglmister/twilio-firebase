'use strict';

var express = require('express');
var router = express.Router();
var agentIdGroups = require('../lib/agent-ids');
var twimlGenerator = require('../lib/twiml-generator');
var modelUpdater = require('../lib/model');

router.post('/', function(req, res) {
  console.log('incoming');
  var parentSid = req.body.CallSid;
  console.log('callSID: ', req.body.CallSid);
  console.log('toNumber: ', req.body.toNumber);

  var group0 = agentIdGroups[0];

  modelUpdater.updateAgentStatus(group0, parentSid, false)
    .then(function() {
      res.type('text/xml');
      res.send(twimlGenerator.transferTwiml({
        agentIds: group0,
        timeout: 10,
        action: `/phone/action/callback/${0}/${parentSid}`,
      }).toString());
    });
});

module.exports = router;
