'use strict';

var ClientCapability = require('twilio').jwt.ClientCapability;
var configs = require('./twilio-configs');

module.exports = function(agentId){
  var capability = new ClientCapability({
    accountSid: configs.twilioAccountSid,
    authToken: configs.twilioAuthToken
  });

  capability.addScope(new ClientCapability.OutgoingClientScope({ applicationSid: configs.twilioAppSid }));
  capability.addScope(new ClientCapability.IncomingClientScope(agentId));
  return capability.toJwt();
};
