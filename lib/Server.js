/* eslint-disable global-require */

const http = require('http');
const { IncomingMessage, OutgoingMessage } = require('httply');
const Secure = require('@15ms/secure');
const Plugin = require('./Plugin');

function parseRoute(url) {
  const parts = url.split('/').filter(Boolean);
  const name = parts[0];
  const path = url
    .replace(new RegExp(`^\\/${name}`), '')
    .replace(/\?.+$/, '')
    || '/';
  return { name, path };
}

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

class Server {
  constructor(options = {}) {
    // console.log(options);
    this.secure = new Secure(options.secure);
    this.server = http.createServer(this.handleRequest.bind(this));
    this.plugins = {};
    if (Array.isArray(options.plugins)) {
      options.plugins.forEach(spec => this.loadPlugin(spec));
    }
  }

  loadPlugin(spec) {
    try {
      const realSpec = { routeName: '', moduleSrc: '' };
      if (typeof spec === 'string') {
        realSpec.moduleSrc = spec;
        realSpec.routeName = spec;
      } else if (typeof spec === 'object') {
        realSpec.routeName = spec.routeName;
        realSpec.moduleSrc = spec.moduleSrc || spec.routeName;
      }
      if (!realSpec.routeName || !realSpec.moduleSrc) {
        throw new Error('invalid plugin spec');
      }
      const plugin = new Plugin(require(realSpec.moduleSrc));
      if (plugin) {
        this.plugins[realSpec.routeName] = plugin;
      }
    } catch (error) {
      console.error(error);
    }
  }

  async handleRequest(request, response) {
    const timingA = Date.now();
    const incoming = new IncomingMessage(request);
    const { url, method, query } = incoming;
    console.log(`15ms <= <${method}> ${url}`);
    const quickReply = (outgoing) => {
      outgoing.sendBy(response);
      const timingB = Date.now();
      const elapsedTime = timingB - timingA;
      console.log(`15ms => <${outgoing.status}> | ${elapsedTime}ms >>`, outgoing.content);
      return elapsedTime;
    };

    // skip not allowed methods
    if (method !== 'GET' && method !== 'POST') {
      return quickReply(new OutgoingMessage({ status: 405, content: 'method not allowed' }));
    }

    // output self-detection
    if (/^\/(\?|$)/.test(url)) {
      // todo - more info about server
      return quickReply(new OutgoingMessage({ status: 200, content: '15ms' }));
    }

    // find plugin by route name
    const route = parseRoute(url);
    const plugin = this.plugins[route.name];
    if (!plugin) {
      console.warn('plugin not found');
      return quickReply(new OutgoingMessage({ status: 404, content: 'not found' }));
    }

    // read POST body and verify sign
    if (method === 'POST') {
      try {
        const rawBody = await incoming.rawBody || '{}';
        incoming.body = JSON.parse(rawBody);
      } catch (error) {
        console.error(error);
        return quickReply(new OutgoingMessage({ status: 400, content: 'only accept json body' }));
      }
      if (!this.secure.verifyHMAC({ path: route.path, body: incoming.body }, query.hash)) {
        return quickReply(new OutgoingMessage({ status: 401, content: 'unauthorized' }));
      }
    }

    // handle by plugin
    let result = null;
    try {
      if (incoming.method === 'POST') {
        result = await plugin.runAsOwner(route.path, incoming.query, incoming.body);
      } else {
        result = await plugin.runAsGuest(route.path, incoming.query);
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
    return quickReply(result);
  }

  listen(port, callback) {
    this.server.listen(port, () => {
      console.log(`15ms-server is listening at ${port}`);
      if (callback) callback();
    });
  }
}

module.exports = Server;
