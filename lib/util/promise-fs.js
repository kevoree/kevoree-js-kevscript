var fs = require('fs');
var mkdirp = require('mkdirp');

// because Promise are great
module.exports = {
	readFile: function (path, encoding) {
		return new Promise(function (resolve, reject) {
			fs.readFile(path, encoding, function (err, data) {
				if (err) {
					reject(err);
				} else {
					resolve(data);
				}
			});
		});
	},

	writeFile: function (path, data, encoding) {
		return new Promise(function (resolve, reject) {
			fs.writeFile(path, data, encoding, function (err) {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	},

	unlink: function (path) {
		return new Promise(function (resolve, reject) {
			fs.unlink(path, function (err) {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	},

	mkdirp: function (path) {
		return new Promise(function (resolve, reject) {
			mkdirp(path, function (err) {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}
};
