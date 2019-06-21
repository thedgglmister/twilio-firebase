const functions = require('firebase-functions');
const firebaseConfigs = functions.config()['twilio-configs'];

var configs = {
  domain: firebaseConfigs.domain,
  googleClientId: firebaseConfigs.google_client_id,
  sessionSecret: firebaseConfigs.session_secret,
  twilioNumber: firebaseConfigs.twilio_number2,
  twilioAccountSid: firebaseConfigs.twilio_account_sid2,
  twilioAuthToken: firebaseConfigs.twilio_auth_token2,
  twilioAppSid: firebaseConfigs.twilio_app_sid2,
  emailSender: firebaseConfigs.email_sender,
  emailSenderPw: firebaseConfigs.email_sender_pw,
  sipDomain: firebaseConfigs.sip_domain2,
  apiKey: firebaseConfigs.api_key,
};

module.exports = configs;
