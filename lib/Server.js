/* eslint-disable global-require */

const http = require('http');
const { IncomingMessage, OutgoingMessage } = require('httply');
const Secure = require('@15ms/secure');
const Application = require('./Application');

function buildAPIReply(o) {
  if (o instanceof Error) {
    return {
      state: o.code || -1,
      error: o.message,
      stack: o.stack
    };
  }
  return { state: 0, model: o };
}

function parseRoute(url) {
  const parts = url.split('/').filter(Boolean);
  const name = parts[0];
  const path = url.slice(name.length + 1).replace(/(\?|#).*$/, '') || '/';
  return { name, path };
}

class Server {
  constructor(options = {}) {
    // console.log(options);
    this.secure = new Secure(options.secure);
    this.server = http.createServer(this.handleRequest.bind(this));
    this.applications = {};
    if (Array.isArray(options.applications)) {
      options.applications.forEach(spec => this.loadApplication(spec));
    }
  }

  loadApplication(spec) {
    try {
      if (!spec.route) {
        throw new Error('application route required');
      }
      if (!spec.entry) {
        throw new Error('application entry required');
      }
      const application = new Application(spec.entry);
      if (application) {
        this.applications[spec.route] = application;
      }
    } catch (error) {
      console.error(error);
    }
  }

  async handleRequest(request, response) {
    const timingA = Date.now();
    const reply = (outgoing) => {
      outgoing.sendBy(response);
      const timingB = Date.now();
      const elapsedTime = timingB - timingA;
      console.log(`15ms => <${outgoing.status}> | ${elapsedTime}ms >>`, outgoing.content);
      return elapsedTime;
    };

    // parse incoming message
    const incoming = new IncomingMessage(request);
    const { url, method, query } = incoming;
    console.log(`15ms <= <${method}> ${url}`);

    // skip not allowed methods
    if (method !== 'GET' && method !== 'POST') {
      return reply(new OutgoingMessage({ status: 405, content: 'method not allowed' }));
    }

    // output self-detection
    if (/^\/(\?|$)/.test(url)) {
      // TODO - more info about server
      return reply(new OutgoingMessage({ status: 200, content: '15ms' }));
    }

    // find application by name
    const route = parseRoute(url);
    const application = this.applications[route.name];
    if (!application) {
      console.warn('application not found');
      return reply(new OutgoingMessage({ status: 404, content: 'not found' }));
    }

    // read POST body and verify sign
    if (method === 'POST') {
      try {
        const rawBody = await incoming.rawBody || '{}';
        incoming.body = JSON.parse(rawBody);
      } catch (error) {
        console.error(error);
        return reply(new OutgoingMessage({ status: 400, content: 'only accept json body' }));
      }
      if (!this.secure.verifyHMAC({ path: route.path, body: incoming.body }, query.hash)) {
        return reply(new OutgoingMessage({ status: 401, content: 'unauthorized' }));
      }
    }

    // handle by application
    let result = null;
    try {
      if (incoming.method === 'POST') {
        result = await application.runAsOwner(route.path, incoming.query, incoming.body);
      } else {
        result = await application.runAsGuest(route.path, incoming.query);
      }
    } catch (error) {
      result = error;
    }
    if (!(result instanceof OutgoingMessage)) {
      if (incoming.method === 'POST') {
        result = new OutgoingMessage({ status: 200, content: buildAPIReply(result) });
      } else {
        result = new OutgoingMessage({ status: 200, content: result });
      }
    }
    return reply(result);
  }

  listen(port, callback) {
    this.server.listen(port, () => {
      console.log(`15ms-server is listening at ${port}`);
      if (callback) callback();
    });
  }
}

module.exports = Server;
