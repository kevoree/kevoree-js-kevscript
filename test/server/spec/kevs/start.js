const assert = require('assert');
const readKevs = require('../../lib/readKevs');
const readModel = require('../../lib/readModel');

describe('KevScript - start', function () {
	require('../../init')(this);

	it('simple.kevs', () => {
		const script = readKevs('start/simple.kevs');
		const model = readModel('start/simple.json');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, model, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						assert.ok(model.findNodesByID('node0'));
						assert.equal(model.findNodesByID('node0').started, true);
						resolve();
					});
				}
			});
		});
	});

	it('multiple.kevs', () => {
		const script = readKevs('start/multiple.kevs');
		const model = readModel('start/multiple.json');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, model, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						assert.ok(model.findNodesByID('node0'));
						assert.ok(model.findNodesByID('node1'));
						assert.ok(model.findGroupsByID('sync'));
						assert.equal(model.findNodesByID('node0').started, true);
						assert.equal(model.findNodesByID('node1').started, true);
						assert.equal(model.findGroupsByID('sync').started, true);
						resolve();
					});
				}
			});
		});
	});

	it('components.kevs', () => {
		const script = readKevs('start/components.kevs');
		const model = readModel('start/components.json');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, model, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						const node0 = model.findNodesByID('node0');
						const node1 = model.findNodesByID('node1');
						const sync = model.findGroupsByID('sync');
						assert.equal(node0.started, true);
						assert.equal(node1.started, true);
						assert.equal(sync.started, true);
						assert.equal(node0.findComponentsByID('ticker0').started, true);
						assert.equal(node0.findComponentsByID('ticker1').started, true);
						assert.equal(node1.findComponentsByID('ticker0').started, true);
						assert.equal(node1.findComponentsByID('ticker1').started, true);
						resolve();
					});
				}
			});
		});
	});
});
