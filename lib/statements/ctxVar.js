'use strict';

var KevScriptError = require('../KevScriptError');

module.exports = function (model, stmts, stmt, opts) {
  var value;
  var ctxVarKey = stmts[stmt.children[0].type](model, stmts, stmt.children[0]).value;
  if (opts.ctxVars[ctxVarKey]) {
    value = opts.ctxVars[ctxVarKey];
  } else {
    throw new KevScriptError('Missing value for context variable %'+ctxVarKey+'%', stmt.pos);
  }
  return {
    value: value,
    pos: stmt.pos
  };
};
