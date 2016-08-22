/*
 * brout.js
 *
 * Copyright (c) 2014 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
/*global window*/
'use strict';

var events = require('events');
var util   = require('util');

var emitter = new events.EventEmitter();

if (!window.console) {
  window.console = {
    log   : function () { return; },
    info  : function () { return; },
    warn  : function () { return; },
    error : function () { return; }
  };
}

if (!window.process) {
  window.process = process;
  process._brout = emitter;
}

function createEmitter(event, fallback) {
  var buffer = '';
  return function (str) {
    if (emitter.listeners(event).length) {
      emitter.emit(event, str);
    } else {
      buffer += str;
      var p = buffer.indexOf('\n');
      while (p !== -1) {
        console[fallback].original.call(console, buffer.substring(0, p));
        buffer = buffer.substring(p + 1);
        p = buffer.indexOf('\n');
      }
    }
  };
}

function installWrite(prop, event, fallback) {
  if (!process[prop]) {
    process[prop] = {};
  }
  process[prop].write = createEmitter(event, fallback);
}

function redirectLog(prop, out) {
  console[prop] = function () {
    process[out].write(util.format.apply(console, arguments) + '\n');
  };
}

installWrite('stdout', 'out', 'log');
installWrite('stderr', 'err', 'warn');

var originalLog   = console.log.original || console.log;
var originalInfo  = console.info.original || console.info;
var originalWarn  = console.warn.original || console.warn;
var originalError = console.error.original || console.error;
var originalTrace = console.trace.original || console.trace;

redirectLog('log', 'stdout');
redirectLog('info', 'stdout');
redirectLog('warn', 'stderr');
redirectLog('error', 'stderr');


console.trace = function () {
  try {
    throw new Error();
  } catch (e) {
    var stack = e.stack;
    if (stack) {
      stack = stack.split('\n').slice(2).join('<--\n');
      process.stdout.write(stack + '\n');
    }
  }
};

console.log.original   = originalLog;
console.info.original  = originalInfo;
console.warn.original  = originalWarn;
console.error.original = originalError;
console.trace.original = originalTrace;

process.exit = function (code) {
  if (emitter.listeners('exit').length) {
    emitter.emit('exit', code);
  } else if (code) {
    console.error.original.call(console, 'exit(' + code + ')');
  }
};

module.exports = emitter;
