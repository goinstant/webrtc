/*jshint browser:true, node:false*/
/*global require, sinon*/

describe('View', function() {
  "use strict";

  var assert = window.assert;
  var sinon = window.sinon;

  var _ = require('lodash');
  var $ = require('jquery');
  var classes = require('classes');

  var View = require('webrtc/lib/view');
  var COMMON = require('webrtc/lib/common');

  var sandbox;

  // Ignore tests for unsupported browsers
  if(!window.supported) {
    return;
  }

  before(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  var testView;

  var fakeRoom;

  var fakeWidget;
  var fakeWidgetWithTemplates;
  var fakeUserCache;
  var fakeUsers;
  var fakeLocalUser;
  var fakeLocalUserKey;
  var listContainerEl;
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
    listContainerEl = document.createElement('ul');
    expandContainerEl = document.createElement('div');

    document.body.appendChild(listContainerEl);
    document.body.appendChild(expandContainerEl);

    fakeLocalUser = {
      displayName: 'Bob',
      id: '1234'
    };

    fakeUsers = [
      fakeLocalUser,
      {
        displayName: 'Joe',
        id: '2345'
      },
      {
        displayName: 'Sally',
        id: '3456'
      },
      {
        displayName: 'Larry',
        id: '4567'
      }
    ];

    fakeLocalUserKey = createFakeKey('/.users/' + fakeLocalUser.id);

    fakeRoom = {
      key: createFakeKey,
      self: sandbox.stub().returns(fakeLocalUserKey),
      channel: sandbox.stub()
    };

    fakeUserCache = {
      getLocalUser: sandbox.stub().returns(fakeLocalUser),
      getAll: sandbox.stub().returns(fakeUsers)
    };

    fakeWidget = {
      _room: fakeRoom,
      _userCache: fakeUserCache,
      _localUser: fakeUserCache.getLocalUser(),
      _validatedOptions: {
        listContainer: null,
        expandContainer: null,
        collapsed: false
      }
    };

    fakeWidgetWithTemplates = {
      _room: fakeRoom,
      _userCache: fakeUserCache,
      _localUser: fakeUserCache.getLocalUser(),
      _validatedOptions: {
        listContainer: null,
        expandContainer: null,
        listTemplate: '<div class="custom-list-template"><div class="gi-list"></div></div>',
        userTemplate: '<div class="custom-user-template"><div class="gi-name gi-color gi-expand"></div></div>',
        localUserTemplate: '<div class="custom-local-user-template"><div class="gi-name gi-color gi-expand"></div></div>',
        collapsed: false
      }
    };
  });

  afterEach(function() {
    listContainerEl.parentNode.removeChild(listContainerEl);
    expandContainerEl.parentNode.removeChild(expandContainerEl);
  });

  describe('Constructor', function() {

    it('creates a new instance of the View', function() {
      testView = new View(fakeWidget);

      assert(testView instanceof View);
    });
  });

  describe('#initialize', function() {

    afterEach(function() {
      testView.destroy();
    });

    it ('appends the user list to the body', function() {
      testView = new View(fakeWidget);
      testView.initialize();

      var wrapper = $('.' + COMMON.WIDGET_CLASS);
      assert.equal(wrapper.length, 1);
      assert.equal(wrapper[0].parentElement, document.body);
      assert.isFalse(classes(wrapper[0]).has(COMMON.COLLAPSED_CLASS));

      var list = wrapper.find('.' + COMMON.LIST_CLASS);
      assert.equal(list.children().length, fakeUsers.length);
    });

    it('appends the user list to the list container', function() {
      fakeWidget._validatedOptions.listContainer = listContainerEl;

      testView = new View(fakeWidget);
      testView.initialize();

      var wrapper = $('.' + COMMON.WIDGET_CLASS);
      assert.equal(wrapper.length, 1);
      assert.equal(wrapper[0].parentElement, listContainerEl);
    });

    it('appends the user list to the list container', function() {
      fakeWidget._validatedOptions.collapsed = true;

      testView = new View(fakeWidget);
      testView.initialize();

      var wrapper = $('.' + COMMON.WIDGET_CLASS);
      assert.equal(wrapper.length, 1);
      assert.isTrue(classes(wrapper[0]).has(COMMON.COLLAPSED_CLASS));
    });

    it('sets up the expand container', function() {
      fakeWidget._validatedOptions.expandContainer = expandContainerEl;

      testView = new View(fakeWidget);
      testView.initialize();

      assert.isTrue(classes(expandContainerEl).has(COMMON.WIDGET_CLASS));
    });
  });

  describe('#addUser', function () {

    beforeEach(function() {
      fakeUserCache.getAll = sandbox.stub().returns(null);
      testView = new View(fakeWidget);
      testView.initialize();
    });

    afterEach(function() {
      testView.destroy();
    });

    it('adds a user to the list', function() {
      testView.addUser(fakeUsers[1]);
      testView.addUser(fakeUsers[3]);

      var list = $('.' + COMMON.LIST_CLASS);
      var firstUser = list.children().eq(1)[0];
      var secondUser = list.children().eq(2)[0];

      assert.equal(firstUser.getAttribute(COMMON.DATA_ID), fakeUsers[1].id);
      assert.equal(secondUser.getAttribute(COMMON.DATA_ID), fakeUsers[3].id);
    });

    it('adds the local user to the front of the list', function() {
      testView.addUser(fakeUsers[2]);
      testView.addUser(fakeUsers[3]);
      testView.addUser(fakeLocalUser);

      var list = $('.' + COMMON.LIST_CLASS);
      var firstUser = list.children().first()[0];

      assert.equal(firstUser.getAttribute(COMMON.DATA_ID), fakeLocalUser.id);
    });
  });

  describe('#removeUser', function() {

    beforeEach(function() {
      testView = new View(fakeWidget);
      testView.initialize();
    });

    afterEach(function() {
      testView.destroy();
    });

    it('removes the given user id', function() {
      testView.removeUser(fakeUsers[2]);

      var list = $('.' + COMMON.LIST_CLASS);
      var user = list.find('[' + COMMON.DATA_ID + '="' + fakeUsers[2].id + '"]');

      assert.equal(user.length, 0);
    });
  });

  describe('#updateUser', function() {
    beforeEach(function() {
      testView = new View(fakeWidget);
      testView.initialize();
    });

    afterEach(function() {
      testView.destroy();
    });

    it('updates an existing user', function() {
      var id = fakeUsers[1].id;
      var path = '/.users/' + id + '/';
      var fakeDnKey = createFakeKey(path + 'displayName');
      var fakeAcKey = createFakeKey(path + 'avatarColor');
      var fakeMutedKey = createFakeKey(path + COMMON.NAMESPACE + 'muted');
      var fakeSpeakingKey = createFakeKey(path + COMMON.NAMESPACE + 'speaking');
      var fakePausedKey = createFakeKey(path + COMMON.NAMESPACE + 'paused');

      var user = _.clone(fakeUsers[1]);
      user.displayName = 'test123';
      user.avatarColor = '#ffffff';
      user.goinstant = {
        widgets: {
          webrtc: {
            muted: true,
            speaking: true,
            paused: true
          }
        }
      };

      testView.updateUser(user, fakeDnKey.name);
      testView.updateUser(user, fakeAcKey.name);
      testView.updateUser(user, fakeMutedKey.name);
      testView.updateUser(user, fakeSpeakingKey.name);
      testView.updateUser(user, fakePausedKey.name);

      var userEl = $('[' + COMMON.DATA_ID + '="' + user.id + '"]');
      var audioEl = userEl.find('.' + COMMON.AUDIO_CLASS);
      var nameEl = userEl.find('.' + COMMON.NAME_CLASS);
      var colorEl = userEl.find('.' + COMMON.COLOR_CLASS);

      assert.equal(nameEl.text(), user.displayName);
      assert.equal(colorEl.css('background-color'), 'rgb(255, 255, 255)');
      assert.isTrue(classes(userEl[0]).has(COMMON.MUTED_CLASS));
      assert.isTrue(classes(userEl[0]).has(COMMON.PAUSED_CLASS));
      assert.isTrue(classes(audioEl[0]).has(COMMON.SPEAKING_CLASS));
    });
  });

  describe('#expandUser, #restoreUser', function() {
    beforeEach(function() {
      fakeWidget._validatedOptions.expandContainer = expandContainerEl;

      testView = new View(fakeWidget);
      testView.initialize();
    });

    afterEach(function() {
      testView.destroy();
    });

    it('expands the given user', function() {
      testView.expandUser(fakeUsers[1].id);

      var expandedUser = $(expandContainerEl).find('.' + COMMON.USER_CLASS)[0];
      assert.equal(expandedUser.getAttribute(COMMON.DATA_ID), fakeUsers[1].id);

      testView.expandUser(fakeUsers[2].id);
      expandedUser = $(expandContainerEl).find('.' + COMMON.USER_CLASS)[0];
      var fakeUser1Sel = '[' + COMMON.DATA_ID + '="' + fakeUsers[1].id + '"]';
      var restoredUser = $('.' + COMMON.OVERRIDE_CLASS).find(fakeUser1Sel)[0];

      assert.equal(expandedUser.getAttribute(COMMON.DATA_ID), fakeUsers[2].id);
      assert.equal(restoredUser.getAttribute(COMMON.DATA_ID), fakeUsers[1].id);
    });
  });

  describe('#addStream, #removeStream', function() {
    beforeEach(function() {
      testView = new View(fakeWidget);
      testView.initialize();
    });

    afterEach(function() {
      testView.destroy();
    });

    it('#addStream', function() {
      var user = fakeUsers[2];
      var fakeStream = document.createElement('video');
      var fakeStreamObj = {
        getVideoTracks: sinon.stub().returns(['1'])
      };

      testView.addStream(user, fakeStream, fakeStreamObj);

      var list = $('.' + COMMON.LIST_CLASS);
      var fakeUserSel = '[' + COMMON.DATA_ID + '="' + fakeUsers[2].id + '"]';
      var userEl = $(fakeUserSel);
      var videoEl = userEl.find('.' + COMMON.STREAM_CLASS);

      assert.equal(videoEl.length, 1);
    });

    it('#removeStream', function() {
      var user = fakeUsers[3];
      var fakeStream = document.createElement('video');
      var fakeStreamObj = {
        getVideoTracks: sinon.stub().returns(['1'])
      };

      testView.addStream(user, fakeStream, fakeStreamObj);
      testView.removeStream(fakeUsers[3].id);

      var list = $('.' + COMMON.LIST_CLASS);
      var fakeUserSel = '[' + COMMON.DATA_ID + '="' + fakeUsers[3].id + '"]';
      var userEl = $(fakeUserSel);
      var videoEl = userEl.find('.' + COMMON.STREAM_CLASS);

      assert.equal(videoEl.length, 0);
    });
  });

  describe('#toggleCollapse', function() {
    beforeEach(function() {
      testView = new View(fakeWidget);
      testView.initialize();
    });

    afterEach(function() {
      testView.destroy();
    });

    it('toggles the collapse class', function() {
      testView.toggleCollapse();

      assert.isTrue(classes($('.' + COMMON.WIDGET_CLASS)[0])
        .has(COMMON.COLLAPSED_CLASS));

      testView.toggleCollapse();

      assert.isFalse(classes($('.' + COMMON.WIDGET_CLASS)[0])
        .has(COMMON.COLLAPSED_CLASS));
    });
  });

  describe('#destroy', function() {

    it('removes the wrapper from the body', function() {
      testView = new View(fakeWidget);
      testView.initialize();

      testView.destroy();

      var wrapper = $('.' + COMMON.WIDGET_CLASS);
      assert.equal(wrapper.length, 0);
    });

    it('removes the wrapper from the list container', function() {
      fakeWidget._validatedOptions.listContainer = listContainerEl;

      testView = new View(fakeWidget);
      testView.initialize();

      testView.destroy();

      var wrapper = $('.' + COMMON.WIDGET_CLASS);
      assert.equal(wrapper.length, 0);
    });

    it('removes the expanded list from the expand container', function() {
      fakeWidget._validatedOptions.listContainer = expandContainerEl;

      testView = new View(fakeWidget);
      testView.initialize();

      testView.destroy();

      var expandedList = $(expandContainerEl).find('.' + COMMON.LIST_CLASS);
      assert.equal(expandedList.length, 0);
    });
  });

  describe('custom templates', function() {
    beforeEach(function() {
      testView = new View(fakeWidgetWithTemplates);
      testView.initialize();
    });

    afterEach(function() {
      testView.destroy();
    });

    it ('uses a custom listTemplate when one is provided', function() {
      var wrapper = $('.' + COMMON.WIDGET_CLASS);
      assert.isTrue(classes(wrapper[0].firstChild).has('custom-list-template'));
    });

    it ('uses a custom userTemplate when one is provided', function() {
      testView.addUser(fakeUsers[1]);

      var list = $('.' + COMMON.LIST_CLASS);
      var firstUser = list.children().eq(1)[0];

      assert.isTrue(classes(firstUser.firstChild).has('custom-user-template'));
    });

    it ('uses a custom localUserTemplate when one is provided', function() {
      var list = $('.' + COMMON.LIST_CLASS);
      var localUser = list.find('.gi-local')[0];

      assert.isTrue(classes(localUser.firstChild).has('custom-local-user-template'));
    });
  });
});
