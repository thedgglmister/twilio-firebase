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

  console.log("in main.js");
  console.log('currentAgentId', currentAgentId);
  console.log('origAgentId', origAgentId);


  var agentIds = { //temp
    agent1: 'mkaufman',
    agent2: 'lcampbell',
    agent3: 'biremonger',
    agent4: 'jmarty',
  };

  var currentConnection;
  //var callerIdString;
  var onHold = false;
  var $callStatus = $('#call-status');
  var $connectAgent1Button = $("#connect-agent1-button");
  var $connectAgent2Button = $("#connect-agent2-button");
  var $connectAgent3Button = $("#connect-agent3-button");
  var $connectAgent4Button = $("#connect-agent4-button");
  var $answerCallButton = $("#answer-call-button");
  var $hangupCallButton = $("#hangup-call-button");
  var $startConferenceButton = $("#start-conference-button");
  var $holdCnt = $("#hold-cnt");
  var $holdButton = $("#hold-button");
  var $offHoldButton = $("#off-hold-button");
  var $callButton = $("#call-button");
  var $confCallButton = $("#conf-call-button");

  var $outboundCnt = $("#outbound-cnt");
  var $outboundConfCallCnt = $("#outbound-conf-call-cnt");

  var $dialInput = $("#dial-input");
  var $confCallDialInput = $("#conf-call-dial-input");

  var $logoutButton = $("#logout-btn");
  var $transferCnt = $('#transfer-cnt');
  var $dialInCnt = $('#dial-in-cnt');
  var $statusSelector = $("#status-selector");
  var $ringtoneSelector = $("#ringtone-selector");
  var $speakerSelector = $("#speaker-selector");
  var $speakerSelectorCntr = $("#speaker-selector-cntr");
  var $window = $(window);
  var sipMap = {};

  var baseUrl = 'https://us-central1-tel-mkpartners-com.cloudfunctions.net/phone';

  // Initialize Firebase
  var config = {
    apiKey: apiKey,
    authDomain: "tel-mkpartners-com.firebaseapp.com",
    databaseURL: "https://tel-mkpartners-com.firebaseio.com",
    projectId: "tel-mkpartners-com",
    storageBucket: "tel-mkpartners-com.appspot.com",
    messagingSenderId: "1069990093776"
  };
  firebase.initializeApp(config);
  let agentPresencesRef = firebase.database().ref('agentPresences');
  let agentStatusesRef = firebase.database().ref('agentStatuses');
  let sipMapRef = firebase.database().ref('sipMap');

  //let callerIdRef = firebase.database().ref('callerId');


  if (!debug) {
    fetchToken(origAgentId);
  }
  else {
    $('#connect-agent-row').removeClass('hidden');
  }

  $connectAgent1Button.on('click', { agentId: agentIds.agent1 }, agentClickHandler);
  $connectAgent2Button.on('click', { agentId: agentIds.agent2 }, agentClickHandler);
  $connectAgent3Button.on('click', { agentId: agentIds.agent3 }, agentClickHandler);
  $connectAgent4Button.on('click', { agentId: agentIds.agent4 }, agentClickHandler);
  $holdButton.on('click', {}, putCallOnHold);
  $offHoldButton.on('click', {}, takeCallOffHold);
  $startConferenceButton.on('click', {}, moveToConference);
  $hangupCallButton.on('click', handleHangupCallButtonClick);
  $answerCallButton.on('click', handleAnswerCallButtonClick);
  $callButton.on('click', call);
  $confCallButton.on('click', dialIntoConference);

  $logoutButton.on('click', logout);
  $window.on('keydown', sendDigits);
  $window.on('beforeunload', setPresenceOffline);
  $statusSelector.on('change', handleStatusSelectorChange);
  $speakerSelector.on('change', handleSpeakerSelectorChange);
  $ringtoneSelector.on('change', handleRingtoneSelectorChange);







  Twilio.Device.ready(handleDeviceReady);
  Twilio.Device.incoming(handleDeviceIncoming);
  Twilio.Device.cancel(callEndedHandler);
  Twilio.Device.disconnect(callEndedHandler);
  Twilio.Device.error(handleDeviceError);
  Twilio.Device.offline(handleDeviceOffline);















  // function updateCallerIdString(fromNumber) {
  //   console.log(fromNumber);
  //   if (fromNumber.startsWith('client:')) {
  //     callerIdString = fromNumber.slice(7);
  //     // if (fromNumber.endsWith('conference')) {
  //     //   callerIdString = callerIdString.slice(0, callerIdString.length - 10);
  //     // }
  //     updateCallStatus("Incoming call: " + callerIdString);
  //   }
  //   else {
  //     let paths = ['callerid'];
  //     let params = {
  //       number: fromNumber,
  //     };
  //     let url = createUrl(baseUrl, paths, params);
  //
  //     $.post(url, function(numberData) {
  //       console.log(JSON.stringify(numberData));
  //       console.log(numberData);
  //       console.log(numberData !== null);
  //       if (numberData != null) {
  //
  //         console.log(numberData.nationalFormat);
  //         console.log(numberData.callerName);
  //
  //         var nationalFormat = numberData.nationalFormat;
  //         var callerName = numberData.callerName ? numberData.callerName.caller_name : 'Anonymous';
  //         callerIdString = (callerName ? callerName + ' ' : '') + nationalFormat;
  //         console.log(callerIdString);
  //         updateCallStatus("Incoming call: " + callerIdString);
  //       }
  //       else {
  //         callerIdString = fromNumber;
  //         updateCallStatus("Incoming call: " + callerIdString);
  //       }
  //     });
  //   }
  //
  // }





















  agentPresencesRef.once('value', initPresences);
  agentPresencesRef.on('value', handlePresencesChange);
  agentStatusesRef.on('value', handleAgentStatusChange);
  sipMapRef.on('value', handleSipMapChange);

  //callerIdRef.on('value', updateCallerId);

























//////// Helpers //////////

  function sendDigits(event) {
    console.log(event.key);
    let sendableChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '*', '#'];
    if (sendableChars.includes(event.key) && currentConnection){
      currentConnection.sendDigits(event.key);
    }
  }


  function agentClickHandler(event) {
  ///COMMENT OUT
    var agentId = event.data.agentId;
    //disableConnectButtons(true);
    fetchToken(agentId);
  /////
  }

  function fetchToken(agentId) {
    console.log('fetching token');

    let paths = ['token'];
    let params = {
      agentId: agentId,
    };
    let url = createUrl(baseUrl, paths, params);

    let onSuccess = function(data) {
      console.log('token callback');
      origAgentId = agentId;
      currentAgentId = sipMap[agentId] ? sipMap[agentId] : agentId;
      connectClient(data.token);
      agentPresencesRef.update({
        [origAgentId]: $statusSelector.val(),
      });
      agentStatusesRef.once('value', handleAgentStatusChange);

      if (currentAgentId.startsWith('sip:')) {
        $answerCallButton.prop('disabled', true);
        $hangupCallButton.prop('disabled', true);
        $outboundCnt.addClass('hidden');
        $speakerSelectorCntr.addClass('hidden');
      }
    }

    $.ajax({
      type: "POST",
      url: url,
      success: onSuccess,
      dataType: 'json'
    });
  }


  function connectClient(token) {
    Twilio.Device.setup(token, {debug: true});
  }


  function agentConnectedHandler(agentId) {
    $('#connect-agent-row').addClass('hidden');
    $('#connected-agent-row').removeClass('hidden');
    updateCallStatus("Connected as: " + agentId);
  }


  function handleDeviceChange(e) {
    console.log('in handleDeviceChange');

    let oldRingtoneDeviceId = $ringtoneSelector.val();
    let oldSpeakerDeviceId = $speakerSelector.val();

    $ringtoneSelector.empty();
    $speakerSelector.empty();
    setupSpeakerOptions();

    let oldRingtoneIdExists = false;
    let oldSpeakerIdExists = false;
    let availableAudioDevices = Array.from(Twilio.Device.audio.availableOutputDevices.values());
    for (let audioDevice of availableAudioDevices) {
      oldRingtoneIdExists = oldRingtoneIdExists || audioDevice.deviceId == oldRingtoneDeviceId;
      oldSpeakerIdExists = oldSpeakerIdExists || audioDevice.deviceId == oldSpeakerDeviceId;
    }

    if (oldRingtoneIdExists) {
      $ringtoneSelector.val(oldRingtoneDeviceId);
    }
    else {
      $ringtoneSelector.val('default');
    }
    if (oldSpeakerIdExists) {
      $speakerSelector.val(oldSpeakerDeviceId);
    }
    else {
      $speakerSelector.val('default');
    }
  }

  function handleAcceptCall() {
    console.log("in handleAcceptCall");
    //updateCallStatus("In call: " + callerIdString);
    //$answerCallButton.prop('disabled', true);
  }

  function handleConnectionError(error) {
    console.log('in hanldeConnectionError');
    console.log(error.message);
  }

  function handleAnswerCallButtonClick() {
    currentConnection.accept();
  }

  function handleHangupCallButtonClick() {
    Twilio.Device.disconnectAll();
    try {
      currentConnection.ignore();
    }
    catch(error) {}
  }

  function handleDeviceReady(device) {
    updateCallStatus("Ready");
    agentConnectedHandler(origAgentId);
    setupSpeakerOptions();
    Twilio.Device.audio.on('deviceChange', handleDeviceChange);
    Twilio.Device.audio.outgoing(false);
  }

  function handleDeviceIncoming(connection) {
    console.log(111);
    if (onHold) {
      connection.ignore();
      return;
    }
    console.log(222);

    currentConnection = connection;
    // $hangupCallButton.prop('disabled', false);
    //$answerCallButton.prop('disabled', false);
    //updateCallerIdString(connection.parameters.From);
    window.addEventListener("beforeunload", preventUnload);
    connection.accept(handleAcceptCall);
    connection.error(handleConnectionError);
  }

  function handleDeviceError(error) {
    console.log("error: " + error.message);
    updateCallStatus("ERROR: " + error.message);
    window.removeEventListener("beforeunload", preventUnload);
    $hangupCallButton.prop('disabled', true);
    $answerCallButton.prop('disabled', true);
    currentConnection = null;
  }

  function callEndedHandler() {
    console.log('in call ended handler');

    $hangupCallButton.prop('disabled', true);
    $answerCallButton.prop('disabled', true);
    currentConnection = null;
    if (!onHold) {
      updateCallStatus("Connected as: " + origAgentId);
    }
  }

  function handleDeviceOffline() {
    console.log("in handleDeviceOffline");
    callEndedHandler();
    fetchToken(origAgentId);
  }

  function dialAgent(e) {

    console.log('dialing agent', currentAgentId, e.data.agentId);

    let paths = ['conference', 'invite', 'agent'];
    let params = {
      fromAgentId: currentAgentId,
      origFromAgentId: origAgentId,
      toAgentId: sipMap[e.data.agentId] ? sipMap[e.data.agentId] : e.data.agentId,
    };
    let url = createUrl(baseUrl, paths, params);
    $.post(url);
  }


  function transferAgent(e) {
    let paths = ['transfer'];
    let params = {
      fromAgentId: currentAgentId,
      toAgentId: sipMap[e.data.agentId] ? sipMap[e.data.agentId] : e.data.agentId,
      origToAgentId: e.data.agentId,
    };
    let url = createUrl(baseUrl, paths, params);
    $.post(url);
  }

  function moveToConference(e) {
    let paths = ['conference'];
    let params = {
      agentId: currentAgentId,
    };
    let url = createUrl(baseUrl, paths, params);

    $.post(url);
  }

  function putCallOnHold() {
    let paths = ['hold'];
    let params = {
      agentId: currentAgentId,
    }
    let url = createUrl(baseUrl, paths, params);
    $.post(url, function() {
      onHold = true;
    });
  }

  function takeCallOffHold() {
    let paths = ['hold', 'unhold'];
    let params = {
      agentId: currentAgentId,
      origAgentId: origAgentId,
    }
    let url = createUrl(baseUrl, paths, params);
    $.post(url, function() {
      onHold = false;
    });
  }

  function updateCallStatus(status) {
    $callStatus.text(status);
  }

  function preventUnload(event) {
    // Most browsers.
    event.preventDefault();
    // Chrome/Chromium based browsers still need this one.
    event.returnValue = "Please don't leave the page while on a call";
  }

  function logout() {
    console.log('logging out');
    $.post(baseUrl + '/login/logout/', function(response) {
      console.log(response);
      setPresenceOffline();
      window.location.assign(baseUrl + '/login/');
    });
  }

  function setPresenceOffline() {
    agentPresencesRef.update({
      [origAgentId]: 'Offline',
    });
  }

  function handleStatusSelectorChange(e) {
    let value = e.target.value;
    agentPresencesRef.update({
      [origAgentId]: value,
    });
  }

  function createUrl(base, paths, params) {
    let url = base;
    for (let path of paths) {
      url += `/${path}`;
    }
    url += '?';
    for (let key in params) {
      url += `${key}=${params[key]}&`;
    }
    return url;
  }

  function handleSpeakerSelectorChange(e) {
    let deviceId = e.target.value;
    console.log(deviceId);
    Twilio.Device.audio.speakerDevices.set(deviceId);
  }

  function handleRingtoneSelectorChange(e) {
    let deviceId = e.target.value;
    console.log(deviceId);
    Twilio.Device.audio.ringtoneDevices.set(deviceId);
  }


  function setupSpeakerOptions() {
    let availableAudioDevices = Array.from(Twilio.Device.audio.availableOutputDevices.values());

    if (availableAudioDevices.length == 0) {
      $ringtoneSelector.AddClass('hidden');
      $speakerSelector.AddClass('hidden');
    }
    else {
      $ringtoneSelector.removeClass('hidden');
      $speakerSelector.removeClass('hidden');

      let defaultDevice = availableAudioDevices.find((audioDevice) => {
        return audioDevice.deviceId == 'default';
      });

      for (let audioDevice of availableAudioDevices) {
        if (audioDevice.deviceId == 'default' || !defaultDevice.label.includes(audioDevice.label)) {
          let label = audioDevice.label.substr(0, audioDevice.label.indexOf(' ('));
          let ringtoneOption = $('<option/>').text(label).attr('value', audioDevice.deviceId);
          let speakerOption = $('<option/>').text(label).attr('value', audioDevice.deviceId);

          $ringtoneSelector.append(ringtoneOption);
          $speakerSelector.append(speakerOption);
        }
      }
    }
  }

  function updatePresenceColors(presences) {
    let $transferButtons = $('.transfer-btn');
    if ($transferButtons) {
      $transferButtons.each((index, transferButton) => {
        $transferButton = $(transferButton);
        let agentId = $transferButton.data('agent-id');
        let status = presences[agentId];
        let color;
        if (status == 'Available') {
          color = '#99D299';
        }
        else if (status == 'Unavailable') {
          color = '#ffe033';
        }
        else {
          color = '#E79492';
        }
        $transferButton.find('.presence-circle').css('background-color', color);
      });
    }
    let $dialInButtons = $('.dial-in-btn');
    if ($dialInButtons) {
      $dialInButtons.each((index, dialInButton) => {
        $dialInButton = $(dialInButton);
        let agentId = $dialInButton.data('agent-id');
        let status = presences[agentId];
        let color;
        if (status == 'Available') {
          color = '#99D299';
        }
        else if (status == 'Unavailable') {
          color = '#FFEF95';
        }
        else {
          color = '#E79492';
        }
        $dialInButton.find('.presence-circle').css('background-color', color);
      });
    }
  }

  function attachOnClickHandlers() {
    let $transferButtons = $('.transfer-btn');
    if ($transferButtons) {
      $transferButtons.each((index, transferButton) => {
        let $transferButton = $(transferButton);
        $transferButton.on('click', { agentId: $transferButton.data('agent-id') }, transferAgent);
      });
    }
    let $dialInButtons = $('.dial-in-btn');
    if ($dialInButtons) {
      $dialInButtons.each((index, dialInButton) => {
        let $dialInButton = $(dialInButton);
        $dialInButton.on('click', { agentId: $dialInButton.data('agent-id') }, dialAgent);
      });
    }
  }

  function addTransferAndDialInButtons(presences) {

    $transferFlexParent = $('#transfer-cnt .flex-parent');
    $dialInFlexParent = $('#dial-in-cnt .flex-parent');

    for (let agentId in presences) {
      if (agentId != origAgentId) {
        let $newTransferBtn = $('<div />').addClass('transfer-btn btn btn-lg btn-primary').data('agent-id', agentId);
        $transferFlexParent.append($newTransferBtn);

        $newTransferPresenceCircle = $('<div />').addClass('presence-circle');
        $newTransferBtn.append($newTransferPresenceCircle);

        $newTransferName = $('<div />').addClass('btn-name').text(agentId);
        $newTransferBtn.append($newTransferName);



        let $newDialInBtn = $('<div />').addClass('dial-in-btn btn btn-lg btn-primary').data('agent-id', agentId);
        $dialInFlexParent.append($newDialInBtn);

        $newDialPresenceCircle = $('<div />').addClass('presence-circle');
        $newDialInBtn.prepend($newDialPresenceCircle);

        $newDialName = $('<div />').addClass('btn-name').text(agentId);
        $newDialInBtn.append($newDialName);
      }
    }
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

    var body = {
      toNumber: toNumber,
      fromAgentId: currentAgentId
    };
    currentConnection = Twilio.Device.connect(body);

    //callerIdString = toNumber;
    //updateCallStatus("In Call: " + callerIdString);
    //$hangupCallButton.prop('disabled', false);
  }

  function dialIntoConference() {
    var rawToNumber = $confCallDialInput.val();
    var toNumber = '';
    for (var i = 0; i < rawToNumber.length; i++) {
      var char = rawToNumber[i];
      if (!isNaN(parseInt(char))) {
        toNumber += char;
      }
    }

    console.log('dialing into conference number', toNumber);


    let paths = ['conference', 'invite', 'number'];
    let params = {
      fromAgentId: currentAgentId,
      toNumber: toNumber,
    };
    let url = createUrl(baseUrl, paths, params);
    $.post(url);
  }

  function initPresences(snapshot) {
    let presences = snapshot.val();
    if (presences) {
      addTransferAndDialInButtons(presences);
      attachOnClickHandlers();
      updatePresenceColors(presences);
    }
  }

  function handlePresencesChange(snapshot) {
    let presences = snapshot.val();
    if (presences) {
      updatePresenceColors(presences);
    }
  }

  function handleSipMapChange(snapshot) {
    console.log("in handleSipMapChange");

    if (snapshot) {
      sipMap = snapshot.val();
    }

  }

  function handleAgentStatusChange(snapshot) {
    console.log("in handleAgentStatusChange");

    let statuses = snapshot.val();
    console.log(statuses);

    if (statuses && statuses[currentAgentId]) {
      let myStatus = statuses[currentAgentId];

      window.addEventListener("beforeunload", preventUnload);

      $outboundCnt.addClass('hidden');

      if (myStatus.currentCallName) {
        updateCallStatus("In call: " + myStatus.currentCallName + " " + myStatus.currentCallNumber);
      }
      else if (myStatus.incomingCallName) {
        updateCallStatus("Incoming call: " + myStatus.incomingCallName + (myStatus.incomingCallNumber ? " " + myStatus.incomingCallNumber : ""));
        $hangupCallButton.prop('disabled', currentAgentId.startsWith('sip:'));
        $answerCallButton.prop('disabled', currentAgentId.startsWith('sip:'));
      }
      else if (myStatus.outgoingCallName) {
        updateCallStatus("Outgoing call: " + myStatus.outgoingCallName + " " + myStatus.outgoingCallNumber);
        $hangupCallButton.prop('disabled', currentAgentId.startsWith('sip:'));
      }

      if (myStatus.currentParentSid || myStatus.holdSid) {
        $transferCnt.removeClass('hidden');
        $answerCallButton.prop('disabled', true);
      }
      else if (myStatus.incomingCallSid) {
        $transferCnt.removeClass('hidden');
      }
      else  {
        $transferCnt.addClass('hidden');
      }

      if (myStatus.currentParentSid) {
        $startConferenceButton.removeClass('hidden');
      }
      else  {
        $startConferenceButton.addClass('hidden');
      }

      if (myStatus.currentParentSid) {
        $holdButton.removeClass('hidden');
      }
      else {
        $holdButton.addClass('hidden');
      }

      console.log('myStatus');
      console.log(myStatus);

      if (myStatus.holdSid) {
        console.log(123);
        $offHoldButton.removeClass('hidden');
        onHold = true;
        updateCallStatus(myStatus.holdName + " " + myStatus.holdNumber + " is on hold");
      }
      else  {
        $offHoldButton.addClass('hidden');
        onHold = false;
      }

      if (myStatus.conferenceName) {
        $dialInCnt.removeClass('hidden');
        $outboundConfCallCnt.removeClass('hidden');
        updateCallStatus("In conference");
        $answerCallButton.prop('disabled', true);
      }
      else  {
        $dialInCnt.addClass('hidden');
        $outboundConfCallCnt.addClass('hidden');
      }
    }
    else {
      window.removeEventListener("beforeunload", preventUnload);
      if (!currentAgentId.startsWith('sip:')) {
        $outboundCnt.removeClass('hidden');
      }
      $transferCnt.addClass('hidden');
      $dialInCnt.addClass('hidden');
      $outboundConfCallCnt.addClass('hidden');
      $startConferenceButton.addClass('hidden');
      onHold = false;
      $holdButton.addClass('hidden');
      $offHoldButton.addClass('hidden');
      callEndedHandler();
    }
  }

  // function updateCallerId(snapshot) {
  //   callerIds = snapshot.val();
  // }

  $window.on('click', function() {
    console.log('origAgentId', origAgentId);
    console.log('currentAgentId', currentAgentId);

  })



});
