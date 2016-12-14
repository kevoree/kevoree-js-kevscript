const assert = require('assert');
const readKevs = require('../lib/readKevs');

describe('KevScript - remove', function () {
	require('../init')(this);

	it('simple.kevs', () => {
		const script = readKevs('remove/simple.kevs');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						assert.equal(model.findNodesByID('node'), null);
						resolve();
					});
				}
			});
		});
	});

	it('multiple.kevs', () => {
		const script = readKevs('remove/multiple.kevs');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						assert.equal(model.findNodesByID('node0'), null);
						assert.ok(model.findNodesByID('node1'));
						assert.equal(model.findNodesByID('node2'), null);
						resolve();
					});
				}
			});
		});
	});
});
