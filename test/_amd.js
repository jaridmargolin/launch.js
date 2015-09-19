/*!
 * test/_amd.js
 */

define(function (require) {


/* -----------------------------------------------------------------------------
 * dependencies
 * ---------------------------------------------------------------------------*/

var assert = require('proclaim');
var launch = require('launch/launch');


/* -----------------------------------------------------------------------------
 * test
 * ---------------------------------------------------------------------------*/

describe('amd - launch.js', function () {

  it('Should expose methods.', function () {
    assert.isFunction(launch.open);
    assert.isFunction(launch.get);
  });

});


});