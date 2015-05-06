var Class       = require('pseudoclass'),
    kevs        = require('./parser'),
    shortid     = require('shortid'),
    interpreter = require('./interpreter'),
    modelInterpreter = require('./model-interpreter'),
    caches = require('./cache');

var KevScript = Class({
    toString: 'KevScript',

    construct: function (cacheManager) {
        this.cacheManager = cacheManager || new caches.DefaultCache();
        interpreter.setCacheManager(this.cacheManager);
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

        var toGenPattern = new RegExp('(%(%([a-zA-Z0-9_]+)%)%)', 'g');
        var match = toGenPattern.exec(data);
        while (match != null) {
            ctxVars[match[3]] = shortid.generate();
            data = data.replace(new RegExp(match[1], 'g'), match[2]);
            match = toGenPattern.exec(data);
        }

        Object.keys(ctxVars).forEach(function (key) {
            data = data.replace(new RegExp('%'+key+'%', 'g'), ctxVars[key]);
        });

        var res = /(%([a-zA-Z0-9_]+)%)/.exec(data);
        if (res) {
            callback(new Error('Context variable '+res[1]+' has no value (eg. --ctxVar '+res[2]+'=foo)'));
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
        return this.cacheManager;
    }
});

module.exports = KevScript;
module.exports.cache = caches;
