const assert = require('assert');
const readKevs = require('../../lib/readKevs');

describe('KevScript - version', function () {
	require('../../init')(this);

	it('default-version.kevs', () => {
		const script = readKevs('version/default-version.kevs');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						const node = model.findNodesByID('node');
						assert.ok(node);
						assert.equal(node.name, 'node');
						assert.equal(node.typeDefinition.name, 'JavascriptNode');
						assert.equal(node.typeDefinition.version, '42');
						assert.equal(node.typeDefinition.deployUnits.array[0].name, 'kevoree-node-javascript');
						assert.equal(node.typeDefinition.deployUnits.array[0].version, '5.4.0');
						resolve();
					});
				}
			});
		});
	});

	it('integer-default.kevs', () => {
		const script = readKevs('version/integer-default.kevs');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						const node = model.findNodesByID('node');
						assert.ok(node);
						assert.equal(node.name, 'node');
						assert.equal(node.typeDefinition.name, 'JavascriptNode');
						assert.equal(node.typeDefinition.version, '42');
						assert.equal(node.typeDefinition.deployUnits.array[0].name, 'kevoree-node-javascript');
						assert.equal(node.typeDefinition.deployUnits.array[0].version, '5.4.0');
						resolve();
					});
				}
			});
		});
	});

	it('integer-latest.kevs', () => {
		const script = readKevs('version/integer-latest.kevs');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						const node = model.findNodesByID('node');
						assert.ok(node);
						assert.equal(node.name, 'node');
						assert.equal(node.typeDefinition.name, 'JavascriptNode');
						assert.equal(node.typeDefinition.version, '1');
						assert.equal(node.typeDefinition.deployUnits.array[0].name, 'kevoree-node-javascript');
						assert.equal(node.typeDefinition.deployUnits.array[0].version, '5.4.0-beta.0');
						resolve();
					});
				}
			});
		});
	});

	it('integer-release.kevs', () => {
		const script = readKevs('version/integer-release.kevs');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						const node = model.findNodesByID('node');
						assert.ok(node);
						assert.equal(node.name, 'node');
						assert.equal(node.typeDefinition.name, 'JavascriptNode');
						assert.equal(node.typeDefinition.version, '1');
						assert.equal(node.typeDefinition.deployUnits.array[0].name, 'kevoree-node-javascript');
						assert.equal(node.typeDefinition.deployUnits.array[0].version, '5.4.0');
						resolve();
					});
				}
			});
		});
	});

	it('latest-latest.kevs', () => {
		const script = readKevs('version/latest-latest.kevs');
		return new Promise((resolve, reject) => {
			this.kevs.parse(script, (err, model) => {
				if (err) {
					reject(err);
				} else {
					setTimeout(() => {
						const node = model.findNodesByID('node');
						assert.ok(node);
						assert.equal(node.name, 'node');
						assert.equal(node.typeDefinition.name, 'JavascriptNode');
						assert.equal(node.typeDefinition.version, '42');
						assert.equal(node.typeDefinition.deployUnits.array[0].name, 'kevoree-node-javascript');
						assert.equal(node.typeDefinition.deployUnits.array[0].version, '5.4.0-beta.0');
						resolve();
					});
				}
			});
		});
	});
});
