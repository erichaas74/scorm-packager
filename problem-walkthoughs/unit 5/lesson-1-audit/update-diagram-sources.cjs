const fs=require('fs'),path=require('path');
const sharp=require('C:/Users/erich/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=__dirname,base=path.join(root,'..','tab-accordion-diagrams'),out=path.join(root,'revised-assets');
(async()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(base,'diagram-manifest.json'),'utf8'));
 for(const block of manifest.filter(b=>b.course===1))for(const item of block.items){
  if(item.diagramIndex==='03-02')item.alt='Displacement versus time at one fixed point. Ten complete cycles occur in 1.0 second, giving a frequency of 10 hertz.';
  if(item.diagramIndex==='06-00'){
   fs.copyFileSync(item.svg,path.join(out,'reflection-original.svg'));
   fs.copyFileSync(path.join(out,'reflection-comparison.svg'),item.svg);
   fs.copyFileSync(path.join(out,'reflection-comparison.png'),item.image);
   item.alt='A fixed rope end inverts a reflected pulse; a free end keeps it upright. Smooth surfaces produce orderly specular reflection, while rough surfaces scatter reflected rays.';
  }
  if(item.diagramIndex.startsWith('04-')){
   let svg=fs.readFileSync(item.svg,'utf8');
   svg=svg.replace(/>2 m<\/text>/g,'>λ = 2 m</text>').replace(/>1 m<\/text>/g,'>λ = 1 m</text>');
   svg=svg.replace('</g><text x="720" y="624"','<text x="720" y="563" font-family="Arial,sans-serif" font-size="25" fill="#687e90" text-anchor="middle">Horizontal distance along the rope (same span in both rows)</text></g><text x="720" y="624"');
   // Put the axis description outside the scene clip, so it is never cut off.
   svg=svg.replace('<text x="720" y="563"','</g><g><text x="720" y="563"');
   fs.writeFileSync(item.svg,svg);await sharp(item.svg).png().toFile(item.image);
   item.alt='Two wave snapshots over the same horizontal distance. At a fixed speed of 8 metres per second, 4 hertz corresponds to wavelength 2 metres and 8 hertz corresponds to wavelength 1 metre.';
  }
 }
 fs.writeFileSync(path.join(base,'diagram-manifest.json'),JSON.stringify(manifest,null,2));
 console.log('Updated source diagrams and manifest descriptions.');
})();
