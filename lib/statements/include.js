'use strict';

module.exports = function (model, statements, stmt, opts, cb) {
  console.log('"include" statement is deprecated since v2.0.0');
  cb();
};
