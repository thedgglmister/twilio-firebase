'use strict';

var configs = require('./twilio-configs');
var client = require('twilio')(configs.twilioAccountSid, configs.twilioAuthToken);


var call = function(fromAgentId, toAgentId, callbackUrl) {
  console.log('in twilio caller call()');

  return client.calls
    .create({
      from: (`client:${fromAgentId}`),
      to: `client:${toAgentId}`,
      url: callbackUrl
    })
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
  console.log(callbackUrl);
  //console.log(client.calls());
  // if (callSid) {
  //   console.log(client.calls(callSid));
  // }
  return client.calls(callSid)
    .update({
      method: 'POST',
      url: callbackUrl,
    });
};

var lookupCall = function(number) {
  console.log('about to lookup caller Id');
  return client.lookups.phoneNumbers(number)
    .fetch({
      type: 'caller-name',
    });
};

module.exports.call = call;
// module.exports.callNumber = callNumber;
module.exports.updateCall = updateCall;
module.exports.lookupCall = lookupCall;
