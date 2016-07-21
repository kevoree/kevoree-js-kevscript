'use strict';

var nconf = require('kevoree-nconf');
var KevScript = require('../../lib/KevScript');
var KevoreeLogger = require('kevoree-commons').KevoreeLogger;

nconf.use('memory');

nconf.set('registry', {
  host: 'localhost',
  port: 8080,
  ssl: false,
  oauth: {
    client_id: 'kevoree_registryapp',
    client_secret: 'kevoree_registryapp_secret'
  }
});

var logger = new KevoreeLogger('KevScript');
logger.setLevel('DEBUG');
var kevs = new KevScript(logger, new KevScript.cache.MemoryCache());

var script =
    'add node, %%foo%%: JavascriptNode\n' +
    'add sync: WSGroup';
var ctxVars = {};

kevs.parse(script, null, ctxVars, function (err, model) {
    if (err) {
        console.err('BOUM');
        throw err;
    } else {
        console.log('OK');
        console.log(ctxVars);
        console.log(model);
    }
});
