const fs=require('fs');const path=require('path');
const sharp=require('C:/Users/erich/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async()=>{const blocks=JSON.parse(fs.readFileSync(path.join(__dirname,'process-blocks.json'),'utf8'));for(const b of blocks)for(let i=0;i<6;i++){const base=path.join(__dirname,b.id,String(i).padStart(2,'0'));await sharp(base+'.svg').png().toFile(base+'.png');}console.log('Rendered 96 PNG diagrams');})();
