'use strict';

module.exports = function (model, statements, stmt) {
  var value = stmt.children.join('');
  value.pos = stmt.pos;
  return value;
};
