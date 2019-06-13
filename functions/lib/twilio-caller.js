'use strict';

var configs = require('./twilio-configs');
var client = require('twilio')(configs.twilioAccountSid, configs.twilioAuthToken);


// var call = function(fromAgentId, toAgentId, callbackUrl) {
//   console.log('in twilio caller call()');
//
//   return client.calls
//     .create({
//       from: (`client:${fromAgentId}`),
//       to: `client:${toAgentId}`,
//       url: callbackUrl
//     })
// };



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

var inviteParticipant = function(fromAgentId, toAgentId, conferenceName, origFromAgentId) {
  console.log('in invite participant');
  //console.log(client.conferences(conferenceName));
  console.log(53);
  //console.log(client.conferences(conferenceName).participants);
  console.log(54);
  console.log(conferenceName);

  return client.conferences.list({friendlyName: conferenceName, status: 'in-progress', limit: 1})
    .then(function(conferences) {
      console.log(55);
      console.log(conferences);
      if (conferences.length > 0) {
        let conferenceSid = conferences[0].sid;
        console.log(57);
        console.log(fromAgentId.startsWith('sip:') ? `${fromAgentId}@${configs.sipDomain}` : `client:${fromAgentId}`);
        console.log(toAgentId.startsWith('sip:') ? `${toAgentId}@${configs.sipDomain}` : `client:${toAgentId}`);


        return client.conferences(conferenceSid).participants.create({
          from: `client:${origFromAgentId}`,
          to: toAgentId.startsWith('sip:') ? `${toAgentId}@${configs.sipDomain}` : `client:${toAgentId}`,
          statusCallbackEvent: ['ringing', 'answered', 'completed'],
          statusCallback: `https://us-central1-tel-mkpartners-com.cloudfunctions.net/phone/action/invite/statusCallback?conferenceName=${conferenceName}`,
          statusCallbackMethod:"POST",
          earlyMedia: false,
        });
      }
    })
    .catch(function(e) {
      console.log(56);
      console.log(e);
    });

  console.log(58);


  // return client.conferences(conferenceName).participants.create({
  //   from: `client:${fromAgentId}`,
  //   to: `client:${toAgentId}`,
  //   statusCallbackEvent: ['ringing', 'answered', 'completed'],
  //   statusCallback: `https://us-central1-tel-mkpartners-com.cloudfunctions.net/phone/action/invite/statusCallback?conferenceSid=${conferenceSid}`,
  //   statusCallbackMethod:"POST",
  //   earlyMedia: false,
  // });
}

var updateCall = function(callSid, callbackUrl) {
  console.log('in update call');
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

// module.exports.call = call;
// module.exports.callNumber = callNumber;
module.exports.updateCall = updateCall;
module.exports.lookupCall = lookupCall;
module.exports.inviteParticipant = inviteParticipant;
