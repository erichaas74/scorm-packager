import React, { useState, useMemo, useRef, useEffect } from 'react';
import { LineChart, Plus, Trash2, Download, Image as ImageIcon, FileJson, Settings2, Film, Loader, Activity, Target, TrendingUp } from 'lucide-react';

// --- Math & Helper Functions ---

const formatNumber = (num) => {
  if (num === null || isNaN(num)) return '';
  if (Math.abs(num) < 0.0001 && num !== 0) return num.toExponential(2);
  return Number(num.toFixed(4)).toString();
};

const getNiceTicks = (min, max, targetCount = 6, manual = false) => {
  if (manual) {
    const step = (max - min) / (targetCount - 1);
    return Array.from({ length: targetCount }, (_, i) => min + step * i);
  }
  
  if (!isFinite(min) || !isFinite(max)) return [0, 10];
  if (min === max) {
    if (min === 0) return [0, 10];
    return [min > 0 ? 0 : min * 2, min > 0 ? min * 2 : 0].sort((a, b) => a - b);
  }
  
  const range = max - min;
  const roughStep = range / (targetCount - 1);
  const mag = Math.floor(Math.log10(roughStep || 1));
  const magPow = Math.pow(10, mag);
  const normStep = roughStep / magPow;
  
  let niceNorm = 10;
  if (normStep < 1.5) niceNorm = 1;
  else if (normStep < 3) niceNorm = 2;
  else if (normStep < 7) niceNorm = 5;
  
  const step = niceNorm * magPow;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  
  const ticks = [];
  for (let i = start; i <= end + (step / 100); i += step) {
    ticks.push(Number(i.toPrecision(10)));
    if (ticks.length > 50) break; // Safety net
  }
  return ticks;
};

// --- Reusable UI Components ---

const Toggle = ({ label, enabled, setEnabled }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <button
      type="button"
      className={`${enabled ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
      onClick={() => setEnabled(!enabled)}
    >
      <span className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
    </button>
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div className="flex items-center justify-between py-2">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-2 py-1 text-gray-700 bg-white border"
    >
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);

const Input = ({ label, value, onChange, type = "text", placeholder = "" }) => (
  <div className="mb-3">
    <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-1.5 border"
    />
  </div>
);

const ColorPicker = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between py-1.5">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 uppercase font-mono">{value}</span>
      <input type="color" value={value} onChange={onChange} className="h-7 w-7 rounded cursor-pointer border-0 p-0" />
    </div>
  </div>
);


// --- Main Application ---

export default function App() {
  // Graph Metadata
  const [title, setTitle] = useState("Effect of Variable X on Y");
  const [xAxisLabel, setXAxisLabel] = useState("Independent Variable (Units)");
  const [yAxisLabel, setYAxisLabel] = useState("Dependent Variable (Units)");
  
  // Data State
  const [graphData, setGraphData] = useState([
    { id: 1, x: 1, y: 2.1 },
    { id: 2, x: 2, y: 3.8 },
    { id: 3, x: 3, y: 3.2 },
    { id: 4, x: 4, y: 5.5 },
    { id: 5, x: 5, y: 6.8 },
  ]);
  
  // Toggles & Appearance
  const [showGrid, setShowGrid] = useState(true);
  const [showPoints, setShowPoints] = useState(true);
  const [showConnectLine, setShowConnectLine] = useState(false);
  const [showConnectFill, setShowConnectFill] = useState(false);
  const [showBestFit, setShowBestFit] = useState(true);
  const [showFill, setShowFill] = useState(false);
  const [showEquation, setShowEquation] = useState(true);
  const [regressionType, setRegressionType] = useState('linear');
  const [startXAtZero, setStartXAtZero] = useState(false);
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [visiblePointsCount, setVisiblePointsCount] = useState(0);
  const [lineDrawProgress, setLineDrawProgress] = useState(0);
  const [highlightProgress, setHighlightProgress] = useState(0);
  const [tangentDrawProgress, setTangentDrawProgress] = useState(0);
  
  const [pointColor, setPointColor] = useState("#3b82f6");
  const [lineColor, setLineColor] = useState("#ef4444");
  const [connectLineColor, setConnectLineColor] = useState("#10b981");
  const [connectFillColor, setConnectFillColor] = useState("#a7f3d0");
  const [fillColor, setFillColor] = useState("#bfdbfe");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  
  const [pointSize, setPointSize] = useState(6);
  const [lineWidth, setLineWidth] = useState(3);
  
  // Manual Axis Bounds
  const [manualXMin, setManualXMin] = useState('');
  const [manualXMax, setManualXMax] = useState('');
  const [manualYMin, setManualYMin] = useState('');
  const [manualYMax, setManualYMax] = useState('');
  const [manualXStep, setManualXStep] = useState('');
  const [manualYStep, setManualYStep] = useState('');
  
  // Paste Data State
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');

  // Preset Parameters
  const [presetA, setPresetA] = useState('1');
  const [presetC, setPresetC] = useState('0');

  // SVG Refs & Dimensions
  const svgRef = useRef(null);
  const width = 800;
  const height = 600;
  const margins = { top: 60, right: 40, bottom: 80, left: 80 };
  const innerWidth = width - margins.left - margins.right;
  const innerHeight = height - margins.top - margins.bottom;

  // --- Derived Computations ---
  
  const validData = useMemo(() => {
    let highlightIdxCounter = 0;
    return graphData
      .map(p => ({ ...p, x: parseFloat(p.x), y: parseFloat(p.y) }))
      .filter(p => !isNaN(p.x) && !isNaN(p.y))
      .map(p => ({
        ...p,
        highlightIdx: p.highlighted ? highlightIdxCounter++ : -1
      }));
  }, [graphData]);

  const bestFit = useMemo(() => {
    let regData = validData;
    // Filter invalid domains for certain regressions
    if (regressionType === 'logarithmic') regData = validData.filter(p => p.x > 0);
    if (regressionType === 'exponential') regData = validData.filter(p => p.y > 0);

    const n = regData.length;
    if (n < 2 || (regressionType === 'quadratic' && n < 3)) return null;

    let fn, derivativeFn, eqText;

    if (regressionType === 'linear') {
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      regData.forEach(p => { sumX += p.x; sumY += p.y; sumXY += p.x * p.y; sumXX += p.x * p.x; });
      const denom = (n * sumXX - sumX * sumX);
      if (Math.abs(denom) < 1e-10) return null;
      const slope = (n * sumXY - sumX * sumY) / denom;
      const intercept = (sumY - slope * sumX) / n;

      fn = (x) => slope * x + intercept;
      derivativeFn = (x) => slope;
      eqText = `y = ${formatNumber(slope)}x ${intercept >= 0 ? '+' : '-'} ${formatNumber(Math.abs(intercept))}`;
      
    } else if (regressionType === 'exponential') {
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      regData.forEach(p => {
        const lnY = Math.log(p.y);
        sumX += p.x; sumY += lnY; sumXY += p.x * lnY; sumXX += p.x * p.x;
      });
      const denom = (n * sumXX - sumX * sumX);
      if (Math.abs(denom) < 1e-10) return null;
      const B = (n * sumXY - sumX * sumY) / denom;
      const A = Math.exp((sumY - B * sumX) / n);

      fn = (x) => A * Math.exp(B * x);
      derivativeFn = (x) => A * B * Math.exp(B * x);
      eqText = `y = ${formatNumber(A)}e^(${formatNumber(B)}x)`;

    } else if (regressionType === 'logarithmic') {
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      regData.forEach(p => {
        const lnX = Math.log(p.x);
        sumX += lnX; sumY += p.y; sumXY += lnX * p.y; sumXX += lnX * lnX;
      });
      const denom = (n * sumXX - sumX * sumX);
      if (Math.abs(denom) < 1e-10) return null;
      const B = (n * sumXY - sumX * sumY) / denom;
      const A = (sumY - B * sumX) / n;

      fn = (x) => B * Math.log(x) + A;
      derivativeFn = (x) => B / x;
      eqText = `y = ${formatNumber(B)}ln(x) ${A >= 0 ? '+' : '-'} ${formatNumber(Math.abs(A))}`;

    } else if (regressionType === 'quadratic') {
      let Sx = 0, Sxx = 0, Sxxx = 0, Sxxxx = 0;
      let Sy = 0, Sxy = 0, Sxxy = 0;
      regData.forEach(p => {
        const x = p.x, y = p.y, x2 = x * x;
        Sx += x; Sxx += x2; Sxxx += x2 * x; Sxxxx += x2 * x2;
        Sy += y; Sxy += x * y; Sxxy += x2 * y;
      });

      // 3x3 Determinant helper for Cramer's Rule
      const det3 = (m) => m[0][0]*(m[1][1]*m[2][2] - m[1][2]*m[2][1]) - m[0][1]*(m[1][0]*m[2][2] - m[1][2]*m[2][0]) + m[0][2]*(m[1][0]*m[2][1] - m[1][1]*m[2][0]);

      const D = det3([[n, Sx, Sxx], [Sx, Sxx, Sxxx], [Sxx, Sxxx, Sxxxx]]);
      if (Math.abs(D) < 1e-10) return null;

      const c = det3([[Sy, Sx, Sxx], [Sxy, Sxx, Sxxx], [Sxxy, Sxxx, Sxxxx]]) / D;
      const b = det3([[n, Sy, Sxx], [Sx, Sxy, Sxxx], [Sxx, Sxxy, Sxxxx]]) / D;
      const a = det3([[n, Sx, Sy], [Sx, Sxx, Sxy], [Sxx, Sxxx, Sxxy]]) / D;

      fn = (x) => a * x * x + b * x + c;
      derivativeFn = (x) => 2 * a * x + b;
      eqText = `y = ${formatNumber(a)}x² ${b >= 0 ? '+' : '-'} ${formatNumber(Math.abs(b))}x ${c >= 0 ? '+' : '-'} ${formatNumber(Math.abs(c))}`;
    }
    
    // Global R-Squared (against original validData, not transformed)
    const meanY = validData.reduce((sum, p) => sum + p.y, 0) / validData.length;
    let ssTot = 0, ssRes = 0;
    validData.forEach(p => {
      ssTot += Math.pow(p.y - meanY, 2);
      const predictedY = fn(p.x);
      if(!isNaN(predictedY)) {
        ssRes += Math.pow(p.y - predictedY, 2);
      } else {
        ssRes += Math.pow(p.y - meanY, 2); 
      }
    });
    const rSquared = ssTot === 0 ? 1 : Math.max(0, 1 - (ssRes / ssTot));

    return { fn, derivativeFn, eqText, rSquared };
  }, [validData, regressionType]);

  const { xTicks, yTicks, xMin, xMax, yMin, yMax } = useMemo(() => {
    const xVals = validData.map(d => d.x);
    const yVals = validData.map(d => d.y);
    
    const hasData = validData.length > 0;
    const dataXMin = hasData ? Math.min(...xVals) : 0;
    const dataXMax = hasData ? Math.max(...xVals) : 10;
    const dataYMin = hasData ? Math.min(...yVals) : 0;
    const dataYMax = hasData ? Math.max(...yVals) : 10;
    
    let isManualX = manualXMin !== '' && manualXMax !== '' && !isNaN(manualXMin) && !isNaN(manualXMax);
    let isManualY = manualYMin !== '' && manualYMax !== '' && !isNaN(manualYMin) && !isNaN(manualYMax);
    
    let fXMin = isManualX ? parseFloat(manualXMin) : dataXMin;
    let fXMax = isManualX ? parseFloat(manualXMax) : dataXMax;
    let fYMin = isManualY ? parseFloat(manualYMin) : dataYMin;
    let fYMax = isManualY ? parseFloat(manualYMax) : dataYMax;
    
    if (startXAtZero) {
      fXMin = isManualX && parseFloat(manualXMin) >= 0 ? parseFloat(manualXMin) : 0;
      if (fXMax <= fXMin) fXMax = fXMin + 10;
    }
    
    if (fXMax <= fXMin) fXMax = fXMin + 1;
    if (fYMax <= fYMin) fYMax = fYMin + 1;

    const xStepFloat = parseFloat(manualXStep);
    const hasManualXStep = !isNaN(xStepFloat) && xStepFloat > 0;
    
    const yStepFloat = parseFloat(manualYStep);
    const hasManualYStep = !isNaN(yStepFloat) && yStepFloat > 0;

    let xT;
    if (hasManualXStep) {
        xT = [];
        for (let i = fXMin; i <= fXMax + (xStepFloat/100); i += xStepFloat) {
            xT.push(Number(i.toPrecision(10)));
            if (xT.length > 200) break; // Safety net limit
        }
    } else {
        xT = getNiceTicks(fXMin, fXMax, 7, isManualX);
    }

    let yT;
    if (hasManualYStep) {
        yT = [];
        for (let i = fYMin; i <= fYMax + (yStepFloat/100); i += yStepFloat) {
            yT.push(Number(i.toPrecision(10)));
            if (yT.length > 200) break; // Safety net limit
        }
    } else {
        yT = getNiceTicks(fYMin, fYMax, 7, isManualY);
    }
    
    return {
      xTicks: xT,
      yTicks: yT,
      xMin: hasManualXStep ? fXMin : xT[0],
      xMax: hasManualXStep ? fXMax : xT[xT.length - 1],
      yMin: hasManualYStep ? fYMin : yT[0],
      yMax: hasManualYStep ? fYMax : yT[yT.length - 1],
    };
  }, [validData, manualXMin, manualXMax, manualYMin, manualYMax, manualXStep, manualYStep, startXAtZero]);

  const scaleX = (x) => margins.left + ((x - xMin) / (xMax - xMin || 1)) * innerWidth;
  const scaleY = (y) => margins.top + innerHeight - ((y - yMin) / (yMax - yMin || 1)) * innerHeight;

  // --- Animation Effects ---
  
  useEffect(() => {
    if (isExporting) return; // Pause auto-state while manually building frames
    if (isAnimating) {
      setVisiblePointsCount(0);
      setLineDrawProgress(0);
      setHighlightProgress(0);
      setTangentDrawProgress(0);
    } else {
      setVisiblePointsCount(validData.length);
      setLineDrawProgress(1);
      setHighlightProgress(validData.filter(p => p.highlighted).length);
      setTangentDrawProgress(1);
    }
  }, [isAnimating, validData, isExporting]);

  useEffect(() => {
    if (!isAnimating || validData.length === 0 || isExporting) return;

    const numHighlighted = validData.filter(p => p.highlighted).length;
    const numTangents = (showBestFit && bestFit) ? validData.filter(p => p.showTangent).length : 0;

    let timer;
    if (visiblePointsCount < validData.length) {
      // Animate points appearing
      timer = setTimeout(() => {
        setVisiblePointsCount(prev => prev + 1);
      }, 400); // 400ms per point
    } else if (showBestFit && lineDrawProgress < 1) {
      // Animate line of best fit drawing
      timer = setTimeout(() => {
        setLineDrawProgress(prev => Math.min(1, prev + 0.05));
      }, 16); // 16ms interval for smooth drawing
    } else if (highlightProgress < numHighlighted) {
      // Animate highlights sequentially
      timer = setTimeout(() => {
        setHighlightProgress(prev => prev + 1);
      }, 800); // 800ms delay per highlight
    } else if (numTangents > 0 && tangentDrawProgress < 1) {
      // Animate tangent lines outwards
      timer = setTimeout(() => {
        setTangentDrawProgress(prev => Math.min(1, prev + 0.05));
      }, 16); // 16ms interval for smooth tangent drawing
    } else {
      // Pause, then restart loop
      timer = setTimeout(() => {
        setVisiblePointsCount(0);
        setLineDrawProgress(0);
        setHighlightProgress(0);
        setTangentDrawProgress(0);
      }, 2000); // 2 second pause before restart
    }
    return () => clearTimeout(timer);
  }, [isAnimating, visiblePointsCount, lineDrawProgress, highlightProgress, tangentDrawProgress, validData, showBestFit, bestFit, isExporting]);


  // --- Handlers ---

  const addPoint = () => setGraphData([...graphData, { id: Date.now(), x: '', y: '' }]);
  const removePoint = (id) => setGraphData(graphData.filter(p => p.id !== id));
  const updatePoint = (id, field, value) => {
    setGraphData(graphData.map(p => p.id === id ? { ...p, [field]: value } : p));
  };
  const clearData = () => setGraphData([]);

  const applyPreset = (type) => {
    let newData = [];
    const now = Date.now();
    const startX = startXAtZero ? 0 : -5;
    
    const a = isNaN(parseFloat(presetA)) ? 1 : parseFloat(presetA);
    const c = isNaN(parseFloat(presetC)) ? 0 : parseFloat(presetC);

    if (type === 'linear') {
      newData = Array.from({length: 11}, (_, i) => ({ id: now + i, x: startX + i, y: parseFloat((a * (startX + i) + c).toFixed(3)) }));
    } else if (type === 'quadratic') {
      newData = Array.from({length: 11}, (_, i) => ({ id: now + i, x: startX + i, y: parseFloat((a * ((startX + i) ** 2) + c).toFixed(3)) }));
    } else if (type === 'exponential') {
      newData = Array.from({length: 11}, (_, i) => ({ id: now + i, x: startX + i, y: parseFloat((a * (2 ** (startX + i)) + c).toFixed(3)) }));
    } else if (type === 'logarithmic') {
      newData = Array.from({length: 10}, (_, i) => ({ id: now + i, x: i + 1, y: parseFloat((a * Math.log(i + 1) + c).toFixed(3)) }));
    } else if (type === 'sine') {
      newData = Array.from({length: 21}, (_, i) => { const x = startXAtZero ? i * 0.5 : (i - 10) * 0.5; return { id: now + i, x, y: parseFloat((a * Math.sin(x) + c).toFixed(3)) }; });
    } else if (type === 'inverse') {
      newData = Array.from({length: 11}, (_, i) => {
        const x = startXAtZero ? i + 1 : i - 5;
        if (x === 0) return null; // Skip division by zero
        return { id: now + i, x, y: parseFloat(((a / x) + c).toFixed(3)) };
      }).filter(Boolean);
    } else if (type === 'inverseSquare') {
      newData = Array.from({length: 11}, (_, i) => {
        const x = startXAtZero ? i + 1 : i - 5;
        if (x === 0) return null; // Skip division by zero
        return { id: now + i, x, y: parseFloat(((a / (x * x)) + c).toFixed(3)) };
      }).filter(Boolean);
    } else if (type === 'scatter') {
      newData = Array.from({length: 15}, (_, i) => ({ id: now + i, x: parseFloat((Math.random() * 10).toFixed(1)), y: parseFloat((Math.random() * 10).toFixed(1)) }));
    }
    setGraphData(newData);
  };

  const handlePasteData = () => {
    const rows = pasteText.split('\n');
    const newData = rows.map((row, i) => {
      const cols = row.trim().split(/[\t,]+/).filter(Boolean);
      if (cols.length >= 2) {
        return { id: Date.now() + i, x: parseFloat(cols[0]), y: parseFloat(cols[1]) };
      }
      return null;
    }).filter(item => item !== null && !isNaN(item.x) && !isNaN(item.y));
    
    if (newData.length > 0) {
      setGraphData([...graphData, ...newData]);
      setPasteText('');
      setShowPaste(false);
    }
  };

  const downloadSVG = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgRef.current);
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "graph.svg";
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadPNG = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgRef.current);
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width * 2; 
      canvas.height = height * 2;
      const ctx = canvas.getContext("2d");
      ctx.scale(2, 2);
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      
      const imgUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imgUrl;
      link.download = "graph.png";
      link.click();
    };
    img.src = url;
  };

  const downloadGIF = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      // Load gif.js dynamically 
      if (!window.GIF) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      // Fetch the worker locally to bypass cross-origin web-worker restrictions
      const workerText = await fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js').then(r => r.text());
      const workerBlob = new Blob([workerText], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(workerBlob);

      const gif = new window.GIF({
        workers: 2,
        quality: 10,
        width: width,
        height: height,
        workerScript: workerUrl
      });

      // Reset internal animation state
      setVisiblePointsCount(0);
      setLineDrawProgress(0);
      setHighlightProgress(0);
      setTangentDrawProgress(0);
      await new Promise(r => setTimeout(r, 100)); // wait for React render flush

      const addFrame = async (delay) => {
        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(svgRef.current);
        if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        
        await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = width; 
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            
            gif.addFrame(canvas, { delay, copy: true });
            resolve();
          };
          img.src = url;
        });
      };

      // Scene 1: Empty graph delay
      await addFrame(500);

      // Scene 2: Points appearing
      for(let i=1; i<=validData.length; i++) {
        setVisiblePointsCount(i);
        await new Promise(r => setTimeout(r, 50)); 
        await addFrame(400); 
      }

      // Scene 3: Line of best fit sweeping across
      if (showBestFit && bestFit) {
        for(let i=1; i<=20; i++) {
          setLineDrawProgress(i/20);
          await new Promise(r => setTimeout(r, 50));
          await addFrame(20);
        }
      }

      // Scene 3.5: Sequential Highlights
      const numHighlighted = validData.filter(p => p.highlighted).length;
      for (let i = 1; i <= numHighlighted; i++) {
        setHighlightProgress(i);
        await new Promise(r => setTimeout(r, 50));
        await addFrame(800);
      }

      // Scene 3.75: Tangent Lines Outward
      const numTangents = (showBestFit && bestFit) ? validData.filter(p => p.showTangent).length : 0;
      if (numTangents > 0) {
        for(let i=1; i<=20; i++) {
          setTangentDrawProgress(i/20);
          await new Promise(r => setTimeout(r, 50));
          await addFrame(20);
        }
      }

      // Scene 4: Final pause to appreciate data
      await addFrame(2500);

      gif.on('finished', (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'graph-animation.gif';
        link.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
        if (!isAnimating) {
          setVisiblePointsCount(validData.length);
          setLineDrawProgress(1);
          setHighlightProgress(validData.filter(p => p.highlighted).length);
          setTangentDrawProgress(1);
        }
      });

      // Render it!
      gif.render();

    } catch (error) {
      console.error("Error generating GIF:", error);
      alert("Failed to generate GIF. Please try again.");
      setIsExporting(false);
      if (!isAnimating) {
        setVisiblePointsCount(validData.length);
        setLineDrawProgress(1);
        setHighlightProgress(validData.filter(p => p.highlighted).length);
        setTangentDrawProgress(1);
      }
    }
  };

  // Flag that determines what SVG logic triggers based on export or live playback
  const shouldAnimateDraw = isAnimating || isExporting;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans text-gray-800">
      
      {/* --- Sidebar Controls --- */}
      <div className="w-full md:w-80 bg-white border-r border-gray-200 overflow-y-auto shadow-sm flex flex-col z-10">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-3 sticky top-0 z-20">
          <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
            <LineChart className="text-white" size={20} />
          </div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">Graph Master</h1>
        </div>

        <div className="p-5 space-y-8 flex-1">
          
          {/* Metadata Section */}
          <section>
            <h2 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Settings2 size={12}/> Labels & Metadata
            </h2>
            <Input label="Graph Title" value={title} onChange={e => setTitle(e.target.value)} />
            <Input label="X-Axis Label" value={xAxisLabel} onChange={e => setXAxisLabel(e.target.value)} />
            <Input label="Y-Axis Label" value={yAxisLabel} onChange={e => setYAxisLabel(e.target.value)} />
          </section>

          {/* Graph Settings */}
          <section>
            <h2 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-4">Graph Properties</h2>
            <Toggle label="Prevent Negative X (Start at 0)" enabled={startXAtZero} setEnabled={setStartXAtZero} />
            <Toggle label="Animate Graph (Loop)" enabled={isAnimating} setEnabled={setIsAnimating} />
            <Toggle label="Show Grid Lines" enabled={showGrid} setEnabled={setShowGrid} />
            <Toggle label="Show Data Points" enabled={showPoints} setEnabled={setShowPoints} />
            <Toggle label="Connect Data Points" enabled={showConnectLine} setEnabled={setShowConnectLine} />
            {showConnectLine && <Toggle label="Shade Area Under Line" enabled={showConnectFill} setEnabled={setShowConnectFill} />}
            <Toggle label="Show Line of Best Fit" enabled={showBestFit} setEnabled={setShowBestFit} />
            {showBestFit && <Toggle label="Shade Area Under Curve" enabled={showFill} setEnabled={setShowFill} />}
            
            {showBestFit && (
               <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 my-2">
                 <Select 
                    label="Trendline Type" 
                    value={regressionType} 
                    onChange={(e) => setRegressionType(e.target.value)} 
                    options={[
                      { label: 'Linear', value: 'linear' },
                      { label: 'Quadratic', value: 'quadratic' },
                      { label: 'Exponential', value: 'exponential' },
                      { label: 'Logarithmic', value: 'logarithmic' }
                    ]} 
                 />
                 <Toggle label="Show Equation (R²)" enabled={showEquation} setEnabled={setShowEquation} />
               </div>
            )}
            
            <div className="mt-4 space-y-1 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <ColorPicker label="Point Color" value={pointColor} onChange={e => setPointColor(e.target.value)} />
              <ColorPicker label="Trendline Color" value={lineColor} onChange={e => setLineColor(e.target.value)} />
              {showConnectLine && <ColorPicker label="Connection Color" value={connectLineColor} onChange={e => setConnectLineColor(e.target.value)} />}
              {showConnectLine && showConnectFill && <ColorPicker label="Conn. Fill Color" value={connectFillColor} onChange={e => setConnectFillColor(e.target.value)} />}
              {showBestFit && showFill && <ColorPicker label="Fill Color" value={fillColor} onChange={e => setFillColor(e.target.value)} />}
              <ColorPicker label="Background" value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)} />
              
              <div className="flex items-center justify-between py-2 mt-2">
                <label className="text-sm font-medium text-gray-700">Point Size</label>
                <input type="range" min="2" max="15" value={pointSize} onChange={e => setPointSize(Number(e.target.value))} className="w-24 accent-blue-600" />
              </div>
              <div className="flex items-center justify-between py-2">
                <label className="text-sm font-medium text-gray-700">Line Width</label>
                <input type="range" min="1" max="10" value={lineWidth} onChange={e => setLineWidth(Number(e.target.value))} className="w-24 accent-blue-600" />
              </div>
            </div>
          </section>
          
          {/* Axis Bounds Overlay */}
          <section>
             <details className="group">
                <summary className="text-sm font-medium text-gray-700 cursor-pointer select-none flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                   Advanced Axis Bounds
                   <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="grid grid-cols-3 gap-3 mt-3 p-2">
                    <Input label="X Min" type="number" value={manualXMin} onChange={e => setManualXMin(e.target.value)} placeholder="Auto" />
                    <Input label="X Max" type="number" value={manualXMax} onChange={e => setManualXMax(e.target.value)} placeholder="Auto" />
                    <Input label="X Step" type="number" value={manualXStep} onChange={e => setManualXStep(e.target.value)} placeholder="Auto" />
                    
                    <Input label="Y Min" type="number" value={manualYMin} onChange={e => setManualYMin(e.target.value)} placeholder="Auto" />
                    <Input label="Y Max" type="number" value={manualYMax} onChange={e => setManualYMax(e.target.value)} placeholder="Auto" />
                    <Input label="Y Step" type="number" value={manualYStep} onChange={e => setManualYStep(e.target.value)} placeholder="Auto" />
                </div>
            </details>
          </section>

          {/* Quick Presets */}
          <section>
            <h2 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity size={12}/> Quick Presets
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Input label="Parameter 'a'" type="number" value={presetA} onChange={e => setPresetA(e.target.value)} />
              <Input label="Parameter 'c'" type="number" value={presetC} onChange={e => setPresetC(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => applyPreset('linear')} className="text-xs py-1.5 border border-gray-200 rounded bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors font-mono shadow-sm">y=ax+c</button>
              <button onClick={() => applyPreset('quadratic')} className="text-xs py-1.5 border border-gray-200 rounded bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors font-mono shadow-sm">y=ax²+c</button>
              <button onClick={() => applyPreset('exponential')} className="text-xs py-1.5 border border-gray-200 rounded bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors font-mono shadow-sm">y=a(2ˣ)+c</button>
              <button onClick={() => applyPreset('logarithmic')} className="text-xs py-1.5 border border-gray-200 rounded bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors font-mono shadow-sm">y=a·ln(x)+c</button>
              <button onClick={() => applyPreset('sine')} className="text-xs py-1.5 border border-gray-200 rounded bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors font-mono shadow-sm">y=a·sin(x)+c</button>
              <button onClick={() => applyPreset('inverse')} className="text-xs py-1.5 border border-gray-200 rounded bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors font-mono shadow-sm">y=a/x+c</button>
              <button onClick={() => applyPreset('inverseSquare')} className="text-xs py-1.5 border border-gray-200 rounded bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors font-mono shadow-sm">y=a/x²+c</button>
              <button onClick={() => applyPreset('scatter')} className="text-xs py-1.5 border border-gray-200 rounded bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors font-mono shadow-sm">Random</button>
            </div>
          </section>

          {/* Data Entry Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <FileJson size={12}/> Data Points
              </h2>
              <div className="flex gap-2">
                 <button onClick={() => setShowPaste(!showPaste)} className="text-[10px] uppercase font-bold text-gray-500 hover:text-blue-600 transition-colors">Import CSV</button>
                 <button onClick={clearData} className="text-[10px] uppercase font-bold text-gray-500 hover:text-red-600 transition-colors">Clear All</button>
              </div>
            </div>

            {showPaste && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-800 mb-2">Paste X,Y pairs separated by commas or tabs:</p>
                <textarea 
                  className="w-full text-sm p-2 border border-blue-200 rounded focus:ring-blue-500 mb-2 h-24 font-mono text-gray-700" 
                  value={pasteText} 
                  onChange={e => setPasteText(e.target.value)}
                  placeholder="1.5, 4.2&#10;2.0, 5.1&#10;3.2, 7.8"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowPaste(false)} className="text-xs px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded">Cancel</button>
                  <button onClick={handlePasteData} className="text-xs px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded font-medium shadow-sm">Process Data</button>
                </div>
              </div>
            )}

            <div className="space-y-2 mb-3 max-h-64 overflow-y-auto pr-1 pb-4">
              {graphData.map((point, i) => (
                <div key={point.id} className="flex gap-2 items-center group">
                  <div className="w-6 text-center text-xs font-mono text-gray-400 select-none">{i+1}</div>
                  <input
                    type="number"
                    value={point.x}
                    onChange={(e) => updatePoint(point.id, 'x', e.target.value)}
                    className="w-1/2 border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500 border shadow-sm"
                    placeholder="X value"
                  />
                  <input
                    type="number"
                    value={point.y}
                    onChange={(e) => updatePoint(point.id, 'y', e.target.value)}
                    className="w-1/2 border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500 border shadow-sm"
                    placeholder="Y value"
                  />
                  <button
                    onClick={() => updatePoint(point.id, 'highlighted', !point.highlighted)}
                    className={`p-1.5 rounded transition-colors ${point.highlighted ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'}`}
                    title="Highlight Point"
                  >
                    <Target size={16} />
                  </button>
                  <button
                    onClick={() => updatePoint(point.id, 'showTangent', !point.showTangent)}
                    className={`p-1.5 rounded transition-colors ${point.showTangent ? 'text-purple-500 bg-purple-50' : 'text-gray-400 hover:text-purple-500 hover:bg-purple-50'}`}
                    title="Show Tangent to Curve"
                  >
                    <TrendingUp size={16} />
                  </button>
                  <button
                    onClick={() => removePoint(point.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {graphData.length === 0 && <p className="text-sm text-gray-400 italic text-center py-4">No data points. Add some to get started!</p>}
            </div>
            
            <button
              onClick={addPoint}
              className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
            >
              <Plus size={16} /> Add Point
            </button>
          </section>

        </div>
      </div>

      {/* --- Main Display (Graph) --- */}
      <div className="flex-1 overflow-hidden p-4 md:p-8 flex flex-col relative bg-gray-100/50">
        
        {/* Toolbar */}
        <div className="flex justify-end gap-3 mb-4 shrink-0 flex-wrap">
          <button onClick={downloadPNG} className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">
            <ImageIcon size={16} /> PNG
          </button>
          <button onClick={downloadSVG} className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">
            <Download size={16} /> SVG
          </button>
          <button onClick={downloadGIF} disabled={isExporting} className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-sm font-medium transition-colors ${isExporting ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-blue-600'}`}>
            {isExporting ? <Loader size={16} className="animate-spin" /> : <Film size={16} />}
            {isExporting ? 'Creating GIF...' : 'GIF'}
          </button>
        </div>

        {/* SVG Container */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden relative">
          
          <svg 
            id="chart-svg"
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`} 
            className="w-full h-full max-h-full drop-shadow-sm font-sans"
            style={{ backgroundColor: backgroundColor }}
          >
            <defs>
              <clipPath id="graphClip">
                <rect 
                  x={margins.left - pointSize} 
                  y={margins.top - pointSize} 
                  width={innerWidth + pointSize * 2} 
                  height={innerHeight + pointSize * 2} 
                />
              </clipPath>
              <marker id="highlight-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
              </marker>
            </defs>

            {/* Background Base */}
            <rect width="100%" height="100%" fill={backgroundColor} />

            {/* Grid Lines */}
            {showGrid && xTicks.map(tick => (
              <line 
                key={`grid-x-${tick}`} 
                x1={scaleX(tick)} y1={margins.top} 
                x2={scaleX(tick)} y2={margins.top + innerHeight} 
                stroke={tick === 0 ? "#9ca3af" : "#f3f4f6"} 
                strokeWidth={tick === 0 ? "2" : "1"} 
              />
            ))}
            {showGrid && yTicks.map(tick => (
              <line 
                key={`grid-y-${tick}`} 
                x1={margins.left} y1={scaleY(tick)} 
                x2={margins.left + innerWidth} y2={scaleY(tick)} 
                stroke={tick === 0 ? "#9ca3af" : "#f3f4f6"} 
                strokeWidth={tick === 0 ? "2" : "1"} 
              />
            ))}

            {/* Axes */}
            <line x1={margins.left} y1={margins.top + innerHeight} x2={margins.left + innerWidth} y2={margins.top + innerHeight} stroke="#374151" strokeWidth="2" strokeLinecap="round" />
            <line x1={margins.left} y1={margins.top} x2={margins.left} y2={margins.top + innerHeight} stroke="#374151" strokeWidth="2" strokeLinecap="round" />

            {/* Crosshair lines for 0 if applicable */}
            {yMin < 0 && yMax > 0 && (
                <line x1={margins.left} y1={scaleY(0)} x2={width - margins.right} y2={scaleY(0)} stroke="#111827" strokeWidth="2" opacity="0.3"/>
            )}
            {xMin < 0 && xMax > 0 && (
                <line x1={scaleX(0)} y1={margins.top} x2={scaleX(0)} y2={height - margins.bottom} stroke="#111827" strokeWidth="2" opacity="0.3"/>
            )}

            {/* Ticks and Labels */}
            {xTicks.map(tick => (
              <g key={`tick-x-${tick}`}>
                <line x1={scaleX(tick)} y1={margins.top + innerHeight} x2={scaleX(tick)} y2={margins.top + innerHeight + 6} stroke="#374151" strokeWidth="2" />
                <text x={scaleX(tick)} y={margins.top + innerHeight + 22} textAnchor="middle" fontSize="12" fill="#4b5563">
                  {formatNumber(tick)}
                </text>
              </g>
            ))}
            {yTicks.map(tick => (
              <g key={`tick-y-${tick}`}>
                <line x1={margins.left - 6} y1={scaleY(tick)} x2={margins.left} y2={scaleY(tick)} stroke="#374151" strokeWidth="2" />
                <text x={margins.left - 12} y={scaleY(tick) + 4} textAnchor="end" fontSize="12" fill="#4b5563">
                  {formatNumber(tick)}
                </text>
              </g>
            ))}

            {/* Titles */}
            <text x={width / 2} y={margins.top / 2} textAnchor="middle" fontSize="24" fontWeight="bold" fill="#111827">
              {title}
            </text>
            <text x={width / 2} y={height - (margins.bottom / 3)} textAnchor="middle" fontSize="16" fontWeight="500" fill="#374151">
              {xAxisLabel}
            </text>
            <text 
              x={margins.left / 3} 
              y={height / 2} 
              transform={`rotate(-90 ${margins.left / 3} ${height / 2})`} 
              textAnchor="middle" 
              fontSize="16" 
              fontWeight="500"
              fill="#374151"
            >
              {yAxisLabel}
            </text>

            <g clipPath="url(#graphClip)">
              {/* Shaded Area Under Curve */}
              {showBestFit && showFill && bestFit && (!shouldAnimateDraw || (visiblePointsCount >= validData.length && lineDrawProgress > 0)) && (
                <polygon
                  points={(() => {
                    const currentXMax = shouldAnimateDraw ? xMin + (xMax - xMin) * lineDrawProgress : xMax;
                    const pts = [];
                    const steps = 150;
                    
                    let startX = xMin;
                    if (regressionType === 'logarithmic' && startX <= 0) startX = 0.001; // Protect domain
                    if (currentXMax < startX) return '';

                    // Start on the X-axis
                    pts.push(`${scaleX(startX)},${scaleY(0)}`);
                    
                    for (let i = 0; i <= steps; i++) {
                      const x = startX + (currentXMax - startX) * (i / steps);
                      let y = bestFit.fn(x);
                      
                      if (!isNaN(y) && isFinite(y)) {
                        // Clamp y to avoid SVG breaking and fill polygon collapsing on asymptotes
                        const yRange = (yMax - yMin) || 1;
                        y = Math.max(yMin - yRange * 2, Math.min(yMax + yRange * 2, y));
                        pts.push(`${scaleX(x)},${scaleY(y)}`);
                      }
                    }
                    
                    // Drop back down to the X-axis
                    pts.push(`${scaleX(currentXMax)},${scaleY(0)}`);
                    return pts.join(' ');
                  })()}
                  fill={fillColor}
                  opacity="0.4"
                />
              )}

              {/* Shaded Area Under Connection Line */}
              {showConnectLine && showConnectFill && validData.length > 1 && (
                <polygon
                  points={(() => {
                    const visibleData = shouldAnimateDraw ? validData.slice(0, visiblePointsCount) : validData;
                    if (visibleData.length < 2) return '';
                    
                    const pts = [];
                    // Start on the X-axis at the first visible point
                    pts.push(`${scaleX(visibleData[0].x)},${scaleY(0)}`);
                    
                    // Trace through points
                    visibleData.forEach(p => {
                      pts.push(`${scaleX(p.x)},${scaleY(p.y)}`);
                    });
                    
                    // Drop back down to the X-axis at the last visible point
                    pts.push(`${scaleX(visibleData[visibleData.length - 1].x)},${scaleY(0)}`);
                    
                    return pts.join(' ');
                  })()}
                  fill={connectFillColor}
                  opacity="0.4"
                />
              )}

              {/* Connection Line */}
              {showConnectLine && validData.length > 1 && (
                <polyline
                  points={(shouldAnimateDraw ? validData.slice(0, visiblePointsCount) : validData)
                    .map(p => `${scaleX(p.x)},${scaleY(p.y)}`)
                    .join(' ')}
                  fill="none"
                  stroke={connectLineColor}
                  strokeWidth={lineWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.8"
                />
              )}

              {/* Line of Best Fit */}
              {showBestFit && bestFit && (!shouldAnimateDraw || (visiblePointsCount >= validData.length && lineDrawProgress > 0)) && (
                <polyline
                  points={(() => {
                    const currentXMax = shouldAnimateDraw ? xMin + (xMax - xMin) * lineDrawProgress : xMax;
                    const pts = [];
                    const steps = 150; // Smooth curve resolution
                    for (let i = 0; i <= steps; i++) {
                      const x = xMin + (currentXMax - xMin) * (i / steps);
                      if (regressionType === 'logarithmic' && x <= 0) continue; // Protect domain
                      
                      const y = bestFit.fn(x);
                      // Prevent crazy asymptotes from breaking the SVG render view
                      if (!isNaN(y) && isFinite(y) && y > yMin - (yMax-yMin)*2 && y < yMax + (yMax-yMin)*2) {
                        pts.push(`${scaleX(x)},${scaleY(y)}`);
                      }
                    }
                    return pts.join(' ');
                  })()}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth={lineWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
                />
              )}

              {/* Data Points */}
              {showPoints && (shouldAnimateDraw ? validData.slice(0, visiblePointsCount) : validData).map((p) => {
                const cx = scaleX(p.x);
                const cy = scaleY(p.y);
                const xAxisY = (yMin <= 0 && yMax >= 0) ? scaleY(0) : margins.top + innerHeight;
                const yAxisX = (xMin <= 0 && xMax >= 0) ? scaleX(0) : margins.left;
                
                // Only show highlight elements after all animations are finished, sequentially
                const showHighlightsNow = p.highlighted && (!shouldAnimateDraw || (visiblePointsCount >= validData.length && (!showBestFit || lineDrawProgress >= 1) && highlightProgress > p.highlightIdx));

                return (
                  <g key={`pt-${p.id}`}>
                    {/* Highlight Projections */}
                    {showHighlightsNow && (
                      <g>
                        <line 
                          x1={cx} y1={xAxisY} 
                          x2={cx} y2={cy + (cy < xAxisY ? pointSize + 4 : -pointSize - 4)} 
                          stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 4" 
                          markerEnd="url(#highlight-arrow)" opacity="0.8"
                        />
                        <line 
                          x1={yAxisX} y1={cy} 
                          x2={cx + (cx > yAxisX ? -pointSize - 4 : pointSize + 4)} y2={cy} 
                          stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 4" 
                          markerEnd="url(#highlight-arrow)" opacity="0.8"
                        />
                        <text x={cx + 12} y={cy - 12} fontSize="14" fontWeight="bold" fill="#111827" stroke={backgroundColor} strokeWidth="6" strokeLinejoin="round">
                          ({formatNumber(p.x)}, {formatNumber(p.y)})
                        </text>
                        <text x={cx + 12} y={cy - 12} fontSize="14" fontWeight="bold" fill="#f59e0b">
                          ({formatNumber(p.x)}, {formatNumber(p.y)})
                        </text>
                      </g>
                    )}

                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={pointSize} 
                      fill={showHighlightsNow ? "#f59e0b" : pointColor} 
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="transition-all duration-300 hover:r-8 cursor-pointer"
                    >
                      <title>{`X: ${p.x}, Y: ${p.y}`}</title>
                    </circle>
                  </g>
                );
              })}

              {/* Tangent Lines */}
              {showBestFit && bestFit && validData.map((p) => {
                const totalHighlights = validData.filter(pt => pt.highlighted).length;
                const showTangentNow = p.showTangent && (!shouldAnimateDraw || (visiblePointsCount >= validData.length && (!showBestFit || lineDrawProgress >= 1) && highlightProgress >= totalHighlights && tangentDrawProgress > 0));
                if (!showTangentNow) return null;

                const m = bestFit.derivativeFn(p.x);
                const fx = bestFit.fn(p.x);

                if (isNaN(m) || isNaN(fx)) return null;

                const tProgress = shouldAnimateDraw ? tangentDrawProgress : 1;
                const currentXMin = p.x - (p.x - xMin) * tProgress;
                const currentXMax = p.x + (xMax - p.x) * tProgress;

                const yAtXMin = m * (currentXMin - p.x) + fx;
                const yAtXMax = m * (currentXMax - p.x) + fx;

                return (
                  <g key={`tangent-${p.id}`}>
                    <line
                      x1={scaleX(currentXMin)}
                      y1={scaleY(yAtXMin)}
                      x2={scaleX(currentXMax)}
                      y2={scaleY(yAtXMax)}
                      stroke="#a855f7"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                      opacity="0.8"
                    />
                    <circle cx={scaleX(p.x)} cy={scaleY(fx)} r={4} fill="#a855f7" stroke="#ffffff" strokeWidth="1" />
                  </g>
                );
              })}
            </g>

            {/* Equation Overlay directly inside SVG for exports */}
            {showBestFit && showEquation && bestFit && (!shouldAnimateDraw || lineDrawProgress >= 1) && (
              <g transform={`translate(${width - margins.right - 10}, ${margins.top + 20})`} textAnchor="end">
                {/* Text stroke for legibility against grid/lines */}
                <text x="0" y="0" fontSize="14" fontFamily="monospace" fontWeight="bold" fill="#111827" stroke={backgroundColor} strokeWidth="6" strokeLinejoin="round">
                  {bestFit.eqText}
                </text>
                <text x="0" y="0" fontSize="14" fontFamily="monospace" fontWeight="bold" fill="#111827">
                  {bestFit.eqText}
                </text>

                <text x="0" y="22" fontSize="14" fontFamily="monospace" fontWeight="bold" fill="#111827" stroke={backgroundColor} strokeWidth="6" strokeLinejoin="round">
                  R² = {formatNumber(bestFit.rSquared)}
                </text>
                <text x="0" y="22" fontSize="14" fontFamily="monospace" fontWeight="bold" fill="#111827">
                  R² = {formatNumber(bestFit.rSquared)}
                </text>
              </g>
            )}

          </svg>
        </div>
      </div>
    </div>
  );
}