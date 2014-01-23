/*
 * brout.js
 *
 * Copyright (c) 2014 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
/*globals describe, it, beforeEach, afterEach*/
'use strict';

var stdio  = require('../lib/stdio');
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


stdio.on('out', originalOut);
stdio.on('err', originalErr);


function createFake() {
  function fake() {
    fake.called = true;
    fake.args   = Array.prototype.slice.call(arguments);
  }
  fake.called = false;
  return fake;
}


describe('stdio', function () {

  var out;
  var err;

  beforeEach(function () {
    out = createFake();
    err = createFake();
    stdio.on('out', out);
    stdio.on('err', err);
  });

  afterEach(function () {
    stdio.removeAllListeners();
    stdio.on('out', originalOut);
    stdio.on('err', originalErr);
  });

  it('is an instance of EventEmitter', function () {
    assert(stdio instanceof events.EventEmitter);
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
    stdio.on('exit', fake);

    process.exit(7);

    assert(fake.called);
    assert.deepEqual(fake.args, [7]);
  });

  it('prints result in original console.log if no listeners', function () {
    stdio.removeAllListeners();
    var previousOriginal = console.log.original;
    var fake = console.log.original = createFake();

    process.stdout.write('Check\n');
    console.log.original = previousOriginal;
    stdio.on('out', originalOut);
    stdio.on('err', originalErr);

    assert(fake.called);
    assert.deepEqual(fake.args, ['Check']);
  });

  it('prints result in original console.warn if no listeners', function () {
    stdio.removeAllListeners();
    var previousOriginal = console.warn.original;
    var fake = console.warn.original = createFake();

    process.stderr.write('Check\n');
    console.warn.original = previousOriginal;
    stdio.on('out', originalOut);
    stdio.on('err', originalErr);

    assert(fake.called);
    assert.deepEqual(fake.args, ['Check']);
  });

  it('collects multiple calls until newline is found', function () {
    stdio.removeAllListeners();
    var previousOriginal = console.log.original;
    var fake = console.log.original = createFake();

    process.stdout.write('Check ');
    process.stdout.write('123!\n');
    console.log.original = previousOriginal;
    stdio.on('out', originalOut);
    stdio.on('err', originalErr);

    assert(fake.called);
    assert.deepEqual(fake.args, ['Check 123!']);
  });

  it('buffers additional characters after newline', function () {
    stdio.removeAllListeners();
    var previousOriginal = console.log.original;
    var fake = console.log.original = createFake();

    process.stdout.write('Check\n123!');
    process.stdout.write('\n');
    console.log.original = previousOriginal;
    stdio.on('out', originalOut);
    stdio.on('err', originalErr);

    assert.deepEqual(fake.args, ['123!']);
  });

  it('logs multiple times for each newline', function () {
    stdio.removeAllListeners();
    var previousOriginal = console.log.original;
    var fake = console.log.original = createFake();

    process.stdout.write('Check\n123!\n');
    console.log.original = previousOriginal;
    stdio.on('out', originalOut);
    stdio.on('err', originalErr);

    assert.deepEqual(fake.args, ['123!']);
  });

});
