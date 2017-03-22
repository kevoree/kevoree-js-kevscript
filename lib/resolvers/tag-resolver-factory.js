module.exports = function tagResolverFactory(logger, next) {
	var tags = {};
	return {
		resolve: function (fqn, model) {
			return Promise.resolve().then(function () {
				var fqnCache = fqn.toString();
				if (fqn.version.tdef === 'LATEST') {
					var version = tags[fqnCache];
					if (version) {
						// found version in cache
						logger.debug('KevScript', 'TagResolver changed ' + fqn.version.tdef + ' to ' + version + ' for ' + fqn);
						fqn.version.tdef = version;
						return next.resolve(fqn, model);
					} else {
						// unable to find version in cache: resolve
						return next.resolve(fqn, model).then(function (tdef) {
							if (fqn.version.tdef !== 'LATEST') {
								tags[fqnCache] = fqn.version.tdef;
								logger.debug('KevScript', 'TagResolver linked ' + fqnCache + ' <-> ' + fqn);
							}
							return tdef;
						});
					}
				} else {
					// version is not LATEST no need to tag it
					return next.resolve(fqn, model);
				}
			});
		}
	};
};
