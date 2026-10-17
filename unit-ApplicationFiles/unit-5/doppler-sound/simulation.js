'use strict';
const $ = id => document.getElementById(id);
const cases = {
 toward: {answer:'higher',caption:'You stand ahead of the ambulance as it moves toward you →',explain:'The moving siren compresses the wavefronts ahead of it. More waves reach you each second, so you hear a higher frequency and pitch.'},
 away: {answer:'lower',caption:'You stand behind the ambulance as it moves away from you →',explain:'The moving siren spreads the wavefronts behind it farther apart. Fewer waves reach you each second, so you hear a lower frequency and pitch.'},
 passenger: {answer:'same',caption:'You ride inside the ambulance, moving together with the siren →',explain:'You and the siren move together with a fixed distance between you. The effects of source and listener motion cancel, so you hear the original pitch.'}
};
let mode='toward', speed=30, elapsed=0, running=false, last=0, revealed=false;
let context, oscillator, gain, referenceTimer;
const mastered=new Set();
const canvas=$('scene'), ctx=canvas.getContext('2d');
function frequency(){return mode==='passenger'?600:600*343/(343+(mode==='toward'?-speed:speed));}
function silence(){clearTimeout(referenceTimer);if(gain)gain.gain.setTargetAtTime(0,context.currentTime,.02);}
function pause(){running=false;$('play').textContent='▶ Play motion & sound';silence();}
async function audio(hz){
 try{if(!context){context=new (window.AudioContext||window.webkitAudioContext)();oscillator=context.createOscillator();gain=context.createGain();gain.gain.value=0;oscillator.connect(gain);gain.connect(context.destination);oscillator.start();}await context.resume();oscillator.frequency.setValueAtTime(hz,context.currentTime);gain.gain.setTargetAtTime(Number($('volume').value)/100*.18,context.currentTime,.025);$('audioStatus').textContent='Sound enabled. The siren is a steady note for easy pitch comparison.';return true;}
 catch(e){$('audioStatus').textContent='Audio is unavailable in this browser. You can still use the animation and pitch checks.';return false;}
}
function readout(){$('readout').textContent=revealed?`Siren: 600 Hz · You hear: ${Math.round(frequency())} Hz`:'Answer the pitch check to reveal the frequencies.';}
function choose(next){pause();mode=next;elapsed=0;revealed=false;document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));$('caption').textContent=cases[mode].caption;canvas.setAttribute('aria-label',cases[mode].caption+' '+cases[mode].explain);$('feedback').textContent='Choose an answer. You can listen and try again.';readout();draw();}
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>choose(b.dataset.mode));
document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{const correct=b.dataset.answer===cases[mode].answer;if(correct){mastered.add(mode);revealed=true;}$('feedback').textContent=correct?`Correct — ${cases[mode].answer}! ${cases[mode].explain}`:'Not quite. Compare the reference with the moving siren. Think about how many wavefronts reach you each second, then try again.';$('progress').textContent=`Situations understood: ${mastered.size} / 3${mastered.size===3?' · All three complete!':''}`;readout();});
$('play').onclick=async()=>{if(running){pause();return;}clearTimeout(referenceTimer);if(elapsed>=7)elapsed=0;running=true;$('play').textContent='Ⅱ Pause';await audio(frequency());if(!running)silence();};
$('reference').onclick=async()=>{pause();await audio(600);referenceTimer=setTimeout(silence,1500);};
$('reset').onclick=()=>{pause();elapsed=0;draw();};
$('restart').onclick=()=>{mastered.clear();$('progress').textContent='Situations understood: 0 / 3';choose('toward');};
$('speed').oninput=()=>{speed=Number($('speed').value);$('speedText').textContent=`${speed} m/s (${Math.round(speed*3.6)} km/h)`;if(running&&oscillator)oscillator.frequency.setTargetAtTime(frequency(),context.currentTime,.04);readout();draw();};
$('volume').oninput=()=>{$('volumeText').textContent=$('volume').value+'%';if(gain&&gain.gain.value>0)gain.gain.setTargetAtTime(Number($('volume').value)/100*.18,context.currentTime,.02);else if(running&&gain)gain.gain.setTargetAtTime(Number($('volume').value)/100*.18,context.currentTime,.02);};
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
window.addEventListener('pagehide',pause);
function person(x,y){ctx.fillStyle='#08798a';ctx.beginPath();ctx.arc(x,y,10,0,Math.PI*2);ctx.fill();ctx.fillRect(x-8,y+12,16,26);ctx.lineWidth=5;ctx.strokeStyle='#08798a';ctx.beginPath();ctx.moveTo(x-4,y+36);ctx.lineTo(x-9,y+53);ctx.moveTo(x+4,y+36);ctx.lineTo(x+9,y+53);ctx.stroke();}
function draw(){
 ctx.clearRect(0,0,1000,350);ctx.fillStyle='#e9f5fa';ctx.fillRect(0,0,1000,350);
 ctx.fillStyle='#c8ded7';ctx.fillRect(0,223,1000,30);ctx.fillStyle='#596c79';ctx.fillRect(0,253,1000,97);
 ctx.strokeStyle='#d8e3e7';ctx.lineWidth=4;ctx.setLineDash([35,25]);ctx.beginPath();ctx.moveTo(0,306);ctx.lineTo(1000,306);ctx.stroke();ctx.setLineDash([]);
 const velocity=14+speed*.45, x=(mode==='away'?300:130)+elapsed*velocity, source=x+35;
 // Each front remains centered at the source position at emission; expansion is faster than the vehicle.
 ctx.save();ctx.beginPath();ctx.rect(0,0,1000,253);ctx.clip();ctx.lineWidth=2;ctx.strokeStyle='rgba(182,62,71,.38)';
 for(let age=.15;age<7;age+=.52){const t=age+(elapsed%.52), center=source-velocity*t;ctx.beginPath();ctx.arc(center,169,t*100,0,Math.PI*2);ctx.stroke();}ctx.restore();
 ctx.fillStyle='#fff';ctx.strokeStyle='#375560';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x-60,164,135,65,8);ctx.fill();ctx.stroke();ctx.fillStyle='#c3e4ee';ctx.fillRect(x+35,172,29,23);ctx.fillStyle='#c5484e';ctx.fillRect(x-59,202,132,9);ctx.fillRect(x-18,174,9,24);ctx.fillRect(x-26,182,25,8);ctx.fillRect(x+23,155,25,9);ctx.fillStyle='#233944';for(const wx of [x-35,x+48]){ctx.beginPath();ctx.arc(wx,232,13,0,Math.PI*2);ctx.fill();ctx.fillStyle='#cbd9df';ctx.beginPath();ctx.arc(wx,232,6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#233944';}
 ctx.font='bold 16px system-ui';ctx.textAlign='center';ctx.fillStyle='#9d303a';ctx.fillText('SIREN →',x,135);
 if(mode==='passenger'){person(x+48,178);ctx.fillStyle='#075d6c';ctx.fillText('YOU · riding along',x,98);}else{const listener=mode==='toward'?850:130;person(listener,184);ctx.fillStyle='#075d6c';ctx.fillText('YOU · standing still',listener,163);}
 ctx.font='14px system-ui';ctx.textAlign='left';ctx.fillStyle='#375560';ctx.fillText(mode==='passenger'?'Same vehicle. Same speed. Fixed separation.':'Wavefronts spread behind and bunch up ahead.',22,32);
}
function frame(now){const dt=last?Math.min((now-last)/1000,.05):0;last=now;if(running){elapsed=Math.min(7,elapsed+dt);draw();if(elapsed>=7){pause();$('audioStatus').textContent='Run complete. Press Play to replay this situation.';}}requestAnimationFrame(frame);}
choose('toward');requestAnimationFrame(frame);
