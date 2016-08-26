'use strict';

module.exports = function (model, statements, stmt, opts) {
  var instancePath = [];
  instancePath.pos = stmt.pos;
  for (var i in stmt.children) {
    instancePath.push(statements[stmt.children[i].type](model, statements, stmt.children[i], opts));
  }
  return instancePath;
};
