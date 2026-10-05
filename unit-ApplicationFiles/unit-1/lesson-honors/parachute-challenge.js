function mountParachuteChallenge(root) {
  if (!root) return;
  const get = id => root.querySelector('#s5-' + id);
  let flight = createParachuteFlight();
  let attempt = 1, frame = null, previous = null, saved = false;
  let gradingFlight = null;
  const history = [];
  const readAnswers = () => ({ total: get('answer-total').value, chute: get('answer-chute').value,
    percent: get('answer-percent').value, safety: get('answer-safety').value });
  function invalidate() {
    root.flightAssessmentResult = null;
    if (typeof root.onFlightGrade === 'function') root.onFlightGrade(null);
  }
  root.currentFlightGrade = () => root.flightAssessmentResult
    ? ParachuteGrading.grade(gradingFlight, readAnswers()) : null;
  root.restoreFlightAssessment = result => {
    gradingFlight = result.flight;
    attempt = result.flight.attempt;
    Object.assign(flight.state, { phase: result.flight.result === 'Safe landing' ? 'landed' : 'crashed',
      time: result.flight.totalTime, height: 0, velocity: result.flight.landingVelocity,
      burnDuration: result.flight.burn, cutoffReason: result.flight.cutoffReason,
      deployed: true, result: result.flight.result, events: result.flight.events });
    render();
    for (const key of ['total', 'chute', 'percent', 'safety']) get('answer-' + key).value = String(result.answers[key]);
    root.flightAssessmentResult = result;
    get('grading-status').textContent = 'Section 5 complete: 4 / 4. Saved response restored.';
  };
  const phases = {
    ready: 'Ready to launch. You control engine cutoff and parachute deployment.',
    powered: 'Engine on. Cut the engine when you choose; fuel limits the burn to 4 seconds.',
    coast: 'Engine off. Coasting toward the apex.',
    fall: 'Descending. Deploy the parachute when you choose; available at 5 m/s downward or faster.',
    braking: 'Parachute open. Slowing the descent.',
    chute: 'Parachute open. Steady descent.',
    landed: 'Safe landing. Your flight record is ready for analysis.',
    crashed: 'Hard landing. Keep this record or try a different cutoff and deployment.'
  };
  const rows = events => events.map(e => '<tr><td>' + e.name + '</td><td>' +
    e.height.toFixed(2) + '</td><td>' + e.velocity.toFixed(2) + '</td></tr>').join('');
  function render() {
    const s = flight.state;
    get('launch').disabled = s.phase !== 'ready';
    get('cutoff').disabled = s.phase !== 'powered';
    get('deploy').disabled = !flight.canDeploy();
    const status = phases[s.phase];
    if (get('status').textContent !== status) get('status').textContent = status;
    get('altitude').textContent = s.height.toFixed(2) + ' m';
    get('velocity').textContent = s.velocity.toFixed(2) + ' m/s';
    get('acceleration').textContent = flight.acceleration().toFixed(2) + ' m/s²';
    get('fuel').textContent = Math.max(0, flight.settings.fuelSeconds - (s.burnDuration == null ? s.time : s.burnDuration)).toFixed(2) + ' s';
    get('burn-duration').textContent = s.burnDuration == null ? '—' : s.burnDuration.toFixed(2) + ' s';
    get('cutoff-reason').textContent = s.cutoffReason ? '(' + s.cutoffReason + ')' : '';
    get('attempt').textContent = '· Attempt ' + attempt;
    get('events').innerHTML = s.events.length ? rows(s.events) : '<tr><td colspan="3">Launch to collect measurements.</td></tr>';
    const scene = root.querySelector('.s5-scene');
    get('vehicle').style.bottom = (26 + (scene.clientHeight - 150) * Math.max(0, s.height) / 320) + 'px';
    get('canopy').setAttribute('visibility', s.deployed ? 'visible' : 'hidden');
    get('exhaust').setAttribute('visibility', s.phase === 'powered' ? 'visible' : 'hidden');
    if (s.result && !saved) {
      saved = true;
      gradingFlight = ParachuteGrading.freezeFlight(s, attempt);
      const eligible = gradingFlight && gradingFlight.chuteTime !== null;
      get('answer-fields').disabled = !eligible;
      get('grading-record').textContent = eligible
        ? 'Flight record attached: Attempt ' + attempt + '. Your answers will be checked against this flight.'
        : 'Complete a flight with a deployed parachute to attach its record.';
      history.unshift({ attempt, result: s.result, burn: s.burnDuration, reason: s.cutoffReason,
        events: s.events.map(e => ({ name: e.name, height: e.height, velocity: e.velocity })) });
      history.splice(3);
      get('history').innerHTML = history.map(record => '<details><summary>Attempt ' + record.attempt + ' — ' + record.result +
        '</summary><p>Burn duration: ' + record.burn.toFixed(2) + ' s (' + record.reason + ')</p><div class="s5-table-wrap">' +
        '<table class="s5-event-table"><thead><tr><th scope="col">Event</th><th scope="col">Altitude (m)</th><th scope="col">Velocity (m/s)</th></tr></thead><tbody>' +
        rows(record.events) + '</tbody></table></div></details>').join('');
    }
  }
  function animate(timestamp) {
    if (previous != null) flight.advance(Math.min((timestamp - previous) / 1000, 0.1));
    previous = timestamp;
    render();
    frame = flight.running() ? requestAnimationFrame(animate) : null;
  }
  get('launch').addEventListener('click', () => {
    if (!flight.start()) return;
    invalidate();
    previous = null;
    render();
    frame = requestAnimationFrame(animate);
  });
  get('cutoff').addEventListener('click', () => { flight.cutoff(); render(); });
  get('deploy').addEventListener('click', () => { flight.deploy(); render(); });
  get('check-answers').addEventListener('click', () => {
    const result = ParachuteGrading.grade(gradingFlight, readAnswers());
    if (!result.eligible) { invalidate(); get('grading-status').textContent = result.message; return; }
    get('feedback-total').textContent = result.details.total ? 'Correct.' : 'Incorrect. Recalculate total airborne time using the attached flight record.';
    get('feedback-chute').textContent = result.details.chute && result.details.percent && result.details.safety ? 'Correct.' : 'Incorrect. Recheck ' +
      [!result.details.chute && 'parachute time', !result.details.percent && 'percentage', !result.details.safety && 'landing safety'].filter(Boolean).join(', ') + '.';
    root.flightAssessmentResult = result;
    get('grading-status').textContent = result.complete
      ? 'Section 5 complete: 4 / 4. Preparing your flight record for the assessment response.'
      : 'Section 5 incomplete. The assessment response stays blank until all answers are correct.';
    // An integration adapter handles LMS delivery; app feedback alone is not a save confirmation.
    if (typeof root.onFlightGrade === 'function') root.onFlightGrade(result);
  });
  for (const key of ['total', 'chute', 'percent', 'safety']) {
    const edited = () => {
      invalidate();
      get('grading-status').textContent = 'Answers changed. Submit Section 5 again; the assessment response is blank.';
    };
    get('answer-' + key).addEventListener('input', edited);
    get('answer-' + key).addEventListener('change', edited);
  }
  get('reset').addEventListener('click', () => {
    if (frame != null) cancelAnimationFrame(frame);
    if (flight.state.phase !== 'ready') attempt++;
    flight = createParachuteFlight();
    previous = null; frame = null; saved = false;
    gradingFlight = null;
    invalidate();
    get('answer-fields').disabled = true;
    ['answer-total', 'answer-chute', 'answer-percent', 'answer-safety'].forEach(id => { get(id).value = ''; });
    get('feedback-total').textContent = ''; get('feedback-chute').textContent = '';
    get('grading-record').textContent = 'Complete a flight with a deployed parachute to attach its record.';
    get('grading-status').textContent = 'No graded flight yet.';
    render();
  });
  render();
}

mountParachuteChallenge(document.getElementById('independent-launch'));
