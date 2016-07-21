'use strict';

/**
 * MemoryCache
 * @constructor
 */
function MemoryCache() {
  this.cache = {};
}

MemoryCache.prototype = {

  /**
   *
   * @param key
   * @returns {*}
   */
  get: function (key) {
    return this.cache[key];
  },

  /**
   *
   * @param key
   * @param value
   */
  add: function (key, value) {
    this.cache[key] = value;
  },

  /**
   *
   * @param key
   */
  remove: function (key) {
    delete this.cache[key];
  },

  /**
   *
   */
  clear: function () {
    Object.keys(this.cache).forEach(function (key) {
      delete this.cache[key];
    }.bind(this));
    this.cache = {};
  }
};

module.exports = MemoryCache;
