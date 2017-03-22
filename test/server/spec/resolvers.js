const assert = require('assert');
const Sinon = require('sinon');
const TinyConf = require('tiny-conf');
const kevoree = require('kevoree-library');

// test utils
const testLogger = require('../lib/test-logger');

// things to test
const FQN = require('../../../lib/util/fqn');
const tagResolverFactory = require('../../../lib/resolvers/tag-resolver-factory');
const modelResolverFactory = require('../../../lib/resolvers/model-resolver-factory');
const fsResolverFactory = require('../../../lib/resolvers/fs-resolver-factory');
const registryResolverFactory = require('../../../lib/resolvers/registry-resolver-factory');

describe('KevScript - resolvers', function () {
	require('../init')(this);

	const factory = new kevoree.factory.DefaultKevoreeFactory();

	function emptyModel() {
		let model = factory.createContainerRoot();
		factory.root(model);
		return model;
	}

	let tagResolver, modelResolver, fsResolver, registryResolver;
	let model = emptyModel();

	before('initialize resolvers', function () {
		registryResolver = registryResolverFactory(testLogger);
		fsResolver =  fsResolverFactory(testLogger, TinyConf.get('cache.root'), registryResolver);
		modelResolver = modelResolverFactory(testLogger, fsResolver);
		tagResolver = tagResolverFactory(testLogger, modelResolver);
	});

	beforeEach('initialize spies', function () {
		Sinon.spy(tagResolver, 'resolve');
		Sinon.spy(modelResolver, 'resolve');
		Sinon.spy(fsResolver, 'resolve');
		Sinon.spy(registryResolver, 'resolve');
	});

	afterEach('restore spies', function () {
		tagResolver.resolve.restore();
		modelResolver.resolve.restore();
		fsResolver.resolve.restore();
		registryResolver.resolve.restore();
	});

	it('should hit registry', () => {
		return tagResolver.resolve(new FQN('kevoree', 'JavascriptNode'), model)
			.then(function (tdef) {
				assert.equal(tdef.version, '42');
			});
	});

	it('should end with a hit to fs resolver on second resolving', () => {
		// this test should end with a hit in the fs on the second resolving
		// because on first hit, registry will answer, then fs/model/tag should
		// update accordingly with the data retrieved from registry
		return tagResolver.resolve(new FQN('kevoree', 'Ticker', {
				du: 'LATEST'
			}), model)
			.then(function (tdef) {
				assert.equal(tdef.version, '1');

				// on second resolving, the tag LATEST will be resolved to the proper version
				// but because the model has been erased, the model resolver will be useless
				// but the fs has been updated previously, so the chain will stop on it
				return tagResolver.resolve(new FQN('kevoree', 'Ticker', {
						du: 'LATEST'
					}), emptyModel())
					.then(function (tdef) {
						assert.equal(tdef.version, '1');

						// tag, model and fs resolvers should be used twice
						assert.equal(tagResolver.resolve.callCount, 2, 'tagResolver.resolve() should be hit twice');
						assert.equal(modelResolver.resolve.callCount, 2, 'modelResolver.resolve() should be hit twice');
						assert.equal(fsResolver.resolve.callCount, 2, 'fsResolver.resolve() should be hit twice');

						// registry resolver should not be used for the second resolving
						assert.equal(registryResolver.resolve.callCount, 1, 'registryResolver.resolve() should be hit once');
					});
			});
	});
});
