// Deterministic vector diagrams: geometry and answer keys share the same source.
const fs = require('node:fs');
const path = require('node:path');
const scenarios = [
  {number:1, label:'Mystery sign with opposing forces', mystery:true, testQ:1, sources:[[-1,0,2],[1,0,1]], answer:'Positive (+): its repulsion is stronger than the opposing repulsion from +Q', choices:['Positive (+): its repulsion is stronger than the opposing repulsion from +Q','Negative (−): its attraction overcomes the other source','Zero charge: only the known source pushes the test charge right','Either sign produces a net force to the right'], description:'The positive test charge lies midway between a mystery source of magnitude 2Q on the left and a known +Q source on the right. The NET electric-force arrow on the test charge points right.'},
  {number:2, label:'Mystery sign with a negative test charge', mystery:true, testQ:-1, sources:[[0,-1,-1],[-1,0,-1]], answer:'Negative (−): it repels the negative test charge downward', choices:['Positive (+): it pushes the negative test charge downward','Zero charge: the known source supplies both force components','Negative (−): it repels the negative test charge downward','Either sign produces the same diagonal net force'], description:'A negative test charge has a mystery source of magnitude Q directly above and a known −Q source directly left, both at the same distance. The NET electric-force arrow on the test charge points diagonally down and right.'},
  {number:3, label:'Initial motion of a negative test charge', testQ:-1, sources:[[-1,0,1],[0,-1,1]], answer:'Diagonally up and left, equally in both directions', choices:['Diagonally down and right, equally in both directions','Diagonally up and right, equally in both directions','Diagonally up and left, equally in both directions','It remains at rest because the two forces cancel'], description:'Two fixed +Q sources are equally distant from a NEGATIVE test charge: one directly left and one directly above.'},
  {number:6, label:'Initial motion with unequal distances', testQ:1, sources:[[-1,0,1],[0,-2,-1]], origin:[320,285],scale:110,height:420, answer:'Up and right, with the rightward component four times the upward component', choices:['Up and right, equally in both directions','Up and right, with the upward component four times the rightward component','Down and right, with the rightward component four times the downward component','Up and right, with the rightward component four times the upward component'], description:'A +Q source is distance d directly left of a positive test charge. A −Q source is distance 2d directly above it. The two source charges have equal magnitudes. Use the inverse-square relationship F ∝ 1/r².'}
];
function netForce(s) {
  return s.sources.reduce((f,[x,y,q])=>{const r=Math.hypot(x,y);return [f[0]-s.testQ*q*x/r**3,f[1]-s.testQ*q*y/r**3];},[0,0]);
}
function svg(s) {
  const [cx,cy]=s.origin||[320,205],scale=s.scale||140,height=s.height||320;
  const force=netForce(s);
  const drawCharge=(x,y,q,label,test=false)=>`<circle cx="${x}" cy="${y}" r="25" fill="${test?'#f5c84b':q==='?'?'#687680':q>0?'#bd3c3c':'#2867ae'}" stroke="#183044" stroke-width="2"/><text x="${x}" y="${y+10}" font-family="Arial,sans-serif" font-size="31" font-weight="bold" text-anchor="middle" fill="${test?'#183044':'white'}">${q==='?'?'?':q>0?'+':'−'}</text><text x="${x}" y="${test&&s.mystery&&force[1]>0?y-39:y+49}" font-family="Arial,sans-serif" font-size="18" text-anchor="middle" fill="#183044">${label}</text>`;
  const sources=s.sources.map(([x,y,q],i)=>drawCharge(cx+x*scale,cy+y*scale,s.mystery&&i===0?'?':q,s.mystery&&i===0?`Mystery (${Math.abs(q)===2?'2Q':'Q'})`:`${q>0?'+':'−'}Q source`)).join('');
  let arrow='';
  if(s.mystery) {
    const r=Math.hypot(...force),dx=force[0]/r,dy=force[1]/r,ex=cx+dx*90,ey=cy+dy*90;
    arrow=`<path d="M ${cx} ${cy} L ${ex} ${ey} M ${ex-dx*11-dy*7} ${ey-dy*11+dx*7} L ${ex} ${ey} L ${ex-dx*11+dy*7} ${ey-dy*11-dx*7}" fill="none" stroke="#216e4c" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><text x="${dy?476:385}" y="${dy?268:170}" font-family="Arial,sans-serif" font-size="18" text-anchor="middle" fill="#216e4c">Net electric force</text>`;
  }
  const dimensions=s.number===6?'<path d="M 210 365 H 320 M 210 359 V 371 M 320 359 V 371 M 405 65 V 285 M 399 65 H 411 M 399 285 H 411" fill="none" stroke="#647784" stroke-width="1.5"/><g font-family="Arial,sans-serif" font-size="20" fill="#183044"><text x="265" y="391" text-anchor="middle">d</text><text x="420" y="180">2d</text></g>':'';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="${height}" viewBox="0 0 640 ${height}"><rect x="1" y="1" width="638" height="${height-2}" rx="12" fill="#f3f6f7" stroke="#bccbd3"/><text x="22" y="29" font-family="Arial,sans-serif" font-size="17" fill="#425968">${s.mystery?'The arrow shows the combined force':'Starting position · released from rest'}</text>${sources}${dimensions}${arrow}${drawCharge(cx,cy,s.testQ,s.testQ>0?'Test (+q)':'Test (−q)',true)}</svg>`;
}
function build() {
  const dir=path.join(__dirname,'question-diagrams');fs.mkdirSync(dir,{recursive:true});
  for(const s of scenarios)fs.writeFileSync(path.join(dir,`question-${s.number}.svg`),svg(s));
  const sourceFile=path.join(__dirname,'dynamic_electric_field_lab.html');
  let source=fs.readFileSync(sourceFile,'utf8');
  const questionFile=path.join(__dirname,'dynamic_electric_field_buzz_questions.txt');
  const blocks=fs.readFileSync(questionFile,'utf8').trim().split(/\r?\n\s*\r?\n(?=Type:)/);
  for(const s of scenarios) {
    const score=(blocks[s.number-1].match(/^Score: (\d+)/m)||[])[1];
    if(!score)throw new Error(`Missing score for Question ${s.number}`);
    blocks[s.number-1]=[
      'Type: MC',`Score: ${score}`,'Label: a','Options: MaintainOrder','Meta-unit: U6','Meta-lesson: U6L2',
      `Meta-skill: ${s.mystery?'infer_charge_sign_from_force':'initial_motion_from_charge_arrangement'}`,`Meta-diagram: question-${s.number}.svg`,
      s.mystery ? `${s.number}) Use the image above. ${s.description} The net force is due only to the two fixed sources. Q denotes a positive magnitude; the mystery source has the magnitude shown but an unknown sign. What is the sign of the mystery charge?` : `${s.number}) Use the starting-position image above. ${s.description} All sources remain fixed. The test charge is released from rest. Which direction will it begin moving, or will it remain at rest?`,
      ...s.choices.map((choice,i)=>`${choice===s.answer?'*':''}${String.fromCharCode(97+i)}. ${choice}`)
    ].join('\n');
    const slot=new RegExp(`<div class="ef-slot"><p class="ef-slot-label">${s.number}\\.[\\s\\S]*?<a:question></a:question></div>`);
    if(!slot.test(source))throw new Error(`Missing slot ${s.number}`);
    source=source.replace(slot,`<div class="ef-slot"><p class="ef-slot-label">${s.number}. ${s.label}</p><img class="ef-question-image" src="data:image/svg+xml;base64,${Buffer.from(svg(s)).toString('base64')}" width="640" height="${s.height||320}" style="display:block;width:100%;max-width:640px;height:auto;margin:10px 0" alt="${s.description}${s.mystery?'':' The test charge starts at rest.'}"><a:question></a:question></div>`);
  }
  fs.writeFileSync(questionFile,blocks.join('\n\n')+'\n');
  fs.writeFileSync(sourceFile,source);
}
if(require.main===module)build();
module.exports={scenarios,svg,build};
