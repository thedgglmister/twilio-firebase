'use strict';

var express = require('express');
var router = express.Router();
var url = require('url');
var agentIdGroups = require('../lib/agent-ids');
var twimlGenerator = require('../lib/twiml-generator');
var modelUpdater = require('../lib/model');
var twilioCaller = require('../lib/twilio-caller');


//returns the URL of the endpoint to hit when an initial incoming call concludes.
var huntActionUrl = function(req, name, number) {
  var pathname = '/phone/action/hunt';
  return url.format({
    protocol: 'https',
    host: req.host,
    pathname: pathname,
    query: {
      agentIdGroupIndex: 0,
      name: name,
      number: number,
    },
  });
}

//the endpoint hit by twilio when a new call comes in. forwards call to agents in group0. sets the action to the hunt action, which either keeps hunting, sends to voicemail, or sends to conference.
router.post('/', function(req, res) {
  console.log('in incoming');
  console.log('callSid: ', req.body.CallSid);
  console.log('from: ', req.body.From);

  let fromNumber = req.body.From;
  let parentSid = req.body.CallSid;
  let group0 = agentIdGroups[0];
  let isSipGroup = group0[0].startsWith('sip:');
  res.type('text/xml');


  twilioCaller.lookupCall(fromNumber)
    .then(function(numberData) {
      let name = numberData.callerName ? numberData.callerName.caller_name : 'Anonymous';
      let number = numberData.nationalFormat;
      // modelUpdater.updateCallerId(name, fromNumber)
      //   .then(() => {
          let actionUrl = huntActionUrl(req, name, number);
          let options = {
            agentIds: group0,
            timeout: 10,
            action: actionUrl,
            name: name,
            number: number,
          };
          let transferTwiml;
          if (isSipGroup) {
            transferTwiml = twimlGenerator.sipTransferTwiml(options);
          }
          else {
            transferTwiml = twimlGenerator.transferTwiml(options);
          }
          res.send(transferTwiml);
        // })
        // .catch((e) => {
        //   console.log(e);
        //   res.sendStatus(500);
        // });
    })
    .catch(function(error) {
      console.log('in catch');
      console.log(error);
      let actionUrl = huntActionUrl(req, 'Anonymous', fromNumber);
      let transferTwiml = twimlGenerator.transferTwiml({
        agentIds: group0,
        timeout: 10,
        action: actionUrl,
        name: 'Anonymous',
        number: fromNumber,
      });
      res.send(transferTwiml);
    });



});

module.exports = router;
