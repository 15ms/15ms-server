# 15ms-server

[![Build Status](https://travis-ci.com/15ms/15ms-server.svg?branch=master)](https://travis-ci.com/15ms/15ms-server)
[![Coverage Status](https://coveralls.io/repos/github/15ms/15ms-server/badge.svg?branch=master)](https://coveralls.io/github/15ms/15ms-server?branch=master)

A secure extensible single-owner API server.

## Getting Started

GET for guest access.
POST for owner access.

todo - write more design

## Usage

```sh
npm install --save @15ms/server
```

```javascript
const { Server } = require('@15ms/server');

const server = new Server({
  secure: {
    secret: 'your-secret'
  },
  plugins: [
    { routeName: 'your-plugin-name', moduleSrc: 'path-of-module' }
  ]
});

server.listen(8080);
```

```sh
curl http://localhost:8080/your-plugin-name/your-api-path
curl -X POST http://localhost:8080/your-plugin-name/your-api-path?hash=...

# also you can use @15ms/client to send request
```