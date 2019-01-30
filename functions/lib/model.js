'use strict';

var { admin } = require('./admin');
var agentsRef = admin.database().ref().child('agents');
var agentPresencesRef = admin.database().ref().child('agentPresences');

var updateAgentStatus = function(agentIds, parentSid, movingToConference) {

  return agentsRef.once('value')
          .then((snapshot) => {
            let doc = snapshot.val();
            let updates = {};
            for (let agentId of agentIds) {
              updates[agentId] = doc[agentId] != null ? doc[agentId] : {};
              updates[agentId].parentSid = parentSid;
              updates[agentId].movingToConference = movingToConference;
            }
            return agentsRef.update(updates)
            .catch((error) => {
              console.log(error);
            });
          })
          .catch((error) => {
            console.log(error);
          });
}


var updateCurrentParentSid = function(agentId, parentSid, movingToConference) {
  var agentRef = agentsRef.child(agentId);

  return agentRef.update({
    parentSid: parentSid,
    currentParentSid: parentSid,
    movingToConference: movingToConference ? true : false,
  }).then(() => {
    return agentRef.once('value').then((snapshot) => snapshot.val());
  }).catch((error) => {
    console.log(error);
  });
}



var findAgentStatus = function(agentId) {
  var agentRef = agentsRef.child(agentId);

  return agentRef.once('value').then((snapshot) => snapshot.val());
}


var findAgentConferenceStatus = function(agentIds, parentSid) { //make sure and array always getting passed in

  return agentsRef.once('value').then((snapshot) => {
    let doc = snapshot.val();
    for (let agent in doc) {
      if (agentIds.includes(agent) && doc[agent].currentParentSid == parentSid && doc[agent].movingToConference) {
        return true;
      }
    }
    return false;
  });
}


var updateAgentPresence = function(agentId, presenceStatus) {
  return agentPresencesRef.update({
      [agentId]: presenceStatus,
    })
    .then(() => {
      return agentPresencesRef.once('value').then((snapshot) => snapshot.val());
    })
    .catch((error) => {
      console.log(error);
    });
}

//findAgentConferenceStatus('lcampbell', 'parentSIDTest4').then((doc) => console.log(doc));

module.exports.updateAgentStatus = updateAgentStatus;
module.exports.findAgentStatus = findAgentStatus;
module.exports.findAgentConferenceStatus = findAgentConferenceStatus;
module.exports.updateCurrentParentSid = updateCurrentParentSid;
module.exports.updateAgentPresence = updateAgentPresence;
