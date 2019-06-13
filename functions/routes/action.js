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


// var conferenceCallbackUrl = function(req, parentSid) {
//   let pathname = `/phone/conference/callback/`;
//
//   return url.format({
//     protocol: 'https',
//     host: req.host,
//     pathname: pathname,
//     query: {
//       conferenceName: parentSid,
//     }
//   });
// };

var conferenceCallbackAgentUrl = function(req, conferenceName, agentId, includeAction) {
  let pathname = `/phone/conference/callback/agent`;

  return url.format({
    protocol: 'https',
    host: req.host,
    pathname: pathname,
    query: {
      conferenceName: conferenceName,
      agentId: agentId,
      includeAction : includeAction ? '1' : '0',
    }
  });
};

var huntActionUrl = function(req, name, number) {
  var pathname = '/phone/action/hunt';
  return url.format({
    protocol: 'https',
    host: req.host,
    pathname: pathname,
    query: {
      agentIdGroupIndex: parseInt(req.query.agentIdGroupIndex) + 1,
      name: name,
      number: number,
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
  var name = req.query.name;
  var number = req.query.number;
  console.log('$$$$$$');
  console.log(req.body);



  if (dialCallStatus == 'no-answer' || dialCallStatus == 'busy') {
    if (agentIdGroupIndex == agentIdGroups.length - 1) {

      let recipientAgentId = 'biremonger'; //WHO SHOULD GET THE EMAIL IF NO ONE ANSWERS INITIALLY?

      let callbackUrl = transcribeCallbackUrl(req, recipientAgentId);
      let recordTwiml = twimlGenerator.recordTwiml(callbackUrl);
      res.type('text/xml');
      res.send(recordTwiml);
    }
    else {
      let nextGroup = agentIdGroups[agentIdGroupIndex + 1]
      let isSipGroup = nextGroup[0].startsWith('sip:');
      //modelUpdater.updateAgentStatus(nextGroup, parentSid, false)
        //.then(function() {
          let actionUrl = huntActionUrl(req, name, number);
          let options = {
            agentIds: nextGroup,
            timeout: 10,
            action: actionUrl,
            name: name,
            number: number,
          };

          let transferTwiml
          if (isSipGroup) {
            transferTwiml = twimlGenerator.sipTransferTwiml(options);
          }
          else {
            transferTwiml = twimlGenerator.transferTwiml(options);
          }

          res.type('text/xml');
          res.send(transferTwiml);
        // });
    }
  }
  else {
    let group = agentIdGroups[agentIdGroupIndex];
    modelUpdater.findConferenceStatusFromGroup(group, parentSid)
      .then(function(result) {
        console.log('movingToConference: ', result && result.movingToConference);
        if (result && result.movingToConference) {
          var callbackUrl = conferenceCallbackAgentUrl(req, parentSid, result.agentId, false);
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
  console.log('origAgentId: ', req.query.origAgentId);
  console.log('parentSid: ', req.body.CallSid);
  console.log('dialCallStatus: ', req.body.DialCallStatus);

  var agentId = req.query.agentId;
  var origAgentId = req.query.origAgentId;
  var parentSid = req.body.CallSid;
  var dialCallStatus = req.body.DialCallStatus

  if (dialCallStatus == 'no-answer' || dialCallStatus == 'busy') {
    let recipientAgentId = origAgentId;
    let callbackUrl = transcribeCallbackUrl(req, recipientAgentId);
    let recordTwiml = twimlGenerator.recordTwiml(callbackUrl);
    res.type('text/xml');
    res.send(recordTwiml);
  }
  else {
    modelUpdater.findConferenceStatusFromGroup([agentId], parentSid)
      .then(function(result) {
        console.log('movingToConference: ', result && result.movingToConference);
        if (result && result.movingToConference) {
          var callbackUrl = conferenceCallbackAgentUrl(req, parentSid, result.agentId, false);
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


router.post('/outgoing', function(req, res) {
  console.log('in outgoing action');
  console.log('fromAgentId: ', req.query.fromAgentId);
  console.log('parentSid: ', req.body.CallSid);
  console.log('dialCallStatus: ', req.body.DialCallStatus);
  console.log(req.body);

  var fromAgentId = req.query.fromAgentId;
  var parentSid = req.body.DialCallSid;
  var childSid = req.body.CallSid;
  var dialCallStatus = req.body.DialCallStatus;

  // if (dialCallStatus == 'completed') {
  //   modelUpdater.updateCurrentCallSids(fromAgentId, null, null)
  //     .then(function() {
  //       res.sendStatus(200);
  //     })
  //     .catch((e) => {
  //       console.log(e);
  //       res.sendStatus(500);
  //     });
  // }


  //var dialCallStatus = req.body.DialCallStatus

  // if (dialCallStatus == 'no-answer' || dialCallStatus == 'busy') {
  //   let recipientAgentId = agentId;
  //   let callbackUrl = transcribeCallbackUrl(req, recipientAgentId);
  //   let recordTwiml = twimlGenerator.recordTwiml(callbackUrl);

  //   res.send(recordTwiml);
  // }
  //else {
  modelUpdater.findConferenceStatusFromGroup([fromAgentId], parentSid)
    .then(function(result) {
      console.log('movingToConference: ', result && result.movingToConference);
      if (result && result.movingToConference) {
        var callbackUrl = conferenceCallbackAgentUrl(req, parentSid, result.agentId, true);
        twilioCaller.updateCall(childSid, callbackUrl)
          .then(function() {
            res.sendStatus(200);
          });
      }
      else if (dialCallStatus == 'completed') {
        modelUpdater.updateCurrentCallSids(fromAgentId, null, null, null, null, null)
          .then(function() {
            res.sendStatus(200);
          })
          .catch((e) => {
            console.log(e);
            res.sendStatus(500);
          });
      }
      else {
        let hangupTwiml = twimlGenerator.hangupTwiml();
        res.type('text/xml');
        res.send(hangupTwiml);
      }
    });
  //}
});






router.post('/enqueue', function(req, res) {
  console.log('in enqueue action');
  console.log('agentId: ', req.query.agentId);

  let agentId = req.query.agentId;

  modelUpdater.updateHoldSid(agentId, null, null, null)
    .then(function() {
      res.sendStatus(200);
    })
    .catch(function(error) {
      console.log(error);
      res.sendStatus(500);
    });
});




router.post('/invite/statusCallback', function(req, res) {
  console.log('in invite statusCallback');

  console.log(req.body);

  let callStatus = req.body.CallStatus;
  let inviterAgentId = req.body.Caller.substring(0, req.body.Caller.indexOf('@') >= 0 ? req.body.Caller.indexOf('@') : req.body.Caller.length);
  let inviteeAgentId = req.body.Called.substring(0, req.body.Called.indexOf('@') >= 0 ? req.body.Called.indexOf('@') : req.body.Called.length);
  if (!req.body.Caller.startsWith('sip:')) {
    inviterAgentId = req.body.Caller.substring(req.body.Caller.indexOf(':') + 1);
  }
  if (!req.body.Called.startsWith('sip:')) {
    inviteeAgentId = req.body.Called.substring(req.body.Called.indexOf(':') + 1);
  }




  let conferenceName = req.query.conferenceName;



  if (callStatus == 'in-progress') {
    modelUpdater.updateAgentConference(inviteeAgentId, conferenceName)
      .then(() => {
        res.sendStatus(200);
      })
      .catch((e) => {
        console.log(e);
        res.sendStatus(500);
      });
  }
  else if (callStatus == 'ringing') {
    modelUpdater.updateIncomingCallerId(inviteeAgentId, inviterAgentId, null, null)
      .then(() => {
        res.sendStatus(200);
      })
      .catch((e) => {
        console.log(e);
        res.sendStatus(500);
      });
  }
  else if (callStatus == 'no-answer') {
    modelUpdater.updateIncomingCallerId(inviteeAgentId, null, null, null)
      .then(() => {
        res.sendStatus(200);
      })
      .catch((e) => {
        console.log(e);
        res.sendStatus(500);
      });
  }
  else {
    modelUpdater.updateAgentConference(inviteeAgentId, null)
      .then(() => {
        res.sendStatus(200);
      })
      .catch((e) => {
        console.log(e);
        res.sendStatus(500);
      });
  }
});

// router.post('/sipTransfer/statusCallback', function(req, res) {
//   console.log('in sipTransfer statusCallback');
//   console.log('call to: ', req.body.To);
//   console.log('call status: ', req.body.CallStatus);
//
//   console.log(req.body);
//
// });

router.post('/transfer/statusCallback', function(req, res) {
  console.log('in transfer statusCallback');
  console.log('call to: ', req.body.To);
  console.log('call status: ', req.body.CallStatus);

  //console.log(req.body);

  let callStatus = req.body.CallStatus;
  let callTo = req.body.To.substring(0, req.body.To.indexOf('@') >= 0 ? req.body.To.indexOf('@') : req.body.To.length);
  if (!req.body.To.startsWith('sip:')) {
    callTo = req.body.To.substring(req.body.To.indexOf(':') + 1);
  }

  let parentSid = req.body.ParentCallSid;
  let childSid = req.body.CallSid;
  let name = req.query.name;
  let number = req.query.number;


  if (callStatus == 'in-progress') {
    modelUpdater.updateCurrentCallSids(callTo, parentSid, childSid, name, number, "Incoming")
      .then(() => {
        res.sendStatus(200);
      })
      .catch((e) => {
        console.log(e);
        res.sendStatus(500);
      });
  }
  else if (callStatus == 'ringing') {
    modelUpdater.updateIncomingCallerId(callTo, name, number, parentSid)
      .then(() => {
        res.sendStatus(200);
      })
      .catch((e) => {
        console.log(e);
        res.sendStatus(500);
      });
  }
  else if (callStatus == 'no-answer') {
    modelUpdater.updateIncomingCallerId(callTo, null, null, null)
      .then(() => {
        res.sendStatus(200);
      })
      .catch((e) => {
        console.log(e);
        res.sendStatus(500);
      });
  }
  else {
    modelUpdater.updateCurrentCallSids(callTo, null, null, null, null, null)
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
  //console.log(req.body);
  let fromAgentId = req.params.fromAgentId;
  let childSid = req.body.CallSid;
  let parentSid = req.body.ParentCallSid;
  let callStatus = req.body.CallStatus;
  let name = req.query.name;
  let number = req.query.number;

  if (callStatus == 'in-progress') {
    modelUpdater.updateCurrentCallSids(fromAgentId, childSid, parentSid, name, number, "Outgoing")
    .then(function() {
      res.sendStatus(200);
    })
    .catch((e) => {
      console.log(e);
      res.sendStatus(500);
    })
  }
  else if (callStatus == 'ringing') {
    modelUpdater.updateOutgoingCallerId(fromAgentId, name, number)
      .then(() => {
        res.sendStatus(200);
      })
      .catch((e) => {
        console.log(e);
        res.sendStatus(500);
      });
  }
  // else {
  //   modelUpdater.updateCurrentCallSids(fromAgentId, null, null)
  //   .then(function() {
  //     res.sendStatus(200);
  //   })
  //   .catch((e) => {
  //     console.log(e);
  //     res.sendStatus(500);
  //   })
  // }
});





router.post('/conference/:agentId', function(req, res) {
  console.log('in conference action');
  console.log('agentId: ', req.params.agentId);
  // console.log('call status: ', req.body.CallStatus);
  //console.log(req.body);

  // let callStatus = req.body.CallStatus;
  let agentId = req.params.agentId;
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
    modelUpdater.updateAgentConference(agentId, null)
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
