'use strict';

module.exports = function (model, statements, stmt, opts, cb) {
  opts.warnings.push({
    message: '"include" statement is deprecated',
    pos: stmt.pos
  });
  cb();
};
