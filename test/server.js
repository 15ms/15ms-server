const path = require('path');
const { Server } = require('../lib');

module.exports = new Server({
  secure: {
    secret: '9oW23r'
  },
  applications: [
    { route: 'test', entry: path.join(__dirname, './app-test.js') }
  ]
});
