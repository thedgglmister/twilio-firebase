'use strict';

var configs = require('./twilio-configs');

var call = function(fromAgentId, toAgentId, callbackUrl) {

  var client = require('twilio')(configs.twilioAccountSid, configs.twilioAuthToken);
  console.log('in twilio-caller.call()');
  let movingToConference = callbackUrl.includes('conference/connect');
  console.log(movingToConference);
  console.log((movingToConference ? `client:${fromAgentId}eeeee` : `client:${fromAgentId}`));
  return client.calls
    .create({
      from: (movingToConference ? `client:${fromAgentId}conference` : `client:${fromAgentId}`),
      //from: `client:${fromAgentId}abcd`,
      to: `client:${toAgentId}`,
      url: callbackUrl
    });
};

// var callNumber = function(toNumber) {
//   var twilioPhoneNumber = configs.twilioNumber;
//   var client = require('twilio')(configs.twilioAccountSid, configs.twilioAuthToken);
//
//   return client.calls
//     .create({
//       from: twilioPhoneNumber,
//       to: toNumber,
//     });
// };

var updateCall = function(callSid, callbackUrl) {
  console.log('about to update call');
  var client = require('twilio')(configs.twilioAccountSid, configs.twilioAuthToken);
  return client.calls(callSid)
    .update({
      method: 'POST',
      url: callbackUrl,
    });
};

var lookupCall = function(number) {
  console.log('about to lookup caller Id');
  var client = require('twilio')(configs.twilioAccountSid, configs.twilioAuthToken);
  return client.lookups.phoneNumbers(number)
    .fetch({
      type: 'caller-name',
    });
};

module.exports.call = call;
// module.exports.callNumber = callNumber;
module.exports.updateCall = updateCall;
module.exports.lookupCall = lookupCall;
