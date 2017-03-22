'use strict';

var path = require('path');
var webpack = require('webpack');
var pkg = require('./package.json');

var config = {
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
	plugins: [],
	devServer: {
		contentBase: path.join(__dirname),
		watchContentBase: true,
		compress: true,
		hot: true,
		overlay: {
			warnings: true,
			errors: true
		}
	}
};

if (!process.env.DEBUG) {
	config.plugins.push(new webpack.optimize.UglifyJsPlugin());
} else {
	config.plugins.push(new webpack.HotModuleReplacementPlugin());
	config.devtool = 'eval';
}

module.exports = config;
