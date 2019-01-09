'use strict';

var express = require('express');
var router = express.Router();
var modelUpdater = require('../lib/model');

router.post('/', function (req, res) {
  // if (!req.session.agentId) {
  //   res.sendStatus(403);
  // }
  console.log('in presence');
  let agentId = req.body.agentId;
  let presenceStatus = req.body.presenceStatus;
  modelUpdater.updateAgentPresence(agentId, presenceStatus)
    .then((doc) => {
      res.sendStatus(200);
    })
    .catch((error) => {
      console.log(error);
      res.sendStatus(500);
    });
});

module.exports = router;
