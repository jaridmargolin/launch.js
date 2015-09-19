/*!
 * test/launch.js
 */

define(function (require) {


/* -----------------------------------------------------------------------------
 * dependencies
 * ---------------------------------------------------------------------------*/

var assert = require('proclaim');
var sinon = require('sinon');
var launch = require('launch');


/* -----------------------------------------------------------------------------
 * test
 * ---------------------------------------------------------------------------*/

describe('launch.js', function () {

  it('Should expose methods.', function () {
    assert.isFunction(launch.open);
    assert.isFunction(launch.get);
  });

});


});