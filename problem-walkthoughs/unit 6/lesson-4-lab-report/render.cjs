const fs=require('fs'),path=require('path');
const sharp=require('C:/Users/erich/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async()=>{const data=JSON.parse(fs.readFileSync(path.join(__dirname,'revision-processes.json'),'utf8'));for(const b of data)for(const s of b.slides)await sharp(s.image.replace('.png','.svg')).png().toFile(s.image);console.log('Rendered 20 diagrams');})();
