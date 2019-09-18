const { resolve } = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');
const fs = require('fs');

const config = require('./server/config.js');

module.exports = {
  context: resolve(__dirname, 'src'),

  entry: [
    'babel-polyfill',
    
    'react-hot-loader/patch',
    // activate HMR for React

    'webpack-dev-server/client?http://0.0.0.0:'+config.app.port,
    // bundle the client for webpack-dev-server
    // and connect to the provided endpoint

    'webpack/hot/only-dev-server',
    // bundle the client for hot reloading
    // only- means to only hot reload for successful updates

    './index.jsx',
    // the entry point of our app
  ],
  output: {
    filename: 'js/bundle.js',
    // the output bundle

    path: resolve(__dirname, 'dist'),

    publicPath: '/',
    // necessary for HMR to know where to load the hot update chunks
  },

  devtool: 'inline-source-map',

  devServer: {
    hot: true,
    // enable HMR on the server

    contentBase: resolve(__dirname, 'dist'),
    // match the output path

    publicPath: '/',
    // match the output `publicPath`

    host: '0.0.0.0',
    public: 'http://0.0.0.0',
    port: config.app.port,
    disableHostCheck: true,

    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
    },
    https: {
      key: fs.readFileSync('./certs/TCB-MBP.local-key.pem', 'utf8'),
      cert: fs.readFileSync('./certs/TCB-MBP.local.pem', 'utf8'),
      ca: fs.readFileSync('/Users/jerknose/Library/Application Support/mkcert/rootCA.pem'),
      // key: fs.readFileSync('./certs/private.key', 'utf8'),
      // cert: fs.readFileSync('./certs/private.crt', 'utf8'),
      // ca: fs.readFileSync('./certs/private.pem', 'utf8'),
    }

    
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.css$/,
        loader: 'style-loader',
      }, {
        test: /\.css$/,
        loader: 'css-loader',
      },
      {
        test: /\.(eot|ttf|woff|woff2)$/,
        loader: 'file-loader?name=fonts/[name].[ext]',
      },
      {
        test: /\.(jpe?g|gif|svg)$/i,
        use: [
          'url-loader?name=images/[name].[ext]&limit=10000',
          'img-loader?name=images/[name].[ext]',
        ],
      },
      {
        test: /\.(png)$/i,
        use: [
          'base64-image-loader',
        ],
      },
      {
          test: /\.glsl$/,
          loader: 'webpack-glsl-loader'
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.css'],
  },
  optimization: {
    splitChunks: {
      chunks: 'async',
      minSize: 30000,
      maxSize: 0,
      minChunks: 1,
      maxAsyncRequests: 5,
      maxInitialRequests: 3,
      automaticNameDelimiter: '~',
      automaticNameMaxLength: 30,
      name: true,
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          filename: '[name].bundle.js',
          priority: -10
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        }
      }
    }
  },
  plugins: [
    new WriteFilePlugin(),
    new CopyWebpackPlugin([
      {
        from: resolve(__dirname, config.copy.all.src),
        to: resolve(__dirname, './dist/'),
      },
      {
        from: resolve(__dirname, config.copy.html.src),
        to: resolve(__dirname, config.copy.html.dest),
      },
    ]),

    new webpack.HotModuleReplacementPlugin(),
    // enable HMR globally

    new webpack.NamedModulesPlugin(),
    // prints more readable module names in the browser console on HMR updates

    // new ExtractTextPlugin('styles.css')
    // export css to separate file

    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      THREE: 'three',
      'window.THREE': 'three',
      TWEEN: 'tween.js',
      'window.TWEEN': 'tween.js',
      React: 'react',
      _: 'lodash',
    })
  ],
};
