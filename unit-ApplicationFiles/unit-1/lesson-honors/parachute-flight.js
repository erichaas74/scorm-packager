/* Exact constant-acceleration segments keep the flight record calculable. */
function createParachuteFlight() {
  const settings = Object.freeze({ burnAcceleration: 15, gravity: -10, fuelSeconds: 4,
    chuteAcceleration: 12, descentSpeed: 5, safeSpeed: 6 });
  const state = { phase: 'ready', time: 0, height: 0, velocity: 0, burnDuration: null,
    cutoffReason: null, deployed: false, events: [], result: null };
  const running = () => !['ready', 'landed', 'crashed'].includes(state.phase);
  function record(name) {
    state.events.push({ name, height: state.height, velocity: state.velocity, time: state.time });
  }
  function start() {
    if (state.phase !== 'ready') return false;
    state.phase = 'powered';
    record('Liftoff');
    return true;
  }
  function cutoff(reason = 'Student cutoff') {
    if (state.phase !== 'powered') return false;
    state.burnDuration = state.time;
    state.cutoffReason = reason;
    state.phase = state.velocity > 0 ? 'coast' : 'fall';
    record('Engine cutoff');
    return true;
  }
  function canDeploy() {
    return state.phase === 'fall' && state.velocity <= -settings.descentSpeed + 1e-9;
  }
  function deploy() {
    if (!canDeploy()) return false;
    state.deployed = true;
    record('Parachute opens');
    state.phase = 'braking';
    return true;
  }
  function acceleration() {
    if (state.phase === 'powered') return settings.burnAcceleration;
    if (state.phase === 'coast' || state.phase === 'fall') return settings.gravity;
    if (state.phase === 'braking') return settings.chuteAcceleration;
    return 0;
  }
  function groundTime(a) {
    const { height: y, velocity: v } = state;
    if (y <= 1e-10 && v <= 0) return 0;
    if (Math.abs(a) < 1e-12) return v < 0 ? -y / v : Infinity;
    const discriminant = v * v - 2 * a * y;
    if (discriminant < 0) return Infinity;
    const roots = [(-v - Math.sqrt(discriminant)) / a, (-v + Math.sqrt(discriminant)) / a];
    return Math.min(...roots.filter(t => t > 1e-10), Infinity);
  }
  function advance(seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    let remaining = seconds;
    while (remaining > 1e-10 && running()) {
      const a = acceleration();
      let until = Infinity, transition = null;
      if (state.phase === 'powered') { until = settings.fuelSeconds - state.time; transition = 'fuel'; }
      if (state.phase === 'coast') { until = state.velocity / -settings.gravity; transition = 'apex'; }
      if (state.phase === 'braking') { until = (-settings.descentSpeed - state.velocity) / a; transition = 'steady'; }
      const ground = groundTime(a);
      // At liftoff the positive acceleration carries the rocket off the pad.
      if (!(state.phase === 'powered' && state.time === 0) && ground <= until) {
        until = ground; transition = 'ground';
      }
      const step = Math.max(0, Math.min(remaining, until));
      state.height += state.velocity * step + 0.5 * a * step * step;
      state.velocity += a * step;
      state.time += step;
      remaining -= step;
      if (until > step + 1e-9) break;
      if (transition === 'fuel') cutoff('Fuel exhausted');
      if (transition === 'apex') { state.velocity = 0; record('Apex'); state.phase = 'fall'; }
      if (transition === 'steady') {
        state.velocity = -settings.descentSpeed;
        record('Steady descent begins');
        state.phase = 'chute';
      }
      if (transition === 'ground') {
        state.height = 0;
        state.result = Math.abs(state.velocity) <= settings.safeSpeed + 1e-9 ? 'Safe landing' : 'Hard landing';
        state.phase = state.result === 'Safe landing' ? 'landed' : 'crashed';
        record('Touchdown');
      }
    }
  }
  return { settings, state, start, cutoff, deploy, canDeploy, acceleration, advance, running };
}

if (typeof module !== 'undefined' && module.exports) module.exports = createParachuteFlight;
