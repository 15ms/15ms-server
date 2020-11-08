module.exports = {
  guest: {
    '/*': (path, query) => { 
      return `guest /* ${path} ${JSON.stringify(query)}`;
    },

    '/more': () => {
      return 'guest /more';
    }
  },

  owner: {
    '/only': (path, query, body) => {
      return `owner ${path} ${JSON.stringify(query)} ${JSON.stringify(body)}`;
    },

    '/fail/1': () => {
      const error = new Error('throw directly');
      error.stack = undefined;
      throw error;
    },

    '/fail/2': () => {
      const error = new Error('return error');
      error.code = 2;
      error.stack = undefined;
      return error;
    }
  }
};