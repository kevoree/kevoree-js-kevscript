'use strict';
/* globals KevoreeKevscript */

var localStorageCache = {
  get: function (key) {
      return localStorage.getItem(key);
  },
  add: function (key, value) {
      localStorage.setItem(key, value);
  },
  delete: function (key) {
      localStorage.remove(key);
  },
  getAll: function () {
      var ret = [];
      localStorage.keys().forEach(function (key) {
          ret.push(localStorage.getItem(key));
      });
      return ret;
  },
  clear: function () {
      localStorage.keys().forEach(function (key) {
          localStorage.remove(key);
      }.bind(this));
  }
};

var kevs = new KevoreeKevscript(localStorageCache);

var script =
    'add node, %%foo%%: kevoree.JavascriptNode\n' +
    'add sync: kevoree.WSGroup';
var ctxVars = {};

kevs.parse(script, null, ctxVars, function (err, model) {
    if (err) {
        console.log('BOUM');
        throw err;
    } else {
        console.log('OK');
        console.log(ctxVars);
        console.log(model);
    }
});
