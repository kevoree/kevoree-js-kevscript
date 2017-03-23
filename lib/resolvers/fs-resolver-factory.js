var path = require('path');
var kevoree = require('kevoree-library');
var config = require('tiny-conf');
var fs = require('../util/promise-fs');

module.exports = function fsResolverFactory(logger, next) {
	var root = config.get('cache.root');
	var ttl = config.get('cache.ttl');

	var factory = new kevoree.factory.DefaultKevoreeFactory();
	var loader = factory.createJSONLoader();
	var serializer = factory.createJSONSerializer();
	var compare = factory.createModelCompare();

	function getPath(fqn) {
		return path.resolve(root, fqn.namespace, fqn.name, fqn.version.tdef + '-' + fqn.version.du + '.json');
	}

	function readFromFile(fqn) {
		var fqnPath = getPath(fqn);
		logger.debug('KevScript', 'FileSystemResolver is looking for ' + fqnPath);
		return fs.readFile(fqnPath, 'utf-8')
			.then(function (modelStr) {
				var model = loader.loadModelFromString(modelStr).get(0);
				if (parseInt(model.generated_KMF_ID, 10) < Date.now() - ttl) {
					// cache is too old: discard it
					logger.debug('KevScript', 'FileSystemResolver cache is too old for ' + fqn + ' at ' + fqnPath);
					return fs.unlink(fqnPath)
						.catch(function (err) {
							logger.debug('KevScript', 'FileSystemResolver failed to remove outdated model for ' + fqn + ' at ' + fqnPath);
							logger.debug('KevScript', err.stack);
						});
				} else {
					return model;
				}
			})
			.catch(function (err) {
				logger.debug('KevScript', 'FileSystemResolver failed to read/parse model ' + fqn + ' from ' + fqnPath);
				logger.debug('KevScript', err.stack);
			});
	}

	function saveToFile(fqn, modelStr) {
		var fqnPath = getPath(fqn);
		return fs.mkdirp(path.resolve(fqnPath, '..'))
			.then(function () {
				return fs.writeFile(fqnPath, modelStr, 'utf-8')
					.then(function () {
						logger.debug('KevScript', 'FileSystemResolver cached ' + fqn + ' in ' + fqnPath);
					})
					.catch(function (err) {
						logger.debug('KevScript', 'FileSystemResolver failed to cache ' + fqn + ' in ' + root + ' (ignored)');
						logger.debug('KevScript', err.stack);
					});
			})
			.catch(function (err) {
				logger.debug('KevScript', 'FileSystemResolver failed to create directory for ' + fqn + ' in ' + path.resolve(fqnPath, '..') + ' (ignored)');
				logger.debug('KevScript', err.stack);
			});
	}

	return {
		resolve: function (fqn, model) {
			return Promise.resolve().then(function () {
				logger.debug('KevScript', 'Looking for ' + fqn + ' in ' + root);

				return readFromFile(fqn).then(function (tdefModel) {
					if (tdefModel) {
						// found in file system
						compare.merge(model, tdefModel).applyOn(model);
						logger.debug('KevScript', 'FileSystemResolver is trying to find ' + fqn.toKevoreePath() + ' in cached model');
						var tdefs = model.select(fqn.toKevoreePath()).array;
						if (tdefs.length > 0) {
							for (var i = 0; i < tdefs.length; i++) {
								if (tdefs[i].name === fqn.name) {
									fqn.version.tdef = tdefs[i].version;
									logger.info('KevScript', 'Found ' + fqn + ' in ' + root);
									return tdefs[i];
								}
							}
						}
					}

					var isTag = false;
					if (fqn.version.tdef === 'LATEST') {
						// tag version
						isTag = true;
					}

					var fqnCache = fqn.clone();
					var emptyModel = factory.createContainerRoot();
					factory.root(emptyModel);
					// give the job to the next resolver but give him an empty model as ctx
					return next.resolve(fqn, emptyModel).then(function (tdef) {
						emptyModel.generated_KMF_ID = Date.now();
						var tdefModelStr = serializer.serialize(emptyModel);

						return saveToFile(fqn, tdefModelStr)
							.then(function () {
								if (isTag) {
									return saveToFile(fqnCache, tdefModelStr);
								}
							})
							.then(function () {
								// all set: merge ctx model and new resolved model together
								compare.merge(model, emptyModel).applyOn(model);
								return model.findByPath(tdef.path());
							});
					});
				});
			});
		}
	};
};
