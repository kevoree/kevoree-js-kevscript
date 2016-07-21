'use strict';

var api = require('kevoree-registry-api');
var kevoree = require('kevoree-library');
var Q = require('q');

function createPackage(factory, model, namespace) {
  var deeperPkg;
  var pkg;
  namespace.split('.').forEach(function (name, index, names) {
    var newPkg = factory.createPackage();
    newPkg.name = name;
    if (pkg) {
      pkg.addPackages(newPkg);
    } else {
      model.addPackages(newPkg);
    }
    pkg = newPkg;
    if (index+1 === names.length) {
      deeperPkg = pkg;
    }
  });
  return deeperPkg;
}

module.exports = function typeDefResolver(namespace, name, version, logger) {
  return Q.Promise(function (resolve, reject) {
    if (!version || version.length === 0 || version.match(/^LATEST$/)) {
      logger.debug('KevScript', 'Looking for ' + namespace + '.' + name + '/LATEST on the registry...');
      return api.tdef({
        name: name,
        namespace: {
          name: namespace
        }
      })
      .latest()
      .then(resolve).catch(reject);
    } else {
      logger.debug('KevScript', 'Looking for ' + namespace + '.' + name + '/' + version + ' on the registry...');
      return api.tdef({
        name: name,
        version: version,
        namespace: {
          name: namespace
        }
      })
      .get()
      .then(resolve).catch(reject);
    }
  })
  .then(function (tdef) {
    logger.info('KevScript', 'Found TypeDefinition ' + namespace + '.' + name + '/' + tdef.version + ' on the registry');
    var factory = new kevoree.factory.DefaultKevoreeFactory();
    var loader = factory.createJSONLoader();
    var tdefModel = loader.loadModelFromString(tdef.model).get(0);
    var model = factory.createContainerRoot();
    factory.root(model);
    var pkg = createPackage(factory, model, namespace);
    pkg.addTypeDefinitions(tdefModel);

    return api.du({
      typeDefinition: {
        name: tdef.name,
        version: tdef.version,
        namespace: {
          name: namespace
        }
      }
    })
      .latest()
      .then(function (dus) {
        var compare = factory.createModelCompare();
        dus.forEach(function (du) {
          var duModel = loader.loadModelFromString(du.model).get(0);
          compare.merge(model, duModel).applyOn(model);
          var path = pkg.path() + '/deployUnits[name=' + du.name + ',version=' + du.version + ']';
          model.select(path).array.forEach(function (duInModel) {
            logger.debug('KevScript', 'DeployUnit ' + du.name + '/' + du.version + '/' + du.platform  + ' added to ' + namespace + '.' + name + '/' + tdef.version);
            tdefModel.addDeployUnits(duInModel);
          });
        });
        return { path: tdefModel.path(), model: model };
      });
  });
};
