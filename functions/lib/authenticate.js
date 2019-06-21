'use strict';

const { admin } = require('./admin');




var authenticate = function(req, res, next) {
  const sessionCookie = req.cookies.session || '';
  console.log('AUTHENTICATING');
  console.log(sessionCookie === '');
  console.log(sessionCookie);
  admin.auth().verifySessionCookie(sessionCookie, true)
    .then((decodedToken) => {
      console.log('token has been decoded, cookie existed.');
      req.agentId = decodedToken.email.substr(0, decodedToken.email.indexOf('@'));
      console.log('baseUrl is: ', req.baseUrl);
      next();
    })
    .catch((error) => {
      console.log('no session or bad token. error: ', error.message);
      let redirectUrl = 'https://' + req.get('host') + '/phone/login/';
      res.redirect(redirectUrl);
    });
};

var authenticateBeforeLogin = function(req, res, next) {
  const sessionCookie = req.cookies.session || '';
  console.log('AUTHENTICATING BEFORE LOGIN');

  admin.auth().verifySessionCookie(sessionCookie, true)
    .then((decodedToken) => {
      console.log('token has been decoded, cookie existed.');
      let redirectUrl = 'https://' + req.get('host') + '/phone/';
      res.redirect(redirectUrl);
    })
    .catch((error) => {
      console.log('no session or bad token. error: ', error.message);
      next();
    });

}


// //check if cookie exists. if not (or if it doesn't work), check if authorization exists. if auth exists and works, set-cookie in header. else redirect
//
// var authenticate = function(req, res, next) {
//   console.log('about to authenticate');
//   var idToken = req.cookies.idToken;
//   if (idToken != null) {
//     admin.auth().verifyIdToken(idToken)
//       .then((decodedToken) => {
//         req.agentId = decodedToken.email.substr(0, decodedToken.email.indexOf('@'));
//         next();
//       })
//       .catch((error) => {
//         console.log('cookie error: ' + error);
//         checkHeader(req, res, next);
//       });
//   }
//   else {
//     console.log('no cookie');
//     checkHeader(req, res, next);
//   }
// }
//
// var checkHeader = function(req, res, next) {
//   console.log('checking header for token');
//   let redirectUrl = 'https://' + req.get('host') + req.originalUrl + 'phone/login/';
//   let idToken = req.headers.authorization;
//   if (idToken != null) {
//     admin.auth().verifyIdToken(idToken)
//       .then((decodedToken) => {
//         let msToMidnight = new Date().setHours(24,0,0,0) - new Date();
//         res.cookie('idToken', idToken, { maxAge: msToMidnight, httpOnly: true });
//         req.agentId = decodedToken.sub;
//         next();
//       })
//       .catch((error) => {
//         console.log('header error: ' + error);
//         res.redirect(redirectUrl);
//       });
//   }
//   else {
//     console.log('no header');
//     res.redirect(redirectUrl);
//   }
// }





module.exports = {
  authenticate,
  authenticateBeforeLogin,
};
