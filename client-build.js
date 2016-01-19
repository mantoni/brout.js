/**
 * Created by cool.blue on 19-Aug-16.
 */

'use strict';

var fs = require('fs');
var sourceFile =  process.argv[2]; //"./test/brout-test.js";
var bundleFile = "./test/*-bundle.js";
var b = require('browserify');

var cleanup = function (next) {

  return function cleanup(e) {

    if (!e) {
      return fs.unlink(bundleFile, next);
    }

    if (e.code === 'ENOENT') {
      next();
    }

  };
};

function build() {
  b(sourceFile).bundle().pipe(process.stdout);
}

fs.stat(bundleFile, cleanup(build));
