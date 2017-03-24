const assert = require('assert');
const readKevs = require('../../lib/readKevs');

describe('KevScript - genCtxVars', function () {
	require('../../init')(this);

	it('simple.kevs', () => {
		const script = readKevs('genCtxVars/simple.kevs');
		return new Promise((resolve, reject) => {
			const ctxVars = {};
			this.kevs.parse(script, null, ctxVars, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						assert.ok(model.findNodesByID(ctxVars.node));
						resolve();
					});
				}
			});
		});
	});

	it('set.kevs', () => {
		const script = readKevs('genCtxVars/set.kevs');
		return new Promise((resolve, reject) => {
			const ctxVars = {};
			this.kevs.parse(script, null, ctxVars, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						const node = model.findNodesByID(ctxVars.node);
						assert.ok(node);
						assert.equal(node.dictionary.findValuesByID('logLevel').value, 'DEBUG');
						resolve();
					});
				}
			});
		});
	});

	it('set-val.kevs', () => {
		const script = readKevs('genCtxVars/set-val.kevs');
		return new Promise((resolve, reject) => {
			const ctxVars = {};
			this.kevs.parse(script, null, ctxVars, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						const node = model.findNodesByID('node');
						assert.ok(node);
						assert.equal(node.dictionary.findValuesByID('logLevel').value, ctxVars.logLevel);
						resolve();
					});
				}
			});
		});
	});
});
