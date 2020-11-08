const assert = require('assert');
const fetch = require('node-fetch');

const server = require('./server');
const secure = server.secure;

function request(url, options = {}) {
  return fetch('http://localhost:8080' + url, options);
}

function assertStatus(status) {
  return (response) => {
    assert.strictEqual(response.status, status);
    return response;
  };
}

function assertText(expectedText) {
  return (response) => {
    return response.text().then(text => {
      assert.strictEqual(text, expectedText);
    });
  };
}

describe('15ms-server', () => {
  it('create server', () => {
    return new Promise((resolve) => {
      server.listen(8080, resolve);
    });
  });

  it('guest access - application not found', () => {
    return request('/abcd')
      .then(assertStatus(404))
      .then(assertText('not found'));
  });

  it('guest access - application found & specific route', () => {
    return request('/test/more')
    .then(assertStatus(200))
    .then(assertText('guest /more'));
  });

  it('guest access - application found & wildcard route & query parse', () => {
    return request('/test/other?a=1')
      .then(assertStatus(200))
      .then(assertText('guest /* /other {"a":"1"}'));
  });

  it('owner access - application found & not json', () => {
    return request('/test/other?a=1', {
      method: 'POST',
      body: 'abcdef'
    })
      .then(assertStatus(400))
      .then(assertText('only accept json body'));
  });

  it('owner access - application found & unauthorized', () => {
    const hash = secure.createHMAC({ path: '/other', body: {} });
    return request(`/test/other`, {
      method: 'POST'
    })
      .then(assertStatus(401))
      .then(assertText('unauthorized'));
  });

  it('owner access - application found & route not found', () => {
    const hash = secure.createHMAC({ path: '/other', body: {} });
    return request(`/test/other?hash=${hash}`, {
      method: 'POST'
    })
      .then(assertStatus(404))
      .then(assertText('not found'));
  });

  it('owner access - application found & route found & body parse', () => {
    const body = { a: 1 };
    const hash = secure.createHMAC({ path: '/only', body });
    return request(`/test/only?hash=${hash}`, {
      method: 'POST',
      body: JSON.stringify(body)
    })
      .then(assertStatus(200))
      .then(assertText(JSON.stringify({ state: 0, model: `owner /only {"hash":"${hash}"} {"a":1}` })));
  });

  it('owner access - application found & throw error 1', () => {
    const hash = secure.createHMAC({ path: '/fail/1', body: {} });
    return request(`/test/fail/1?hash=${hash}`, {
      method: 'POST'
    })
      .then(assertStatus(200))
      .then(assertText(JSON.stringify({ state: -1, error: 'throw directly' })));
  });

  it('owner access - application found & throw error 2', () => {
    const hash = secure.createHMAC({ path: '/fail/2', body: {} });
    return request(`/test/fail/2?hash=${hash}`, {
      method: 'POST'
    })
      .then(assertStatus(200))
      .then(assertText(JSON.stringify({ state: 2, error: 'return error' })));
  });
});
