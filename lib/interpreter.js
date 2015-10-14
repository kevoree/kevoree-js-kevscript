var kevoree = require('kevoree-library').org.kevoree,
    async   = require('async'),
    path    = require('path');

// retrieve statements processors
var statements = {
    addRepo:                require('./statements/addRepo'),
    add:                    require('./statements/add'),
    move:                   require('./statements/move'),
    attach:                 require('./statements/attach'),
    addBinding:             require('./statements/addBinding'),
    delBinding:             require('./statements/delBinding'),
    include:                require('./statements/include'),
    set:                    require('./statements/set'),
    network:                require('./statements/network'),
    remove:                 require('./statements/remove'),
    detach:                 require('./statements/detach'),
    typeDef:                require('./statements/typeDef'),
    typeFQN:                require('./statements/typeFQN'),
    nameList:               require('./statements/nameList'),
    instancePath:           require('./statements/instancePath'),
    namespace:              require('./statements/namespace'),
    wildcard:               require('./statements/wildcard'),
    string:                 require('./statements/string'),
    string2:                require('./statements/string2'),
    string3:                require('./statements/string3'),
    repoString:             require('./statements/repoString'),
    version:                require('./statements/version'),
    anything:               require('./statements/anything'),
    realString:             require('./statements/realString'),
    realStringNoNewLine:    require('./statements/realStringNoNewLine'),
    newLine:                require('./statements/newLine'),
    singleQuoteLine:        require('./statements/singleQuoteLine'),
    doubleQuoteLine:        require('./statements/doubleQuoteLine'),
    escaped:                require('./statements/escaped'),
    start:                  require('./statements/start'),
    stop:                   require('./statements/stop'),
    pause:                  require('./statements/pause')
};

var factory = new kevoree.factory.DefaultKevoreeFactory();
var cloner  = factory.createModelCloner();

/**
 *
 * @param ast
 * @param ctxModel
 * @param options
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
        namespaces: {}
    };

    if (opts.registry) {
        options.registry = opts.registry;
    }

    // process statements
    var tasks = [];
    ast.children.forEach(function (child0) {
        child0.children.forEach(function (stmt) {
            tasks.push(function (done) {
                if (typeof (statements[stmt.type]) === 'function') {
                    statements[stmt.type](model, statements, stmt, options, done);
                } else {
                    done(new Error('Unknown statement "'+stmt.type+'"'));
                }
            });
        });
    });

    // execute tasks
    async.series(tasks, function (err) {
        callback(err, model);
    });
}

module.exports = interpreter;
module.exports.clearCache = function () {
    statements.typeDef.clearCache();
};
module.exports.setCacheManager = function (cacheMgr) {
    statements.typeDef.setCacheManager(cacheMgr);
};
