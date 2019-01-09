'use strict';

var express = require('express');
var router = express.Router();
const { admin } = require('../lib/admin');
const { authenticateBeforeLogin } = require('../lib/authenticate');



router.get('/', authenticateBeforeLogin, function(req, res) {
  console.log('at /login');
  res.render('client-login');
});

router.post('/logout', function(req, res) {
  res.clearCookie('session');
  let redirectUrl = 'https://' + req.get('host') + '/phone/login/';
  res.redirect(redirectUrl);
});

router.post('/session', function(req, res) {
  console.log('session login');
  const idToken = req.body.idToken.toString();
  console.log(1234554321);
  let expiresIn = new Date().setHours(32,0,0,0) - new Date();
  expiresIn -= (expiresIn % 1000);
  console.log({expiresIn});
  admin.auth().createSessionCookie(idToken, {expiresIn})
    .then((sessionCookie) => {
      console.log('setting the cookie');
      const options = {maxAge: expiresIn, httpOnly: true, secure: true};
      res.cookie('session', sessionCookie, options);
      res.send({status: 'success'});
    })
    .catch((error) => {
      console.log('no cookie');
      console.log(error);
      res.status(401).send('UNAUTHORIZED REQUEST!');
    });
});

module.exports = router;
