/*jshint browser:true*/
/*global module, require*/
'use strict';

/**
 * @fileoverview
 * Checks compatibility with WebRTC
 */

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
    return false;
  }

  var RTCSessionDescription = window.RTCSessionDescription ||
                              window.mozRTCSessionDescription;

  if (!RTCSessionDescription) {
    return false;
  }

  var RTCIceCandidate = window.RTCIceCandidate ||
                        window.mozRTCIceCandidate;

  if (!RTCIceCandidate) {
    return false;
  }

  return true;
}
