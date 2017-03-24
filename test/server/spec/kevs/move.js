const assert = require('assert');
const readKevs = require('../../lib/readKevs');

describe('KevScript - move', function () {
	require('../../init')(this);

	it('simple.kevs', () => {
		const script = readKevs('move/simple.kevs');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						assert.ok(model.findNodesByID('node0'));
						assert.ok(model.findNodesByID('node1'));
						assert.equal(model.select('/nodes[node0]/components[ticker]').array.length, 0);
						assert.equal(model.select('/nodes[node1]/components[ticker]').array.length, 1);
						resolve();
					});
				}
			});
		});
	});

	it('exchange.kevs', () => {
		const script = readKevs('move/exchange.kevs');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						assert.ok(model.findNodesByID('node0'));
						assert.ok(model.findNodesByID('node1'));
						assert.ok(model.findNodesByID('node0').findComponentsByID('tickerFrom1'));
						assert.ok(model.findNodesByID('node1').findComponentsByID('tickerFrom0'));
						resolve();
					});
				}
			});
		});
	});

	it('simple-fail.kevs', () => {
		const script = readKevs('move/simple-fail.kevs');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, (err) => {
				if (err) {
					setTimeout(() => {
						assert.equal(err.message, 'Unable to find any node instance named "sync". Move failed');
						resolve();
					});
				} else {
					reject(new Error('simple-fail.kevs is supposed to fail...'));
				}
			});
		});
	});
});
