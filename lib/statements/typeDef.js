var SemVer = require('semver');
var registry = require('kevoree-registry-client');
var kevoree = require('kevoree-library').org.kevoree;
var getFqn = require('../getFQN');

var factory = new kevoree.factory.DefaultKevoreeFactory();
var loader = factory.createJSONLoader();
var compare = factory.createModelCompare();

var cache = null;

module.exports = function typeDef(model, statements, stmt, opts, cb) {
    var tdef;
    var fqn = statements[stmt.children[0].type](model, statements, stmt.children[0], opts, cb);
    var version;

    if (stmt.children[1]) {
        version = statements[stmt.children[1].type](model, statements, stmt.children[1], opts, cb);
    }

    if (fqn.split('.').length === 1) {
        // default package to 'org.kevoree.library' for fqn-less TypeDefinitions (ie: add node: JavascriptNode)
        fqn = 'org.kevoree.library.'+fqn;
    }

    if (version) {
        fqn += '/' + version;
    }

    var path = getModelPath(fqn);
    var tdefs = model.select(path).array;
    if (tdefs.length === 0) {
        // typeDef not in current model

        function firstHandler(err, tdefModelStr) {
            if (err) {
                var errMsg = 'Unable to find "'+fqn+'" in current model nor on Kevoree registry.';
                if (err.code === 'ENOTFOUND') {
                    errMsg += ' (Might it be a connectivity issue?)';
                }
                cb(new Error(errMsg));

            } else {
                var tdefModel = loader.loadModelFromString(tdefModelStr).get(0);

                tdefs = tdefModel.select(path).array;
                if (tdefs.length === 0) {
                    cb(new Error('Unable to find "'+fqn+'" on Kevoree registry.'));

                } else {
                    if (tdefs.length === 1) {
                        // there is only one TypeDefinition found, we can merge
                        var mergeSeq = compare.merge(model, tdefModel);
                        mergeSeq.applyOn(model);
                        // ...and answer with the newly added TypeDefinition from the registry
                        cache.add(fqn, tdefModelStr);
                        cb(null, tdefs[0]);
                    } else {
                        // there are more than one TypeDefinition that matches the given fqn on the registry
                        // so lets take the greater version
                        tdef = getBestVersion(tdefs);
                        // ask registry again for a model with this specific TypeDefinition only
                        var fqnForBestVers = getFqn(tdef);
                        if (cache.get(fqnForBestVers)) {
                            secondHandler(null, cache.get(fqnForBestVers));
                        } else {
                            registry.get({ fqns : [fqnForBestVers] }, secondHandler);
                        }
                    }
                }
            }
        }

        function secondHandler(err, tdefModelStr) {
            if (err) {
                cb(new Error('Unable to find "'+fqn+'" on Kevoree registry.'));
            } else {
                var tdefModel = loader.loadModelFromString(tdefModelStr).get(0);
                var mergeSeq = compare.merge(model, tdefModel);
                mergeSeq.applyOn(model);
                cache.add(fqn, tdefModelStr);
                cb(null, tdef);
            }
        }

        // try to hit cache first
        if (cache.get(fqn)) {
            // cached tdef found
            firstHandler(null, cache.get(fqn));
        } else {
            // no cache found, hit registry
            registry.get({ fqns: [fqn] }, firstHandler);
        }

    } else if (tdefs.length === 1) {
        // there is 1 availability for that TDef
        cb(null, tdefs[0]);
    } else {
        // there are multiple versions of this TDef: take the greater version
        cb(null, getBestVersion(tdefs));
    }
};

module.exports.clearCache = function () {
    cache.clean();
};

module.exports.setCacheManager = function (cacheMgr) {
    cache = cacheMgr;
};

function getModelPath(fqn) {
    // check for version
    fqn = fqn.split('/');
    var vers;
    if (fqn.length === 2) {
        vers = fqn.pop();
    }

    fqn = fqn[0].split('.');
    var last = fqn.pop();
    fqn = 'packages[' + fqn.join(']/packages[') + ']/typeDefinitions[name=' + last;

    if (vers) {
        fqn += ',version=' + vers;
    }

    fqn += ']';

    return fqn;
}

/**
 * Tries to find the greater version (snapshot excluded), if none found, tries to find the greater version
 * snapshots included
 * @param tdefs
 * @returns {*}
 */
function getBestVersion(tdefs) {
    var onlyReleases = tdefs.filter(function (tdef) {
        var v = new SemVer(tdef.version);
        if (v.prerelease.length === 0) {
            return tdef;
        }
    });

    function getGreater(tdefs) {
        var tdef = tdefs[0];
        for (var i=0; i < tdefs.length; i++) {
            if (SemVer.gt(tdefs[i].version, tdef.version)) {
                tdef = tdefs[i];
            }
        }
        return tdef;
    }

    return getGreater((onlyReleases.length === 0) ? tdefs : onlyReleases);
}