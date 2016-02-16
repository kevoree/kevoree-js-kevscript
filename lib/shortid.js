var CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

module.exports = function shortid() {
    var id = '';
    for (var i = 0; i < 9; i++) {
        id += CHARS[Math.floor(Math.random()*CHARS.length)];
    }
    return id;
};
