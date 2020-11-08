/* eslint-disable global-require */

const { OutgoingMessage } = require('httply');

function findAction(actions, path) {
  return actions[path] || actions['/*'];
}

function playAction(action, path, query, body) {
  if (!action) {
    return new OutgoingMessage({ status: 404, content: 'not found' });
  }
  if (typeof action === 'function') {
    return action(path, query, body);
  }
  return action;
}

class Application {
  constructor(entry) {
    const o = require(entry);
    this.guestRoutes = o.guest;
    this.ownerRoutes = o.owner;
  }

  runAsGuest(path, query) {
    const action = findAction(this.guestRoutes, path);
    return playAction(action, path, query);
  }

  runAsOwner(path, query, body) {
    const action = findAction(this.ownerRoutes, path);
    return playAction(action, path, query, body);
  }
}

module.exports = Application;
