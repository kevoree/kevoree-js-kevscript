const initKevscript = require('./lib/initKevscript');
const initRegistry = require('./lib/initRegistry');

module.exports = (test) => {
	test.timeout(1000);
	test.slow(300);

	before('create a Kevoree Registry mock', () => {
		return initRegistry().then(server => {
			this.server = server;
		});
	});

	before('create KevScript engine', () => {
		test.kevs = initKevscript();
	});

	after('stop Kevoree Registry mock', () => {
		if (this.server) {
			this.server.close();
		}
	});
};
