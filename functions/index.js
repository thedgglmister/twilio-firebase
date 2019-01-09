'use strict';

const functions = require('firebase-functions');

const { app } = require('./app');
const phone = functions.https.onRequest(app);

module.exports = {
  phone
}
