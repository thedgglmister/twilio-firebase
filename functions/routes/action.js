'use strict';

var express = require('express');
var router = express.Router();
var twimlGenerator = require('../lib/twiml-generator');
var twilioCaller = require('../lib/twilio-caller');
var modelUpdater = require('../lib/model');
var url = require('url');
var configs = require('../lib/twilio-configs');
var nodemailer = require('nodemailer');
var agentIdGroups = require('../lib/agent-ids');



var connectConferenceUrl = function(req, callSid) {
  var pathName = `/phone/conference/connect/${callSid}/`;

  return url.format({
    protocol: 'https',
    host: req.get('host'),
    pathname: pathName
  });
};

router.post('/callback/:agentIdGroupIndex/:parentSid', function(req, res) {
  var parentSid = req.params.parentSid;
  var agentIdGroupIndex = parseInt(req.params.agentIdGroupIndex);

  console.log(4455566666);
  console.log(req.body.DialCallStatus);
  if (req.body.DialCallStatus == 'no-answer' || req.body.DialCallStatus == 'busy') {
    if (agentIdGroupIndex == agentIdGroups.length - 1) {
      let voicemailRecipient = 'biremonger';
      res.type('text/xml');
      res.send(twimlGenerator.recordTwiml(voicemailRecipient).toString()); ////agentId
    }
    else {
      let nextGroup = agentIdGroups[agentIdGroupIndex + 1]
      modelUpdater.updateAgentStatus(nextGroup, parentSid, false)
        .then(function() {
          res.type('text/xml');
          res.send(twimlGenerator.transferTwiml({
            agentIds: nextGroup,
            timeout: 15,
            action: `/phone/action/callback/${agentIdGroupIndex + 1}/${parentSid}`,
          }).toString());
        });
    }
  }
  else {
    let group = agentIdGroups[agentIdGroupIndex];
    modelUpdater.findAgentConferenceStatus(group, parentSid)
      .then(function(movingToConference) {
        if (movingToConference) {
          var callbackUrl = connectConferenceUrl(req, parentSid);
          twilioCaller.updateCall(parentSid, callbackUrl)
            .then(function() {
              res.sendStatus(200);
            });
        }
        else {
          res.send(twimlGenerator.hangupTwiml().toString());
        }
      });
  }
});





router.post('/transfer/:agentId/:parentSid', function(req, res) {
  var agentId = req.params.agentId;
  var parentSid = req.params.parentSid;

  console.log(468888);
  console.log(req.body.DialCallStatus);
  if (req.body.DialCallStatus == 'no-answer' || req.body.DialCallStatus == 'busy') {
    res.type('text/xml');
    res.send(twimlGenerator.recordTwiml(agentId).toString());
  }
  else {
    modelUpdater.findAgentConferenceStatus([agentId], parentSid)
      .then(function(movingToConference) {
        if (movingToConference) {
          var callbackUrl = connectConferenceUrl(req, parentSid);
          twilioCaller.updateCall(parentSid, callbackUrl)
            .then(function() {
              res.sendStatus(200);
            });
        }
        else {
          res.send(twimlGenerator.hangupTwiml().toString());
        }
      });
  }
});








router.post('/transcription/:agentId', function(req, res) {
  var agentId = req.params.agentId;
  var transcriptionText = req.body.TranscriptionText;
  var transcriptionStatus = req.body.TranscriptionStatus;
  var recordingUrl = req.body.RecordingUrl;
  var from = req.body.From;
  console.log('transcription text: ', transcriptionText);
  console.log('recording URL: ', recordingUrl);

  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: configs.emailSender,
      pass: configs.emailSenderPw,
    },
  });

  var mailOptions = {
    from: configs.emailSender,
    to: 'biremonger' + '@mkpartners.com', //agentId
    subject: 'New voice mail from ' + from,
    text: transcriptionText + '\n\n' + recordingUrl,//use html instead of text?
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
      res.send(error);
    } else {
      console.log('Email sent: ' + info.response);
      res.sendStatus(200);
    }
  });

});

module.exports = router;