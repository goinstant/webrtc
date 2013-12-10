/*jshint browser:true*/
/*global module, require*/
'use strict';

/**
 * @fileoverview
 *
 */

/** Module dependencies */


/** Constants */

/**
 * @constructor
 */
function WebRTC() {

}

/**
 * Initializes the WebRTC widget
 * @public
 * @param {function} cb The function to call with an error or when
 *                      initialization is complete.
 */
WebRTC.prototype.initialize = function(cb) {
  cb();
};

/**
 * Destroys the WebRTC widget
 * @public
 * @param {function} cb The function to call with an error or when
 *                      the destroy is complete.
 */
WebRTC.prototype.destroy = function(cb) {
  cb();
};

/* Export the module */
module.exports = WebRTC;
