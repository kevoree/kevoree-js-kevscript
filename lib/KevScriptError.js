'use strict';

var util = require('util');

function KevScriptError(message, pos) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;
  this.pos = pos;
}

util.inherits(KevScriptError, Error);

module.exports = KevScriptError;
