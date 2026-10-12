(function(root){
'use strict';
const C={ballMass:.10,cupMass:.02,g:10,startHeight:1,targetHeight:1.25,maxLift:1.4};
const PARTS={
 ramp:{name:'Ramp only',form:'none',label:'No extra store'},
 trigger:{name:'Domino + string',form:'none',label:'Trigger only'},
 weight:{name:'Counterweight',form:'gravitational',label:'Raised weight'},
 spring:{name:'Spring drive',form:'elastic',label:'Compressed spring'},
 band:{name:'Rubber-band drive',form:'elastic',label:'Stretched band'},
 battery:{name:'Battery winch',form:'chemical',label:'Battery'}
};
function solve(o){
 const E0=C.ballMass*C.g*C.startHeight,mg=C.ballMass*C.g,load=(C.ballMass+C.cupMass)*C.g;
 let store=0,height=0,used=0,reason='',efficiency=1;
 if(o.part==='ramp'){height=(1-o.friction)*C.startHeight;reason='turning';}
 if(o.part==='weight'){
  store=o.mass*C.g*o.drop;
  // A fixed pulley with a governed lift and 0.10 N opposing friction.
  const drive=o.mass*C.g-load-.10;
  if(!o.connected)reason='unconnected';
  else if(drive<=1e-9)reason='force';
  else{height=Math.min(o.drop,C.maxLift);used=o.mass*C.g*height;reason='lift';}
 }else if(o.part!=='ramp'){
  if(o.part==='spring'){store=.5*80*o.compression**2;efficiency=.75;}
  if(o.part==='band'){store=.5*40*o.stretch**2;efficiency=.70;}
  if(o.part==='battery'){store=o.battery;efficiency=.60;}
  if(!o.connected)reason='unconnected';
  else{height=Math.min(C.maxLift,store*efficiency/load);used=load*height/efficiency;reason='lift';}
 }
 const lifted=o.part!=='ramp';
 return {E0,store,height,used,remaining:store-used,reason,efficiency,
  ballPE:mg*height,cupPE:lifted?C.cupMass*C.g*height:0,
  thermal:lifted?E0+used-load*height:E0-mg*height,
  reached:height>=C.targetHeight-1e-8,higher:height>C.startHeight+1e-8};
}
function state(o,t){
 const r=solve(o),clip=v=>Math.max(0,Math.min(1,v)),ease=v=>1-(1-v)**2;
 let h=1,ke=0,heat=0,remaining=r.store,cupPE=0,phase='Ready',route=0,lift=0,capture=0;
 if(t<=2){const p=clip(t/2)**2;h=1-p;ke=r.E0*(1-o.friction)*p;heat=r.E0*o.friction*p;route=p;phase='Rolling downhill';}
 else if(o.part==='ramp'){
  const p=ease(clip((t-2)/2.4));h=r.height*p;ke=r.E0*(1-o.friction)-C.ballMass*C.g*h;heat=r.E0*o.friction;route=1+p;phase=t>=4.4?'Paused at the highest point':'Climbing the return ramp';
 }else if(t<3.4){
  h=0;route=1+clip((t-2)/.8);capture=clip((t-2.8)/.6);ke=r.E0*(1-o.friction)*(1-capture);heat=r.E0-ke;phase=t<2.8?'Ball trips domino, then enters cup':'Cup catches the ball; motion becomes thermal energy and sound';
 }else{
  lift=ease(clip((t-3.4)/3));h=r.height*lift;ke=0;cupPE=C.cupMass*C.g*h;remaining=r.store-r.used*lift;heat=r.E0+(r.used-(C.ballMass+C.cupMass)*C.g*r.height)*lift;route=2;
  phase=r.reason==='unconnected'?'The release string is not connected':o.part==='trigger'?'The trigger moved, but there is no energy source':r.reason==='force'?'The weight cannot overcome the load and friction':t>=6.4?'Brake holds the cup at its final height':'Stored energy powers the slow lift';
 }
 const ballPE=C.ballMass*C.g*h;
 return{...r,h,ke:Math.max(0,ke),heat,remaining,cupPE,ballPE,phase,route,lift,capture,total:r.E0+r.store};
}
const api={C,PARTS,solve,state};if(typeof module==='object'&&module.exports)module.exports=api;else root.EnergyModel=api;
})(typeof window!=='undefined'?window:globalThis);
