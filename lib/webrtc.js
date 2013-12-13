/*jshint browser:true*/
/*global module, require*/
'use strict';

/**
 * @fileoverview
 * The GoInstant Web RTC widget provides a drop-in, back-end free, video
 * conferencing solution.
 */

/**
 * Check compatibility before including goRTC
 */
var compatible = require('./compatible')();

/** Module dependencies */
if (compatible) {
  var goRTC = require('gortc'); // breaks unsupported browsers
}

var _ = require('lodash');
var binder = require('binder');

var UserCache = require('usercache');

var errors = require('./errors');
var View = require('./view');

/** Constants */
var NAME = 'WebRTC';
var NAMESPACE = 'goinstant/widgets/webrtc/';

var VALID_POSITIONS = [
  'top',
  'bottom',
  'left',
  'right'
];

var VALID_OPTIONS = [
  'room',
  'listContainer',
  'selectedContainer',
  'chatContainer',
  'collapsed',
  'truncateLength',
  'avatars',
  'position'
];

var DEFAULT_OPTIONS = {
  room: null,
  listContainer: null,
  selectedContainer: null,
  chatContainer: null,
  collapsed: false,
  truncateLength: 20,
  avatars: true,
  position: 'bottom'
};

/* Export the module */
module.exports = WebRTC;

/**
 * @constructor
 */
function WebRTC(options) {
  if (!compatible) {
    throw errors.create(NAME, 'UNSUPPORTED_BROWSER');
  }

  var validatedOptions = validateOptions(options);

  this._room = validatedOptions.room;

  this._userCache = new UserCache(this._room);
  this._view = new View(validatedOptions, this._userCache);

  this._gortc = null;

  this._rtcIsBound = false;
  this._domIsBound = false;
  this._userCacheIsBound = false;

  this._streaming = false;
  this._muted = false;

  this._localUser = null;
  this._localUserKey = this._room.self();

  _.bindAll(this, [
    '_toggleStream',
    '_toggleMute',
    '_addLocalStream',
    '_removeLocalStream',
    '_addPeerStream',
    '_removePeerStream',
    '_startedSpeaking',
    '_stoppedSpeaking',
    '_setMuted',
    '_setUnmuted',
    '_setVideo',
    '_setNoVideo'
  ]);
}

/**
 * Initializes the WebRTC widget
 * @public
 * @param {function} cb The function to call with an error or when
 *                      initialization is complete.
 */
WebRTC.prototype.initialize = function(cb) {
  this._gortc = new goRTC({ room: this._room });

  var self = this;

  this._userCache.initialize(function() {
    self._localUser = self._userCache.getLocalUser();

    self._view.initialize();

    if (!self._rtcIsBound) {
      self._gortc.on('localStream', self._addLocalStream);
      self._gortc.on('localStreamStopped', self._removeLocalStream);
      self._gortc.on('peerStreamAdded', self._addPeerStream);
      self._gortc.on('peerStreamRemoved', self._removePeerStream);
      self._gortc.on('speaking', self._startedSpeaking);
      self._gortc.on('stoppedSpeaking', self._stoppedSpeaking);
      self._gortc.on('audioOff', self._setMuted);
      self._gortc.on('audioOn', self._setUnmuted);
      self._gortc.on('videoOff', self._setVideo);
      self._gortc.on('videoOn', self._setNoVideo);

      self._rtcIsBound = true;
    }

    if (!self._domIsBound) {
      binder.on(self._view.collapseBtn, 'click', self._view.toggleCollapse);
      binder.on(self._view.muteBtn, 'click', self._toggleMute);
      binder.on(self._view.toggleBtn, 'click', self._toggleStream);

      if (self._selectContainer) {
        //binder.on(self._view._list, 'click', self._selectStream);
      }

      self._domIsBound = true;
    }

    if (!self._userCacheIsBound) {

      self._userCache.on('join', self._view.addUser);
      self._userCache.on('leave', self._view.removeUser);
      self._userCache.on('change', self._view.updateUser);

      self._userCacheIsBound = true;
    }

    cb();
  });
};

WebRTC.prototype._setVideo = function() {
  console.log('video on');
};

WebRTC.prototype._setNoVideo = function() {
  console.log('video off');
};

WebRTC.prototype._setMuted = function(peer) {
  if (peer) {
    return;
  }

  var mutedKey = this._localUserKey.key(NAMESPACE).key('muted');

  var self = this;

  mutedKey.set(true, function() {
    self._muted = true;
  });
};

WebRTC.prototype._setUnmuted = function(peer) {
  if (peer) {
    return;
  }

  var mutedKey = this._localUserKey.key(NAMESPACE).key('muted');

  var self = this;

  mutedKey.set(false, function() {
    self._muted = false;
  });
};

WebRTC.prototype._startedSpeaking = function(peer) {
  if (peer) {
    return;
  }

  var speakingKey = this._localUserKey.key(NAMESPACE).key('speaking');
  speakingKey.set(true);
};

WebRTC.prototype._stoppedSpeaking = function(peer) {
  if (peer) {
    return;
  }

  var speakingKey = this._localUserKey.key(NAMESPACE).key('speaking');
  speakingKey.set(false);
};

WebRTC.prototype._addLocalStream = function() {
  if (this._streaming) {
    return;
  }

  var user = this._localUser;
  var stream = this._gortc.localVideo;

  this._view.addStream(user, stream);

  this._streaming = true;
};

WebRTC.prototype._removeLocalStream = function() {
  if (!this._streaming) {
    return;
  }

  this._view.removeStream(this._localUser.id);

  this._streaming = false;
};

WebRTC.prototype._addPeerStream = function(peer) {
  var user = this._userCache.getUser(peer.id);
  var stream = peer.video;

  this._view.addStream(user, stream);
};

WebRTC.prototype._removePeerStream = function(peer) {
  this._view.removeStream(peer.id);
};

WebRTC.prototype._toggleStream = function() {
  if (!this._streaming) {
    this._gortc.start();

  } else {
    this._gortc.stop();
  }
};

WebRTC.prototype._toggleMute = function() {
  if (!this._streaming) {
    return;
  }

  if (!this._muted) {
    this._gortc.mute();

  } else {
    this._gortc.unmute();
  }
};

/**
 * Destroys the WebRTC widget
 * @public
 * @param {function} cb The function to call with an error or when
 *                      the destroy is complete.
 */
WebRTC.prototype.destroy = function(cb) {
  if (this._domIsBound) {

    this._domIsBound = false;
  }

  if (this._rtcIsBound) {
    this._gortc.on('localStream', this._addStream);
    this._gortc.on('localStreamStopped', this._removeStream);
    this._gortc.on('peerStreamAdded', this._addStream);
    this._gortc.on('peerStreamRemoved', this._removeStream);

    this._rtcIsBound = false;
  }

  if (this._userCacheIsBound) {

    this._userCache.off('join', this._view.addUser);
    this._userCache.off('leave', this._view.removeUser);
    this._userCache.off('change', this._view.updateUser);

    this._userCacheIsBound = false;
  }

  if (this._isStreaming) {
    this._stopStream();
  }

  this._view.destroy();
  this._userCache.destroy(cb);
};

/**
 * Validates WebRTC options
 * @private
 * @param {object} options The widget's options object
 * @returns {object} The validated options object
 */
function validateOptions(options) {
  if (!options || !_.isPlainObject(options)) {
    throw errors.create(NAME, 'INVALID_OPTIONS');
  }

  var optionsPassed = _.keys(options);
  var optionsDifference = _.difference(optionsPassed, VALID_OPTIONS);

  if (optionsDifference.length) {
    throw errors.create(NAME, 'INVALID_ARGUMENT');
  }

  if (!options.room || !_.isObject(options.room)) {
    throw errors.create(NAME, 'INVALID_ROOM');
  }

  if (options.collapsed && !_.isBoolean(options.collapsed)) {
    throw errors.create(NAME, 'INVALID_COLLAPSED');
  }

  if (options.container && !_.isElement(options.container)) {
    throw errors.create(NAME, 'INVALID_CONTAINER');
  }

  if (options.position && !_.contains(VALID_POSITIONS, options.position)) {
    throw errors.create(NAME, 'INVALID_POSITION');
  }

  if (options.truncateLength && !_.isNumber(options.truncateLength)) {
    throw errors.create(NAME, 'INVALID_TRUNCATELENGTH');
  }

  if (options.avatars && !_.isBoolean(options.avatars)) {
    throw errors.create(NAME, 'INVALID_AVATARS');
  }

  var validoptions = _.defaults(options, DEFAULT_OPTIONS);

  return validoptions;
}
