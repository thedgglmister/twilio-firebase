// 'use strict';

// var express = require('express');
// var router = express.Router();
// var modelUpdater = require('../lib/model');

// router.post('/:agentId', function(req, res) {
//   console.log("acccccepting");
//   var agentId = req.params.agentId;
//   var parentSid;

//   modelUpdater.findAgentStatus(agentId)
//     .then(function(doc) {
//       parentSid = doc.parentSid;
//       modelUpdater.updateCurrentParentSid(agentId, parentSid)
//         .then(function() {
//           res.sendStatus(200);
//         });
//     });
// });

// module.exports = router;
