const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {scenarios,svg}=require('./build-question-diagrams');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const blocks=read('dynamic_electric_field_buzz_questions.txt').trim().split(/\n\s*\n(?=Type:)/);
assert.equal(blocks.length,8);
assert.deepEqual(blocks.map(b=>Number(b.match(/^Score: (\d+)/m)[1])),[1,1,1,2,2,3,2,3]);
const expected={1:[1,0],2:[1,1],3:[-1,-1],6:[1,-1]};
assert.equal(scenarios.filter(s=>s.mystery).length,2);
for(const s of scenarios) {
  // Independent Coulomb-force sum, including the sign of the test charge.
  let fx=0,fy=0;
  for(const [x,y,q] of s.sources){const r=Math.hypot(x,y);fx-=s.testQ*q*x/r**3;fy-=s.testQ*q*y/r**3;}
  assert.deepEqual([Math.sign(fx),Math.sign(fy)],expected[s.number]);
  const b=blocks[s.number-1];
  assert.equal(b.match(/^\*[a-z]\. (.+)$/m)[1],s.answer);
  if(s.mystery){
    assert.match(b,/sign of the mystery charge/);assert(!/fixed (positive|negative) source/.test(b));
    assert.match(svg(s),/>\?<\/text>/);assert.match(svg(s),/>Net electric force<\/text>/);
    assert.equal((svg(s).match(/fill="#687680"/g)||[]).length,1);
    assert(s.answer.startsWith(s.sources[0][2]>0?'Positive':'Negative'));
    const [x,y,q]=s.sources[0],r=Math.hypot(x,y);
    const opposite=[fx+2*s.testQ*q*x/r**3,fy+2*s.testQ*q*y/r**3].map(Math.sign);
    assert.notDeepEqual(opposite,expected[s.number],'Opposite mystery sign must not fit the shown force');
  }else assert.match(b,/released from rest/);
  if(s.number===6)assert.equal(Math.abs(fx/fy),4);
  assert.equal(read(`question-diagrams/question-${s.number}.svg`),svg(s));
}
for(const n of [4,5])assert.match(blocks[n-1],/^Type: F, Number/m);
for(const n of [7,8]){assert.match(blocks[n-1],/^Type: E/m);assert.match(blocks[n-1],/^Meta-grading: busybee/m);}
for(const name of ['dynamic_electric_field_lab.html','u6l2-dynamic-electric-field-buzz-assessment-template.html','u6l2-dynamic-electric-field-buzz-assessment-template-preview.html']) {
  const html=read(name);const images=[...html.matchAll(/class="ef-question-image" src="data:image\/svg\+xml;base64,([^"]+)"/g)];
  assert.equal(images.length,4);
  images.forEach((m,i)=>assert.equal(Buffer.from(m[1],'base64').toString(),svg(scenarios[i])));
}
console.log('PASS: four image questions, independent force-direction checks, correct keys, two unchanged numeric types and two BusyBee essays; original 15-point scoring retained.');
