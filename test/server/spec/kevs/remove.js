const assert = require('assert');
const readKevs = require('../../lib/readKevs');

describe('KevScript - remove', function () {
	require('../../init')(this);

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

	it('wildcard0.kevs', () => {
		const script = readKevs('remove/wildcard0.kevs');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						assert.ok(model.findNodesByID('node0'));
						assert.ok(model.findNodesByID('node1'));
						assert.ok(model.findNodesByID('node2'));
						assert.ok(model.findNodesByID('node0').findComponentsByID('ticker'));
						assert.equal(model.findNodesByID('node1').findComponentsByID('ticker'), null);
						assert.ok(model.findNodesByID('node2').findComponentsByID('ticker'));
						resolve();
					});
				}
			});
		});
	});

	it('wildcard1.kevs', () => {
		const script = readKevs('remove/wildcard1.kevs');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						assert.ok(model.findNodesByID('node0'));
						assert.ok(model.findNodesByID('node1'));
						assert.ok(model.findNodesByID('node2'));
						assert.equal(model.select('/nodes[]/components[]').array.length, 0);
						resolve();
					});
				}
			});
		});
	});

	it('re-add.kevs', () => {
		const script = readKevs('remove/re-add.kevs');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						assert.ok(model.findNodesByID('node0'));
						assert.ok(model.findNodesByID('node0').findComponentsByID('ticker'));
						resolve();
					});
				}
			});
		});
	});
});
