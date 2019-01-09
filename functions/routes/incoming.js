'use strict';

var express = require('express');
var router = express.Router();
var agentIds = require('../lib/agent-ids');
var twimlGenerator = require('../lib/twiml-generator');
var modelUpdater = require('../lib/model');

router.post('/', function(req, res) {
  console.log('incoming');
  var agent1 = agentIds.agent1;
  var parentSid = req.body.CallSid;
  console.log('callSID: ', req.body.CallSid);
  console.log('toNumber: ', req.body.toNumber);

  modelUpdater.updateAgentStatus(agent1, parentSid, false)
    .then(function() {
      res.type('text/xml');
      res.send(twimlGenerator.transferTwiml({
        agentIds: [agent1],
        timeout: 15,
        action: `/phone/action/callback/${agent1}/${parentSid}/`,
      }).toString());
    });
});

module.exports = router;
