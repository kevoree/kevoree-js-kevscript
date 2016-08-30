'use strict';

module.exports = function (model, statements, stmt, opts, cb) {
  opts.warnings.push({
    message: '"pause" statement is deprecated',
    pos: stmt.pos
  });
  cb();
};
