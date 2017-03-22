var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var kevoree = require('kevoree-library');

module.exports = function fsResolverFactory(logger, cacheRoot, next) {
	var factory = new kevoree.factory.DefaultKevoreeFactory();
	var loader = factory.createJSONLoader();
	var serializer = factory.createJSONSerializer();
	var compare = factory.createModelCompare();

	function getPath(fqn) {
		return path.resolve(cacheRoot, fqn.namespace, fqn.name, fqn.version.tdef + '-' + fqn.version.du + '.json');
	}

	function readFromFile(fqn) {
		return new Promise(function (resolve) {
			var fqnPath = getPath(fqn);
			logger.debug('KevScript', 'FileSystemResolver is looking for ' + fqnPath);
			fs.readFile(fqnPath, 'utf-8', function (err, tdefModelStr) {
				var tdef;
				if (err) {
					logger.debug('KevScript', 'FileSystemResolver failed to read model at ' + fqnPath);
					logger.debug('KevScript', err.stack);
				} else {
					try {
						tdef = loader.loadModelFromString(tdefModelStr).get(0);
					} catch (ignore) {
						logger.debug('KevScript', 'FileSystemResolver failed to parse model ' + fqn + ' from ' + fqnPath);
						logger.debug('KevScript', ignore.stack);
					}
				}
				resolve(tdef);
			});
		});
	}

	function saveToFile(fqn, modelStr) {
		return new Promise(function (resolve) {
			var fqnPath = getPath(fqn);
			mkdirp(path.resolve(fqnPath, '..'), function (err) {
				if (err) {
					logger.debug('KevScript', 'FileSystemResolver failed to create directory for ' + fqn + ' in ' + path.resolve(fqnPath, '..') + ' (ignored)');
					logger.debug('KevScript', err.stack);
					resolve();
				} else {
					fs.writeFile(fqnPath, modelStr, 'utf-8', function (err) {
						if (err) {
							logger.debug('KevScript', 'FileSystemResolver failed to cache ' + fqn + ' in ' + cacheRoot + ' (ignored)');
							logger.debug('KevScript', err.stack);
						} else {
							logger.debug('KevScript', 'FileSystemResolver cached ' + fqn + ' in ' + fqnPath);
						}
						resolve();
					});
				}
			});
		});
	}

	return {
		resolve: function (fqn, model) {
			return Promise.resolve().then(function () {
				logger.debug('KevScript', 'Looking for ' + fqn + ' in ' + cacheRoot);

				return readFromFile(fqn).then(function (tdefModel) {
					if (tdefModel) {
						// found in file system
						compare.merge(model, tdefModel).applyOn(model);
						logger.debug('KevScript', 'FileSystemResolver is trying to find ' + fqn.toKevoreePath() + ' in cached model');
						var tdefs = model.select(fqn.toKevoreePath()).array;
						if (tdefs.length > 0) {
							for (var i=0; i < tdefs.length; i++) {
								if (tdefs[i].name === fqn.name) {
									fqn.version.tdef = tdefs[i].version;
									logger.info('KevScript', 'Found ' + fqn + ' in ' + cacheRoot);
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
