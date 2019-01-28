'use strict';

var VoiceResponse = require('twilio').twiml.VoiceResponse;
var configs = require('./twilio-configs');

var connectConferenceTwiml = function(options){
  var voiceResponse = new VoiceResponse();
  voiceResponse.dial().conference({
      'startConferenceOnEnter': options.startConferenceOnEnter,
      'endConferenceOnExit': options.endConferenceOnExit,
      'waitUrl': options.waitUrl
    }, options.callSid);

  return voiceResponse;
};

var transferTwiml = function(options){
  var voiceResponse = new VoiceResponse();
  var dial = voiceResponse.dial({
    action: options.action,
    timeout: options.timeout,
  });
  for (let agentId of options.agentIds) {
    dial.client(agentId);
  }

  return voiceResponse;
};

var callNumberTwiml = function(fromAgentId, toNumber, host){
  var voiceResponse = new VoiceResponse();
  const dial = voiceResponse.dial({
    callerId: configs.twilioNumber
  });
  dial.number({
    statusCallbackEvent: 'answered',
    statusCallback: 'https://' + host + '/phone/outgoing/answered/' + fromAgentId + '/',
  }, toNumber);
  return voiceResponse;
};

var recordTwiml = function(agentId){
  var voiceResponse = new VoiceResponse();
  voiceResponse.say('Please leave a message at the beep.');
  voiceResponse.record({
    timeout: 10,
    maxLength: 120,
    transcribeCallback: '/phone/action/transcription/' + agentId + '/',
  });

  return voiceResponse;
};

var hangupTwiml = function(){
  var voiceResponse = new VoiceResponse();
  voiceResponse.hangup();

  return voiceResponse;
};

var enqueueTwiml = function(){
  var voiceResponse = new VoiceResponse();
  voiceResponse.enqueue('holdingQueue'); //needs to be unique to agentId? or no

  return voiceResponse;
};

module.exports.connectConferenceTwiml = connectConferenceTwiml;
module.exports.transferTwiml = transferTwiml;
module.exports.recordTwiml = recordTwiml;
module.exports.hangupTwiml = hangupTwiml;
module.exports.enqueueTwiml = enqueueTwiml;
module.exports.callNumberTwiml = callNumberTwiml;
