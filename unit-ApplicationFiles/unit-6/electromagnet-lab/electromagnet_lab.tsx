import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Zap, Database, CheckCircle, AlertTriangle, Download, Info, Battery, Repeat } from 'lucide-react';

// Constants for the simulation and constraints
const BUDGET_LIMIT = 50.00;
const MAX_WIRE_LENGTH_CM = 250; 
const COST_PER_BATTERY = 4.00;
const COST_BASE_IRON = 2.00;
const COST_PER_MM_IRON = 0.50; 
const COST_PER_CM_WIRE = 0.05;

// Physics Constants
const BATTERY_VOLTAGE = 1.5; 
const BATTERY_INTERNAL_R = 0.5; 
const WIRE_RESISTANCE_PER_CM = 0.04; 

export default function ElectromagnetLab() {
  // Simulation Controls
  const [turns, setTurns] = useState(20);
  const [core, setCore] = useState('iron');
  const [diameter, setDiameter] = useState(10); 
  const [numBatteries, setNumBatteries] = useState(1);
  const [batteryConfig, setBatteryConfig] = useState('series'); 
  
  // App Calculated State
  const [dataLog, setDataLog] = useState([]);
  const [currentCost, setCurrentCost] = useState(0);
  const [costBreakdown, setCostBreakdown] = useState({ batteries: 0, core: 0, wire: 0 });
  
  // Physics State
  const [wireLength, setWireLength] = useState(0);
  const [calculatedAmps, setCalculatedAmps] = useState(0);
  const [circuitStats, setCircuitStats] = useState({ voltage: 0, resistance: 0 });
  const [simStrength, setSimStrength] = useState(0);
  
  // Constraints Check
  const [isOverBudget, setIsOverBudget] = useState(false);
  const [isOutOfWire, setIsOutOfWire] = useState(false);
  
  // Animation State
  const [isAnimating, setIsAnimating] = useState(false);
  const [magnetY, setMagnetY] = useState(90); // Idle Y position
  const [attachedClips, setAttachedClips] = useState(0);

  // Student Answers State
  const [answers, setAnswers] = useState({
    q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: '', q8: '', q9: '', q10: ''
  });

  // Pre-generate random positions for paper clips so they don't jitter on re-renders
  const clipData = useMemo(() => Array.from({ length: 80 }).map((_, i) => ({
    id: i,
    pileX: 150 + (Math.random() * 100 - 50),
    pileY: 440 + (Math.random() * 30 - 10),
    pileRot: Math.random() * 360,
    attachX: (Math.random() * 40 - 20),
    attachY: 160 + (Math.random() * 30),
    attachRot: Math.random() * 360
  })), []);

  useEffect(() => {
    // 1. Geometry Math
    const lengthCm = turns * Math.PI * (diameter / 10);
    setWireLength(lengthCm);
    
    const outOfWire = lengthCm > MAX_WIRE_LENGTH_CM;
    setIsOutOfWire(outOfWire);

    // 2. Cost Math
    const coreCost = core === 'iron' ? COST_BASE_IRON + (diameter * COST_PER_MM_IRON) : 0;
    const batteriesCost = numBatteries * COST_PER_BATTERY;
    const wireCost = lengthCm * COST_PER_CM_WIRE;
    const totalCost = batteriesCost + coreCost + wireCost;
    
    setCostBreakdown({ batteries: batteriesCost, core: coreCost, wire: wireCost });
    setCurrentCost(totalCost);
    setIsOverBudget(totalCost > BUDGET_LIMIT);
    
    // 3. Electrical Math
    const wireResistance = lengthCm * WIRE_RESISTANCE_PER_CM;
    let totalVoltage, internalResistance;

    if (batteryConfig === 'series') {
      totalVoltage = numBatteries * BATTERY_VOLTAGE;
      internalResistance = numBatteries * BATTERY_INTERNAL_R;
    } else {
      totalVoltage = BATTERY_VOLTAGE;
      internalResistance = BATTERY_INTERNAL_R / numBatteries;
    }

    const totalResistance = wireResistance + internalResistance;
    const currentA = totalVoltage / totalResistance;
    
    setCircuitStats({ voltage: totalVoltage, resistance: totalResistance });
    setCalculatedAmps(currentA);
    
    // 4. Magnetic Strength Math
    const coreMultiplier = core === 'iron' ? 12 : 1;
    const baseStrength = (turns * currentA * coreMultiplier * (diameter / 8)) / 3;
    
    if (outOfWire || totalCost > BUDGET_LIMIT) {
      setSimStrength(0);
    } else {
      setSimStrength(Math.max(0, Math.floor(baseStrength)));
    }

    // Reset animation/clips if user changes variables
    setAttachedClips(0);
    setMagnetY(90);
  }, [turns, numBatteries, batteryConfig, core, diameter]);

  const handleTest = () => {
    if (isOverBudget || isOutOfWire || isAnimating) return;
    
    setIsAnimating(true);
    setAttachedClips(0);
    
    // 1. Lower electromagnet
    setMagnetY(260); 

    setTimeout(() => {
      // 2. Attach clips based on strength
      setAttachedClips(Math.min(simStrength, 80)); // Cap max visual clips

      setTimeout(() => {
        // 3. Raise electromagnet
        setMagnetY(90);

        setTimeout(() => {
          // 4. Finish animation and log data
          setIsAnimating(false);
          const newEntry = {
            id: dataLog.length + 1,
            core,
            diameter,
            turns,
            batteries: `${numBatteries} (${batteryConfig})`,
            amps: calculatedAmps.toFixed(2),
            wire: wireLength.toFixed(0),
            strength: simStrength,
            cost: currentCost
          };
          setDataLog(prev => [...prev, newEntry]);
        }, 1000); // Wait for raise
      }, 600); // Wait at bottom to attach
    }, 1000); // Wait for lower
  };

  const renderBatteries = () => {
    const batWidth = 36;
    const batHeight = 18;
    const batteries = [];
    let wireLx, wireLy, wireRx, wireRy;
    
    if (batteryConfig === 'series') {
      const startX = 150 - ((numBatteries * batWidth) / 2);
      const y = 20;
      
      for(let i=0; i<numBatteries; i++) {
        const x = startX + (i * (batWidth + 4));
        batteries.push(
          <g key={i}>
            <rect x={x} y={y} width={batWidth} height={batHeight} fill="#334155" rx="2" />
            <rect x={x+batWidth} y={y+5} width="4" height="8" fill="#94a3b8" />
            <text x={x+5} y={y+13} fill="white" fontSize="10" fontWeight="bold">1.5V</text>
          </g>
        );
        if (i < numBatteries - 1) {
          batteries.push(<line key={`w${i}`} x1={x+batWidth+4} y1={y+9} x2={x+batWidth+4} y2={y+9} stroke="#000" strokeWidth="2" />);
        }
      }
      wireLx = startX;
      wireLy = y + 9;
      wireRx = startX + (numBatteries * (batWidth + 4));
      wireRy = y + 9;
      
    } else {
      // Parallel stack
      const x = 130;
      const startY = 15;
      
      for(let i=0; i<numBatteries; i++) {
        const y = startY + (i * (batHeight + 4));
        batteries.push(
          <g key={i}>
            <rect x={x} y={y} width={batWidth} height={batHeight} fill="#334155" rx="2" />
            <rect x={x+batWidth} y={y+5} width="4" height="8" fill="#94a3b8" />
          </g>
        );
      }
      const topY = startY + (batHeight/2);
      const bottomY = startY + ((numBatteries-1) * (batHeight + 4)) + (batHeight/2);
      
      // Connectors
      batteries.push(
        <line key="railL" x1={x-8} y1={topY} x2={x-8} y2={bottomY} stroke="#ef4444" strokeWidth="2" />,
        <line key="railR" x1={x+batWidth+8} y1={topY} x2={x+batWidth+8} y2={bottomY} stroke="#10b981" strokeWidth="2" />
      );
      for(let i=0; i<numBatteries; i++) {
        const y = startY + (i * (batHeight + 4)) + (batHeight/2);
        batteries.push(
          <line key={`c1${i}`} x1={x-8} y1={y} x2={x} y2={y} stroke="#ef4444" strokeWidth="2" />,
          <line key={`c2${i}`} x1={x+batWidth+4} y1={y} x2={x+batWidth+8} y2={y} stroke="#10b981" strokeWidth="2" />
        );
      }
      wireLx = x - 8;
      wireLy = bottomY;
      wireRx = x + batWidth + 8;
      wireRy = bottomY;
    }
    
    return { elements: batteries, wireLx, wireLy, wireRx, wireRy };
  };

  const renderCoils = () => {
    const visualTurns = Math.min(turns, 60); 
    const coilPaths = [];
    const spacing = 140 / visualTurns;
    
    const visualWidth = diameter * 1.5;
    const leftEdge = 150 - (visualWidth / 2);
    const rightEdge = 150 + (visualWidth / 2);
    
    for (let i = 0; i < visualTurns; i++) {
      const y = 20 + (i * spacing);
      coilPaths.push(
        <path 
          key={i} 
          d={`M ${leftEdge - 5} ${y} Q ${rightEdge + 25} ${y + 5} ${leftEdge - 5} ${y + 8}`} 
          fill="none" 
          stroke={isOutOfWire ? "#f87171" : "#b45309"} 
          strokeWidth="3" 
          className="transition-all duration-300"
        />
      );
    }
    return coilPaths;
  };

  const renderFieldLines = () => {
    if (simStrength === 0 || isAnimating) return null; // Hide lines during animation
    const opacity = Math.min(simStrength / 100, 0.8) + 0.1; 
    const scale = Math.min(simStrength / 50, 1.5) + 0.5;
    
    const offset = (diameter * 1.5) / 2 + 5;
    const leftStart = 150 - offset;
    const rightStart = 150 + offset;
    
    return (
      <g stroke="#3b82f6" strokeWidth="2" fill="none" opacity={opacity} className="transition-opacity duration-500">
        <path d={`M ${leftStart} 20 C ${leftStart - 40*scale} 20, ${leftStart - 60*scale} 80, ${leftStart - 40*scale} 150 C ${leftStart - 30*scale} 190, ${leftStart} 195, ${leftStart} 195`} strokeDasharray="5,5" />
        <path d={`M ${leftStart} 40 C ${leftStart - 20*scale} 40, ${leftStart - 30*scale} 100, ${leftStart - 20*scale} 140 C ${leftStart - 10*scale} 170, ${leftStart} 180, ${leftStart} 180`} strokeDasharray="5,5" />
        
        <path d={`M ${rightStart} 20 C ${rightStart + 40*scale} 20, ${rightStart + 60*scale} 80, ${rightStart + 40*scale} 150 C ${rightStart + 30*scale} 190, ${rightStart} 195, ${rightStart} 195`} strokeDasharray="5,5" />
        <path d={`M ${rightStart} 40 C ${rightStart + 20*scale} 40, ${rightStart + 30*scale} 100, ${rightStart + 20*scale} 140 C ${rightStart + 10*scale} 170, ${rightStart} 180, ${rightStart} 180`} strokeDasharray="5,5" />
      </g>
    );
  };
  
  const getCorePath = () => {
    const visualWidth = diameter * 1.5;
    const left = 150 - (visualWidth / 2);
    const right = 150 + (visualWidth / 2);
    return `M ${left} 0 L ${right} 0 L ${right} 170 L 150 190 L ${left} 170 Z`;
  };

  const batteryData = renderBatteries();
  const visualWidth = diameter * 1.5;
  const magnetTermLeftX = 150 - (visualWidth / 2) - 5;
  const magnetTermRightX = 150 + (visualWidth / 2) + 5;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Zap className="text-amber-500" size={32} />
                Advanced Electromagnet Optimization
              </h1>
              <p className="text-slate-500 mt-2">Physical Circuit Simulation • HS-PS2-5</p>
            </div>
            <div className="mt-4 md:mt-0 bg-blue-50 p-4 rounded-lg border border-blue-100 max-w-sm">
              <h3 className="font-semibold text-blue-800 flex items-center gap-2">
                <Info size={18} /> Engineering Constraints
              </h3>
              <ul className="text-sm text-blue-700 mt-1 list-disc pl-4 space-y-1">
                <li><strong>Wire Limit:</strong> Max {MAX_WIRE_LENGTH_CM}cm spool.</li>
                <li><strong>Budget:</strong> Max ${BUDGET_LIMIT.toFixed(2)} budget.</li>
                <li><strong>Goal:</strong> Pick up maximum paperclips!</li>
              </ul>
            </div>
          </div>
        </header>

        {/* Top Grid: Simulation & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Visualizer & Live Stats */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 flex flex-col flex-1">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
                <Settings size={24} className="text-indigo-500" /> Live Simulation
              </h2>
              
              {/* Simulation Canvas */}
              <div className="flex-1 bg-slate-100 rounded-lg border-2 border-slate-200 border-dashed relative flex items-center justify-center overflow-hidden min-h-[500px]">
                <svg width="100%" height="100%" viewBox="0 0 300 480" preserveAspectRatio="xMidYMid meet" className="relative z-10">
                  
                  {/* Static Batteries at Top */}
                  {batteryData.elements}

                  {/* Flexible Wires that stretch based on magnetY */}
                  <path 
                    d={`M ${batteryData.wireLx} ${batteryData.wireLy} C ${batteryData.wireLx} ${magnetY - 20}, ${magnetTermLeftX - 30} ${magnetY - 40}, ${magnetTermLeftX} ${magnetY + 20}`} 
                    fill="none" stroke="#ef4444" strokeWidth="3" 
                    className="transition-all duration-1000 ease-in-out"
                  />
                  <path 
                    d={`M ${batteryData.wireRx} ${batteryData.wireRy} C ${batteryData.wireRx} ${magnetY - 20}, ${magnetTermRightX + 30} ${magnetY - 40}, ${magnetTermRightX} ${magnetY + 20}`} 
                    fill="none" stroke="#10b981" strokeWidth="3" 
                    className="transition-all duration-1000 ease-in-out"
                  />

                  {/* Ground pile of unattached paper clips */}
                  {clipData.map(clip => (
                    clip.id >= attachedClips && (
                      <g key={`pile-${clip.id}`} transform={`translate(${clip.pileX}, ${clip.pileY}) rotate(${clip.pileRot})`}>
                        <path d="M -4 5 L -4 -5 A 3 3 0 0 1 2 -5 L 2 7 A 5 5 0 0 1 -7 7 L -7 -3 A 2 2 0 0 1 -4 -3 L -4 3" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                      </g>
                    )
                  ))}

                  {/* Moving Electromagnet Assembly */}
                  <g className="transition-all duration-1000 ease-in-out" style={{ transform: `translateY(${magnetY}px)` }}>
                    {renderFieldLines()}
                    
                    <path 
                      d={getCorePath()} 
                      fill={core === 'iron' ? '#cbd5e1' : 'transparent'} 
                      stroke={core === 'iron' ? '#64748b' : '#94a3b8'} 
                      strokeWidth="3"
                      strokeDasharray={core === 'air' ? '5,5' : 'none'}
                      className="transition-all duration-300"
                    />
                    
                    {renderCoils()}

                    {/* Attached paper clips (move with magnet) */}
                    {clipData.map(clip => (
                      clip.id < attachedClips && (
                        <g key={`attach-${clip.id}`} transform={`translate(${150 + clip.attachX}, ${clip.attachY}) rotate(${clip.attachRot})`}>
                           <path d="M -4 5 L -4 -5 A 3 3 0 0 1 2 -5 L 2 7 A 5 5 0 0 1 -7 7 L -7 -3 A 2 2 0 0 1 -4 -3 L -4 3" fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
                        </g>
                      )
                    ))}
                  </g>
                </svg>
                
                {/* Strength overlay */}
                <div className="absolute top-4 right-4 bg-white/95 px-4 py-2 rounded-lg shadow-sm border border-indigo-200 text-center z-20">
                  <span className="block text-xs font-semibold text-indigo-500 uppercase tracking-wider">Magnet Strength</span>
                  <span className="block text-3xl font-bold text-indigo-700">{simStrength} <span className="text-sm font-medium">clips</span></span>
                </div>
              </div>
            </div>

            {/* Circuit Output Stats */}
            <div className="bg-slate-800 rounded-xl shadow-sm p-5 text-slate-100">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Live Circuit Outputs (Ohm's Law)</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600">
                  <span className="block text-xs text-slate-300 mb-1">Total Voltage (V)</span>
                  <span className="text-xl font-bold text-emerald-400">{circuitStats.voltage.toFixed(1)}v</span>
                </div>
                <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600">
                  <span className="block text-xs text-slate-300 mb-1">Total Resist. (Ω)</span>
                  <span className="text-xl font-bold text-amber-400">{circuitStats.resistance.toFixed(2)}Ω</span>
                </div>
                <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600 shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                  <span className="block text-xs text-blue-200 mb-1">Current (I)</span>
                  <span className="text-2xl font-bold text-blue-400">{calculatedAmps.toFixed(2)}A</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <h2 className="text-xl font-bold mb-6 text-slate-800">Engineering Console</h2>
            
            <fieldset disabled={isAnimating} className={`space-y-6 ${isAnimating ? 'opacity-60 cursor-not-allowed' : ''}`}>
              
              {/* Wire Constraint Tracker */}
              <div className={`p-4 rounded-lg border-2 ${isOutOfWire ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between items-end mb-2">
                  <span className="font-semibold text-slate-700">Wire Spool (Constraint)</span>
                  <span className={`text-lg font-bold ${isOutOfWire ? 'text-red-600' : 'text-slate-700'}`}>
                    {wireLength.toFixed(0)}cm <span className="text-sm font-normal text-slate-500">/ {MAX_WIRE_LENGTH_CM}cm</span>
                  </span>
                </div>
                <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                  <div 
                    className={`h-full transition-all duration-300 ${isOutOfWire ? 'bg-red-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min((wireLength / MAX_WIRE_LENGTH_CM) * 100, 100)}%` }}
                  ></div>
                </div>
                {isOutOfWire && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1 font-medium">
                    <AlertTriangle size={16} /> Out of wire! Reduce turns or core diameter.
                  </p>
                )}
              </div>

              <hr className="border-slate-100" />

              {/* Physical Variables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex justify-between font-semibold text-slate-700 mb-2">
                    <span>Number of Coil Turns</span>
                    <span className="text-indigo-600">{turns}</span>
                  </label>
                  <input 
                    type="range" min="10" max="100" step="5"
                    value={turns} onChange={(e) => setTurns(parseInt(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
                
                <div>
                  <label className="flex justify-between font-semibold text-slate-700 mb-2">
                    <span>Core Diameter (Thickness)</span>
                    <span className="text-indigo-600">{diameter} mm</span>
                  </label>
                  <input 
                    type="range" min="5" max="25" step="1"
                    value={diameter} onChange={(e) => setDiameter(parseInt(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-2">Core Material</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setCore('air')} type="button" className={`py-2 px-4 rounded-md font-medium border-2 transition-colors ${core === 'air' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                    Air Core (None)
                  </button>
                  <button onClick={() => setCore('iron')} type="button" className={`py-2 px-4 rounded-md font-medium border-2 transition-colors ${core === 'iron' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                    Iron Core (+$2 base)
                  </button>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Power Source Config */}
              <div>
                <label className="block font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Battery size={18}/> Power Source Configuration
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="block text-sm text-slate-500 mb-2">1.5V Cells ($4/ea)</span>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map(num => (
                        <button key={num} onClick={() => setNumBatteries(num)} type="button" className={`flex-1 py-1 rounded border-2 font-bold ${numBatteries === num ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="block text-sm text-slate-500 mb-2">Wiring Circuit</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setBatteryConfig('series')} type="button"
                        disabled={numBatteries === 1}
                        className={`flex-1 py-1 rounded border-2 font-bold flex items-center justify-center gap-1 ${numBatteries === 1 ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200' : batteryConfig === 'series' ? 'bg-purple-100 border-purple-500 text-purple-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                      >
                        Series
                      </button>
                      <button 
                        onClick={() => setBatteryConfig('parallel')} type="button"
                        disabled={numBatteries === 1}
                        className={`flex-1 py-1 rounded border-2 font-bold flex items-center justify-center gap-1 ${numBatteries === 1 ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200' : batteryConfig === 'parallel' ? 'bg-purple-100 border-purple-500 text-purple-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                      >
                        <Repeat size={14} /> Parallel
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Budget Tracker */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex justify-between items-end mb-2">
                  <span className="font-semibold text-slate-700">Financial Budget</span>
                  <span className={`text-xl font-bold ${isOverBudget ? 'text-red-600' : 'text-emerald-600'}`}>
                    ${currentCost.toFixed(2)} <span className="text-sm font-normal text-slate-500">/ ${BUDGET_LIMIT.toFixed(2)}</span>
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs mb-3 text-center border-t border-slate-200 pt-3">
                  <div>
                    <span className="block text-slate-500">Wire</span>
                    <span className="font-medium text-amber-700">${costBreakdown.wire.toFixed(2)}</span>
                  </div>
                  <div className="border-l border-slate-200">
                    <span className="block text-slate-500">Core Metal</span>
                    <span className="font-medium text-slate-700">${costBreakdown.core.toFixed(2)}</span>
                  </div>
                  <div className="border-l border-slate-200">
                    <span className="block text-slate-500">Batteries</span>
                    <span className="font-medium text-blue-700">${costBreakdown.batteries.toFixed(2)}</span>
                  </div>
                </div>

                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${isOverBudget ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min((currentCost / BUDGET_LIMIT) * 100, 100)}%` }}
                  ></div>
                </div>
                {isOverBudget && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1 font-medium">
                    <AlertTriangle size={16} /> Over budget! Adjust variables to lower costs.
                  </p>
                )}
              </div>
            </fieldset>

            {/* Action Button outside fieldset so it can show its own disabled state explicitly */}
            <button 
              onClick={handleTest}
              disabled={isOverBudget || isOutOfWire || isAnimating}
              className={`w-full mt-6 py-4 px-4 rounded-lg font-bold text-white shadow-sm transition-all text-lg flex items-center justify-center gap-2 ${isOverBudget || isOutOfWire || isAnimating ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md active:scale-[0.98]'}`}
            >
              {isAnimating ? (
                <>Testing Electromagnet...</>
              ) : (
                <>Run Test & Record Data</>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
            <Database size={24} className="text-indigo-500" /> Lab Results Table
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b-2 border-slate-200 text-sm">
                  <th className="p-3 font-semibold">Trial</th>
                  <th className="p-3 font-semibold">Core / Dia.</th>
                  <th className="p-3 font-semibold">Turns</th>
                  <th className="p-3 font-semibold">Wire Used</th>
                  <th className="p-3 font-semibold text-blue-700">Batteries (Config)</th>
                  <th className="p-3 font-semibold text-blue-700">Measured Amps</th>
                  <th className="p-3 font-semibold text-emerald-700">Cost ($)</th>
                  <th className="p-3 font-semibold text-indigo-700">Strength (Clips)</th>
                </tr>
              </thead>
              <tbody>
                {dataLog.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-slate-500 italic bg-slate-50 border-b border-slate-100">
                      No data recorded yet. Run a test to log your baseline.
                    </td>
                  </tr>
                ) : (
                  dataLog.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors text-sm">
                      <td className="p-3 font-medium text-slate-700">#{row.id}</td>
                      <td className="p-3 capitalize">{row.core} ({row.diameter}mm)</td>
                      <td className="p-3">{row.turns}</td>
                      <td className="p-3 text-amber-700">{row.wire} cm</td>
                      <td className="p-3 capitalize text-blue-800 font-medium">{row.batteries}</td>
                      <td className="p-3 font-mono">{row.amps} A</td>
                      <td className="p-3 text-emerald-700 font-medium">${row.cost.toFixed(2)}</td>
                      <td className="p-3 text-indigo-700 font-bold text-lg">{row.strength}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800">
            <CheckCircle size={24} className="text-indigo-500" /> Analysis & Optimization Report
          </h2>
          
          <div className="space-y-6">
            {[
              { id: 'q1', text: '1. What evidence shows that electric current produces a magnetic field?' },
              { id: 'q2', text: '2. How does increasing the number of coil turns affect electromagnet strength?' },
              { id: 'q4', text: '3. What effect does adding an iron core have compared to an air core?' },
              { id: 'q9', text: '4. Physical Constraint: Look at your Cost Breakdown. Why does making the core diameter thicker cause the wire cost to go up?' },
              { id: 'q10', text: '5. Circuit Analysis: Look at your measured Amps. How does connecting 3 batteries in series differ from connecting 3 batteries in parallel?' },
              { id: 'q5', text: '6. Which single variable (Turns, Core, or Current) produced the largest improvement in your trials?' },
              { id: 'q6', text: '7. What overall tradeoff/constraint prevented you from simply maximizing every variable?' },
              { id: 'q7', text: '8. Describe your optimized design and support it with at least three pieces of data from your table.' }
            ].map((question) => (
              <div key={question.id} className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                <label htmlFor={question.id} className="block font-semibold text-slate-800 mb-3">
                  {question.text}
                </label>
                <textarea
                  id={question.id}
                  rows={3}
                  className="w-full p-3 rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-y"
                  placeholder="Type your answer here..."
                  value={answers[question.id]}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                />
              </div>
            ))}
          </div>
          
          <div className="mt-8 flex justify-end">
            <button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-colors"
              onClick={() => alert("Report successfully saved/submitted! (Simulated)")}
            >
              <Download size={20} /> Submit Final Report
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}