function CacheManager() {}
CacheManager.prototype.get = function (key) {
    return localStorage.getItem(key);
};
CacheManager.prototype.add = CacheManager.prototype.put = function (key, value) {
    localStorage.setItem(key, value);
};
CacheManager.prototype.remove = CacheManager.prototype.delete = function (key) {
    localStorage.remove(key);
};
CacheManager.prototype.getAll = function () {
    var ret = [];
    localStorage.keys().forEach(function (key) {
        ret.push(localStorage.getItem(key));
    });
    return ret;
};
CacheManager.prototype.clear = function () {
    localStorage.keys().forEach(function (key) {
        localStorage.remove(key);
    }.bind(this));
};

var kevs = new KevoreeKevscript(new CacheManager());

var script =
    'add node: JavascriptNode\n' +
    'add sync: WSGroup/5.2.9-SNAPSHOT\n' +
    'attach node sync';

kevs.parse(script, function (err, model) {
    if (err) {
        console.log('BOUM');
        throw err;
    } else {
        console.log('OK');
        console.log(model);
    }
});