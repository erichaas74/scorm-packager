'use strict';

// Compatibility entry point: use current setup guides, never recreate retired labs.
const fs = require('fs');
const path = require('path');
require('./application-scoring-policy.js').applyUnits();
const rows = [];
for (const unit of fs.readdirSync(__dirname).filter(name => /^unit-\d+$/.test(name))) {
  const dir = path.join(__dirname, unit);
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).filter(entry => entry.isDirectory())) {
    const legacy = path.join(dir, entry.name, 'rise-before-you-begin.txt');
    if (fs.existsSync(legacy)) rows.push(`${unit}/${entry.name}/rise-before-you-begin.txt`);
  }
}
fs.writeFileSync(path.join(__dirname, 'rise-directions-index.txt'),
  'LEGACY DIRECTION FILES\n\nThese compatibility copies mirror the current student TXT setup guides. Submit native assessment responses through Buzz.\n\n' + rows.join('\n') + '\n', 'utf8');
console.log(`Synchronized ${rows.length} existing compatibility direction files from current setup guides.`);
