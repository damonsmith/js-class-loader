(function (global, exports, perf) {
  'use strict';

  function fixSetTarget(param) {
  }

  if (window.hasOwnProperty('AudioContext') && !window.hasOwnProperty('webkitAudioContext')) {

    AudioContext.prototype.createGain = function() { 
    };

}(window));

