'use strict';

var express = require('express');
var router = express.Router();
const { admin } = require('../lib/admin');
const { authenticateBeforeLogin } = require('../lib/authenticate');
var url = require('url');



var getRedirectUrl = function(req) {
  var pathname = '/phone/login/';
  return url.format({
    protocol: 'https',
    host: req.host,
    pathname: pathname,
  });
};

router.get('/', authenticateBeforeLogin, function(req, res) {
  console.log('in login');
  res.render('client-login');
});

router.post('/logout', function(req, res) {
  console.log('in logout');

  let redirectUrl = getRedirectUrl(req);
  console.log(redirectUrl);


  res.clearCookie('session');
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
