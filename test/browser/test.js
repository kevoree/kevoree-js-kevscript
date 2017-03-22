'use strict';
/* globals KevoreeKevscript, KevoreeCommons, TinyConf, expect, sinon */

TinyConf.set('registry', {
	host: 'registry.kevoree.org',
	port: 443,
	ssl: true,
	oauth: {
		client_id: 'kevoree_registryapp',
		client_secret: 'kevoree_registryapp_secret'
	}
});

TinyConf.set('cache.root', '__fake_kevoree_cache__');
var LS_PREFIX = 'kevs-cache-';

describe('KevScript tests', function () {
	this.timeout(2500);

	var kevs, tagResolver, modelResolver, lsResolver, registryResolver;

	before('init logger/resolvers/engine', function () {
		var logger = new KevoreeCommons.KevoreeLogger('KevScript');
		logger.setLevel('ALL');
		registryResolver = KevoreeKevscript.Resolvers.registryResolverFactory(logger);
		lsResolver = KevoreeKevscript.Resolvers.lsResolverFactory(logger, LS_PREFIX, registryResolver);
		modelResolver = KevoreeKevscript.Resolvers.modelResolverFactory(logger, lsResolver);
		tagResolver = KevoreeKevscript.Resolvers.tagResolverFactory(logger, modelResolver);
		kevs = new KevoreeKevscript(logger, {
			resolver: tagResolver
		});
	});

	after('clean localStorage', function () {
		Object.keys(localStorage).forEach(function (key) {
			if (key.startsWith(LS_PREFIX)) {
				delete localStorage[key];
			}
		});
	});

	beforeEach('init spies', function () {
		sinon.spy(tagResolver, 'resolve');
		sinon.spy(modelResolver, 'resolve');
		sinon.spy(lsResolver, 'resolve');
		sinon.spy(registryResolver, 'resolve');
	});

	afterEach('restore spies', function () {
		tagResolver.resolve.restore();
		modelResolver.resolve.restore();
		lsResolver.resolve.restore();
		registryResolver.resolve.restore();
	});

	it('execute \'add node0: JavascriptNode/LATEST/LATEST\'', function (done) {
		var script = 'add node0: JavascriptNode/LATEST/LATEST';

		kevs.parse(script, function (err, model) {
			if (err) {
				done(err);
			} else {
				expect(model).toExist();
				var node = model.findNodesByID('node0');
				expect(node).toExist();
				expect(node.typeDefinition).toExist();
				expect(node.typeDefinition.name).toEqual('JavascriptNode');
				expect(tagResolver.resolve.callCount).toEqual(1, 'tagResolver.resolve() should be hit once');
				expect(modelResolver.resolve.callCount).toEqual(1, 'modelResolver.resolve() should be hit once');
				expect(lsResolver.resolve.callCount).toEqual(1, 'lsResolver.resolve() should be hit once');
				expect(registryResolver.resolve.callCount).toEqual(1, 'registryResolver.resolve() should be hit once');
				done();
			}
		});
	});

	it('should not hit registry this time thanks to cache', function (done) {
		var script = 'add node0: JavascriptNode/LATEST/LATEST';

		kevs.parse(script, function (err, model) {
			if (err) {
				done(err);
			} else {
				expect(model).toExist();
				var node = model.findNodesByID('node0');
				expect(node).toExist();
				expect(node.typeDefinition).toExist();
				expect(node.typeDefinition.name).toEqual('JavascriptNode');
				expect(tagResolver.resolve.callCount).toEqual(1, 'tagResolver.resolve() should be hit once');
				expect(modelResolver.resolve.callCount).toEqual(1, 'modelResolver.resolve() should be hit once');
				expect(lsResolver.resolve.callCount).toEqual(1, 'lsResolver.resolve() should be hit once');
				expect(registryResolver.resolve.callCount).toEqual(0, 'registryResolver.resolve() should not be hit');
				done();
			}
		});
	});

	it('should end with a hit on model resolver', function (done) {
		var script = 'add node0: JavascriptNode/LATEST/LATEST';

		kevs.parse(script, function (err, model) {
			if (err) {
				done(err);
			} else {
				expect(model).toExist();
				var node = model.findNodesByID('node0');
				expect(node).toExist();
				expect(node.typeDefinition).toExist();
				expect(node.typeDefinition.name).toEqual('JavascriptNode');
				expect(tagResolver.resolve.callCount).toEqual(1, 'tagResolver.resolve() should be hit once');
				expect(modelResolver.resolve.callCount).toEqual(1, 'modelResolver.resolve() should be hit once');
				expect(lsResolver.resolve.callCount).toEqual(1, 'lsResolver.resolve() should be hit once');
				expect(registryResolver.resolve.callCount).toEqual(0, 'registryResolver.resolve() should not be hit');

				kevs.parse(script, model, function (err, model) {
					if (err) {
						done(err);
					} else {
						expect(model).toExist();
						var node = model.findNodesByID('node0');
						expect(node).toExist();
						expect(node.typeDefinition).toExist();
						expect(node.typeDefinition.name).toEqual('JavascriptNode');
						expect(tagResolver.resolve.callCount).toEqual(2, 'tagResolver.resolve() should be hit once');
						expect(modelResolver.resolve.callCount).toEqual(2, 'modelResolver.resolve() should be hit once');
						expect(lsResolver.resolve.callCount).toEqual(1, 'lsResolver.resolve() should be hit once');
						expect(registryResolver.resolve.callCount).toEqual(0, 'registryResolver.resolve() should not be hit');
						done();
					}
				});
			}
		});
	});
});
