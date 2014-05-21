/*jshint browser:true, node:false*/
/*global require, sinon*/

describe('WebRTC', function() {
  "use strict";

  var assert = window.assert;
  var sinon = window.sinon;

  var _ = require('lodash');
  var $ = require('jquery');

  var WebRTC = require('webrtc');
  var COMMON = require('webrtc/lib/common');

  var sandbox;

  before(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  var testWebrtc;

  var fakeRoom;

  var FakeUserCache;
  var FakeGoRTC;
  var FakeView;
  var FakeController;
  var listEl;
  var collapseBtnEl;
  var expandContainerEl;

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
    listEl = document.createElement('ul');
    collapseBtnEl = document.createElement('div');
    expandContainerEl = document.createElement('div');

    fakeRoom = {
      key: createFakeKey,
      self: createFakeKey
    };

    FakeUserCache = sandbox.stub().returns({
      initialize: sandbox.stub().yields(),
      destroy: sandbox.stub().yields(),
      getLocalUser: sandbox.stub(),
      on: sandbox.stub(),
      off: sandbox.stub()
    });

    FakeGoRTC = sandbox.stub().returns({
      on: sandbox.stub(),
      off: sandbox.stub()
    });

    FakeView = sandbox.stub().returns({
      initialize: sandbox.stub(),
      destroy: sandbox.stub(),
      toggleCollapse: sandbox.stub().yields(),
      addUser: sandbox.stub(),
      removeUser: sandbox.stub(),
      updateUser: sandbox.stub(),

      list: listEl,
      collapseBtn: collapseBtnEl,
      expandContainer: expandContainerEl
    });

    FakeController = sandbox.stub().returns({
      initialize: sandbox.stub(),
      destroy: sandbox.stub(),

      toggleJoin: sandbox.stub(),
      toggleMute: sandbox.stub(),
      togglePause: sandbox.stub(),
      toggleExpand: sandbox.stub()
    });
  });

  window.supported = WebRTC.supported;

  if (!WebRTC.supported) {
    it('throws on construction in unsupported browsers', function() {
      assert.exception(function() {
        /*jshint unused:false*/
        var webrtc = new WebRTC({ room: fakeRoom });
      });
    });

    return; // Use supported browser for remaining tests
  }

  describe('Constructor', function() {

    it('creates a new instance of the WebRTC widget', function() {
      var options = {
        room: fakeRoom
      };

      testWebrtc = new WebRTC(options);

      assert(testWebrtc instanceof WebRTC);
    });

    it('throws an error if missing the options object', function() {
      assert.exception(function() {
        testWebrtc = new WebRTC();
      }, 'WebRTC: Options object was not found or invalid');
    });

    it('throws an error if unknown argument is passed', function() {
      assert.exception(function() {
        testWebrtc = new WebRTC({ foo: 'bar' });
      }, 'WebRTC: Invalid argument passed');
    });

    it('throws an error if options is not object', function() {
      assert.exception(function() {
        testWebrtc = new WebRTC('foo');
      }, 'WebRTC: Options object was not found or invalid');
    });

    it('throws an error if invalid room option was passed', function() {
      assert.exception(function() {
        testWebrtc = new WebRTC({ room: 'foo' });
      }, 'WebRTC: Room was not found or invalid');
    });

    it('throws an error if invalid collapsed option is passed', function() {
      assert.exception(function() {
        testWebrtc = new WebRTC({ room: fakeRoom, collapsed: null });
      }, 'WebRTC: collapsed value must be a boolean');
    });

    it('throws an error if invalid listContainer is passed', function() {
      assert.exception(function() {
        testWebrtc = new WebRTC({ room: fakeRoom, listContainer: 'DOM' });
      }, 'WebRTC: listContainer must be a DOM element');
    });

    it('throws an error if invalid expandContainer is passed', function() {
      assert.exception(function() {
        testWebrtc = new WebRTC({ room: fakeRoom, expandContainer: 'DOM' });
      }, 'WebRTC: expandContainer must be a DOM element');
    });

    it('throws an error if invalid gortcOptions is passed', function() {
      var cfg = true;

      assert.exception(function() {
        testWebrtc = new WebRTC({ room: fakeRoom, gortcOptions: cfg});
      }, 'WebRTC: gortcOptions must be an object');
    });

    it('accepts gortcOptions', function() {
      testWebrtc = new WebRTC({
        room: fakeRoom,
        gortcOptions: {
          autoStart: true,
          peerConnectionConfig: {
            iceServers: 'test'
          }
        }
      });

      var opts = testWebrtc._validatedOptions.gortcOptions;

      assert.equal(opts.autoStart, true);
      assert.equal(opts.peerConnectionConfig.iceServers, 'test');
    });

    it('accepts deprecated options', function() {
      testWebrtc = new WebRTC({
        room: fakeRoom,
        autoStart: true,
        peerConnectionConfig: {
          iceServers: 'test'
        }
      });

      var opts = testWebrtc._validatedOptions.gortcOptions;

      assert.equal(opts.autoStart, true);
      assert.equal(opts.peerConnectionConfig.iceServers, 'test');
    });
  });

  describe('#initialize', function() {
    beforeEach(function(done) {
      var options = {
        room: fakeRoom,
        expandContainer: expandContainerEl
      };

      testWebrtc = new WebRTC(options);

      testWebrtc._UserCache = FakeUserCache;
      testWebrtc._View = FakeView;
      testWebrtc._Controller = FakeController;
      testWebrtc._goRTC = FakeGoRTC;

      sandbox.spy(testWebrtc._binder, 'on');
      sandbox.spy(testWebrtc._binder, 'off');
      sandbox.spy(testWebrtc, 'initialize');

      testWebrtc.initialize(done);
    });

    afterEach(function(done) {
      testWebrtc.destroy(done);
    });

    it ('Initializes the WebRTC widget successfully', function() {
      sinon.assert.calledOnce(testWebrtc.initialize);
    });

    it('Registers listeners to userCache events', function() {
      var userCacheEvents = {
        join: testWebrtc._view.addUser,
        leave: testWebrtc._view.removeUser,
        change: testWebrtc._view.updateUser
      };

      _.each(userCacheEvents, function(listener, event) {
        sinon.assert.calledWith(testWebrtc._userCache.on, event, listener);
      });
    });

    it('Registers listeners to DOM events', function() {
      var view = testWebrtc._view;
      var controller = testWebrtc._controller;

      sinon.assert.calledWith(testWebrtc._binder.on,
                              view.collapseBtn,
                              'click',
                              view.toggleCollapse);

      sinon.assert.calledWith(testWebrtc._binder.on,
                              view.list,
                              'click',
                              '.' + COMMON.JOIN_CLASS,
                              controller.toggleJoin);

      sinon.assert.calledWith(testWebrtc._binder.on,
                              view.list,
                              'click',
                              '.' + COMMON.LEAVE_CLASS,
                              controller.toggleJoin);

      sinon.assert.calledWith(testWebrtc._binder.on,
                              view.list,
                              'click',
                              '.' + COMMON.MUTE_CLASS,
                              controller.toggleMute);

      sinon.assert.calledWith(testWebrtc._binder.on,
                              view.list,
                              'click',
                              '.' + COMMON.PAUSE_CLASS,
                              controller.togglePause);
    });

    it('Registers listeners to expanded container DOM events', function() {
      var view = testWebrtc._view;
      var controller = testWebrtc._controller;

      sinon.assert.calledWith(testWebrtc._binder.on,
                              view.list,
                              'click',
                              '.' + COMMON.EXPAND_CLASS,
                              controller.toggleExpand);

      sinon.assert.calledWith(testWebrtc._binder.on,
                              expandContainerEl,
                              'click',
                              '.' + COMMON.EXPAND_CLASS,
                              controller.toggleExpand);

      sinon.assert.calledWith(testWebrtc._binder.on,
                              expandContainerEl,
                              'click',
                              '.' + COMMON.LEAVE_CLASS,
                              controller.toggleJoin);

      sinon.assert.calledWith(testWebrtc._binder.on,
                              expandContainerEl,
                              'click',
                              '.' + COMMON.MUTE_CLASS,
                              controller.toggleMute);

      sinon.assert.calledWith(testWebrtc._binder.on,
                              expandContainerEl,
                              'click',
                              '.' + COMMON.PAUSE_CLASS,
                              controller.togglePause);
    });
  });

  describe('#destroy', function() {
    beforeEach(function(done) {
      var options = {
        room: fakeRoom,
        expandContainer: expandContainerEl
      };

      testWebrtc = new WebRTC(options);

      testWebrtc._UserCache = FakeUserCache;
      testWebrtc._View = FakeView;
      testWebrtc._Controller = FakeController;
      testWebrtc._goRTC = FakeGoRTC;

      sandbox.spy(testWebrtc._binder, 'on');
      sandbox.spy(testWebrtc._binder, 'off');
      sandbox.spy(testWebrtc, 'destroy');

      testWebrtc.initialize(done);
    });

    it('Unbinds from the userCache', function() {
      testWebrtc.destroy(function(err) {
        if (err) {
          throw err;
        }

        var userCacheEvents = {
          join: testWebrtc._view.addUser,
          leave: testWebrtc._view.removeUser,
          change: testWebrtc._view.updateUser
        };

        _.each(userCacheEvents, function(listener, event) {
          sinon.assert.calledWith(testWebrtc._userCache.off, event, listener);
        });
      });
    });

    it('Unbinds from the DOM', function() {
      testWebrtc.destroy(function(err) {
        if (err) {
          throw err;
        }

        var view = testWebrtc._view;
        var controller = testWebrtc._controller;

        sinon.assert.calledWith(testWebrtc._binder.off,
                                view.collapseBtn,
                                'click',
                                view.toggleCollapse);

        sinon.assert.calledWith(testWebrtc._binder.off,
                                view.list,
                                'click',
                                '.' + COMMON.JOIN_CLASS,
                                controller.toggleJoin);

        sinon.assert.calledWith(testWebrtc._binder.off,
                                view.list,
                                'click',
                                '.' + COMMON.LEAVE_CLASS,
                                controller.toggleJoin);

        sinon.assert.calledWith(testWebrtc._binder.off,
                                view.list,
                                'click',
                                '.' + COMMON.MUTE_CLASS,
                                controller.toggleMute);

        sinon.assert.calledWith(testWebrtc._binder.off,
                                view.list,
                                'click',
                                '.' + COMMON.PAUSE_CLASS,
                                controller.togglePause);
      });
    });

    it('Unbinds the expanded container DOM events', function() {
      testWebrtc.destroy(function(err) {
        if (err) {
          throw err;
        }
      });

      var view = testWebrtc._view;
      var controller = testWebrtc._controller;

      sinon.assert.calledWith(testWebrtc._binder.off,
                              view.list,
                              'click',
                              '.' + COMMON.EXPAND_CLASS,
                              controller.toggleExpand);

      sinon.assert.calledWith(testWebrtc._binder.off,
                              expandContainerEl,
                              'click',
                              '.' + COMMON.EXPAND_CLASS,
                              controller.toggleExpand);

      sinon.assert.calledWith(testWebrtc._binder.off,
                              expandContainerEl,
                              'click',
                              '.' + COMMON.LEAVE_CLASS,
                              controller.toggleJoin);

      sinon.assert.calledWith(testWebrtc._binder.off,
                              expandContainerEl,
                              'click',
                              '.' + COMMON.MUTE_CLASS,
                              controller.toggleMute);

      sinon.assert.calledWith(testWebrtc._binder.off,
                              expandContainerEl,
                              'click',
                              '.' + COMMON.PAUSE_CLASS,
                              controller.togglePause);
    });
  });
});
