const assert = require('assert');
const readKevs = require('../../lib/readKevs');

describe('KevScript - set', function () {
	require('../../init')(this);

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

	it('unknown.kevs', () => {
		const script = readKevs('set/unknown.kevs');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, (err) => {
				if (err) {
					setTimeout(() => {
						assert.equal(err.message, 'Attribute "unknown" does not exist in type "JavascriptNode". Set failed');
						assert.deepEqual(err.pos, [35, 42]);
						resolve();
					});
				} else {
					reject(new Error('set/unknown.kevs should NOT be valid'));
				}
			});
		});
	});

	it('frag-param.kevs', () => {
		const script = readKevs('set/frag-param.kevs');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						const group = model.findGroupsByID('sync');
						const fDic = group.findFragmentDictionaryByID('node');
						const portParam = fDic.findValuesByID('port');

						assert.equal(portParam.value, '9000');
						resolve();
					});
				}
			});
		});
	});
});
