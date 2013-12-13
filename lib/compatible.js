/*jshint browser:true*/
/*global module, require*/
'use strict';

/**
 * @fileoverview
 * Checks compatibility with WebRTC
 */

/**
 * Check compatibility before including goRTC
 */
var NAME = 'WebRTC';
var errors = require('./errors');

module.exports = compatible;

/**
 * Check if the browser is compatible with WebRTC
 * @private
 * @returns {boolean} Is compatible if returns true
 */
function compatible() {
  var RTCPeerConnection = window.RTCPeerConnection ||
                          window.webkitRTCPeerConnection ||
                          window.mozRTCPeerConnection;

  if (!RTCPeerConnection) {
    throw errors.create(NAME, 'UNSUPPORTED_BROWSER');
  }

  var RTCSessionDescription = window.RTCSessionDescription ||
                              window.mozRTCSessionDescription;

  if (!RTCSessionDescription) {
    throw errors.create(NAME, 'UNSUPPORTED_BROWSER');
  }

  var RTCIceCandidate = window.RTCIceCandidate ||
                        window.mozRTCIceCandidate;

  if (!RTCIceCandidate) {
    throw errors.create(NAME, 'UNSUPPORTED_BROWSER');
  }
}
