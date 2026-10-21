(() => {
  'use strict';
  const D=window.Unit6Diagrams, previous=D.scenes.charges;
  const {label,line,box,dot,single,blue,rust,arrow}=D.helpers;
  const defs=`<defs><radialGradient id="cg-cloud"><stop stop-color="#f6fcff"/><stop offset=".7" stop-color="#d9effb"/><stop offset="1" stop-color="#9bc9e6" stop-opacity=".65"/></radialGradient><radialGradient id="cg-proton"><stop stop-color="#fff2d4"/><stop offset="1" stop-color="#e6a06c"/></radialGradient><radialGradient id="cg-metal" cx="35%" cy="25%" r="85%"><stop stop-color="#fff"/><stop offset=".3" stop-color="#dce5ed"/><stop offset=".65" stop-color="#9bacbc"/><stop offset=".85" stop-color="#e4edf3"/><stop offset="1" stop-color="#657c92"/></radialGradient><linearGradient id="cg-glass"><stop stop-color="#93bfc7"/><stop offset=".45" stop-color="#efffff"/><stop offset="1" stop-color="#8eafb9"/></linearGradient></defs>`;
  const electron=(x,y,r=8)=>`<g class="cg-electron">${dot(x,y,r,'#195686','#fff')}${line(x-r*.5,y,x+r*.5,y,'#fff',1.8)}</g>`;
  function nucleus(x,y){
    let out='<g class="cg-nucleus">';
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3, px=x+12*Math.cos(a), py=y+12*Math.sin(a);
      out+=dot(px,py,7,'url(#cg-proton)',rust)+line(px-3,py,px+3,py,rust,1)+line(px,py-3,px,py+3,rust,1);
    }
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3+.5;
      out+=dot(x+6*Math.cos(a),y+6*Math.sin(a),4,'#a8b7c4','#5c7182');
    }
    return out+'</g>';
  }
  D.scenes.charges=function(lesson,state){
    if(!['transfer','conductor','repel'].includes(lesson.variant))return previous(lesson,state);
    const w=state.compact?420:840, p=state.reveal?state.progress:0;
    let s=defs;
    if(lesson.variant==='repel'){
      const radius=state.compact?52:72, cy=155, travel=state.compact?22:32;
      const initialGap=w*.42, gap=initialGap+2*travel*p;
      // Equal forces on both objects; lengths shrink together as separation grows.
      const forceLength=radius*.92*(initialGap/gap)**2;
      s+=`<defs><radialGradient id="cg-charged" cx="30%" cy="25%" r="80%"><stop stop-color="#fff9ec"/><stop offset=".45" stop-color="#f7ce9d"/><stop offset=".8" stop-color="#cc8857"/><stop offset="1" stop-color="#98603e"/></radialGradient></defs>`;
      for(const [i,direction] of [[0,-1],[1,1]]){
        const x=w*(i?.71:.29)+direction*travel*p;
        s+=`<g class="cg-charged-object" data-center="${x}"><ellipse cx="${x}" cy="${cy+radius+14}" rx="${radius*.8}" ry="7" fill="#dce4e9" opacity=".65"/><circle cx="${x}" cy="${cy}" r="${radius}" fill="url(#cg-charged)" stroke="#8c593b" stroke-width="2"/><path d="M${x-radius*.62} ${cy-radius*.22}Q${x-radius*.58} ${cy-radius*.65} ${x-radius*.18} ${cy-radius*.76}" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`;
        // Positive surface symbols indicate electron deficit, not moving protons.
        for(const [dx,dy] of [[-.22,-.56],[.25,-.5],[-.46,.28],[.38,.3],[0,.6]]){
          const px=x+dx*radius,py=cy+dy*radius;
          s+=dot(px,py,6,'#fff0d6','#9e5735')+line(px-3,py,px+3,py,rust,1.3)+line(px,py-3,px,py+3,rust,1.3);
        }
        if(state.reveal)s+=`<g class="cg-force" data-length="${forceLength}" data-direction="${direction}">${arrow(x,cy,x+direction*forceLength,cy,'#a12979',4)}${dot(x,cy,3,'#663457','#663457')}</g>`;
        s+=label(x,cy+radius+45,i?'B: positive':'A: positive','middle','strong')+'</g>';
      }
      if(state.reveal)s+=label(w/2,302,'Equal forces · opposite directions','middle','small');
      return single(s,w,325);
    }
    if(lesson.variant==='transfer'){
      const radius=state.compact?58:86, cy=185, xs=[w*.25,w*.75];
      const departed=state.reveal, arrived=departed&&p>=.8;
      s+=label(w/2,30,arrived?'One electron transferred':departed?'Electron moves from A to B':'Two neutral atoms','middle','strong');
      xs.forEach((x,index)=>{
        s+=label(x,68,index?'Atom B':'Atom A','middle','strong')+`<circle cx="${x}" cy="${cy}" r="${radius+12}" fill="url(#cg-cloud)" stroke="#8db4cf"/>`;
        for(let i=0;i<55;i++){
          const angle=i*2.39996, r=radius*Math.sqrt((i+.5)/55);
          s+=`<circle cx="${x+r*Math.cos(angle)}" cy="${cy+r*Math.sin(angle)}" r="1.2" fill="#4788b3" opacity=".3"/>`;
        }
        s+=nucleus(x,cy);
        for(let i=0;i<6;i++){
          if(index===0&&i===0&&departed)continue;
          const angle=i*Math.PI/3;
          s+=electron(x+radius*Math.cos(angle),cy+radius*Math.sin(angle));
        }
        if(index===1&&arrived)s+=electron(x+radius*Math.cos(Math.PI/6),cy+radius*.5);
        const count=index===0?(departed?5:6):(arrived?7:6);
        s+=label(x,302,'6 protons','middle','small')+label(x,328,`${count} electrons`,'middle','small');
        s+=label(x,356,index===0?(departed?'+e':'Neutral'):(arrived?'−e':'Neutral'),'middle','strong');
      });
      if(departed&&!arrived){
        const t=p/.8, start=xs[0]+radius, end=xs[1]+radius*Math.cos(Math.PI/6);
        s+=electron(start+(end-start)*t,cy+radius*.5*t-85*Math.sin(Math.PI*t),9);
      }
      s+=label(w/2,397,'Total charge = 0','middle','strong');
      return single(s,w,420);
    }
    const cx=w/2, cy=180, rx=(w-80)/2, ry=77;
    s+=label(cx,30,p===1?'Excess electrons on the surface':state.reveal?'Excess electrons redistribute':'Extra electrons at one end','middle','strong');
    // Insulating supports are behind the isolated metal body.
    for(const x of [cx-rx*.5,cx+rx*.5])s+=box(x-8,226,16,73,'url(#cg-glass)','#6c929e',3)+box(x-33,296,66,8,'#8b9eac','#526d82',4);
    s+=`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#cg-metal)" stroke="#526d82" stroke-width="2"/><path d="M${cx-rx*.7} ${cy-ry*.5}Q${cx} ${cy-ry*1.15} ${cx+rx*.6} ${cy-ry*.5}" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="3"/>`;
    // Positive ion cores stay fixed; neutralizing conduction electrons are implicit.
    for(let row=-1;row<=1;row++)for(let col=-2;col<=2;col++){
      const x=cx+col*rx*.28,y=cy+row*34;
      s+=dot(x,y,7,'#e4d2bc','#8b6e55')+line(x-3,y,x+3,y,'#826044',1)+line(x,y-3,x,y+3,'#826044',1);
    }
    for(let i=0;i<12;i++){
      const angle=i*Math.PI/6, endX=cx+rx*Math.cos(angle),endY=cy+ry*Math.sin(angle);
      const startX=cx-rx*.65+(i%3)*16,startY=cy-25+Math.floor(i/3)*17;
      s+=electron(startX+(endX-startX)*p,startY+(endY-startY)*p,7);
    }
    s+=label(cx,330,'Isolated metal · insulating supports','middle','small');
    s+=label(cx,362,p===1?'At equilibrium: E inside = 0':'Total excess charge stays the same','middle','strong');
    s+=label(cx,391,'Markers show excess electrons','middle','small');
    return single(s,w,410);
  };
})();
