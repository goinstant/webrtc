/*jshint browser:true*/
/*global module*/

'use strict';

/**
 * Expose `errors`
 */

var errors = module.exports = function errors() {};

var errorMap = {
  UNSUPPORTED_BROWSER: ': Browser does not support WebRTC. ' +
                       'For a list of supported browsers see www.webrtc.org.',
  INVALID_CALLBACK: ': Callback was not found or invalid',
  INVALID_OPTIONS: ': Options object was not found or invalid',
  INVALID_ARGUMENT: ': Invalid argument passed',
  INVALID_ROOM: ': Room was not found or invalid',

  INVALID_COLLAPSED: ': collapsed value must be a boolean',
  INVALID_AUTOSTART: ': autoStart value must be a boolean',
  INVALID_LIST_CONTAINER: ': listContainer must be a DOM element',
  INVALID_EXPAND_CONTAINER: ': expandContainer must be a DOM element',
  INVALID_GORTC_OPTIONS: ': gortcOptions must be an object',

  INVALID_LISTENER: ': Listener was not found or invalid',
  INVALID_EVENT: ': Event was not found or invalid'
};

errors.create = function(method, type) {
  if (!method || !type || !errorMap[type]) {
    throw new Error('That error type doesn\'t exist!');
  }

  return new Error(method + '' + errorMap[type]);
};
