'use strict';

module.exports = function (model, statements, stmt) {
  var value = new String(stmt.children[0].children.join(''));
  value.pos = stmt.pos;
  return value;
};
