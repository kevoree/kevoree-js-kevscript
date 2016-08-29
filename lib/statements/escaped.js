'use strict';

module.exports = function (model, statements, stmt) {
  return {
    value: stmt.children.join(''),
    pos: stmt.value
  };
};
