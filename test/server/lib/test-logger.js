var KevoreeLogger = require('kevoree-commons/lib/Logger');
var logger;

if (process.env.DEBUG) {
	logger = new KevoreeLogger('KevScript');
	logger.setLevel('ALL');
} else {
	const noop = function() {/* noop */};
	logger = {
		info: noop,
		debug: noop,
		warn: noop,
		error: noop,
		setLevel: noop,
		setFilter: noop
	};
}

module.exports = logger;
