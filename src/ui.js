import { CLASSES, racePosition } from './physics.js';
export const $=id=>document.getElementById(id);
export const timeText=s=>Number.isFinite(s)?`${String(Math.floor(s/60)).padStart(2,'0')}:${(s%60).toFixed(3).padStart(6,'0')}`:'— — : — —';
const silhouettes={
 light:'M150 12 163 81 184 126 158 119 150 140 142 119 116 126 137 81Z',
 balanced:'M150 19 165 82 205 112 206 137 170 122 150 132 130 122 94 137 95 112 135 82Z',
 heavy:'M150 31 169 69 187 60 218 121 211 145 173 137 165 148 135 148 127 137 89 145 82 121 113 60 131 69Z'
};
export class UI{
 constructor(track,onSelect){this.track=track;this.noticeTime=0;this.map=$('minimap').getContext('2d');this.kind='balanced';
  $('craft-cards').innerHTML=Object.entries(CLASSES).map(([key,c],i)=>`<button class="craft-card ${key==='balanced'?'selected':''}" data-kind="${key}" aria-pressed="${key==='balanced'}"><div class="card-top"><span>0${i+1} / ${c.label}</span><span class="selected-label">${key==='balanced'?'SELECTED':'AVAILABLE'}</span></div><svg viewBox="65 0 170 160" aria-label="${c.name} craft silhouette"><path d="${silhouettes[key]}" fill="#${c.color.toString(16)}" stroke="#d6e7ee" stroke-width="1"/><path d="M150 44 158 103 150 115 142 103Z" fill="#22394b"/><path d="M135 127v17M165 127v17" stroke="#8beaff" stroke-width="5"/></svg><h3>${c.name}</h3><p>${c.description}</p>${['ACCELERATION','HANDLING','SHIELD'].map((s,j)=>`<div class="stat"><span>${s}</span><div class="stat-track"><i style="width:${c.stats[j]}%"></i></div></div>`).join('')}</button>`).join('');
  document.querySelectorAll('.craft-card').forEach(b=>b.onclick=()=>{this.kind=b.dataset.kind;document.querySelectorAll('.craft-card').forEach(c=>{const yes=c===b;c.classList.toggle('selected',yes);c.setAttribute('aria-pressed',yes);c.querySelector('.selected-label').textContent=yes?'SELECTED':'AVAILABLE';});onSelect(this.kind);});
  this.mapPoints=Array.from({length:160},(_,i)=>{const p=track.frame(i/160*track.length).p;return [(p.x+140)/580*220+18,(p.z+340)/880*170+12];});
 }
 show(state){for(const name of ['menu','selection','finish','pause'])$(name).classList.toggle('hidden',state!==name);$('hud').classList.toggle('hidden',!['race','countdown','pause'].includes(state));$('pause-button').classList.toggle('hidden',!['race','countdown','pause'].includes(state));document.body.classList.toggle('racing',['race','countdown','pause','finish'].includes(state));$('system-status').textContent=state==='race'?'RACE IN PROGRESS':state==='selection'?'HANGAR ONLINE':'SYSTEM ONLINE';}
 notify(text,seconds=2){$('notification').textContent=text;this.noticeTime=seconds;}
 update(p,bots,time,dt){$('speed').textContent=String(Math.round(Math.abs(p.speed)*3.6)).padStart(3,'0');$('lap').textContent=String(Math.min(3,p.completed+1)).padStart(2,'0');$('position').textContent=String(racePosition(p,bots)).padStart(2,'0');$('time').textContent=timeText(time);$('best').textContent=timeText(p.lapTimes.length?Math.min(...p.lapTimes):Infinity);$('sector').textContent=String(p.lastGate%12+1).padStart(2,'0');const shield=p.shield/p.spec.shield*100;
  $('shield-value').textContent=Math.round(shield);$('boost-value').textContent=Math.round(p.boost);$('shield-bar').style.width=shield+'%';$('shield-bar').style.background=shield<25?'#ff6981':'#58e8f2';$('boost-bar').style.width=p.boost+'%';$('drive-mode').textContent=p.respawn>0?'RECONSTRUCTING':p.air>1?'AIRBORNE':p.boosting||p.pad>0?'BOOST ENGAGED':p.drifting?'DRIFT ACTIVE':p.left||p.right?'AIR BRAKE':'ANTI-GRAV ACTIVE';$('damage').style.opacity=p.hit*.65;$('speed-lines').style.opacity=Math.max(0,(p.speed-100)/180)+(p.boosting?.17:0);
  this.noticeTime-=dt;if(this.noticeTime<=0)$('notification').textContent='';this.drawMap(p,bots);
 }
 drawMap(p,bots){const c=this.map;c.clearRect(0,0,260,200);c.beginPath();this.mapPoints.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.strokeStyle='#7391ac40';c.lineWidth=8;c.stroke();c.strokeStyle='#8295ac';c.lineWidth=1.4;c.stroke();for(const b of [...bots,p]){const f=this.track.frame(b.s).p,x=(f.x+140)/580*220+18,y=(f.z+340)/880*170+12;c.beginPath();c.arc(x,y,b===p?4.2:2.5,0,Math.PI*2);c.fillStyle=b===p?'#cbff69':'#c7d3e0';c.fill();}const start=this.mapPoints[0];c.fillStyle='#fff';c.fillRect(start[0]-3,start[1]-2,6,2);}
 finish(p,bots){$('result-position').textContent=`0${racePosition(p,bots)} / 05`;$('result-time').textContent=timeText(p.finishTime);$('result-best').textContent=timeText(Math.min(...p.lapTimes));$('finish-title').textContent=racePosition(p,bots)===1?'THE VOID IS YOURS.':'HORIZON CONQUERED.';this.show('finish');}
}
