'use strict';

module.exports = function (model, statements, stmt) {
  return stmt.children.join('');
};
