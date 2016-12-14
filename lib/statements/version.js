'use strict';

module.exports = function (model, statements, stmt, opts) {
	var tdefVers = statements[stmt.children[0].type](model, statements, stmt.children[0], opts);
	var duVers = {
		value: 'RELEASE',
		pos: stmt.pos
	};
	if (stmt.children.length === 2) {
		duVers = statements[stmt.children[1].type](model, statements, stmt.children[1], opts);
	}

	var res = {
    tdef: tdefVers.value,
    du:   duVers.value,
    pos:  stmt.pos
  };

  return res;
	//
  // if (stmt.children.length === 1) {
  //   if (stmt.children[0].type !== 'latest') {
  //     // eg. add node : Type/1
  //     version.tdef = stmt.children[0];
  //   }
  // } else {
  //   if (stmt.children[0].type !== 'latest') {
  //     // eg. add node : Type/1
  //     version.tdef = stmt.children[0];
  //   }
  //   if (stmt.children[1].type === 'latest') {
  //     // eg. add node : Type/1
  //     version.du = 'LATEST';
  //   }
  // }
	//
  // return version;
};
