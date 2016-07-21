'use strict';

/**
 * NoCache
 * @constructor
 */
function NoCache() {}

NoCache.prototype = {

  /**
   * noop
   * @param key
   * @returns {null}
   */
  get: function () {
    return null;
  },

  /**
   * noop
   * @param key
   * @param value
   */
  add: function () {
    // noop
  },

  /**
   * noop
   * @param key
   */
  remove: function () {},

  /**
   * noop
   */
  clear: function () {}
};

module.exports = NoCache;
