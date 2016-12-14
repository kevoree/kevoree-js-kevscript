const assert = require('assert');
const readKevs = require('../lib/readKevs');

describe('KevScript - empty', function () {
	require('../init')(this);

	it('empty.kevs', () => {
		const script = readKevs('empty.kevs');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						assert.ok(model);
						resolve();
					});
				}
			});
		});
	});
});
