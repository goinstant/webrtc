/*jshint browser:true, node:false*/
/*global require, sinon*/

describe('Controller', function() {
  "use strict";

  var assert = window.assert;
  var sinon = window.sinon;

  var _ = require('lodash');
  var $ = require('jquery');

  var Controller = require('webrtc/lib/controller');

  var sandbox;

  before(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  var testController;

  var fakeRoom;

  var fakeWidget;
  var fakeUserCache;
  var FakeGoRTC;
  var FakeView;
  var FakeController;
  var expandContainer;
  var fakeLocalUser;
  var fakeLocalUserKey;

  function createFakeKey(name) {
    return {
      name: name,
      get: sinon.stub().yields(),
      set: sinon.stub(),
      key: createFakeKey,
      remove: sinon.stub().yields(),
      on: sinon.stub(),
      off: sinon.stub()
    };
  }

  beforeEach(function() {
    fakeLocalUser = {
      displayName: 'Bob',
      id: 1234
    };

    fakeLocalUserKey = createFakeKey('/.users/' + fakeLocalUser.id);

    fakeRoom = {
      key: createFakeKey,
      self: sandbox.stub().returns(fakeLocalUserKey),
      channel: sandbox.stub()
    };

    fakeUserCache = {
      getLocalUser: sandbox.stub().returns(fakeLocalUser)
    };

    FakeGoRTC = sandbox.stub().returns({
      on: sandbox.stub(),
      off: sandbox.stub(),
      stop: sandbox.stub()
    });

    FakeView = sandbox.stub().returns({
      initialize: sandbox.stub(),
      destroy: sandbox.stub(),
      toggleCollapse: sandbox.stub().yields(),
      addUser: sandbox.stub(),
      removeUser: sandbox.stub(),
      updateUser: sandbox.stub(),

      list: document.createElement('ul'),
      collapseBtn: document.createElement('div'),
      expandContainer: document.createElement('div')
    });

    fakeWidget = {
      _room: fakeRoom,
      _userCache: fakeUserCache,
      _localUser: fakeUserCache.getLocalUser()
    };
  });

  describe('Constructor', function() {

    it('creates a new instance of the Controller', function() {
      testController = new Controller(fakeWidget);

      assert(testController instanceof Controller);
    });
  });

  describe('#initialize', function() {

    beforeEach(function() {
      testController = new Controller(fakeWidget);

      testController._GoRTC = FakeGoRTC;

      testController.initialize();
    });

    afterEach(function() {
      testController.destroy();
    });

    it ('Registers listeners to gortc events', function() {
      var gortcEvents = {
        localStream: testController._addLocalStream,
        localStreamStopped: testController._removeLocalStream,
        peerStreamAdded: testController._addPeerStream,
        peerStreamRemoved: testController._removePeerStream,
        speaking: testController._setSpeaking,
        stoppedSpeaking: testController._setNotSpeaking,
        audioOff: testController._setMuted,
        audioOn: testController._setUnmuted,
        videoOff: testController._setPaused,
        videoOn: testController._setResumed
      };

      _.each(gortcEvents, function(listener, event) {
        sinon.assert.calledWith(testController._goRTC.on, event, listener);
      });
    });
  });

  describe('#destroy', function() {
    it('Unbinds from gortc', function() {
      testController.destroy(function(err) {
        if (err) {
          throw err;
        }

        sinon.assert.calledOnce(testController._goRTC.off);
        sinon.assert.calledOnce(testController._goRTC.stop);
      });
    });
  });
});
