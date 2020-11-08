const path = require('path');
const { Server } = require('../lib');

const server = new Server({
  secure: {
    secret: 'aXbC0T'
  },
  applications: [
    { route: 'play', entry: path.join(__dirname, 'app-play.js') }
  ]
});

server.listen(8080);
