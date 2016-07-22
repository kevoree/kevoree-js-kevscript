#!/usr/bin/env node
'use strict';

var path     = require('path'),
    fs       = require('fs'),
    nconf    = require('kevoree-nconf'),
    optimist = require('optimist')
        .usage('Usage: $0 <path/to/a/model.json> [-o path/to/output/model.kevs]')
        .demand(['o'])
        .alias('o', 'output')
        .describe('o', 'Where to write the output Kevoree Kevscript model')
        .default('o', 'model.kevs'),
    KevScript = require('./../lib/KevScript'),
    kevoree   = require('kevoree-library'),
    KevoreeLogger= require('kevoree-commons').KevoreeLogger;

var HOME_DIR = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
var KREGRC_PATH = path.resolve(HOME_DIR, '.kregrc.json');
nconf.argv({ 'registry.ssl': { type: 'boolean' } }).file(KREGRC_PATH).use('memory');

if (optimist.argv._.length === 1) {
    var input = path.resolve(optimist.argv._[0]);
    var output = path.resolve(optimist.argv.o);
    var factory = new kevoree.factory.DefaultKevoreeFactory();
    var loader = factory.createJSONLoader();
    var logger = new KevoreeLogger('KevScript');
    var logLevel = nconf.get('log:level');
    if (logLevel) {
      logger.setLevel(logLevel);
    }
    var kevs = new KevScript(logger, new KevScript.cache.MemoryCache());

    fs.readFile(input, 'utf8', function (err, data) {
        if (err) {
          throw err;
        } else {
          var script = kevs.parseModel(loader.loadModelFromString(data).get(0));
          fs.writeFile(output, script, 'utf8', function (err) {
              if (err) {
                throw err;
              } else {
                console.log('Kevoree Kevscript generated succefully');
                console.log('model used: '+input);
                console.log('kevs gen:   '+output);
              }
          });
        }
    });
} else {
    console.log(optimist.help());
}
