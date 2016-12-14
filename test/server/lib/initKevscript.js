const TinyConf = require('tiny-conf');
const KevScript = require('../../../lib/KevScript');

const noop = function() {/* noop */};

TinyConf.set('registry', {
	host: 'localhost',
	port: 3000,
	ssl: false
});

module.exports = () => new KevScript({
	info: noop,
	debug: noop,
	warn: noop,
	error: noop,
	setLevel: noop,
	setFilter: noop
});
