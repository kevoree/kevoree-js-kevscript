#!/usr/bin/env node

'use strict';

var path = require('path');
var fs = require('fs');
var chalk = require('chalk');
var config = require('tiny-conf');
var KevScript = require('./../lib/KevScript');
var kevoree = require('kevoree-library');
var kConst = require('kevoree-const');
var TinyConf = require('tiny-conf');
var KevoreeLogger = require('kevoree-commons').KevoreeLogger;
var optimist = require('optimist').usage('Usage: $0 <path/to/a/model.kevs> [-c /path/to/a/context/model.json -o /path/to/output/model.json]').demand(['o'])
	// -o, --output
		.alias('o', 'output').describe('o', 'Where to write the output Kevoree JSON model').default('o', 'model.json')
	// -c, --ctxModel
		.alias('c', 'ctxModel').describe('ctxModel', 'A context model to apply KevScript on')
	// --ctxVar
		.describe('ctxVar', 'A context variable to replace a %NAME% in the script (usage: --ctxVar NAME=foo)')
	// --log.level
		.describe('log.level', 'Change logger level (ALL|DEBUG|INFO|WARN|ERROR|QUIET) (default: INFO)');

require('tiny-conf-plugin-file')(config, kConst.CONFIG_PATH);
require('tiny-conf-plugin-argv')(config);

var tagResolverFactory = require('../lib/resolvers/tag-resolver-factory');
var modelResolverFactory = require('../lib/resolvers/model-resolver-factory');
var fsResolverFactory = require('../lib/resolvers/fs-resolver-factory');
var registryResolverFactory = require('../lib/resolvers/registry-resolver-factory');

if (optimist.argv._.length === 1) {
	var input = path.resolve(optimist.argv._[0]);
	var output = path.resolve(optimist.argv.o);
	var factory = new kevoree.factory.DefaultKevoreeFactory();
	var serializer = factory.createJSONSerializer();
	var logger = new KevoreeLogger('KevScript');
	var logLevel = config.get('log.level');
	if (logLevel) {
		logger.setLevel(logLevel);
	}

	var rootResolver = tagResolverFactory(logger,
			modelResolverFactory(logger,
				fsResolverFactory(logger, TinyConf.get('cache.root')),
					registryResolverFactory(logger)));

	var kevs = new KevScript(logger, { resolver: rootResolver });
	var ctxVars = {};
	if (optimist.argv.ctxVar) {
		[].concat(optimist.argv.ctxVar).forEach(function(ctxvar) {
			var data = ctxvar.split('=');
			ctxVars[data[0]] = data[1];
		});
	}

	/**
     *
     * @param err
     * @param model
     */
	var kevscriptHandler = function(err, model) {
		if (err) {
			console.log(chalk.red('Unable to parse KevScript'));
			if (err.nt) {
				console.log('Unexpected token "' + err.nt + '" (l:' + err.line + ':' + err.col + ')');
			} else {
				console.log(err.stack);
			}
			process.exit(1);
		} else {
			try {
				var modelStr = JSON.stringify(JSON.parse(serializer.serialize(model)), null, 4);
				fs.writeFile(output, modelStr, 'utf8', function(err) {
					if (err) {
						throw err;
					}
					console.log('Kevoree model generated succefully from KevScript file');
					if (Object.keys(ctxVars).length > 0) {
						var ctxVarsStr = Object.keys(ctxVars).map(function(key) {
							return key + '=' + ctxVars[key];
						}).join(', ');
						console.log('ctx vars: ' + ctxVarsStr);
					}
					console.log('kevs used: ' + input);
					console.log('model gen: ' + output);
				});
			} catch (err) {
				console.log(chalk.red('Unable to serialize generated model') + '\n' + err.stack);
			}
		}
	};

	fs.readFile(input, 'utf8', function(err, data) {
		if (err) {
			throw err;
		}

		if (optimist.argv.c) {
			var loader = factory.createJSONLoader();
			fs.readFile(path.resolve(optimist.argv.c), 'utf8', function(err, ctxModelSrc) {
				if (err) {
					console.log(chalk.red('Unable to read context model file') + '\n' + err.stack);
					process.exit(1);
				} else {
					try {
						kevs.parse(data, loader.loadModelFromString(ctxModelSrc).get(0), ctxVars, kevscriptHandler);
					} catch (err) {
						console.log(chalk.red('Unable to load context model') + '\n' + err.stack);
						process.exit(1);
					}
				}
			});
		} else {
			kevs.parse(data, null, ctxVars, kevscriptHandler);
		}
	});
} else {
	console.log(optimist.help());
}
