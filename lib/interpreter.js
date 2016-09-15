'use strict';

var kevoree = require('kevoree-library');
var series = require('async/series');
var modelValidator = require('kevoree-validator');

// retrieve statements processors
var statements = {
  addRepo: require('./statements/addRepo'),
  add: require('./statements/add'),
  move: require('./statements/move'),
  attach: require('./statements/attach'),
  addBinding: require('./statements/addBinding'),
  delBinding: require('./statements/delBinding'),
  include: require('./statements/include'),
  set: require('./statements/set'),
  network: require('./statements/network'),
  remove: require('./statements/remove'),
  detach: require('./statements/detach'),
  typeDef: require('./statements/typeDef'),
  typeFQN: require('./statements/typeFQN'),
  nameList: require('./statements/nameList'),
  instancePath: require('./statements/instancePath'),
  namespace: require('./statements/namespace'),
  wildcard: require('./statements/wildcard'),
  string: require('./statements/string'),
  string2: require('./statements/string2'),
  string3: require('./statements/string3'),
  repoString: require('./statements/repoString'),
  version: require('./statements/version'),
  anything: require('./statements/anything'),
  realString: require('./statements/realString'),
  realStringNoNewLine: require('./statements/realStringNoNewLine'),
  newLine: require('./statements/newLine'),
  singleQuoteLine: require('./statements/singleQuoteLine'),
  doubleQuoteLine: require('./statements/doubleQuoteLine'),
  escaped: require('./statements/escaped'),
  start: require('./statements/start'),
  stop: require('./statements/stop'),
  pause: require('./statements/pause'),
  ctxVar: require('./statements/ctxVar'),
  genCtxVar: require('./statements/genCtxVar')
};

var factory = new kevoree.factory.DefaultKevoreeFactory();
var cloner = factory.createModelCloner();

/**
 *
 * @param ast
 * @param ctxModel
 * @param opts
 * @param callback
 * @constructor
 */
function interpreter(ast, ctxModel, opts, callback) {
  // output model
  var model = null;

  if (ctxModel) {
    // if we have a context model, clone it and use it has a base
    model = cloner.clone(ctxModel, false);
  } else {
    // otherwise start from a brand new model
    model = factory.createContainerRoot();
  }

  // this ContainerRoot is the root of the model
  factory.root(model);

  var options = {
    logger: opts.logger,
    ctxVars: opts.ctxVars,
    warnings: []
  };

  // process statements
  var tasks = [];
  ast.children.forEach(function (child0) {
    child0.children.forEach(function (stmt) {
      tasks.push(function (done) {
        if (typeof (statements[stmt.type]) === 'function') {
          statements[stmt.type](model, statements, stmt, options, done);
        } else {
          done(new Error('Unknown statement "' + stmt.type + '"'));
        }
      });
    });
  });

  // execute tasks
  series(tasks, function (err) {
    if (err) {
      callback(err, null, options.warnings);
    } else {
      var error;
      try {
        modelValidator(model);
      } catch (err) {
        error = err;
      } finally {
        callback(error, model, options.warnings);
      }
    }
  });
}

module.exports = interpreter;
