'use strict';

module.exports = function (model, statements, stmt, opts) {
  var ret = [];
  ret.pos = stmt.pos;
  for (var i in stmt.children) {
    ret.push(statements[stmt.children[i].type](model, statements, stmt.children[i], opts));
  }
  ret.value = ret.map(function (stmt) {
    return stmt.value;
  }).join(', ');
  return ret;
};
