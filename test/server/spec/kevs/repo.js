const assert = require('assert');
const readKevs = require('../../lib/readKevs');

describe('KevScript - repo (deprecated)', function () {
	require('../../init')(this);

	it('simple.kevs', () => {
		const script = readKevs('repo/simple.kevs');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, (err, model, warnings) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						assert.ok(model);
						assert.equal(warnings[0].message, '"repo" statement is deprecated');
						resolve();
					});
				}
			});
		});
	});
});
