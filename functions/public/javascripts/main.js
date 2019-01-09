/*
first connect buttons only
after connect, disabled answer and hangup buttons
on call, then are un-disabled
on answer, move to conference shows up and transfer list shows up
on conference click, conference button is disabled and transfer list becomes dial in listen
use pusher or something so that when people come and go conference the buttons for them are set to the correct disabled
need to use this to tell if ive just been dialed into a conference, so i can disable and show correct buttons
*/

// if we want being on hold to mean having music, then unholding is going to involve getting a new incoming call and answering it manually. If we don't want that, we need  to just mute out mic.


$(function() {

  console.log(document.cookie);
  console.log("in main.js");
  console.log(currentAgentId);

  var agentIds = {
    agent1: 'mkaufman',
    agent2: 'lcampbell',
    agent3: 'biremonger',
  };

  //var currentAgentId;
  var currentConnection;
  var currentChildSid;
  var callerIdString;
  var onHold = false;
  var $callStatus = $('#call-status');
  var $connectAgent1Button = $("#connect-agent1-button");
  var $connectAgent2Button = $("#connect-agent2-button");
  var $connectAgent3Button = $("#connect-agent3-button");

  var $answerCallButton = $("#answer-call-button");
  var $hangupCallButton = $("#hangup-call-button");
  var $startConferenceButton = $("#start-conference-button");
  var $dialAgent1Button = $("#dial-agent1-button");
  var $dialAgent2Button = $("#dial-agent2-button");
  var $dialAgent3Button = $("#dial-agent3-button");
  var $transferAgent1Button = $("#transfer-agent1-button");
  var $transferAgent2Button = $("#transfer-agent2-button");
  var $transferAgent3Button = $("#transfer-agent3-button");
  var $holdButton = $("#hold-button");
  var $offHoldButton = $("#off-hold-button");
  var $callButton = $("#call-button");
  var $dialInput = $("#dial-input");
  var $logoutButton = $("#logout-button");

  var $onButton = $("#on-button");
  var $offButton = $("#off-button");

  var baseUrl = 'https://us-central1-tel-mkpartners-com.cloudfunctions.net/phone';
  // var $outgoingTransferButton = $("#outgoing-transfer-button");

  $connectAgent1Button.on('click', { agentId: agentIds.agent1 }, agentClickHandler);
  $connectAgent2Button.on('click', { agentId: agentIds.agent2 }, agentClickHandler);
  $connectAgent3Button.on('click', { agentId: agentIds.agent3 }, agentClickHandler);
  $dialAgent1Button.on('click', { agentId: agentIds.agent1 }, dialAgent);
  $dialAgent2Button.on('click', { agentId: agentIds.agent2 }, dialAgent);
  $dialAgent3Button.on('click', { agentId: agentIds.agent3 }, dialAgent);
  $transferAgent1Button.on('click', { agentId: agentIds.agent1 }, transferAgent);
  $transferAgent2Button.on('click', { agentId: agentIds.agent2 }, transferAgent);
  $transferAgent3Button.on('click', { agentId: agentIds.agent3 }, transferAgent);
  $holdButton.on('click', {}, putCallOnHold);
  $offHoldButton.on('click', {}, takeCallOffHold);
  $startConferenceButton.on('click', {}, moveToConference);
  $hangupCallButton.on('click', hangUp);
  $callButton.on('click', call);
  // $outgoingTransferButton.on('click', outgoingTransfer);




  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyBP8rrmwcLUs6uwauyY-RibJH54RPgwm2g",
    authDomain: "tel-mkpartners-com.firebaseapp.com",
    databaseURL: "https://tel-mkpartners-com.firebaseio.com",
    projectId: "tel-mkpartners-com",
    storageBucket: "tel-mkpartners-com.appspot.com",
    messagingSenderId: "1069990093776"
  };
  firebase.initializeApp(config);
  let agentPresencesRef = firebase.database().ref('agentPresences');





  $(window).on('keydown', function(event) {
    console.log(event.key);
    let sendableChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '*', '#'];
    if (sendableChars.includes(event.key) && currentConnection){
      currentConnection.sendDigits(event.key);
    }
  });


  function agentClickHandler(e) {
    var agentId = e.data.agentId;
    disableConnectButtons(true);
    fetchToken(agentId);
  }

  function disableConnectButtons(disable) {
    $connectAgent1Button.prop('disabled', disable);
    $connectAgent2Button.prop('disabled', disable);
    $connectAgent3Button.prop('disabled', disable);
  }

  function fetchToken(agentId) {
    console.log('fetching token');
    $.post(baseUrl + '/token/'+ agentId, {}, function(data) {
      console.log('token callback');
      console.log(data.token);
      currentAgentId = data.agentId;
      console.log(66666);
      console.log(currentAgentId);
      connectClient(data.token)
    }, 'json');
  }


  function connectClient(token) {
    Twilio.Device.setup(token, {debug: true});
  }
  ///////
  //////
  //fetchToken(currentAgentId);
  //////
  ///////









  Twilio.Device.ready(function (device) {
    updateCallStatus("Ready");
    agentConnectedHandler(currentAgentId);
    console.log('readyyy');
    // if (currentAgentId == 'mkaufman') {
    //   let availableAudioDevices = Array.from(Twilio.Device.audio.availableOutputDevices.values());
    //   let ringingDevice = availableAudioDevices.find((device) => {
    //     return device.label.includes('Internal Speakers');
    //   });
    //   let ringingDeviceId = ringingDevice ? ringingDevice.deviceId : 'default';
    //   Twilio.Device.audio.ringtoneDevices.set(ringingDeviceId);
    // }



        Twilio.Device.audio.ringtoneDevices.set('default');
  });

  function agentConnectedHandler(agentId) {
    $('#connect-agent-row').addClass('hidden');
    $('#connected-agent-row').removeClass('hidden');
    updateCallStatus("Connected as: " + agentId);
/*
    //if (agentId === agentIds.agent1) {
      $dialAgent1Button.removeClass('hidden').prop('disabled', true);
      $dialAgent2Button.removeClass('hidden').prop('disabled', true);
      $dialAgent3Button.removeClass('hidden').prop('disabled', true);
      $startConferenceButton.removeClass('hidden').prop('disabled', true);
      $transferAgent1Button.removeClass('hidden').prop('disabled', true);
      $transferAgent2Button.removeClass('hidden').prop('disabled', true);
      $transferAgent3Button.removeClass('hidden').prop('disabled', true);
    //}
    //else {
    //  $dialAgent2Button.addClass('hidden')
    //  $dialAgent3Button.addClass('hidden')
    //  $startConferenceButton.addClass('hidden');
    //  $transferAgent2Button.addClass('hidden');
    //  $transferAgent3Button.addClass('hidden');
    //}
*/
  }





  Twilio.Device.incoming(function(connection) {
    if (onHold) {
      connection.ignore();
      return;
    }
    currentConnection = connection;
    window.addEventListener("beforeunload", preventUnload);
    currentChildSid = connection.parameters.CallSid;

    if (connection.parameters.From.endsWith('@conference')) {
      alert(123);
    }
    updateCallerIdString(connection.parameters.From);
    // console.log(callerIdString + '#');
    // updateCallStatus("Incoming call: " + callerIdString);


    $hangupCallButton.prop('disabled', false);
    $answerCallButton.prop('disabled', false);

    // Set a callback to be executed when the connection is accepted
    connection.accept(function() {
      console.log("accccepted");
      $.post(baseUrl + '/accept/' + currentAgentId); //should set parentId to currentParentId in mongo

      $answerCallButton.prop('disabled', true);
      if (connection.parameters.From.endsWith('conference')) {
        updateCallStatus("In conference");
        $dialAgent1Button.removeClass('hidden').prop('disabled', false);
        $dialAgent2Button.removeClass('hidden').prop('disabled', false);
        $dialAgent3Button.removeClass('hidden').prop('disabled', false);
      }
      else {
        updateCallStatus("In call: " + callerIdString); //what if  in a conference?
        $startConferenceButton.removeClass('hidden').prop('disabled', false);
        $transferAgent1Button.removeClass('hidden').prop('disabled', false);
        $transferAgent2Button.removeClass('hidden').prop('disabled', false);
        $transferAgent3Button.removeClass('hidden').prop('disabled', false);
        $holdButton.removeClass('hidden').prop('disabled', false);
      }
      $answerCallButton.prop('disabled', true);
      //$dialAgent1Button.prop('disabled', false);
      //$dialAgent2Button.prop('disabled', false);
      //$dialAgent3Button.prop('disabled', false);
      // $startConferenceButton.removeClass('hidden').prop('disabled', false);
      // $transferAgent1Button.removeClass('hidden').prop('disabled', false);
      // $transferAgent2Button.removeClass('hidden').prop('disabled', false);
      // $transferAgent3Button.removeClass('hidden').prop('disabled', false);
      // $holdButton.removeClass('hidden').prop('disabled', false);
    });

    connection.error(function(error) {
      console.log('errrororrr');
      console.log(error.message);
    });

    $answerCallButton.click(function() {
      console.log('accept clicked');
      connection.accept();
    });

    $hangupCallButton.click(function() {
      console.log('hangup clicked');
      connection.ignore();
    });
  });



  Twilio.Device.cancel(function (connection) { //what happens on conference dial in?
    console.log('canceledd');
    console.log('on hold: ' + onHold);
    if (!onHold) {
      callEndedHandler();
      //Twilio.Device.destroy();
      window.removeEventListener("beforeunload", preventUnload);
      currentConnection = null;
      //refreshPage();
    }
  });

  Twilio.Device.disconnect(function(connection) {
    console.log('disconnectedd');
    console.log('on hold: ' + onHold);
    callEndedHandler();
    //Twilio.Device.destroy();
    window.removeEventListener("beforeunload", preventUnload);
    currentConnection = null;
    //refreshPage();
  });

  Twilio.Device.error(function (error) {
    console.log("error: " + error.message);
    updateCallStatus("ERROR: " + error.message);
    callEndedHandler(true);
    window.removeEventListener("beforeunload", preventUnload);
    currentConnection = null;
    //refreshPage();
  });

  Twilio.Device.offline(function(device) {
    console.log("offline");
    window.removeEventListener("beforeunload", preventUnload);
    currentConnection = null;
    //refreshPage();

    //need to check that this works, as well as change call status...
    fetchToken(currentAgentId);
  });




//call not ansered -->sends cancel event
//call ignored --> sends cancel event
//call canceld --> sends csancel event
//call error -->error
//call disconnect -->sends disconnect
//offline event

//on offline, setup again
//the others just need to destroy




  function dialAgent(e) {
    $.post(baseUrl + '/conference/invite/' + currentAgentId + '/' + e.data.agentId);
  }


  function transferAgent(e) {
    $.post(baseUrl + '/transfer/' + currentAgentId + '/' + e.data.agentId, function(response) {
      callEndedHandler();
      onHold = false;
    });
  }

  function moveToConference(e) {
    $.post(baseUrl + '/conference/move/' + currentAgentId + '/' + currentChildSid, function(response) {
      updateCallStatus('In conference');
      $startConferenceButton.prop('disabled', true);
      $transferAgent1Button.addClass('hidden').prop('disabled', true);
      $transferAgent2Button.addClass('hidden').prop('disabled', true);
      $transferAgent3Button.addClass('hidden').prop('disabled', true);
      $holdButton.addClass('hidden').prop('disabled', true);
      $dialAgent1Button.removeClass('hidden').prop('disabled', false);
      $dialAgent2Button.removeClass('hidden').prop('disabled', false);
      $dialAgent3Button.removeClass('hidden').prop('disabled', false);
    });
  }

  function hangUp() {
    Twilio.Device.disconnectAll();
  }


  function callEndedHandler(onError) {
    console.log('in call ended handler');

    $dialAgent1Button.addClass('hidden').prop('disabled', true);
    $dialAgent2Button.addClass('hidden').prop('disabled', true);
    $dialAgent3Button.addClass('hidden').prop('disabled', true);
    $startConferenceButton.addClass('hidden').prop('disabled', true);
    $transferAgent1Button.addClass('hidden').prop('disabled', true);
    $transferAgent2Button.addClass('hidden').prop('disabled', true);
    $transferAgent3Button.addClass('hidden').prop('disabled', true);
    $holdButton.addClass('hidden').prop('disabled', true);
    $offHoldButton.addClass('hidden').prop('disabled', true);

    $hangupCallButton.prop('disabled', true);
    $answerCallButton.prop('disabled', true);

    $callButton.prop('disabled', false);

    if (!onError) {
      updateCallStatus("Connected as: " + currentAgentId);
    }
  }



  function updateCallStatus(status) {
    $callStatus.text(status);
  }


  function updateCallerIdString(fromNumber) {
    console.log(fromNumber);
    if (fromNumber.startsWith('client:')) {
      callerIdString = fromNumber.slice(7);
      if (fromNumber.endsWith('conference')) {
        callerIdString = callerIdString.slice(0, callerIdString.length - 10);
      }
      updateCallStatus("Incoming call: " + callerIdString);
    }
    else {
      $.post(baseUrl + '/callerid/' + fromNumber, function(numberData) {
        console.log(JSON.stringify(numberData));
        console.log(numberData);
        console.log(numberData !== null);
        if (numberData != null) {

          console.log(numberData.nationalFormat);
          console.log(numberData.callerName.caller_name);

          var nationalFormat = numberData.nationalFormat;
          var callerName = numberData.callerName ? numberData.callerName.caller_name : 'Anonymous';
          callerIdString = (callerName ? callerName + ' ' : '') + nationalFormat;
          console.log(callerIdString);
          updateCallStatus("Incoming call: " + callerIdString);
        }
        else {
          callerIdString = fromNumber;
          updateCallStatus("Incoming call: " + callerIdString);
        }
      });
    }

  }


  function refreshPage() {
    // setTimeout(function() {
    //   location.reload();
    // }, 1000);
  }

  function preventUnload(event) {
    // Most browsers.
    event.preventDefault();

    // Chrome/Chromium based browsers still need this one.
    event.returnValue = "Please don't leave the page while on a call";
  }

  function putCallOnHold() {
    $.post(baseUrl + '/hold/' + currentAgentId, function(response) {
      onHold = true;
      updateCallStatus("On hold");
      $holdButton.addClass('hidden').prop('disabled', true);
      $offHoldButton.removeClass('hidden').prop('disabled', false);
      $transferAgent1Button.removeClass('hidden').prop('disabled', false);
      $transferAgent2Button.removeClass('hidden').prop('disabled', false);
      $transferAgent3Button.removeClass('hidden').prop('disabled', false);
    });

    //what about transferring while they are on hold? --- Works. Test that I can get new calls after.
    //what about conferencing while they are on hold? --- Can't work because involves action on the callers end to get them into conference, and since they won't be hung up on, action won't get called.
    //what if they hang up while they are on hold? --- No way for me to know. WHAT HAPPENS WHEN I TAKE THEM OFF HOLD?
    //what if I hang up while they are on hold? --- Right now can't hang up. Can change hangup button listener to send hangup twiml to caller?
    //what if I get a new call? --- They go to voicemail
    //do any buttons need to be disabled? (hold hidden and unhold displayed, for example)
  }

  function takeCallOffHold() {
    onHold = false;
    callEndedHandler()
    $.post(baseUrl + '/hold/unhold/' + currentAgentId, function(response) {
      $offHoldButton.addClass('hidden').prop('disabled', true);
    });
    //move call out of queue
    //either need to answer or do an auto answer?

  }


  function call() {
    var rawToNumber = $dialInput.val();
    var toNumber = '';
    for (var i = 0; i < rawToNumber.length; i++) {
      var char = rawToNumber[i];
      if (!isNaN(parseInt(char))) {
        toNumber += char;
      }
    }
    console.log('toNumber:' + toNumber);
    var body = {
      toNumber: toNumber,
      fromAgentId: currentAgentId
     };
    currentConnection = Twilio.Device.connect(body);
    callerIdString = toNumber;
    updateCallStatus("In Call: " + callerIdString);


    window.addEventListener("beforeunload", preventUnload);
    $hangupCallButton.prop('disabled', false);
    $callButton.prop('disabled', true);

    $transferAgent1Button.removeClass('hidden').prop('disabled', false);
    $transferAgent2Button.removeClass('hidden').prop('disabled', false);
    $transferAgent3Button.removeClass('hidden').prop('disabled', false);
    $holdButton.removeClass('hidden').prop('disabled', false);
  }

  function logout() {
    $.post(baseUrl + '/login/logout/', function(response) {
      console.log(response);
    });
  }



  // function outgoingTransfer() {
  //   console.log(44545);
  //   $.post('/outgoing/transfer/' + currentAgentId, function(response) {
  //     console.log(response);
  //   });
  // }


  $logoutButton.on('click', () => {
    console.log(baseUrl);
    console.log(baseUrl + '/login/logout/');
    $.post(baseUrl + '/login/logout/', function(response) {
      window.location.assign('https://us-central1-tel-mkpartners-com.cloudfunctions.net/phone/login/');
    });
  });
//
// function deleteCookie() {
//   $.get('https://us-central1-tel-mkpartners-com.cloudfunctions.net/phone/login/logout/', function(response) {
//     console.log('Signed Out');
//     location.reload(true);
//   });
// }




  $offButton.prop('disabled', true);
  $onButton.on('click', () => {
    $onButton.prop('disabled', true);
    $offButton.prop('disabled', false);
    //$.post(baseUrl + '/presence/', {agentId: currentAgentId, presenceStatus: true});
    agentPresencesRef.update({
      [currentAgentId]: true,
    });
  });
  $offButton.on('click', () => {
    $onButton.prop('disabled', false);
    $offButton.prop('disabled', true);
    //$.post(baseUrl + '/presence/', {agentId: currentAgentId, presenceStatus: false});
    agentPresencesRef.update({
      [currentAgentId]: false,
    });
  });

  agentPresencesRef.on('value', (snapshot) => {
    let presences = snapshot.val();
    console.log(presences);
  });





});
