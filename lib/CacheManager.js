function CacheManager() {
    this.cache = {};
}

CacheManager.prototype.get = function (key) {
    return this.cache[key];
};

CacheManager.prototype.add = CacheManager.prototype.put = function (key, value) {
    this.cache[key] = value;
};

CacheManager.prototype.remove = CacheManager.prototype.delete = function (key) {
    delete this.cache[key];
};

CacheManager.prototype.clear = function () {
    Object.keys(this.cache).forEach(function (key) {
        delete this.cache[key];
    }.bind(this));
    this.cache = {};
};

module.exports = CacheManager;