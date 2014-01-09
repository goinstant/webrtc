/*jshint browser:true, node:false*/
/*global require, sinon*/

describe('Controller', function() {
  "use strict";

  var assert = window.assert;
  var sinon = window.sinon;

  var _ = require('lodash');
  var $ = require('jquery');
  var classes = require('classes');

  var Controller = require('webrtc/lib/controller');
  var COMMON = require('webrtc/lib/common');

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
  var fakeView;
  var FakeController;
  var fakeLocalUser;
  var fakeLocalUserKey;
  var listEl;
  var collapseBtnEl;
  var expandContainerEl;

  function createFakeKey(name) {
    listEl = document.createElement('ul');
    collapseBtnEl = document.createElement('div');
    expandContainerEl = document.createElement('div');

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
      id: '1234'
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
      start: sandbox.stub(),
      stop: sandbox.stub(),
      mute: sandbox.stub(),
      unmute: sandbox.stub(),
      pause: sandbox.stub(),
      resume: sandbox.stub()
    });

    fakeView = {
      initialize: sandbox.stub(),
      destroy: sandbox.stub(),
      toggleCollapse: sandbox.stub().yields(),
      addUser: sandbox.stub(),
      removeUser: sandbox.stub(),
      updateUser: sandbox.stub(),
      expandUser: sandbox.stub(),
      restoreUser: sandbox.stub(),

      list: listEl,
      collapseBtn: collapseBtnEl,
      expandContainer: expandContainerEl
    };

    fakeWidget = {
      _room: fakeRoom,
      _userCache: fakeUserCache,
      _localUser: fakeUserCache.getLocalUser(),
      _view: fakeView
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

  describe('toggle controls', function() {

    var fakeLocalEvent;
    var fakePeerEvent;
    var peerVideoEl;

    beforeEach(function() {
      var userEl = document.createElement('li');
      var controlEl = document.createElement('div');

      classes(userEl).add(COMMON.USER_CLASS);
      userEl.setAttribute(COMMON.DATA_ID, fakeLocalUser.id);
      userEl.appendChild(controlEl);

      var peerUserEl = document.createElement('li');
      var peerControlEl = document.createElement('div');
      peerVideoEl = document.createElement('video');

      classes(peerUserEl).add(COMMON.USER_CLASS);
      classes(peerVideoEl).add(COMMON.STREAM_CLASS);
      peerUserEl.setAttribute(COMMON.DATA_ID, '2345');
      peerUserEl.appendChild(peerControlEl);
      peerUserEl.appendChild(peerVideoEl);

      fakeLocalEvent = {
        target: controlEl
      };

      fakePeerEvent = {
        target: peerControlEl
      };

      testController = new Controller(fakeWidget);
      testController._GoRTC = FakeGoRTC;

      testController.initialize();
    });

    afterEach(function() {
      testController.destroy();

      testController = null;
    });

    it('mutes self', function() {
      testController._streaming = true;
      testController._muted = false;
      testController.toggleMute(fakeLocalEvent);

      sinon.assert.calledOnce(testController._goRTC.mute);

      testController._muted = true;
      testController.toggleMute(fakeLocalEvent);

      sinon.assert.calledOnce(testController._goRTC.unmute);
    });

    it('mutes peer', function() {
      testController.toggleMute(fakePeerEvent);

      sinon.assert.notCalled(testController._goRTC.mute);
      assert.isTrue(peerVideoEl.muted);

      testController.toggleMute(fakePeerEvent);
      assert.isFalse(peerVideoEl.muted);
    });

    it('expand self', function() {
      var view = testController._view;
      testController._streaming = true;
      testController.toggleExpand(fakeLocalEvent);

      sinon.assert.calledOnce(view.expandUser);
      sinon.assert.calledWith(view.expandUser, fakeLocalUser.id);

      testController.toggleExpand(fakeLocalEvent);

      sinon.assert.calledOnce(view.restoreUser);
      sinon.assert.calledWith(view.restoreUser, fakeLocalUser.id);
    });

    it('pause self', function() {
      testController._streaming = true;
      testController._paused = false;
      testController.togglePause(fakeLocalEvent);

      sinon.assert.calledOnce(testController._goRTC.pause);

      testController._paused = true;
      testController.togglePause(fakeLocalEvent);

      sinon.assert.calledOnce(testController._goRTC.resume);
    });

    it('join self', function() {
      testController.toggleJoin(fakeLocalEvent);

      sinon.assert.calledOnce(testController._goRTC.start);

      testController._streaming = true;
      testController.toggleJoin(fakeLocalEvent);

      sinon.assert.calledOnce(testController._goRTC.stop);
    });
  });

  describe('#destroy', function() {

    beforeEach(function() {
      testController = new Controller(fakeWidget);
      testController.initialize();
    });

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
