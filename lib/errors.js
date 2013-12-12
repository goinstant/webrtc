/*jshint browser:true*/
/*global module*/

'use strict';

/**
 * Expose `errors`
 */

var errors = module.exports = function errors() {};

var errorMap = {
  INVALID_CALLBACK: ': Callback was not found or invalid',
  INVALID_OPTIONS: ': Options was not found or invalid',
  INVALID_ARGUMENT: ': Invalid argument passed',
  INVALID_ROOM: ': Room was not found or invalid',

  INVALID_COLLAPSED: ': collapsed value must be a boolean',
  INVALID_CONTAINER: ': container must be a DOM element',
  INVALID_POSITION: ': position can only be "right" or "left"',
  INVALID_TRUNCATELENGTH: ': truncateLength can only be a number',
  INVALID_AVATARS: ': avatars must be a boolean',

  INVALID_LISTENER: ': Listener was not found or invalid',
  INVALID_EVENT: ': Event was not found or invalid'
};

errors.create = function(method, type) {
  if (!method || !type || !errorMap[type]) {
    throw new Error('That error type doesn\'t exist!');
  }

  return new Error(method + '' + errorMap[type]);
};
