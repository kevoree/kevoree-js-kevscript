const os = require('os');
const path = require('path');
const config = require('tiny-conf');
const testLogger = require('./test-logger');
const tagResolverFactory = require('../../../lib/resolvers/tag-resolver-factory');
const modelResolverFactory = require('../../../lib/resolvers/model-resolver-factory');
// const fsResolverFactory = require('../../../lib/resolvers/fs-resolver-factory');
const registryResolverFactory = require('../../../lib/resolvers/registry-resolver-factory');
const KevScript = require('../../../lib/KevScript');

config.set({
	registry: {
		host: 'localhost',
		port: 3000,
		ssl: false
	},
	cache: {
		root: path.resolve(os.tmpdir(), '_kevoree-test-cache_'),
		ttl: 86400000 // 24 hours
	}
});

const registryResolver = registryResolverFactory(testLogger);
// const fsResolver = fsResolverFactory(testLogger, registryResolver);
const modelResolver = modelResolverFactory(testLogger, registryResolver);
const rootResolver = tagResolverFactory(testLogger, modelResolver);

module.exports = () => new KevScript(testLogger, { resolver: rootResolver });
