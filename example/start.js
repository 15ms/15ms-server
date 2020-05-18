const path = require('path');
const { Server } = require('../lib');

const server = new Server({
  secure: {
    secret: 'aXbC0T'
  },
  plugins: [
    { routeName: 'play', moduleSrc: path.join(__dirname, 'plugin-play.js') }
  ]
});

server.listen(8080);
