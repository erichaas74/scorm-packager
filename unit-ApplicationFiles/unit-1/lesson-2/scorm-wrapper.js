/**
 * scorm-wrapper.js  –  Vanilla JS SCORM 1.2 API wrapper
 * ────────────────────────────────────────────────────────
 * Include this file in your simulation's HTML *before* your own scripts:
 *
 *   <script src="scorm-wrapper.js"></script>
 *
 * The wrapper:
 *   • Auto-discovers the LMS API object by walking the frame hierarchy.
 *   • Calls LMSInitialize() on window load.
 *   • Calls LMSCommit() + LMSFinish() on beforeunload.
 *   • Exposes a global `SCORM` object with helper methods (see below).
 *   • Silently degrades when run outside an LMS (standalone / file:// mode).
 *
 * Public API  (window.SCORM):
 *   SCORM.initialize()              → bool
 *   SCORM.finish()                  → bool
 *   SCORM.commit()                  → bool
 *   SCORM.getValue(element)         → string
 *   SCORM.setValue(element, value)  → bool
 *   SCORM.setScore(raw, min?, max?) → void   (min=0, max=100)
 *   SCORM.setStatus(status)         → void
 *     Valid status strings: "passed" | "failed" | "completed" |
 *                           "incomplete" | "browsed" | "not attempted"
 */

(function (global) {
  'use strict';

  // ── Internal state ──────────────────────────────────────────────────────────

  var _api        = null;   // cached LMS API reference
  var _initialized = false;

  // ── API discovery ───────────────────────────────────────────────────────────

  /**
   * Walk up the frame tree looking for window.API (SCORM 1.2).
   * The SCORM spec allows up to 7 levels of parent frames.
   */
  function _findAPIInFrameTree(win) {
    var depth = 0;
    try {
      while (win.API == null && win.parent != null && win.parent !== win) {
        depth += 1;
        if (depth > 7) return null;
        win = win.parent;
      }
      return win.API || null;
    } catch (e) {
      console.warn('[SCORM] Cross-origin frame access blocked at depth', depth);
      return null;
    }
  }

  function _discoverAPI() {
    if (_api) return _api;

    // 1. Search parent frames (most common LMS embedding)
    _api = _findAPIInFrameTree(global);

    // 2. Fall back to opener window (some LMSes use pop-up launching)
    if (!_api && global.opener) {
      try {
        _api = _findAPIInFrameTree(global.opener);
      } catch (e) {
        console.warn('[SCORM] Opener window access blocked.');
      }
    }

    if (!_api) {
      console.warn('[SCORM] LMS API not found – running in standalone mode.');
    }

    return _api;
  }

  // ── Core LMS calls ──────────────────────────────────────────────────────────

  function _isTrue(result) {
    if (result === true || result === 1) return true;
    if (typeof result === 'string') return result.toLowerCase() === 'true';
    return false;
  }

  function initialize() {
    if (_initialized) return true;
    var api = _discoverAPI();
    if (!api) return false;

    var result = api.LMSInitialize('');
    if (!_isTrue(result)) {
      var err = api.LMSGetLastError ? api.LMSGetLastError() : '?';
      console.error('[SCORM] LMSInitialize failed. Error code:', err);
      return false;
    }

    _initialized = true;
    console.log('[SCORM] LMSInitialize – OK');
    return true;
  }

  function getValue(element) {
    var api = _discoverAPI();
    if (!api) return '';
    if (!_initialized && !initialize()) return '';
    return api.LMSGetValue(element);
  }

  function setValue(element, value) {
    var api = _discoverAPI();
    if (!api) return false;
    if (!_initialized && !initialize()) return false;

    var result = api.LMSSetValue(element, String(value));
    if (!_isTrue(result)) {
      var err = api.LMSGetLastError ? api.LMSGetLastError() : '?';
      console.error('[SCORM] LMSSetValue failed – element:', element,
                    '  value:', value, '  error:', err);
      return false;
    }
    return true;
  }

  function commit() {
    var api = _discoverAPI();
    if (!api) return false;
    if (!_initialized && !initialize()) return false;
    var result = api.LMSCommit('');
    if (!_isTrue(result)) {
      var err = api.LMSGetLastError ? api.LMSGetLastError() : '?';
      console.error('[SCORM] LMSCommit failed. Error code:', err);
      return false;
    }
    return true;
  }

  function finish() {
    var api = _discoverAPI();
    if (!api) return false;

    api.LMSCommit('');  // flush any pending data first
    var result = api.LMSFinish('');
    _initialized = false;
    console.log('[SCORM] LMSFinish – OK');
    return _isTrue(result);
  }

  // ── Convenience helpers ─────────────────────────────────────────────────────

  /**
   * Set the learner's score.
   * @param {number} raw   - Score value (typically 0–100)
   * @param {number} [min] - Minimum possible score (default 0)
   * @param {number} [max] - Maximum possible score (default 100)
   */
  function setScore(raw, min, max) {
    min = (min !== undefined) ? min : 0;
    max = (max !== undefined) ? max : 100;
    var accepted = [
      setValue('cmi.core.score.raw', raw),
      setValue('cmi.core.score.min', min),
      setValue('cmi.core.score.max', max)
    ].every(Boolean);
    return accepted && commit();
  }

  /**
   * Set the lesson completion/pass status.
   * @param {string} status - One of: "passed" | "failed" | "completed" |
   *                          "incomplete" | "browsed" | "not attempted"
   */
  function setStatus(status) {
    var valid = ['passed', 'failed', 'completed', 'incomplete', 'browsed', 'not attempted'];
    if (valid.indexOf(status) === -1) {
      console.warn('[SCORM] setStatus received unexpected value:', status);
    }
    return setValue('cmi.core.lesson_status', status) && commit();
  }

  function isInitialized() {
    return _initialized;
  }

  // ── Lifecycle hooks ─────────────────────────────────────────────────────────

  global.addEventListener('load', function () {
    initialize();
  });

  global.addEventListener('beforeunload', function () {
    if (_initialized) finish();
  });

  // ── Public surface ──────────────────────────────────────────────────────────

  global.SCORM = {
    initialize : initialize,
    finish     : finish,
    commit     : commit,
    getValue   : getValue,
    setValue   : setValue,
    setScore   : setScore,
    setStatus  : setStatus,
    isInitialized: isInitialized
  };

}(window));
