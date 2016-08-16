'use strict';

var semver = require('semver');

// Created by leiko on 16/09/14 17:18
module.exports = function getFQN(tdef) {
  var hasPreRelease = tdef.deployUnits.array.some(function (du) {
    return semver.prerelease(du.version) !== null;
  });

  var duTag = hasPreRelease ? '/LATEST' : '';

  var fqn = tdef.name + '/' + tdef.version + duTag;

  function walk(pkg) {
    if (pkg.eContainer()) {
      fqn = pkg.name + '.' + fqn;
      walk(pkg.eContainer());
    }
  }

  walk(tdef.eContainer());

  return fqn;
};
