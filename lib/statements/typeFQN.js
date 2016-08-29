'use strict';

module.exports = function (model, statements, stmt) {
  return {
    value: stmt.children
      .filter(function (stmt) {
        return stmt.type;
      })
      .map(function (stmt) {
        return statements[stmt.type](model, statements, stmt).value;
      })
      .join('.'),
    pos: stmt.pos
  };
};
