const assert = require('assert');
const readKevs = require('../../lib/readKevs');
const readModel = require('../../lib/readModel');

describe('KevScript - bind', function () {
	require('../../init')(this);

	it('simple.kevs', () => {
		const script = readKevs('bind/simple.kevs');
		const model = readModel('bind/simple.json');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, model, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						const node0 = model.findNodesByID('node0');
						const ticker = node0.findComponentsByID('ticker');
						const chan = model.findHubsByID('chan');
						assert.equal(ticker.findRequiredByID('tick').bindings.array.length, 1);
						assert.equal(chan.bindings.array.length, 1);
						assert.equal(model.mBindings.array.length, 1);
						resolve();
					});
				}
			});
		});
	});

});
