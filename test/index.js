const assert = require('assert');
const fetch = require('node-fetch');

const server = require('./server');
const secure = server.secure;

function request(url, options = {}) {
  return fetch('http://localhost:8080' + url, options);
}

describe('15ms-server', () => {
  it('create server', () => {
    return new Promise((resolve) => {
      server.listen(8080, resolve);
    });
  });

  it('guest access - plugin not found', () => {
    return request('/abcd')
      .then(response => {
        assert.equal(response.status, 404);
        return response.text();
      })
      .then(text => {
        assert.equal(text, 'not found');
      });
  });

  it('guest access - plugin found & specific route', () => {
    return request('/test/more')
      .then(response => response.text())
      .then(text => {
        assert.equal(text, 'guest /more');
      });
  });

  it('guest access - plugin found & wildcard route & query parse', () => {
    return request('/test/other?a=1')
      .then(response => response.text())
      .then(text => {
        assert.equal(text, 'guest /* /other {"a":"1"}');
      });
  });

  it('owner access - plugin found & not json', () => {
    return request('/test/other?a=1', {
      method: 'POST',
      body: 'abcdef'
    })
      .then(response => {
        assert.equal(response.status, 400);
        return response.text();
      })
      .then(text => {
        assert.equal(text, 'only accept json body');
      });
  });

  it('owner access - plugin found & unauthorized', () => {
    const hash = secure.createHMAC({ path: '/other', body: {} });
    return request(`/test/other`, {
      method: 'POST'
    })
      .then(response => {
        assert.equal(response.status, 401);
        return response.text();
      })
      .then(text => {
        assert.equal(text, 'unauthorized');
      });
  });

  it('owner access - plugin found & route not found', () => {
    const hash = secure.createHMAC({ path: '/other', body: {} });
    return request(`/test/other?hash=${hash}`, {
      method: 'POST'
    })
      .then(response => {
        assert.equal(response.status, 404);
        return response.text();
      })
      .then(text => {
        assert.equal(text, 'not found');
      });
  });

  it('owner access - plugin found & route found & body parse', () => {
    const body = { a: 1 };
    const hash = secure.createHMAC({ path: '/only', body });
    return request(`/test/only?hash=${hash}`, {
      method: 'POST',
      body: JSON.stringify(body)
    })
      .then(response => response.text())
      .then(text => {
        assert.equal(text, JSON.stringify({ state: 0, model: `owner /only {"hash":"${hash}"} {"a":1}` }));
      });
  });

  it('owner access - plugin found & throw error', () => {
    const hash = secure.createHMAC({ path: '/fail/1', body: {} });
    return request(`/test/fail/1?hash=${hash}`, {
      method: 'POST'
    })
      .then(response => {
        assert.equal(response.status, 200);
        return response.text();
      })
      .then(text => {
        assert.equal(text, JSON.stringify({ state: -1, error: 'throw directly' }));
      });
  });

  it('owner access - plugin found & throw error', () => {
    const hash = secure.createHMAC({ path: '/fail/2', body: {} });
    return request(`/test/fail/2?hash=${hash}`, {
      method: 'POST'
    })
      .then(response => {
        assert.equal(response.status, 200);
        return response.text();
      })
      .then(text => {
        assert.equal(text, JSON.stringify({ state: -1, error: 'return error' }));
      });
  });
});
