const os = require('os');
const path = require('path');
const TinyConf = require('tiny-conf');
const testLogger = require('./test-logger');
const tagResolverFactory = require('../../../lib/resolvers/tag-resolver-factory');
const modelResolverFactory = require('../../../lib/resolvers/model-resolver-factory');
const fsResolverFactory = require('../../../lib/resolvers/fs-resolver-factory');
const registryResolverFactory = require('../../../lib/resolvers/registry-resolver-factory');
const KevScript = require('../../../lib/KevScript');

TinyConf.set('registry', {
	host: 'localhost',
	port: 3000,
	ssl: false
});

TinyConf.set('cache.root', path.resolve(os.tmpdir(), '_kevoree-test-cache_'));

const rootResolver = tagResolverFactory(testLogger,
		modelResolverFactory(testLogger,
			fsResolverFactory(testLogger, TinyConf.get('cache.root'),
				registryResolverFactory(testLogger))));

module.exports = () => new KevScript(testLogger, { resolver: rootResolver });
