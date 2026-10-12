const fs=require('fs'),path=require('path');
const {createIllustrationKit}=require('./u4l4-illustration-kit.cjs');
const A=createIllustrationKit();
const root=__dirname, dir=path.join(root,'unit 4');
const backup=path.join(root,'u4l4-art-backups');fs.mkdirSync(backup,{recursive:true});
const files=['build-u4l4-support.cjs',...['energy-chain','repair-connection','testing-evidence'].map(n=>'unit 4/rube-goldberg-'+n+'.html')];
for(const rel of files){const dest=path.join(backup,path.basename(rel));if(!fs.existsSync(dest))fs.copyFileSync(path.join(root,rel),dest);}
let s=fs.readFileSync(path.join(root,'build-u4l4-support.cjs'),'utf8');
if(!s.includes('// Detailed SVG kit')){
s=s.replace("const dir=", "// Detailed SVG kit\nconst A=require('./u4l4-illustration-kit.cjs').createIllustrationKit();\nconst dir=");
s=s.replace(/^const ball=.*$/m,'const ball=(x,y)=>A.ball(x,y);');
s=s.replace(/^const car=.*$/m,'const car=(x,y)=>A.car(x,y+34);');
s=s.replace(/^const doms=.*$/m,"const doms=(x,y)=>[0,1,2].map(i=>A.domino(x+i*35+17,y+65,17,65)).join('');");
s=s.replace(/^const ramp=.*$/m,'const ramp=(x=80,y=90)=>`<path d="M${x} ${y}L${x+210} ${y+140}H${x}Z" fill="url(#u4-corrugation)" stroke="#8c6a42" stroke-width="3"/><path d="M${x+14} ${y+36}L${x+171} ${y+128}H${x+14}Z" fill="#f1e7d4" stroke="#bf9e6a" stroke-width="2"/><path d="M${x} ${y}L${x+210} ${y+140}" stroke="#f5ddb1" stroke-width="7"/><path d="M${x} ${y-3}L${x+212} ${y+138}" stroke="#826440" stroke-width="2"/>${ball(x+18,y-13)}`;');
s=s.replace('<defs><marker id="a"','<defs>${A.defs}<marker id="a"');
s=s.replace('</marker></defs>${body}</svg>','</marker></defs>${A.background(840,290)}${body}</svg>');
s=s.replace(/^const chain=.*$/m,"const chain=()=>A.surface(40,232,585)+ramp(55,90)+doms(330,165)+car(455,187)+A.finish(600,232,78)+text(49,279,'START',18)+text(571,279,'FINISH',18);");
s=s.replace('const reviewCss=',"require('./u4l4-support-art.cjs')(decks,{svg,text,arrow,chain,box});\nconst reviewCss=");
s=s.replace('const reviewCss=`','const reviewCss=`.app{box-shadow:0 8px 25px #18324c14}header{background:linear-gradient(110deg,#edf5fa,#fff);border-bottom:1px solid #dce6ed;margin-bottom:12px}button{transition:background .15s,border-color .15s}.scene{border:1px solid #d9e4ec}');
fs.writeFileSync(path.join(root,'build-u4l4-support.cjs'),s);
}
const css=`\n/* Detailed workshop artwork */\nmain{box-shadow:0 8px 25px #18324c14}main header{background:linear-gradient(110deg,#edf5fa,#fff);border-bottom:1px solid #dce6ed;margin-bottom:10px}main .scene{background:#f4f8fb}main svg text{paint-order:stroke;stroke:#f3f7fa;stroke-width:3px;stroke-linejoin:round}main .art-zoom{margin:8px 20px;font-size:14px}main .art-zoom summary{cursor:pointer;color:#285f9f;font-weight:650;min-height:30px}main .art-scroll{overflow:auto;border:2px solid #b9cbd7;border-radius:12px}main .art-scroll:focus-visible{outline:3px solid #9b5900}main .art-scroll svg{width:960px;max-width:none;height:auto}main .art-zoom p{margin:5px 0}@media(min-width:900px){main .art-zoom{display:none}}\n`;
const zoom=`<details class="art-zoom" id="artZoom"><summary>Enlarge diagram</summary><p>Swipe sideways, or focus the diagram and use the arrow keys.</p><div id="artLarge" class="art-scroll" role="region" aria-label="Enlarged diagram" tabindex="0"></div></details>`;
// Clone only visible SVG content for a readable static enlargement; never change the animation state.
const zoomScript=`\n(()=>{const d=document.getElementById('artZoom'),target=document.getElementById('artLarge'),source=document.querySelector('.scene > svg');function sync(){if(!d.open)return;const clone=source.cloneNode(true);clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));clone.removeAttribute('id');target.replaceChildren(clone);}d.addEventListener('toggle',sync);new MutationObserver(()=>{if(d.open)sync()}).observe(source,{childList:true,subtree:true,attributes:true,characterData:true});})();\n`;
for(const name of ['energy-chain','repair-connection','testing-evidence']){
const p=path.join(dir,'rube-goldberg-'+name+'.html');let h=fs.readFileSync(p,'utf8');if(h.includes('/* Detailed workshop artwork */'))continue;
h=h.replace('</style>',css+'</style>');
h=h.replace('<defs>','<defs>'+A.defs);
const width=name==='energy-chain'?1000:960,height=name==='energy-chain'?460:name==='repair-connection'?440:480;
h=h.replace('</defs>','</defs>'+A.background(width,height));
h=h.replace('</svg>','</svg>'+zoom);
h=h.replace("(()=>{'use strict';", "(()=>{'use strict';\nconst Art=("+createIllustrationKit.toString()+")();");
h=h.replace('</script>',zoomScript+'</script>');
// Retain existing geometry, motion, branching outcomes, and question controls.
if(name==='energy-chain'){
h=h.replace('<path d="M50 368H946" stroke="#57677c" stroke-width="4"/>',A.surface(50,368,896));
h=h.replace(/<g id="ball">[\s\S]*?<\/g>/,'<g id="ball">'+A.ball(0,0,18)+'</g>');
h=h.replace(/<g id="car">[\s\S]*?<\/g>/,'<g id="car">'+A.car(0,0)+'</g>');
h=h.replace(/g\.innerHTML='<rect x="-14"[\s\S]*?';\$\('dominoes'\)/,"g.innerHTML=Art.domino(0,0,14,76);$('dominoes')");
h=h.replace('fill="#d8e0e9"','fill="url(#u4-wood)"');
h=h.replace('<path d="M210 226', '<path d="M88 180h44M88 211h44M88 242h44M88 273h44M88 304h44M88 335h44" stroke="#b79767" stroke-width="2"/><path d="M210 226');
}else{
const start=h.indexOf('function ball('),end=h.indexOf(name==='repair-connection'?'function releasePoint(':'function scene(',start);
if(start<0||end<0)throw Error('Missing art helpers: '+name);
const methods=name==='repair-connection'?`function ball(x,y,angle=0,ghost=false,highlight=false){return ghost?\`<circle cx="\${x}" cy="\${y}" r="12" fill="none" stroke="#65768d" stroke-width="2" stroke-dasharray="4 3"/>\`:Art.ball(x,y,12,angle)+(highlight?\`<circle cx="\${x}" cy="\${y}" r="16" fill="none" stroke="#a94713" stroke-width="2"/>\`:'');}\nfunction car(x,y,top){return Art.car(x,y,82,top);}\n`:`function ball(x,y,angle){return Art.ball(x,y,12,angle);}\nfunction car(x){return Art.car(x,125,82,true);}\n`;
h=h.slice(0,start)+methods+h.slice(end);
h=h.replaceAll('fill="#eef2f7"','fill="#fffbf2"');
if(name==='repair-connection'){
h=h.replace("out+='<path d=\"M45 352H912\" stroke=\"#57677c\" stroke-width=\"4\"/><path", "out+=Art.surface(45,352,867)+'<path");
// Marked dominoes in the side view rotate around the same original pivot.
h=h.replace(/out\+=`<g transform="translate\(\$\{x\} 350\) rotate\(\$\{angle\}\)">[\s\S]*?<\/g>`;/,"out+=Art.domino(x,350,14,height,angle);");
// Top-view faces preserve the old morph dimensions.
h=h.replace(/out\+=`<rect x="\$\{x-7\}" y="\$\{310-mix[\s\S]*?\/>`;/,"out+=Art.topDomino(x-7,310-mix(23,5,fall),mix(14,i===0?42:58,fall),mix(46,10,fall));");
}else{
h=h.replace(/s\+=`<rect x="\$\{x-7\}" y="\$\{125-[\s\S]*?\/>`;/,"s+=Art.topDomino(x-7,125-(23-18*f),14+((i===0?42:58)-14)*f,46-36*f);");
}
}
// Subtler paper/cardboard texture and brighter, legible components.
h=h.replaceAll('fill="#e0bd89"','fill="url(#u4-wood)"').replaceAll('stroke="#b68e58" stroke-width="2"','stroke="#b68e58" stroke-width="1" opacity=".4"').replaceAll('stroke="#c19c65" stroke-width="2"','stroke="#c19c65" stroke-width="1" opacity=".4"');
fs.writeFileSync(p,h);console.log('Detailed artwork: '+name);
}
