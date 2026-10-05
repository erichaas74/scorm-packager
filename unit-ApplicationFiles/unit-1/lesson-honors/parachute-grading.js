/* Store the measured flight with the submitted response and grade the same flight. */
const ParachuteGrading = (() => {
  const TIME_TOLERANCE = 0.1;
  const PERCENT_TOLERANCE = 0.5;
  function number(value) {
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    if (String(value).trim() === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }
  function freezeFlight(state, attempt) {
    if (!state.result || !Number.isFinite(state.time) || state.time <= 0) return null;
    const opened = state.events.find(event => event.name === 'Parachute opens');
    const flight = {
      version: 1, attempt, result: state.result, burn: state.burnDuration,
      cutoffReason: state.cutoffReason, totalTime: state.time,
      chuteTime: opened ? state.time - opened.time : null,
      landingVelocity: state.velocity,
      events: state.events.map(event => Object.freeze({ name: event.name, height: event.height,
        velocity: event.velocity, time: event.time }))
    };
    Object.freeze(flight.events);
    return Object.freeze(flight);
  }
  function grade(flight, raw) {
    if (!flight || !Number.isFinite(flight.totalTime) || flight.totalTime <= 0 ||
        !Number.isFinite(flight.chuteTime) || flight.chuteTime < 0) {
      return { eligible: false, message: 'Complete a flight with a deployed parachute before submitting answers.' };
    }
    const answers = { total: number(raw.total), chute: number(raw.chute), percent: number(raw.percent), safety: raw.safety };
    const check = (answer, expected, tolerance) => answer !== null && Math.abs(answer - expected) <= tolerance + 1e-9;
    const details = {
      total: check(answers.total, flight.totalTime, TIME_TOLERANCE),
      chute: check(answers.chute, flight.chuteTime, TIME_TOLERANCE),
      percent: check(answers.percent, flight.chuteTime / flight.totalTime * 100, PERCENT_TOLERANCE),
      safety: answers.safety === (Math.abs(flight.landingVelocity) <= 6 + 1e-9 ? 'safe' : 'hard')
    };
    const complete = Object.values(details).every(Boolean);
    return { eligible: true, flight, answers, details,
      complete,
      questions: [{ id: 'U1H-Q09', correct: complete, points: complete ? 4 : 0, maximum: 4 }],
      score: complete ? 4 : 0, maximum: 4,
      tolerances: { seconds: TIME_TOLERANCE, percentagePoints: PERCENT_TOLERANCE } };
  }
  const marker = 'U1H_SECTION5_COMPLETE_V1\n';
  function submission(result) {
    if (!result || !result.eligible) return '';
    const verified = grade(result.flight, result.answers);
    if (!verified.complete) return '';
    return marker + JSON.stringify({ status: 'complete', maximum: 4,
      flight: verified.flight, answers: verified.answers, tolerances: verified.tolerances });
  }
  function restore(text) {
    if (!text || !text.startsWith(marker)) return null;
    try {
      const data = JSON.parse(text.slice(marker.length));
      const f = data.flight;
      const names = ['Liftoff', 'Engine cutoff', 'Apex', 'Parachute opens', 'Steady descent begins', 'Touchdown'];
      if (data.status !== 'complete' || data.maximum !== 4 || !f || !Number.isInteger(f.attempt) ||
          f.attempt < 1 || !Array.isArray(f.events) || f.events.length < 5 || f.events.length > 6 ||
          f.events.some(e => !names.includes(e.name) || ![e.time, e.height, e.velocity].every(Number.isFinite)) ||
          !Number.isFinite(f.burn) || f.burn <= 0 || f.burn > 4.000001 ||
          !['Student cutoff', 'Fuel exhausted'].includes(f.cutoffReason) ||
          !['Safe landing', 'Hard landing'].includes(f.result)) return null;
      const end = f.events.find(e => e.name === 'Touchdown');
      const opened = f.events.find(e => e.name === 'Parachute opens');
      if (!end || !opened || Math.abs(end.time - f.totalTime) > 1e-7 ||
          Math.abs(end.time - opened.time - f.chuteTime) > 1e-7 ||
          Math.abs(end.velocity - f.landingVelocity) > 1e-7) return null;
      const result = grade(f, data.answers);
      return result.complete ? result : null;
    } catch (_) { return null; }
  }
  return { freezeFlight, grade, submission, restore };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = ParachuteGrading;
