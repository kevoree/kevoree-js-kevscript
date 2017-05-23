const assert = require('assert');
const readKevs = require('../../lib/readKevs');

describe('KevScript - add', function () {
	require('../../init')(this);

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

	it('already-added.kevs', () => {
		const script = readKevs('add/already-added.kevs');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, (err) => {
				if (err) {
					setTimeout(() => {
						assert.equal(err.message, 'Instance name "node0" is already used. Add failed');
						assert.deepEqual(err.pos, [44, 49]);
						resolve();
					});
				} else {
					reject(new Error('already-added.kevs was supposed to fail'));
				}
			});
		});
	});

	it('already-added-comp.kevs', () => {
		const script = readKevs('add/already-added-comp.kevs');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, (err) => {
				if (err) {
					setTimeout(() => {
						assert.equal(err.message, 'Instance name "ticker" is already used in "node0". Add failed');
						assert.deepEqual(err.pos, [83, 95]);
						resolve();
					});
				} else {
					reject(new Error('already-added-comp.kevs was supposed to fail'));
				}
			});
		});
	});

	it('unknown.kevs', () => {
		const script = readKevs('add/unknown.kevs');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, (err) => {
				if (err) {
					setTimeout(() => {
						assert.equal(err.message, 'Unable to find kevoree.UnknownType/LATEST in http://localhost:3000');
						assert.deepEqual(err.pos, [10, 21]);
						resolve();
					});
				} else {
					reject(new Error('unknown.kevs was supposed to fail'));
				}
			});
		});
	});

	it('fail-add-comp.kevs', () => {
		const script = readKevs('add/fail-add-comp.kevs');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, (err) => {
				if (err) {
					setTimeout(() => {
						assert.equal(err.message, 'Unable to find any node instance named "node" to host "ticker". Add failed');
						assert.deepEqual(err.pos, [4, 8]);
						resolve();
					});
				} else {
					reject(new Error('fail-add-comp.kevs was supposed to fail'));
				}
			});
		});
	});
});
