'use strict';

var kevoree = require('kevoree-library');
var tdefResolver = require('../typedef-resolver');
var KevScriptError = require('../KevScriptError');

var factory = new kevoree.factory.DefaultKevoreeFactory();
var compare = factory.createModelCompare();

var DEFAULT_NAMESPACE = 'kevoree';

function askRegistry(model, namespace, name, version, logger) {
  return tdefResolver(namespace, name, version, logger)
    .then(function (regModel) {
      var pkgPath = '/packages[' + namespace.split('.').join(']/packages[') + ']';
      var tdefPath = pkgPath + '/typeDefinitions[name='+name+',version='+version.tdef+']';
      var curTdef = model.findByPath(tdefPath);

      if (curTdef) {
        // prioritize the ctxModel DeployUnits instead of the registry
        var regTdef = regModel.findByPath(tdefPath);

        regTdef.deployUnits.array.forEach(function (du) {
          var curDus = model.select(tdefPath + '/deployUnits[]/filters[name=platform,value=' + du.findFiltersByID('platform').value + ']').array;
          if (curDus.length === 0) {
            // only add registry DeployUnits if none are found in the currentModel
            model.findByPath(pkgPath).addDeployUnits(du);
            curTdef.addDeployUnits(du);
          }
        });
      } else {
        compare.merge(model, regModel).applyOn(model);
      }

      return model.findByPath(tdefPath);
    });
}

module.exports = function typeDef(model, statements, stmt, opts, cb) {
  var typeFqn;
  try {
    typeFqn = statements[stmt.children[0].type](model, statements, stmt.children[0], opts, cb);
  } catch (err) {
    cb(err);
    return;
  }

  var version, namespace;

  if (stmt.children[1]) {
    version = statements[stmt.children[1].type](model, statements, stmt.children[1], opts, cb);
  }

  var name = typeFqn.value;
  if (name.split('.').length === 1) {
    // default namespace to DEFAULT_NAMESPACE for namespace-less TypeDefinitions (ie: add node: JavascriptNode)
    namespace = DEFAULT_NAMESPACE;
  } else {
    var splitted = name.split('.');
    name = splitted.pop();
    namespace = splitted.join('.');
  }

  if (!version) {
    // default version
    version = { tdef: 'LATEST', du: 'RELEASE' };
  }

  if (version.tdef === 'LATEST') {
    // specified version is LATEST
    // ask registry for LATEST
    askRegistry(model, namespace, name, version, opts.logger)
      .then(function (tdef) {
        cb(null, tdef);
      })
      .catch(function (err) {
        cb(new KevScriptError(err.message, stmt.pos));
      });

  } else {
    // specified version is not LATEST
    var tdefPath = '/packages[' + namespace.split('.').join(']/packages[') + ']/typeDefinitions[name=' + name + ',version=' + version.tdef + ']';

    // try to find in model
    var tdef = model.findByPath(tdefPath);
    if (tdef) {
      // found tdef in model
      opts.logger.info('KevScript', 'Found ' + namespace + '.' + name + '/' + version.tdef + ' in model');
      cb(null, tdef);
    } else {
      // unable to find tdef in model
      // ask registry
      askRegistry(model, namespace, name, version, opts.logger)
        .then(function (tdef) {
          cb(null, tdef);
        })
        .catch(function (err) {
          cb(new KevScriptError(err.message, stmt.pos));
        });
    }
  }
};
