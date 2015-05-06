/**
 * DefaultCache (= no cache)
 * @constructor
 */
function DefaultCache() {}

DefaultCache.prototype = {

    /**
     * noop
     * @param key
     * @returns {null}
     */
    get: function (key) {
        return null;
    },

    /**
     * noop
     * @param key
     * @param value
     */
    add: function (key, value) {},

    /**
     * noop
     * @param key
     */
    remove: function (key) {},

    /**
     * noop
     */
    clear: function () {}
};

module.exports = DefaultCache;