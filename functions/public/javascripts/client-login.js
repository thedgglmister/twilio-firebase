$(function() {

  var baseUrl = 'https://us-central1-tel-mkpartners-com.cloudfunctions.net/phone';
  var config = {
    apiKey: "AIzaSyBP8rrmwcLUs6uwauyY-RibJH54RPgwm2g",
    authDomain: "tel-mkpartners-com.firebaseapp.com",
    databaseURL: "https://tel-mkpartners-com.firebaseio.com",
    projectId: "tel-mkpartners-com",
    storageBucket: "tel-mkpartners-com.appspot.com",
    messagingSenderId: "1069990093776"
  };
  firebase.initializeApp(config);

  //firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);

  firebase.auth().getRedirectResult()
    .then(function(result) {
      if (result.user) {
        console.log('user');
        console.log(result.user);
        hideLogin();
      }
      else {
        showLogin();
      }
      return result.user.getIdToken();
    })
    .then((idToken) => {
      console.log('about to post to session login');
      return postIdTokenToSessionLogin(idToken);
    })
    .catch((error) => {
      console.log('no user');
      //console.log(error);
      showLogin();
    });


  function postIdTokenToSessionLogin(idToken) {
    $.post(
      baseUrl + '/login/session/',
      {
        idToken: idToken,
      },
      (response) => {
        if (response.status == 'success') {
          console.log('redirecting to /phone/');
          window.location.assign('https://us-central1-tel-mkpartners-com.cloudfunctions.net/phone/');
        }
        else {
          showLogin();
        }
      }
    );
  }

  function googleSignIn() {
    var provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
      hd: "mkpartners.com"
    });
    firebase.auth().signInWithRedirect(provider);
  }

  function hideLogin() {
    $('#login-button').hide();
    $('#redirecting').show();
  }

  function showLogin() {
    $('#login-button').show();
    $('#redirecting').hide();
  }

  $("#login-button").on('click', googleSignIn);

  //
  // firebase.auth().getRedirectResult()
  //   .then(function(result) {
  //     deleteCookie();
  //     if (result.user) {
  //       console.log('credential success');
  //       let accessToken = result.user.getIdToken()//credential.accessToken;
  //         .then((idToken) => {
  //           $.ajax({
  //             url: '/phone/',
  //             headers: {
  //               'Authorization': idToken,
  //               'Content-Type': 'application/json',
  //             },
  //             method: 'GET',
  //             success: (data) => {
  //               window.location.href = '/phone/';
  //             },
  //             error: (error) => {
  //               console.log('error: ' + error);
  //             }
  //           });
  //         })
  //         .catch((error) => {
  //           console.log('errror: ' + error);
  //         });
  //       console.log('user: ', result.user);
  //     }
  //     else {
  //       console.log('credential fail');
  //       var provider = new firebase.auth.GoogleAuthProvider();
  //       provider.setCustomParameters({
  //         hd: "mkpartners.com"
  //       });
  //       firebase.auth().signInWithRedirect(provider);
  //     }
  //   })
  //   .catch(function(error) {
  //     console.log("Error signing in:", error);
  //   });

  // firebase.auth().onAuthStateChanged((user) => {
  //   if (user) {
  //     console.log(user);
  //     // return user.getIdToken().then((idToken) => {
  //     //   const csrfToken = getCookie('csrfToken');
  //     //   return postIdTokenToSessionLogin(idToken, csrfToken);
  //     // })
  //   } else {
  //     console.log('no user?');
  //   }
  // });


  // $('#login').on('click', () => {
  //   console.log('login clicked');
  //   var provider = new firebase.auth.GoogleAuthProvider();
  //   provider.setCustomParameters({
  //     hd: "mkpartners.com"
  //   });
  //
  //   firebase.auth().signInWithRedirect(provider);
  // })

  // function deleteCookie() {
  //   var d = new Date(); //Create an date object
  //   d.setTime(d.getTime() - (1000*60*60*24)); //Set the time to the past. 1000 milliseonds = 1 second
  //   var expires = "expires=" + d.toGMTString(); //Compose the expirartion date
  //   document.cookie = 'idToken'+"="+"; "+expires;//Set the cookie with name and the expiration date
  // }

  // function setCookie(accessToken) {
  //   console.log('setting cookie');
  //   let midnight = new Date().setHours(24,0,0,0).toString()
  //   document.cookie = `access_token={$accesToken}; Secure; HttpOnly; expires={$midnight}`;
  // }



});
