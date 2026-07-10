/* ====================================================================== */
/* sim.js – All-in-one: Delivery Mystery + Quiz Engine + Mode Manager     */
/*          + App Bootstrap / Walkthrough                                 */
/* ====================================================================== */

/* ====================================================================== */
/* SECTION 1 – DELIVERY MYSTERY (Practice Mode)                           */
/* ====================================================================== */
var deliveryMystery = (function() {
    'use strict';

    var HOUSES = [
      { num: 1, x: 10, color: 'bg-red-400' },
      { num: 2, x: 20, color: 'bg-green-400' },
      { num: 3, x: 30, color: 'bg-blue-400' },
      { num: 4, x: 40, color: 'bg-yellow-400' },
      { num: 5, x: 50, color: 'bg-purple-400' },
      { num: 6, x: 60, color: 'bg-orange-400' }
    ];

    var SCENARIOS = [
      { id:0, duration:11, deliveryHouse:3,
        title:'Case 1: The Simple Stop',
        mission:'Find the only stop that lasts long enough to count as a delivery.',
        clues:['Look for a flat section on the position graph.', 'A delivery means the truck is stopped for more than 2 seconds.', 'Match the stop position to a house number.'],
        successExplanation:'The truck stayed at 30 m from t = 3 s to t = 7 s, so House 3 got the package.',
        wrongExplanation:'Check which stop lasts longer than 2 seconds. A quick pause does not count as a delivery.',
        keyframes:[{t:0,x:0},{t:3,x:30},{t:7,x:30},{t:11,x:70}] },
      { id:1, duration:14, deliveryHouse:2,
        title:'Case 2: The Turnaround',
        mission:'The truck reverses direction in this case. Decide which stop is the real delivery.',
        clues:['One stop happens after the truck turns around.', 'Use both direction and stop length.', 'The delivery house is where velocity stays at 0 long enough.'],
        successExplanation:'House 2 is correct because the truck stops there from t = 6 s to t = 10 s before heading back to the start.',
        wrongExplanation:'Follow the truck through the turnaround. The delivery is the stop that lasts, not just the farthest point reached.',
        keyframes:[{t:0,x:0},{t:4,x:40},{t:6,x:20},{t:10,x:20},{t:14,x:0}] },
      { id:2, duration:14, deliveryHouse:5,
        title:'Case 3: The Fake Out',
        mission:'The truck makes a short fake stop before the real delivery. Separate the decoy from the real drop-off.',
        clues:['There are two stops.', 'Only one stop lasts more than 2 seconds.', 'Use stop duration, not first impression.'],
        successExplanation:'House 5 is correct because the truck only pauses briefly at 30 m, but stays at 50 m from t = 6 s to t = 10 s.',
        wrongExplanation:'The first stop is a decoy. Compare the lengths of the flat sections before choosing a house.',
        keyframes:[{t:0,x:0},{t:3,x:30},{t:4,x:30},{t:6,x:50},{t:10,x:50},{t:14,x:70}] },
      { id:3, duration:16, deliveryHouse:1, hideVelocity:true,
        title:'Case 4: Broken Speedometer',
        mission:'The velocity graph is gone, so solve the delivery using only the position graph.',
        clues:['Flat horizontal segments mean the truck is stopped.', 'The position graph alone gives both stop location and stop time.', 'Ignore how steep the line is and focus on the flat interval.'],
        successExplanation:'House 1 is correct because the position graph stays flat at 10 m from t = 6 s to t = 10 s.',
        wrongExplanation:'You do not need the velocity graph here. Find the long flat section on the position graph and match its y-value to a house.',
        keyframes:[{t:0,x:0},{t:3,x:30},{t:4,x:30},{t:6,x:10},{t:10,x:10},{t:16,x:70}] },
      { id:4, duration:17, deliveryHouse:6, hidePosition:true,
        title:'Case 5: Broken GPS',
        mission:'The position graph is missing. Use velocity and the starting point to infer the delivery location.',
        clues:['The truck starts at x = 0 m.', 'While velocity is 0, position stays constant.', 'Add the signed areas under the velocity graph to track location.'],
        successExplanation:'House 6 is correct because the truck reaches 60 m, stops there, and then later drives back toward the start.',
        wrongExplanation:'Rebuild the truck’s position from the velocity graph. Watch when the graph sits at 0 and what position the truck has reached by then.',
        keyframes:[{t:0,x:0},{t:4,x:40},{t:5,x:40},{t:7,x:60},{t:11,x:60},{t:17,x:0}] },
      { id:5, duration:15, deliveryHouse:3, porchPirateMode:true, guiltySuspect:'Suspect B',
        title:'Case 6: Porch Pirate',
        mission:'First find the delivery house, then decide which suspect appears after the package is dropped.',
        clues:['The package is delivered at House 3.', 'The guilty suspect is the one who reaches the house after the drop.', 'Timing matters more than who passes by first.'],
        successExplanation:'Suspect B is guilty because they arrive after the package has been left at House 3.',
        wrongExplanation:'Watch the timing carefully. The thief must appear after the drop, not before it.',
        dropTime:5, theftTime:9,
        keyframes:[{t:0,x:0},{t:4,x:30},{t:7,x:30},{t:11,x:70}],
        extraEntities:[
          { id:'A', name:'Suspect A', color:'#10b981',
            keyframes:[{t:0,x:10},{t:5,x:60}] },
          { id:'B', name:'Suspect B', color:'#a855f7',
            keyframes:[{t:5,x:70},{t:12,x:0}] }
        ] },
      { id:6, duration:16, deliveryHouse:4, hidePosition:true, useVelocityKeyframes:true,
        title:'Case 7: Accelerating Truck',
        mission:'This time the velocity changes smoothly. Use the velocity graph and area reasoning to locate the delivery.',
        clues:['The truck starts at x = 0 m.', 'Area above the axis adds displacement; area below subtracts it.', 'A delivery still happens during the long stop where velocity is 0.'],
        successExplanation:'House 4 is correct because the accumulated displacement reaches 40 m, then the truck remains stopped there before reversing.',
        wrongExplanation:'Use the area under the velocity graph to track position. The delivery happens at the long zero-velocity interval.',
        keyframes:[{t:0,v:0},{t:2,v:10},{t:4,v:10},{t:6,v:0},{t:10,v:0},{t:12,v:-10},{t:14,v:-10},{t:16,v:0}] },
      { id:7, duration:8, graphMatchMode:true, hidePosition:true, hideVelocity:true,
        title:'Case 8: Match the Graph',
        mission:'Watch the truck move, then choose the position-time graph that matches its motion.',
        clues:['Upward slope means moving forward.', 'A flat section means stopped.', 'Match the order of motion changes, not just the starting point.'],
        successExplanation:'Graph C matches the animation: the truck moves forward, stops, then moves forward again.',
        wrongExplanation:'Compare the story of the motion. The correct graph rises, becomes flat, and then rises again.',
        graphAnswer:'2',
        keyframes:[{t:0,x:0},{t:2,x:20},{t:4,x:20},{t:8,x:60}],
        graphChoices:[
          { value:'0', label:'Graph A', keyframes:[{t:0,x:0},{t:2,x:20},{t:4,x:20},{t:8,x:0}], duration:8 },
          { value:'1', label:'Graph B', keyframes:[{t:0,x:40},{t:2,x:20},{t:4,x:20},{t:8,x:60}], duration:8 },
          { value:'2', label:'Graph C', keyframes:[{t:0,x:0},{t:2,x:20},{t:4,x:20},{t:8,x:60}], duration:8 },
          { value:'3', label:'Graph D', keyframes:[{t:0,x:10},{t:2,x:10},{t:5,x:40},{t:8,x:20}], duration:8 }
        ] },
      { id:8, duration:8, graphMatchMode:true, graphMatchType:'velocity', hidePosition:true, hideVelocity:true,
        title:'Case 9: Match the Velocity Graph',
        mission:'Watch the truck move, then choose the velocity-time graph that matches its motion.',
        clues:['A line above 0 means the truck moves forward.', 'A line on 0 means the truck is stopped.', 'A line below 0 means the truck moves backward.'],
        successExplanation:'Graph B matches the animation: positive velocity, then zero velocity, then negative velocity.',
        wrongExplanation:'Match the direction and stop: the correct velocity graph is above 0, then on 0, then below 0.',
        graphAnswer:'1',
        keyframes:[{t:0,x:10},{t:2,x:40},{t:5,x:40},{t:8,x:10}],
        graphChoices:[
          { value:'0', label:'Graph A', keyframes:[{t:0,x:10},{t:2,x:40},{t:5,x:40},{t:8,x:70}], duration:8 },
          { value:'1', label:'Graph B', keyframes:[{t:0,x:10},{t:2,x:40},{t:5,x:40},{t:8,x:10}], duration:8 },
          { value:'2', label:'Graph C', keyframes:[{t:0,x:40},{t:2,x:10},{t:5,x:10},{t:8,x:55}], duration:8 },
          { value:'3', label:'Graph D', keyframes:[{t:0,x:20},{t:2,x:20},{t:5,x:50},{t:8,x:20}], duration:8 }
        ] }
      ,
      { id:9, duration:16, deliveryHouse:6, porchPirateMode:true, guiltySuspect:'Suspect A',
        title:'Case 10: The Decoy Drop (2 Vans)',
        mission:'Two vans, one pirate. Watch the Gray Express van. Who steals its package?',
        clues:['The Express van delivers at House 6.', 'Suspect A arrives after the drop.'],
        successExplanation:'Suspect A reached House 6 after the Express van dropped the package.',
        wrongExplanation:'Watch the timing. The thief arrives AFTER the delivery.',
        dropTime:8, theftTime:11,
        keyframes:[{t:0,x:0},{t:4,x:20},{t:7,x:20},{t:16,x:70}],
        extraEntities:[
          { id:'truck2', name:'Express', type:'vehicle', color:'#475569',
            keyframes:[{t:0,x:0},{t:3,x:40},{t:4,x:40},{t:8,x:60},{t:12,x:60},{t:16,x:0}] },
          { id:'suspectA', name:'Suspect A', color:'#10b981',
            keyframes:[{t:0,x:0},{t:10,x:50},{t:16,x:80}] }
        ] },
      { id:10, duration:12, deliveryHouse:3,
        title:'Case 11: The Getaway Car',
        mission:'The mail van drops a package, and a fast getaway car steals it! Click the house where the theft happened.',
        clues:['The mail van stops for 3 seconds.', 'The getaway car is much faster (steeper slope) and stops briefly at the same house.'],
        successExplanation:'House 3 is correct. The getaway car stopped there exactly when the package was waiting.',
        wrongExplanation:'Find where the fast red line stops at the same position the blue line stopped earlier.',
        keyframes:[{t:0,x:0},{t:3,x:30},{t:6,x:30},{t:10,x:70},{t:12,x:70}],
        extraEntities:[
          { id:'truck2', name:'Getaway', type:'vehicle', color:'#dc2626',
            keyframes:[{t:3,x:0},{t:5,x:30},{t:6,x:30},{t:8,x:70},{t:12,x:70}] }
        ] },
      { id:11, duration:15, deliveryHouse:4, porchPirateMode:true, guiltySuspect:'Suspect B',
        title:'Case 12: Intersection Hand-off',
        mission:'The vans meet to transfer a package. Who steals it after they leave?',
        clues:['The intersection of the blue and gray lines is the hand-off location.', 'Find who visits that house AFTER the vans leave.'],
        successExplanation:'Suspect B reached House 4 at t=11s, after the vans left the package at t=9s.',
        wrongExplanation:'Suspect A passed by too early. The thief arrives after the hand-off is complete.',
        dropTime:8, theftTime:11,
        keyframes:[{t:0,x:0},{t:6,x:40},{t:9,x:40},{t:15,x:70}],
        extraEntities:[
          { id:'truck2', name:'Express', type:'vehicle', color:'#475569',
            keyframes:[{t:0,x:70},{t:6,x:40},{t:9,x:40},{t:15,x:0}] },
          { id:'suspectA', name:'Suspect A', color:'#10b981',
            keyframes:[{t:0,x:20},{t:6,x:50},{t:15,x:50}] },
          { id:'suspectB', name:'Suspect B', color:'#a855f7',
            keyframes:[{t:4,x:10},{t:13,x:55},{t:15,x:55}] }
        ] },
      { id:12, duration:16, deliveryHouse:5, porchPirateMode:true, guiltySuspect:'Suspect B',
        title:'Case 13: Double Heist Chaos',
        mission:'Both vans make drops, both packages are stolen! Who stole the EXPRESS van\'s package at House 5?',
        clues:['Focus ONLY on the Gray Express van\'s delivery.', 'Suspect B arrives at House 5 after the Express van drops.'],
        successExplanation:'Suspect B stole the Express package at House 5. (Suspect A stole the Mail package at House 2).',
        wrongExplanation:'Trace the delivery stop first, then see which suspect crosses that position later.',
        dropTime:7, theftTime:12,
        keyframes:[{t:0,x:0},{t:4,x:20},{t:7,x:20},{t:16,x:60}],
        extraEntities:[
          { id:'truck2', name:'Express', type:'vehicle', color:'#475569',
            keyframes:[{t:0,x:10},{t:4,x:50},{t:7,x:50},{t:12,x:70},{t:16,x:70}] },
          { id:'suspectA', name:'Suspect A', color:'#10b981',
            keyframes:[{t:0,x:0},{t:12,x:40},{t:16,x:40}] },
          { id:'suspectB', name:'Suspect B', color:'#a855f7',
            keyframes:[{t:0,x:20},{t:6,x:20},{t:14,x:60},{t:16,x:60}] }
        ] }
    ];

    var currentScenarioId = 0;
    var scenario = SCENARIOS[0];
    var currentTime = 0;
    var isPlaying = false;
    var lastTimestamp = 0;
    var animationReq = null;
    var maxTime = 15;
    var solved = false;
    var isPrimeTheme = false;
    var packageDroppedFlag = false;
    var packageStolenFlag = false;
    var isActive = true;

    var truck, housesContainer, playBtn, resetBtn, scenarioSelect;
    var posCanvas, velCanvas, posCtx, velCtx;
    var posReadout, velReadout, feedbackBanner, feedbackBannerWrapper;
    var practiceBriefShell, practiceBriefClues, practiceHintBtn;
    var suspectControls, standalonePackage;
    var suspectAEl, suspectBEl, suspectAPackage, suspectBPackage;
    var themeToggleBtn, truckBodyBg, truckText, truckCabBg;
    var graphChoiceContainer, graphChoiceGrid;
    var extraEntityEls = {};
    var practiceHintsVisible = false;
    var practiceAdvanceTimer = null;

    function cacheElements() {
      truck = document.getElementById('truck');
      housesContainer = document.getElementById('housesContainer');
      playBtn = document.getElementById('playBtn');
      resetBtn = document.getElementById('resetBtn');
      scenarioSelect = document.getElementById('scenarioSelect');
      posCanvas = document.getElementById('posCanvas');
      velCanvas = document.getElementById('velCanvas');
      posCtx = posCanvas.getContext('2d');
      velCtx = velCanvas.getContext('2d');
      posReadout = document.getElementById('posReadout');
      velReadout = document.getElementById('velReadout');
      feedbackBanner = document.getElementById('feedbackBanner');
      feedbackBannerWrapper = document.getElementById('feedbackBannerWrapper');
      practiceBriefShell = document.getElementById('practice-brief-shell');
      practiceBriefClues = document.getElementById('practice-brief-clues');
      practiceHintBtn = document.getElementById('practice-hint-btn');
      suspectControls = document.getElementById('suspectControls');
      standalonePackage = document.getElementById('standalonePackage');
      suspectAEl = document.getElementById('suspectA');
      suspectBEl = document.getElementById('suspectB');
      suspectAPackage = document.getElementById('suspectAPackage');
      suspectBPackage = document.getElementById('suspectBPackage');
      themeToggleBtn = document.getElementById('themeToggleBtn');
      truckBodyBg = document.getElementById('truckBodyBg');
      truckText = document.getElementById('truckText');
      truckCabBg = document.getElementById('truckCabBg');
      graphChoiceContainer = document.getElementById('graph-choice-container');
      graphChoiceGrid = document.getElementById('graph-choice-grid');
    }

    function buildHouses() {
      housesContainer.innerHTML = '';
      HOUSES.forEach(function(house) {
        var el = document.createElement('div');
        el.className = 'absolute bottom-0 w-16 h-20 house-btn flex flex-col items-center justify-end group z-10';
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', 'House ' + house.num + ' at ' + house.x + ' meters');
        var leftPercent = (house.x / 70) * 100;
        el.style.left = 'calc(' + leftPercent + '% - 32px)';
        // Build the clickable house markup for each house button.
// This creates the hover label, chimney, roof, house body, windows, door, porch step, and bushes.
          el.innerHTML =
          // House number label that appears above the house on hover/focus
          '<div class="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white border border-slate-600 rounded-md px-2 py-0.5 text-[10px] font-bold shadow-md opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-20 whitespace-nowrap pointer-events-none">#' + house.num + '</div>' +

          // Chimney behind the roof
          '<div class="absolute top-[1px] right-[18px] w-[8px] h-[27px] bg-red-800 border border-red-950 rounded-t-[2px] z-0"></div>' +

          // Roof wrapper
          '<div class="relative w-[68px] h-[31px] z-10">' +
          // Main roof triangle
          '<div class="absolute left-1/2 -translate-x-1/2 top-[2px] w-[66px] h-[28px] bg-slate-800 shadow-[0_5px_8px_-2px_rgba(0,0,0,0.35)]" style="clip-path:polygon(50% 0%, 0% 100%, 100% 100%);"></div>' +
            '</div>' +

          // Main house body
          // -mt-[2px] pulls the body up slightly so it meets the roof better
          '<div class="relative -mt-[-5px] w-[58px] h-[46px] ' + house.color + ' border-x-2 border-t-2 border-slate-800 shadow-[inset_0_2px_0_rgba(255,255,255,0.18),inset_0_-3px_6px_rgba(0,0,0,0.10)] z-10">' +
          // Light trim band at top of house body for a little extra detail
          '<div class="absolute top-0 left-0 right-0 h-[4px] bg-white/15"></div>' +

          // Left window
          '<div class="absolute left-[6px] top-[7px] w-[12px] h-[14px] bg-sky-200 border-2 border-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]">' +
            // Vertical window divider
            '<div class="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-white/90"></div>' +
            // Horizontal window divider
            '<div class="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 bg-white/90"></div>' +
            // Small window sill under left window
            '<div class="absolute -bottom-[3px] left-1/2 w-[14px] h-[2px] -translate-x-1/2 bg-slate-200 border border-slate-400 rounded-sm"></div>' +
          '</div>' +

          // Right window
          '<div class="absolute right-[6px] top-[7px] w-[12px] h-[14px] bg-sky-200 border-2 border-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]">' +
            // Vertical window divider
            '<div class="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-white/90"></div>' +
            // Horizontal window divider
            '<div class="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 bg-white/90"></div>' +
            // Small window sill under right window
            '<div class="absolute -bottom-[3px] left-1/2 w-[14px] h-[2px] -translate-x-1/2 bg-slate-200 border border-slate-400 rounded-sm"></div>' +
          '</div>' +

          // Front door centered at the bottom
          '<div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[14px] h-[24px] bg-amber-800 border-2 border-amber-950 rounded-t-sm shadow-[inset_0_2px_0_rgba(255,255,255,0.12)]">' +
            // Door center detail line
            '<div class="absolute left-1/2 top-[6px] bottom-[3px] w-[1px] -translate-x-1/2 bg-amber-950/50"></div>' +
            // Door knob
            '<div class="absolute top-[10px] right-[2px] w-[2px] h-[2px] bg-yellow-300 rounded-full"></div>' +
          '</div>' +
          '</div>' +

          // Bottom area: porch step and bushes
          '<div class="relative w-[68px] h-[24px] z-10 overflow-visible">' +
          // Single porch/step centered under the door
          '<div class="absolute left-1/2 top-0 h-[5px] w-[30px] -translate-x-1/2 rounded-sm bg-stone-300 border border-stone-500 shadow-sm"></div>' +
          // second porch/step centered under the door
          '<div class="absolute left-1/2 top-[5px] h-[6px] w-[30px] -translate-x-1/2 rounded-sm bg-stone-400 border border-stone-600 shadow-sm"></div>' +

          // Left bush back layer
          '<div class="absolute left-[1px] bottom-0 w-[18px] h-[24px] bg-green-700 rounded-full border border-green-900"></div>' +
          // Left bush middle layer
          '<div class="absolute left-[7px] bottom-[2px] w-[17px] h-[21px] bg-green-600 rounded-full border border-green-800"></div>' +
          // Left bush front highlight cluster
          '<div class="absolute left-[10px] bottom-[7px] w-[11px] h-[11px] bg-green-500 rounded-full border border-green-700"></div>' +

          // Right bush back layer
          '<div class="absolute right-[1px] bottom-0 w-[18px] h-[24px] bg-green-700 rounded-full border border-green-900"></div>' +
          // Right bush middle layer
          '<div class="absolute right-[7px] bottom-[2px] w-[17px] h-[21px] bg-green-600 rounded-full border border-green-800"></div>' +
          // Right bush front highlight cluster
          '<div class="absolute right-[10px] bottom-[7px] w-[11px] h-[11px] bg-green-500 rounded-full border border-green-700"></div>' +
          '</div>';
          el.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (isActive) checkAnswer(house.num);
            if (window.motionSim && typeof window.motionSim.handleHouseClick === 'function') window.motionSim.handleHouseClick(house.num);
          }
        });
        el.addEventListener('click', function() {
          if (isActive) checkAnswer(house.num);
          if (window.motionSim && typeof window.motionSim.handleHouseClick === 'function') window.motionSim.handleHouseClick(house.num);
        });
        housesContainer.appendChild(el);
      });
    }

    function getKinematicsForVelBased(kfs, t, persistEnd) {
      if (!kfs || !kfs.length) return null;
      if (t <= kfs[0].t) return persistEnd ? {x:0, v:kfs[0].v} : null;
      var currentX = 0;
      for (var i = 0; i < kfs.length - 1; i++) {
        var kf1 = kfs[i], kf2 = kfs[i+1];
        if (t > kf2.t) {
          currentX += 0.5 * (kf1.v + kf2.v) * (kf2.t - kf1.t);
        } else {
          var dt = t - kf1.t;
          var segDt = kf2.t - kf1.t;
          var a = (kf2.v - kf1.v) / segDt;
          var currentV = kf1.v + a * dt;
          currentX += kf1.v * dt + 0.5 * a * dt * dt;
          return {x:currentX, v:currentV};
        }
      }
      if (!persistEnd) return null;
      return {x:currentX, v:kfs[kfs.length-1].v};
    }

    function getKinematicsFor(kfs, t, persistEnd, useVel) {
      if (useVel) return getKinematicsForVelBased(kfs, t, persistEnd);
      if (!kfs || !kfs.length) return null;
      if (t < kfs[0].t) return persistEnd ? {x:kfs[0].x, v:0} : null;
      if (t >= kfs[kfs.length-1].t) return persistEnd ? {x:kfs[kfs.length-1].x, v:0} : null;
      for (var i = 0; i < kfs.length - 1; i++) {
        if (t >= kfs[i].t && t < kfs[i+1].t) {
          var dt = kfs[i+1].t - kfs[i].t;
          var dx = kfs[i+1].x - kfs[i].x;
          var v = dx / dt;
          return {x: kfs[i].x + v * (t - kfs[i].t), v: v};
        }
      }
      return null;
    }

    function getExtraEntityElement(ent) {
      if (ent.id === 'A' || ent.id === 'suspectA') return suspectAEl;
      if (ent.id === 'B' || ent.id === 'suspectB') return suspectBEl;
      if (extraEntityEls[ent.id]) return extraEntityEls[ent.id];
      var el = document.createElement('div');
      el.className = 'absolute bottom-8 w-20 h-12 z-20 transition-transform';
      el.style.display = 'none';
      el.style.left = '-100px';
      el.style.transform = 'translateX(-50%)';
      var color = ent.color || '#475569';
      var label = ent.name || 'Van';
      el.innerHTML =
        '<div class="relative w-full h-full">' +
          '<div class="absolute bottom-2 left-0 w-[70%] h-8 rounded-l-md rounded-tr-sm border-2 border-slate-900 shadow-md flex items-center justify-center text-[9px] font-black text-white" style="background:' + color + '">' + label + '</div>' +
          '<div class="absolute bottom-2 right-1 w-[33%] h-7 rounded-tr-lg rounded-br-sm border-2 border-slate-900 shadow-md" style="background:' + color + '">' +
            '<div class="absolute top-1 right-1 w-3 h-3 bg-sky-200 border border-slate-900 rounded-sm opacity-90"></div>' +
          '</div>' +
          '<div class="absolute bottom-0 left-2 w-5 h-5 bg-slate-800 rounded-full border-2 border-slate-300"></div>' +
          '<div class="absolute bottom-0 right-1 w-5 h-5 bg-slate-800 rounded-full border-2 border-slate-300"></div>' +
        '</div>';
      document.getElementById('sim-stage').appendChild(el);
      extraEntityEls[ent.id] = el;
      return el;
    }

    function hideExtraEntityElements() {
      Object.keys(extraEntityEls).forEach(function(id) {
        extraEntityEls[id].style.display = 'none';
      });
    }

    function toggleTheme() {
      isPrimeTheme = !isPrimeTheme;
      if (isPrimeTheme) {
        truckBodyBg.classList.replace('from-white','from-slate-700');
        truckBodyBg.classList.replace('to-slate-100','to-slate-800');
        truckBodyBg.classList.replace('border-blue-800','border-blue-400');
        truckBodyBg.classList.replace('text-blue-800','text-blue-400');
        truckText.innerText = 'prime';
        truckText.classList.replace('tracking-wider','tracking-normal');
        truckText.classList.add('italic','lowercase','text-sm');
        truckCabBg.classList.replace('from-blue-700','from-slate-800');
        truckCabBg.classList.replace('to-blue-900','to-slate-900');
        truckCabBg.classList.replace('border-blue-800','border-slate-900');
      } else {
        truckBodyBg.classList.replace('from-slate-700','from-white');
        truckBodyBg.classList.replace('to-slate-800','to-slate-100');
        truckBodyBg.classList.replace('border-blue-400','border-blue-800');
        truckBodyBg.classList.replace('text-blue-400','text-blue-800');
        truckText.innerText = 'US MAIL';
        truckText.classList.replace('tracking-normal','tracking-wider');
        truckText.classList.remove('italic','lowercase','text-sm');
        truckCabBg.classList.replace('from-slate-800','from-blue-700');
        truckCabBg.classList.replace('to-slate-900','to-blue-900');
        truckCabBg.classList.replace('border-slate-900','border-blue-800');
      }
    }

    function renderPracticeBrief() {
      if (!practiceBriefShell || !practiceBriefClues) return;
      practiceBriefClues.innerHTML = (scenario.clues || []).map(function(clue) {
        return '<span class="hint-chip">' + clue + '</span>';
      }).join('');
      practiceBriefClues.classList.toggle('hidden', !practiceHintsVisible);
      if (practiceHintBtn) {
        practiceHintBtn.classList.toggle('hidden', !(scenario.clues && scenario.clues.length));
        practiceHintBtn.textContent = practiceHintsVisible ? 'Hide Hints' : 'Show Hints';
      }
    }

    function renderPracticeGraphChoices() {
      if (!graphChoiceGrid || !scenario.graphChoices) return;
      graphChoiceGrid.innerHTML = scenario.graphChoices.map(function(choice, i) {
        return '<label class="graph-choice-item">' +
          '<span class="graph-choice-label"><input type="radio" name="practice-graph-choice" value="' + choice.value + '" />' +
          '<span>' + choice.label + '</span></span>' +
          '<span class="graph-choice-canvas-wrap"><canvas id="practice-graph-choice-canvas-' + i + '"></canvas></span>' +
        '</label>';
      }).join('');
      var inputs = graphChoiceGrid.querySelectorAll('input[name="practice-graph-choice"]');
      inputs.forEach(function(input) {
        input.addEventListener('change', function() { checkGraphMatchAnswer(input.value); });
      });
      setTimeout(drawPracticeGraphChoiceCanvases, 0);
    }

    function drawPracticeGraphChoiceCanvases() {
      if (!scenario.graphMatchMode || !scenario.graphChoices) return;
      var maxChoiceTime = Math.max.apply(null, scenario.graphChoices.map(function(choice) { return choice.duration || scenario.duration; }));
      scenario.graphChoices.forEach(function(choice, i) {
        var canvas = document.getElementById('practice-graph-choice-canvas-' + i);
        if (!canvas) return;
        var rect = canvas.parentElement.getBoundingClientRect();
        if (rect.width === 0) return;
        var dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        var ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (scenario.graphMatchType === 'velocity') {
          drawGraphGrid(ctx, rect.width, rect.height, 'Time', 'Velocity', -20, 20, 10, maxChoiceTime, 2);
          drawVelocityLine(ctx, rect.width, rect.height, -20, 20, maxChoiceTime, choice.keyframes, '#dc2626', false);
        } else {
          drawGraphGrid(ctx, rect.width, rect.height, 'Time', 'Position', 0, 70, 35, maxChoiceTime, 2);
          drawPositionLine(ctx, rect.width, rect.height, 0, 70, maxChoiceTime, choice.keyframes, '#2563eb', false);
        }
      });
    }

    function checkGraphMatchAnswer(value) {
      if (!scenario.graphMatchMode) return;
      if (value === scenario.graphAnswer) {
        solved = true; isPlaying = false;
        cancelAnimationFrame(animationReq);
        truck.classList.remove('moving');
        feedbackBanner.innerHTML = '<b>Correct!</b> ' + scenario.successExplanation;
        feedbackBannerWrapper.className = 'bg-green-500 py-3 transition-colors duration-300 animate-pulse';
        feedbackBanner.className = 'text-white text-center font-bold text-lg';
        playBtn.innerHTML = 'Play Again';
        schedulePracticeAdvance();
      } else {
        feedbackBanner.innerHTML = '<b>Incorrect.</b> ' + scenario.wrongExplanation;
        feedbackBannerWrapper.className = 'bg-red-500 py-2 transition-colors duration-300';
        feedbackBanner.className = 'text-white text-center font-bold text-lg';
      }
    }

    function schedulePracticeAdvance() {
      if (practiceAdvanceTimer) clearTimeout(practiceAdvanceTimer);
      if (currentScenarioId >= SCENARIOS.length - 1) return;
      practiceAdvanceTimer = setTimeout(function() {
        practiceAdvanceTimer = null;
        currentScenarioId += 1;
        if (scenarioSelect) scenarioSelect.value = String(currentScenarioId);
        resetSimulation();
      }, 1200);
    }

    function togglePlay() {
      if (solved) resetSimulation();
      isPlaying = !isPlaying;
      if (isPlaying) {
        playBtn.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg> Pause';
        truck.classList.add('moving');
        lastTimestamp = performance.now();
        animationReq = requestAnimationFrame(loop);
        feedbackBanner.innerText = 'Watching the motion...';
      } else {
        playBtn.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" fill-rule="evenodd"></path></svg> Play';
        truck.classList.remove('moving');
        cancelAnimationFrame(animationReq);
        feedbackBanner.innerText = scenario.graphMatchMode ? 'Paused. Choose a graph if you know the answer!' : 'Paused. Click a house if you know the answer!';
      }
    }

    function resetSimulation() {
      if (practiceAdvanceTimer) {
        clearTimeout(practiceAdvanceTimer);
        practiceAdvanceTimer = null;
      }
      isPlaying = false; solved = false;
      practiceHintsVisible = false;
      packageDroppedFlag = false; packageStolenFlag = false;
      cancelAnimationFrame(animationReq);
      scenario = SCENARIOS[currentScenarioId];
      currentTime = 0;
      maxTime = Math.max(15, scenario.duration + 2);
      truck.classList.remove('moving');
      standalonePackage.classList.add('hidden');
      standalonePackage.classList.remove('opacity-100','opacity-0');
      standalonePackage.style.transform = 'rotate(0deg)';
      suspectAEl.style.display = 'none';
      suspectBEl.style.display = 'none';
      hideExtraEntityElements();
      suspectAPackage.style.display = 'none';
      suspectBPackage.style.display = 'none';
      suspectControls.classList.add('hidden');
      playBtn.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" fill-rule="evenodd"></path></svg> Play';
      var posC = document.getElementById('posContainer');
      var velC = document.getElementById('velContainer');
      var graphChoiceC = document.getElementById('graph-choice-container');
      posC.style.display = scenario.graphMatchMode || scenario.hidePosition ? 'none' : 'flex';
      velC.style.display = scenario.graphMatchMode || scenario.hideVelocity ? 'none' : 'flex';
      if (graphChoiceC) graphChoiceC.classList.toggle('hidden', !scenario.graphMatchMode);
      if (housesContainer) housesContainer.style.pointerEvents = scenario.graphMatchMode ? 'none' : '';
      feedbackBannerWrapper.className = 'bg-blue-100 py-2 border-b border-blue-300 transition-colors duration-300';
      feedbackBanner.className = 'text-blue-800 text-center font-semibold text-lg';
      if (scenario.graphMatchMode) {
        feedbackBanner.innerHTML = scenario.graphMatchType === 'velocity'
          ? '<b>Which graph matches the motion?</b> Watch the truck, then select the matching velocity-time graph below.'
          : '<b>Which graph matches the motion?</b> Watch the truck, then select the matching position-time graph below.';
        renderPracticeGraphChoices();
      } else if (scenario.porchPirateMode) {
        feedbackBanner.innerHTML = '<b>PORCH PIRATE MODE!</b> The mail truck (Blue) drops a package. Who steals it: Suspect A (Green) or Suspect B (Purple)?';
      } else if (scenario.hidePosition && scenario.useVelocityKeyframes) {
        feedbackBanner.innerHTML = '<b>Which house got the delivery?</b> Broken GPS + Accelerating! Use area under the curve to find the house. (Starts at x=0m)';
      } else if (scenario.hidePosition) {
        feedbackBanner.innerHTML = '<b>Which house got the delivery?</b> Broken GPS! Watch the Velocity graph. (Truck starts at x = 0m)';
      } else if (scenario.hideVelocity) {
        feedbackBanner.innerHTML = '<b>Which house got the delivery?</b> Broken Speedometer! Watch the Position graph.';
      } else {
        feedbackBanner.innerHTML = '<b>Which house got the delivery?</b> Watch the animation and read the graphs. A delivery means the truck stopped for more than 2 seconds. Click a house to answer.';
      }
      renderPracticeBrief();
      updateDeliveryUI();
      setTimeout(resizeCanvases, 10);
    }

    function loop(timestamp) {
      if (!isPlaying) return;
      var dt = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;
      currentTime += dt;
      if (currentTime >= scenario.duration + 1) {
        isPlaying = false;
        truck.classList.remove('moving');
        playBtn.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"></path></svg> Replay';
        if (scenario.graphMatchMode) {
          feedbackBanner.innerText = 'Animation finished. Which graph matches the motion?';
          feedbackBannerWrapper.className = 'bg-green-100 py-2 border-b border-green-200 transition-colors duration-300';
          feedbackBanner.className = 'text-green-800 text-center font-semibold text-lg';
        } else if (scenario.porchPirateMode) {
          feedbackBanner.innerText = 'Animation finished. Who was at the house AFTER the package was delivered?';
          feedbackBannerWrapper.className = 'bg-orange-100 py-2 border-b border-orange-200 transition-colors duration-300';
          suspectControls.classList.remove('hidden');
        } else {
          feedbackBanner.innerText = 'Animation finished. Which house got the delivery?';
          feedbackBannerWrapper.className = 'bg-green-100 py-2 border-b border-green-200 transition-colors duration-300';
        }
      }
      if (scenario.porchPirateMode && isPlaying) {
        if (currentTime >= scenario.dropTime && !packageDroppedFlag) {
          showPackageDrop(scenario.deliveryHouse, false);
          packageDroppedFlag = true;
        }
        if (currentTime >= scenario.theftTime && packageDroppedFlag && !packageStolenFlag) {
          standalonePackage.classList.remove('opacity-100');
          standalonePackage.classList.add('opacity-0');
          var guiltyPkg = scenario.guiltySuspect === 'Suspect A' ? suspectAPackage : suspectBPackage;
          guiltyPkg.style.display = 'block';
          packageStolenFlag = true;
        }
      }
      updateDeliveryUI();
      if (isPlaying) animationReq = requestAnimationFrame(loop);
    }

    function updateDeliveryUI() {
      var kin = getKinematicsFor(scenario.keyframes, currentTime, true, scenario.useVelocityKeyframes);
      if (kin) {
        truck.style.left = ((kin.x / 70) * 100) + '%';
        if (kin.v < -0.1) truck.querySelector('.relative').style.transform = 'scaleX(-1)';
        else if (kin.v > 0.1) truck.querySelector('.relative').style.transform = 'scaleX(1)';
        posReadout.innerText = 'x = ' + kin.x.toFixed(1) + ' m';
        velReadout.innerText = 'v = ' + kin.v.toFixed(1) + ' m/s';
      }
      if (scenario.extraEntities) {
        scenario.extraEntities.forEach(function(ent) {
          var el = getExtraEntityElement(ent);
          var entKin = getKinematicsFor(ent.keyframes, currentTime, false);
          if (entKin) {
            el.style.display = 'flex';
            el.style.left = 'calc(' + ((entKin.x / 70) * 100) + '% - 16px)';
            if (ent.type === 'vehicle') {
              el.style.left = ((entKin.x / 70) * 100) + '%';
              var vehicleBody = el.querySelector('.relative');
              if (vehicleBody) {
                if (entKin.v < -0.1) vehicleBody.style.transform = 'scaleX(-1)';
                else if (entKin.v > 0.1) vehicleBody.style.transform = 'scaleX(1)';
              }
            }
          } else {
            el.style.display = 'none';
          }
        });
      }
      renderGraphs(kin ? kin.x : 0, kin ? kin.v : 0);
    }

    function checkAnswer(houseNum) {
      if (scenario.graphMatchMode) {
        feedbackBanner.innerHTML = '<b>Choose a graph below.</b> This practice case is about matching the animation to a position-time graph.';
        feedbackBannerWrapper.className = 'bg-blue-100 py-2 border-b border-blue-300';
        feedbackBanner.className = 'text-blue-800 text-center font-semibold text-lg';
        return;
      }
      if (scenario.porchPirateMode) {
        feedbackBanner.innerHTML = 'We know the package was dropped at House '+scenario.deliveryHouse+'. But who stole it?<br>Look at the lines to see who was there <b>after</b> the drop!';
        feedbackBannerWrapper.className = 'bg-orange-100 py-2 border-b border-orange-200';
        suspectControls.classList.remove('hidden');
        return;
      }
      if (houseNum === scenario.deliveryHouse) {
        solved = true; isPlaying = false;
        cancelAnimationFrame(animationReq);
        truck.classList.remove('moving');
        feedbackBanner.innerHTML = '<b>Correct!</b> ' + (scenario.successExplanation || ('House ' + houseNum + ' got the package (velocity was zero for > 2s).'));
        feedbackBannerWrapper.className = 'bg-green-500 py-3 transition-colors duration-300 animate-pulse';
        feedbackBanner.className = 'text-white text-center font-bold text-lg';
        playBtn.innerHTML = 'Play Again';
        showPackageDrop(houseNum, true);
        schedulePracticeAdvance();
      } else {
        feedbackBanner.innerHTML = '<b>Incorrect.</b> ' + (scenario.wrongExplanation || ('Take a closer look at the graphs. He didn\'t stop long enough at House ' + houseNum + '!'));
        feedbackBannerWrapper.className = 'bg-red-500 py-2 transition-colors duration-300';
        feedbackBanner.className = 'text-white text-center font-bold text-lg';
        housesContainer.children[houseNum-1].classList.add('animate-[shake_0.5s_ease-in-out]');
        setTimeout(function() { housesContainer.children[houseNum-1].classList.remove('animate-[shake_0.5s_ease-in-out]'); }, 500);
      }
    }
    function checkSuspectAnswer(suspectName) {
      if (suspectName === scenario.guiltySuspect) {
        solved = true; isPlaying = false;
        cancelAnimationFrame(animationReq);
        truck.classList.remove('moving');
        feedbackBanner.innerHTML = '<b>Correct!</b> ' + (scenario.successExplanation || (suspectName+' passed House '+scenario.deliveryHouse+' <b>after</b> the package was delivered. They are the Porch Pirate!'));
        feedbackBannerWrapper.className = 'bg-purple-600 py-3 transition-colors duration-300 animate-pulse';
        feedbackBanner.className = 'text-white text-center font-bold text-lg';
        suspectControls.classList.add('hidden');
        playBtn.innerHTML = 'Play Again';
        standalonePackage.classList.remove('opacity-100');
        standalonePackage.classList.add('opacity-0');
        if (suspectName === 'Suspect A') suspectAPackage.style.display = 'block';
        if (suspectName === 'Suspect B') suspectBPackage.style.display = 'block';
        schedulePracticeAdvance();
      } else {
        feedbackBanner.innerHTML = '<b>Incorrect.</b> ' + (scenario.wrongExplanation || (suspectName+' passed by <b>before</b> the package was dropped. They couldn\'t have stolen it!'));
        feedbackBannerWrapper.className = 'bg-red-500 py-2 transition-colors duration-300';
        feedbackBanner.className = 'text-white text-center font-bold text-lg';
      }
    }

    function showPackageDrop(houseNum, instantSnap) {
      var houseX = HOUSES.find(function(h) { return h.num === houseNum; }).x;
      var leftPercent = (houseX / 70) * 100;
      if (instantSnap) truck.style.left = leftPercent + '%';
      standalonePackage.style.left = 'calc(' + leftPercent + '% - 10px)';
      standalonePackage.style.bottom = '94px';
      standalonePackage.style.transform = 'rotate(0deg)';
      standalonePackage.classList.remove('hidden');
      void standalonePackage.offsetWidth;
      standalonePackage.classList.add('opacity-100');
      standalonePackage.style.bottom = '64px';
      standalonePackage.style.transform = 'rotate(15deg)';
    }

    function resizeCanvases() {
      if (!isActive) return;
      if (scenario.graphMatchMode) {
        updateDeliveryUI();
        return;
      }
      var fixDPI = function(canvas) {
        var rect = canvas.parentElement.getBoundingClientRect();
        if (rect.width === 0) return;
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        canvas.getContext('2d').scale(window.devicePixelRatio, window.devicePixelRatio);
      };
      if (!scenario.hidePosition) fixDPI(posCanvas);
      if (!scenario.hideVelocity) fixDPI(velCanvas);
      updateDeliveryUI();
    }

    function renderGraphs(currentX, currentV) {
      if (scenario.graphMatchMode) {
        drawPracticeGraphChoiceCanvases();
        return;
      }
      if (!scenario.hidePosition) {
        var pRect = posCanvas.parentElement.getBoundingClientRect();
        if (pRect.width > 0 && pRect.height > 0) {
          drawGraphGrid(posCtx, pRect.width, pRect.height, 'Time (s)', 'Position (m)', 0, 70, 10, maxTime, 1);
          drawPositionLine(posCtx, pRect.width, pRect.height, 0, 70, maxTime, scenario.keyframes, '#2563eb', scenario.useVelocityKeyframes);
          if (scenario.extraEntities) {
            scenario.extraEntities.forEach(function(ent) {
              drawPositionLine(posCtx, pRect.width, pRect.height, 0, 70, maxTime, ent.keyframes, ent.color, ent.useVelocityKeyframes);
            });
          }
          drawScrubber(posCtx, pRect.width, pRect.height, maxTime, currentTime, currentX, 70, 0);
        }
      }
      if (!scenario.hideVelocity) {
        var vRect = velCanvas.parentElement.getBoundingClientRect();
        if (vRect.width > 0 && vRect.height > 0) {
          drawGraphGrid(velCtx, vRect.width, vRect.height, 'Time (s)', 'Velocity (m/s)', -20, 20, 10, maxTime, 1);
          drawVelocityLine(velCtx, vRect.width, vRect.height, -20, 20, maxTime, scenario.keyframes, '#2563eb', scenario.useVelocityKeyframes);
          if (scenario.extraEntities) {
            scenario.extraEntities.forEach(function(ent) {
              drawVelocityLine(velCtx, vRect.width, vRect.height, -20, 20, maxTime, ent.keyframes, ent.color, ent.useVelocityKeyframes);
            });
          }
          drawScrubber(velCtx, vRect.width, vRect.height, maxTime, currentTime, currentV, 20, -20);
        }
      }
    }

    function drawGraphGrid(ctx, w, h, xLabel, yLabel, yMin, yMax, yStep, xMax, xStep) {
      ctx.clearRect(0,0,w,h);
      var padX=44, padY=48, graphW=w-padX-12, graphH=h-padY-12;
      var yRange = yMax - yMin;
      var zeroY = 10 + graphH - ((0 - yMin) / yRange) * graphH;
      ctx.strokeStyle='#e2e8f0'; ctx.lineWidth=1;
      ctx.font='11px Verdana, Arial, sans-serif'; ctx.fillStyle='#334155'; ctx.textAlign='right'; ctx.textBaseline='middle';
      for (var y=yMin; y<=yMax; y+=yStep) {
        var pY = 10 + graphH - ((y - yMin) / yRange) * graphH;
        ctx.beginPath(); ctx.moveTo(padX,pY); ctx.lineTo(w-10,pY); ctx.stroke();
        ctx.fillText(y, padX-6, pY);
      }
      ctx.textAlign='center'; ctx.textBaseline='top';
      for (var x=0; x<=xMax; x+=xStep) {
        var pX = padX + (x / xMax) * graphW;
        ctx.beginPath(); ctx.moveTo(pX,10); ctx.lineTo(pX,h-padY); ctx.stroke();
        ctx.fillText(x, pX, h-padY+8);
      }
      ctx.strokeStyle='#334155'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(padX,10); ctx.lineTo(padX,h-padY);
      ctx.moveTo(padX,zeroY); ctx.lineTo(w-10,zeroY); ctx.stroke();
      ctx.fillStyle='#0f172a'; ctx.font='700 14px Verdana, Arial, sans-serif'; ctx.textBaseline='alphabetic';
      ctx.fillText(xLabel, padX+graphW/2, h-5);
      ctx.save(); ctx.translate(14,10+graphH/2); ctx.rotate(-Math.PI/2);
      ctx.fillText(yLabel,0,0); ctx.restore();
    }

    function drawPositionLine(ctx, w, h, yMin, yMax, xMax, keyframes, color, useVel) {
      var padX=44, padY=48, graphW=w-padX-12, graphH=h-padY-12;
      var yRange = yMax - yMin;
      ctx.beginPath(); ctx.strokeStyle=color; ctx.lineWidth=3; ctx.lineJoin='round';
      if (useVel) {
        for (var t=0; t<=xMax; t+=0.1) {
          var kin = getKinematicsForVelBased(keyframes,t,true);
          if (!kin) continue;
          var px = padX + (t/xMax)*graphW;
          var py = 10 + graphH - ((kin.x-yMin)/yRange)*graphH;
          if (t < 0.01) ctx.moveTo(px,py); else ctx.lineTo(px,py);
        }
      } else {
        keyframes.forEach(function(kf,idx) {
          var px = padX + (kf.t/xMax)*graphW;
          var py = 10 + graphH - ((kf.x-yMin)/yRange)*graphH;
          idx===0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py);
        });
      }
      ctx.stroke();
    }

    function drawVelocityLine(ctx, w, h, yMin, yMax, xMax, keyframes, color, useVel) {
      var padX=44, padY=48, graphW=w-padX-12, graphH=h-padY-12;
      var yRange = yMax - yMin;
      ctx.beginPath(); ctx.strokeStyle=color; ctx.lineWidth=3;
      if (useVel) {
        keyframes.forEach(function(kf,idx) {
          var px = padX + (kf.t/xMax)*graphW;
          var py = 10 + graphH - ((kf.v-yMin)/yRange)*graphH;
          idx===0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py);
        });
      } else {
        for (var i=0; i<keyframes.length-1; i++) {
          var kf1=keyframes[i], kf2=keyframes[i+1];
          var v = (kf2.x-kf1.x)/(kf2.t-kf1.t);
          var pX1 = padX + (kf1.t/xMax)*graphW;
          var pX2 = padX + (kf2.t/xMax)*graphW;
          var pY = 10 + graphH - ((v-yMin)/yRange)*graphH;
          ctx.moveTo(pX1,pY); ctx.lineTo(pX2,pY);
          if (i<keyframes.length-2) {
            var kf3=keyframes[i+2];
            var vNext = (kf3.x-kf2.x)/(kf3.t-kf2.t);
            var pYN = 10 + graphH - ((vNext-yMin)/yRange)*graphH;
            ctx.moveTo(pX2,pY); ctx.lineTo(pX2,pYN);
          }
        }
      }
      ctx.stroke();
    }

    function drawScrubber(ctx, w, h, xMax, t, yVal, yMax, yMin) {
      var padX=44, padY=48, graphW=w-padX-12, graphH=h-padY-12;
      var yRange = yMax - yMin;
      var pX = padX + (t/xMax)*graphW;
      ctx.beginPath(); ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.setLineDash([5,5]);
      ctx.moveTo(pX,10); ctx.lineTo(pX,h-padY); ctx.stroke(); ctx.setLineDash([]);
      if (t <= scenario.duration) {
        var pY = 10 + graphH - ((yVal-yMin)/yRange)*graphH;
        ctx.beginPath(); ctx.arc(pX,pY,5,0,Math.PI*2);
        ctx.fillStyle='#0f172a'; ctx.fill();
      }
    }

    function setActive(active) {
      isActive = !!active;
      if (!isActive) {
        isPlaying = false;
        cancelAnimationFrame(animationReq);
        if (truck) truck.classList.remove('moving');
        if (playBtn) playBtn.innerHTML = '&#9654; Play';
        practiceHintsVisible = false;
        if (practiceBriefClues) practiceBriefClues.classList.add('hidden');
        if (practiceHintBtn) practiceHintBtn.textContent = 'Show Hints';
        if (feedbackBannerWrapper) feedbackBannerWrapper.classList.add('hidden');
        if (suspectControls) suspectControls.classList.add('hidden');
        if (standalonePackage) standalonePackage.classList.add('hidden');
        if (suspectAEl) suspectAEl.style.display = 'none';
        if (suspectBEl) suspectBEl.style.display = 'none';
        hideExtraEntityElements();
        if (graphChoiceContainer) graphChoiceContainer.classList.add('hidden');
        return;
      }
      if (feedbackBannerWrapper) feedbackBannerWrapper.classList.remove('hidden');
      resetSimulation();
    }

    function init() {
      cacheElements();
      buildHouses();
      resizeCanvases();
      window.addEventListener('resize', resizeCanvases);
      playBtn.addEventListener('click', togglePlay);
      resetBtn.addEventListener('click', resetSimulation);
      if (practiceHintBtn) {
        practiceHintBtn.addEventListener('click', function() {
          practiceHintsVisible = !practiceHintsVisible;
          renderPracticeBrief();
        });
      }
      scenarioSelect.addEventListener('change', function(e) {
        currentScenarioId = parseInt(e.target.value);
        resetSimulation();
      });
      document.getElementById('guessA').addEventListener('click', function() { checkSuspectAnswer('Suspect A'); });
      document.getElementById('guessB').addEventListener('click', function() { checkSuspectAnswer('Suspect B'); });
      if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
      resetSimulation();
      feedbackBanner.style.display = 'block';
    }

    return { init: init, resizeCanvases: resizeCanvases, setActive: setActive, resetSimulation: resetSimulation };
  })();


/* ====================================================================== */
/* SECTION 2 – QUIZ ENGINE (Assessment Mode)                              */
/* ====================================================================== */
(function () {
  'use strict';

  var HOUSES = [
    { num: 1, x: 10 },
    { num: 2, x: 20 },
    { num: 3, x: 30 },
    { num: 4, x: 40 },
    { num: 5, x: 50 },
    { num: 6, x: 60 }
  ];

  function randInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
  function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function round(v, d) { var p = Math.pow(10, d || 0); return Math.round(v * p) / p; }
  // Returns a random multiple of 5 in [lo, hi]
  function randMult5(lo, hi) {
    var first = Math.ceil(lo / 5) * 5, last = Math.floor(hi / 5) * 5;
    if (first > last) return first;
    var n = Math.round((last - first) / 5) + 1;
    return first + Math.floor(Math.random() * n) * 5;
  }

  function shuffledCopy(arr) {
    var copy = arr.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = randInt(0, i);
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function kinAt(kfs, t) {
    if (!kfs || !kfs.length) return { x: 0, v: 0 };
    if (t <= kfs[0].t) return { x: kfs[0].x, v: 0 };
    var last = kfs[kfs.length - 1];
    if (t >= last.t) return { x: last.x, v: 0 };
    for (var i = 0; i < kfs.length - 1; i++) {
      if (t >= kfs[i].t && t < kfs[i + 1].t) {
        var dt = kfs[i + 1].t - kfs[i].t;
        var dx = kfs[i + 1].x - kfs[i].x;
        var v = dx / dt;
        return { x: kfs[i].x + v * (t - kfs[i].t), v: v };
      }
    }
    return { x: last.x, v: 0 };
  }

  function segmentVelocities(kfs) {
    var segs = [];
    for (var i = 0; i < kfs.length - 1; i++) {
      var dt = kfs[i + 1].t - kfs[i].t;
      var dx = kfs[i + 1].x - kfs[i].x;
      segs.push({ t1: kfs[i].t, t2: kfs[i + 1].t, x1: kfs[i].x, x2: kfs[i + 1].x, v: dt > 0 ? dx / dt : 0 });
    }
    return segs;
  }

  function loadLogs() {
    if (typeof SCORM !== 'undefined') {
      try {
        var raw = SCORM.getValue('cmi.suspend_data');
        if (raw && raw !== '' && raw !== 'undefined') return JSON.parse(raw);
      } catch (e) { /* ignore */ }
    }
    return {};
  }
  function saveLogs(logs) {
    if (typeof SCORM === 'undefined') return;
    try {
      var payload = JSON.stringify(logs);
      if (payload.length <= 4096) {
        SCORM.setValue('cmi.suspend_data', payload);
        SCORM.commit();
      }
    } catch (e) { /* ignore */ }
  }

  // ── All generators use velocity-first construction so that all positions,
  //    velocities, and numeric answers are exact multiples of 5. ──────────

  function genStopDuration() {
    // v1 ∈ {5,10} → stopX = v1×arriveT (mult 5), stopLen is the answer (whole seconds)
    var v1 = randChoice([5, 10]), arriveT = randInt(2, 4);
    var stopX = v1 * arriveT;
    if (stopX > 55) { v1 = 5; stopX = 5 * arriveT; }
    var stopLen = randChoice([3, 4, 5]);          // answer: seconds stopped
    var leaveT = arriveT + stopLen;
    var v2 = randChoice([5, 10]), afterT = randInt(2, 3);
    var endX = stopX + v2 * afterT;
    if (endX > 65) { v2 = 5; endX = stopX + 5 * afterT; }
    return {
      keyframes: [{t:0,x:0},{t:arriveT,x:stopX},{t:leaveT,x:stopX},{t:leaveT+afterT,x:endX}],
      duration: leaveT + afterT,
      prompt: 'Watch the animation and read the graphs. How many seconds did the truck stop at the delivery house?',
      answer: stopLen, tolerance: 0, unit: 's', inputType: 'number',
      hint: 'On the position-time graph, a flat horizontal line means the truck is stopped. Count the seconds from where the line goes flat to where it starts moving again.'
    };
  }

  function genDeliveryHouse() {
    var fakeHouse = randChoice([2, 3]), realHouse = randChoice([4, 5]);
    var fakeX = fakeHouse * 10, realX = realHouse * 10;
    // approach velocity → arriveT = fakeX/v1 must be integer; both 20 and 30 divide evenly by 5 or 10
    var v1 = randChoice([5, 10]), arriveT = fakeX / v1;
    var t2 = arriveT + 1;                        // 1-second fake stop (< 2 s → not a delivery)
    var dx2 = realX - fakeX;
    var v2 = randChoice([5, 10]);
    if (dx2 % v2 !== 0) v2 = 5;                 // guarantee integer travel time
    var t3 = t2 + dx2 / v2;
    var realStop = randChoice([3, 4, 5]);         // long stop > 2 s → the actual delivery
    var t4 = t3 + realStop;
    var v3 = randChoice([5, 10]), afterT = randInt(2, 3);
    var endX = Math.min(65, realX + v3 * afterT);
    return {
      keyframes: [{t:0,x:0},{t:arriveT,x:fakeX},{t:t2,x:fakeX},{t:t3,x:realX},{t:t4,x:realX},{t:t4+afterT,x:endX}],
      duration: t4 + afterT,
      prompt: 'The truck made two stops. A delivery takes more than 2 seconds. Click on the house that the truck delivered the package to.',
      answer: String(realHouse), tolerance: 0, unit: '', inputType: 'house',
      hint: 'Find the flat section on the position graph that lasts more than 2 seconds. Read the y-value (position) of that flat section and match it to a house.'
    };
  }

  function genReadVelocity() {
    // All segment velocities are multiples of 5 → clean velocity-graph reading
    var v0 = randChoice([5, 10]), startT = randInt(1, 3), x1 = v0 * startT;
    var vel = randChoice([5, 10, 15]), segDur = randInt(2, 4);
    var x2 = x1 + vel * segDur;
    if (x2 > 65) { vel = 5; x2 = x1 + 5 * segDur; }
    var endT = startT + segDur, holdT = endT + randInt(3, 5);
    return {
      keyframes: [{t:0,x:0},{t:startT,x:x1},{t:endT,x:x2},{t:holdT,x:x2}],
      duration: holdT,
      prompt: 'What was the truck\u2019s velocity (in m/s) between t\u202f=\u202f' + startT + '\u202fs and t\u202f=\u202f' + endT + '\u202fs?',
      answer: vel, tolerance: 0, unit: 'm/s', inputType: 'number',
      hint: 'Velocity = \u0394x \u00f7 \u0394t. Read the position at each time from the graph, subtract, then divide by the time interval.'
    };
  }

  function genGreatestVelocity() {
    // One segment has a clearly higher velocity (15 m/s); others are 5 or 10 m/s
    // dt = 2 s per segment keeps positions well within range
    var nSegs = randInt(3, 4);
    var bestIdx = randInt(0, nSegs - 1);
    var vels = [];
    for (var i = 0; i < nSegs; i++) vels.push(i === bestIdx ? 15 : randChoice([5, 10]));
    var pts = [{t:0, x:0}], t = 0;
    for (var i = 0; i < nSegs; i++) {
      t += 2;
      pts.push({t: t, x: Math.min(70, pts[pts.length - 1].x + vels[i] * 2)});
    }
    // Re-derive best index from actual data (clamping may shift it)
    var actualBest = 0, maxV = -Infinity;
    for (var j = 0; j < nSegs; j++) {
      var v = (pts[j + 1].x - pts[j].x) / 2;
      if (v > maxV) { maxV = v; actualBest = j; }
    }
    var choices = [];
    for (var k = 0; k < nSegs; k++) {
      choices.push({ value: String(k), label: pts[k].x + '\u202fm \u2192 ' + pts[k + 1].x + '\u202fm' });
    }
    return {
      keyframes: pts, duration: t,
      prompt: 'Between which two positions was the truck moving with the greatest positive velocity?',
      answer: String(actualBest), tolerance: 0, unit: '', inputType: 'choice', choices: choices,
      hint: 'The steepest upward slope on the position-time graph means the greatest positive velocity. Compare the rise over run for each segment.'
    };
  }

  function genPositionAtTime() {
    // v (mult 5) × askT = answer, always a multiple of 5
    var v = randChoice([5, 10]), tMid = randInt(3, 6);
    var x1 = v * tMid;
    if (x1 > 60) { v = 5; x1 = 5 * tMid; }
    var askT = randInt(1, tMid - 1);
    var posAtT = v * askT;                        // mult of 5
    var holdEnd = tMid + randInt(3, 5);
    var v2 = randChoice([5, 10]), afterT = randInt(2, 3);
    var endX = Math.min(70, x1 + v2 * afterT);
    return {
      keyframes: [{t:0,x:0},{t:tMid,x:x1},{t:holdEnd,x:x1},{t:holdEnd+afterT,x:endX}],
      duration: holdEnd + afterT,
      prompt: 'What was the truck\u2019s position (in meters) at t\u202f=\u202f' + askT + '\u202fs?',
      answer: posAtT, tolerance: 0, unit: 'm', inputType: 'number',
      hint: 'Find t\u202f=\u202f' + askT + ' on the horizontal axis, go straight up to the position line, then read across to the vertical axis.'
    };
  }

  function genTotalDisplacement() {
    // startX and endX both multiples of 5 → displacement is mult of 5
    var startX = randChoice([0, 5, 10]);
    var v1 = randChoice([5, 10]), t1 = randInt(3, 5);
    var midX = startX + v1 * t1;
    if (midX > 65) { v1 = 5; midX = startX + 5 * t1; }
    var stopLen = randInt(2, 3), t2 = t1 + stopLen;
    var v2 = randChoice([5, 10]), t3dur = randInt(2, 4);
    var endX = midX - v2 * t3dur;
    if (endX < 0) { t3dur = Math.floor(midX / 5); endX = midX - 5 * t3dur; }
    if (endX < 0) endX = 0;
    var displacement = endX - startX;
    return {
      keyframes: [{t:0,x:startX},{t:t1,x:midX},{t:t2,x:midX},{t:t2+t3dur,x:endX}],
      duration: t2 + t3dur,
      prompt: 'What was the truck\u2019s total displacement (final position minus initial position) in meters?',
      answer: displacement, tolerance: 0, unit: 'm', inputType: 'number',
      hint: 'Displacement = final position \u2212 initial position. Read the starting and ending y-values on the position-time graph.'
    };
  }

  function genDirectionChange() {
    // v1 (mult 5) × tTurn = turnX (mult 5); answer = tTurn (whole seconds)
    var v1 = randChoice([5, 10]), tTurn = randInt(3, 6);
    var turnX = v1 * tTurn;
    if (turnX > 60) { v1 = 5; turnX = 5 * tTurn; }
    var v2 = randChoice([5, 10]), tRetDur = randInt(3, 5);
    var returnX = turnX - v2 * tRetDur;
    if (returnX < 0) { tRetDur = Math.floor(turnX / 5); returnX = turnX - 5 * tRetDur; }
    if (returnX < 0) returnX = 0;
    return {
      keyframes: [{t:0,x:0},{t:tTurn,x:turnX},{t:tTurn+tRetDur,x:returnX}],
      duration: tTurn + tRetDur,
      prompt: 'At what time (in seconds) did the truck change direction and start moving backwards?',
      answer: tTurn, tolerance: 0, unit: 's', inputType: 'number',
      hint: 'On the position graph, the truck changes direction at the peak (highest point). On the velocity graph, it\u2019s where the line crosses zero.'
    };
  }

  function genNegativeVelocityInterval() {
    // All segment velocities multiples of 5; backward segment is clearly between tPeak and tReturn
    var v1 = randChoice([5, 10, 15]), tPeak = randInt(3, 5);
    var peakX = v1 * tPeak;
    if (peakX > 60) { v1 = 5; peakX = 5 * tPeak; }
    var v2 = randChoice([5, 10]), segDur2 = randInt(3, 5);
    var tReturn = tPeak + segDur2;
    var returnX = peakX - v2 * segDur2;
    if (returnX < 0) { segDur2 = Math.floor(peakX / 5); returnX = peakX - 5 * segDur2; tReturn = tPeak + segDur2; }
    if (returnX < 0) returnX = 0;
    var v3 = randChoice([5, 10]), segDur3 = randInt(2, 4);
    var tEnd = tReturn + segDur3;
    var endX = Math.min(70, returnX + v3 * segDur3);
    return {
      keyframes: [{t:0,x:0},{t:tPeak,x:peakX},{t:tReturn,x:returnX},{t:tEnd,x:endX}],
      duration: tEnd,
      prompt: 'During which time interval was the truck moving in the negative direction (backwards)?',
      answer: '1', tolerance: 0, unit: '', inputType: 'choice',
      choices: [
        { value: '0', label: 't\u202f=\u202f0 to t\u202f=\u202f' + tPeak + '\u202fs' },
        { value: '1', label: 't\u202f=\u202f' + tPeak + ' to t\u202f=\u202f' + tReturn + '\u202fs' },
        { value: '2', label: 't\u202f=\u202f' + tReturn + ' to t\u202f=\u202f' + tEnd + '\u202fs' }
      ],
      hint: 'On the velocity graph, the truck moves backwards when velocity is below zero (negative).'
    };
  }

  function genAverageVelocity() {
    // Templates chosen so average velocity is always a clean multiple of 5.
    var templates = [
      { v1: 10, t1: 2, stop: 2, v2: 5, t2: 2 },
      { v1: 15, t1: 2, stop: 1, v2: 10, t2: 3 },
      { v1: 10, t1: 2, stop: 2, v2: 5, t2: 4 },
      { v1: 10, t1: 2, stop: 1, v2: 15, t2: 2 },
      { v1: 5, t1: 3, stop: 2, v2: 10, t2: 2 }
    ];
    var tmpl = randChoice(templates);
    var midX = tmpl.v1 * tmpl.t1;
    var tStopEnd = tmpl.t1 + tmpl.stop;
    var endX = midX + tmpl.v2 * tmpl.t2;
    var tEnd = tStopEnd + tmpl.t2;
    var avgVelocity = endX / tEnd;

    return {
      keyframes: [{t:0,x:0},{t:tmpl.t1,x:midX},{t:tStopEnd,x:midX},{t:tEnd,x:endX}],
      duration: tEnd,
      prompt: 'What was the truck\'s average velocity over the entire trip? (total displacement ÷ total time)',
      answer: avgVelocity, tolerance: 0, unit: 'm/s', inputType: 'number',
      hint: 'Average velocity = total displacement ÷ total time. Read the final position and total time from the position graph.'
    };
  }

   // ── Generators are designed to keep values readable, graph-friendly,
  //    and within bounds for the shared animation + graph renderer. ──────

  function genAverageSpeed() {
    // Templates chosen so average speed is a clean whole number (5 or 10 m/s)
    // while still being different from average velocity because the truck
    // reverses direction during the trip.
    var templates = [
      { v1:10, t1:2, stop:2, v2:5,  t2:2 }, // distance 30 / time 6 = 5
      { v1:5,  t1:4, stop:2, v2:10, t2:2 }, // distance 40 / time 8 = 5
      { v1:10, t1:2, stop:2, v2:5,  t2:4 }, // distance 40 / time 8 = 5
      { v1:5,  t1:3, stop:2, v2:15, t2:1 }, // distance 30 / time 6 = 5
      { v1:15, t1:2, stop:1, v2:10, t2:1 }, // distance 40 / time 4 = 10
      { v1:15, t1:2, stop:1, v2:10, t2:2 }, // distance 50 / time 5 = 10
      { v1:15, t1:2, stop:1, v2:10, t2:3 }  // distance 60 / time 6 = 10
    ];
    var tmpl = randChoice(templates);

    var peakX = tmpl.v1 * tmpl.t1;
    var tStopEnd = tmpl.t1 + tmpl.stop;
    var endX = peakX - tmpl.v2 * tmpl.t2;
    var tEnd = tStopEnd + tmpl.t2;

    var totalDistance = peakX + (peakX - endX);
    var avgSpeed = totalDistance / tEnd;

    return {
      keyframes: [{t:0,x:0},{t:tmpl.t1,x:peakX},{t:tStopEnd,x:peakX},{t:tEnd,x:endX}],
      duration: tEnd,
      prompt: 'What was the truck’s average speed over the entire trip? (total distance ÷ total time)',
      answer: avgSpeed, tolerance: 0, unit: 'm/s', inputType: 'number',
      hint: 'Average speed uses total distance, not displacement. Add the forward distance and backward distance, then divide by the total time.'
    };
  }

  function genTotalDistance() {
    // peakX and returnX both mult 5 → distance = peakX + (peakX − returnX) is mult 5
    var v1 = randChoice([5, 10]), tPeak = randInt(3, 5);
    var peakX = v1 * tPeak;
    if (peakX > 60) { v1 = 5; peakX = 5 * tPeak; }
    var v2 = randChoice([5, 10]), tRetDur = randInt(3, 5);
    var returnX = peakX - v2 * tRetDur;
    if (returnX < 0) { tRetDur = Math.floor(peakX / 5); returnX = peakX - 5 * tRetDur; }
    if (returnX < 0) returnX = 0;
    var distance = peakX + (peakX - returnX);
    return {
      keyframes: [{t:0,x:0},{t:tPeak,x:peakX},{t:tPeak+tRetDur,x:returnX}],
      duration: tPeak + tRetDur,
      prompt: 'What was the total DISTANCE the truck traveled (not displacement)? Remember: distance counts every meter even when going backwards.',
      answer: distance, tolerance: 0, unit: 'm', inputType: 'number',
      hint: 'Distance = forward distance + backward distance. The truck went from 0 to ' + peakX + '\u202fm, then back to ' + returnX + '\u202fm. Add both segment lengths.'
    };
  }
  function genTimeAtPosition() {
    var v = randChoice([5, 10]);
    var t1 = randInt(4, 6);
    var x1 = v * t1;
    if (x1 > 60) { v = 5; x1 = 5 * t1; }

    var askT = randInt(1, t1 - 1);
    var askX = v * askT;

    var holdLen = randInt(2, 4);
    var t2 = t1 + holdLen;
    var v2 = randChoice([5, 10]);
    var afterT = randInt(2, 3);
    var endX = Math.min(70, x1 + v2 * afterT);

    return {
      keyframes: [{t:0,x:0},{t:t1,x:x1},{t:t2,x:x1},{t:t2+afterT,x:endX}],
      duration: t2 + afterT,
      prompt: 'At what time (in seconds) was the truck at ' + askX + ' m?',
      answer: askT, tolerance: 0, unit: 's', inputType: 'number',
      hint: 'Find ' + askX + ' m on the vertical axis, move across to the position line, then drop down to the time axis.'
    };
  }

  function genZeroVelocityInterval() {
    var v1 = randChoice([5, 10]);
    var t1 = randInt(2, 4);
    var x1 = v1 * t1;
    if (x1 > 55) { v1 = 5; x1 = 5 * t1; }

    var stopLen = randChoice([2, 3, 4]);
    var t2 = t1 + stopLen;

    var v2 = randChoice([5, 10]);
    var move2 = randInt(2, 3);
    var x2 = Math.min(70, x1 + v2 * move2);

    return {
      keyframes: [{t:0,x:0},{t:t1,x:x1},{t:t2,x:x1},{t:t2+move2,x:x2}],
      duration: t2 + move2,
      prompt: 'During which time interval was the truck\u2019s velocity exactly 0 m/s?',
      answer: '1', tolerance: 0, unit: '', inputType: 'choice',
      choices: [
        { value: '0', label: 't = 0 to t = ' + t1 + ' s' },
        { value: '1', label: 't = ' + t1 + ' to t = ' + t2 + ' s' },
        { value: '2', label: 't = ' + t2 + ' to t = ' + (t2 + move2) + ' s' }
      ],
      hint: 'Zero velocity means the truck is stopped. Look for the interval where the position graph is flat or the velocity graph sits on 0.'
    };
  }

  function genGreatestSpeed() {
    var templates = [
      { startX:20, vels:[5, -15, 10] },
      { startX:10, vels:[15, -5, 10] },
      { startX:30, vels:[-10, 15, -5] },
      { startX:20, vels:[10, 5, -15] }
    ];
    var tmpl = randChoice(templates);

    var pts = [{t:0, x:tmpl.startX}];
    var t = 0;
    var i;
    for (i = 0; i < tmpl.vels.length; i++) {
      t += 2;
      pts.push({ t:t, x:pts[pts.length - 1].x + tmpl.vels[i] * 2 });
    }

    var bestIdx = 0;
    var maxSpeed = -1;
    for (i = 0; i < tmpl.vels.length; i++) {
      var spd = Math.abs(tmpl.vels[i]);
      if (spd > maxSpeed) {
        maxSpeed = spd;
        bestIdx = i;
      }
    }

    var choices = [];
    for (i = 0; i < tmpl.vels.length; i++) {
      choices.push({
        value: String(i),
        label: 't = ' + (i * 2) + ' to t = ' + ((i + 1) * 2) + ' s'
      });
    }

    return {
      keyframes: pts,
      duration: t,
      prompt: 'During which time interval was the truck moving with the greatest speed?',
      answer: String(bestIdx), tolerance: 0, unit: '', inputType: 'choice', choices: choices,
      hint: 'Speed means how steep the graph is, regardless of direction. Compare the steepness of each segment.'
    };
  }

  function genPassCountHouse() {
    var targetCount = randChoice([0, 1, 2]);
    var peakHouse, endHouse, askHouse;

    if (targetCount === 2) {
      peakHouse = randChoice([4, 5, 6]);
      endHouse = randChoice([1, 2, 3]);
      if (endHouse >= peakHouse - 1) endHouse = peakHouse - 2;
      askHouse = randInt(endHouse + 1, peakHouse - 1);
    } else if (targetCount === 1) {
      peakHouse = randChoice([4, 5, 6]);
      endHouse = randChoice([2, 3, 4]);
      if (endHouse >= peakHouse) endHouse = peakHouse - 1;
      askHouse = randInt(1, endHouse - 1);
    } else {
      peakHouse = randChoice([2, 3, 4]);
      endHouse = randChoice([1, 2, 3]);
      if (endHouse >= peakHouse) endHouse = peakHouse - 1;
      askHouse = randInt(peakHouse + 1, 6);
    }

    var peakX = peakHouse * 10;
    var endX = endHouse * 10;
    var tPeak = peakHouse; // 10 m/s
    var tEnd = tPeak + (peakHouse - endHouse);

    return {
      keyframes: [{t:0,x:0},{t:tPeak,x:peakX},{t:tEnd,x:endX}],
      duration: tEnd,
      prompt: 'How many times did the truck pass House ' + askHouse + '?',
      answer: String(targetCount), tolerance: 0, unit: '', inputType: 'choice',
      choices: [
        { value: '0', label: '0 times' },
        { value: '1', label: '1 time' },
        { value: '2', label: '2 times' }
      ],
      hint: 'Check whether the truck crosses the house position on the way out, on the way back, or both.'
    };
  }

  function genFirstOrLastTimeAtPosition() {
    var mode = randChoice(['first', 'last']);
    var peakHouse = randChoice([4, 5, 6]);
    var endHouse = randChoice([1, 2, 3]);
    if (endHouse >= peakHouse - 1) endHouse = peakHouse - 2;

    var askHouse = randInt(endHouse + 1, peakHouse - 1);
    var askX = askHouse * 10;

    var peakX = peakHouse * 10;
    var endX = endHouse * 10;

    var tPeak = peakHouse; // 10 m/s forward
    var tEnd = tPeak + (peakHouse - endHouse); // 10 m/s backward

    var firstTime = askHouse;
    var lastTime = tPeak + (peakHouse - askHouse);

    return {
      keyframes: [{t:0,x:0},{t:tPeak,x:peakX},{t:tEnd,x:endX}],
      duration: tEnd,
      prompt: 'What was the ' + mode + ' time (in seconds) that the truck was at ' + askX + ' m?',
      answer: mode === 'first' ? firstTime : lastTime,
      tolerance: 0, unit: 's', inputType: 'number',
      hint: 'This position appears more than once. Find both times where the graph reaches ' + askX + ' m, then choose the ' + mode + ' one.'
    };
  }

  function genTotalTimeMoving() {
    var move1 = randInt(2, 3);
    var move2 = randInt(2, 3);
    var move3 = randInt(2, 3);
    var stop1 = randInt(1, 2);
    var stop2 = randInt(2, 3);

    var v1 = randChoice([5, 10]);
    var v2 = randChoice([5, 10]);
    var v3 = randChoice([5, 10]);

    var x1 = v1 * move1;
    var x2 = x1 + v2 * move2;
    var x3 = x2 + v3 * move3;

    if (x3 > 70) {
      v1 = 5; v2 = 5; v3 = 5;
      x1 = v1 * move1;
      x2 = x1 + v2 * move2;
      x3 = x2 + v3 * move3;
    }

    var t1 = move1;
    var t2 = t1 + stop1;
    var t3 = t2 + move2;
    var t4 = t3 + stop2;
    var t5 = t4 + move3;

    return {
      keyframes: [{t:0,x:0},{t:t1,x:x1},{t:t2,x:x1},{t:t3,x:x2},{t:t4,x:x2},{t:t5,x:x3}],
      duration: t5,
      prompt: 'How many total seconds was the truck moving?',
      answer: move1 + move2 + move3, tolerance: 0, unit: 's', inputType: 'number',
      hint: 'Count only the time intervals where the graph has a slope. Do not include the flat sections where the truck is stopped.'
    };
  }

  function genGraphMatch() {
    var templates = [
      {
        keyframes: [{t:0,x:0},{t:3,x:30},{t:5,x:30},{t:8,x:10}],
        duration: 8,
        description: 'forward, stopped, backward'
      },
      {
        keyframes: [{t:0,x:40},{t:2,x:20},{t:4,x:20},{t:8,x:60}],
        duration: 8,
        description: 'backward, stopped, forward'
      },
      {
        keyframes: [{t:0,x:0},{t:2,x:20},{t:5,x:50},{t:8,x:50}],
        duration: 8,
        description: 'forward, forward, stopped'
      },
      {
        keyframes: [{t:0,x:0},{t:2,x:0},{t:5,x:30},{t:8,x:60}],
        duration: 8,
        description: 'stopped, forward, forward'
      }
    ];
    var correct = randChoice(templates);
    var shuffled = shuffledCopy(templates);
    var labels = ['Graph A', 'Graph B', 'Graph C', 'Graph D'];
    var answer = '0';
    var graphChoices = shuffled.map(function(tmpl, i) {
      var value = String(i);
      if (tmpl === correct) answer = value;
      return {
        value: value,
        label: labels[i],
        keyframes: tmpl.keyframes,
        duration: tmpl.duration,
        description: tmpl.description
      };
    });

    return {
      keyframes: correct.keyframes,
      duration: correct.duration,
      prompt: 'Watch the truck move. Which position-time graph matches the animation?',
      answer: answer, tolerance: 0, unit: '', inputType: 'graph-choice',
      graphMatchType: 'position',
      graphChoices: graphChoices,
      hint: 'Match the story of the motion: upward slope means forward, a flat line means stopped, and a downward slope means backward.'
    };
  }

  function genVelocityGraphMatch() {
    var templates = [
      {
        keyframes: [{t:0,x:10},{t:2,x:40},{t:5,x:40},{t:8,x:10}],
        duration: 8,
        description: 'positive, zero, negative'
      },
      {
        keyframes: [{t:0,x:0},{t:3,x:30},{t:5,x:30},{t:8,x:60}],
        duration: 8,
        description: 'positive, zero, positive'
      },
      {
        keyframes: [{t:0,x:50},{t:2,x:20},{t:5,x:20},{t:8,x:50}],
        duration: 8,
        description: 'negative, zero, positive'
      },
      {
        keyframes: [{t:0,x:30},{t:2,x:30},{t:5,x:60},{t:8,x:30}],
        duration: 8,
        description: 'zero, positive, negative'
      }
    ];
    var correct = randChoice(templates);
    var shuffled = shuffledCopy(templates);
    var labels = ['Graph A', 'Graph B', 'Graph C', 'Graph D'];
    var answer = '0';
    var graphChoices = shuffled.map(function(tmpl, i) {
      var value = String(i);
      if (tmpl === correct) answer = value;
      return {
        value: value,
        label: labels[i],
        keyframes: tmpl.keyframes,
        duration: tmpl.duration,
        description: tmpl.description
      };
    });

    return {
      keyframes: correct.keyframes,
      duration: correct.duration,
      prompt: 'Watch the truck move. Which velocity-time graph matches the animation?',
      answer: answer, tolerance: 0, unit: '', inputType: 'graph-choice',
      graphMatchType: 'velocity',
      graphChoices: graphChoices,
      hint: 'Match the velocity signs: above 0 means forward, on 0 means stopped, and below 0 means backward.'
    };
  }

  function genMotionDescription() {
    var templates = [
      {
        keyframes: [{t:0,x:0},{t:3,x:30},{t:5,x:30},{t:7,x:10}],
        duration: 7,
        answer: '0'
      },
      {
        keyframes: [{t:0,x:40},{t:2,x:20},{t:4,x:20},{t:6,x:50}],
        duration: 6,
        answer: '1'
      },
      {
        keyframes: [{t:0,x:0},{t:2,x:20},{t:4,x:40},{t:6,x:60}],
        duration: 6,
        answer: '2'
      },
      {
        keyframes: [{t:0,x:0},{t:2,x:0},{t:5,x:30}],
        duration: 5,
        answer: '3'
      }
    ];
    var tmpl = randChoice(templates);

    return {
      keyframes: tmpl.keyframes,
      duration: tmpl.duration,
      prompt: 'Which statement best describes the truck\u2019s motion?',
      answer: tmpl.answer, tolerance: 0, unit: '', inputType: 'choice',
      choices: [
        { value: '0', label: 'The truck moved forward, stopped, then moved backward.' },
        { value: '1', label: 'The truck moved backward, stopped, then moved forward.' },
        { value: '2', label: 'The truck moved forward the entire time and never stopped.' },
        { value: '3', label: 'The truck stayed stopped at first, then moved forward.' }
      ],
      hint: 'Read the graph as a story: positive slope = moving forward, flat = stopped, negative slope = moving backward.'
    };
  }
  var QUESTION_DEFS = [
    { id:'q1',  title:'Q1: How long did the truck stop?',       typeBadge:'STOP DURATION',    generate: function() { var q = genStopDuration(); q.hideVelocity = true; return q; } },
    { id:'q2',  title:'Q2: Which house got the delivery?',      typeBadge:'DELIVERY HOUSE',   generate: function() { var q = genDeliveryHouse(); q.hideVelocity = true; return q; } },
    { id:'q3',  title:'Q3: Read the velocity',                  typeBadge:'READ VELOCITY',    primeTruck:true, generate: function() { var q = genReadVelocity(); q.hidePosition = true; return q; } },
    { id:'q4',  title:'Q4: Greatest positive velocity',         typeBadge:'COMPARE SLOPES',   generate: function() { var q = genGreatestVelocity(); q.hideVelocity = true; return q; } },
    { id:'q5',  title:'Q5: Position at a specific time',        typeBadge:'READ POSITION',    generate: function() { var q = genPositionAtTime(); q.hideVelocity = true; return q; } },
    { id:'q6',  title:'Q6: Total displacement',                 typeBadge:'DISPLACEMENT',     primeTruck:true, generate: function() { var q = genTotalDisplacement(); q.hideVelocity = true; return q; } },
    { id:'q7',  title:'Q7: When did the truck turn around?',    typeBadge:'DIRECTION CHANGE', generate: function() { var q = genDirectionChange(); q.hideVelocity = false; q.hidePosition = false; return q; } },
    { id:'q8',  title:'Q8: Negative velocity interval',         typeBadge:'NEG. VELOCITY',    generate: function() { var q = genNegativeVelocityInterval(); q.hidePosition = true; return q; } },
    { id:'q9',  title:'Q9: Average velocity',                   typeBadge:'AVG. VELOCITY',    primeTruck:true, generate: function() { var q = genAverageVelocity(); q.hideVelocity = true; return q; } },
    { id:'q10', title:'Q10: Total distance traveled',           typeBadge:'DISTANCE vs DISP.',generate: function() { var q = genTotalDistance(); q.hideVelocity = true; return q; } },
    { id:'q11', title:'Q11: Time at a specific position',       typeBadge:'TIME FROM POSITION',generate: function() { var q = genTimeAtPosition(); q.hideVelocity = true; return q; } },
    { id:'q12', title:'Q12: Average speed',                     typeBadge:'AVG. SPEED',       primeTruck:true, generate: function() { var q = genAverageSpeed(); q.hideVelocity = true; return q; } },
    { id:'q13', title:'Q13: Pass count at a house',             typeBadge:'REPEATED POSITION',generate: function() { var q = genPassCountHouse(); q.hideVelocity = true; return q; } },
    { id:'q14', title:'Q14: Match the graph to the motion',     typeBadge:'GRAPH MATCH',       generate: function() { var q = genGraphMatch(); q.hideVelocity = true; q.hidePosition = true; return q; } },
    { id:'q15', title:'Q15: Match the velocity graph',          typeBadge:'VELOCITY GRAPH',    primeTruck:true, generate: function() { var q = genVelocityGraphMatch(); q.hideVelocity = true; q.hidePosition = true; return q; } }
  ];

  var state = {
    questions: [], currentIndex: 0, attemptLogs: {}, hintUsed: {},
    animTime: 0, animPlaying: false, animDone: false,
    animReq: null, animLastTs: 0, isActive: false,
    playLocked: true, speedMultiplier: 1, onAnimDone: null,
    selectedHouse: null, advanceTimer: null
  };

  var els = {};

  function cacheEls() {
    els.prevQ       = document.getElementById('prev-question');
    els.nextQ       = document.getElementById('next-question');
    els.qSelect     = document.getElementById('question-select');
    els.qStatusSummary = document.getElementById('question-status-summary');
    els.checkBtn    = document.getElementById('check-answer');
    els.hintBtn     = document.getElementById('hint-btn');
    els.responseCard= document.getElementById('response-card');
    els.responseHelp= document.getElementById('response-help');
    els.responseArea= document.getElementById('response-area');
    els.feedbackSum = document.getElementById('feedback-summary');
    els.feedbackList= document.getElementById('feedback-list');
    els.playBtn     = document.getElementById('assess-play-btn');
    els.resetBtn    = document.getElementById('assess-reset-btn');
    els.timeReadout = document.getElementById('quiz-time-readout');
    els.truck       = document.getElementById('truck');
    els.truckBodyBg = document.getElementById('truckBodyBg');
    els.truckText   = document.getElementById('truckText');
    els.truckCabBg  = document.getElementById('truckCabBg');
    els.housesWrap  = document.getElementById('housesContainer');
    els.posCanvas   = document.getElementById('posCanvas');
    els.velCanvas   = document.getElementById('velCanvas');
    els.posReadout  = document.getElementById('posReadout');
    els.velReadout  = document.getElementById('velReadout');
    els.posContainer= document.getElementById('posContainer');
    els.velContainer= document.getElementById('velContainer');
    els.graphChoiceContainer = document.getElementById('graph-choice-container');
    els.graphChoiceGrid = document.getElementById('graph-choice-grid');
    els.topScore        = document.getElementById('top-bar-score');
    els.overallDisp     = document.getElementById('overall-score-display');
    els.assessmentDirectionsBanner = document.getElementById('assessmentDirectionsBanner');
    els.simStage        = document.getElementById('sim-stage');
    els.graphsRow       = document.getElementById('sim-graphs-row');
    els.completionCard  = document.getElementById('completion-card');
    els.finalScoreDisp  = document.getElementById('final-score-display');
    els.submitScoreBtn  = document.getElementById('submit-score-buzz');
    els.scormStatus     = document.getElementById('scorm-submit-status');
    els.responseArea.addEventListener('paste', function(e) {
      if (e.target.tagName === 'INPUT') e.preventDefault();
    });
    document.addEventListener('copy', function(e) { e.preventDefault(); });
  }

  function setClasses(el, removeList, addList) {
    if (!el) return;
    removeList.forEach(function(cls) { el.classList.remove(cls); });
    addList.forEach(function(cls) { el.classList.add(cls); });
  }

  function setAssessmentTruckTheme(usePrime) {
    setClasses(
      els.truckBodyBg,
      ['from-white', 'to-slate-100', 'border-blue-800', 'text-blue-800', 'from-slate-700', 'to-slate-800', 'border-blue-400', 'text-blue-400'],
      usePrime ? ['from-slate-700', 'to-slate-800', 'border-blue-400', 'text-blue-400'] : ['from-white', 'to-slate-100', 'border-blue-800', 'text-blue-800']
    );
    setClasses(
      els.truckCabBg,
      ['from-blue-700', 'to-blue-900', 'border-blue-800', 'from-slate-800', 'to-slate-900', 'border-slate-900'],
      usePrime ? ['from-slate-800', 'to-slate-900', 'border-slate-900'] : ['from-blue-700', 'to-blue-900', 'border-blue-800']
    );
    if (!els.truckText) return;
    els.truckText.textContent = usePrime ? 'prime' : 'US MAIL';
    if (usePrime) {
      els.truckText.classList.remove('tracking-wider');
      els.truckText.classList.add('tracking-normal', 'italic', 'lowercase', 'text-sm');
    } else {
      els.truckText.classList.remove('tracking-normal', 'italic', 'lowercase', 'text-sm');
      els.truckText.classList.add('tracking-wider');
    }
  }

  function setStageResponseMode(mode) {
    if (!els.simStage) return;
    els.simStage.classList.remove('response-visible', 'response-choice', 'response-note');
    if (!mode || mode === 'empty') return;
    els.simStage.classList.add('response-visible', mode === 'choice' ? 'response-choice' : 'response-note');
  }

  function currentScenario() { return state.questions[state.currentIndex].scenario; }

  function resetAnim() {
    state.animTime = 0; state.animPlaying = false; state.animDone = false;
    if (state.animReq) cancelAnimationFrame(state.animReq);
    state.animReq = null;
    if (els.truck) els.truck.classList.remove('moving');
    if (els.playBtn) els.playBtn.innerHTML = '\u25B6 Play';
    updateAnimUI(); drawGraphsFull();
  }

  function togglePlay() {
    if (state.playLocked) return;
    if (state.animDone) resetAnim();
    state.animPlaying = !state.animPlaying;
    state.speedMultiplier = 1;
    if (state.animPlaying) {
      if (els.playBtn) els.playBtn.innerHTML = '\u23F8 Pause';
      if (els.truck) els.truck.classList.add('moving');
      state.animLastTs = performance.now();
      state.animReq = requestAnimationFrame(animLoop);
    } else {
      if (els.playBtn) els.playBtn.innerHTML = '\u25B6 Play';
      if (els.truck) els.truck.classList.remove('moving');
      if (state.animReq) cancelAnimationFrame(state.animReq);
    }
  }

  function animLoop(ts) {
    if (!state.animPlaying) return;
    var sc = currentScenario();
    var dt = (ts - state.animLastTs) / 1000 * (state.speedMultiplier || 1);
    state.animLastTs = ts;
    state.animTime += dt;
    if (state.animTime >= sc.duration + 0.5) {
      state.animTime = sc.duration; state.animPlaying = false; state.animDone = true;
      state.speedMultiplier = 1;
      if (els.truck) els.truck.classList.remove('moving');
      if (els.playBtn) els.playBtn.innerHTML = '\u21BB Replay';
      if (typeof state.onAnimDone === 'function') { var cb = state.onAnimDone; state.onAnimDone = null; cb(); }
    }
    updateAnimUI(); drawGraphsFull();
    if (state.animPlaying) state.animReq = requestAnimationFrame(animLoop);
  }

  function updateAnimUI() {
    var sc = currentScenario();
    var k = kinAt(sc.keyframes, state.animTime);
    if (els.truck) els.truck.style.left = ((k.x / 70) * 100) + '%';
    if (els.truck) {
      var inner = els.truck.querySelector('.relative');
      if (inner) inner.style.transform = k.v < -0.1 ? 'scaleX(-1)' : 'scaleX(1)';
    }
    if (els.posReadout) els.posReadout.textContent = 'x = ' + k.x.toFixed(1) + ' m';
    if (els.velReadout) els.velReadout.textContent = 'v = ' + k.v.toFixed(1) + ' m/s';
    if (els.timeReadout) els.timeReadout.textContent = 't = ' + state.animTime.toFixed(1) + ' s';
  }

  function fixDPI(canvas) {
    var rect = canvas.parentElement.getBoundingClientRect();
    if (rect.width === 0) return;
    canvas.width = rect.width * (window.devicePixelRatio || 1);
    canvas.height = rect.height * (window.devicePixelRatio || 1);
    canvas.getContext('2d').scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
  }

  function drawGraphsFull() {
    if (!state.questions.length) return;
    var sc = currentScenario();
    if (sc.inputType === 'graph-choice' && sc.graphChoices) {
      drawGraphChoiceCanvases(sc);
      return;
    }
    var maxTime = Math.max(sc.duration + 1, 8);
    var k = kinAt(sc.keyframes, Math.min(state.animTime, sc.duration));
    var posRect = els.posCanvas.parentElement.getBoundingClientRect();
    if (posRect.width > 0) {
      fixDPI(els.posCanvas);
      var ctx = els.posCanvas.getContext('2d');
      drawGrid(ctx, posRect.width, posRect.height, 'Time (s)', 'Position (m)', 0, 70, 10, maxTime, 1);
      drawPosLine(ctx, posRect.width, posRect.height, 0, 70, maxTime, sc.keyframes);
      drawScrub(ctx, posRect.width, posRect.height, maxTime, state.animTime, k.x, 70, 0, sc.duration);
    }
    var velRect = els.velCanvas.parentElement.getBoundingClientRect();
    if (velRect.width > 0) {
      fixDPI(els.velCanvas);
      var ctx2 = els.velCanvas.getContext('2d');
      drawGrid(ctx2, velRect.width, velRect.height, 'Time (s)', 'Velocity (m/s)', -20, 20, 10, maxTime, 1);
      drawVelLine(ctx2, velRect.width, velRect.height, -20, 20, maxTime, sc.keyframes);
      drawScrub(ctx2, velRect.width, velRect.height, maxTime, state.animTime, k.v, 20, -20, sc.duration);
    }
  }

  function drawGrid(ctx, w, h, xLabel, yLabel, yMin, yMax, yStep, xMax, xStep) {
    ctx.clearRect(0, 0, w, h);
    var pX = 44, pY2 = 48, gW = w - pX - 12, gH = h - pY2 - 12, yR = yMax - yMin;
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
    ctx.font = '11px Verdana, Arial, sans-serif'; ctx.fillStyle = '#334155'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (var y = yMin; y <= yMax; y += yStep) {
      var py = 10 + gH - ((y - yMin) / yR) * gH;
      ctx.beginPath(); ctx.moveTo(pX, py); ctx.lineTo(w - 10, py); ctx.stroke();
      ctx.fillText(y, pX - 6, py);
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (var x = 0; x <= xMax; x += xStep) {
      var px = pX + (x / xMax) * gW;
      ctx.beginPath(); ctx.moveTo(px, 10); ctx.lineTo(px, h - pY2); ctx.stroke();
      ctx.fillText(x, px, h - pY2 + 8);
    }
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pX, 10); ctx.lineTo(pX, h - pY2);
    var zeroY = 10 + gH - ((0 - yMin) / yR) * gH;
    ctx.moveTo(pX, zeroY); ctx.lineTo(w - 10, zeroY); ctx.stroke();
    ctx.fillStyle = '#0f172a'; ctx.font = '700 14px Verdana, Arial, sans-serif'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(xLabel, pX + gW / 2, h - 5);
    ctx.save(); ctx.translate(14, 10 + gH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0); ctx.restore();
  }

  function drawPosLine(ctx, w, h, yMin, yMax, xMax, kfs) {
    var pX = 44, pY2 = 48, gW = w - pX - 12, gH = h - pY2 - 12, yR = yMax - yMin;
    ctx.beginPath(); ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    kfs.forEach(function(kf, idx) {
      var px = pX + (kf.t / xMax) * gW;
      var py = 10 + gH - ((kf.x - yMin) / yR) * gH;
      idx === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.stroke();
  }

  function drawVelLine(ctx, w, h, yMin, yMax, xMax, kfs) {
    var pX = 44, pY2 = 48, gW = w - pX - 12, gH = h - pY2 - 12, yR = yMax - yMin;
    ctx.beginPath(); ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 3;
    for (var i = 0; i < kfs.length - 1; i++) {
      var kf1 = kfs[i], kf2 = kfs[i + 1];
      var v = (kf2.x - kf1.x) / (kf2.t - kf1.t);
      var pX1 = pX + (kf1.t / xMax) * gW, pX2 = pX + (kf2.t / xMax) * gW;
      var pYv = 10 + gH - ((v - yMin) / yR) * gH;
      ctx.moveTo(pX1, pYv); ctx.lineTo(pX2, pYv);
      if (i < kfs.length - 2) {
        var kf3 = kfs[i + 2];
        var vNext = (kf3.x - kf2.x) / (kf3.t - kf2.t);
        ctx.moveTo(pX2, pYv); ctx.lineTo(pX2, 10 + gH - ((vNext - yMin) / yR) * gH);
      }
    }
    ctx.stroke();
  }

  function drawScrub(ctx, w, h, xMax, t, yVal, yMax, yMin, dur) {
    var pX = 44, pY2 = 48, gW = w - pX - 12, gH = h - pY2 - 12, yR = yMax - yMin;
    var px = pX + (t / xMax) * gW;
    ctx.beginPath(); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.setLineDash([5,5]);
    ctx.moveTo(px, 10); ctx.lineTo(px, h - pY2); ctx.stroke(); ctx.setLineDash([]);
    if (t <= dur) {
      var py = 10 + gH - ((yVal - yMin) / yR) * gH;
      ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a'; ctx.fill();
    }
  }

  function setGraphPanelVisibility(sc) {
    var graphChoiceMode = sc.inputType === 'graph-choice' && sc.graphChoices;
    if (els.graphChoiceContainer) els.graphChoiceContainer.classList.toggle('hidden', !graphChoiceMode);
    if (els.posContainer) els.posContainer.style.display = graphChoiceMode || sc.hidePosition ? 'none' : 'flex';
    if (els.velContainer) els.velContainer.style.display = graphChoiceMode || sc.hideVelocity ? 'none' : 'flex';
  }

  function renderGraphChoiceGrid(sc) {
    if (!els.graphChoiceGrid || !sc.graphChoices) return;
    els.graphChoiceGrid.innerHTML = sc.graphChoices.map(function(choice, i) {
      return '<label class="graph-choice-item" data-choice-value="' + choice.value + '">' +
        '<span class="graph-choice-label"><input type="radio" name="quiz-graph-choice" value="' + choice.value + '" />' +
        '<span>' + choice.label + '</span></span>' +
        '<span class="graph-choice-canvas-wrap"><canvas id="graph-choice-canvas-' + i + '"></canvas></span>' +
      '</label>';
    }).join('');
    var inputs = els.graphChoiceGrid.querySelectorAll('input[name="quiz-graph-choice"]');
    inputs.forEach(function(input) {
      input.addEventListener('change', function() { submitAnswer(input.value); });
    });
    setTimeout(function() { drawGraphChoiceCanvases(sc); }, 0);
  }

  function drawGraphChoiceCanvases(sc) {
    if (!sc || !sc.graphChoices) return;
    var maxTime = Math.max.apply(null, sc.graphChoices.map(function(choice) { return choice.duration || sc.duration; }));
    sc.graphChoices.forEach(function(choice, i) {
      var canvas = document.getElementById('graph-choice-canvas-' + i);
      if (canvas) drawMiniGraph(canvas, choice.keyframes, maxTime, sc.graphMatchType || 'position');
    });
  }

  function drawMiniGraph(canvas, kfs, xMax, graphType) {
    var rect = canvas.parentElement.getBoundingClientRect();
    if (rect.width === 0) return;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var w = rect.width, h = rect.height;
    var pX = 34, pY2 = 30, top = 10, right = 8;
    var gW = w - pX - right, gH = h - pY2 - top;
    var isVelocity = graphType === 'velocity';
    var yMin = isVelocity ? -20 : 0;
    var yMax = isVelocity ? 20 : 70;
    var yTicks = isVelocity ? [-20, 0, 20] : [0, 35, 70];
    var yR = yMax - yMin;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.font = '10px Verdana, Arial, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    yTicks.forEach(function(y) {
      var py = top + gH - ((y - yMin) / yR) * gH;
      ctx.beginPath(); ctx.moveTo(pX, py); ctx.lineTo(w - right, py); ctx.stroke();
      ctx.fillText(y, pX - 5, py);
    });
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (var x = 0; x <= xMax; x += 2) {
      var px = pX + (x / xMax) * gW;
      ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px, h - pY2); ctx.stroke();
      ctx.fillText(x, px, h - pY2 + 7);
    }
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pX, top);
    ctx.lineTo(pX, h - pY2);
    ctx.lineTo(w - right, h - pY2);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = isVelocity ? '#dc2626' : '#2563eb';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    if (isVelocity) {
      for (var i = 0; i < kfs.length - 1; i++) {
        var kf1 = kfs[i], kf2 = kfs[i + 1];
        var v = (kf2.x - kf1.x) / (kf2.t - kf1.t);
        var pX1 = pX + (kf1.t / xMax) * gW;
        var pX2 = pX + (kf2.t / xMax) * gW;
        var pYv = top + gH - ((v - yMin) / yR) * gH;
        ctx.moveTo(pX1, pYv); ctx.lineTo(pX2, pYv);
        if (i < kfs.length - 2) {
          var kf3 = kfs[i + 2];
          var vNext = (kf3.x - kf2.x) / (kf3.t - kf2.t);
          ctx.moveTo(pX2, pYv); ctx.lineTo(pX2, top + gH - ((vNext - yMin) / yR) * gH);
        }
      }
    } else {
      kfs.forEach(function(kf, idx) {
        var px = pX + (kf.t / xMax) * gW;
        var py = top + gH - ((kf.x - yMin) / yR) * gH;
        idx === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
    }
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 11px Verdana, Arial, sans-serif';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('time', pX + gW / 2, h - 3);
    ctx.save();
    ctx.translate(11, top + gH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(isVelocity ? 'velocity' : 'position', 0, 0);
    ctx.restore();
  }

  function buildQuestions() {
    state.questions = QUESTION_DEFS.map(function(def) {
      return { def: def, scenario: normalizeAssessmentScenario(def.generate()) };
    });
  }

  function normalizeAssessmentScenario(sc) {
    if (sc.inputType === 'number') {
      sc.inputType = 'choice';
      sc.answer = formatChoiceNumber(sc.answer);
      sc.choices = buildNumericChoices(sc);
    } else if (sc.inputType === 'house') {
      sc.lockAssessmentPlayback = true;
      sc.answer = String(sc.answer);
    }
    return sc;
  }

  function formatChoiceNumber(value) {
    var numeric = Number(value);
    if (!isFinite(numeric)) return String(value);
    var rounded = round(numeric, 2);
    return String(rounded).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
  }

  function choiceLabelForNumber(value, unit) {
    return formatChoiceNumber(value) + (unit ? ' ' + unit : '');
  }

  function buildNumericChoices(sc) {
    var answer = Number(sc.answer);
    var unit = sc.unit || '';
    var allowNegative = /displacement|velocity|backwards|negative/i.test(sc.prompt || '') || unit === 'm/s';
    var step = unit === 'm' ? 5 : 1;
    if (unit === 'm/s' && Math.abs(answer % 1) > 0.001) step = 0.5;
    var offsets = [step, -step, step * 2, -step * 2, step * 3, -step * 3, step * 4, -step * 4];
    var values = {};
    var choices = [];

    function add(value) {
      var numeric = Number(value);
      if (!isFinite(numeric)) return;
      if (!allowNegative && numeric < 0) return;
      var formatted = formatChoiceNumber(numeric);
      if (values[formatted]) return;
      values[formatted] = true;
      choices.push({ value: formatted, label: choiceLabelForNumber(numeric, unit) });
    }

    add(answer);
    offsets.forEach(function(offset) { add(answer + offset); });
    var fallback = 0;
    while (choices.length < 4 && fallback < 12) {
      add(answer + ((fallback + 1) * step));
      fallback++;
    }

    var correct = choices[0];
    var distractors = shuffledCopy(choices.slice(1)).slice(0, 3);
    return shuffledCopy([correct].concat(distractors));
  }

  function currentQ() { return state.questions[state.currentIndex]; }

  function bestScore(qId) {
    var logs = state.attemptLogs[qId] || [];
    if (!logs.length) return null;
    return Math.max.apply(null, logs.map(function(l) { return l.score; }));
  }

  function overallScore() {
    if (!state.questions.length) return 0;
    var sum = 0;
    state.questions.forEach(function(q) {
      var b = bestScore(q.def.id);
      sum += (b !== null ? b : 0);
    });
    return sum / state.questions.length;
  }

  function earnedPoints() {
    if (!state.questions.length) return 0;
    var points = 0;
    state.questions.forEach(function(q) {
      var b = bestScore(q.def.id);
      points += (b !== null ? b : 0) / 100;
    });
    return round(points, 2);
  }

  function formatPoints(points) {
    var rounded = round(points, 2);
    return String(rounded).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
  }

  function maxPoints() {
    return state.questions.length || 15;
  }

  function scorePercentFromPoints(points) {
    var max = maxPoints();
    return max ? Math.round((points / max) * 100) : 0;
  }

  function updateScoreBadge() {
    var points = earnedPoints();
    var percent = scorePercentFromPoints(points);
    if (els.topScore) els.topScore.textContent = 'Score: ' + formatPoints(points) + ' / ' + maxPoints();
    if (els.overallDisp) els.overallDisp.textContent = 'Overall: ' + percent + '%';
  }

  function questionStatus(q) {
    var logs = state.attemptLogs[q.def.id] || [];
    if (!logs.length) return 'todo';
    var best = bestScore(q.def.id);
    return best >= 80 ? 'ok' : 'retry';
  }

  function updateQuestionSelectStatus() {
    if (!els.qSelect || !state.questions.length) return;
    var counts = { ok: 0, retry: 0, todo: 0 };
    state.questions.forEach(function(q, i) {
      var status = questionStatus(q);
      counts[status]++;
      var opt = els.qSelect.options[i];
      if (!opt) return;
      opt.textContent = q.def.title;
      opt.className = 'status-' + status;
    });
    var currentStatus = questionStatus(currentQ());
    els.qSelect.classList.remove('status-todo', 'status-ok', 'status-retry');
    els.qSelect.classList.add('status-' + currentStatus);
    if (els.qStatusSummary) {
      els.qStatusSummary.textContent = (counts.ok + counts.retry) + ' / ' + state.questions.length;
    }
  }

  function isAllAttempted() {
    return state.questions.every(function(q) {
      return (state.attemptLogs[q.def.id] || []).length > 0;
    });
  }

  function syncScormProgress() {
    if (typeof SCORM === 'undefined') return;
    var points = earnedPoints();
    var complete = isAllAttempted();
    SCORM.setScore(points, 0, maxPoints());
    SCORM.setStatus(complete ? 'completed' : 'incomplete');
    SCORM.setValue('cmi.core.lesson_location', complete ? 'complete' : 'assessment');
    SCORM.setValue('cmi.comments', 'Motion Graphs Lab score: ' + formatPoints(points) + ' / ' + maxPoints());
    SCORM.commit();
  }

  function renderScormStatus(message) {
    if (!els.scormStatus) return;
    if (message) {
      els.scormStatus.textContent = message;
      return;
    }
    if (isAllAttempted()) {
      els.scormStatus.textContent = 'Submitted to Buzz: ' + formatPoints(earnedPoints()) + ' / ' + maxPoints() + '. You can retry questions and resubmit.';
    } else {
      els.scormStatus.textContent = 'Score saves automatically. Complete all 15 questions to submit completion.';
    }
  }

  function checkCompletion() {
    if (!isAllAttempted()) {
      renderScormStatus();
      return;
    }
    var points = earnedPoints();
    if (els.finalScoreDisp) {
      els.finalScoreDisp.textContent = formatPoints(points) + ' / ' + maxPoints() + ' (' + scorePercentFromPoints(points) + '%)';
    }
    renderScormStatus();
    if (els.completionCard) {
      els.completionCard.classList.remove('hidden');
      els.completionCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function submitScoreToBuzz() {
    syncScormProgress();
    if (isAllAttempted()) {
      renderScormStatus('Submitted to Buzz: ' + formatPoints(earnedPoints()) + ' / ' + maxPoints() + '.');
    } else {
      renderScormStatus('Complete all 15 questions before submitting completion to Buzz.');
    }
  }

  function loadQuestion(idx) {
    if (state.advanceTimer) {
      clearTimeout(state.advanceTimer);
      state.advanceTimer = null;
    }
    state.currentIndex = Math.max(0, Math.min(idx, state.questions.length - 1));
    var q = currentQ(), sc = q.scenario;

    els.qSelect.value = String(state.currentIndex);
    updateQuestionSelectStatus();
    setAssessmentTruckTheme(!!q.def.primeTruck);
    if (els.assessmentDirectionsBanner) els.assessmentDirectionsBanner.textContent = sc.prompt;
    if (els.hintBtn) els.hintBtn.classList.toggle('hidden', !(state.isActive && sc.hint && !state.hintUsed[q.def.id]));
    setGraphPanelVisibility(sc);
    renderResponseArea(); resetAnim();
    if (sc.inputType !== 'house') disableHouseClicks();
    els.feedbackSum.textContent = '';
    els.feedbackSum.className = 'feedback-summary';
    els.feedbackList.innerHTML = '';
    if (sc.lockAssessmentPlayback) lockPlayback();
    else unlockPlayback();
  }

  function lockPlayback() {
    state.playLocked = true;
    if (els.playBtn) { els.playBtn.disabled = true; els.playBtn.style.opacity = '0.4'; els.playBtn.style.pointerEvents = 'none'; }
    if (els.resetBtn) { els.resetBtn.disabled = true; els.resetBtn.style.opacity = '0.4'; els.resetBtn.style.pointerEvents = 'none'; }
  }

  function unlockPlayback() {
    state.playLocked = false;
    if (els.playBtn) { els.playBtn.disabled = false; els.playBtn.style.opacity = ''; els.playBtn.style.pointerEvents = ''; }
    if (els.resetBtn) { els.resetBtn.disabled = false; els.resetBtn.style.opacity = ''; els.resetBtn.style.pointerEvents = ''; }
  }

  function playAt2x(onDone) {
    resetAnim();
    unlockPlayback();
    state.animPlaying = true;
    state.speedMultiplier = 2;
    if (els.playBtn) els.playBtn.innerHTML = '\u25B6 2\u00D7';
    if (els.truck) els.truck.classList.add('moving');
    state.animLastTs = performance.now();
    state.onAnimDone = onDone || null;
    state.animReq = requestAnimationFrame(animLoop);
  }

  function populateSelect() {
    els.qSelect.innerHTML = state.questions.map(function(q, i) {
      return '<option value="' + i + '">' + q.def.title + '</option>';
    }).join('');
    updateQuestionSelectStatus();
  }

  function renderResponseArea() {
    var sc = currentQ().scenario;
    // Hide the response-help text for assessment questions
    els.responseHelp.textContent = '';
    els.responseHelp.style.display = 'none';
    if (els.checkBtn) els.checkBtn.classList.add('hidden');
    clearResponseHighlights();
    clearHouseHighlights();
    els.responseArea.innerHTML = '';
    if (!state.isActive) {
      setStageResponseMode('empty');
      return;
    }
    if (sc.inputType === 'number') {
      setStageResponseMode('note');
      els.responseArea.innerHTML = '<input id="quiz-numeric-input" class="response-input" type="number" step="0.1" placeholder="Your answer" />';
      if (els.checkBtn) els.checkBtn.classList.remove('hidden');
    } else if (sc.inputType === 'choice') {
      setStageResponseMode('choice');
      var html = '<div class="choice-list">';
      sc.choices.forEach(function(c, i) {
        var marker = String.fromCharCode(65 + i);
        html += '<button type="button" class="choice-item" data-choice-value="' + c.value + '">' +
          '<span class="choice-marker">' + marker + '</span><span>' + c.label + '</span></button>';
      });
      html += '</div>';
      els.responseArea.innerHTML = html;
      var choiceButtons = els.responseArea.querySelectorAll('.choice-item[data-choice-value]');
      choiceButtons.forEach(function(btn) {
        btn.addEventListener('click', function() { submitAnswer(btn.getAttribute('data-choice-value')); });
      });
    } else if (sc.inputType === 'graph-choice') {
      setStageResponseMode('note');
      els.responseArea.innerHTML = '<p class="stage-note">Click the matching graph in the graphing section below.</p>';
      renderGraphChoiceGrid(sc);
    } else if (sc.inputType === 'house') {
      setStageResponseMode('note');
      els.responseArea.innerHTML = '<p id="house-selection" class="stage-note">Click on the house that the truck delivered the package to.</p>';
      enableHouseClicks();
    }
  }

  function getResponse() {
    var sc = currentQ().scenario;
    if (sc.inputType === 'number') {
      var el = document.getElementById('quiz-numeric-input');
      if (!el || el.value === '') return null;
      return Number(el.value);
    }
    if (sc.inputType === 'choice') {
      var checked = document.querySelector('input[name="quiz-choice"]:checked');
      return checked ? checked.value : null;
    }
    if (sc.inputType === 'graph-choice') {
      var graphChecked = document.querySelector('input[name="quiz-graph-choice"]:checked');
      return graphChecked ? graphChecked.value : null;
    }
    if (sc.inputType === 'house') {
      return state.selectedHouse !== null ? String(state.selectedHouse) : null;
    }
    return null;
  }

  function clearResponseHighlights() {
    document.querySelectorAll('.choice-item.correct-choice, .choice-item.wrong-choice, .graph-choice-item.correct-choice, .graph-choice-item.wrong-choice').forEach(function(el) {
      el.classList.remove('correct-choice', 'wrong-choice');
    });
  }

  function clearHouseHighlights() {
    if (!els.housesWrap) return;
    Array.prototype.forEach.call(els.housesWrap.children, function(houseEl) {
      houseEl.classList.remove('assessment-correct', 'assessment-wrong');
    });
  }

  function markSelectedResponse(sc, response, passed) {
    var resultClass = passed ? 'correct-choice' : 'wrong-choice';
    clearResponseHighlights();
    if (sc.inputType === 'choice') {
      var choice = els.responseArea.querySelector('.choice-item[data-choice-value="' + response + '"]');
      if (choice) choice.classList.add(resultClass);
    } else if (sc.inputType === 'graph-choice' && els.graphChoiceGrid) {
      var graphChoice = els.graphChoiceGrid.querySelector('.graph-choice-item[data-choice-value="' + response + '"]');
      if (graphChoice) graphChoice.classList.add(resultClass);
    } else if (sc.inputType === 'house') {
      clearHouseHighlights();
      var houseEl = els.housesWrap && els.housesWrap.children[Number(response) - 1];
      if (houseEl) houseEl.classList.add(passed ? 'assessment-correct' : 'assessment-wrong');
    }
  }

  function enableHouseClicks() {
    if (els.housesWrap) els.housesWrap.style.pointerEvents = '';
    state.selectedHouse = null;
  }

  function disableHouseClicks() {
    if (els.housesWrap) els.housesWrap.style.pointerEvents = 'none';
  }

  function handleHouseClick(houseNum) {
    if (!state.isActive) return;
    var sc = currentQ().scenario;
    if (sc.inputType !== 'house') return;
    state.selectedHouse = houseNum;
    var selEl = document.getElementById('house-selection');
    if (selEl) {
      selEl.textContent = 'Selected: House ' + houseNum;
      selEl.className = 'text-blue-700 text-sm font-bold';
    }
    submitAnswer(String(houseNum));
  }

  function grade(sc, response) {
    if (sc.inputType === 'number') {
      var correct = sc.answer, tol = sc.tolerance || 0;
      var err = Math.abs(response - correct);
      var score = err <= tol ? 100 : round(Math.max(0, 100 * (1 - err / (tol * 4 || 1))), 1);
      var feedback = [];
      if (err <= tol) feedback.push('Correct!');
      else feedback.push('Not quite. Review the graph and try again.');
      return { score: score, passed: score >= 80, feedback: feedback, responseSummary: 'Entered ' + response + ' ' + (sc.unit || '') };
    }
    var isCorrect = String(response) === String(sc.answer);
    var choiceLabel = '';
    if (sc.inputType === 'house') {
      choiceLabel = 'House ' + response;
    } else if (sc.choices) {
      sc.choices.forEach(function(c) { if (String(c.value) === String(response)) choiceLabel = c.label; });
    } else if (sc.graphChoices) {
      sc.graphChoices.forEach(function(c) { if (String(c.value) === String(response)) choiceLabel = c.label; });
    }
    var fb = [];
    if (isCorrect) fb.push('Correct!');
    else {
      fb.push('Not quite. Review the graph and try again.');
    }
    return { score: isCorrect ? 100 : 0, passed: isCorrect, feedback: fb, responseSummary: 'Chose: ' + (choiceLabel || response) };
  }

  function submitAnswer(responseOverride) {
    var q = currentQ(), sc = q.scenario;
    var response = responseOverride !== undefined ? responseOverride : getResponse();
    if (response === null || (typeof response === 'number' && isNaN(response))) {
      els.feedbackSum.textContent = 'Enter a response first.';
      els.feedbackSum.className = 'feedback-summary bad';
      els.feedbackList.innerHTML = '';
      return;
    }
    var result = grade(sc, response);
    markSelectedResponse(sc, response, result.passed);
    var usedHint = !!state.hintUsed[q.def.id];
    if (usedHint) {
      result.score = round(result.score * 0.5, 1);
      result.passed = result.score >= 80;
      result.feedback.unshift('Hint was used \u2014 score halved (\u00BD credit). Retry for full credit with new values.');
    }
    var logs = state.attemptLogs[q.def.id] || [];
    logs.push({ attempt: logs.length + 1, score: result.score, passed: result.passed, hintUsed: usedHint, responseSummary: result.responseSummary, timestamp: Date.now() });
    state.attemptLogs[q.def.id] = logs;
    saveLogs(state.attemptLogs);
    syncScormProgress();
    updateQuestionSelectStatus();

    els.feedbackSum.textContent = (result.passed ? 'Passed' : 'Keep trying') + ' \u00B7 ' + result.score.toFixed(1) + '%';
    els.feedbackSum.className = 'feedback-summary ' + (result.score >= 85 ? 'good' : result.score >= 65 ? 'mid' : 'bad');
    els.feedbackList.innerHTML = result.feedback.map(function(f) { return '<li>' + f + '</li>'; }).join('');

    if (usedHint) {
      q.scenario = normalizeAssessmentScenario(q.def.generate());
      state.hintUsed[q.def.id] = false;
      els.feedbackSum.textContent = result.score.toFixed(1) + '% (hint \u2014 \u00BD credit) \u2022 New values loaded \u2014 retry for full credit!';
      els.feedbackSum.className = 'feedback-summary mid';
      if (els.assessmentDirectionsBanner) els.assessmentDirectionsBanner.textContent = q.scenario.prompt;
      setAssessmentTruckTheme(!!q.def.primeTruck);
      setGraphPanelVisibility(q.scenario);
      renderResponseArea(); resetAnim();
      if (els.hintBtn) els.hintBtn.classList.toggle('hidden', !(state.isActive && q.scenario.hint && !state.hintUsed[q.def.id]));
    }

    updateScoreBadge(); checkCompletion();
    if (result.passed) {
      state.advanceTimer = setTimeout(function() {
        state.advanceTimer = null;
        if (state.currentIndex < state.questions.length - 1) {
          loadQuestion(state.currentIndex + 1);
        }
      }, 1200);
    }
  }

  function onHint() {
    var q = currentQ(), sc = q.scenario;
    if (!sc.hint || state.hintUsed[q.def.id]) return;
    state.hintUsed[q.def.id] = true;
    if (!sc.lockAssessmentPlayback) unlockPlayback();
    els.feedbackSum.textContent = 'Hint used \u2014 this attempt is worth \u00BD credit. Retry for full credit.';
    els.feedbackSum.className = 'feedback-summary mid';
    els.feedbackList.innerHTML = '<li>' + sc.hint + '</li>';
    if (els.hintBtn) els.hintBtn.classList.add('hidden');
  }

  function attachEvents() {
    els.prevQ.addEventListener('click', function() { loadQuestion(state.currentIndex - 1); });
    els.nextQ.addEventListener('click', function() { loadQuestion(state.currentIndex + 1); });
    els.qSelect.addEventListener('change', function(e) { loadQuestion(Number(e.target.value)); });
    if (els.checkBtn) els.checkBtn.addEventListener('click', submitAnswer);
    if (els.hintBtn) els.hintBtn.addEventListener('click', onHint);
    if (els.submitScoreBtn) els.submitScoreBtn.addEventListener('click', submitScoreToBuzz);
    els.playBtn.addEventListener('click', togglePlay);
    els.resetBtn.addEventListener('click', resetAnim);
    window.addEventListener('resize', function() { drawGraphsFull(); });
  }

  function setActive(active) {
    state.isActive = !!active;
    if (!state.isActive) {
      state.animPlaying = false;
      if (state.animReq) cancelAnimationFrame(state.animReq);
      state.animReq = null;
      if (els.truck) els.truck.classList.remove('moving');
      if (els.playBtn) els.playBtn.innerHTML = '\u25B6 Play';
      if (els.hintBtn) els.hintBtn.classList.add('hidden');
      setAssessmentTruckTheme(false);
      clearHouseHighlights();
      if (els.responseArea) els.responseArea.innerHTML = '';
      setStageResponseMode('empty');
      return;
    }
    if (state.questions.length) {
      loadQuestion(state.currentIndex);
    } else {
      resetAnim(); drawGraphsFull();
    }
  }

  function init() {
    cacheEls();
    state.attemptLogs = loadLogs();
    buildQuestions(); populateSelect(); attachEvents();
    loadQuestion(0); updateScoreBadge();
    syncScormProgress();
    checkCompletion();
  }

  window.motionSim = {
    start: init,
    overallScore: overallScore,
    earnedPoints: earnedPoints,
    syncScormProgress: syncScormProgress,
    setActive: setActive,
    handleHouseClick: handleHouseClick
  };
})();


/* ====================================================================== */
/* SECTION 3 – MODE MANAGER (Practice / Assessment toggle)                */
/* ====================================================================== */
(function() {
  'use strict';

  var currentMode = 'practice';
  var modePracticeBtn, modeAssessmentBtn, practiceControls, assessmentTopControls;
  var assessmentDirectionsWrapper, assessmentFeedbackPanel, completionCard, feedbackBannerWrapper, practiceBriefShell, practiceStageControls, assessmentStageControls;
  var housesContainer, sharedCardTitle, sharedCardSubtitle;

  function setModeUi(mode) {
    var practice = mode === 'practice';
    currentMode = mode;
    modePracticeBtn.classList.toggle('active', practice);
    modeAssessmentBtn.classList.toggle('active', !practice);
    practiceControls.classList.toggle('hidden', !practice);
    assessmentTopControls.classList.toggle('hidden', practice);
    if (practiceStageControls) practiceStageControls.classList.toggle('hidden', !practice);
    if (assessmentStageControls) assessmentStageControls.classList.toggle('hidden', practice);
    if (assessmentDirectionsWrapper) assessmentDirectionsWrapper.classList.toggle('hidden', practice);
    if (assessmentFeedbackPanel) assessmentFeedbackPanel.classList.toggle('hidden', practice);
    if (completionCard && practice) completionCard.classList.add('hidden');
    practiceBriefShell.classList.remove('hidden');
    feedbackBannerWrapper.classList.toggle('hidden', !practice);
    housesContainer.style.pointerEvents = practice ? '' : 'none';
    // Expose house click handler for assessment mode
    if (!practice && window.motionSim && window.motionSim.handleHouseClick) {
      // pointerEvents will be re-enabled per question by enableHouseClicks
    }
    if (sharedCardTitle) sharedCardTitle.textContent = practice ? 'Mail Carrier Mystery' : 'Graph Reading Assessment';
    if (sharedCardSubtitle) {
      sharedCardSubtitle.textContent = practice
        ? 'Analyze the graphs to find where the package was delivered. A delivery means the truck stopped for more than 2 seconds.'
        : 'Use the same shared truck scene and graphs to answer the 15 graded motion questions.';
    }
  }

  function switchMode(mode) {
    setModeUi(mode);
    if (mode === 'practice') {
      if (window.motionSim && typeof window.motionSim.setActive === 'function') window.motionSim.setActive(false);
      if (window.deliveryMystery && typeof window.deliveryMystery.setActive === 'function') window.deliveryMystery.setActive(true);
    } else {
      if (window.deliveryMystery && typeof window.deliveryMystery.setActive === 'function') window.deliveryMystery.setActive(false);
      if (window.motionSim && typeof window.motionSim.setActive === 'function') window.motionSim.setActive(true);
    }
  }

  function init() {
    modePracticeBtn = document.getElementById('mode-practice-btn');
    modeAssessmentBtn = document.getElementById('mode-assessment-btn');
    practiceControls = document.getElementById('practice-controls');
    assessmentTopControls = document.getElementById('assessment-top-controls');
    practiceStageControls = document.getElementById('practice-stage-controls');
    assessmentStageControls = document.getElementById('assessment-stage-controls');
    assessmentDirectionsWrapper = document.getElementById('assessmentDirectionsWrapper');
    assessmentFeedbackPanel = document.getElementById('assessment-feedback-panel');
    completionCard = document.getElementById('completion-card');
    practiceBriefShell = document.getElementById('practice-brief-shell');
    feedbackBannerWrapper = document.getElementById('feedbackBannerWrapper');
    housesContainer = document.getElementById('housesContainer');
    sharedCardTitle = document.getElementById('shared-card-title');
    sharedCardSubtitle = document.getElementById('shared-card-subtitle');
    modePracticeBtn.addEventListener('click', function() { switchMode('practice'); });
    modeAssessmentBtn.addEventListener('click', function() { switchMode('assessment'); });
    setModeUi('practice');
  }

  window.integratedModes = { init: init, switchMode: switchMode, currentMode: function() { return currentMode; } };
})();


/* ====================================================================== */
/* SECTION 4 – APP BOOTSTRAP / WALKTHROUGH                                */
/* ====================================================================== */
(function() {
  'use strict';

  var WALK_STEPS = [
    {
      title: 'Practice: Mail Carrier Mystery',
      body: 'Hit <b>Play</b> to watch the mail truck deliver packages while position and velocity graphs draw in real time.<br><br>Read the graphs to figure out which house got the delivery. A delivery means the truck <b>stopped for more than 2 seconds</b>!'
    },
    {
      title: 'Reading the Graphs',
      body: '<ul class="list-disc pl-5 space-y-2"><li><span class="eq">Position\u2013Time</span> \u2014 shows <em>where</em> the truck is. Flat line = stopped.</li><li><span class="eq">Velocity\u2013Time</span> \u2014 shows <em>how fast</em>. Zero = stopped.</li><li>Slope of position graph = velocity.</li><li>Area under velocity graph = displacement.</li></ul>'
    },
    {
      title: 'Assessment: 15 Questions',
      body: 'Switch to <b>Assessment</b> mode and answer <b>15 graded questions</b> using the same shared truck scene and graphs:<ul class="list-disc pl-5 mt-2 space-y-1"><li>Read positions, velocities, and stop times</li><li>Identify delivery houses and direction changes</li><li>Calculate displacement, distance, and average velocity</li><li>Match position and velocity graphs to motion</li><li>Track your best score and attempt history</li></ul><br>Each question reuses the same animation stage instead of loading a second scene.'
    },
    {
      title: 'Hints & Scoring',
      body: '<ul class="list-disc pl-5 space-y-2"><li>Click <b>&#128161; Hint</b> for help \u2014 that attempt earns <b>half credit</b>.</li><li>After a hint, <b>new values</b> appear so you can <b>retry for full credit</b>.</li><li>Your <b>best score</b> per question counts toward your grade.</li><li>Grades save <b>automatically</b> after every attempt.</li></ul>'
    },
    {
      title: 'Ready!',
      body: 'Start in <b>Practice</b> mode to build skills, then click <b>Assessment</b> to reuse the same scene for graded questions.<br><br>Click <b>&#128214; Guide</b> in the top bar to see these tips again.'
    }
  ];

  var walkStep = 0;
  var startOverlay, walkOverlay, walkStepLabel, walkTitle, walkBody, walkPrev, walkNext, walkDots;
  var app, showWalkthroughBtn;
  var appInitialized = false;

  function renderWalkthrough() {
    var s = WALK_STEPS[walkStep];
    walkStepLabel.textContent = 'Step ' + (walkStep + 1) + ' of ' + WALK_STEPS.length;
    walkTitle.textContent = s.title;
    walkBody.innerHTML = s.body;
    walkPrev.disabled = walkStep === 0;
    walkNext.textContent = walkStep === WALK_STEPS.length - 1 ? 'Let\u2019s Go!' : 'Next';
    walkDots.innerHTML = '';
    for (var i = 0; i < WALK_STEPS.length; i++) {
      var dot = document.createElement('div');
      dot.className = 'walk-dot' + (i === walkStep ? ' active' : '');
      walkDots.appendChild(dot);
    }
  }

  function openWalkthrough() {
    walkStep = 0;
    renderWalkthrough();
    walkOverlay.classList.remove('hidden');
  }

  function closeWalkthrough() {
    walkOverlay.classList.add('hidden');
  }

  function boot() {
    startOverlay = document.getElementById('start-overlay');
    walkOverlay = document.getElementById('walkthrough-overlay');
    walkStepLabel = document.getElementById('walk-step-label');
    walkTitle = document.getElementById('walk-title');
    walkBody = document.getElementById('walk-body');
    walkPrev = document.getElementById('walk-prev');
    walkNext = document.getElementById('walk-next');
    walkDots = document.getElementById('walk-dots');
    app = document.getElementById('app');
    showWalkthroughBtn = document.getElementById('show-walkthrough');

    walkPrev.addEventListener('click', function() {
      if (walkStep > 0) { walkStep--; renderWalkthrough(); }
    });
    walkNext.addEventListener('click', function() {
      if (walkStep >= WALK_STEPS.length - 1) closeWalkthrough();
      else { walkStep++; renderWalkthrough(); }
    });
    showWalkthroughBtn.addEventListener('click', openWalkthrough);

    document.getElementById('start-btn').addEventListener('click', function() {
      startOverlay.classList.add('hidden');
      if (!appInitialized) {
        appInitialized = true;
        app.classList.remove('hidden');
        deliveryMystery.init();
        if (typeof motionSim !== 'undefined') motionSim.start();
        if (typeof integratedModes !== 'undefined') integratedModes.init();
        if (typeof integratedModes !== 'undefined') integratedModes.switchMode('practice');
      }
    });
  }

  // Wait for DOM before attaching bootstrap listeners
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
