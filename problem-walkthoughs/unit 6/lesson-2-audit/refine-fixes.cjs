const fs=require('fs'),p=require('path').join(__dirname,'build-fixes.cjs');
let s=fs.readFileSync(p,'utf8');
s=s.replaceAll('x+270','x+225').replaceAll('520','475').replace("q(x,y,'+',12)","'<circle cx=\"'+x+'\" cy=\"'+y+'\" r=\"7\" fill=\"#19334a\"/>'").replace('765,445','770,455').replace('a+=Math.PI/3','a+=2*Math.PI/3');
fs.writeFileSync(p,s);require(p);
