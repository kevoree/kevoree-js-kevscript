const assert = require('assert');
const readKevs = require('../lib/readKevs');

describe('KevScript - detach', function () {
	require('../init')(this);

	it('simple.kevs', () => {
		const script = readKevs('detach/simple.kevs');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						const node = model.findNodesByID('node');
						const sync = model.findGroupsByID('sync');
						assert.equal(node.groups.array.length, 0);
						assert.equal(sync.subNodes.array.length, 0);
						resolve();
					});
				}
			});
		});
	});

	it('multiple.kevs', () => {
		const script = readKevs('detach/multiple.kevs');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						const node0 = model.findNodesByID('node0');
						const node1 = model.findNodesByID('node1');
						const node2 = model.findNodesByID('node2');
						const sync = model.findGroupsByID('sync');
						assert.equal(node0.groups.array.length, 0);
						assert.equal(node1.groups.array.length, 0);
						assert.equal(sync.subNodes.array[0].name, node2.name);
						resolve();
					});
				}
			});
		});
	});

	it('wildcard.kevs', () => {
		const script = readKevs('detach/wildcard.kevs');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						const node0 = model.findNodesByID('node0');
						const node1 = model.findNodesByID('node1');
						const node2 = model.findNodesByID('node2');
						const sync = model.findGroupsByID('sync');
						assert.equal(node0.groups.array.length, 0);
						assert.equal(node1.groups.array.length, 0);
						assert.equal(node2.groups.array.length, 0);
						assert.equal(sync.subNodes.array.length, 0);
						resolve();
					});
				}
			});
		});
	});
});
