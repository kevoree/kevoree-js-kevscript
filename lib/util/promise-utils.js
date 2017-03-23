/**
 * Executes Promises in series and returns an array with all the results in sequence
 * @param  {Array}   tasks an array of functions that returns a Promise
 * @return {Promise}       fulfilled when all promises are fulfilled; rejected
 *                         as soon as a promise is rejected
 */
function series(tasks) {
	var results = [];
	return tasks
		.reduce(function (curr, next) {
			return curr.then(function (res) {
				results.push(res);
				return next();
			});
		}, Promise.resolve())
		.then(function (last) {
			results.push(last);
			return results.splice(1);
		});
}

module.exports = {
	series: series
};
