var api = require('kevoree-registry-api');
var kevoree = require('kevoree-library');
var registryUrl = require('../util/registry-url');

module.exports = function registryResolverFactory(logger) {
	var factory = new kevoree.factory.DefaultKevoreeFactory();
	var loader = factory.createJSONLoader();
	var compare = factory.createModelCompare();


 /**
  * processDeployUnits - adds the given DeployUnits to the current model
  *
  * @param {type} fqn   Description
  * @param {type} pkg   Description
  * @param {type} tdef  Description
  * @param {type} dus   Description
  * @param {type} model Description
  *
  * @returns {type} Description
  */
	function processDeployUnits(fqn, pkg, tdef, dus, model) {
		dus.forEach(function (du) {
			var duModel = loader.loadModelFromString(du.model).get(0);
			compare.merge(model, duModel).applyOn(model);
			var path = pkg.path() + '/deployUnits[name=' + du.name + ',version=' + du.version + ']';
			model.select(path).array.forEach(function (duInModel) {
				logger.debug('KevScript', 'DeployUnit ' + du.name + '/' + du.version + '/' + du.platform + ' added to ' + fqn);
				tdef.addDeployUnits(duInModel);
			});
		});
		return model.findByPath(tdef.path());
	}

	return {
		resolve: function (fqn, model) {
			return Promise.resolve()
				.then(function () {
					logger.debug('KevScript', 'Looking for ' + fqn + ' in ' + registryUrl());
					if (fqn.version.tdef === 'LATEST') {
						return api.tdef({
								name: fqn.name,
								namespace: {
									name: fqn.namespace
								}
							})
							.latest();
					} else {
						return api.tdef({
								name: fqn.name,
								version: fqn.version.tdef,
								namespace: {
									name: fqn.namespace
								}
							})
							.get();
					}
				})
				.then(function (regTdef) {
					if (fqn.version.tdef === 'LATEST') {
						logger.info('KevScript', fqn + ' resolved to version ' + regTdef.version);
						fqn.version.tdef = regTdef.version;
					} else {
						fqn.version.tdef = regTdef.version;
						logger.info('KevScript', fqn + ' resolved');
					}
					var tdef = loader.loadModelFromString(regTdef.model).get(0);
					var pkg = factory.createPackage();
					pkg.name = fqn.namespace;
					pkg.addTypeDefinitions(tdef);
					model.addPackages(pkg);

					var duRequest = api.du({
						typeDefinition: {
							name: tdef.name,
							version: tdef.version,
							namespace: {
								name: fqn.namespace
							}
						}
					});

					if (fqn.version.du === 'LATEST') {
						return duRequest
							.latest()
							.then(function (dus) {
								return processDeployUnits(fqn, pkg, tdef, dus, model);
							})
							.catch(function (err) {
								if (err.code === 404) {
									throw new Error('Unable to find ' + fqn.version.du + ' DeployUnits for ' + fqn);
								} else {
									throw err;
								}
							});
					} else {
						return duRequest
							.release()
							.then(function (dus) {
								return processDeployUnits(fqn, pkg, tdef, dus, model);
							})
							.catch(function (err) {
								if (err.code === 404) {
									throw new Error('Unable to find ' + fqn.version.du + ' DeployUnits for ' + fqn);
								} else {
									throw err;
								}
							});
					}
				})
				.catch(function (err) {
					if (err.code === 404) {
						throw new Error('Unable to find ' + fqn + ' in ' + registryUrl());
					} else {
						throw err;
					}
				});
		}
	};
};
