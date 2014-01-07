/*jshint browser:true*/
/*global module, require*/
'use strict';

/**
 * @fileoverview
 * The Controller module handles what should be applied in the view.
 */

/**
 * @requires
 */
var GoRTC = require('gortc');

var _ = require('lodash');
var classes = require('classes');
var closest = require('closest');

var View = require('./view');

/**
 * @const
 */
var COMMON = require('./common');

/**
 * @exports
 */
module.exports = Controller;

function Controller(widget) {
  this._room = widget._room;

  this._goRTC = null;
  this._userCache = widget._userCache;
  this._view = widget._view;

  this._muted = false;
  this._streaming = false;
  this._paused = false;
  this._expandedId = null;

  this._localUser = widget._localUser;
  this._localUserKey = this._room.self();

  this._GoRTC = GoRTC;
  this._rtcIsBound = false;

  _.bindAll(this, [
    '_setMuted',
    '_setUnmuted',
    '_setPaused',
    '_setResumed',
    '_setSpeaking',
    '_setNotSpeaking',
    '_addLocalStream',
    '_removeLocalStream',
    '_addPeerStream',
    '_removePeerStream',
    'toggleJoin',
    'toggleExpand',
    'toggleMute',
    'togglePause'
  ]);
}

Controller.prototype.initialize = function() {
  this._goRTC = new this._GoRTC({ room: this._room });

  if (!this._rtcIsBound) {
    this._goRTC.on('localStream', this._addLocalStream);
    this._goRTC.on('localStreamStopped', this._removeLocalStream);
    this._goRTC.on('peerStreamAdded', this._addPeerStream);
    this._goRTC.on('peerStreamRemoved', this._removePeerStream);
    this._goRTC.on('speaking', this._setSpeaking);
    this._goRTC.on('stoppedSpeaking', this._setNotSpeaking);
    this._goRTC.on('audioOff', this._setMuted);
    this._goRTC.on('audioOn', this._setUnmuted);
    this._goRTC.on('videoOff', this._setPaused);
    this._goRTC.on('videoOn', this._setResumed);

    this._rtcIsBound = true;
  }
};

Controller.prototype._setMuted = function(peer) {
  if (peer) {
    return;
  }

  var mutedKey = this._localUserKey.key(COMMON.NAMESPACE).key('muted');

  var self = this;

  mutedKey.set(true, function() {
    self._muted = true;
  });
};

Controller.prototype._setUnmuted = function(peer) {
  if (peer) {
    return;
  }

  var mutedKey = this._localUserKey.key(COMMON.NAMESPACE).key('muted');

  var self = this;

  mutedKey.set(false, function() {
    self._muted = false;
  });
};

Controller.prototype._setPaused = function(peer) {
  if (peer) {
    return;
  }

  var pausedKey = this._localUserKey.key(COMMON.NAMESPACE).key('paused');

  var self = this;

  pausedKey.set(true, function() {
    self._paused = true;
  });
};

Controller.prototype._setResumed = function(peer) {
  if (peer) {
    return;
  }

  var pausedKey = this._localUserKey.key(COMMON.NAMESPACE).key('paused');

  var self = this;

  pausedKey.set(false, function() {
    self._paused = false;
  });
};

Controller.prototype._setSpeaking = function(peer) {
  if (peer) {
    return;
  }

  var speakingKey = this._localUserKey.key(COMMON.NAMESPACE).key('speaking');
  speakingKey.set(true);
};

Controller.prototype._setNotSpeaking = function(peer) {
  if (peer) {
    return;
  }

  var speakingKey = this._localUserKey.key(COMMON.NAMESPACE).key('speaking');
  speakingKey.set(false);
};

Controller.prototype._addLocalStream = function(streamObj) {
  if (this._streaming) {
    return;
  }

  this._streaming = true;

  var user = this._localUser;
  var stream = this._goRTC.localVideo;

  this._view.addStream(user, stream, streamObj);
};

Controller.prototype._removeLocalStream = function() {
  if (!this._streaming) {
    return;
  }

  this._view.removeStream(this._localUser.id);
  this._setUnmuted();
  this._setNotSpeaking();

  this._streaming = false;
};

Controller.prototype._addPeerStream = function(peer) {
  var user = this._userCache.getUser(peer.id);
  var stream = peer.video;

  var streamObj = peer.pc.remoteStream;

  this._view.addStream(user, stream, streamObj);
};

Controller.prototype._removePeerStream = function(peer) {
  this._view.removeStream(peer.id);
};

Controller.prototype.toggleJoin = function(event) {
  if (!this._isLocalUser(event)) {
    return;
  }

  if (!this._streaming) {
    this._goRTC.start();

  } else {
    this._goRTC.stop();
  }
};

Controller.prototype.togglePause = function(event) {
  if (!this._isLocalUser(event)) {
    return;
  }

  if (!this._streaming) {
    return;
  }

  if (!this._paused) {
    this._goRTC.pause();

  } else {
    this._goRTC.resume();
  }
};

Controller.prototype.toggleMute = function(event) {
  if (!this._isLocalUser(event)) {
    return;
  }

  if (!this._streaming) {
    return;
  }

  if (!this._muted) {
    this._goRTC.mute();

  } else {
    this._goRTC.unmute();
  }
};

Controller.prototype.toggleExpand = function(event) {
  var userEl = this._getTargetUser(event);
  var id = userEl.getAttribute(COMMON.DATA_ID);

  if (this._expandedId !== id) {
    this._view.expandUser(id);
    this._expandedId = id;

    return;
  }

  this._view.restoreUser(id);
  this._expandedId = null;
};

Controller.prototype._getTargetUser = function(event) {
  var target = event.target;

  if (!target) {
    return false;
  }

  var userEl = closest(target, '.' + COMMON.USER_CLASS, false);

  return userEl;
};

Controller.prototype._isLocalUser = function(event) {
  var userEl = this._getTargetUser(event);
  var id = userEl.getAttribute(COMMON.DATA_ID);

  if (id === this._localUser.id) {
    return true;
  }

  return false;
};

Controller.prototype.destroy = function() {
  if (this._rtcIsBound) {
    this._goRTC.off();

    this._rtcIsBound = false;
  }

  if (this._streaming) {
    this._goRTC.stop();
  }
};
