/*jshint browser:true*/
/*global module, require*/
'use strict';

/**
 * @fileoverview
 * WebRTC View Class
 */

/** Module dependencies */
var _ = require('lodash');
var classes = require('classes');
var closest = require('closest');

/** Template */
var listTemplate = require('../templates/list-template.html');
var userTemplate = require('../templates/user-template.html');

/** Constants */
var NAMESPACE = 'goinstant/widgets/webrtc/';
var DATA_ID = 'data-goinstant-id';

var WIDGET_CLASS = 'gi-webrtc';
var CUSTOM_CONTAINER_CLASS = 'gi-custom-container';
var EXPAND_CONTAINER_CLASS = 'gi-expand-container';
var LOCAL_CLASS = 'gi-local';

var LIST_WRAPPER_CLASS = 'gi-list-wrapper';
var COLLAPSED_CLASS = 'gi-collapsed';
var COLLAPSE_WRAPPER_CLASS = 'gi-collapse-wrapper';
var COLLAPSE_CLASS = 'gi-collapse';
var LIST_WRAPPER_CLASS = 'gi-list-wrapper';
var LIST_CLASS = 'gi-list';

var USER_CLASS = 'gi-user';
var OVERLAY_CLASS = 'gi-overlay';
var USER_WRAPPER_CLASS = 'gi-user-wrapper';
var STREAM_WRAPPER_CLASS = 'gi-stream-wrapper';
var STREAM_CLASS = 'gi-stream';
var AVATAR_CLASS = 'gi-avatar';
var EXPANDED_CLASS = 'gi-expanded';
var EXPAND_CLASS = 'gi-expand';
var RESTORE_CLASS = 'gi-restore';
var COLOR_CLASS = 'gi-color';
var NAME_CLASS = 'gi-name';
var MUTE_CLASS = 'gi-mute';
var MUTED_CLASS = 'gi-muted';
var AUDIO_CLASS = 'gi-audio';
var SPEAKING_CLASS = 'gi-speaking';
var TOGGLE_CLASS = 'gi-toggle';
var ICON_CLASS = 'gi-icon';

/* Export the module */
module.exports = View;

/**
 * @constructor
 */
function View(options, userCache, gortc) {
  this._listContainer = options.listContainer;
  this._expandContainer = options.expandContainer;

  this._collapsed = options.collapsed;
  this._truncateLength = options.truncateLength;
  this._avatars = options.avatars;
  this._position = options.position;

  this._userCache = userCache;
  this._gortc = gortc;

  this._wrapper = null;
  this._collapseWrapper = null;
  this._listWrapper = null;
  this.list = null;

  this.collapseBtn = null;
  this.muteBtn = null;
  this.toggleBtn = null;

  this._localUser = null;
  this._expandedId = null;

  _.bindAll(this, [
    'addUser',
    'removeUser',
    'updateUser',
    'toggleCollapse',
    'expandUser',
    'restoreUser'
  ]);
}

/**
 * Initializes the WebRTC view
 * @public
 * @param {function} cb The function to call with an error or when
 *                      initialization is complete.
 */
View.prototype.initialize = function() {
  classes(this._expandContainer).add(WIDGET_CLASS);
  classes(this._expandContainer).add(EXPAND_CONTAINER_CLASS);

  this._wrapper = document.createElement('div');
  classes(this._wrapper).add(WIDGET_CLASS);

  this._wrapper.innerHTML = listTemplate;

  this._collapseWrapper = this._wrapper.querySelector('.' + COLLAPSE_WRAPPER_CLASS);
  this._listWrapper = this._wrapper.querySelector('.' + LIST_WRAPPER_CLASS);
  this.list = this._wrapper.querySelector('.' + LIST_CLASS);

  this._localUser = this._userCache.getLocalUser();
  this.addUser(this._localUser);
  var localUserEl = this.list.querySelector('[data-goinstant-id="' +
                                             this._localUser.id +'"]');

  var localOverlayEl = localUserEl.querySelector('.' + OVERLAY_CLASS);
  var toggleEl = document.createElement('div');
  var iconEl = document.createElement('span');

  classes(localUserEl).add(LOCAL_CLASS);
  classes(toggleEl).add(TOGGLE_CLASS);
  classes(iconEl).add(ICON_CLASS);

  toggleEl.appendChild(iconEl);
  localOverlayEl.appendChild(toggleEl);

  // Set Controls
  this.collapseBtn = this._wrapper.querySelector('.' + COLLAPSE_CLASS);
  this.muteBtn = localUserEl.querySelector('.' + AUDIO_CLASS);
  this.expandBtn = localOverlayEl.querySelector('.' + EXPAND_CLASS);
  this.toggleBtn = localOverlayEl.querySelector('.' + TOGGLE_CLASS);

  this._addAllUsers();

  if (this._container) {
    classes(this._wrapper).add(CUSTOM_CONTAINER_CLASS);

    this._container.appendChild(this._wrapper);
    return;
  }

  if (this._listContainer) {
    this._listContainer.appendChild(this._wrapper);
    return;
  }

  document.body.appendChild(this._wrapper);
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

/**
 *
 *
 */
View.prototype.addUser = function(user) {
  if (!user) {
    return;
  }

  var id = user.id;
  var expanded = this._expandedId === id;
  var container = null;
  var userEl;

  if (!expanded) {
    userEl = document.createElement('li');
    container = this.list;

  } else {
    userEl = document.createElement('div');
    classes(userEl).add(EXPANDED_CLASS);
    container = this._expandContainer;
  }

  classes(userEl).add(USER_CLASS);
  userEl.setAttribute(DATA_ID, user.id);
  userEl.innerHTML = userTemplate;

  // Add expand controls
  if (this._expandContainer) {
    var overlayEl = userEl.querySelector('.' + OVERLAY_CLASS);
    var expandEl = document.createElement('div');
    var iconEl = document.createElement('span');

    if (!expanded) {
      classes(expandEl).add(EXPAND_CLASS);

    } else {
      classes(expandEl).add(RESTORE_CLASS);
    }

    classes(iconEl).add(ICON_CLASS);

    expandEl.appendChild(iconEl);
    overlayEl.appendChild(expandEl);
  }

  var colorEl = userEl.querySelector('.' + COLOR_CLASS);
  colorEl.style.backgroundColor = user.avatarColor;

  var displayName = document.createTextNode(user.displayName);
  var nameEl = userEl.querySelector('.' + NAME_CLASS);
  nameEl.appendChild(displayName);

  var namespace = null;

  // Handle muted and speaking state
  if (user.goinstant &&
      user.goinstant.widgets &&
      user.goinstant.widgets.webrtc) {

    namespace = user.goinstant.widgets.webrtc;

    var audioEl = userEl.querySelector('.' + AUDIO_CLASS);

    if (namespace.muted) {
      classes(audioEl).add(MUTED_CLASS);
    }

    if (namespace.speaking) {
      classes(audioEl).add(SPEAKING_CLASS);
    }
  }

  var frontUser = container.firstChild;
  if (id !== this._localUser.id || !frontUser) {
    container.appendChild(userEl);

    return;
  }

  container.insertBefore(userEl, frontUser);
};

/**
 *
 *
 */
View.prototype.removeUser = function(user) {
  if (!user) {
    return;
  }

  var id = user.id;

  var container = this.list;

  if (this._expandedId === id) {
    container = this._expandContainer;
  }

  var userEl = container.querySelector('[' + DATA_ID + '="'+ id +'"]');
  userEl.parentNode.removeChild(userEl);
};

/**
 * Handles updating a user's displayName, color, mute status, etc
 * @public
 * @param
 */
View.prototype.updateUser = function(user, key) {
  key = key.split('/');
  key.splice(0, 3); // Remove /users/userid

  var id = user.id;
  var targetKey = key.join('/');
  var container = this.list;

  if (this._expandedId === id) {
    container = this._expandContainer;
  }

  var userEl = container.querySelector('[' + DATA_ID + '="' + id + '"]');
  var audioEl = null;

  switch(targetKey) {
    case 'displayName':
      var nameEl = userEl.querySelector('.' + NAME_CLASS);
      nameEl.removeChild(nameEl.firstChild);

      var textNode = document.createTextNode(user.displayName);
      nameEl.appendChild(textNode);

      break;

    case 'avatarColor':
      var colorEl = userEl.querySelector('.' + COLOR_CLASS);
      colorEl.style.backgroundColor = user.avatarColor;

      break;

    case NAMESPACE + 'muted':
      audioEl = userEl.querySelector('.' + AUDIO_CLASS);

      if (user.goinstant.widgets.webrtc.muted) {
        classes(audioEl).add(MUTED_CLASS);

      } else {
        classes(audioEl).remove(MUTED_CLASS);
      }

      break;

    case NAMESPACE + 'speaking':
      audioEl = userEl.querySelector('.' + AUDIO_CLASS);

      if (user.goinstant.widgets.webrtc.speaking) {
        classes(audioEl).add(SPEAKING_CLASS);

      } else {
        classes(audioEl).remove(SPEAKING_CLASS);
      }

      break;

    default:
      return;
  }
};

View.prototype._insertUser = function(userEl) {
  if (!userEl) {
    return;
  }

  var frontUser = this.list.firstChild;
  var id = userEl.getAttribute(DATA_ID);

  if (id !== this._localUser.id || !frontUser) {
    this.list.appendChild(userEl);

    return;
  }

  this.list.insertBefore(userEl, frontUser);
};

View.prototype.expandUser = function(target) {
  if (!target) {
    return;
  }

  var expandingUserEl = closest(target, '.' + USER_CLASS, false, this.list);
  var restoringUserEl = this._expandContainer.querySelector('.' + USER_CLASS);

  if (!closest(target, '.' + EXPAND_CLASS, true, expandingUserEl)) {
    return;
  }

  this._insertUser(restoringUserEl);

  this._expandContainer.appendChild(expandingUserEl);
  this._expandedId = expandingUserEl.getAttribute(DATA_ID);

  var expandingStream = expandingUserEl.querySelector('.' + STREAM_CLASS);

  var restoringStream = null;

  if (restoringUserEl) {
    restoringStream = restoringUserEl.querySelector('.' + STREAM_CLASS);
  }

  if (expandingStream) {
    expandingStream.play();
  }

  if (restoringStream) {
    restoringStream.play();
  }
};

View.prototype.restoreUser = function(target) {
  if (!target) {
    return;
  }

  var restoringUserEl = this._expandContainer.querySelector('.' + USER_CLASS);

  if (!closest(target, '.' + EXPAND_CLASS, true, restoringUserEl)) {
    return;
  }

  this._insertUser(restoringUserEl);

  this._expandedId = null;

  var restoringStream = null;

  if (restoringUserEl) {
    restoringStream = restoringUserEl.querySelector('.' + STREAM_CLASS);
  }

  if (restoringStream) {
    restoringStream.play();
  }
};

/**
 *
 *
 */
View.prototype.addStream = function(user, stream) {
  var id = user.id;
  var container = this.list;

  if (this._expandedId === id) {
    container = this._expandContainer;
  }

  var userEl = container.querySelector('[' + DATA_ID + '="' + id + '"]');
  var streamWrapper = userEl.querySelector('.' + STREAM_WRAPPER_CLASS);
  classes(stream).add(STREAM_CLASS);

  // Never have two streams for the same user
  if (streamWrapper.querySelector('.' + STREAM_CLASS)) {
    this.removeStream(id);
  }

  streamWrapper.appendChild(stream);
  stream.play();
};

/**
 *
 *
 */
View.prototype.removeStream = function(id) {
  var container = this.list;

  if (this._expandedId === id) {
    container = this._expandContainer;
  }

  var userEl = container.querySelector('[' + DATA_ID + '="' + id + '"]');
  var streamEl = userEl.querySelector('.' + STREAM_CLASS);

  var audioEl = userEl.querySelector('.' + AUDIO_CLASS);

  // Clear mute and audio indicators
  classes(audioEl).remove(MUTED_CLASS);
  classes(audioEl).remove(SPEAKING_CLASS);

  if (!streamEl) {
    return;
  }

  streamEl.parentNode.removeChild(streamEl);
};

/**
 *
 *
 */
View.prototype.toggleCollapse = function() {
  if (!this._collapsed) {
    classes(this._wrapper).add(COLLAPSED_CLASS);

  } else {
    classes(this._wrapper).remove(COLLAPSED_CLASS);
  }

  this._collapsed = !this._collapsed;
};

/**
 * Destroys the WebRTC view
 * @public
 * @param {function} cb The function to call with an error or when
 *                      the destroy is complete.
 */
View.prototype.destroy = function() {

};
