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



// var conferenceCallbackUrl = function(req, callSid) {
//   var pathName = `/phone/conference/connect/${callSid}/`;

//   return url.format({
//     protocol: 'https',
//     host: req.get('host'),
//     pathname: pathName
//   });
// };


var conferenceCallbackUrl = function(req, parentSid) {
  let pathname = `/phone/conference/callback/`;

  return url.format({
    protocol: 'https',
    host: req.host,
    pathname: pathname,
    query: {
      conferenceName: parentSid,
      
    }
  });
};

var huntActionUrl = function(req) {
  var pathname = '/phone/action/hunt';
  return url.format({
    protocol: 'https',
    host: req.host,
    pathname: pathname,
    query: {
      agentIdGroupIndex: parseInt(req.query.agentIdGroupIndex) + 1,
    },
  });
}

var transcribeCallbackUrl = function(req, recipientAgentId) {
  var pathname = '/phone/action/transcribe';
  return url.format({
    protocol: 'https',
    host: req.host,
    pathname: pathname,
    query: {
      recipientAgentId: recipientAgentId,
    },
  });
}






router.post('/hunt', function(req, res) {
  console.log('in hunt action');
  //console.log(req.body);
  var agentIdGroupIndex = parseInt(req.query.agentIdGroupIndex);
  var dialCallStatus = req.body.DialCallStatus;
  var parentSid = req.body.CallSid;



  if (dialCallStatus == 'no-answer' || dialCallStatus == 'busy') {
    if (agentIdGroupIndex == agentIdGroups.length - 1) {
      let recipientAgentId = 'biremonger'; //////////////////////////////////////////////handle
      let callbackUrl = transcribeCallbackUrl(req, recipientAgentId);
      let recordTwiml = twimlGenerator.recordTwiml(callbackUrl);
      res.type('text/xml');
      res.send(recordTwiml);
    }
    else {
      let nextGroup = agentIdGroups[agentIdGroupIndex + 1]
      modelUpdater.updateAgentStatus(nextGroup, parentSid, false)
        .then(function() {
          let actionUrl = huntActionUrl(req);
          let transferTwiml = twimlGenerator.transferTwiml({
            agentIds: nextGroup,
            timeout: 10,
            action: actionUrl,
          });
          res.type('text/xml');
          res.send(transferTwiml);
        });
    }
  }
  else {
    let group = agentIdGroups[agentIdGroupIndex];
    modelUpdater.findConferenceStatusFromGroup(group, parentSid)    
      .then(function(moveToConference) {
        console.log('moveToConference: ', moveToConference);
        if (moveToConference) {
          var callbackUrl = conferenceCallbackUrl(req, parentSid);
          twilioCaller.updateCall(parentSid, callbackUrl)
            .then(() => {
              res.sendStatus(200);
            });
        }
        else {
          let hangupTwiml = twimlGenerator.hangupTwiml();
          res.type('text/xml');
          res.send(hangupTwiml);
        }
      });
  }
});





router.post('/transfer', function(req, res) {
  console.log('in transfer action');
  console.log('agentId: ', req.query.agentId);
  console.log('parentSid: ', req.body.CallSid);
  console.log('dialCallStatus: ', req.body.DialCallStatus);

  var agentId = req.query.agentId;
  var parentSid = req.body.CallSid;
  var dialCallStatus = req.body.DialCallStatus

  if (dialCallStatus == 'no-answer' || dialCallStatus == 'busy') {
    let recipientAgentId = agentId;
    let callbackUrl = transcribeCallbackUrl(req, recipientAgentId);
    let recordTwiml = twimlGenerator.recordTwiml(callbackUrl);

    res.send(recordTwiml);
  }
  else {
    modelUpdater.findConferenceStatusFromGroup([agentId], parentSid)
      .then(function(moveToConference) {
        console.log('moveToConference: ', moveToConference);
        if (moveToConference) {
          var callbackUrl = conferenceCallbackUrl(req, parentSid);
          twilioCaller.updateCall(parentSid, callbackUrl)
            .then(function() {
              res.sendStatus(200);
            });
        }
        else {
          let hangupTwiml = twimlGenerator.hangupTwiml();
          res.type('text/xml');
          res.send(hangupTwiml);
        }
      });
  }
});






router.post('/enqueue', function(req, res) {
  console.log('in enqueue action');
  console.log('agentId: ', req.query.agentId);

  let agentId = req.query.agentId;

  modelUpdater.updateHoldSid(agentId, null)
    .then(function() {
      res.sendStatus(200);
    })
    .catch(function(error) {
      console.log(error);
      res.sendStatus(500);
    });
});












router.post('/transfer/statusCallback', function(req, res) {
  console.log('in transfer statusCallback');
  console.log('call to: ', req.body.To);
  console.log('call status: ', req.body.CallStatus);
  //console.log(req.body);

  let callStatus = req.body.CallStatus;
  let callTo = req.body.To.substring(req.body.To.indexOf(':') + 1);
  let parentSid = req.body.ParentCallSid;
  let childSid = req.body.CallSid;

  if (callStatus == 'in-progress') {
    modelUpdater.updateCurrentCallSids(callTo, parentSid, childSid)
      .then(() => {
        res.sendStatus(200);
      })
      .catch((e) => {
        console.log(e);
        res.sendStatus(500);
      })
  }
  else {
    modelUpdater.updateCurrentCallSids(callTo, null, null)
      .then(() => {
        res.sendStatus(200);
      })
      .catch((e) => {
        console.log(e);
        res.sendStatus(500);
      });
  }
});



router.post('/outgoing/statusCallback/:fromAgentId', function(req, res) {
  console.log("in outgoing statusCallback");
  console.log(req.body);
  let fromAgentId = req.params.fromAgentId;
  let childSid = req.body.CallSid;

  modelUpdater.updateCurrentCallSids(fromAgentId, childSid)
    .then(function() {
      res.sendStatus(200);
    });
});





router.post('/conference', function(req, res) {
  console.log('in conference action');
  console.log('callTo: ', req.body.To);
  // console.log('call status: ', req.body.CallStatus);
  //console.log(req.body);

  // let callStatus = req.body.CallStatus;
  let callTo = req.body.To.substring(req.body.To.indexOf(':') + 1);
  // let parentSid = req.body.ParentCallSid;
  // let childSid = req.body.CallSid;

  // if (callStatus == 'in-progress') {
  //   modelUpdater.updateCurrentCallSids(callTo, parentSid, childSid)
  //     .then(() => {
  //       res.sendStatus(200);
  //     })
  //     .catch((e) => {
  //       console.log(e);
  //       res.sendStatus(500);
  //     })
  // }
  //else {
    modelUpdater.updateAgentConference(callTo, null)
      .then(() => {
        res.sendStatus(200);
      })
      .catch((e) => {
        console.log(e);
        res.sendStatus(500);
      });
  //}
});









router.post('/transcribe', function(req, res) {
  var recipientAgentId = req.query.recipientAgentId;
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
    to: recipientAgentId + '@mkpartners.com',
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
