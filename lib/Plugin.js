const { OutgoingMessage } = require('httply');

class Plugin {
  constructor(model) {
    // todo - lint model
    this.events = model.events;
    this.routes = model.routes;
  }

  runAs(role, path, query, body) {
    const table = this.routes[role];
    const route = table[path] || table['/*'];
    if (!route) {
      return new OutgoingMessage({ status: 404, content: 'not found' });
    }
    if (typeof route === 'function') {
      return route(path, query, body);
    }
    console.warn('static output');
    return route;
  }

  runAsGuest(path, query) {
    return this.runAs('guest', path, query);
  }

  runAsOwner(path, query, body) {
    return this.runAs('owner', path, query, body);
  }
}

module.exports = Plugin;
