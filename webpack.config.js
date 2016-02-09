var path = require('path');
var webpack = require('webpack');

module.exports = {
  devtool: 'eval',
  entry: {
    index: [
      './src/app'
    ]
  },
  output: {
    path: path.join(__dirname, 'dist/lib'),
    filename: 'app.js',
    publicPath: '/dist/lib/'
  },
  plugins: [
    new webpack.IgnorePlugin('fs'),
    new webpack.IgnorePlugin('csv')
  ],
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel'],
      include: path.join(__dirname, 'src')
    }]
  }
};
