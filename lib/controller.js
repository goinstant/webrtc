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

  this._gortc = widget._gortc;
  this._userCache = widget._userCache;
  this._view = widget._view;

  this._muted = false;
  this._streaming = false;
  this._paused = false;
  this._exapndedId = null;

  this._localUser = widget._localUser;
  this._localUserKey = this._room.self();

  _.bindAll(this, [
    'setMuted',
    'setUnmuted',
    'setPaused',
    'setResumed',
    'setSpeaking',
    'setNotSpeaking',
    'addLocalStream',
    'removeLocalStream',
    'addPeerStream',
    'removePeerStream',
    'controlHandler'
  ]);

}

Controller.prototype.setMuted = function(peer) {
  if (peer) {
    return;
  }

  var mutedKey = this._localUserKey.key(COMMON.NAMESPACE).key('muted');

  var self = this;

  mutedKey.set(true, function() {
    self._muted = true;
  });
};

Controller.prototype.setUnmuted = function(peer) {
  if (peer) {
    return;
  }

  var mutedKey = this._localUserKey.key(COMMON.NAMESPACE).key('muted');

  var self = this;

  mutedKey.set(false, function() {
    self._muted = false;
  });
};

Controller.prototype.setPaused = function(peer) {
  if (peer) {
    return;
  }

  var pausedKey = this._localUserKey.key(COMMON.NAMESPACE).key('paused');

  var self = this;

  pausedKey.set(true, function() {
    self._paused = true;
  });
};

Controller.prototype.setResumed = function(peer) {
  if (peer) {
    return;
  }

  var pausedKey = this._localUserKey.key(COMMON.NAMESPACE).key('paused');

  var self = this;

  pausedKey.set(false, function() {
    self._paused = false;
  });
};

Controller.prototype.setSpeaking = function(peer) {
  if (peer) {
    return;
  }

  var speakingKey = this._localUserKey.key(COMMON.NAMESPACE).key('speaking');
  speakingKey.set(true);
};

Controller.prototype.setNotSpeaking = function(peer) {
  if (peer) {
    return;
  }

  var speakingKey = this._localUserKey.key(COMMON.NAMESPACE).key('speaking');
  speakingKey.set(false);
};

Controller.prototype.addLocalStream = function(streamObj) {
  if (this._streaming) {
    return;
  }

  this._streaming = true;

  var user = this._localUser;
  var stream = this._gortc.localVideo;

  this._view.addStream(user, stream, streamObj);
};

Controller.prototype.removeLocalStream = function() {
  if (!this._streaming) {
    return;
  }

  this._view.removeStream(this._localUser.id);
  this.setUnmuted();
  this.setNotSpeaking();

  this._streaming = false;
};

Controller.prototype.addPeerStream = function(peer) {
  var user = this._userCache.getUser(peer.id);
  var stream = peer.video;

  var streamObj = peer.pc.remoteStream;

  this._view.addStream(user, stream, streamObj);
};

Controller.prototype.removePeerStream = function(peer) {
  this._view.removeStream(peer.id);
};

Controller.prototype.controlHandler = function(event) {
  var target = event.target;

  if (!target) {
    return;
  }

  if (!classes(target).has(COMMON.ICON_CLASS) &&
      !classes(target).has(COMMON.JOIN_CLASS)) {
        return;
  }

  var type = null;

  _.each(COMMON.CONTROL_CLASSES, function(controlClass) {
    if (closest(target, '.' + controlClass, true)) {
      type = controlClass;

      return false;
    }
  });

  if (!type) {
    return;
  }

  var userEl = closest(target, '.' + COMMON.USER_CLASS, false);
  var id = userEl.getAttribute(COMMON.DATA_ID);
  var localUser = id === this._localUser.id;

  switch (type) {
    case COMMON.JOIN_CLASS:
      if (localUser) {
        this._toggleJoin();
      }

      break;

    case COMMON.AUDIO_CLASS:
      if (localUser) {
        this._toggleMute();
      }

      break;

    case COMMON.PAUSE_CLASS:
      if (localUser) {
        this._togglePause();
      }

      break;

    case COMMON.LEAVE_CLASS:
      if (localUser) {
        this._toggleJoin();
      }

      break;

    case COMMON.EXPAND_CLASS:
      this._toggleExpand(id);

      break;
  }
};

Controller.prototype._toggleJoin = function() {
  if (!this._streaming) {
    this._gortc.start();

  } else {
    this._gortc.stop();
  }
};

Controller.prototype._togglePause = function() {
  if (!this._streaming) {
    return;
  }

  if (!this._paused) {
    this._gortc.pause();

  } else {
    this._gortc.resume();
  }
};

Controller.prototype._toggleMute = function() {
  if (!this._streaming) {
    return;
  }

  if (!this._muted) {
    this._gortc.mute();

  } else {
    this._gortc.unmute();
  }
};

Controller.prototype._toggleExpand = function(id) {
  if (this._expandedId !== id) {
    this._view.expandUser(id);
    this._expandedId = id;

    return;
  }

  this._view.restoreUser(id);
  this._expandedId = null;
};
