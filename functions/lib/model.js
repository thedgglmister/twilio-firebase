'use strict';

var { admin } = require('./admin');
var agentStatusesRef = admin.database().ref().child('agentStatuses');
var agentsRef = admin.database().ref().child('agents');
var agentPresencesRef = admin.database().ref().child('agentPresences');


var updateCurrentCallSids = function(agentId, parentSid, childSid) {
  console.log('in update current call sids');
  console.log('parentSid: ', parentSid);
  console.log('childSid: ', childSid);

  let agentStatusRef = agentStatusesRef.child(agentId);
  // return agentStatusRef.once('value')
  //         .then((snapshot) => {
  //           let doc = snapshot.val();
            let updates = {};
            updates.currentParentSid = parentSid;
            if (childSid !== undefined) {
              updates.currentChildSid = childSid;
            }
            //console.log('updaetes: ', updates);
            return agentStatusRef.update(updates)
            // .catch((error) => {
            //   console.log(error);
            // });
          // })
          // .catch((error) => {
          //   console.log(error);
          // });
}

var updateHoldSid = function(agentId, parentSid) {
  console.log('in update hold sid');

  let agentStatusRef = agentStatusesRef.child(agentId);
  // return agentStatusRef.once('value')
  //         .then((snapshot) => {
  //           let doc = snapshot.val();
            let updates = {
              holdSid: parentSid
            };
            return agentStatusRef.update(updates)
            // .catch((error) => {
            //   console.log(error);
            // });
          // })
          // .catch((error) => {
          //   console.log(error);
          // });
}

var findAgentStatus = function(agentId) {
  console.log('in find agent status');
  console.log(agentId);

  var agentStatusRef = agentStatusesRef.child(agentId);
  //console.log(agentStatusRef);

  return agentStatusRef.once('value').then((snapshot) => {
    //console.log(snapshot);
    console.log(123);
    console.log(snapshot.val());
    console.log(456);
    return snapshot.val() ? snapshot.val() : {};
  });
}

var updateAgentConference = function(agentId, conferenceName) {
  console.log('in update agent conference');
  let agentStatusRef = agentStatusesRef.child(agentId);
  // return agentStatusRef.once('value')
  //         .then((snapshot) => {
  //           let doc = snapshot.val();
            let updates = {
              conferenceName: conferenceName,
              currentParentSid: null,
              currentChildSid: null,
            };
            return agentStatusRef.update(updates)
            // .catch((error) => {
            //   console.log(error);
            // });
          // })
          // .catch((error) => {
          //   console.log(error);
          // });
}



var findConferenceStatusFromGroup = function(agentIds, parentSid) {
  console.log('in find conference status from group');

  return agentStatusesRef.once('value')
    .then((snapshot) => {
      let doc = snapshot.val();
      console.log('doc: ', doc);
      for (let agent in doc) {
        if (agentIds.includes(agent) && doc[agent].conferenceName != null && doc[agent].conferenceName == parentSid) {
          return true;
        }
      }
      return false;
    });
}









///////////////////////////////////////////////////////////////////////////


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



// var findAgentStatus = function(agentId) {
//   var agentRef = agentsRef.child(agentId);

//   return agentRef.once('value').then((snapshot) => snapshot.val());
// }


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

module.exports.updateCurrentCallSids = updateCurrentCallSids;
module.exports.updateHoldSid = updateHoldSid;
module.exports.updateAgentConference = updateAgentConference;
module.exports.findConferenceStatusFromGroup = findConferenceStatusFromGroup;
