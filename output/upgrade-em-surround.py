from pathlib import Path
p=Path('problem-walkthoughs/unit 5/EM Spectrum & Energy Explorer..html')
s=p.read_text(encoding='utf-8')
css='''
    /* Scientific figure treatment: artwork stays independent of the main canvas. */
    #spectrumBar .spec-cell{background-image:linear-gradient(180deg,#ffffff90,transparent 65%,#ffffff30);transition:filter .18s,box-shadow .18s}
    #spectrumBar .spec-cell.active{box-shadow:inset 0 0 0 2px #172f46,inset 0 -5px 0 #172f46}
    #spectrumBar .band-symbol svg{width:48px;height:34px;filter:drop-shadow(0 2px 1px #ffffff80)}
    #spectrumBar .visible-sliver{background:linear-gradient(90deg,#e73e32,#ffbb35,#71cf54,#2a9bd9,#6b42b8)!important}
    .spectrum-ruler{font-size:12px}.frequency-label{letter-spacing:.04em}
    .relative.h-9>svg{opacity:.55}.relative.h-9>svg>path:first-child{stroke-width:1}
    .zoom-bar{height:22px;border-radius:3px;box-shadow:inset 0 1px 0 #ffffffa0,inset 0 -1px 0 #00000025}
    .zoom-ticks{position:relative;display:block;height:32px;padding:0;font-size:12px}
    .zoom-ticks>span{position:absolute;top:7px;transform:translateX(-50%);white-space:nowrap}
    .zoom-ticks>span::before{content:'';position:absolute;left:50%;top:-7px;height:5px;border-left:1px solid #475569}
    .zoom-ticks>span:first-child{transform:none}.zoom-ticks>span:first-child::before{left:0}
    .zoom-ticks>span:last-child{transform:translateX(-100%)}.zoom-ticks>span:last-child::before{left:100%}
    .zoom-compare{margin-top:14px}
    .zoom-compare .comparison-detail{max-width:440px;gap:7px;position:relative;padding:12px 0 0;border-top:2px solid var(--band-accent,#64748b)}
    .comparison-wave{max-height:none;width:100%}
    .comparison-example{font-size:15px;color:#172f46;font-variant-numeric:tabular-nums}
    .comparison-object{font-size:13px;font-weight:600;color:#243d54}
    .comparison-note{font-size:11px;color:#52677b;opacity:1}
    @media(prefers-reduced-motion:reduce){#spectrumBar .spec-cell{transition:none}}
'''
s=s.replace('  </style>',css+'  </style>')
a=s.index('function bandSymbol(index){');b=s.index('function prepareScene()',a)
s=s[:a]+'''function bandSymbol(index){
  const arts=[
    '<path d="M23 9L11 34H35Z" fill="#94a3b8"/><path d="M23 9V34M17 22H29M13 30H33M17 22L29 30M29 22L17 30" stroke="#334155"/><circle cx="23" cy="8" r="3" fill="#dc2626"/><path d="M15 4Q9 9 15 14M31 4Q37 9 31 14M10 1Q1 9 10 18M36 1Q45 9 36 18" stroke="#c2413a" fill="none"/>',
    '<path d="M12 11Q10 31 34 29Z" fill="#cbd5e1" stroke="#475569"/><path d="M12 11L34 29Q24 11 12 11Z" fill="#edf3fa" stroke="#64748b"/><path d="M22 20L35 7M19 29L16 35H34L28 29" stroke="#475569" fill="none"/><circle cx="35" cy="7" r="2.5" fill="#ea580c"/><path d="M36 1Q44 4 44 12M38 5Q41 7 41 10" fill="none" stroke="#ea580c"/>',
    '<path d="M14 33L10 22Q9 18 12 18L17 23V9Q17 5 20 8V18V4Q22 1 24 4V18V6Q27 3 28 7V19V11Q31 8 32 12V27Q30 36 22 36Z" fill="#f97316" stroke="#9a3412"/><path d="M19 28V21M24 28V18M28 26V20" stroke="#fef08a" stroke-width="3"/>',
    '<path d="M17 4L8 33H35Z" fill="#c7e7f8" stroke="#3f6885"/><path d="M1 16L20 19L45 9M20 19L45 15M20 19L45 21M20 19L45 27" fill="none" stroke="#22c55e"/>',
    '<path d="M13 2C40 12 6 24 33 36M33 2C6 12 40 24 13 36" stroke="#0e7490" stroke-width="3" fill="none"/>'+[6,12,18,24,30].map((y,i)=>`<path d="M${i%2?16:14} ${y}H${i%2?30:32}" stroke="${i%2?'#fb7185':'#fbbf24'}" stroke-width="2"/>`).join(''),
    '<rect x="7" y="1" width="32" height="36" rx="4" fill="#253553"/><path d="M20 32V23L13 15M25 32V19L20 7M25 19L26 5M29 22L32 9M29 25L36 17" stroke="#e0e7ff" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M16 20L23 17M21 23L29 22" stroke="#a5b4fc" fill="none"/>',
    [ [18,13],[26,12],[31,20],[25,27],[16,26],[13,19],[22,20] ].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="6" fill="${i%2?'#7c3aed':'#3b82f6'}" stroke="#e0e7ff"/><circle cx="${x-2}" cy="${y-2}" r="1.6" fill="#ffffff90"/>`).join('')
  ];
  return `<svg viewBox="0 0 46 38" aria-hidden="true" stroke-width="1.3" stroke-linejoin="round">${arts[index]}</svg>`;
}
''' + s[b:]
a=s.index('const WAVE_COMPARISONS=');b=s.index('function alignZoom(){',a)
s=s[:a]+'''const WAVE_COMPARISONS=[
  {wave:'100 m',object:'Football field · 100 m between goal lines',ratio:1},
  {wave:'12 cm',object:'Baseball · diameter 7.4 cm',ratio:12/7.4},
  {wave:'70 μm',object:'Human hair · example diameter 70 μm',ratio:1},
  {wave:'550 nm',object:'Bacterium · example length 1 μm',ratio:.55},
  {wave:'50 nm',object:'Virus · example diameter 100 nm',ratio:.5},
  {wave:'0.1 nm',object:'Atom · example diameter 0.1 nm',ratio:1},
  {wave:'1 pm',object:'Nucleus · example diameter 5 fm',ratio:200}
];
function comparisonArtwork(index){
 const stripes=Array.from({length:10},(_,i)=>`<rect x="${160+i*12}" y="126" width="12" height="66" fill="${i%2?'#35825c':'#276f4d'}"/>`).join('');
 const arts=[
  `<ellipse cx="220" cy="198" rx="82" ry="9" fill="#163f2720"/><rect x="147" y="121" width="146" height="76" rx="3" fill="#174e38"/>${stripes}<rect x="160" y="126" width="120" height="66" fill="none" stroke="#e2efdf"/>`+Array.from({length:9},(_,i)=>`<path d="M${172+i*12} 126V192" stroke="#ffffff80"/>`).join('')+`<path d="M220 126V192M153 148V170H160M287 148V170H280" fill="none" stroke="#f8fafc"/><circle cx="220" cy="159" r="11" fill="none" stroke="#ffffffb0"/>`,
  `<ellipse cx="220" cy="205" rx="64" ry="8" fill="#0f172a16"/><circle cx="220" cy="159" r="60" fill="url(#ivory)" stroke="#9ca3af"/>`+Array.from({length:25},(_,i)=>`<circle cx="${173+(i%5)*23}" cy="${123+Math.floor(i/5)*18}" r=".7" fill="#94a3b860"/>`).join('')+`<path d="M190 107Q238 159 190 211M250 107Q202 159 250 211" stroke="#b73d42" stroke-width="2" fill="none"/>`+Array.from({length:12},(_,i)=>{const y=113+i*8,x=190+24*Math.sin((y-107)/104*Math.PI);return `<path d="M${x-3} ${y-2}l6 4M${440-x-3} ${y+2}l6-4" stroke="#b73d42" stroke-width="1.2"/>`;}).join(''),
  `<path d="M160 107Q220 97 280 107V205Q220 215 160 205Z" fill="url(#hair)" stroke="#795035"/>`+Array.from({length:7},(_,i)=>`<path d="M160 ${110+i*14}q30 15 60 0t60 0" stroke="#d4a678" stroke-width="2" fill="none"/><path d="M${175+i%2*16} ${110+i*14}l8 8M${237+i%2*13} ${110+i*14}l-6 8" stroke="#704425" fill="none"/>`).join(''),
  `<path d="M160 149q-25-24-38-12M165 176q-24 24-40 13M276 145q22-25 42-8M275 174q29 27 48 5" stroke="#649e89" fill="none"/><rect x="160" y="126" width="120" height="68" rx="34" fill="url(#cell)" stroke="#287b68" stroke-width="2"/><rect x="166" y="132" width="108" height="56" rx="28" fill="none" stroke="#b9f7de"/><path d="M181 163q13-30 23-3t21-1t23 1t14-4" stroke="#647256" stroke-width="2" fill="none"/>`+Array.from({length:16},(_,i)=>`<circle cx="${180+(i*17)%78}" cy="${140+(i*13)%39}" r="${i%3?1.5:2.5}" fill="#2d8966"/>`).join(''),
  Array.from({length:16},(_,i)=>{const a=i*Math.PI/8,x=220+49*Math.cos(a),y=159+49*Math.sin(a),xx=220+60*Math.cos(a),yy=159+60*Math.sin(a);return `<path d="M${x} ${y}L${xx} ${yy}" stroke="#297b99" stroke-width="2"/><circle cx="${xx}" cy="${yy}" r="3" fill="#52c5ca" stroke="#237b91"/>`;}).join('')+`<circle cx="220" cy="159" r="48" fill="url(#virus)" stroke="#237b91" stroke-width="2"/><circle cx="220" cy="159" r="35" fill="#d4f6ea80" stroke="#8ee4da"/><path d="M201 141q29-14 25 4t-23 16t25 8t-4 16" fill="none" stroke="#47668a" stroke-width="2"/>`,
  `<circle cx="220" cy="159" r="60" fill="url(#cloud)"/><circle cx="220" cy="159" r="59" fill="none" stroke="#94a3b8" stroke-dasharray="2 4"/>`+Array.from({length:110},(_,i)=>{const a=i*2.39996,r=56*Math.sqrt((i+.5)/110);return `<circle cx="${220+Math.cos(a)*r}" cy="${159+Math.sin(a)*r}" r="${1+(i%3)*.3}" fill="#6366f1" opacity="${.14+.4*(1-r/60)}"/>`;}).join('')+`<circle cx="220" cy="159" r="3" fill="#be4564"/><text x="220" y="237" text-anchor="middle" font-size="11" fill="#52677b">Electron cloud · schematic boundary</text>`,
  `<circle cx="103" cy="158" r=".6" fill="#334155"/><path d="M104 157L191 116M104 159L191 202" stroke="#94a3b8" stroke-dasharray="3 3" fill="none"/><circle cx="239" cy="158" r="63" fill="#f1f3fc" stroke="#94a3b8"/>`+Array.from({length:19},(_,i)=>{const a=i*2.39996,r=9*Math.sqrt(i);return `<circle cx="${239+Math.cos(a)*r}" cy="${158+Math.sin(a)*r}" r="10" fill="url(#${i%2?'proton':'neutron'})" stroke="#ffffff90"/>`;}).join('')+`<text x="103" y="184" text-anchor="middle" font-size="11" fill="#52677b">5 fm</text><text x="239" y="239" text-anchor="middle" font-size="11" fill="#52677b">Nucleus enlarged ×200</text>`
 ];return arts[index];
}
function wavelengthComparison(index){
 const c=WAVE_COMPARISONS[index],gamma=index===6,objectWidth=gamma?.6:120,period=objectWidth*c.ratio,points=[];
 for(let x=-period;x<=440+period;x+=1.5)points.push(`${x.toFixed(1)},${(36-16*Math.cos(2*Math.PI*(x-40)/period)).toFixed(1)}`);
 const motion=matchMedia('(prefers-reduced-motion: reduce)').matches?'':`<animateTransform attributeName="transform" type="translate" from="0 0" to="${period} 0" dur="${(period/55).toFixed(2)}s" repeatCount="indefinite"/>`;
 return `<span class="comparison-detail"><span class="comparison-example">One wavelength · ${c.wave}</span>
 <svg class="comparison-wave" viewBox="0 0 440 260" role="img" aria-label="${c.wave} wavelength compared with ${c.object}${gamma?'; nucleus enlarged 200 times in inset':''}">
 <defs><clipPath id="comparisonClip"><rect x="4" y="12" width="432" height="48"/></clipPath>
 <radialGradient id="ivory" cx="32%" cy="25%" r="80%"><stop stop-color="#fffef6"/><stop offset=".65" stop-color="#ede9df"/><stop offset="1" stop-color="#b4b9c0"/></radialGradient>
 <linearGradient id="hair"><stop stop-color="#5e3926"/><stop offset=".45" stop-color="#c99b69"/><stop offset="1" stop-color="#543522"/></linearGradient>
 <radialGradient id="cell" cx="35%" cy="25%"><stop stop-color="#d1fae5"/><stop offset=".6" stop-color="#8eddb4"/><stop offset="1" stop-color="#4aa98a"/></radialGradient>
 <radialGradient id="virus" cx="30%" cy="30%"><stop stop-color="#c8f5ed"/><stop offset="1" stop-color="#59b8bd"/></radialGradient>
 <radialGradient id="cloud"><stop stop-color="#818cf8" stop-opacity=".6"/><stop offset=".6" stop-color="#a5b4fc" stop-opacity=".35"/><stop offset="1" stop-color="#c7d2fe" stop-opacity="0"/></radialGradient>
 <radialGradient id="proton" cx="30%" cy="25%"><stop stop-color="#fbcfe8"/><stop offset=".4" stop-color="#b65c9c"/><stop offset="1" stop-color="#71376d"/></radialGradient>
 <radialGradient id="neutron" cx="30%" cy="25%"><stop stop-color="#dbeafe"/><stop offset=".4" stop-color="#658bd2"/><stop offset="1" stop-color="#354b86"/></radialGradient></defs>
 <g clip-path="url(#comparisonClip)"><path d="M4 36H436" stroke="#cbd5e1" stroke-dasharray="3 5"/><polyline points="${points.join(' ')}" fill="none" stroke="#294963" stroke-width="2.5">${motion}</polyline></g>
 <path d="M40 66v6h${period}v-6" fill="none" stroke="#294963" stroke-width="1.3"/><text x="${40+period/2}" y="91" text-anchor="middle" fill="#294963" font-size="13">${c.wave}</text>
 ${comparisonArtwork(index)}
 ${gamma?'':`<path d="M160 220v6h120v-6" fill="none" stroke="#52677b" stroke-width="1.2"/>`}
 </svg><span class="comparison-object">${c.object}</span><span class="comparison-note">${gamma?'Wavelength is 200× the nucleus diameter.':'Wave and measured object share the same scale.'}</span></span>`;
}
''' +s[b:]
s=s.replace('const width=Math.min(360,bounds.width)','const width=Math.min(440,bounds.width)')
s=s.replace("  document.getElementById('zoomTicks').innerHTML=(vis?['700 nm (red)','600 nm','500 nm','400 nm (violet)']:b.ticks).map(t=>`<span>${t}</span>`).join('');",'''  const ranges=[[1e5,1],[1,1e-3],[1e-3,700e-9],[700e-9,400e-9],[400e-9,1e-8],[1e-8,1e-11],[1e-11,1e-14]];
  const [hi,lo]=ranges[currentIdx];
  const ticks=vis?[700e-9,600e-9,500e-9,400e-9]:[hi,Math.pow(10,Math.log10(hi)+(Math.log10(lo)-Math.log10(hi))/3),Math.pow(10,Math.log10(hi)+2*(Math.log10(lo)-Math.log10(hi))/3),lo];
  const format=v=>{const e=Math.floor(Math.log10(v)+1e-10),m=v/10**e;return `${Number(m.toPrecision(2))}×10<sup>${e}</sup> m`;};
  document.getElementById('zoomTicks').innerHTML=ticks.map((v,i)=>`<span style="left:${Math.log10(hi/v)/Math.log10(hi/lo)*100}%">${vis?['700 nm','600 nm','500 nm','400 nm'][i]:format(v)}</span>`).join('');
  document.getElementById('zoomCompare').style.setProperty('--band-accent',b.accent);''')
s=s.replace('stroke="#64748b" stroke-width="1.5"/>`;','stroke="${b.accent}" stroke-opacity=".65" stroke-width="1.2"/><path d="M ${x1} 0 L 0 34 H ${w} L ${x2} 0 Z" fill="${b.accent}" fill-opacity=".045"/>`;')
p.write_text(s,encoding='utf-8',newline='\n')
