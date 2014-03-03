/*jshint browser:true*/
/*global module, require*/
'use strict';

/**
 * @fileoverview
 * Handles updating and appending new users to the WebRTC widget.
 */

/**
 * @requires
 */
var _ = require('lodash');
var classes = require('classes');
var closest = require('closest');

/**
 * templates
 */
var listTemplate = require('../templates/list-template.html');
var userTemplate = require('../templates/user-template.html');
var localUserTemplate = require('../templates/local-user-template.html');

/**
 * @const
 */
var COMMON = require('./common');

/**
 * @constructor
 */
function View(widget) {
  var options = widget._validatedOptions;

  this._listContainer = options.listContainer;
  this.expandContainer = options.expandContainer;
  this._expandList = null;

  this._collapsed = options.collapsed;

  this._userCache = widget._userCache;

  this._wrapper = null;
  this._collapseWrapper = null;
  this._listWrapper = null;

  this.list = null;
  this.collapseBtn = null;

  this._localUser = widget._localUser;
  this._expandedId = null;

  _.bindAll(this, [
    'addUser',
    'removeUser',
    'updateUser',
    'toggleCollapse'
  ]);
}

View.prototype.initialize = function() {
  if (this.expandContainer) {
    classes(this.expandContainer).add(COMMON.WIDGET_CLASS);
    classes(this.expandContainer).add(COMMON.EXPAND_CONTAINER_CLASS);

    this._expandList = document.createElement('ul');
    classes(this._expandList).add(COMMON.LIST_CLASS);
    this.expandContainer.appendChild(this._expandList);
  }

  this._wrapper = document.createElement('div');
  classes(this._wrapper).add(COMMON.WIDGET_CLASS);
  classes(this._wrapper).add(COMMON.OVERRIDE_CLASS);

  if (this._collapsed) {
    classes(this._wrapper).add(COMMON.COLLAPSED_CLASS);
  }

  this._wrapper.innerHTML = listTemplate;

  this._collapseWrapper = this._wrapper
    .querySelector('.' + COMMON.COLLAPSE_WRAPPER_CLASS);
  this._listWrapper = this._wrapper
    .querySelector('.' + COMMON.LIST_WRAPPER_CLASS);
  this.list = this._wrapper.querySelector('.' + COMMON.LIST_CLASS);

  this.addUser(this._localUser);

  var localUserEl = this._getUserEl(this._localUser.id);

  classes(localUserEl).add(COMMON.LOCAL_CLASS);

  this.collapseBtn = this._wrapper.querySelector('.' + COMMON.COLLAPSE_CLASS);

  this._addAllUsers();

  if (this._listContainer) {
    classes(this._wrapper).add(COMMON.CUSTOM_CONTAINER_CLASS);
    this._listContainer.appendChild(this._wrapper);

  } else {
    document.body.appendChild(this._wrapper);
  }
};

View.prototype._addAllUsers = function() {
  var allUsers = this._userCache.getAll();

  var self = this;

  _.each(allUsers, function(user) {
    // Already added the local user to the front of the list
    if (user.id === self._localUser.id) {
      return;
    }

    self.addUser(user);
  });
};

View.prototype.addUser = function(user) {
  if (!user) {
    return;
  }

  var template = userTemplate;

  var id = user.id;
  var expanded = this._expandedId === id;
  var container = null;
  var userEl;

  if (id === this._localUser.id) {
    template = localUserTemplate;
  }

  userEl = document.createElement('li');

  if (!expanded) {
    container = this.list;

  } else {
    classes(userEl).add(COMMON.EXPANDED_CLASS);
    container = this._expandList;
  }

  classes(userEl).add(COMMON.USER_CLASS);
  userEl.setAttribute(COMMON.DATA_ID, user.id);
  userEl.innerHTML = template;

  // Hide expand controls
  if (!this.expandContainer) {
    var expandEl = userEl.querySelector('.' + COMMON.EXPAND_CLASS);
    expandEl.style.display = 'none';
  }

  var colorEl = userEl.querySelector('.' + COMMON.COLOR_CLASS);
  colorEl.style.backgroundColor = user.avatarColor;

  var displayName = document.createTextNode(user.displayName);
  var nameEl = userEl.querySelector('.' + COMMON.NAME_CLASS);
  nameEl.appendChild(displayName);

  var namespace = null;

  // Handle muted and speaking state
  if (user.goinstant &&
      user.goinstant.widgets &&
      user.goinstant.widgets.webrtc) {

    namespace = user.goinstant.widgets.webrtc;

    var audioEl = userEl.querySelector('.' + COMMON.AUDIO_CLASS);

    if (namespace.muted) {
      classes(userEl).add(COMMON.MUTED_CLASS);
    }

    if (namespace.speaking) {
      classes(audioEl).add(COMMON.SPEAKING_CLASS);
    }
  }

  var frontUser = container.firstChild;
  if (id !== this._localUser.id || !frontUser) {
    container.appendChild(userEl);

    return;
  }

  container.insertBefore(userEl, frontUser);
};

View.prototype.removeUser = function(user) {
  if (!user) {
    return;
  }

  var userEl = this._getUserEl(user.id);
  userEl.parentNode.removeChild(userEl);
};

View.prototype.updateUser = function(user, key) {
  key = key.split('/');
  key.splice(0, 3); // Remove /users/userid

  var id = user.id;
  var targetKey = key.join('/');

  var userEl = this._getUserEl(id);
  var audioEl = null;

  switch(targetKey) {
    case 'displayName':
      var nameEl = userEl.querySelector('.' + COMMON.NAME_CLASS);
      nameEl.removeChild(nameEl.firstChild);

      var textNode = document.createTextNode(user.displayName);
      nameEl.appendChild(textNode);

      break;

    case 'avatarColor':
      var colorEl = userEl.querySelector('.' + COMMON.COLOR_CLASS);
      colorEl.style.backgroundColor = user.avatarColor;

      break;

    case COMMON.NAMESPACE + 'muted':
      audioEl = userEl.querySelector('.' + COMMON.AUDIO_CLASS);

      if (user.goinstant.widgets.webrtc.muted) {
        classes(userEl).add(COMMON.MUTED_CLASS);

      } else {
        classes(userEl).remove(COMMON.MUTED_CLASS);
      }

      break;

    case COMMON.NAMESPACE + 'speaking':
      audioEl = userEl.querySelector('.' + COMMON.AUDIO_CLASS);

      if (user.goinstant.widgets.webrtc.speaking) {
        classes(audioEl).add(COMMON.SPEAKING_CLASS);

      } else {
        classes(audioEl).remove(COMMON.SPEAKING_CLASS);
      }

      break;

    case COMMON.NAMESPACE + 'paused':
      if (user.goinstant.widgets.webrtc.paused) {
        classes(userEl).add(COMMON.PAUSED_CLASS);

      } else {
        classes(userEl).remove(COMMON.PAUSED_CLASS);
      }

      break;
  }
};

View.prototype._insertUser = function(userEl) {
  if (!userEl) {
    return;
  }

  var frontUser = this.list.firstChild;
  var id = userEl.getAttribute(COMMON.DATA_ID);

  if (id !== this._localUser.id || !frontUser) {
    this.list.appendChild(userEl);

    return;
  }

  this.list.insertBefore(userEl, frontUser);
};

View.prototype.expandUser = function(id) {

  var expandingUserEl = this._getUserEl(id);
  var restoringUserEl = this._expandList.querySelector('.' + COMMON.USER_CLASS);

  this._insertUser(restoringUserEl);

  this._expandList.appendChild(expandingUserEl);
  this._expandedId = expandingUserEl.getAttribute(COMMON.DATA_ID);

  var expandingStream = expandingUserEl.querySelector('.' + COMMON.STREAM_CLASS);

  var restoringStream = null;

  if (restoringUserEl) {
    restoringStream = restoringUserEl.querySelector('.' + COMMON.STREAM_CLASS);
  }

  if (expandingStream) {
    expandingStream.play();
  }

  if (restoringStream) {
    restoringStream.play();
  }
};

View.prototype.restoreUser = function() {
  var restoringUserEl = this._expandList.querySelector('.' + COMMON.USER_CLASS);

  this._insertUser(restoringUserEl);

  this._expandedId = null;

  var restoringStream = null;

  if (restoringUserEl) {
    restoringStream = restoringUserEl.querySelector('.' + COMMON.STREAM_CLASS);
  }

  if (restoringStream) {
    restoringStream.play();
  }
};

View.prototype.addStream = function(user, stream, streamObj) {
  var id = user.id;

  var userEl = this._getUserEl(id);
  classes(userEl).add(COMMON.STREAMING_CLASS);

  var streamWrapper = userEl.querySelector('.' + COMMON.STREAM_WRAPPER_CLASS);
  classes(stream).add(COMMON.STREAM_CLASS);

  // Never have two streams for the same user
  if (streamWrapper.querySelector('.' + COMMON.STREAM_CLASS)) {
    this.removeStream(id);
  }

  if (!streamObj.getVideoTracks().length) {
    classes(userEl).add(COMMON.AUDIO_ONLY_CLASS);
  }

  streamWrapper.appendChild(stream);
  stream.play();
};

View.prototype.removeStream = function(id) {
  var userEl = this._getUserEl(id);
  classes(userEl).remove(COMMON.STREAMING_CLASS);

  var streamEl = userEl.querySelector('.' + COMMON.STREAM_CLASS);
  var audioEl = userEl.querySelector('.' + COMMON.AUDIO_CLASS);

  // Clear mute and audio indicators
  classes(userEl).remove(COMMON.MUTED_CLASS);
  classes(userEl).remove(COMMON.LOCAL_MUTED_CLASS);
  classes(audioEl).remove(COMMON.SPEAKING_CLASS);

  // If the local user is expanded return it back to the list when stopped
  if (id === this._localUser.id && id === this._expandedId) {
    this.restoreUser(id);
  }

  if (!streamEl) {
    return;
  }

  streamEl.parentNode.removeChild(streamEl);
};

View.prototype.toggleCollapse = function() {
  if (!this._collapsed) {
    classes(this._wrapper).add(COMMON.COLLAPSED_CLASS);

  } else {
    classes(this._wrapper).remove(COMMON.COLLAPSED_CLASS);
  }

  this._collapsed = !this._collapsed;
};

View.prototype._getUserEl = function(id) {
  var userEl = this.list.querySelector('[' + COMMON.DATA_ID + '="' + id + '"]');

  if (!userEl) {
    userEl = this._expandList
      .querySelector('[' + COMMON.DATA_ID + '="' + id + '"]');
  }

  return userEl;
};

View.prototype.destroy = function() {
  if (this.expandContainer) {
    classes(this.expandContainer).remove(COMMON.WIDGET_CLASS);
    classes(this.expandContainer).remove(COMMON.EXPAND_CONTAINER_CLASS);

    this._expandList.parentNode.removeChild(this._expandList);
  }

  this._wrapper.parentNode.removeChild(this._wrapper);
};

/**
 * @exports
 */
module.exports = View;
