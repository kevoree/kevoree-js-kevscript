'use strict';


var kevoree = require('kevoree-library');
var tdefResolver = require('../typedef-resolver');

var factory = new kevoree.factory.DefaultKevoreeFactory();
var compare = factory.createModelCompare();

var cache = null;
var DEFAULT_NAMESPACE = 'kevoree';

function askRegistry(model, namespace, name, version, logger) {
  return tdefResolver(namespace, name, version, logger)
    .then(function (res) {
      compare.merge(model, res.model).applyOn(model);
      logger.debug('KevScript', 'Add ' + res.path + ' to cache');
      var tdef = model.findByPath(res.path);
      cache.add(res.path, tdef);
      return tdef;
    });
}

module.exports = function typeDef(model, statements, stmt, opts, cb) {
  var name = statements[stmt.children[0].type](model, statements, stmt.children[0], opts, cb);
  var version, namespace;

  if (stmt.children[1]) {
    version = statements[stmt.children[1].type](model, statements, stmt.children[1], opts, cb);
  }

  if (name.split('.').length === 1) {
    // default namespace to DEFAULT_NAMESPACE for namespace-less TypeDefinitions (ie: add node: JavascriptNode)
    namespace = DEFAULT_NAMESPACE;
  } else {
    var splitted = name.split('.');
    name = splitted.pop();
    namespace = splitted.join('.');
  }

  if (version) {
    // a version is specified
    if (version.match(/^LATEST$/)) {
      // specified version is LATEST: ask registry for LATEST
      askRegistry(model, namespace, name, version, opts.logger)
        .then(function (tdef) {
          cb(null, tdef);
        })
        .catch(cb);

    } else {
      // specified version is not LATEST: ask cache
      opts.logger.debug('KevScript', 'Looking for ' + namespace + '.' + name + '/' + version + ' in cache...');
      var tdefFound = cache.get('/packages[' + namespace.split('.').join(']/packages[') + ']/typeDefinitions[name=' + name + ',version=' + version + ']');
      if (tdefFound) {
        // tdef found in cache
        opts.logger.info('KevScript', 'Found ' + namespace + '.' + name + '/' + version + ' in cache');
        cb(null, tdefFound);
      } else {
        // unable to find tdef namespace.name/version in cache: ask registry
        opts.logger.debug('KevScript', 'Unable to find ' + namespace + '.' + name + '/' + version + ' in cache');
        askRegistry(model, namespace, name, version, opts.logger)
          .then(function (tdef) {
            cb(null, tdef);
          })
          .catch(cb);
      }
    }
  } else {
    // no version specified: ask registry for LATEST
    askRegistry(model, namespace, name, version, opts.logger)
      .then(function (tdef) {
        cb(null, tdef);
      })
      .catch(cb);
  }
};

module.exports.clearCache = function () {
  cache.clean();
};

module.exports.setCacheManager = function (cacheMgr) {
  cache = cacheMgr;
};
