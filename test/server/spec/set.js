const assert = require('assert');
const readKevs = require('../lib/readKevs');

describe('KevScript - set', function () {
	require('../init')(this);

	it('multiline.kevs', () => {
		const script = readKevs('set/multiline.kevs');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						const node = model.findNodesByID('node');
						const logLevelParam = node.dictionary.findValuesByID('logLevel');
						assert.ok(logLevelParam.value.length > 4000);
						assert.notEqual(logLevelParam.value.indexOf('\n'), -1);
						resolve();
					});
				}
			});
		});
	});
});
