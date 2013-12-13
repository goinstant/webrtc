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

/** Template */
var listTemplate = require('../templates/list-template.html');
var userTemplate = require('../templates/user-template.html');

/** Constants */
var NAMESPACE = 'goinstant/widgets/webrtc/';
var DATA_ID = 'data-goinstant-id';

var WIDGET_CLASS = 'gi-webrtc';
var CUSTOM_CONTAINER_CLASS = 'gi-custom-container';
var LOCAL_CLASS = 'gi-local';

var LIST_WRAPPER_CLASS = 'gi-list-wrapper';
var COLLAPSED_CLASS = 'gi-collapsed';
var COLLAPSE_WRAPPER_CLASS = 'gi-collapse-wrapper';
var COLLAPSE_CLASS = 'gi-collapse';
var LIST_WRAPPER_CLASS = 'gi-list-wrapper';
var LIST_CLASS = 'gi-list';

var USER_CLASS = 'gi-user';
var USER_WRAPPER_CLASS = 'gi-user-wrapper';
var STREAM_WRAPPER_CLASS = 'gi-stream-wrapper';
var STREAM_CLASS = 'gi-stream';
var AVATAR_CLASS = 'gi-avatar';
var COLOR_CLASS = 'gi-color';
var NAME_CLASS = 'gi-name';
var MUTE_CLASS = 'gi-mute';
var MUTED_CLASS = 'gi-muted';
var AUDIO_CLASS = 'gi-audio';
var SPEAKING_CLASS = 'gi-speaking';
var TOGGLE_CLASS = 'gi-toggle';

/* Export the module */
module.exports = View;

/**
 * @constructor
 */
function View(options, userCache) {
  this._listContainer = options.listContainer;
  this._selectedContainer = options.selectedContainer;
  this._chatContainer = options.chatContainer;

  this._collapsed = options.collapsed;
  this._truncateLength = options.truncateLength;
  this._avatars = options.avatars;
  this._position = options.position;

  this._userCache = userCache;

  this._wrapper = null;
  this._collapseWrapper = null;
  this._listWrapper = null;
  this._list = null;

  this.collapseBtn = null;
  this.muteBtn = null;
  this.toggleBtn = null;

  this._localUser = null;

  _.bindAll(this, [
    'addUser',
    'removeUser',
    'updateUser',
    'toggleCollapse'
  ]);
}

/**
 * Initializes the WebRTC view
 * @public
 * @param {function} cb The function to call with an error or when
 *                      initialization is complete.
 */
View.prototype.initialize = function() {
  this._wrapper = document.createElement('div');
  classes(this._wrapper).add(WIDGET_CLASS);

  this._wrapper.innerHTML = listTemplate;

  this._collapseWrapper = this._wrapper.querySelector('.' + COLLAPSE_WRAPPER_CLASS);
  this._listWrapper = this._wrapper.querySelector('.' + LIST_WRAPPER_CLASS);
  this._list = this._wrapper.querySelector('.' + LIST_CLASS);

  this._localUser = this._userCache.getLocalUser();
  this.addUser(this._localUser);
  var localUserEl = this._list.querySelector('[data-goinstant-id="' +
                                             this._localUser.id +'"]');

  classes(localUserEl).add(LOCAL_CLASS);

  // Set Controls
  this.collapseBtn = this._wrapper.querySelector('.' + COLLAPSE_CLASS);
  this.muteBtn = localUserEl.querySelector('.' + AUDIO_CLASS);
  this.toggleBtn = localUserEl.querySelector('.' + TOGGLE_CLASS);

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
  var id = user.id;

  var userEl = document.createElement('li');
  classes(userEl).add(USER_CLASS);
  userEl.setAttribute(DATA_ID, user.id);
  userEl.innerHTML = userTemplate;

  var colorEl = userEl.querySelector('.' + COLOR_CLASS);
  colorEl.style.backgroundColor = user.avatarColor;

  var displayName = document.createTextNode(user.displayName);
  var nameEl = userEl.querySelector('.' + NAME_CLASS);
  nameEl.appendChild(displayName);

  this._list.appendChild(userEl);
};

/**
 *
 *
 */
View.prototype.removeUser = function(user) {
  var id = user.id;

  var userEl = this._list.querySelector('[' + DATA_ID + '="'+ id +'"]');
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

  var userEl = this._list.querySelector('[' + DATA_ID + '="' + id + '"]');
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

/**
 *
 *
 */
View.prototype.addStream = function(user, stream) {
  var id = user.id;

  var userEl = this._list.querySelector('[' + DATA_ID + '="' + id + '"]');
  var streamWrapper = userEl.querySelector('.' + STREAM_WRAPPER_CLASS);
  classes(stream).add(STREAM_CLASS);

  // Never have two streams for the same user
  if (streamWrapper.querySelector('.' + STREAM_CLASS)) {
    this.removeStream(id);
  }

  streamWrapper.appendChild(stream);
};

/**
 *
 *
 */
View.prototype.removeStream = function(id) {
  var userEl = this._list.querySelector('[' + DATA_ID + '="' + id + '"]');
  var streamEl = userEl.querySelector('.' + STREAM_CLASS);

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
