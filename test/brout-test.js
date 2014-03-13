/*
 * brout.js
 *
 * Copyright (c) 2014 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
/*globals describe, it, beforeEach, afterEach*/
'use strict';

var brout  = require('../lib/brout');
var events = require('events');
var assert = require('assert');


function originalOut(str) {
  if (str.indexOf('# >>>') !== 0) {
    console.log.original.call(console, str.substring(0, str.length - 1));
  }
}


function originalErr(str) {
  if (str.indexOf('# >>>') !== 0) {
    console.error.original.call(console, str.substring(0, str.length - 1));
  }
}


brout.on('out', originalOut);
brout.on('err', originalErr);


function createFake() {
  function fake() {
    fake.called = true;
    fake.args   = Array.prototype.slice.call(arguments);
  }
  fake.called = false;
  return fake;
}


describe('brout', function () {

  var out;
  var err;

  beforeEach(function () {
    out = createFake();
    err = createFake();
    brout.on('out', out);
    brout.on('err', err);
  });

  afterEach(function () {
    brout.removeAllListeners();
    brout.on('out', originalOut);
    brout.on('err', originalErr);
  });

  it('is an instance of EventEmitter', function () {
    assert(brout instanceof events.EventEmitter);
  });

  it('emits out event on process.stdout.write', function () {
    process.stdout.write('# >>> Oh, hi!');

    assert(out.called);
    assert.deepEqual(out.args, ['# >>> Oh, hi!']);
  });

  it('emits err event on process.stderr.write', function () {
    process.stderr.write('# >>> Oh, hi!');

    assert(err.called);
    assert.deepEqual(err.args, ['# >>> Oh, hi!']);
  });

  it('emits out event on console.log', function () {
    console.log('# >>> Say %s!', 'hello');

    assert(out.called);
    assert.deepEqual(out.args, ['# >>> Say hello!\n']);
  });

  it('emits out event on console.info', function () {
    console.info('# >>> Say %s!', 'hello');

    assert(out.called);
    assert.deepEqual(out.args, ['# >>> Say hello!\n']);
  });

  it('emits err event on console.warn', function () {
    console.warn('# >>> Say %s!', 'hello');

    assert(err.called);
    assert.deepEqual(err.args, ['# >>> Say hello!\n']);
  });

  it('emits err event on console.error', function () {
    console.error('# >>> Say %s!', 'hello');

    assert(err.called);
    assert.deepEqual(err.args, ['# >>> Say hello!\n']);
  });

  it('emits exit event on process.exit', function () {
    var fake = createFake();
    brout.on('exit', fake);

    process.exit(7);

    assert(fake.called);
    assert.deepEqual(fake.args, [7]);
  });

  it('logs error on process.exit with code 1', function () {
    var previousOriginal = console.error.original;
    var fake = console.error.original = createFake();

    process.exit(1);
    console.error.original = previousOriginal;

    assert(fake.called);
    assert.deepEqual(fake.args, ['exit(1)']);
  });

  it('does not log error on process.exit with code 0', function () {
    var previousOriginal = console.error.original;
    var fake = console.error.original = createFake();

    process.exit(0);
    console.error.original = previousOriginal;

    assert(!fake.called);
  });

  it('prints result in original console.log if no listeners', function () {
    brout.removeAllListeners();
    var previousOriginal = console.log.original;
    var fake = console.log.original = createFake();

    process.stdout.write('Check\n');
    console.log.original = previousOriginal;
    brout.on('out', originalOut);
    brout.on('err', originalErr);

    assert(fake.called);
    assert.deepEqual(fake.args, ['Check']);
  });

  it('prints result in original console.warn if no listeners', function () {
    brout.removeAllListeners();
    var previousOriginal = console.warn.original;
    var fake = console.warn.original = createFake();

    process.stderr.write('Check\n');
    console.warn.original = previousOriginal;
    brout.on('out', originalOut);
    brout.on('err', originalErr);

    assert(fake.called);
    assert.deepEqual(fake.args, ['Check']);
  });

  it('collects multiple calls until newline is found', function () {
    brout.removeAllListeners();
    var previousOriginal = console.log.original;
    var fake = console.log.original = createFake();

    process.stdout.write('Check ');
    process.stdout.write('123!\n');
    console.log.original = previousOriginal;
    brout.on('out', originalOut);
    brout.on('err', originalErr);

    assert(fake.called);
    assert.deepEqual(fake.args, ['Check 123!']);
  });

  it('buffers additional characters after newline', function () {
    brout.removeAllListeners();
    var previousOriginal = console.log.original;
    var fake = console.log.original = createFake();

    process.stdout.write('Check\n123!');
    process.stdout.write('\n');
    console.log.original = previousOriginal;
    brout.on('out', originalOut);
    brout.on('err', originalErr);

    assert.deepEqual(fake.args, ['123!']);
  });

  it('logs multiple times for each newline', function () {
    brout.removeAllListeners();
    var previousOriginal = console.log.original;
    var fake = console.log.original = createFake();

    process.stdout.write('Check\n123!\n');
    console.log.original = previousOriginal;
    brout.on('out', originalOut);
    brout.on('err', originalErr);

    assert.deepEqual(fake.args, ['123!']);
  });

  it('logs traces', function () {
    var originalWrite = process.stdout.write;
    try {
      var fake = process.stdout.write = createFake();

      console.trace();

      assert(fake.called);
      var lines = fake.args[0].split('\n');
      assert(lines.length > 0);
      lines.slice(0, lines.length - 1).forEach(function (line) {
        assert.equal(line.indexOf("    at "), 0, line);
      });
      assert.equal(lines[lines.length - 1], '');
    } finally {
      process.stdout.write = originalWrite;
    }
  });

});
