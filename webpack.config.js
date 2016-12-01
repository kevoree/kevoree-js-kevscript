'use strict';

var path = require('path');
var webpack = require('webpack');
var pkg = require('./package.json');

module.exports = {
  entry: path.resolve(pkg.main),
  output: {
    filename: path.join('browser', pkg.name + '.js'),
    library: 'KevoreeKevscript',
    libraryTarget: 'umd'
  },
  externals: {
    'kevoree-library': 'KevoreeLibrary',
    'kevoree-validator': 'KevoreeValidator',
    'kevoree-registry-api': 'KevoreeRegistryApi',
    'tiny-conf': 'TinyConf'
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin()
  ]
};
