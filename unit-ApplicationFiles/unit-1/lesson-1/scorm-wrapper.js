/**
 * Minimal SCORM 1.2 bridge for the Unit 1 Lesson 1 Buzz SCO.
 * It discovers Buzz's API, initializes once, and exposes safe get/set/commit helpers.
 */
(function (global) {
  'use strict';

  var api = null;
  var initialized = false;

  function isTrue(value) {
    return value === true || value === 1 || String(value).toLowerCase() === 'true';
  }

  function findAPI(startWindow) {
    var current = startWindow;
    var depth = 0;
    try {
      while (current && !current.API && current.parent && current.parent !== current && depth < 10) {
        current = current.parent;
        depth += 1;
      }
      return current && current.API ? current.API : null;
    } catch (error) {
      return null;
    }
  }

  function discoverAPI() {
    if (api) return api;
    api = findAPI(global);
    if (!api && global.opener) api = findAPI(global.opener);
    return api;
  }

  function initialize() {
    if (initialized) return true;
    var candidate = discoverAPI();
    if (!candidate) return false;
    initialized = isTrue(candidate.LMSInitialize(''));
    return initialized;
  }

  function getValue(element) {
    if (!initialize()) return '';
    return api.LMSGetValue(element);
  }

  function setValue(element, value) {
    if (!initialize()) return false;
    return isTrue(api.LMSSetValue(element, String(value)));
  }

  function commit() {
    if (!initialize()) return false;
    return isTrue(api.LMSCommit(''));
  }

  function finish() {
    if (!initialized || !api) return false;
    api.LMSCommit('');
    var result = api.LMSFinish('');
    initialized = false;
    return isTrue(result);
  }

  global.SCORM = {
    initialize: initialize,
    getValue: getValue,
    setValue: setValue,
    commit: commit,
    finish: finish,
    isInitialized: function () { return initialized; }
  };

  global.addEventListener('load', initialize);
  global.addEventListener('beforeunload', finish);
}(window));
