import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { Copy, Play, RotateCcw, Plus, Trash2 } from 'lucide-react';

const defaultConfig = {
  title: 'Convert 12 miles/hr to meters/sec',
  given: {
    numeratorValue: 12,
    numeratorUnit: 'miles',
    denominatorValue: 1,
    denominatorUnit: 'hr',
  },
  factors: [
    {
      numeratorValue: 1609,
      numeratorUnit: 'meters',
      denominatorValue: 1,
      denominatorUnit: 'miles',
    },
    {
      numeratorValue: 1,
      numeratorUnit: 'hr',
      denominatorValue: 60,
      denominatorUnit: 'min',
    },
    {
      numeratorValue: 1,
      numeratorUnit: 'min',
      denominatorValue: 60,
      denominatorUnit: 'sec',
    },
  ],
  options: {
    decimals: 2,
  },
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function computeResult(config) {
  const numeratorParts = [
    {
      value: safeNumber(config.given.numeratorValue),
      unit: config.given.numeratorUnit,
      source: 'given',
    },
  ];
  const denominatorParts = [
    {
      value: safeNumber(config.given.denominatorValue),
      unit: config.given.denominatorUnit,
      source: 'given',
    },
  ];

  config.factors.forEach((factor, index) => {
    numeratorParts.push({
      value: safeNumber(factor.numeratorValue),
      unit: factor.numeratorUnit,
      source: `factor-${index}`,
    });
    denominatorParts.push({
      value: safeNumber(factor.denominatorValue),
      unit: factor.denominatorUnit,
      source: `factor-${index}`,
    });
  });

  const cancelledTop = new Set();
  const cancelledBottom = new Set();

  numeratorParts.forEach((top, i) => {
    if (cancelledTop.has(i)) return;
    const matchIndex = denominatorParts.findIndex((bottom, j) => {
      if (cancelledBottom.has(j)) return false;
      return String(top.unit).trim() !== '' && String(top.unit).trim() === String(bottom.unit).trim();
    });
    if (matchIndex !== -1) {
      cancelledTop.add(i);
      cancelledBottom.add(matchIndex);
    }
  });

  const remainingTop = numeratorParts.filter((_, i) => !cancelledTop.has(i));
  const remainingBottom = denominatorParts.filter((_, i) => !cancelledBottom.has(i));

  const topProduct = remainingTop.reduce((acc, item) => acc * item.value, 1);
  const bottomProduct = remainingBottom.reduce((acc, item) => acc * item.value, 1);
  const value = bottomProduct === 0 ? NaN : topProduct / bottomProduct;

  return {
    numeratorParts,
    denominatorParts,
    cancelledTop,
    cancelledBottom,
    remainingTop,
    remainingBottom,
    topProduct,
    bottomProduct,
    value,
  };
}

function generateHtml(config) {
  const escaped = JSON.stringify(config).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Unit Conversion Builder Output</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f1f5f9;
      margin: 0;
      padding: 24px;
    }
    .wrap {
      max-width: 1100px;
      margin: 0 auto;
      background: white;
      border-radius: 24px;
      padding: 24px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.10);
      border: 1px solid #e2e8f0;
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: white;
      border: 1px solid #cbd5e1;
      border-radius: 16px;
      padding: 12px;
      min-width: 155px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    }
    .fraction-line {
      height: 2px;
      background: #334155;
      margin: 6px 0;
    }
    .pair {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: center;
    }
    .value {
      font-weight: 800;
      font-size: 22px;
      color: #0f172a;
      min-width: 44px;
      text-align: center;
    }
    .unit {
      padding: 4px 10px;
      border-radius: 10px;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      font-weight: 700;
      position: relative;
    }
    .cancel {
      background: #fff1f2;
      color: #be123c;
      border-color: #fecdd3;
    }
    .cancel::after {
      content: '';
      position: absolute;
      left: -3px;
      right: -3px;
      top: 50%;
      height: 3px;
      background: #e11d48;
      transform: rotate(-11deg);
      border-radius: 999px;
    }
    .final-box {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: white;
      border: 2px solid #818cf8;
      border-radius: 16px;
      padding: 16px 20px;
      box-shadow: 0 8px 24px rgba(99,102,241,0.1);
    }
    .eq {
      font-size: 34px;
      color: #94a3b8;
      font-weight: 800;
    }
    .title {
      text-align: center;
      font-size: 28px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 18px;
    }
    .controls {
      text-align: center;
      margin-top: 18px;
    }
    button {
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 12px;
      padding: 10px 18px;
      font-weight: 700;
      cursor: pointer;
    }
    .hidden {
      opacity: 0;
      transform: translateY(10px);
      pointer-events: none;
    }
    .shown {
      opacity: 1;
      transform: translateY(0);
    }
    .anim {
      transition: all 0.45s ease;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div id="title" class="title"></div>
    <div id="steps" class="row"></div>
    <div id="final" class="row" style="margin-top: 26px;"></div>
    <div class="controls"><button id="restart">Replay</button></div>
  </div>

  <script>
    const config = ${escaped};

    function n(v){ const x = Number(v); return Number.isFinite(x) ? x : 0; }

    function compute(config) {
      const numeratorParts = [{ value: n(config.given.numeratorValue), unit: config.given.numeratorUnit, source: 'given' }];
      const denominatorParts = [{ value: n(config.given.denominatorValue), unit: config.given.denominatorUnit, source: 'given' }];
      config.factors.forEach((factor, index) => {
        numeratorParts.push({ value: n(factor.numeratorValue), unit: factor.numeratorUnit, source: 'factor-' + index });
        denominatorParts.push({ value: n(factor.denominatorValue), unit: factor.denominatorUnit, source: 'factor-' + index });
      });

      const cancelledTop = new Set();
      const cancelledBottom = new Set();

      numeratorParts.forEach((top, i) => {
        if (cancelledTop.has(i)) return;
        const matchIndex = denominatorParts.findIndex((bottom, j) => {
          if (cancelledBottom.has(j)) return false;
          return String(top.unit).trim() !== '' && String(top.unit).trim() === String(bottom.unit).trim();
        });
        if (matchIndex !== -1) {
          cancelledTop.add(i);
          cancelledBottom.add(matchIndex);
        }
      });

      const remainingTop = numeratorParts.filter((_, i) => !cancelledTop.has(i));
      const remainingBottom = denominatorParts.filter((_, i) => !cancelledBottom.has(i));
      const topProduct = remainingTop.reduce((acc, item) => acc * item.value, 1);
      const bottomProduct = remainingBottom.reduce((acc, item) => acc * item.value, 1);
      const value = bottomProduct === 0 ? NaN : topProduct / bottomProduct;

      return { numeratorParts, denominatorParts, cancelledTop, cancelledBottom, remainingTop, remainingBottom, topProduct, bottomProduct, value };
    }

    function fmt(v, decimals) {
      if (!Number.isFinite(v)) return 'undefined';
      return Number(v).toFixed(decimals);
    }

    function buildFraction(topValue, topUnit, bottomValue, bottomUnit, topCancelled=false, bottomCancelled=false) {
      const card = document.createElement('div');
      card.className = 'card anim hidden';
      card.innerHTML = 
        '<div class="pair"><div class="value">' + topValue + '</div><div class="unit ' + (topCancelled ? 'cancel' : '') + '">' + topUnit + '</div></div>' +
        '<div class="fraction-line"></div>' +
        '<div class="pair"><div class="value">' + bottomValue + '</div><div class="unit ' + (bottomCancelled ? 'cancel' : '') + '">' + bottomUnit + '</div></div>';
      return card;
    }

    async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

    async function render() {
      const steps = document.getElementById('steps');
      const final = document.getElementById('final');
      const title = document.getElementById('title');
      steps.innerHTML = '';
      final.innerHTML = '';
      title.textContent = config.title || 'Unit Conversion';

      const calc = compute(config);
      const cards = [];
      cards.push(buildFraction(config.given.numeratorValue, config.given.numeratorUnit, config.given.denominatorValue, config.given.denominatorUnit, calc.cancelledTop.has(0), calc.cancelledBottom.has(0)));
      config.factors.forEach((factor, index) => {
        const mul = document.createElement('div');
        mul.className = 'eq anim hidden';
        mul.textContent = '×';
        steps.appendChild(mul);
        cards.push(mul);
        const card = buildFraction(
          factor.numeratorValue,
          factor.numeratorUnit,
          factor.denominatorValue,
          factor.denominatorUnit,
          calc.cancelledTop.has(index + 1),
          calc.cancelledBottom.has(index + 1)
        );
        cards.push(card);
      });

      cards.forEach(node => steps.appendChild(node));

      for (const node of cards) {
        await delay(350);
        node.classList.remove('hidden');
        node.classList.add('shown');
      }

      await delay(600);

      const remainingTop = calc.remainingTop.map(item => item.value + ' ' + item.unit).join(' × ');
      const remainingBottom = calc.remainingBottom.map(item => item.value + ' ' + item.unit).join(' × ');
      const mid = document.createElement('div');
      mid.className = 'final-box anim hidden';
      mid.innerHTML = '<div><div style="font-size: 18px; font-weight: 800; color: #0f172a;">' + remainingTop + '</div><div class="fraction-line" style="width: 100%;"></div><div style="font-size: 18px; font-weight: 800; color: #0f172a;">' + remainingBottom + '</div></div>';

      const eq = document.createElement('div');
      eq.className = 'eq anim hidden';
      eq.textContent = '=';

      const result = document.createElement('div');
      result.className = 'final-box anim hidden';
      result.innerHTML = '<div style="font-size: 34px; font-weight: 800; color: #0f172a;">' + fmt(calc.value, config.options?.decimals ?? 2) + '</div>' +
        '<div><div class="unit">' + (calc.remainingTop[0]?.unit || '') + '</div><div class="fraction-line"></div><div class="unit">' + (calc.remainingBottom[0]?.unit || '') + '</div></div>';

      final.appendChild(mid);
      final.appendChild(eq);
      final.appendChild(result);
      await delay(450);
      mid.classList.remove('hidden'); mid.classList.add('shown');
      await delay(550);
      eq.classList.remove('hidden'); eq.classList.add('shown');
      result.classList.remove('hidden'); result.classList.add('shown');
    }

    document.getElementById('restart').addEventListener('click', render);
    render();
  </script>
</body>
</html>`;
}

function FractionCard({ topValue, topUnit, bottomValue, bottomUnit, topCancelled, bottomCancelled, show }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: show ? 1 : 0.25, y: show ? 0 : 10 }}
      transition={{ duration: 0.35 }}
      className="bg-white border border-slate-300 rounded-2xl shadow-sm p-3 min-w-[160px]"
    >
      <div className="flex items-center justify-center gap-2">
        <div className="w-12 text-center text-xl font-bold text-slate-900">{topValue}</div>
        <div className={`px-3 py-1 rounded-lg text-sm font-bold border relative ${topCancelled ? 'bg-rose-50 border-rose-200 text-rose-700 line-through decoration-4' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
          {topUnit}
        </div>
      </div>
      <div className="h-[2px] bg-slate-700 my-2" />
      <div className="flex items-center justify-center gap-2">
        <div className="w-12 text-center text-xl font-bold text-slate-900">{bottomValue}</div>
        <div className={`px-3 py-1 rounded-lg text-sm font-bold border relative ${bottomCancelled ? 'bg-rose-50 border-rose-200 text-rose-700 line-through decoration-4' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
          {bottomUnit}
        </div>
      </div>
    </motion.div>
  );
}

function FinalFraction({ top, bottom, value, topUnit, bottomUnit }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <div className="bg-white border-2 border-indigo-400 rounded-2xl px-6 py-4 shadow-lg">
        <div className="text-lg font-bold text-slate-900 text-center whitespace-nowrap">{top}</div>
        <div className="h-[3px] bg-slate-700 rounded my-2" />
        <div className="text-lg font-bold text-slate-900 text-center whitespace-nowrap">{bottom}</div>
      </div>
      <div className="text-4xl font-bold text-slate-400">=</div>
      <div className="bg-white border-2 border-indigo-400 rounded-2xl px-6 py-4 shadow-lg flex items-center gap-3">
        <div className="text-4xl font-bold text-slate-900">{value}</div>
        <div>
          <div className="px-3 py-1 rounded-lg text-sm font-bold border bg-blue-50 border-blue-100 text-blue-700 text-center">{topUnit}</div>
          <div className="h-[3px] bg-slate-700 rounded my-2" />
          <div className="px-3 py-1 rounded-lg text-sm font-bold border bg-amber-50 border-amber-100 text-amber-700 text-center">{bottomUnit}</div>
        </div>
      </div>
    </div>
  );
}

export default function UnitConversionBuilderCanvas() {
  const [configText, setConfigText] = useState(JSON.stringify(defaultConfig, null, 2));
  const [config, setConfig] = useState(defaultConfig);
  const [revealCount, setRevealCount] = useState(0);
  const [error, setError] = useState('');

  const calc = useMemo(() => computeResult(config), [config]);

  const allCardCount = 1 + config.factors.length;

  const applyConfig = () => {
    try {
      const parsed = JSON.parse(configText);
      setConfig(parsed);
      setError('');
      setRevealCount(0);
    } catch (err) {
      setError('JSON error: ' + err.message);
    }
  };

  const replay = async () => {
    setRevealCount(0);
    for (let i = 1; i <= allCardCount; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setRevealCount(i);
    }
  };

  const loadExample = (example) => {
    const next = deepClone(example);
    setConfig(next);
    setConfigText(JSON.stringify(next, null, 2));
    setRevealCount(0);
    setError('');
  };

  const examples = {
    mph: defaultConfig,
    density: {
      title: 'Convert 2.50 g/cm^3 to kg/m^3',
      given: { numeratorValue: 2.5, numeratorUnit: 'g', denominatorValue: 1, denominatorUnit: 'cm^3' },
      factors: [
        { numeratorValue: 1, numeratorUnit: 'kg', denominatorValue: 1000, denominatorUnit: 'g' },
        { numeratorValue: 1000000, numeratorUnit: 'cm^3', denominatorValue: 1, denominatorUnit: 'm^3' },
      ],
      options: { decimals: 0 },
    },
    chemistry: {
      title: 'Convert 25.0 mg caffeine/mL to mol caffeine/L',
      given: { numeratorValue: 25, numeratorUnit: 'mg caffeine', denominatorValue: 1, denominatorUnit: 'mL' },
      factors: [
        { numeratorValue: 1, numeratorUnit: 'g caffeine', denominatorValue: 1000, denominatorUnit: 'mg caffeine' },
        { numeratorValue: 1, numeratorUnit: 'mol caffeine', denominatorValue: 194.19, denominatorUnit: 'g caffeine' },
        { numeratorValue: 1000, numeratorUnit: 'mL', denominatorValue: 1, denominatorUnit: 'L' },
      ],
      options: { decimals: 3 },
    },
  };

  const generatedHtml = useMemo(() => generateHtml(config), [config]);

  const topText = calc.remainingTop.map((item) => `${item.value} ${item.unit}`).join(' × ') || '1';
  const bottomText = calc.remainingBottom.map((item) => `${item.value} ${item.unit}`).join(' × ') || '1';
  const finalValue = Number.isFinite(calc.value) ? calc.value.toFixed(config.options?.decimals ?? 2) : 'undefined';

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <Card className="rounded-3xl shadow-xl border-slate-200">
          <CardHeader>
            <CardTitle className="text-2xl">Unit Conversion HTML Builder</CardTitle>
            <p className="text-slate-600 text-sm">
              Edit the JSON, apply it, preview the animation, and copy the generated standalone HTML.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => loadExample(examples.mph)}>Load 12 mph Example</Button>
              <Button variant="outline" onClick={() => loadExample(examples.density)}>Load Density Example</Button>
              <Button variant="outline" onClick={() => loadExample(examples.chemistry)}>Load Chemistry Example</Button>
            </div>

            <div className="space-y-2">
              <Label>Builder JSON</Label>
              <Textarea
                value={configText}
                onChange={(e) => setConfigText(e.target.value)}
                className="min-h-[340px] font-mono text-sm"
              />
              {error ? <div className="text-sm font-semibold text-rose-600">{error}</div> : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={applyConfig}>Apply JSON</Button>
              <Button variant="outline" onClick={replay}><Play className="w-4 h-4 mr-2" />Preview Animation</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setConfigText(JSON.stringify(defaultConfig, null, 2));
                  setConfig(defaultConfig);
                  setRevealCount(0);
                  setError('');
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />Reset
              </Button>
            </div>

            <Tabs defaultValue="preview">
              <TabsList>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="html">Generated HTML</TabsTrigger>
              </TabsList>
              <TabsContent value="preview" className="pt-4">
                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-inner min-h-[520px]">
                  <div className="text-center text-3xl font-bold text-slate-900 mb-6">{config.title}</div>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <FractionCard
                      topValue={config.given.numeratorValue}
                      topUnit={config.given.numeratorUnit}
                      bottomValue={config.given.denominatorValue}
                      bottomUnit={config.given.denominatorUnit}
                      topCancelled={calc.cancelledTop.has(0)}
                      bottomCancelled={calc.cancelledBottom.has(0)}
                      show={revealCount >= 1}
                    />
                    {config.factors.map((factor, index) => (
                      <React.Fragment key={index}>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: revealCount >= index + 2 ? 1 : 0.2, y: revealCount >= index + 2 ? 0 : 10 }}
                          className="text-3xl font-bold text-slate-400"
                        >
                          ×
                        </motion.div>
                        <FractionCard
                          topValue={factor.numeratorValue}
                          topUnit={factor.numeratorUnit}
                          bottomValue={factor.denominatorValue}
                          bottomUnit={factor.denominatorUnit}
                          topCancelled={calc.cancelledTop.has(index + 1)}
                          bottomCancelled={calc.cancelledBottom.has(index + 1)}
                          show={revealCount >= index + 2}
                        />
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="mt-10">
                    <FinalFraction
                      top={topText}
                      bottom={bottomText}
                      value={finalValue}
                      topUnit={calc.remainingTop[0]?.unit || ''}
                      bottomUnit={calc.remainingBottom[0]?.unit || ''}
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="html" className="pt-4">
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      await navigator.clipboard.writeText(generatedHtml);
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />Copy Standalone HTML
                  </Button>
                  <Textarea value={generatedHtml} readOnly className="min-h-[520px] font-mono text-xs" />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
