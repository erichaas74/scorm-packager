/* Adapter for the real Buzz essay rendered inside this template's ninth slot.
   It updates normal editor values/events, not a separate hidden input. */
function connectParachuteBuzzResponse(root, doc) {
  if (!root) return;
  const slot = root.querySelector('#s5-buzz-response');
  if (!slot) return;
  let touched = false, initialized = false, syncing = false;
  const watchedFrames = new WeakSet();
  function editors() {
    const result = Array.from(slot.querySelectorAll('textarea, [contenteditable="true"]'));
    for (const frame of slot.querySelectorAll('iframe')) {
      if (!watchedFrames.has(frame)) {
        watchedFrames.add(frame);
        frame.addEventListener('load', sync);
      }
      try {
        const body = frame.contentDocument && frame.contentDocument.body;
        if (body && (body.isContentEditable || frame.contentDocument.designMode === 'on')) result.push(body);
      } catch (_) { /* Cross-origin editors require a Buzz-specific adapter. */ }
    }
    return result.filter(editor => !editor.disabled && !editor.readOnly);
  }
  const read = editor => editor.tagName === 'TEXTAREA' ? editor.value : editor.textContent;
  function write(editor, value) {
    if (read(editor) === value) return;
    const view = editor.ownerDocument.defaultView;
    if (editor.tagName === 'TEXTAREA') {
      const setter = Object.getOwnPropertyDescriptor(view.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(editor, value);
    } else editor.textContent = value;
    editor.dispatchEvent(new view.Event('input', { bubbles: true }));
    editor.dispatchEvent(new view.Event('change', { bubbles: true }));
  }
  function sync() {
    if (syncing) return;
    syncing = true;
    try {
      const fields = editors();
      if (!initialized && fields.length) {
        initialized = true;
        if (!touched) {
          const restored = fields.map(field => ParachuteGrading.restore(read(field))).find(Boolean);
          if (restored) root.restoreFlightAssessment(restored);
        }
      }
      const result = root.currentFlightGrade();
      const value = ParachuteGrading.submission(result);
      fields.forEach(field => write(field, value));
      slot.querySelectorAll('input, textarea, button, select, a, [contenteditable], iframe').forEach(field => {
        field.setAttribute('tabindex', '-1');
      });
      if (value) {
        root.querySelector('#s5-grading-status').textContent = fields.length
          ? 'Section 5 complete: 4 / 4. Flight record added to your response. Submit the Buzz assessment to finish.'
          : 'Section 5 calculations are correct. The Buzz response field is not available yet; completion has not been added. Keep this page open.';
      }
    } finally { syncing = false; }
  }
  root.onFlightGrade = () => { touched = true; sync(); };
  // Answer changes and retries already clear the response immediately. Recheck
  // synchronously when a same-document assessment submit is clicked or fired.
  doc.addEventListener('submit', sync, true);
  doc.addEventListener('click', sync, true);
  const observer = new MutationObserver(sync);
  observer.observe(slot, { childList: true, subtree: true, characterData: true });
  sync();
  return { sync, disconnect() { observer.disconnect(); } };
}
connectParachuteBuzzResponse(document.getElementById('independent-launch'), document);
