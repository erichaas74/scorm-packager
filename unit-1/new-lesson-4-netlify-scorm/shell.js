(function(global) {
  'use strict';

  var EMBED_URL = 'https://haas-u1-l4-reaction-lab.netlify.app/';
  var EMBED_ORIGIN = 'https://haas-u1-l4-reaction-lab.netlify.app';
  var CHANNEL = 'reaction-time-lab';
  var HOST_SOURCE = 'reaction-time-lab-host';
  var SHELL_SOURCE = 'reaction-time-lab-shell';

  var shellState = {
    suspendData: '',
    lessonStatus: 'incomplete'
  };

  var iframeEl = null;
  var overlayEl = null;
  var statusEl = null;
  var openLinkEl = null;

  function readScormState() {
    if (typeof SCORM === 'undefined') return;
    shellState.suspendData = SCORM.getValue('cmi.suspend_data') || '';
    shellState.lessonStatus = SCORM.getValue('cmi.core.lesson_status') || 'incomplete';
  }

  function writeSuspendData(payload) {
    shellState.suspendData = payload || '';
    if (typeof SCORM === 'undefined') return;
    SCORM.setValue('cmi.suspend_data', shellState.suspendData);
    SCORM.commit();
  }

  function writeLessonStatus(status) {
    shellState.lessonStatus = status || 'incomplete';
    if (typeof SCORM === 'undefined') {
      renderStatus();
      return;
    }
    SCORM.setStatus(shellState.lessonStatus);
    SCORM.commit();
    renderStatus();
  }

  function clearScormState() {
    shellState.suspendData = '';
    shellState.lessonStatus = 'incomplete';
    if (typeof SCORM !== 'undefined') {
      SCORM.setValue('cmi.suspend_data', '');
      SCORM.setValue('cmi.core.score.raw', '');
      SCORM.setValue('cmi.core.score.min', '');
      SCORM.setValue('cmi.core.score.max', '');
      SCORM.setStatus('incomplete');
      SCORM.commit();
    }
    renderStatus();
  }

  function renderStatus() {
    if (!statusEl) return;
    var text = shellState.lessonStatus || 'incomplete';
    statusEl.textContent = text.charAt(0).toUpperCase() + text.slice(1);
  }

  function respondToLaunchRequest(requestId) {
    if (!iframeEl || !iframeEl.contentWindow) return;
    iframeEl.contentWindow.postMessage({
      channel: CHANNEL,
      source: SHELL_SOURCE,
      type: 'launch-data',
      requestId: requestId || '',
      payload: {
        suspendData: shellState.suspendData,
        lessonStatus: shellState.lessonStatus
      }
    }, EMBED_ORIGIN);
  }

  function handleMessage(event) {
    if (event.origin !== EMBED_ORIGIN) return;
    if (!iframeEl || event.source !== iframeEl.contentWindow) return;

    var data = event.data;
    if (!data || data.channel !== CHANNEL || data.source !== HOST_SOURCE) return;

    switch (data.type) {
      case 'launch-request':
        respondToLaunchRequest(data.requestId);
        break;
      case 'set-suspend-data':
        writeSuspendData(data.payload && data.payload.suspendData);
        break;
      case 'set-status':
        writeLessonStatus(data.payload && data.payload.lessonStatus);
        break;
      case 'clear-state':
        clearScormState();
        break;
      case 'submitted':
        writeLessonStatus('completed');
        break;
    }
  }

  function init() {
    iframeEl = document.getElementById('lab-frame');
    overlayEl = document.getElementById('loading-overlay');
    statusEl = document.getElementById('shell-status');
    openLinkEl = document.getElementById('open-hosted-link');

    readScormState();
    renderStatus();

    openLinkEl.href = EMBED_URL;
    iframeEl.src = EMBED_URL;
    iframeEl.addEventListener('load', function() {
      overlayEl.classList.add('hidden');
    });

    global.addEventListener('message', handleMessage);
  }

  global.addEventListener('load', init);
}(window));