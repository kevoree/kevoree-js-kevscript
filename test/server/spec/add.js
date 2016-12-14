const assert = require('assert');
const readKevs = require('../lib/readKevs');

describe('KevScript - add', function () {
	require('../init')(this);

	it('simple.kevs', () => {
		const script = readKevs('add/simple.kevs');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						assert.ok(model.findNodesByID('node'));
						resolve();
					});
				}
			});
		});
	});

	it('multiple.kevs', () => {
		const script = readKevs('add/multiple.kevs');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						assert.ok(model.findNodesByID('node0'));
						assert.ok(model.findNodesByID('node1'));
						assert.ok(model.findNodesByID('node2'));
						resolve();
					});
				}
			});
		});
	});
});
