const express = require('express');
const routes = require('../../fixtures/registry/routes.json');
const resources = require('../../fixtures/registry/resources.json');

module.exports = () => new Promise((resolve) => {
	const app = express();
	Object.keys(routes).forEach(name => {
		const route = routes[name];
		if (typeof route === 'number') {
			app.get(name, (req, res) => {
				res.sendStatus(route);
			});
		} else {
			app.get(name, (req, res) => {
				res.json(resources[route]);
			});
		}
	});
	app.get('*', (req, res) => {
		console.error('!!! IF YOU SEE THIS IT MEANS THAT THERE ARE PROBLEMS IN THE TESTS !!!'); // eslint-disable-line
		console.error('Unable to find mocked route:', req.url); // eslint-disable-line
		res.sendStatus(404);
	});
	const server = app.listen(3000, () => {
		resolve(server);
	});
});
