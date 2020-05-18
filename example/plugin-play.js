module.exports = {
  events: {

  },

  routes: {
    guest: {
      '/*': (path) => { 
        return `guest /* ${path}`;
      },
      '/help': () => {
        return '/help';
      },
    },
  
    owner: {
      '/*': (path, query, body) => {
        return `owner /* ${path} ${JSON.stringify(body)}`;
      },
    }
  }
};