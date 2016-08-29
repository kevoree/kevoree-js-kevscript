'use strict';

module.exports = function (model, statements, stmt) {
  return {
    value: stmt.children[0].children.join(''),
    pos: stmt.pos
  };
};
