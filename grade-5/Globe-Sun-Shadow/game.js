(() => {
  'use strict';

  const missingDependencies = [];
  if (!window.THREE) missingDependencies.push('Three.js');
  if (!window.Globe) missingDependencies.push('Globe.gl');
  if (!window.SunCalc) missingDependencies.push('SunCalc');
  if (!window.luxon || !window.luxon.DateTime) missingDependencies.push('Luxon');
  if (!window.tzLookup && !window.tzlookup) missingDependencies.push('tz-lookup');

  if (missingDependencies.length) {
    const warning = document.getElementById('dependencyWarning');
    if (warning) {
      warning.hidden = false;
      warning.textContent = `This lab needs ${missingDependencies.join(', ')} to load. Check the internet connection and refresh.`;
    }
    return;
  }

  const DateTime = window.luxon.DateTime;
  const tzLookup = window.tzLookup || window.tzlookup;

  const state = {
    lat: 38.83,
    lon: -104.82,
    selectedZone: 'America/Denver',
    localDateISO: '2026-06-21',
    minutes: 720,
    showMoon: true,
    compareSeasons: false,
    showLabels: true,
    showBelow: true,
    objectType: 'pole',
    objectHeight: 2,
    playing: false,
    activeView: 'globe'
  };

  const els = {
    globeContainer: document.getElementById('globeContainer'),
    globeTab: document.getElementById('globeTab'),
    horizonTab: document.getElementById('horizonTab'),
    globeView: document.getElementById('globeView'),
    horizonView: document.getElementById('horizonView'),
    latInput: document.getElementById('latInput'),
    lonInput: document.getElementById('lonInput'),
    useLocationBtn: document.getElementById('useLocationBtn'),
    zoneLabel: document.getElementById('zoneLabel'),
    locationPresetBtns: Array.from(document.querySelectorAll('[data-location-preset]')),
    dateInput: document.getElementById('dateInput'),
    timeSlider: document.getElementById('timeSlider'),
    timeLabel: document.getElementById('timeLabel'),
    playBtn: document.getElementById('playBtn'),
    noonBtn: document.getElementById('noonBtn'),
    sunriseBtn: document.getElementById('sunriseBtn'),
    sunsetBtn: document.getElementById('sunsetBtn'),
    moonToggle: document.getElementById('moonToggle'),
    seasonToggle: document.getElementById('seasonToggle'),
    labelsToggle: document.getElementById('labelsToggle'),
    belowToggle: document.getElementById('belowToggle'),
    readout: document.getElementById('readout'),
    statusText: document.getElementById('statusText'),
    sunSummary: document.getElementById('sunSummary'),
    objectSelect: document.getElementById('objectSelect'),
    heightInput: document.getElementById('heightInput'),
    horizonCanvas: document.getElementById('horizonCanvas'),
    shadowCanvas: document.getElementById('shadowCanvas'),
    shadowInfo: document.getElementById('shadowInfo'),
    diagnosticLocalTime: document.getElementById('diagnosticLocalTime'),
    diagnosticUTC: document.getElementById('diagnosticUTC'),
    diagnosticZone: document.getElementById('diagnosticZone'),
    seasonBtns: Array.from(document.querySelectorAll('[data-season]'))
  };

  const seasons = {
    march: { name: 'March Equinox', month: 2, day: 20, color: '#34a77b' },
    june: { name: 'June Solstice', month: 5, day: 21, color: '#f6b940' },
    sept: { name: 'Sept. Equinox', month: 8, day: 22, color: '#d66f4b' },
    dec: { name: 'Dec. Solstice', month: 11, day: 21, color: '#8bbde4' }
  };

  const shadow = {
    renderer: null,
    scene: null,
    camera: null,
    sunLight: null,
    ambient: null,
    target: null,
    ground: null,
    objectGroup: null
  };

  let globe;
  let playTimer = null;
  let _starCache = null;

  init();

  function init() {
    state.selectedZone = getZoneForLocation(state.lat, state.lon);
    state.localDateISO = DateTime.now().setZone(state.selectedZone).toISODate();
    els.dateInput.value = state.localDateISO;

    bindEvents();
    initGlobe();
    initShadowScene();
    updateAll();
    requestAnimationFrame(animationLoop);
  }

  function bindEvents() {
    els.globeTab.addEventListener('click', () => switchView('globe'));
    els.horizonTab.addEventListener('click', () => switchView('horizon'));

    els.useLocationBtn.addEventListener('click', () => {
      setLocationFromInputs();
      updateAll();
    });

    els.locationPresetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        state.lat = clamp(Number(btn.dataset.lat), -89.9, 89.9);
        state.lon = normalizeLon(Number(btn.dataset.lon));
        state.selectedZone = getZoneForLocation(state.lat, state.lon);
        syncLocationInputs();
        markActiveLocationPreset();
        updateAll();
      });
    });

    els.dateInput.addEventListener('change', () => {
      state.localDateISO = normalizeDateInput(els.dateInput.value, state.localDateISO);
      els.dateInput.value = state.localDateISO;
      updateAll();
    });

    els.timeSlider.addEventListener('input', () => {
      state.minutes = Number(els.timeSlider.value);
      updateAll();
    });

    els.playBtn.addEventListener('click', togglePlay);
    els.noonBtn.addEventListener('click', () => setTimeFromSolarEvent('solarNoon'));
    els.sunriseBtn.addEventListener('click', () => setTimeFromSolarEvent('sunrise'));
    els.sunsetBtn.addEventListener('click', () => setTimeFromSolarEvent('sunset'));

    bindToggle(els.moonToggle, 'showMoon');
    bindToggle(els.seasonToggle, 'compareSeasons');
    bindToggle(els.labelsToggle, 'showLabels');
    bindToggle(els.belowToggle, 'showBelow');

    els.objectSelect.addEventListener('change', () => {
      state.objectType = els.objectSelect.value;
      rebuildShadowObject();
      updateAll();
    });

    els.heightInput.addEventListener('input', () => {
      const nextHeight = Number(els.heightInput.value);
      if (!Number.isFinite(nextHeight)) return;
      state.objectHeight = clamp(nextHeight, 0.2, 10);
      rebuildShadowObject();
      updateAll();
    });

    els.heightInput.addEventListener('change', () => {
      els.heightInput.value = state.objectHeight.toFixed(1).replace(/\.0$/, '');
    });

    els.seasonBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const season = seasons[btn.dataset.season];
        if (!season) return;
        state.localDateISO = seasonISO(season, getSelectedYear());
        els.dateInput.value = state.localDateISO;
        updateAll();
      });
    });

    window.addEventListener('resize', () => {
      resizeGlobe();
      resizeCanvases();
      resizeShadowRenderer();
      updateAll();
    });
  }

  function bindToggle(button, stateKey) {
    button.addEventListener('click', () => {
      state[stateKey] = !state[stateKey];
      button.classList.toggle('active', state[stateKey]);
      button.setAttribute('aria-pressed', String(state[stateKey]));
      updateAll();
    });
  }

  function setLocationFromInputs() {
    state.lat = clamp(Number(els.latInput.value) || 0, -89.9, 89.9);
    state.lon = normalizeLon(Number(els.lonInput.value) || 0);
    state.selectedZone = getZoneForLocation(state.lat, state.lon);
    syncLocationInputs();
    markActiveLocationPreset();
  }

  function syncLocationInputs() {
    els.latInput.value = state.lat.toFixed(2);
    els.lonInput.value = state.lon.toFixed(2);
  }

  function markActiveLocationPreset() {
    els.locationPresetBtns.forEach(btn => {
      const lat = Number(btn.dataset.lat);
      const lon = Number(btn.dataset.lon);
      const active = Math.abs(lat - state.lat) < 0.01 && Math.abs(normalizeLon(lon) - state.lon) < 0.01;
      btn.classList.toggle('active', active);
    });
  }

  function setTimeFromSolarEvent(key) {
    const times = SunCalc.getTimes(getSelectedJSDate(720), state.lat, state.lon);
    const eventTime = times[key];
    if (!validDate(eventTime)) return;
    const localEventTime = DateTime.fromJSDate(eventTime, { zone: state.selectedZone });
    state.minutes = localEventTime.hour * 60 + localEventTime.minute;
    els.timeSlider.value = state.minutes;
    updateAll();
  }

  function switchView(view) {
    state.activeView = view;
    const globeActive = view === 'globe';
    els.globeTab.classList.toggle('active', globeActive);
    els.horizonTab.classList.toggle('active', !globeActive);
    els.globeTab.setAttribute('aria-selected', String(globeActive));
    els.horizonTab.setAttribute('aria-selected', String(!globeActive));
    els.globeView.classList.toggle('active', globeActive);
    els.horizonView.classList.toggle('active', !globeActive);

    window.setTimeout(() => {
      resizeGlobe();
      resizeCanvases();
      resizeShadowRenderer();
      updateAll();
    }, 40);
  }

  function initGlobe() {
    globe = Globe()(els.globeContainer)
      .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundColor('rgba(0,0,0,0)')
      .pointLat('lat')
      .pointLng('lng')
      .pointAltitude(0.025)
      .pointRadius(0.45)
      .pointColor(() => '#f6b940')
      .pointLabel(d => `Selected site<br>Lat: ${d.lat.toFixed(2)}<br>Lon: ${d.lng.toFixed(2)}`)
      .onGlobeClick(({ lat, lng }) => {
        state.lat = clamp(lat, -89.9, 89.9);
        state.lon = normalizeLon(lng);
        state.selectedZone = getZoneForLocation(state.lat, state.lon);
        syncLocationInputs();
        markActiveLocationPreset();
        updateAll();
      });

    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.28;
    resizeGlobe();
  }

  function initShadowScene() {
    const canvas = els.shadowCanvas;
    shadow.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    shadow.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    shadow.renderer.shadowMap.enabled = true;
    shadow.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    shadow.scene = new THREE.Scene();
    shadow.scene.background = new THREE.Color(0x07131a);

    shadow.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
    shadow.camera.position.set(6, 5, 8);
    shadow.camera.lookAt(0, 0.9, 0);

    shadow.ambient = new THREE.HemisphereLight(0xe3f4ff, 0x324c2d, 0.55);
    shadow.scene.add(shadow.ambient);

    shadow.sunLight = new THREE.DirectionalLight(0xffefbc, 2.4);
    shadow.sunLight.castShadow = true;
    shadow.sunLight.shadow.mapSize.width = 2048;
    shadow.sunLight.shadow.mapSize.height = 2048;
    shadow.sunLight.shadow.camera.left = -9;
    shadow.sunLight.shadow.camera.right = 9;
    shadow.sunLight.shadow.camera.top = 9;
    shadow.sunLight.shadow.camera.bottom = -9;
    shadow.sunLight.shadow.camera.near = 0.1;
    shadow.sunLight.shadow.camera.far = 40;
    shadow.sunLight.shadow.bias = -0.00025;

    shadow.target = new THREE.Object3D();
    shadow.target.position.set(0, 0, 0);
    shadow.scene.add(shadow.target);
    shadow.sunLight.target = shadow.target;
    shadow.scene.add(shadow.sunLight);

    const groundGeo = new THREE.PlaneGeometry(28, 28);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x31462f,
      roughness: 0.95,
      metalness: 0
    });
    shadow.ground = new THREE.Mesh(groundGeo, groundMat);
    shadow.ground.rotation.x = -Math.PI / 2;
    shadow.ground.receiveShadow = true;
    shadow.scene.add(shadow.ground);

    const grid = new THREE.GridHelper(28, 28, 0xa9be8b, 0x57734b);
    grid.material.opacity = 0.34;
    grid.material.transparent = true;
    shadow.scene.add(grid);

    addCompassMarkers();
    rebuildShadowObject();
    resizeShadowRenderer();
  }

  function addCompassMarkers() {
    [
      { label: 'N', x: 0, z: -6.5 },
      { label: 'E', x: 6.5, z: 0 },
      { label: 'S', x: 0, z: 6.5 },
      { label: 'W', x: -6.5, z: 0 }
    ].forEach(marker => {
      const sprite = makeTextSprite(marker.label);
      sprite.position.set(marker.x, 0.05, marker.z);
      sprite.scale.set(0.9, 0.45, 1);
      shadow.scene.add(sprite);
    });
  }

  function makeTextSprite(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 64px Inter, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(text, 128, 70);
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    return new THREE.Sprite(material);
  }

  function rebuildShadowObject() {
    if (!shadow.scene) return;

    if (shadow.objectGroup) {
      shadow.scene.remove(shadow.objectGroup);
      shadow.objectGroup.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
    }

    const h = state.objectHeight;
    const group = new THREE.Group();
    const sunMat = new THREE.MeshStandardMaterial({ color: 0xf6b940, roughness: 0.48, metalness: 0.04 });
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x2f7791, roughness: 0.55, metalness: 0.02 });

    if (state.objectType === 'pole') {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, h, 24), sunMat);
      pole.position.y = h / 2;
      pole.castShadow = true;
      pole.receiveShadow = true;
      group.add(pole);

      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 16), sunMat);
      cap.position.y = h + 0.06;
      cap.castShadow = true;
      group.add(cap);
    }

    if (state.objectType === 'cube') {
      const cube = new THREE.Mesh(new THREE.BoxGeometry(h * 0.65, h, h * 0.65), sunMat);
      cube.position.y = h / 2;
      cube.castShadow = true;
      cube.receiveShadow = true;
      group.add(cube);
    }

    if (state.objectType === 'person') {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.13, h * 0.18, h * 0.55, 24), waterMat);
      body.position.y = h * 0.44;
      body.castShadow = true;
      group.add(body);

      const head = new THREE.Mesh(new THREE.SphereGeometry(h * 0.13, 24, 16), sunMat);
      head.position.y = h * 0.78;
      head.castShadow = true;
      group.add(head);

      const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.035, h * 0.04, h * 0.42, 16), waterMat);
      leg1.position.set(-h * 0.06, h * 0.19, 0);
      leg1.castShadow = true;
      group.add(leg1);

      const leg2 = leg1.clone();
      leg2.position.x = h * 0.06;
      group.add(leg2);
    }

    if (state.objectType === 'tower') {
      const base = new THREE.Mesh(new THREE.BoxGeometry(h * 0.38, h * 0.12, h * 0.38), waterMat);
      base.position.y = h * 0.06;
      base.castShadow = true;
      group.add(base);

      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.09, h * 0.14, h * 0.78, 24), sunMat);
      shaft.position.y = h * 0.51;
      shaft.castShadow = true;
      group.add(shaft);

      const top = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.23, h * 0.18, h * 0.13, 24), waterMat);
      top.position.y = h * 0.95;
      top.castShadow = true;
      group.add(top);
    }

    shadow.objectGroup = group;
    shadow.scene.add(group);
  }

  function updateAll() {
    updateControlText();
    updateGlobeMarker();
    drawHorizon();
    updateShadowScene();
    updateReadout();
  }

  function updateControlText() {
    const localDateTime = getSelectedLocalDateTime();
    const dateTime = getSelectedJSDate();
    const sun = getSunPosition(dateTime, state.lat, state.lon);
    els.timeLabel.textContent = formatTime(dateTime);
    els.zoneLabel.textContent = state.selectedZone;
    els.statusText.textContent = `Lat ${state.lat.toFixed(2)}, Lon ${state.lon.toFixed(2)} | ${formatDateShortISO(state.localDateISO)} ${formatTime(dateTime)} ${state.selectedZone}`;
    els.sunSummary.textContent = `Sun alt ${sun.altitudeDeg.toFixed(1)} deg | az ${sun.compassDeg.toFixed(0)} deg`;
    els.diagnosticLocalTime.textContent = localDateTime.toFormat('MMM d, yyyy h:mm a');
    els.diagnosticUTC.textContent = dateTime.toISOString();
    els.diagnosticZone.textContent = state.selectedZone;
  }

  function updateGlobeMarker() {
    if (!globe) return;
    globe.pointsData([{ lat: state.lat, lng: state.lon }]);
  }

  function lerpColor(hex1, hex2, t) {
    const parse = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
    const [r1,g1,b1] = parse(hex1), [r2,g2,b2] = parse(hex2);
    return `rgb(${Math.round(r1+(r2-r1)*t)},${Math.round(g1+(g2-g1)*t)},${Math.round(b1+(b2-b1)*t)})`;
  }

  function getStarPositions(w, skyH) {
    if (_starCache && _starCache.w === w && _starCache.h === skyH) return _starCache.stars;
    let seed = 4321;
    const rng = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0xffffffff; };
    const stars = Array.from({ length: 140 }, () => ({
      x: rng() * w, y: rng() * skyH, r: 0.4 + rng() * 1.3, b: 0.4 + rng() * 0.6
    }));
    _starCache = { w, h: skyH, stars };
    return stars;
  }

  function drawStars(ctx, w, horizonY, sunAlt) {
    const opacity = clamp((-sunAlt - 2) / 10, 0, 1);
    if (opacity <= 0) return;
    ctx.save();
    getStarPositions(w, horizonY).forEach(s => {
      ctx.globalAlpha = opacity * s.b;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  }

  function drawSkyGradient(ctx, w, horizonY, sunAlt) {
    const a = sunAlt;
    let zenith, nearH;
    if (a <= -12) {
      zenith = '#020810'; nearH = '#03101e';
    } else if (a <= -4) {
      const t = (a + 12) / 8;
      zenith = lerpColor('#020810', '#0c2040', t);
      nearH  = lerpColor('#03101e', '#0c2040', t);
    } else if (a <= 0) {
      const t = (a + 4) / 4;
      zenith = lerpColor('#0c2040', '#0e1a4a', t);
      nearH  = lerpColor('#0c2040', '#e05518', t);
    } else if (a <= 8) {
      const t = a / 8;
      zenith = lerpColor('#0e1a4a', '#154360', t);
      nearH  = lerpColor('#e05518', '#f4c57d', t);
    } else if (a <= 30) {
      const t = (a - 8) / 22;
      zenith = '#154360';
      nearH  = lerpColor('#f4c57d', '#a8d8ee', t);
    } else {
      const t = clamp((a - 30) / 30, 0, 1);
      zenith = lerpColor('#154360', '#0c2e52', t);
      nearH  = '#a8d8ee';
    }
    const grad = ctx.createLinearGradient(0, 0, 0, horizonY);
    grad.addColorStop(0, zenith);
    grad.addColorStop(0.65, nearH);
    grad.addColorStop(1, nearH);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, horizonY);
  }

  function drawHorizonGlow(ctx, w, horizonY, sunX, sunAlt) {
    if (sunAlt < -15 || sunAlt > 22) return;
    const t = sunAlt <= 0
      ? clamp((sunAlt + 15) / 15, 0, 1)
      : clamp(1 - sunAlt / 22, 0, 1);
    const alpha = 0.55 * t;
    if (alpha <= 0) return;
    const grd = ctx.createRadialGradient(sunX, horizonY, 0, sunX, horizonY, w * 0.55);
    grd.addColorStop(0, `rgba(230,100,30,${alpha})`);
    grd.addColorStop(0.4, `rgba(200,60,10,${alpha * 0.4})`);
    grd.addColorStop(1, 'rgba(200,60,10,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, horizonY * 0.4, w, horizonY * 0.65);
  }

  function drawSunGlow(ctx, pos, altitudeDeg) {
    if (altitudeDeg < -8) return;
    const alpha = clamp((altitudeDeg + 8) / 12, 0, 1) * 0.45;
    const grd = ctx.createRadialGradient(pos.x, pos.y, 6, pos.x, pos.y, 52);
    grd.addColorStop(0, `rgba(255,230,100,${alpha})`);
    grd.addColorStop(0.5, `rgba(255,180,40,${alpha * 0.5})`);
    grd.addColorStop(1, 'rgba(255,150,0,0)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(pos.x, pos.y, 52, 0, Math.PI * 2); ctx.fill();
  }

  function drawHorizon() {
    const canvas = els.horizonCanvas;
    const ctx = canvas.getContext('2d');
    resizeCanvasToDisplaySize(canvas);

    const w = canvas.width;
    const h = canvas.height;
    const horizonY = h * 0.72;
    const skyTop = h * 0.08;
    const skyHeight = horizonY - skyTop;

    const dateTime = getSelectedJSDate();
    const sun  = getSunPosition(dateTime, state.lat, state.lon);
    const moon = getMoonPosition(dateTime, state.lat, state.lon);
    const sunPos = skyToCanvas(sun.compassDeg, sun.altitudeDeg, w, horizonY, skyTop, skyHeight);

    ctx.clearRect(0, 0, w, h);

    drawSkyGradient(ctx, w, horizonY, sun.altitudeDeg);
    drawHorizonGlow(ctx, w, horizonY, sunPos.x, sun.altitudeDeg);

    const groundGrad = ctx.createLinearGradient(0, horizonY, 0, h);
    groundGrad.addColorStop(0, '#3a5a30');
    groundGrad.addColorStop(1, '#1e3318');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, horizonY, w, h - horizonY);

    drawStars(ctx, w, horizonY, sun.altitudeDeg);

    drawAltitudeGrid(ctx, w, horizonY, skyTop, skyHeight);
    drawDirectionGrid(ctx, w, h, horizonY);

    if (state.compareSeasons) {
      Object.values(seasons).forEach(season => {
        const isoDate = seasonISO(season, getSelectedYear());
        const path = samplePath('sun', isoDate, state.selectedZone, state.lat, state.lon, 10);
        drawPath(ctx, path, w, horizonY, skyTop, skyHeight, season.color, 2.2, 0.9, season.name);
      });
    } else {
      const sunPath = samplePath('sun', state.localDateISO, state.selectedZone, state.lat, state.lon, 5);
      drawPath(ctx, sunPath, w, horizonY, skyTop, skyHeight, '#f6b940', 3.2, 1, 'Sun path');
    }

    if (state.showMoon) {
      const moonPath = samplePath('moon', state.localDateISO, state.selectedZone, state.lat, state.lon, 10);
      drawPath(ctx, moonPath, w, horizonY, skyTop, skyHeight, '#d9e7f8', 2.2, 0.86, 'Moon path');
    }

    drawSunGlow(ctx, sunPos, sun.altitudeDeg);

    drawSkyObject(ctx, sun.compassDeg, sun.altitudeDeg, w, horizonY, skyTop, skyHeight, '#ffdf73', 'S', 'Sun');
    if (state.showMoon) {
      drawSkyObject(ctx, moon.compassDeg, moon.altitudeDeg, w, horizonY, skyTop, skyHeight, '#edf5ff', 'M', 'Moon');
    }

    drawRiseSetMarkers(ctx, w, horizonY, skyTop, skyHeight);
    drawShadowDirection(ctx, sun, w, h, horizonY);
    drawHorizonTitle(ctx, w);
  }

  function drawAltitudeGrid(ctx, w, horizonY, skyTop, skyHeight) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.fillStyle = 'rgba(255,255,255,0.68)';
    ctx.font = '12px Inter, Arial';

    [0, 15, 30, 45, 60, 75, 90].forEach(alt => {
      const y = horizonY - (alt / 90) * skyHeight;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      if (alt > 0 && alt < 90) ctx.fillText(`${alt} deg`, 8, y - 4);
    });

    ctx.restore();
  }

  function drawDirectionGrid(ctx, w, h, horizonY) {
    const dirs = [
      { label: 'N', deg: 0 },
      { label: 'E', deg: 90 },
      { label: 'S', deg: 180 },
      { label: 'W', deg: 270 },
      { label: 'N', deg: 360 }
    ];

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 15px Inter, Arial';
    ctx.textAlign = 'center';

    dirs.forEach(dir => {
      const x = (dir.deg / 360) * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
      ctx.fillText(dir.label, x, horizonY + 25);
    });

    for (let deg = 30; deg < 360; deg += 30) {
      const x = (deg / 360) * w;
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(19,58,36,0.95)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(w, horizonY);
    ctx.stroke();
    ctx.restore();
  }

  function drawPath(ctx, path, w, horizonY, skyTop, skyHeight, color, width, alpha, label) {
    const visible = path.filter(point => state.showBelow || point.altitudeDeg >= 0);
    if (visible.length < 2) return;

    ctx.save();
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    splitWrappedPath(visible).forEach(segment => {
      if (segment.length < 2) return;
      ctx.beginPath();
      segment.forEach((point, index) => {
        const pos = skyToCanvas(point.compassDeg, point.altitudeDeg, w, horizonY, skyTop, skyHeight);
        if (index === 0) ctx.moveTo(pos.x, pos.y);
        else ctx.lineTo(pos.x, pos.y);
      });
      ctx.stroke();
    });

    if (state.showLabels) {
      const highPoint = path.reduce((best, point) => point.altitudeDeg > best.altitudeDeg ? point : best, path[0]);
      const pos = skyToCanvas(highPoint.compassDeg, highPoint.altitudeDeg, w, horizonY, skyTop, skyHeight);
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.font = 'bold 12px Inter, Arial';
      ctx.fillText(label, clamp(pos.x + 8, 8, w - 130), clamp(pos.y - 8, 22, horizonY - 8));
    }

    ctx.restore();
  }

  function drawSkyObject(ctx, compassDeg, altitudeDeg, w, horizonY, skyTop, skyHeight, color, symbol, label) {
    if (!state.showBelow && altitudeDeg < 0) return;
    const pos = skyToCanvas(compassDeg, altitudeDeg, w, horizonY, skyTop, skyHeight);

    ctx.save();
    ctx.globalAlpha = altitudeDeg >= 0 ? 1 : 0.36;
    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, label === 'Sun' ? 14 : 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#07131a';
    ctx.font = 'bold 12px Inter, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, pos.x, pos.y + 0.5);

    if (state.showLabels) {
      const labelY = clamp(pos.y - 24, 24, horizonY - 8);
      ctx.fillStyle = 'rgba(255,255,255,0.94)';
      ctx.font = '12px Inter, Arial';
      ctx.fillText(`${label}: alt ${altitudeDeg.toFixed(1)}, az ${compassDeg.toFixed(0)}`, clamp(pos.x, 88, w - 88), labelY);
    }

    ctx.restore();
  }

  function drawRiseSetMarkers(ctx, w, horizonY, skyTop, skyHeight) {
    const times = SunCalc.getTimes(getSelectedJSDate(720), state.lat, state.lon);
    const markers = [
      { label: 'Sunrise', time: times.sunrise, color: '#fff0a6', kind: 'sun' },
      { label: 'Sunset', time: times.sunset, color: '#ffb36c', kind: 'sun' }
    ];

    if (state.showMoon) {
      const moonTimes = getMoonTimesForLocalDate(state.localDateISO, state.selectedZone, state.lat, state.lon);
      if (moonTimes.rise) markers.push({ label: 'Moonrise', time: moonTimes.rise, color: '#dce9ff', kind: 'moon' });
      if (moonTimes.set) markers.push({ label: 'Moonset', time: moonTimes.set, color: '#9fbfff', kind: 'moon' });
    }

    ctx.save();
    markers.forEach(marker => {
      if (!validDate(marker.time)) return;
      const pos = marker.kind === 'moon'
        ? getMoonPosition(marker.time, state.lat, state.lon)
        : getSunPosition(marker.time, state.lat, state.lon);
      const point = skyToCanvas(pos.compassDeg, 0, w, horizonY, skyTop, skyHeight);

      ctx.fillStyle = marker.color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      ctx.fill();

      if (state.showLabels) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = '11px Inter, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(marker.label, clamp(point.x, 45, w - 45), horizonY - 12);
        ctx.fillText(formatTime(marker.time), clamp(point.x, 45, w - 45), horizonY + 43);
      }
    });
    ctx.restore();
  }

  function drawShadowDirection(ctx, sun, w, h, horizonY) {
    if (sun.altitudeDeg <= 0) return;

    const bearing = (sun.compassDeg + 180) % 360;
    const origin = { x: w - 86, y: h - 70 };
    const length = 42;
    const angle = degToRad(bearing - 90);
    const end = {
      x: origin.x + Math.cos(angle) * length,
      y: origin.y + Math.sin(angle) * length
    };

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 11px Inter, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('shadow', origin.x, origin.y + 22);
    ctx.restore();
  }

  function drawHorizonTitle(ctx, w) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.86)';
    ctx.font = 'bold 16px Inter, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Surface view at ${state.lat.toFixed(2)}, ${state.lon.toFixed(2)} - ${formatDateShortISO(state.localDateISO)}`, w / 2, 28);
    ctx.restore();
  }

  function updateShadowScene() {
    if (!shadow.sunLight) return;

    const dateTime = getSelectedJSDate();
    const sun = getSunPosition(dateTime, state.lat, state.lon);
    const altRad = degToRad(sun.altitudeDeg);
    const azRad = degToRad(sun.compassDeg);
    const dist = 12;
    const horizontal = Math.max(0.05, Math.cos(altRad));
    const east = Math.sin(azRad) * horizontal;
    const north = Math.cos(azRad) * horizontal;
    const up = Math.sin(altRad);

    // Scene convention: x = east, z = south. Compass north maps to negative z.
    shadow.sunLight.position.set(east * dist, Math.max(0.15, up * dist), -north * dist);
    shadow.sunLight.target.position.set(0, 0, 0);
    shadow.sunLight.target.updateMatrixWorld();

    const visible = sun.altitudeDeg > 0;
    shadow.sunLight.intensity = visible ? 2.6 : 0.05;
    shadow.ambient.intensity = visible ? 0.52 : 0.18;

    const shadowBearing = (sun.compassDeg + 180) % 360;
    const shadowLength = visible ? state.objectHeight / Math.tan(altRad) : Infinity;
    const lengthText = visible ? formatShadowLength(shadowLength) : 'No direct sunlight';
    const warning = visible ? '' : '<br><span class="warning">Sun is below the horizon.</span>';

    els.shadowInfo.innerHTML = `
      <strong>Sun altitude:</strong> ${sun.altitudeDeg.toFixed(1)} deg<br>
      <strong>Sun azimuth:</strong> ${sun.compassDeg.toFixed(0)} deg compass<br>
      <strong>Shadow direction:</strong> ${shadowBearing.toFixed(0)} deg compass<br>
      <strong>Estimated length:</strong> ${lengthText}${warning}
    `;
  }

  function updateReadout() {
    const dateTime = getSelectedJSDate();
    const sun = getSunPosition(dateTime, state.lat, state.lon);
    const moon = getMoonPosition(dateTime, state.lat, state.lon);
    const times = SunCalc.getTimes(getSelectedJSDate(720), state.lat, state.lon);
    const moonTimes = getMoonTimesForLocalDate(state.localDateISO, state.selectedZone, state.lat, state.lon);
    const moonIllum = SunCalc.getMoonIllumination(dateTime);
    const dayLength = validDate(times.sunrise) && validDate(times.sunset)
      ? msToHoursMinutes(times.sunset - times.sunrise)
      : 'Polar day/night';

    const values = [
      ['Sun Altitude', `${sun.altitudeDeg.toFixed(1)} deg`],
      ['Sun Azimuth', `${sun.compassDeg.toFixed(0)} deg`],
      ['Sunrise', validDate(times.sunrise) ? formatTime(times.sunrise) : 'None today'],
      ['Sunset', validDate(times.sunset) ? formatTime(times.sunset) : 'None today'],
      ['Day Length', dayLength],
      ['Solar Noon', validDate(times.solarNoon) ? formatTime(times.solarNoon) : '--'],
      ['Moon Altitude', `${moon.altitudeDeg.toFixed(1)} deg`],
      ['Moon Azimuth', `${moon.compassDeg.toFixed(0)} deg`],
      ['Moonrise', moonTimes.alwaysUp ? 'Always up' : moonTimes.rise ? formatTime(moonTimes.rise) : 'None today'],
      ['Moonset', moonTimes.alwaysDown ? 'Always down' : moonTimes.set ? formatTime(moonTimes.set) : 'None today'],
      ['Moon Illumination', `${Math.round(moonIllum.fraction * 100)}%`],
      ['Moon Phase', phaseName(moonIllum.phase)]
    ];

    els.readout.innerHTML = values.map(([name, value]) => `
      <div class="metric">
        <div class="name">${name}</div>
        <div class="value">${value}</div>
      </div>
    `).join('');
  }

  function animationLoop() {
    if (shadow.renderer && shadow.scene && shadow.camera) {
      if (shadow.objectGroup) shadow.objectGroup.rotation.y += 0.002;
      shadow.renderer.render(shadow.scene, shadow.camera);
    }
    requestAnimationFrame(animationLoop);
  }

  function togglePlay() {
    state.playing = !state.playing;
    els.playBtn.classList.toggle('active', state.playing);
    els.playBtn.textContent = state.playing ? 'Pause Day' : 'Play Day';

    if (state.playing) {
      playTimer = window.setInterval(() => {
        state.minutes = (state.minutes + 10) % 1440;
        els.timeSlider.value = state.minutes;
        updateAll();
      }, 90);
    } else {
      window.clearInterval(playTimer);
      playTimer = null;
    }
  }

  function samplePath(kind, isoDate, zone, lat, lon, stepMinutes) {
    const points = [];
    for (let minutes = 0; minutes <= 1440; minutes += stepMinutes) {
      const dt = getJSDateForISODateAndMinutes(isoDate, minutes, zone);
      const pos = kind === 'moon' ? getMoonPosition(dt, lat, lon) : getSunPosition(dt, lat, lon);
      points.push({
        time: dt,
        minutes,
        altitudeDeg: pos.altitudeDeg,
        compassDeg: pos.compassDeg,
        visible: pos.altitudeDeg >= 0
      });
    }
    return points;
  }

  function getMoonTimesForLocalDate(isoDate, zone, lat, lon) {
    const stepMinutes = 10;
    let previousMinute = 0;
    let previousAltitude = getMoonHorizonOffset(isoDate, zone, lat, lon, previousMinute);
    let rise = null;
    let set = null;

    for (let minutes = stepMinutes; minutes <= 1440; minutes += stepMinutes) {
      const altitude = getMoonHorizonOffset(isoDate, zone, lat, lon, minutes);

      if (!rise && previousAltitude < 0 && altitude >= 0) {
        rise = refineMoonCrossing(isoDate, zone, lat, lon, previousMinute, minutes, true);
      }

      if (!set && previousAltitude >= 0 && altitude < 0) {
        set = refineMoonCrossing(isoDate, zone, lat, lon, previousMinute, minutes, false);
      }

      previousMinute = minutes;
      previousAltitude = altitude;
    }

    const noonAltitude = getMoonHorizonOffset(isoDate, zone, lat, lon, 720);

    return {
      rise,
      set,
      alwaysUp: !rise && !set && noonAltitude > 0,
      alwaysDown: !rise && !set && noonAltitude <= 0
    };
  }

  function refineMoonCrossing(isoDate, zone, lat, lon, startMinute, endMinute, rising) {
    let low = startMinute;
    let high = endMinute;

    for (let i = 0; i < 12; i += 1) {
      const middle = (low + high) / 2;
      const altitude = getMoonHorizonOffset(isoDate, zone, lat, lon, middle);

      if (rising ? altitude >= 0 : altitude < 0) {
        high = middle;
      } else {
        low = middle;
      }
    }

    return getJSDateForISODateAndMinutes(isoDate, (low + high) / 2, zone);
  }

  function getMoonHorizonOffset(isoDate, zone, lat, lon, minutes) {
    const date = getJSDateForISODateAndMinutes(isoDate, minutes, zone);
    return getMoonPosition(date, lat, lon).altitudeDeg - 0.133;
  }

  function splitWrappedPath(path) {
    const segments = [[]];
    for (let i = 0; i < path.length; i += 1) {
      const point = path[i];
      const previous = path[i - 1];
      if (previous && Math.abs(point.compassDeg - previous.compassDeg) > 180) {
        segments.push([]);
      }
      segments[segments.length - 1].push(point);
    }
    return segments;
  }

  function getSunPosition(dateTime, lat, lon) {
    const pos = SunCalc.getPosition(dateTime, lat, lon);
    return {
      altitudeDeg: radToDeg(pos.altitude),
      compassDeg: suncalcAzimuthToCompass(pos.azimuth)
    };
  }

  function getMoonPosition(dateTime, lat, lon) {
    const pos = SunCalc.getMoonPosition(dateTime, lat, lon);
    return {
      altitudeDeg: radToDeg(pos.altitude),
      compassDeg: suncalcAzimuthToCompass(pos.azimuth),
      distance: pos.distance
    };
  }

  function skyToCanvas(compassDeg, altitudeDeg, w, horizonY, skyTop, skyHeight) {
    const x = (compassDeg / 360) * w;
    const clampedAltitude = clamp(altitudeDeg, -18, 90);
    let y;

    if (clampedAltitude >= 0) {
      y = horizonY - (clampedAltitude / 90) * skyHeight;
    } else {
      y = horizonY + Math.abs(clampedAltitude / 18) * (skyHeight * 0.18);
    }

    return { x, y };
  }

  function resizeCanvases() {
    resizeCanvasToDisplaySize(els.horizonCanvas);
    resizeCanvasToDisplaySize(els.shadowCanvas);
  }

  function resizeCanvasToDisplaySize(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  function resizeShadowRenderer() {
    if (!shadow.renderer || !shadow.camera) return;
    const rect = els.shadowCanvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    shadow.renderer.setSize(width, height, false);
    shadow.camera.aspect = width / height;
    shadow.camera.updateProjectionMatrix();
  }

  function resizeGlobe() {
    if (!globe) return;
    const rect = els.globeContainer.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      globe.width(rect.width).height(rect.height);
    }
  }

  function getZoneForLocation(lat, lon) {
    try {
      return tzLookup(lat, lon);
    } catch (error) {
      const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return browserZone || 'UTC';
    }
  }

  function getSelectedLocalDateTime(minutes = state.minutes) {
    return getLocalDateTimeForISODateAndMinutes(state.localDateISO, minutes, state.selectedZone);
  }

  function getSelectedJSDate(minutes = state.minutes) {
    return getSelectedLocalDateTime(minutes).toJSDate();
  }

  function getLocalDateTimeAtMinutes(date, minutes, zone) {
    const wholeMinutes = Math.floor(minutes);
    const fractionalMinutes = minutes - wholeMinutes;

    if (wholeMinutes >= 1440) {
      return DateTime.fromObject({
        year: date.year,
        month: date.month,
        day: date.day,
        hour: 0,
        minute: 0
      }, { zone }).plus({ days: 1, minutes: wholeMinutes - 1440 + fractionalMinutes });
    }

    return DateTime.fromObject({
      year: date.year,
      month: date.month,
      day: date.day,
      hour: Math.floor(wholeMinutes / 60),
      minute: wholeMinutes % 60
    }, { zone }).plus({ minutes: fractionalMinutes });
  }

  function getJSDateAtMinutes(date, minutes) {
    return getLocalDateTimeAtMinutes(date, minutes, state.selectedZone).toJSDate();
  }

  function getJSDateForISODateAndMinutes(isoDate, minutes, zone) {
    return getLocalDateTimeForISODateAndMinutes(isoDate, minutes, zone).toJSDate();
  }

  function getLocalDateTimeForISODateAndMinutes(isoDate, minutes, zone) {
    return getLocalDateTimeAtMinutes(parseISODateParts(isoDate), minutes, zone);
  }

  function parseISODateParts(isoDate) {
    const [year, month, day] = isoDate.split('-').map(Number);
    return { year, month, day };
  }

  function getSelectedYear() {
    return parseISODateParts(state.localDateISO).year;
  }

  function seasonISO(season, year) {
    const month = String(season.month + 1).padStart(2, '0');
    const day = String(season.day).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function normalizeDateInput(value, fallback) {
    if (!value) return fallback;
    const parts = value.split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return fallback;

    const candidate = DateTime.fromObject({
      year: parts[0],
      month: parts[1],
      day: parts[2]
    }, { zone: state.selectedZone });

    return candidate.isValid ? candidate.toISODate() : fallback;
  }

  function formatTime(date) {
    if (!validDate(date)) return '--';
    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: state.selectedZone
    });
  }

  function formatDateShortISO(isoDate) {
    const localDate = DateTime.fromISO(isoDate, { zone: state.selectedZone });
    return localDate.toLocaleString({ month: 'short', day: 'numeric', year: 'numeric' });
  }

  function msToHoursMinutes(ms) {
    const total = Math.round(ms / 60000);
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${h}h ${m}m`;
  }

  function formatShadowLength(length) {
    if (!Number.isFinite(length)) return 'No direct sunlight';
    if (length > 100) return '> 100 m';
    return `${length.toFixed(2)} m`;
  }

  function phaseName(phase) {
    if (phase < 0.03 || phase > 0.97) return 'New Moon';
    if (phase < 0.22) return 'Waxing Crescent';
    if (phase < 0.28) return 'First Quarter';
    if (phase < 0.47) return 'Waxing Gibbous';
    if (phase < 0.53) return 'Full Moon';
    if (phase < 0.72) return 'Waning Gibbous';
    if (phase < 0.78) return 'Last Quarter';
    return 'Waning Crescent';
  }

  function suncalcAzimuthToCompass(azimuthRad) {
    return (radToDeg(azimuthRad) + 180 + 360) % 360;
  }

  function radToDeg(rad) {
    return rad * 180 / Math.PI;
  }

  function degToRad(deg) {
    return deg * Math.PI / 180;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizeLon(lon) {
    return ((((lon + 180) % 360) + 360) % 360) - 180;
  }

  function validDate(date) {
    return date instanceof Date && !Number.isNaN(date.getTime());
  }
})();
