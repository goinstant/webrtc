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

/**
 * Dependencies
 */
if (compatible) {
  // Breaks unsupported browsers if we include before checking for compatibility
  var goRTC = require('gortc');
}

var _ = require('lodash');
var binder = require('binder');

var UserCache = require('usercache');

var errors = require('./errors');
var View = require('./view');
var Controller = require('./controller');

/**
 * @const
 */
var COMMON = require('./common');

var VALID_OPTIONS = [
  'room',
  'listContainer',
  'expandContainer',
  'collapsed'
];

var DEFAULT_OPTIONS = {
  room: null,
  listContainer: null,
  expandContainer: null,
  collapsed: false
};

/**
 * @constructor
 */
function WebRTC(options) {
  if (!compatible) {
    throw errors.create(COMMON.NAME, 'UNSUPPORTED_BROWSER');
  }

  this._validatedOptions = validateOptions(options);

  this._room = this._validatedOptions.room;
  this._expandContainer = this._validatedOptions.expandContainer;

  this._UserCache = UserCache;
  this._goRTC = goRTC;
  this._binder = binder;

  this._View = View;
  this._Controller = Controller;

  this._userCache = null;
  this._gortc = null;

  this._rtcIsBound = false;
  this._domIsBound = false;
  this._userCacheIsBound = false;

  this._localUser = null;
}

/**
 * Initializes the WebRTC widget
 * @public
 * @param {function} cb The function to call with an error or when
 *                      initialization is complete.
 */
WebRTC.prototype.initialize = function(cb) {
  var self = this;

  this._userCache = new this._UserCache(this._room);
  this._gortc = new this._goRTC({ room: this._room });

  this._userCache.initialize(function() {
    self._localUser = self._userCache.getLocalUser();

    self._view = new self._View(self);
    self._controller = new self._Controller(self);
    self._view.initialize();

    if (!self._rtcIsBound) {
      self._gortc.on('localStream', self._controller.addLocalStream);
      self._gortc.on('localStreamStopped', self._controller.removeLocalStream);
      self._gortc.on('peerStreamAdded', self._controller.addPeerStream);
      self._gortc.on('peerStreamRemoved', self._controller.removePeerStream);
      self._gortc.on('speaking', self._controller.setSpeaking);
      self._gortc.on('stoppedSpeaking', self._controller.setNotSpeaking);
      self._gortc.on('audioOff', self._controller.setMuted);
      self._gortc.on('audioOn', self._controller.setUnmuted);
      self._gortc.on('videoOff', self._controller.setPaused);
      self._gortc.on('videoOn', self._controller.setResumed);

      self._rtcIsBound = true;
    }

    if (!self._domIsBound) {
      self._binder.on(self._view.collapseBtn, 'click', self._view.toggleCollapse);
      self._binder.on(self._view.list, 'click', self._controller.controlHandler);

      if (self._expandContainer) {
        self._binder.on(self._view.expandContainer, 'click', self._controller.controlHandler);
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

/**
 * Destroys the WebRTC widget
 * @public
 * @param {function} cb The function to call with an error or when
 *                      the destroy is complete.
 */
WebRTC.prototype.destroy = function(cb) {
  if (this._domIsBound) {
    this._binder.off(this._view.collapseBtn, 'click', this._view.toggleCollapse);
    this._binder.off(this._view.list, 'click', this._controller.controlHandler);

    if (this._expandContainer) {
      this._binder.off(this._view.expandContainer,
                 'click',
                 this._controller.controlHandler);
    }

    this._domIsBound = false;
  }

  if (this._rtcIsBound) {
    this._gortc.off('localStream', this._controller.addLocalStream);
    this._gortc.off('localStreamStopped', this._controller.removeLocalStream);
    this._gortc.off('peerStreamAdded', this._controller.addPeerStream);
    this._gortc.off('peerStreamRemoved', this._controller.removePeerStream);
    this._gortc.off('speaking', this._controller.setSpeaking);
    this._gortc.off('stoppedSpeaking', this._controller.setNotSpeaking);
    this._gortc.off('audioOff', this._controller.setMuted);
    this._gortc.off('audioOn', this._controller.setUnmuted);
    this._gortc.off('videoOff', this._controller.setPaused);
    this._gortc.off('videoOn', this._controller.setResumed);

    this._rtcIsBound = false;
  }

  if (this._userCacheIsBound) {

    this._userCache.off('join', this._view.addUser);
    this._userCache.off('leave', this._view.removeUser);
    this._userCache.off('change', this._view.updateUser);

    this._userCacheIsBound = false;
  }

  this._controller.destroy();
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
    throw errors.create(COMMON.NAME, 'INVALID_OPTIONS');
  }

  var optionsPassed = _.keys(options);
  var optionsDifference = _.difference(optionsPassed, VALID_OPTIONS);

  if (optionsDifference.length) {
    throw errors.create(COMMON.NAME, 'INVALID_ARGUMENT');
  }

  if (!options.room || !_.isObject(options.room)) {
    throw errors.create(COMMON.NAME, 'INVALID_ROOM');
  }

  if (!_.isUndefined(options.collapsed) && !_.isBoolean(options.collapsed)) {
    throw errors.create(COMMON.NAME, 'INVALID_COLLAPSED');
  }

  if (options.listContainer && !_.isElement(options.listContainer)) {
    throw errors.create(COMMON.NAME, 'INVALID_LIST_CONTAINER');
  }

  if (options.expandContainer && !_.isElement(options.expandContainer)) {
    throw errors.create(COMMON.NAME, 'INVALID_EXPAND_CONTAINER');
  }

  var validoptions = _.defaults(options, DEFAULT_OPTIONS);

  return validoptions;
}

/**
 * @exports
 */
module.exports = WebRTC;
