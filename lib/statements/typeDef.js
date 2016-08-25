'use strict';

var kevoree = require('kevoree-library');
var tdefResolver = require('../typedef-resolver');
var KevScriptError = require('../KevScriptError');

var factory = new kevoree.factory.DefaultKevoreeFactory();
var compare = factory.createModelCompare();

var cache = null;
var DEFAULT_NAMESPACE = 'kevoree';

function askRegistry(model, namespace, name, version, logger) {
  return tdefResolver(namespace, name, version, logger)
    .then(function (res) {
      compare.merge(model, res.model).applyOn(model);
      var tdef = model.findByPath(res.path);
      logger.debug('KevScript', 'Add ' + namespace + '.' + name + '/' + tdef.version + ' to cache');
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
    if (version.tdef === 'LATEST') {
      // specified version is LATEST: ask registry for LATEST
      askRegistry(model, namespace, name, version, opts.logger)
        .then(function (tdef) {
          cb(null, tdef);
        })
        .catch(cb);

    } else {
      // specified version is not LATEST
      var tdefPath = '/packages[' + namespace.split('.').join(']/packages[') + ']/typeDefinitions[name=' + name + ',version=' + version.tdef + ']';

      // ask cache
      var tdef = cache.get(tdefPath);
      if (tdef) {
        // tdef found in cache
        opts.logger.info('KevScript', 'Found ' + namespace + '.' + name + '/' + version.tdef + ' in cache');
        cb(null, tdef);
      } else {
        // unable to find tdef namespace.name/version in cache:
        // try to find in model
        tdef = model.findByPath(tdefPath);
        if (tdef) {
          // found tdef in model
          opts.logger.info('KevScript', 'Found ' + namespace + '.' + name + '/' + version.tdef + ' in model');
          opts.logger.debug('KevScript', 'Add ' + namespace + '.' + name + '/' + version.tdef + ' to cache');
          cache.add(tdefPath, tdef);
          cb(null, tdef);
        } else {
          // unable to find tdef in model
          // ask registry
          askRegistry(model, namespace, name, version, opts.logger)
            .then(function (tdef) {
              cb(null, tdef);
            })
            .catch(cb);
        }
      }
    }
  } else {
    // no version specified: ask registry for LATEST
    version = { tdef: 'LATEST', du: 'RELEASE' };
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
