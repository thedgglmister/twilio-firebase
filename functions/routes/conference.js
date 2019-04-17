'use strict';

var express = require('express');
var router = express.Router();
var twimlGenerator = require('../lib/twiml-generator');
var modelUpdater = require('../lib/model');
var url = require('url');
var twilioCaller = require('../lib/twilio-caller');


//URL can be edited to an endpoint to respond with custom twiml
var AGENT_WAIT_URL = 'http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical';


var conferenceCallbackAgentUrl = function(req, conferenceName, agentId) {
  let pathname = `/phone/conference/callback/agent`;

  return url.format({
    protocol: 'https',
    host: req.host,
    pathname: pathname,
    query: {
      conferenceName: conferenceName,
      agentId: agentId,
    }
  });
};


router.post('/callback/agent', function(req, res) {
  console.log('in conference callback');
  console.log('conferenceName: ', req.query.conferenceName);

  let agentId = req.query.agentId;
  let conferenceName = req.query.conferenceName;

  modelUpdater.updateAgentConference(agentId, conferenceName)
    .then(() => {
      let conferenceTwiml = twimlGenerator.conferenceTwiml({
        waitUrl: AGENT_WAIT_URL,
        startConferenceOnEnter: true,
        endConferenceOnExit: false,
        conferenceName: conferenceName,
      });
      res.type('text/xml');
      res.send(conferenceTwiml);
    })
    .catch((e) => {
      console.log(e);
      res.sendStatus(500);
    })
});

router.post('/callback', function(req, res) {
  console.log('in conference callback');
  console.log('conferenceName: ', req.query.conferenceName);

  let conferenceName = req.query.conferenceName;

  // modelUpdater.updateAgentConference(agentId, conferenceName)
  //   .then(() => {
      let conferenceTwiml = twimlGenerator.conferenceTwiml({
        waitUrl: AGENT_WAIT_URL,
        startConferenceOnEnter: true,
        endConferenceOnExit: false,
        conferenceName: conferenceName,
      });
      res.type('text/xml');
      res.send(conferenceTwiml);
    // })
    // .catch((e) => {
    //   console.log(e);
    //   res.sendStatus(500);
    // })
});


router.post('/', function(req, res) {
  console.log('in conference');
  console.log('agentId: ', req.query.agentId);
  ///GET CHILD SID

  var agentId = req.query.agentId;
  //var childSid = req.params.childSid;
  //var currentParentSid;
  //let conferenceName = 'testConference';

  // modelUpdater.updateAgentConference(agentId, conferenceName)
  //   .then(() => {
  //     modelUpdater.findAgentStatus(agentId)
  //       .then((doc) => {
  //         let childSid = doc.currentChildSid;
  //         let callbackUrl = conferenceCallbackUrl(req, conferenceName);
  //         twilioCaller.updateCall(childSid, callbackUrl)
  //           .then(()=> {
  //             res.sendStatus(200);
  //           });
  //       })
  //   })
  //   .catch((e) => {
  //     console.log(e);
  //     res.sendStatus(500);
  //   });


  modelUpdater.findAgentStatus(agentId)
    .then(function(doc) {
      let parentSid = doc.currentParentSid;
      let childSid = doc.currentChildSid;
      modelUpdater.updateAgentConference(agentId, parentSid)
        .then(() => {
          let callbackUrl = conferenceCallbackAgentUrl(req, parentSid, agentId);
          twilioCaller.updateCall(childSid, callbackUrl)
            .then(()=> {
              res.sendStatus(200);
            });
        });
    })
    .catch((e) => {
      console.log(e);
      res.sendStatus(500);
    });





  //     return modelUpdater.updateAgentStatus([agentId], currentParentSid, true);
  //   })
  //   .then(function() {
  //     var callbackUrl = connectConferenceUrl(req, currentParentSid);
  //     twilioCaller.updateCall(childSid, callbackUrl);
  //   })
  //   .then(function() {
  //     res.sendStatus(200);
  //   });
});


router.post('/invite', function(req, res) {
  console.log('in conference invite');
  console.log('fromAgentId: ', req.query.fromAgentId);
  console.log('toAgentId: ', req.query.toAgentId);

  var toAgentId = req.query.toAgentId;
  var fromAgentId = req.query.fromAgentId;

  modelUpdater.findAgentStatus(fromAgentId)
    .then(function(doc) {
      let conferenceName = doc.conferenceName;
      // modelUpdater.updateConferenceName(toAgentId, conferenceName);
      var callbackUrl = conferenceCallbackAgentUrl(req, conferenceName, toAgentId);
      twilioCaller.call(fromAgentId, toAgentId, callbackUrl)
        .then(function() {
          res.sendStatus(200);
        });
    })
    .catch((e) => {
      console.log(e);
      res.sendStatus(500);
    })
});


module.exports = router;
