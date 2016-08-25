'use strict';

var util = require('util');

function KevScriptError(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;
}

util.inherits(KevScriptError, Error);

module.exports = KevScriptError;
