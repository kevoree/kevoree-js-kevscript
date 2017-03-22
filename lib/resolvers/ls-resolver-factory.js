/* globals localStorage, KevoreeLibrary */

module.exports = function lsResolverFactory(logger, prefix, next) {
	var PREFIX = prefix || 'kevs-cache-';
	if (!KevoreeLibrary) {
		// prevent bad usage on Node.js
		return next;
	}

	var factory = new KevoreeLibrary.factory.DefaultKevoreeFactory();
	var loader = factory.createJSONLoader();
	var serializer = factory.createJSONSerializer();
	var compare = factory.createModelCompare();

	function readFromLocalStorage(fqn) {
		logger.debug('KevScript', 'LocalStorageResolver is looking for ' + fqn);
		var tdefModelStr = localStorage.getItem(PREFIX + fqn);
		if (tdefModelStr) {
			try {
				return loader.loadModelFromString(tdefModelStr).get(0);
			} catch (err) {
				logger.debug('KevScript', 'LocalStorageResolver unable to load model for ' + fqn);
			}
		} else {
			logger.debug('KevScript', 'LocalStorageResolver unable to find model for ' + fqn);
		}
	}

	function saveToLocalStorage(fqn, modelStr) {
		localStorage.setItem(PREFIX + fqn, modelStr);
		logger.debug('KevScript', 'FileSystemResolver cached ' + fqn);
	}

	return {
		resolve: function (fqn, model) {
			return Promise.resolve().then(function () {
				// protect against bad usage of this resolver in Node.js env
				if (localStorage) {
					var tdefModel = readFromLocalStorage(fqn);
					if (tdefModel) {
						// found in localStorage
						compare.merge(model, tdefModel).applyOn(model);
						logger.debug('KevScript', 'LocalStorageResolver is trying to find ' + fqn.toKevoreePath() + ' in cached model');
						var tdefs = model.select(fqn.toKevoreePath()).array;
						if (tdefs.length > 0) {
							for (var i=0; i < tdefs.length; i++) {
								if (tdefs[i].name === fqn.name) {
									fqn.version.tdef = tdefs[i].version;
									logger.info('KevScript', 'Found ' + fqn + ' in local storage');
									return tdefs[i];
								}
							}
						}
					}

					var isTag = fqn.version.tdef === 'LATEST';
					var fqnCache = fqn.clone();
					var emptyModel = factory.createContainerRoot();
					factory.root(emptyModel);
					// give the job to the next resolver but give him an empty model as ctx
					return next.resolve(fqn, emptyModel).then(function (tdef) {
						var tdefModelStr = serializer.serialize(emptyModel);
						saveToLocalStorage(fqn, tdefModelStr);
						if (isTag) {
							saveToLocalStorage(fqnCache, tdefModelStr);
						}
						// all set: merge ctx model and new resolved model together
						compare.merge(model, emptyModel).applyOn(model);
						return model.findByPath(tdef.path());
					});
				} else {
					// unable to find localStorage
					return next.resolve(fqn, model);
				}
			});
		}
	};
};
