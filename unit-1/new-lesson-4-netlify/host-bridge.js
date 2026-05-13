(function(global) {
  'use strict';

  var CHANNEL = 'reaction-time-lab';
  var SOURCE = 'reaction-time-lab-host';
  var SHELL_SOURCE = 'reaction-time-lab-shell';
  var nextRequestId = 1;

  function isEmbedded() {
    return !!(global.parent && global.parent !== global);
  }

  function post(type, payload, requestId) {
    if (!isEmbedded()) return false;
    try {
      global.parent.postMessage({
        channel: CHANNEL,
        source: SOURCE,
        type: type,
        requestId: requestId || '',
        payload: payload || {}
      }, '*');
      return true;
    } catch (err) {
      return false;
    }
  }

  function requestLaunchData() {
    if (!isEmbedded()) return Promise.resolve(null);

    return new Promise(function(resolve) {
      var requestId = 'launch-' + nextRequestId++;
      var settled = false;
      var timeoutId = global.setTimeout(function() {
        cleanup();
        resolve(null);
      }, 600);

      function cleanup() {
        if (settled) return;
        settled = true;
        global.clearTimeout(timeoutId);
        global.removeEventListener('message', onMessage);
      }

      function onMessage(event) {
        var data = event.data;
        if (!data || data.channel !== CHANNEL || data.source !== SHELL_SOURCE) return;
        if (data.type !== 'launch-data' || data.requestId !== requestId) return;
        cleanup();
        resolve(data.payload || null);
      }

      global.addEventListener('message', onMessage);
      post('launch-request', {
        href: global.location.href,
        origin: global.location.origin
      }, requestId);
    });
  }

  global.LabHostBridge = {
    channel: CHANNEL,
    isEmbedded: isEmbedded,
    requestLaunchData: requestLaunchData,
    setSuspendData: function(suspendData) {
      return post('set-suspend-data', { suspendData: suspendData || '' });
    },
    setStatus: function(lessonStatus) {
      return post('set-status', { lessonStatus: lessonStatus || 'incomplete' });
    },
    clearState: function() {
      return post('clear-state', {});
    },
    notifySubmit: function(summary) {
      return post('submitted', summary || {});
    }
  };
}(window));