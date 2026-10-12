const fs=require('fs'),path=require('path');
const sharp=require('C:/Users/erich/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const blocks=JSON.parse(fs.readFileSync(path.join(__dirname,'process-blocks.json'),'utf8'));
(async()=>{for(const b of blocks){for(let i=0;i<6;i++){const stem=path.join(__dirname,b.id,String(i).padStart(2,'0'));await sharp(stem+'.svg').png().toFile(stem+'.png');}}console.log('Rendered 90 PNG step diagrams.');})();
