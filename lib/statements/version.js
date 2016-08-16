'use strict';

module.exports = function (model, statements, stmt) {
  var version = {
    tdef: 'LATEST',
    du:   'RELEASE'
  };

  if (stmt.children.length === 1) {
    if (stmt.children[0].type !== 'latest') {
      // eg. add node : Type/1
      version.tdef = stmt.children[0];
    }
  } else {
    if (stmt.children[0].type !== 'latest') {
      // eg. add node : Type/1
      version.tdef = stmt.children[0];
    }
    if (stmt.children[1].type === 'latest') {
      // eg. add node : Type/1
      version.du = 'LATEST';
    }
  }

  return version;
};
