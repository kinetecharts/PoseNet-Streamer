//Store server config values here

const config = {
  app: {
    port: 8080,
  },
  broadcast: { //defaults
    enabled: false,
    ip: '127.0.0.1',
    port: 9500,
  },
  favicon: __dirname + './../dist/images/favicon.ico',
  copy: {
    html: {
      src: './src/html/index.html',
      dest: './dist/index.html',
    },
    fonts: {
      src: './src/fonts',
      dest: './dist/fonts',
    },
    images: {
      src: './src/images',
      dest: './dist/images',
    },
    models: {
      src: './src/models',
      dest: './dist/models',
    },
    textures: {
      src: './src/textures',
      dest: './dist/textures',
    },
  },
};

module.exports = config;
