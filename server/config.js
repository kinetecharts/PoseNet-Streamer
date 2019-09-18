//Store server config values here

const config = {
  app: {
    port: 8081,
  },
  websocket: { //defaults
    enabled: false,
    ip: '127.0.0.1',
    port: 9500,
  },
  favicon: __dirname + './../dist/images/favicon.ico',
  copy: {
    all: {
      src: './src/static/',
    },
    html: {
      src: './src/html/index.html',
      dest: './dist/index.html',
    },
  },
};

module.exports = config;
