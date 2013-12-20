/*jshint browser:true, node:false*/
/*global require, sinon*/

describe('WebRTC', function() {
  "use strict";

  var WebRTC = require('webrtc');

  var assert = window.assert;
  var sinon = window.sinon;

  var _ = window._;

  var webRTC;

  var sandbox;

  before(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  beforeEach(function(done) {
    webRTC = new WebRTC();
    webRTC.initialize(done);
  });

  afterEach(function(done) {
    webRTC.destroy(done);
  });

  describe('Constructor', function() {

    it('creates a new instance of the WebRTC widget', function() {
      assert(webRTC instanceof WebRTC);
    });
  });
});
