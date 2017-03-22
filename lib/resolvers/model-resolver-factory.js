module.exports = function modelResolverFactory(logger, next) {
	return {
		resolve: function (fqn, model) {
			return Promise.resolve().then(function () {
				logger.debug('KevScript', 'Looking for ' + fqn + ' in model');
				logger.debug('KevScript', 'ModelResolver is looking for ' + fqn.toKevoreePath());

				var tdefs = model.select(fqn.toKevoreePath()).array;
				if (tdefs.length > 0) {
					for (var i = 0; i < tdefs.length; i++) {
						if (tdefs[i].name === fqn.name) {
							logger.info('KevScript', 'Found ' + fqn + ' in model');
							return tdefs[i];
						}
					}
				}

				return next.resolve(fqn, model);
			});
		}
	};
};
