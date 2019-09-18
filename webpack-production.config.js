const webpack = require('webpack');
const { resolve } = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');

const config = require('./server/config.js');

module.exports = {
	context: resolve(__dirname, 'src'),
	entry: [
		'./index.jsx',
		// the entry point of our app
	],
	output: {
		filename: 'bundle.js',
		// the output bundle

		path: resolve(__dirname, 'dist'),

		publicPath: '/'
		// necessary for HMR to know where to load the hot update chunks
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
}
