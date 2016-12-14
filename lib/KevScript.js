'use strict';

var config = require('tiny-conf'),
  kevs = require('./parser'),
  interpreter = require('./interpreter'),
  modelInterpreter = require('./model-interpreter');

function KevScript(logger) {
  this.logger = logger;
  this.logger.info('KevScript', 'Registry: ' +
      (config.get('registry.ssl') ? 'https://':'http://') +
      config.get('registry.host') + (config.get('registry.port') === 80 ? '' : ':' + config.get('registry.port')));
}

KevScript.prototype = {
  toString: function () {
    return 'KevScript';
  },

  /**
   * Parses given KevScript source-code in parameter 'data' and returns a ContainerRoot.
   * @param {String} data string
   * @param {Object|Function} [ctxModel] a model to "start" on (in order not to create a model from scratch)
   * @param {Object|Function} [ctxVars] context variables to be accessible from the KevScript
   * @param {Function} callback function (Error, ContainerRoot, Array<Warning>) (with {message: string, pos: [0,0]}: Warning)
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

    var options = {
      logger: this.logger,
      ctxVars: ctxVars
    };

    var parser = new kevs.Parser();
    var ast = parser.parse(data);

		if (ast.type !== 'kevScript') {
			callback(ast, null, []);
		} else {
			interpreter(ast, ctxModel, options, callback);
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
