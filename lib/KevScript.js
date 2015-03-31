var Class       = require('pseudoclass'),
    kevs        = require('./parser'),
    interpreter = require('./interpreter'),
    modelInterpreter = require('./model-interpreter'),
    CacheManager = require('./CacheManager');

var KevScript = Class({
    toString: 'KevScript',

    construct: function (cacheManager) {
        interpreter.setCacheManager(cacheManager || new CacheManager());
    },

    /**
     * Parses given KevScript source-code in parameter 'data' and returns a ContainerRoot.
     * @param {String} data string
     * @param {Object|Function} [ctxModel] a model to "start" on (in order not to create a model from scratch)
     * @param {Function} callback function (Error, ContainerRoot)
     * @throws Error on SyntaxError and on source code validity and such
     */
    parse: function (data, ctxModel, callback) {
        if (typeof(callback) === 'undefined') {
            callback = ctxModel;
            ctxModel = null;
        }

        var parser = new kevs.Parser();
        var ast = parser.parse(data);
        if (ast.type != 'kevScript') {
            callback(new Error(ast.toString()));
        } else {
            interpreter(ast, ctxModel, callback);
        }
    },

    /**
     * Parses a Kevoree model (ContainerRoot) and returns the equivalent KevScript string
     * @param model kevoree ContainerRoot model
     */
    parseModel: function (model) {
        return modelInterpreter(model);
    },

    getCacheManager: function () {
        return interpreter.getCacheManager();
    }
});

module.exports = KevScript;