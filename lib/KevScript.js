'use strict';

var config = require('tiny-conf'),
  kevs = require('./parser'),
  shortid = require('./shortid'),
  interpreter = require('./interpreter'),
  modelInterpreter = require('./model-interpreter');

function KevScript(logger) {
  this.logger = logger;
  this.logger.info('KevScript', 'Registry: ' +
      (config.get('registry.ssl') ? 'https://':'http://') +
      config.get('registry.host') + (config.get('registry.port') === 80 ? '' : ':' + config.get('registry.port')));
}

var GEN_CTX_VAR = /(%(%([a-zA-Z0-9_]+)%)%)/g;
var CTX_VAR = /%[a-zA-Z0-9_]+%/g;

KevScript.prototype = {
  toString: function () {
    return 'KevScript';
  },

  /**
   * Parses given KevScript source-code in parameter 'data' and returns a ContainerRoot.
   * @param {String} data string
   * @param {Object|Function} [ctxModel] a model to "start" on (in order not to create a model from scratch)
   * @param {Object|Function} [ctxVars] context variables to be accessible from the KevScript
   * @param {Function} callback function (Error, ContainerRoot)
   * @throws Error on SyntaxError and on source code validity and such
   */
  parse: function (data, ctxModel, ctxVars, callback) {
    if (typeof callback === 'undefined' && typeof ctxVars === 'undefined') {
      // 2 params
      callback = ctxModel;
      ctxVars = {};
      ctxModel = null;
    } else if (typeof callback === 'undefined') {
      callback = ctxVars;
      ctxVars = {};
    }

    if (!ctxVars) {
      ctxVars = {};
    }

    var match = GEN_CTX_VAR.exec(data);
    while (match !== null) {
      ctxVars[match[3]] = shortid();
      data = data.replace(new RegExp(match[1], 'g'), match[2]);
      match = GEN_CTX_VAR.exec(data);
    }

    Object.keys(ctxVars).forEach(function (key) {
      data = data.replace(new RegExp('%' + key + '%', 'g'), ctxVars[key]);
    });

    var res = CTX_VAR.exec(data);
    if (res) {
      callback(new Error('Context variable ' + res[0] + ' has no value (eg. --ctxVar ' + res[0] + '=foo)'));
    }

    var parser = new kevs.Parser();
    var ast = parser.parse(data);
    if (ast.type !== 'kevScript') {
      callback(new Error(ast.toString()));
    } else {
      interpreter(ast, ctxModel, { logger: this.logger }, callback);
    }
  },

  /**
   * Parses a Kevoree model (ContainerRoot) and returns the equivalent KevScript string
   * @param model kevoree ContainerRoot model
   */
  parseModel: function (model) {
    return modelInterpreter(model);
  }
};

module.exports = KevScript;
module.exports.Parser = kevs.Parser;
