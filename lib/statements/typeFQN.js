'use strict';

module.exports = function (model, statements, stmt, opts, cb) {
  var typeFqn = [];
  for (var i in stmt.children) {
    if (typeof (stmt.children[i]) === 'string') {
      typeFqn.push(stmt.children[i]);
    } else {
      typeFqn.push(statements[stmt.children[i].type](model, statements, stmt.children[i], opts, cb));
    }
  }
  return typeFqn.join('');
};
