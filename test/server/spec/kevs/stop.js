const assert = require('assert');
const readKevs = require('../../lib/readKevs');
const readModel = require('../../lib/readModel');

describe('KevScript - stop', function () {
	require('../../init')(this);

	it('simple.kevs', () => {
		const script = readKevs('stop/simple.kevs');
		const model = readModel('stop/simple.json');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, model, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						assert.ok(model.findNodesByID('node0'));
						assert.equal(model.findNodesByID('node0').started, false);
						resolve();
					});
				}
			});
		});
	});

	it('multiple.kevs', () => {
		const script = readKevs('stop/multiple.kevs');
		const model = readModel('stop/multiple.json');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, model, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						assert.ok(model.findNodesByID('node0'));
						assert.ok(model.findNodesByID('node1'));
						assert.ok(model.findGroupsByID('sync'));
						assert.equal(model.findNodesByID('node0').started, false);
						assert.equal(model.findNodesByID('node1').started, false);
						assert.equal(model.findGroupsByID('sync').started, false);
						resolve();
					});
				}
			});
		});
	});

	it('components.kevs', () => {
		const script = readKevs('stop/components.kevs');
		const model = readModel('stop/components.json');
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
						assert.equal(node0.findComponentsByID('ticker0').started, false);
						assert.equal(node0.findComponentsByID('ticker1').started, false);
						assert.equal(node1.findComponentsByID('ticker0').started, false);
						assert.equal(node1.findComponentsByID('ticker1').started, false);
						resolve();
					});
				}
			});
		});
	});
});
