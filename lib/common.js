/*jshint browser:true*/
/*global module, require*/

'use strict';

var common = {
  /* Common Constants */
  NAME: 'WebRTC',
  NAMESPACE: 'goinstant/widgets/webrtc/',
  DATA_ID: 'data-goinstant-id',

  /* List Classes */
  OVERRIDE_CLASS: 'gi-override',
  WIDGET_CLASS: 'gi-webrtc',
  CUSTOM_CONTAINER_CLASS: 'gi-custom-container',
  EXPAND_CONTAINER_CLASS: 'gi-expand-container',
  LIST_WRAPPER_CLASS: 'gi-list-wrapper',
  COLLAPSED_CLASS: 'gi-collapsed',
  COLLAPSE_WRAPPER_CLASS: 'gi-collapse-wrapper',
  COLLAPSE_CLASS: 'gi-collapse',
  LIST_CLASS: 'gi-list',
  STREAMING_CLASS: 'gi-streaming',

  /* User Classes */
  USER_CLASS: 'gi-user',
  AUDIO_ONLY_CLASS: 'gi-streaming-audio',
  LOCAL_CLASS: 'gi-local',
  OVERLAY_CLASS: 'gi-overlay',
  USER_WRAPPER_CLASS: 'gi-user-wrapper',
  STREAM_WRAPPER_CLASS: 'gi-stream-wrapper',
  STREAM_CLASS: 'gi-stream',
  AVATAR_CLASS: 'gi-avatar',
  EXPANDED_CLASS: 'gi-expanded',
  EXPAND_CLASS: 'gi-expand',
  RESTORE_CLASS: 'gi-restore',
  COLOR_CLASS: 'gi-color',
  NAME_CLASS: 'gi-name',
  MUTE_CLASS: 'gi-mute',
  MUTED_CLASS: 'gi-muted',
  AUDIO_CLASS: 'gi-audio',
  SPEAKING_CLASS: 'gi-speaking',
  JOIN_CLASS: 'gi-join',
  PAUSE_CLASS: 'gi-pause',
  LEAVE_CLASS: 'gi-leave',
  PAUSED_CLASS: 'gi-paused',
  ICON_CLASS: 'gi-icon'
};

/* Control Classes */
common.CONTROL_CLASSES = [
  common.AUDIO_CLASS,
  common.EXPAND_CLASS,
  common.PAUSE_CLASS,
  common.LEAVE_CLASS,
  common.JOIN_CLASS
];

/**
 * @exports
 */
module.exports = common;
