'use strict';

var shortid = require('../shortid');

module.exports = function (model, stmts, stmt, opts) {
  var value;
  var ctxVarKey = stmts[stmt.children[0].type](model, stmts, stmt.children[0]).value;
  if (opts.ctxVars[ctxVarKey]) {
    value = opts.ctxVars[ctxVarKey];
  } else {
    opts.ctxVars[ctxVarKey] = value = shortid();
  }
  return {
    value: value,
    pos: stmt.pos
  };
};
