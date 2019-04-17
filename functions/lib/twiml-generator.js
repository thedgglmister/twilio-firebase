'use strict';

var VoiceResponse = require('twilio').twiml.VoiceResponse;
var configs = require('./twilio-configs');

var conferenceTwiml = function(options) {
  var voiceResponse = new VoiceResponse();
  
  let dialParams = {};
  if (options.includeAction) {
    dialParams.action = 'https://us-central1-tel-mkpartners-com.cloudfunctions.net/phone/action/conference/' + (options.agentId ? options.agentId : '');
  }
  voiceResponse.dial(dialParams).conference({
      startConferenceOnEnter: options.startConferenceOnEnter,
      endConferenceOnExit: options.endConferenceOnExit,
      waitUrl: options.waitUrl,
      //statusCallbackEvent:"leave",
      //statusCallback: 'https://us-central1-tel-mkpartners-com.cloudfunctions.net/phone/action/conference/statusCallback',
      //statusCallbackMethod:"POST",
    }, options.conferenceName);

  return voiceResponse.toString();
};

var transferTwiml = function(options) {
  console.log('in transfer twiml');
  console.log(options.agentIds);
  var voiceResponse = new VoiceResponse();
  var dial = voiceResponse.dial({
    action: options.action,
    timeout: options.timeout,
  });
  for (let agentId of options.agentIds) {

    dial.client({
      statusCallbackEvent:"answered completed",
      statusCallback: 'https://us-central1-tel-mkpartners-com.cloudfunctions.net/phone/action/transfer/statusCallback',
      statusCallbackMethod:"POST",
    }, agentId);
  }

  return voiceResponse.toString();
};

var dialNumberTwiml = function(options){
  console.log('in dial number twiml');
  var voiceResponse = new VoiceResponse();
  const dial = voiceResponse.dial({
    callerId: configs.twilioNumber,
    action: options.action,
  });
  dial.number({
    statusCallbackEvent: 'answered completed',
    statusCallback: `https://us-central1-tel-mkpartners-com.cloudfunctions.net/phone/action/outgoing/statusCallback/${options.fromAgentId}`,
  }, options.toNumber);
  return voiceResponse.toString();
};

var recordTwiml = function(callbackUrl) {
  var voiceResponse = new VoiceResponse();
  voiceResponse.say('Please leave a message at the beep.');
  voiceResponse.record({
    timeout: 10,
    maxLength: 120,
    transcribeCallback: callbackUrl,
  });

  return voiceResponse.toString();
};

var hangupTwiml = function(){
  var voiceResponse = new VoiceResponse();
  voiceResponse.hangup();

  return voiceResponse.toString();
};

var enqueueTwiml = function(options){
  var voiceResponse = new VoiceResponse();
  voiceResponse.enqueue(
    {
      action: options.action
    },
    'holdingQueue'); //needs to be unique to agentId? or no. not if they are just in queue and are going to get dialed out by their parentsid.

  console.log('enqueue twiml');
  console.log(voiceResponse.toString());

  return voiceResponse.toString();
};

// var leaveTwiml = function(agentId, options){
//   var voiceResponse = new VoiceResponse();
//   voiceResponse.leave();

//   return voiceResponse;
// };

module.exports.conferenceTwiml = conferenceTwiml;
module.exports.transferTwiml = transferTwiml;
module.exports.recordTwiml = recordTwiml;
module.exports.hangupTwiml = hangupTwiml;
//module.exports.leaveTwiml = leaveTwiml;
module.exports.enqueueTwiml = enqueueTwiml;
module.exports.dialNumberTwiml = dialNumberTwiml;
