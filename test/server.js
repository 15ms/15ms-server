const path = require('path');
const { Server } = require('../lib');

module.exports = new Server({
  secure: {
    secret: '9oW23r'
  },
  plugins: [
    { routeName: 'test', moduleSrc: path.join(__dirname, './plugin-test.js') }
  ]
});
