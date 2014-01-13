/*jshint browser:true*/
/*global module, require*/
'use strict';

/**
 * @fileoverview
 * The GoInstant Web RTC widget provides a drop-in, back-end free, video
 * conferencing solution.
 */

/**
 * @requires
 */
var _ = require('lodash');
var binder = require('binder');

var supported = require('gortc').support;

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
  'collapsed',
  'autoStart'
];

var DEFAULT_OPTIONS = {
  room: null,
  listContainer: null,
  expandContainer: null,
  collapsed: false,
  autoStart: false
};

/**
 * @constructor
 */
function WebRTC(options) {
  if (!supported) {
    throw errors.create(COMMON.NAME, 'UNSUPPORTED_BROWSER');
  }

  this._validatedOptions = validateOptions(options);

  this._room = this._validatedOptions.room;
  this._expandContainer = this._validatedOptions.expandContainer;
  this._autoStart = this._validatedOptions.autoStart;

  this._UserCache = UserCache;
  this._binder = binder;

  this._View = View;
  this._Controller = Controller;

  this._userCache = null;

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

  this._userCache.initialize(function() {
    self._localUser = self._userCache.getLocalUser();

    self._view = new self._View(self);
    self._controller = new self._Controller(self);
    self._view.initialize();
    self._controller.initialize();

    if (!self._domIsBound) {
      self._binder.on(self._view.collapseBtn, 'click',
                      self._view.toggleCollapse);
      self._binder.on(self._view.list, 'click', '.' + COMMON.JOIN_CLASS,
                      self._controller.toggleJoin);
      self._binder.on(self._view.list, 'click', '.' + COMMON.LEAVE_CLASS,
                      self._controller.toggleJoin);
      self._binder.on(self._view.list, 'click', '.' + COMMON.MUTE_CLASS,
                      self._controller.toggleMute);
      self._binder.on(self._view.list, 'click', '.' + COMMON.PAUSE_CLASS,
                      self._controller.togglePause);

      if (self._expandContainer) {
        self._binder.on(self._view.list, 'click', '.' + COMMON.EXPAND_CLASS,
                        self._controller.toggleExpand);
        self._binder.on(self._view.expandContainer, 'click',
                        '.' + COMMON.EXPAND_CLASS,
                        self._controller.toggleExpand);
        self._binder.on(self._view.expandContainer, 'click',
                        '.' + COMMON.LEAVE_CLASS, self._controller.toggleJoin);
        self._binder.on(self._view.expandContainer, 'click',
                        '.' + COMMON.MUTE_CLASS, self._controller.toggleMute);
        self._binder.on(self._view.expandContainer, 'click',
                        '.' + COMMON.PAUSE_CLASS, self._controller.togglePause);

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
    this._binder.off(this._view.collapseBtn, 'click',
                     this._view.toggleCollapse);
    this._binder.off(this._view.list, 'click', '.' + COMMON.JOIN_CLASS,
                     this._controller.toggleJoin);
    this._binder.off(this._view.list, 'click', '.' + COMMON.LEAVE_CLASS,
                     this._controller.toggleJoin);
    this._binder.off(this._view.list, 'click', '.' + COMMON.MUTE_CLASS,
                     this._controller.toggleMute);
    this._binder.off(this._view.list, 'click', '.' + COMMON.PAUSE_CLASS,
                     this._controller.togglePause);

    if (this._expandContainer) {
      this._binder.off(this._view.list, 'click', '.' + COMMON.EXPAND_CLASS,
                      this._controller.toggleExpand);
      this._binder.off(this._view.expandContainer, 'click',
                      '.' + COMMON.EXPAND_CLASS,
                      this._controller.toggleExpand);
      this._binder.off(this._view.expandContainer, 'click',
                        '.' + COMMON.LEAVE_CLASS, this._controller.toggleJoin);
      this._binder.off(this._view.expandContainer, 'click',
                        '.' + COMMON.MUTE_CLASS, this._controller.toggleMute);
      this._binder.off(this._view.expandContainer, 'click',
                        '.' + COMMON.PAUSE_CLASS, this._controller.togglePause);

    }

    this._domIsBound = false;
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

  if (!_.isUndefined(options.autoStart) && !_.isBoolean(options.autoStart)) {
    throw errors.create(COMMON.NAME, 'INVALID_AUTOSTART');
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
module.exports.supported = supported;
