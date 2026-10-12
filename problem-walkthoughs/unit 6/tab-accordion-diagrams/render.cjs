const fs=require('fs'),path=require('path');
const sharp=require('C:/Users/erich/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async()=>{const d=JSON.parse(fs.readFileSync(path.join(__dirname,'diagram-manifest.json'),'utf8'));for(const b of d)for(const i of b.items)await sharp(i.svg).png().toFile(i.image);console.log('Rendered all 105 PNG diagrams');})();
