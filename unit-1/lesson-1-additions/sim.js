/* ====================================================================== */
/* sim.js – Unified Motion Graphs Lab Engine                              */
/* Architecture: Shared Physics & Graphics -> Unified CoreApp Loop        */
/* ====================================================================== */

const MotionGraphsLab = (function() {
  'use strict';

  /* ====================================================================== */
  /* 1. SHARED CONSTANTS & UTILITIES                                        */
  /* ====================================================================== */
  const HOUSES = [
    { num: 1, x: 10, color: 'bg-red-400' }, { num: 2, x: 20, color: 'bg-green-400' },
    { num: 3, x: 30, color: 'bg-blue-400' }, { num: 4, x: 40, color: 'bg-yellow-400' },
    { num: 5, x: 50, color: 'bg-purple-400' }, { num: 6, x: 60, color: 'bg-orange-400' }
  ];

  const Utils = {
    randInt: (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1)),
    randChoice: arr => arr[Math.floor(Math.random() * arr.length)],
    round: (v, d) => Math.round(v * Math.pow(10, d || 0)) / Math.pow(10, d || 0),
    shuffledCopy: arr => {
      let copy = arr.slice();
      for (let i = copy.length - 1; i > 0; i--) {
        let j = Utils.randInt(0, i);
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }
  };

  /* ====================================================================== */
  /* 2. PHYSICS ENGINE (Calculates x, v, a from Keyframes)                  */
  /* ====================================================================== */
  const PhysicsEngine = {
    getKinematics: function(keyframes, t, useVel) {
      if (!keyframes || !keyframes.length) return null;
      
      // Velocity-based integration (calculates curves for acceleration)
      if (useVel) {
        if (t <= keyframes[0].t) return { x: 0, v: keyframes[0].v };
        let currentX = 0;
        for (let i = 0; i < keyframes.length - 1; i++) {
          let kf1 = keyframes[i], kf2 = keyframes[i+1];
          if (t > kf2.t) {
            currentX += 0.5 * (kf1.v + kf2.v) * (kf2.t - kf1.t);
          } else {
            let dt = t - kf1.t;
            let a = (kf2.v - kf1.v) / (kf2.t - kf1.t);
            return { x: currentX + kf1.v * dt + 0.5 * a * dt * dt, v: kf1.v + a * dt };
          }
        }
        return { x: currentX, v: keyframes[keyframes.length-1].v };
      } 
      
      // Position-based linear interpolation
      if (t < keyframes[0].t) return { x: keyframes[0].x, v: 0 };
      if (t >= keyframes[keyframes.length-1].t) return { x: keyframes[keyframes.length-1].x, v: 0 };
      for (let i = 0; i < keyframes.length - 1; i++) {
        if (t >= keyframes[i].t && t < keyframes[i+1].t) {
          let dt = keyframes[i+1].t - keyframes[i].t;
          let v = (keyframes[i+1].x - keyframes[i].x) / dt;
          return { x: keyframes[i].x + v * (t - keyframes[i].t), v: v };
        }
      }
      return null;
    }
  };

  /* ====================================================================== */
  /* 3. GRAPHICS ENGINE (Shared Canvas Drawing Logic)                       */
  /* ====================================================================== */
  const GraphicsEngine = {
    fixDPI: function(canvas) {
      let rect = canvas.parentElement.getBoundingClientRect();
      if (rect.width === 0) return { w: 0, h: 0 };
      let dpr = window.devicePixelRatio || 1;
      
      let targetW = Math.round(rect.width * dpr);
      let targetH = Math.round(rect.height * dpr);
      let ctx = canvas.getContext('2d');
      
      // ONLY resize the canvas if the screen size actually changed
      // This stops the layout from jumping 60 times a second!
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
        ctx.scale(dpr, dpr);
      }
      
      return { ctx: ctx, w: rect.width, h: rect.height };
    },
    drawGrid: function(ctx, w, h, xLabel, yLabel, yMin, yMax, yStep, xMax, xStep) {
      ctx.clearRect(0,0,w,h);
      let pX = 44, pY = 48, gW = w - pX - 12, gH = h - pY - 12, yR = yMax - yMin;
      let zeroY = 10 + gH - ((0 - yMin) / yR) * gH;
      
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
      ctx.font = '11px Verdana, Arial, sans-serif'; ctx.fillStyle = '#334155'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (let y = yMin; y <= yMax; y += yStep) {
        let py = 10 + gH - ((y - yMin) / yR) * gH;
        ctx.beginPath(); ctx.moveTo(pX, py); ctx.lineTo(w - 10, py); ctx.stroke();
        ctx.fillText(y, pX - 6, py);
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      for (let x = 0; x <= xMax; x += xStep) {
        let px = pX + (x / xMax) * gW;
        ctx.beginPath(); ctx.moveTo(px, 10); ctx.lineTo(px, h - pY); ctx.stroke();
        ctx.fillText(x, px, h - pY + 8);
      }
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(pX, 10); ctx.lineTo(pX, h - pY);
      ctx.moveTo(pX, zeroY); ctx.lineTo(w - 10, zeroY); ctx.stroke();
      
      ctx.fillStyle = '#0f172a'; ctx.font = '700 14px Verdana, Arial, sans-serif'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(xLabel, pX + gW / 2, h - 5);
      ctx.save(); ctx.translate(14, 10 + gH / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillText(yLabel, 0, 0); ctx.restore();
    },
    drawLine: function(ctx, w, h, yMin, yMax, xMax, keyframes, color, useVel, isVelocityGraph) {
      let pX = 44, pY = 48, gW = w - pX - 12, gH = h - pY - 12, yR = yMax - yMin;
      ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineJoin = 'round';
      
      if (isVelocityGraph) {
        if (useVel) {
          keyframes.forEach((kf, idx) => {
            let px = pX + (kf.t / xMax) * gW, py = 10 + gH - ((kf.v - yMin) / yR) * gH;
            idx === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          });
        } else {
          for (let i = 0; i < keyframes.length - 1; i++) {
            let kf1 = keyframes[i], kf2 = keyframes[i + 1];
            let v = (kf2.x - kf1.x) / (kf2.t - kf1.t);
            let px1 = pX + (kf1.t / xMax) * gW, px2 = pX + (kf2.t / xMax) * gW;
            let py = 10 + gH - ((v - yMin) / yR) * gH;
            ctx.moveTo(px1, py); ctx.lineTo(px2, py);
            if (i < keyframes.length - 2) {
              let kf3 = keyframes[i + 2];
              let vNext = (kf3.x - kf2.x) / (kf3.t - kf2.t);
              ctx.moveTo(px2, py); ctx.lineTo(px2, 10 + gH - ((vNext - yMin) / yR) * gH);
            }
          }
        }
      } else {
        if (useVel) {
          for (let t = 0; t <= xMax; t += 0.1) {
            let kin = PhysicsEngine.getKinematics(keyframes, t, true);
            if (!kin) continue;
            let px = pX + (t / xMax) * gW, py = 10 + gH - ((kin.x - yMin) / yR) * gH;
            t < 0.01 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
        } else {
          keyframes.forEach((kf, idx) => {
            let px = pX + (kf.t / xMax) * gW, py = 10 + gH - ((kf.x - yMin) / yR) * gH;
            idx === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          });
        }
      }
      ctx.stroke();
    },
    drawScrubber: function(ctx, w, h, xMax, t, yVal, yMax, yMin, duration) {
      let pX = 44, pY = 48, gW = w - pX - 12, gH = h - pY - 12, yR = yMax - yMin;
      let px = pX + (t / xMax) * gW;
      ctx.beginPath(); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.setLineDash([5,5]);
      ctx.moveTo(px, 10); ctx.lineTo(px, h - pY); ctx.stroke(); ctx.setLineDash([]);
      if (t <= duration) {
        let py = 10 + gH - ((yVal - yMin) / yR) * gH;
        ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a'; ctx.fill();
      }
    },
    drawMiniGraph: function(canvas, kfs, xMax, type) {
      let dims = GraphicsEngine.fixDPI(canvas);
      if (!dims.w) return;
      let ctx = dims.ctx, w = dims.w, h = dims.h;
      let pX = 34, pY = 30, top = 10, right = 8, gW = w - pX - right, gH = h - pY - top;
      let isVel = type === 'velocity';
      let yMin = isVel ? -20 : 0, yMax = isVel ? 20 : 70, yR = yMax - yMin;
      
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1; ctx.font = '10px Verdana, Arial, sans-serif'; ctx.fillStyle = '#334155';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      
      (isVel ? [-20, 0, 20] : [0, 35, 70]).forEach(y => {
        let py = top + gH - ((y - yMin) / yR) * gH;
        ctx.beginPath(); ctx.moveTo(pX, py); ctx.lineTo(w - right, py); ctx.stroke();
        ctx.fillText(y, pX - 5, py);
      });
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      for (let x = 0; x <= xMax; x += 2) {
        let px = pX + (x / xMax) * gW;
        ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px, h - pY); ctx.stroke();
        ctx.fillText(x, px, h - pY + 7);
      }
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(pX, top); ctx.lineTo(pX, h - pY); ctx.lineTo(w - right, h - pY); ctx.stroke();
      
      // We pass the dimensions inline to reuse the drawLine logic structurally, but scaled for mini
      GraphicsEngine.drawLine(ctx, w + 10, h + 18, yMin, yMax, xMax, kfs, isVel ? '#dc2626' : '#2563eb', false, isVel);
      
      ctx.fillStyle = '#0f172a'; ctx.font = '700 11px Verdana, Arial, sans-serif'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('time', pX + gW / 2, h - 3);
      ctx.save(); ctx.translate(11, top + gH / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillText(isVel ? 'velocity' : 'position', 0, 0); ctx.restore();
    }
  };

  /* ====================================================================== */
  /* 4. DATA (Practice Cases & Assessment Generators)                       */
  /* ====================================================================== */
  const buildMainEnt = (kf, useVel) => [{ id:'truck', isMain:true, color:'#2563eb', useVelocityKeyframes:!!useVel, keyframes:kf }];

  const PracticeCases = [
    { id:0, duration:11, deliveryHouse:3, title:'Case 1: The Simple Stop',
      mission:'Find the only stop that lasts long enough to count as a delivery.',
      clues:['Look for a flat section on the position graph.', 'A delivery means the truck is stopped for more than 2 seconds.'],
      successExplanation:'The truck stayed at 30 m from t = 3 s to t = 7 s, so House 3 got the package.',
      wrongExplanation:'Check which stop lasts longer than 2 seconds. A quick pause does not count as a delivery.',
      entities: buildMainEnt([{t:0,x:0},{t:3,x:30},{t:7,x:30},{t:11,x:70}]) 
    },
    { id:1, duration:14, deliveryHouse:2, title:'Case 2: The Turnaround',
      mission:'The truck reverses direction in this case. Decide which stop is the real delivery.',
      clues:['One stop happens after the truck turns around.', 'Use both direction and stop length.'],
      successExplanation:'House 2 is correct because the truck stops there from t = 6 s to t = 10 s before heading back.',
      wrongExplanation:'Follow the truck through the turnaround. The delivery is the stop that lasts.',
      entities: buildMainEnt([{t:0,x:0},{t:4,x:40},{t:6,x:20},{t:10,x:20},{t:14,x:0}]) 
    },
    { id:2, duration:14, deliveryHouse:5, title:'Case 3: The Fake Out',
      mission:'The truck makes a short fake stop before the real delivery. Separate the decoy from the real drop-off.',
      clues:['There are two stops.', 'Only one stop lasts more than 2 seconds.'],
      successExplanation:'House 5 is correct because the truck only pauses briefly at 30 m, but stays at 50 m from t = 6 s to t = 10 s.',
      wrongExplanation:'The first stop is a decoy. Compare the lengths of the flat sections before choosing a house.',
      entities: buildMainEnt([{t:0,x:0},{t:3,x:30},{t:4,x:30},{t:6,x:50},{t:10,x:50},{t:14,x:70}]) 
    },
    { id:3, duration:16, deliveryHouse:1, hideVelocity:true, title:'Case 4: Broken Speedometer',
      mission:'The velocity graph is gone, so solve the delivery using only the position graph.',
      clues:['Flat horizontal segments mean the truck is stopped.', 'Ignore how steep the line is and focus on the flat interval.'],
      successExplanation:'House 1 is correct because the position graph stays flat at 10 m from t = 6 s to t = 10 s.',
      wrongExplanation:'Find the long flat section on the position graph and match its y-value to a house.',
      entities: buildMainEnt([{t:0,x:0},{t:3,x:30},{t:4,x:30},{t:6,x:10},{t:10,x:10},{t:16,x:70}]) 
    },
    { id:4, duration:17, deliveryHouse:6, hidePosition:true, title:'Case 5: Broken GPS',
      mission:'The position graph is missing. Use velocity and the starting point to infer the delivery location.',
      clues:['The truck starts at x = 0 m.', 'While velocity is 0, position stays constant.'],
      successExplanation:'House 6 is correct because the truck reaches 60 m, stops there, and then later drives back toward the start.',
      wrongExplanation:'Rebuild the truck’s position from the velocity graph.',
      entities: buildMainEnt([{t:0,x:0},{t:4,x:40},{t:5,x:40},{t:7,x:60},{t:11,x:60},{t:17,x:0}]) 
    },
    { id:5, duration:15, deliveryHouse:3, porchPirateMode:true, guiltySuspect:'Suspect B', title:'Case 6: Porch Pirate',
      mission:'First find the delivery house, then decide which suspect appears after the package is dropped.',
      clues:['The package is delivered at House 3.', 'The guilty suspect is the one who reaches the house after the drop.'],
      successExplanation:'Suspect B is guilty because they arrive after the package has been left at House 3.',
      wrongExplanation:'Watch the timing carefully. The thief must appear after the drop, not before it.',
      dropTime:5, theftTime:9,
      entities: [ 
        { id:'truck', isMain:true, color:'#2563eb', keyframes:[{t:0,x:0},{t:4,x:30},{t:7,x:30},{t:11,x:70}] },
        { id:'suspectA', isMain:false, color:'#10b981', keyframes:[{t:0,x:10},{t:5,x:60}] },
        { id:'suspectB', isMain:false, color:'#a855f7', keyframes:[{t:5,x:70},{t:12,x:0}] }
      ] 
    },
    { id:6, duration:16, deliveryHouse:4, hidePosition:true, useVelocityKeyframes:true, title:'Case 7: Accelerating Truck',
      mission:'This time the velocity changes smoothly. Use the area under the velocity graph to locate the delivery.',
      clues:['Area above the axis adds displacement.', 'A delivery happens during the long stop where velocity is 0.'],
      successExplanation:'House 4 is correct. The accumulated displacement reaches 40 m, where it stops.',
      wrongExplanation:'Use the area under the velocity graph to track position.',
      entities: buildMainEnt([{t:0,v:0},{t:2,v:10},{t:4,v:10},{t:6,v:0},{t:10,v:0},{t:12,v:-10},{t:14,v:-10},{t:16,v:0}], true) 
    },
    { id:7, duration:8, graphMatchMode:true, hidePosition:true, hideVelocity:true, title:'Case 8: Match the Graph',
      mission:'Watch the truck move, then choose the position-time graph that matches its motion.',
      clues:['Upward slope means moving forward.', 'A flat section means stopped.'],
      successExplanation:'Graph C matches the animation: the truck moves forward, stops, then moves forward again.',
      wrongExplanation:'Compare the story of the motion.',
      graphAnswer:'2',
      entities: buildMainEnt([{t:0,x:0},{t:2,x:20},{t:4,x:20},{t:8,x:60}]),
      graphChoices:[
        { value:'0', label:'Graph A', duration:8, keyframes:[{t:0,x:0},{t:2,x:20},{t:4,x:20},{t:8,x:0}] },
        { value:'1', label:'Graph B', duration:8, keyframes:[{t:0,x:40},{t:2,x:20},{t:4,x:20},{t:8,x:60}] },
        { value:'2', label:'Graph C', duration:8, keyframes:[{t:0,x:0},{t:2,x:20},{t:4,x:20},{t:8,x:60}] },
        { value:'3', label:'Graph D', duration:8, keyframes:[{t:0,x:10},{t:2,x:10},{t:5,x:40},{t:8,x:20}] }
      ] 
    },
    { id:8, duration:8, graphMatchMode:true, graphMatchType:'velocity', hidePosition:true, hideVelocity:true, title:'Case 9: Match Velocity Graph',
      mission:'Watch the truck move, then choose the velocity-time graph that matches its motion.',
      clues:['A line above 0 means the truck moves forward.', 'A line on 0 means stopped.'],
      successExplanation:'Graph B matches the animation: positive velocity, then zero velocity, then negative velocity.',
      wrongExplanation:'Match the direction and stop.',
      graphAnswer:'1',
      entities: buildMainEnt([{t:0,x:10},{t:2,x:40},{t:5,x:40},{t:8,x:10}]),
      graphChoices:[
        { value:'0', label:'Graph A', duration:8, keyframes:[{t:0,x:10},{t:2,x:40},{t:5,x:40},{t:8,x:70}] },
        { value:'1', label:'Graph B', duration:8, keyframes:[{t:0,x:10},{t:2,x:40},{t:5,x:40},{t:8,x:10}] },
        { value:'2', label:'Graph C', duration:8, keyframes:[{t:0,x:40},{t:2,x:10},{t:5,x:10},{t:8,x:55}] },
        { value:'3', label:'Graph D', duration:8, keyframes:[{t:0,x:20},{t:2,x:20},{t:5,x:50},{t:8,x:20}] }
      ] 
    },
    { id:9, duration:16, deliveryHouse:6, porchPirateMode:true, guiltySuspect:'Suspect A', title:'Case 10: The Decoy Drop (2 Vans)',
      mission:'Two vans, one pirate. Watch the Gray Express van. Who steals its package?',
      clues:['The Express van delivers at House 6.', 'Suspect A arrives after the drop.'],
      successExplanation:'Suspect A reached House 6 after the Express van dropped the package.',
      wrongExplanation:'Watch the timing. The thief arrives AFTER the delivery.',
      dropTime:8, theftTime:11,
      entities: [
        { id:'truck', isMain:true, color:'#2563eb', keyframes:[{t:0,x:0},{t:4,x:20},{t:7,x:20},{t:16,x:70}] }, 
        { id:'truck2', isMain:false, color:'#475569', keyframes:[{t:0,x:0},{t:3,x:40},{t:4,x:40},{t:8,x:60},{t:12,x:60},{t:16,x:0}] },
        { id:'suspectA', isMain:false, color:'#10b981', keyframes:[{t:0,x:0},{t:10,x:50},{t:16,x:80}] }
      ] 
    },
    { id:10, duration:12, deliveryHouse:3, title:'Case 11: The Getaway Car',
      mission:'The mail van drops a package, and a fast getaway car steals it! Click the house where the theft happened.',
      clues:['The mail van stops for 3 seconds.', 'The getaway car is much faster (steeper slope) and stops briefly at the same house.'],
      successExplanation:'House 3 is correct. The getaway car stopped there exactly when the package was waiting.',
      wrongExplanation:'Find where the fast red line stops at the same position the blue line stopped earlier.',
      entities: [
        { id:'truck', isMain:true, color:'#2563eb', keyframes:[{t:0,x:0},{t:3,x:30},{t:6,x:30},{t:10,x:70},{t:12,x:70}] },
        { id:'truck2', isMain:false, color:'#dc2626', keyframes:[{t:3,x:0},{t:5,x:30},{t:6,x:30},{t:8,x:70},{t:12,x:70}] }
      ] 
    },
    { id:11, duration:15, deliveryHouse:4, porchPirateMode:true, guiltySuspect:'Suspect B', title:'Case 12: Intersection Hand-off',
      mission:'The vans meet to transfer a package. Who steals it after they leave?',
      clues:['The intersection of the blue and gray lines is the hand-off location.', 'Find who visits that house AFTER the vans leave.'],
      successExplanation:'Suspect B reached House 4 at t=11s, after the vans left the package at t=9s.',
      wrongExplanation:'Suspect A passed by too early. The thief arrives after the hand-off is complete.',
      dropTime:8, theftTime:11,
      entities: [
        { id:'truck', isMain:true, color:'#2563eb', keyframes:[{t:0,x:0},{t:6,x:40},{t:9,x:40},{t:15,x:70}] },
        { id:'truck2', isMain:false, color:'#475569', keyframes:[{t:0,x:70},{t:6,x:40},{t:9,x:40},{t:15,x:0}] },
        { id:'suspectA', isMain:false, color:'#10b981', keyframes:[{t:0,x:20},{t:6,x:50},{t:15,x:50}] },
        { id:'suspectB', isMain:false, color:'#a855f7', keyframes:[{t:4,x:10},{t:13,x:55},{t:15,x:55}] }
      ] 
    },
    { id:12, duration:16, deliveryHouse:5, porchPirateMode:true, guiltySuspect:'Suspect B', title:'Case 13: Double Heist Chaos',
      mission:'Both vans make drops, both packages are stolen! Who stole the EXPRESS van\'s package at House 5?',
      clues:['Focus ONLY on the Gray Express van\'s delivery.', 'Suspect B arrives at House 5 after the Express van drops.'],
      successExplanation:'Suspect B stole the Express package at House 5. (Suspect A stole the Mail package at House 2).',
      wrongExplanation:'Trace the Gray line to find its drop, then see which suspect crosses that position later.',
      dropTime:7, theftTime:12,
      entities: [
        { id:'truck', isMain:true, color:'#2563eb', keyframes:[{t:0,x:0},{t:4,x:20},{t:7,x:20},{t:16,x:60}] },
        { id:'truck2', isMain:false, color:'#475569', keyframes:[{t:0,x:10},{t:4,x:50},{t:7,x:50},{t:12,x:70},{t:16,x:70}] },
        { id:'suspectA', isMain:false, color:'#10b981', keyframes:[{t:0,x:0},{t:12,x:40},{t:16,x:40}] },
        { id:'suspectB', isMain:false, color:'#a855f7', keyframes:[{t:0,x:20},{t:6,x:20},{t:14,x:60},{t:16,x:60}] }
      ] 
    }
  ];

 // Assessment Generators (Dynamically builds scenarios wrapping keyframes in entities arrays)
  const AssessmentGenerators = [
    { id:'q1', title:'Q1: How long did the truck stop?', generate: () => {
        let v1 = Utils.randChoice([5, 10]), arriveT = Utils.randInt(2, 4);
        let stopX = v1 * arriveT;
        if (stopX > 55) { v1 = 5; stopX = 5 * arriveT; }
        let stopLen = Utils.randChoice([3, 4, 5]);
        let leaveT = arriveT + stopLen;
        let v2 = Utils.randChoice([5, 10]), afterT = Utils.randInt(2, 3);
        let endX = stopX + v2 * afterT;
        if (endX > 65) { v2 = 5; endX = stopX + 5 * afterT; }
        return {
          entities: buildMainEnt([{t:0,x:0},{t:arriveT,x:stopX},{t:leaveT,x:stopX},{t:leaveT+afterT,x:endX}]),
          duration: leaveT + afterT, hideVelocity: true,
          prompt: 'Watch the animation and read the graphs. How many seconds did the truck stop at the delivery house?',
          answer: stopLen, inputType: 'number', unit: 's', tolerance: 0,
          hint: 'Zoom in on the graph.'
        };
    }},
    { id:'q2', title:'Q2: Which house got the delivery?', generate: () => {
        let fakeHouse = Utils.randChoice([2, 3]), realHouse = Utils.randChoice([4, 5]);
        let fakeX = fakeHouse * 10, realX = realHouse * 10;
        let v1 = Utils.randChoice([5, 10]), arriveT = fakeX / v1;
        let t2 = arriveT + 1;
        let dx2 = realX - fakeX;
        let v2 = Utils.randChoice([5, 10]);
        if (dx2 % v2 !== 0) v2 = 5;
        let t3 = t2 + dx2 / v2;
        let realStop = Utils.randChoice([3, 4, 5]);
        let t4 = t3 + realStop;
        let v3 = Utils.randChoice([5, 10]), afterT = Utils.randInt(2, 3);
        let endX = Math.min(65, realX + v3 * afterT);
        return {
          entities: buildMainEnt([{t:0,x:0},{t:arriveT,x:fakeX},{t:t2,x:fakeX},{t:t3,x:realX},{t:t4,x:realX},{t:t4+afterT,x:endX}]),
          duration: t4 + afterT, hideVelocity: true,
          prompt: 'The truck made two stops. A delivery takes more than 2 seconds. At which house number did the truck deliver the package?',
          answer: String(realHouse), inputType: 'house', tolerance: 0,
          hint: 'Find the flat section on the position graph that lasts more than 2 seconds. Read the y-value (position) of that flat section and match it to a house.'
        };
    }},
    { id:'q3', title:'Q3: Read the velocity', generate: () => {
        let v0 = Utils.randChoice([5, 10]), startT = Utils.randInt(1, 3), x1 = v0 * startT;
        let vel = Utils.randChoice([5, 10, 15]), segDur = Utils.randInt(2, 4);
        let x2 = x1 + vel * segDur;
        if (x2 > 65) { vel = 5; x2 = x1 + 5 * segDur; }
        let endT = startT + segDur, holdT = endT + Utils.randInt(3, 5);
        return {
          entities: buildMainEnt([{t:0,x:0},{t:startT,x:x1},{t:endT,x:x2},{t:holdT,x:x2}]),
          duration: holdT, hidePosition: true,
          prompt: 'What was the truck\u2019s velocity (in m/s) between t\u202f=\u202f' + startT + '\u202fs and t\u202f=\u202f' + endT + '\u202fs?',
          answer: vel, inputType: 'number', tolerance: 0, unit: 'm/s',
          hint: 'Velocity = \u0394x \u00f7 \u0394t. Read the position at each time from the graph, subtract, then divide by the time interval.'
        };
    }},
    { id:'q4', title:'Q4: Greatest positive velocity', generate: () => {
        let nSegs = Utils.randInt(3, 4);
        let bestIdx = Utils.randInt(0, nSegs - 1);
        let vels = [];
        for (let i = 0; i < nSegs; i++) vels.push(i === bestIdx ? 15 : Utils.randChoice([5, 10]));
        let pts = [{t:0, x:0}], t = 0;
        for (let i = 0; i < nSegs; i++) {
          t += 2;
          pts.push({t: t, x: Math.min(70, pts[pts.length - 1].x + vels[i] * 2)});
        }
        let actualBest = 0, maxV = -Infinity;
        for (let j = 0; j < nSegs; j++) {
          let v = (pts[j + 1].x - pts[j].x) / 2;
          if (v > maxV) { maxV = v; actualBest = j; }
        }
        let choices = [];
        for (let k = 0; k < nSegs; k++) {
          choices.push({ value: String(k), label: pts[k].x + '\u202fm \u2192 ' + pts[k + 1].x + '\u202fm' });
        }
        return {
          entities: buildMainEnt(pts), duration: t, hideVelocity: true,
          prompt: 'Between which two positions was the truck moving with the greatest positive velocity?',
          answer: String(actualBest), inputType: 'choice', choices: choices, tolerance: 0,
          hint: 'The steepest upward slope on the position-time graph means the greatest positive velocity. Compare the rise over run for each segment.'
        };
    }},
    { id:'q5', title:'Q5: Position at a specific time', generate: () => {
        let v = Utils.randChoice([5, 10]), tMid = Utils.randInt(3, 6);
        let x1 = v * tMid;
        if (x1 > 60) { v = 5; x1 = 5 * tMid; }
        let askT = Utils.randInt(1, tMid - 1);
        let posAtT = v * askT;
        let holdEnd = tMid + Utils.randInt(3, 5);
        let v2 = Utils.randChoice([5, 10]), afterT = Utils.randInt(2, 3);
        let endX = Math.min(70, x1 + v2 * afterT);
        return {
          entities: buildMainEnt([{t:0,x:0},{t:tMid,x:x1},{t:holdEnd,x:x1},{t:holdEnd+afterT,x:endX}]),
          duration: holdEnd + afterT, hideVelocity: true,
          prompt: 'What was the truck\u2019s position (in metres) at t\u202f=\u202f' + askT + '\u202fs?',
          answer: posAtT, inputType: 'number', unit: 'm', tolerance: 0,
          hint: 'Find t\u202f=\u202f' + askT + ' on the horizontal axis, go straight up to the position line, then read across to the vertical axis.'
        };
    }},
    { id:'q6', title:'Q6: Total displacement', generate: () => {
        let startX = Utils.randChoice([0, 5, 10]);
        let v1 = Utils.randChoice([5, 10]), t1 = Utils.randInt(3, 5);
        let midX = startX + v1 * t1;
        if (midX > 65) { v1 = 5; midX = startX + 5 * t1; }
        let stopLen = Utils.randInt(2, 3), t2 = t1 + stopLen;
        let v2 = Utils.randChoice([5, 10]), t3dur = Utils.randInt(2, 4);
        let endX = midX - v2 * t3dur;
        if (endX < 0) { t3dur = Math.floor(midX / 5); endX = midX - 5 * t3dur; }
        if (endX < 0) endX = 0;
        let displacement = endX - startX;
        return {
          entities: buildMainEnt([{t:0,x:startX},{t:t1,x:midX},{t:t2,x:midX},{t:t2+t3dur,x:endX}]),
          duration: t2 + t3dur, hideVelocity: true,
          prompt: 'What was the truck\u2019s total displacement (final position minus initial position) in metres?',
          answer: displacement, inputType: 'number', unit: 'm', tolerance: 0,
          hint: 'Displacement = final position \u2212 initial position. Read the starting and ending y-values on the position-time graph.'
        };
    }},
    { id:'q7', title:'Q7: When did the truck turn around?', generate: () => {
        let v1 = Utils.randChoice([5, 10]), tTurn = Utils.randInt(3, 6);
        let turnX = v1 * tTurn;
        if (turnX > 60) { v1 = 5; turnX = 5 * tTurn; }
        let v2 = Utils.randChoice([5, 10]), tRetDur = Utils.randInt(3, 5);
        let returnX = turnX - v2 * tRetDur;
        if (returnX < 0) { tRetDur = Math.floor(turnX / 5); returnX = turnX - 5 * tRetDur; }
        if (returnX < 0) returnX = 0;
        return {
          entities: buildMainEnt([{t:0,x:0},{t:tTurn,x:turnX},{t:tTurn+tRetDur,x:returnX}]),
          duration: tTurn + tRetDur, hideVelocity: false, hidePosition: false,
          prompt: 'At what time (in seconds) did the truck change direction and start moving backwards?',
          answer: tTurn, inputType: 'number', unit: 's', tolerance: 0,
          hint: 'On the position graph, the truck changes direction at the peak (highest point). On the velocity graph, it\u2019s where the line crosses zero.'
        };
    }},
    { id:'q8', title:'Q8: Negative velocity interval', generate: () => {
        let v1 = Utils.randChoice([5, 10, 15]), tPeak = Utils.randInt(3, 5);
        let peakX = v1 * tPeak;
        if (peakX > 60) { v1 = 5; peakX = 5 * tPeak; }
        let v2 = Utils.randChoice([5, 10]), segDur2 = Utils.randInt(3, 5);
        let tReturn = tPeak + segDur2;
        let returnX = peakX - v2 * segDur2;
        if (returnX < 0) { segDur2 = Math.floor(peakX / 5); returnX = peakX - 5 * segDur2; tReturn = tPeak + segDur2; }
        if (returnX < 0) returnX = 0;
        let v3 = Utils.randChoice([5, 10]), segDur3 = Utils.randInt(2, 4);
        let tEnd = tReturn + segDur3;
        let endX = Math.min(70, returnX + v3 * segDur3);
        return {
          entities: buildMainEnt([{t:0,x:0},{t:tPeak,x:peakX},{t:tReturn,x:returnX},{t:tEnd,x:endX}]),
          duration: tEnd, hidePosition: true,
          prompt: 'During which time interval was the truck moving in the negative direction (backwards)?',
          answer: '1', inputType: 'choice', tolerance: 0,
          choices: [
            { value: '0', label: 't\u202f=\u202f0 to t\u202f=\u202f' + tPeak + '\u202fs' },
            { value: '1', label: 't\u202f=\u202f' + tPeak + ' to t\u202f=\u202f' + tReturn + '\u202fs' },
            { value: '2', label: 't\u202f=\u202f' + tReturn + ' to t\u202f=\u202f' + tEnd + '\u202fs' }
          ],
          hint: 'On the velocity graph, the truck moves backwards when velocity is below zero (negative).'
        };
    }},
    { id:'q9', title:'Q9: Average velocity', generate: () => {
        let templates = [
          { v1: 10, t1: 2, stop: 2, v2: 5, t2: 2 },
          { v1: 15, t1: 2, stop: 1, v2: 10, t2: 3 },
          { v1: 10, t1: 2, stop: 2, v2: 5, t2: 4 },
          { v1: 10, t1: 2, stop: 1, v2: 15, t2: 2 },
          { v1: 5, t1: 3, stop: 2, v2: 10, t2: 2 }
        ];
        let tmpl = Utils.randChoice(templates);
        let midX = tmpl.v1 * tmpl.t1;
        let tStopEnd = tmpl.t1 + tmpl.stop;
        let endX = midX + tmpl.v2 * tmpl.t2;
        let tEnd = tStopEnd + tmpl.t2;
        let avgVelocity = endX / tEnd;
        return {
          entities: buildMainEnt([{t:0,x:0},{t:tmpl.t1,x:midX},{t:tStopEnd,x:midX},{t:tEnd,x:endX}]),
          duration: tEnd, hideVelocity: true,
          prompt: 'What was the truck\'s average velocity over the entire trip? (total displacement ÷ total time)',
          answer: avgVelocity, inputType: 'number', unit: 'm/s', tolerance: 0,
          hint: 'Average velocity = total displacement ÷ total time. Read the final position and total time from the position graph.'
        };
    }},
    { id:'q10', title:'Q10: Total distance traveled', generate: () => {
        let v1 = Utils.randChoice([5, 10]), tPeak = Utils.randInt(3, 5);
        let peakX = v1 * tPeak;
        if (peakX > 60) { v1 = 5; peakX = 5 * tPeak; }
        let v2 = Utils.randChoice([5, 10]), tRetDur = Utils.randInt(3, 5);
        let returnX = peakX - v2 * tRetDur;
        if (returnX < 0) { tRetDur = Math.floor(peakX / 5); returnX = peakX - 5 * tRetDur; }
        if (returnX < 0) returnX = 0;
        let distance = peakX + (peakX - returnX);
        return {
          entities: buildMainEnt([{t:0,x:0},{t:tPeak,x:peakX},{t:tPeak+tRetDur,x:returnX}]),
          duration: tPeak + tRetDur, hideVelocity: true,
          prompt: 'What was the total DISTANCE the truck traveled (not displacement)? Remember: distance counts every metre even when going backwards.',
          answer: distance, inputType: 'number', unit: 'm', tolerance: 0,
          hint: 'Distance = forward distance + backward distance. The truck went from 0 to ' + peakX + '\u202fm, then back to ' + returnX + '\u202fm. Add both segment lengths.'
        };
    }},
    { id:'q11', title:'Q11: Time at a specific position', generate: () => {
        let v = Utils.randChoice([5, 10]);
        let t1 = Utils.randInt(4, 6);
        let x1 = v * t1;
        if (x1 > 60) { v = 5; x1 = 5 * t1; }
        let askT = Utils.randInt(1, t1 - 1);
        let askX = v * askT;
        let holdLen = Utils.randInt(2, 4);
        let t2 = t1 + holdLen;
        let v2 = Utils.randChoice([5, 10]);
        let afterT = Utils.randInt(2, 3);
        let endX = Math.min(70, x1 + v2 * afterT);
        return {
          entities: buildMainEnt([{t:0,x:0},{t:t1,x:x1},{t:t2,x:x1},{t:t2+afterT,x:endX}]),
          duration: t2 + afterT, hideVelocity: true,
          prompt: 'At what time (in seconds) was the truck at ' + askX + ' m?',
          answer: askT, inputType: 'number', unit: 's', tolerance: 0,
          hint: 'Find ' + askX + ' m on the vertical axis, move across to the position line, then drop down to the time axis.'
        };
    }},
    { id:'q12', title:'Q12: Average speed', generate: () => {
        let templates = [
          { v1:10, t1:2, stop:2, v2:5,  t2:2 }, 
          { v1:5,  t1:4, stop:2, v2:10, t2:2 }, 
          { v1:10, t1:2, stop:2, v2:5,  t2:4 }, 
          { v1:5,  t1:3, stop:2, v2:15, t2:1 }, 
          { v1:15, t1:2, stop:1, v2:10, t2:1 }, 
          { v1:15, t1:2, stop:1, v2:10, t2:2 }, 
          { v1:15, t1:2, stop:1, v2:10, t2:3 }  
        ];
        let tmpl = Utils.randChoice(templates);
        let peakX = tmpl.v1 * tmpl.t1;
        let tStopEnd = tmpl.t1 + tmpl.stop;
        let endX = peakX - tmpl.v2 * tmpl.t2;
        let tEnd = tStopEnd + tmpl.t2;
        let totalDistance = peakX + (peakX - endX);
        let avgSpeed = totalDistance / tEnd;
        return {
          entities: buildMainEnt([{t:0,x:0},{t:tmpl.t1,x:peakX},{t:tStopEnd,x:peakX},{t:tEnd,x:endX}]),
          duration: tEnd, hideVelocity: true,
          prompt: 'What was the truck’s average speed over the entire trip? (total distance ÷ total time)',
          answer: avgSpeed, inputType: 'number', unit: 'm/s', tolerance: 0,
          hint: 'Average speed uses total distance, not displacement. Add the forward distance and backward distance, then divide by the total time.'
        };
    }},
    { id:'q13', title:'Q13: Pass count at a house', generate: () => {
        let targetCount = Utils.randChoice([0, 1, 2]);
        let peakHouse, endHouse, askHouse;
        if (targetCount === 2) {
          peakHouse = Utils.randChoice([4, 5, 6]);
          endHouse = Utils.randChoice([1, 2, 3]);
          if (endHouse >= peakHouse - 1) endHouse = peakHouse - 2;
          askHouse = Utils.randInt(endHouse + 1, peakHouse - 1);
        } else if (targetCount === 1) {
          peakHouse = Utils.randChoice([4, 5, 6]);
          endHouse = Utils.randChoice([2, 3, 4]);
          if (endHouse >= peakHouse) endHouse = peakHouse - 1;
          askHouse = Utils.randInt(1, endHouse - 1);
        } else {
          peakHouse = Utils.randChoice([2, 3, 4]);
          endHouse = Utils.randChoice([1, 2, 3]);
          if (endHouse >= peakHouse) endHouse = peakHouse - 1;
          askHouse = Utils.randInt(peakHouse + 1, 6);
        }
        let peakX = peakHouse * 10;
        let endX = endHouse * 10;
        let tPeak = peakHouse; 
        let tEnd = tPeak + (peakHouse - endHouse);
        return {
          entities: buildMainEnt([{t:0,x:0},{t:tPeak,x:peakX},{t:tEnd,x:endX}]),
          duration: tEnd, hideVelocity: true,
          prompt: 'How many times did the truck pass House ' + askHouse + '?',
          answer: String(targetCount), inputType: 'choice', tolerance: 0,
          choices: [
            { value: '0', label: '0 times' },
            { value: '1', label: '1 time' },
            { value: '2', label: '2 times' }
          ],
          hint: 'Check whether the truck crosses the house position on the way out, on the way back, or both.'
        };
    }},
    { id:'q14', title:'Q14: Match the graph to the motion', generate: () => {
        let templates = [
          { kf: [{t:0,x:0},{t:3,x:30},{t:5,x:30},{t:8,x:10}], dur: 8 },
          { kf: [{t:0,x:40},{t:2,x:20},{t:4,x:20},{t:8,x:60}], dur: 8 },
          { kf: [{t:0,x:0},{t:2,x:20},{t:5,x:50},{t:8,x:50}], dur: 8 },
          { kf: [{t:0,x:0},{t:2,x:0},{t:5,x:30},{t:8,x:60}], dur: 8 }
        ];
        let correct = Utils.randChoice(templates);
        let shuffled = Utils.shuffledCopy(templates);
        let choices = shuffled.map((tmpl, i) => ({ value: String(i), label: 'Graph ' + String.fromCharCode(65+i), duration: tmpl.dur, keyframes: tmpl.kf }));
        let ans = choices.find(c => c.keyframes === correct.kf).value;
        return {
          entities: buildMainEnt(correct.kf), duration: correct.dur, hideVelocity: true, hidePosition: true,
          prompt: 'Watch the truck move. Which position-time graph matches the animation?',
          answer: ans, inputType: 'graph-choice', graphMatchType: 'position', graphChoices: choices, tolerance: 0,
          hint: 'Match the story of the motion: upward slope means forward, a flat line means stopped, and a downward slope means backward.'
        };
    }},
    { id:'q15', title:'Q15: Match the velocity graph', generate: () => {
        let templates = [
          { kf: [{t:0,x:10},{t:2,x:40},{t:5,x:40},{t:8,x:10}], dur: 8 },
          { kf: [{t:0,x:0},{t:3,x:30},{t:5,x:30},{t:8,x:60}], dur: 8 },
          { kf: [{t:0,x:50},{t:2,x:20},{t:5,x:20},{t:8,x:50}], dur: 8 },
          { kf: [{t:0,x:30},{t:2,x:30},{t:5,x:60},{t:8,x:30}], dur: 8 }
        ];
        let correct = Utils.randChoice(templates);
        let shuffled = Utils.shuffledCopy(templates);
        let choices = shuffled.map((tmpl, i) => ({ value: String(i), label: 'Graph ' + String.fromCharCode(65+i), duration: tmpl.dur, keyframes: tmpl.kf }));
        let ans = choices.find(c => c.keyframes === correct.kf).value;
        return {
          entities: buildMainEnt(correct.kf), duration: correct.dur, hideVelocity: true, hidePosition: true,
          prompt: 'Watch the truck move. Which velocity-time graph matches the animation?',
          answer: ans, inputType: 'graph-choice', graphMatchType: 'velocity', graphChoices: choices, tolerance: 0,
          hint: 'Match the velocity signs: above 0 means forward, on 0 means stopped, and below 0 means backward.'
        };
    }}
  ];

  /* ====================================================================== */
  /* 5. CORE APP STATE & MAIN LOGIC                                         */
  /* ====================================================================== */
  let state = {
    mode: 'practice', // 'practice' | 'assessment'
    practiceIdx: 0,
    assessIdx: 0,
    assessQuestions: [],
    scenario: null, // Pointer to current active scenario
    time: 0,
    isPlaying: false,
    animReq: null,
    lastTs: 0,
    advanceTimer: null,
    pkgDropped: false,
    pkgStolen: false,
    selectedHouse: null,
    logs: {},
    hints: {}
  };

  let els = {};

  function cacheDOM() {
    els.app = document.getElementById('app');
    els.startOverlay = document.getElementById('start-overlay');
    els.playBtn = document.getElementById('playBtn'); // Shared via CSS re-mapping or combined in UI
    els.resetBtn = document.getElementById('resetBtn');
    els.posCanvas = document.getElementById('posCanvas');
    els.velCanvas = document.getElementById('velCanvas');
    els.posReadout = document.getElementById('posReadout');
    els.velReadout = document.getElementById('velReadout');
    els.feedbackBanner = document.getElementById('feedbackBanner');
    els.feedbackWrapper = document.getElementById('feedbackBannerWrapper');
    els.housesWrap = document.getElementById('housesContainer');
    
    // Mode UI
    els.modePracticeBtn = document.getElementById('mode-practice-btn');
    els.modeAssessBtn = document.getElementById('mode-assessment-btn');
    els.practiceControls = document.getElementById('practice-controls');
    els.assessControls = document.getElementById('assessment-top-controls');
    els.scenarioSelect = document.getElementById('scenarioSelect');
    els.qSelect = document.getElementById('question-select');
    els.checkBtn = document.getElementById('check-answer');
    
    // Entities
    els.standalonePackage = document.getElementById('standalonePackage');
    els.standalonePackage2 = document.getElementById('standalonePackage2');
    els.suspectAPackage = document.getElementById('suspectAPackage');
    els.suspectBPackage = document.getElementById('suspectBPackage');
    
    // Assess Response Area
    els.responseArea = document.getElementById('response-area');
    els.graphChoiceContainer = document.getElementById('graph-choice-container');
    els.graphChoiceGrid = document.getElementById('graph-choice-grid');
    els.assessFeedback = document.getElementById('feedback-summary');
  }

  function init() {
    cacheDOM();
    
    // Build Assess Questions
    state.assessQuestions = AssessmentGenerators.map(gen => ({ def: gen, scenario: gen.generate() }));
    els.qSelect.innerHTML = state.assessQuestions.map((q, i) => `<option value="${i}">${q.def.title}</option>`).join('');
    // ADD THIS LINE: Build Practice Scenarios dynamically
    els.scenarioSelect.innerHTML = PracticeCases.map((pc, i) => `<option value="${i}">${pc.title}</option>`).join('');
    // Bind Events
    els.modePracticeBtn.addEventListener('click', () => switchMode('practice'));
    els.modeAssessBtn.addEventListener('click', () => switchMode('assessment'));
    els.scenarioSelect.addEventListener('change', (e) => { state.practiceIdx = parseInt(e.target.value); loadScenario(); });
    els.qSelect.addEventListener('change', (e) => { state.assessIdx = parseInt(e.target.value); loadScenario(); });
    els.playBtn.addEventListener('click', togglePlay);
    els.resetBtn.addEventListener('click', resetSimulation);
    els.checkBtn.addEventListener('click', submitAssessmentAnswer);
    window.addEventListener('resize', renderCanvases);

    // Initial Setup
    buildHouses();
    switchMode('practice');
  }

  function switchMode(mode) {
    state.mode = mode;
    els.modePracticeBtn.classList.toggle('active', mode === 'practice');
    els.modeAssessBtn.classList.toggle('active', mode === 'assessment');
    els.practiceControls.classList.toggle('hidden', mode !== 'practice');
    els.assessControls.classList.toggle('hidden', mode !== 'assessment');
    
    loadScenario();
  }

  function loadScenario() {
    clearTimeout(state.advanceTimer);
    state.isPlaying = false;
    cancelAnimationFrame(state.animReq);
    state.time = 0;
    state.pkgDropped = false; state.pkgStolen = false;
    
    state.scenario = state.mode === 'practice' ? PracticeCases[state.practiceIdx] : state.assessQuestions[state.assessIdx].scenario;
    
    // Hide all objects globally
    ['truck','truck2','suspectA','suspectB','standalonePackage','standalonePackage2'].forEach(id => {
      let el = document.getElementById(id);
      if (el) { el.style.display = 'none'; el.classList.remove('hidden', 'moving', 'opacity-100'); }
    });
    els.suspectAPackage.style.display = 'none'; els.suspectBPackage.style.display = 'none';
    
    let isGraphChoice = state.scenario.graphMatchMode || state.scenario.inputType === 'graph-choice';

    // Setup UI visibilities based on scenario flags
    document.getElementById('posContainer').style.display = (isGraphChoice || state.scenario.hidePosition) ? 'none' : 'flex';
    document.getElementById('velContainer').style.display = (isGraphChoice || state.scenario.hideVelocity) ? 'none' : 'flex';
    els.graphChoiceContainer.classList.toggle('hidden', !isGraphChoice);
    
    // Build the mini-graphs if this is a graphing question
    if (isGraphChoice) renderGraphChoices();
    
    if (state.mode === 'assessment') {
      document.getElementById('assessmentDirectionsBanner').textContent = state.scenario.prompt;
      renderAssessmentResponseArea();
      els.housesWrap.style.pointerEvents = state.scenario.inputType === 'house' ? '' : 'none';
      setPlaybackLock(state.scenario.inputType !== 'graph-choice');
    } else {
      els.housesWrap.style.pointerEvents = isGraphChoice ? 'none' : '';
      updatePracticeBanner();
      setPlaybackLock(false);
    }
    
    els.playBtn.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" fill-rule="evenodd"></path></svg> Play';
    updateStage();
    setTimeout(renderCanvases, 10); // allow flexbox to resize before drawing
  }

  function setPlaybackLock(isLocked) {
    els.playBtn.disabled = isLocked;
    els.resetBtn.disabled = isLocked;
    els.playBtn.style.opacity = isLocked ? '0.4' : '1';
    els.resetBtn.style.opacity = isLocked ? '0.4' : '1';
    els.playBtn.style.pointerEvents = isLocked ? 'none' : 'auto';
    els.resetBtn.style.pointerEvents = isLocked ? 'none' : 'auto';
  }

  function renderGraphChoices() {
    let choices = state.scenario.graphChoices;
    if (!choices) return;
    
    els.graphChoiceGrid.innerHTML = choices.map((c, i) => `
      <label class="graph-choice-item">
        <span class="graph-choice-label">
          <input type="radio" name="quiz-graph-choice" value="${c.value}">
          <span>${c.label}</span>
        </span>
        <span class="graph-choice-canvas-wrap">
          <canvas id="graph-choice-canvas-${i}"></canvas>
        </span>
      </label>
    `).join('');
    
    // If we are in practice mode, listen for the click to auto-grade
    if (state.mode === 'practice') {
      els.graphChoiceGrid.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', () => checkPracticeGraphAnswer(input.value));
      });
    }
    
    setTimeout(drawGraphChoices, 0);
  }
  function togglePlay() {
    state.isPlaying = !state.isPlaying;
    if (state.isPlaying) {
      if (state.time >= state.scenario.duration) resetSimulation();
      els.playBtn.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg> Pause';
      state.lastTs = performance.now();
      state.animReq = requestAnimationFrame(loop);
    } else {
      els.playBtn.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" fill-rule="evenodd"></path></svg> Play';
      cancelAnimationFrame(state.animReq);
    }
    updateStage(); // Triggers wheel spinning CSS instantly
  }

  function resetSimulation() {
    state.isPlaying = false;
    state.time = 0;
    state.pkgDropped = false; state.pkgStolen = false;
    cancelAnimationFrame(state.animReq);
    loadScenario();
  }
function setPlaybackLock(isLocked) {
    els.playBtn.disabled = isLocked;
    els.resetBtn.disabled = isLocked;
    
    // Visually dim the buttons when locked
    els.playBtn.style.opacity = isLocked ? '0.4' : '1';
    els.resetBtn.style.opacity = isLocked ? '0.4' : '1';
    els.playBtn.style.pointerEvents = isLocked ? 'none' : 'auto';
    els.resetBtn.style.pointerEvents = isLocked ? 'none' : 'auto';
  }
  function loop(ts) {
    if (!state.isPlaying) return;
    let dt = (ts - state.lastTs) / 1000;
    state.lastTs = ts;
    state.time += dt;
    
    if (state.time >= state.scenario.duration + 0.5) {
      state.time = state.scenario.duration;
      state.isPlaying = false;
      els.playBtn.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"></path></svg> Replay';
      if (state.mode === 'practice') updatePracticeBannerEnd();
    }
    
    // Porch Pirate Logic (Shared)
    if (state.scenario.porchPirateMode && state.isPlaying) {
      if (state.time >= state.scenario.dropTime && !state.pkgDropped) {
        showPackageDrop(els.standalonePackage, state.scenario.deliveryHouse);
        state.pkgDropped = true;
      }
      if (state.time >= state.scenario.theftTime && state.pkgDropped && !state.pkgStolen) {
        els.standalonePackage.classList.add('opacity-0');
        let guiltyPkg = state.scenario.guiltySuspect === 'Suspect A' ? els.suspectAPackage : els.suspectBPackage;
        guiltyPkg.style.display = 'block';
        state.pkgStolen = true;
      }
    }
    
    updateStage();
    if (state.isPlaying) state.animReq = requestAnimationFrame(loop);
  }

  function updateStage() {
    let mainX = 0, mainV = 0;
    
    if (state.scenario.entities) {
      state.scenario.entities.forEach(ent => {
        let el = document.getElementById(ent.id);
        if (!el) return;
        
        let kin = PhysicsEngine.getKinematics(ent.keyframes, state.time, ent.useVelocityKeyframes);
        if (kin) {
          el.style.display = ent.id.includes('suspect') ? 'flex' : 'block';
          el.style.left = ent.id.includes('suspect') ? `calc(${(kin.x / 70) * 100}% - 16px)` : `${(kin.x / 70) * 100}%`;
          
          let inner = el.querySelector('.relative') || el;
          inner.style.transform = kin.v < -0.1 ? 'scaleX(-1)' : 'scaleX(1)';
          
          if (Math.abs(kin.v) > 0.1 && state.isPlaying && !ent.id.includes('suspect')) el.classList.add('moving');
          else el.classList.remove('moving');
          
          if (ent.isMain) { mainX = kin.x; mainV = kin.v; }
        } else {
          el.style.display = 'none';
        }
      });
    }
    
    if (els.posReadout) els.posReadout.innerText = `x = ${mainX.toFixed(1)} m`;
    if (els.velReadout) els.velReadout.innerText = `v = ${mainV.toFixed(1)} m/s`;
    
    renderCanvases(mainX, mainV);
  }

  function renderCanvases(mainX, mainV) {
    if (state.scenario.graphMatchMode) {
      drawGraphChoices();
      return;
    }
    let maxT = Math.max(15, state.scenario.duration + 2);
    
    if (!state.scenario.hidePosition) {
      let dims = GraphicsEngine.fixDPI(els.posCanvas);
      if (dims.w) {
        GraphicsEngine.drawGrid(dims.ctx, dims.w, dims.h, 'Time (s)', 'Position (m)', 0, 70, 10, maxT, 1);
        state.scenario.entities.forEach(ent => GraphicsEngine.drawLine(dims.ctx, dims.w, dims.h, 0, 70, maxT, ent.keyframes, ent.color, ent.useVelocityKeyframes, false));
        GraphicsEngine.drawScrubber(dims.ctx, dims.w, dims.h, maxT, state.time, mainX || 0, 70, 0, state.scenario.duration);
      }
    }
    if (!state.scenario.hideVelocity) {
      let dims = GraphicsEngine.fixDPI(els.velCanvas);
      if (dims.w) {
        GraphicsEngine.drawGrid(dims.ctx, dims.w, dims.h, 'Time (s)', 'Velocity (m/s)', -20, 20, 10, maxT, 1);
        state.scenario.entities.forEach(ent => GraphicsEngine.drawLine(dims.ctx, dims.w, dims.h, -20, 20, maxT, ent.keyframes, ent.color, ent.useVelocityKeyframes, true));
        GraphicsEngine.drawScrubber(dims.ctx, dims.w, dims.h, maxT, state.time, mainV || 0, 20, -20, state.scenario.duration);
      }
    }
  }

  // --- Assessment UI Helpers ---
  function renderAssessmentResponseArea() {
    let sc = state.scenario;
    els.responseArea.innerHTML = '';
    els.graphChoiceContainer.classList.toggle('hidden', sc.inputType !== 'graph-choice');
    
    if (sc.inputType === 'number') {
      els.responseArea.innerHTML = '<input id="quiz-numeric-input" class="response-input" type="number" step="0.1" placeholder="Your answer" />';
    } else if (sc.inputType === 'choice') {
      els.responseArea.innerHTML = `<div class="choice-list">${sc.choices.map(c => `<label class="choice-item"><input type="radio" name="quiz-choice" value="${c.value}"><span>${c.label}</span></label>`).join('')}</div>`;
    } else if (sc.inputType === 'graph-choice') {
      els.responseArea.innerHTML = '<p class="text-slate-500 text-sm font-semibold">Choose the matching graph below.</p>';
      els.graphChoiceGrid.innerHTML = sc.graphChoices.map((c, i) => `<label class="graph-choice-item"><span class="graph-choice-label"><input type="radio" name="quiz-graph-choice" value="${c.value}"><span>${c.label}</span></span><span class="graph-choice-canvas-wrap"><canvas id="graph-choice-canvas-${i}"></canvas></span></label>`).join('');
      setTimeout(drawGraphChoices, 0);
    } else if (sc.inputType === 'house') {
      els.responseArea.innerHTML = '<p id="house-selection" class="text-slate-500 text-sm italic">Click a house on the street.</p>';
      state.selectedHouse = null;
    }
  }
  
  function drawGraphChoices() {
    if (!state.scenario.graphChoices) return;
    let maxT = Math.max(...state.scenario.graphChoices.map(c => c.duration || state.scenario.duration));
    state.scenario.graphChoices.forEach((c, i) => {
      let canvas = document.getElementById(`graph-choice-canvas-${i}`);
      if (canvas) GraphicsEngine.drawMiniGraph(canvas, c.keyframes, maxT, state.scenario.graphMatchType || 'position');
    });
  }

  function submitAssessmentAnswer() {
    let sc = state.scenario, response = null;
    if (sc.inputType === 'number') response = Number(document.getElementById('quiz-numeric-input')?.value);
    if (sc.inputType === 'choice') response = document.querySelector('input[name="quiz-choice"]:checked')?.value;
    if (sc.inputType === 'graph-choice') response = document.querySelector('input[name="quiz-graph-choice"]:checked')?.value;
    if (sc.inputType === 'house') response = state.selectedHouse;

    if (response == null || (typeof response === 'number' && isNaN(response))) {
      els.assessFeedback.textContent = 'Enter a response first.';
      els.assessFeedback.className = 'feedback-summary bad';
      return;
    }
    
    let isCorrect = String(response) === String(sc.answer);
    els.assessFeedback.textContent = isCorrect ? 'Correct! 100%' : 'Not quite. The correct answer was ' + sc.answer;
    els.assessFeedback.className = 'feedback-summary ' + (isCorrect ? 'good' : 'bad');
    
    if (isCorrect) {
      state.advanceTimer = setTimeout(() => {
        if (state.assessIdx < state.assessQuestions.length - 1) {
          els.qSelect.value = ++state.assessIdx;
          loadScenario();
        }
      }, 1500);
    }
  }

  // --- Shared Helpers ---
  function buildHouses() {
    els.housesWrap.innerHTML = '';
    HOUSES.forEach(h => {
      let el = document.createElement('div');
      el.className = 'absolute bottom-0 w-16 h-20 house-btn flex flex-col items-center justify-end group z-10';
      el.style.left = `calc(${(h.x / 70) * 100}% - 32px)`;
      
      // Restored the full HTML template for the houses
      el.innerHTML =
          '<div class="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white border border-slate-600 rounded-md px-2 py-0.5 text-[10px] font-bold shadow-md opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-20 whitespace-nowrap pointer-events-none">#' + h.num + '</div>' +
          '<div class="absolute top-[1px] right-[18px] w-[8px] h-[27px] bg-red-800 border border-red-950 rounded-t-[2px] z-0"></div>' +
          '<div class="relative w-[68px] h-[31px] z-10">' +
          '<div class="absolute left-1/2 -translate-x-1/2 top-[2px] w-[66px] h-[28px] bg-slate-800 shadow-[0_5px_8px_-2px_rgba(0,0,0,0.35)]" style="clip-path:polygon(50% 0%, 0% 100%, 100% 100%);"></div>' +
            '</div>' +
          '<div class="relative -mt-[-5px] w-[58px] h-[46px] ' + h.color + ' border-x-2 border-t-2 border-slate-800 shadow-[inset_0_2px_0_rgba(255,255,255,0.18),inset_0_-3px_6px_rgba(0,0,0,0.10)] z-10">' +
          '<div class="absolute top-0 left-0 right-0 h-[4px] bg-white/15"></div>' +
          '<div class="absolute left-[6px] top-[7px] w-[12px] h-[14px] bg-sky-200 border-2 border-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]">' +
            '<div class="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-white/90"></div>' +
            '<div class="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 bg-white/90"></div>' +
            '<div class="absolute -bottom-[3px] left-1/2 w-[14px] h-[2px] -translate-x-1/2 bg-slate-200 border border-slate-400 rounded-sm"></div>' +
          '</div>' +
          '<div class="absolute right-[6px] top-[7px] w-[12px] h-[14px] bg-sky-200 border-2 border-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]">' +
            '<div class="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-white/90"></div>' +
            '<div class="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 bg-white/90"></div>' +
            '<div class="absolute -bottom-[3px] left-1/2 w-[14px] h-[2px] -translate-x-1/2 bg-slate-200 border border-slate-400 rounded-sm"></div>' +
          '</div>' +
          '<div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[14px] h-[24px] bg-amber-800 border-2 border-amber-950 rounded-t-sm shadow-[inset_0_2px_0_rgba(255,255,255,0.12)]">' +
            '<div class="absolute left-1/2 top-[6px] bottom-[3px] w-[1px] -translate-x-1/2 bg-amber-950/50"></div>' +
            '<div class="absolute top-[10px] right-[2px] w-[2px] h-[2px] bg-yellow-300 rounded-full"></div>' +
          '</div>' +
          '</div>' +
          '<div class="relative w-[68px] h-[24px] z-10 overflow-visible">' +
          '<div class="absolute left-1/2 top-0 h-[5px] w-[30px] -translate-x-1/2 rounded-sm bg-stone-300 border border-stone-500 shadow-sm"></div>' +
          '<div class="absolute left-1/2 top-[5px] h-[6px] w-[30px] -translate-x-1/2 rounded-sm bg-stone-400 border border-stone-600 shadow-sm"></div>' +
          '<div class="absolute left-[1px] bottom-0 w-[18px] h-[24px] bg-green-700 rounded-full border border-green-900"></div>' +
          '<div class="absolute left-[7px] bottom-[2px] w-[17px] h-[21px] bg-green-600 rounded-full border border-green-800"></div>' +
          '<div class="absolute left-[10px] bottom-[7px] w-[11px] h-[11px] bg-green-500 rounded-full border border-green-700"></div>' +
          '<div class="absolute right-[1px] bottom-0 w-[18px] h-[24px] bg-green-700 rounded-full border border-green-900"></div>' +
          '<div class="absolute right-[7px] bottom-[2px] w-[17px] h-[21px] bg-green-600 rounded-full border border-green-800"></div>' +
          '<div class="absolute right-[10px] bottom-[7px] w-[11px] h-[11px] bg-green-500 rounded-full border border-green-700"></div>' +
          '</div>';

      el.addEventListener('click', () => {
        if (state.mode === 'assessment' && state.scenario.inputType === 'house') {
          state.selectedHouse = h.num;
          document.getElementById('house-selection').textContent = 'Selected: House ' + h.num;
          submitAssessmentAnswer();
        } else if (state.mode === 'practice' && !state.scenario.graphMatchMode) {
          checkPracticeAnswer(h.num);
        }
      });
      els.housesWrap.appendChild(el);
    });
  }

  function showPackageDrop(pkgEl, houseNum) {
    let houseX = HOUSES.find(h => h.num === houseNum).x;
    pkgEl.style.left = `calc(${(houseX / 70) * 100}% - 10px)`;
    pkgEl.style.bottom = '94px';
    pkgEl.style.display = 'flex';
    void pkgEl.offsetWidth; // trigger reflow
    pkgEl.classList.add('opacity-100');
    pkgEl.style.bottom = '64px';
  }

  function checkPracticeAnswer(houseNum) {
    if (houseNum === state.scenario.deliveryHouse) {
      state.isPlaying = false; cancelAnimationFrame(state.animReq); updateStage();
      els.feedbackBanner.innerHTML = '<b>Correct!</b> ' + state.scenario.successExplanation;
      els.feedbackWrapper.className = 'bg-green-500 py-3 transition-colors';
      showPackageDrop(els.standalonePackage, houseNum);
      state.advanceTimer = setTimeout(() => { els.scenarioSelect.value = ++state.practiceIdx; loadScenario(); }, 1500);
    } else {
      els.feedbackBanner.innerHTML = '<b>Incorrect.</b> ' + state.scenario.wrongExplanation;
      els.feedbackWrapper.className = 'bg-red-500 py-2 transition-colors';
    }
  }
function checkPracticeGraphAnswer(val) {
    if (val === state.scenario.graphAnswer) {
      state.isPlaying = false; cancelAnimationFrame(state.animReq); updateStage();
      els.feedbackBanner.innerHTML = '<b>Correct!</b> ' + state.scenario.successExplanation;
      els.feedbackWrapper.className = 'bg-green-500 py-3 transition-colors';
      state.advanceTimer = setTimeout(() => { els.scenarioSelect.value = ++state.practiceIdx; loadScenario(); }, 1500);
    } else {
      els.feedbackBanner.innerHTML = '<b>Incorrect.</b> ' + state.scenario.wrongExplanation;
      els.feedbackWrapper.className = 'bg-red-500 py-2 transition-colors';
    }
  }
  function updatePracticeBanner() {
    els.feedbackBanner.innerHTML = state.scenario.hidePosition ? '<b>Broken GPS!</b> Watch the Velocity graph.' : 'Watch the animation. Click the delivery house.';
    els.feedbackWrapper.className = 'bg-blue-100 py-2 border-b border-blue-300';
  }

  function updatePracticeBannerEnd() {
    els.feedbackBanner.innerText = state.scenario.graphMatchMode ? 'Which graph matches?' : 'Which house got the delivery?';
    els.feedbackWrapper.className = 'bg-green-100 py-2 border-b border-green-200';
  }

  return { init: init };
})();

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('start-overlay').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    MotionGraphsLab.init();
  });
});
