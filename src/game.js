import * as T from '../vendor/three.module.js';
import { Track,buildTrack } from './track.js';
import { racer,updatePlayer,updateAI,damage } from './physics.js';
import { createCraft,poseCraft } from './craft.js';
import { environment } from './environment.js';
import { ChaseCamera } from './camera.js';
import { Effects } from './effects.js';
import { AudioSystem } from './audio.js';
import { UI,$ } from './ui.js';
export class Game{
 constructor(){
  this.scene=new T.Scene();this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.setSize(innerWidth,innerHeight);this.renderer.setClearColor(0x0b1021);this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;$('world').appendChild(this.renderer.domElement);
  this.camera=new T.PerspectiveCamera(64,innerWidth/innerHeight,.3,5000);this.chase=new ChaseCamera(this.camera);this.track=new Track();environment(this.scene);buildTrack(this.scene,this.track);this.effects=new Effects(this.scene);this.audio=new AudioSystem();this.keys=new Set();this.state='menu';this.kind='balanced';this.clock=0;this.time=0;this.accumulator=0;this.last=0;
  this.ui=new UI(this.track,kind=>{this.kind=kind;this.makeGrid();});this.makeGrid();this.bind();this.ui.show('menu');requestAnimationFrame(t=>this.frame(t));
 }
 disposeCraft(mesh){this.scene.remove(mesh);const geometries=new Set(),materials=new Set();mesh.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)materials.add(m);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
 makeGrid(){if(this.playerMesh)this.disposeCraft(this.playerMesh);for(const m of this.botMeshes||[])this.disposeCraft(m);this.player=racer(this.kind,0,0);this.playerMesh=createCraft(this.kind);this.scene.add(this.playerMesh);this.bots=['light','heavy','balanced','light'].map((k,i)=>racer(k,9+Math.floor(i/2)*10,i%2?-5:5));const colors=[0xff6b8b,0xa49bff,0x6acbff,0xffba70];this.botMeshes=this.bots.map((p,i)=>{const m=createCraft(p.kind,colors[i]);this.scene.add(m);return m;});}
 bind(){
  $('enter-button').onclick=()=>this.hangar();$('back-button').onclick=()=>{this.state='menu';this.ui.show('menu');};$('start-button').onclick=()=>this.start();$('again-button').onclick=()=>this.start();$('hangar-button').onclick=()=>this.hangar();$('quit-button').onclick=()=>this.hangar();$('resume-button').onclick=()=>this.pause();$('pause-button').onclick=()=>this.pause();$('audio-toggle').onclick=()=>{$('audio-toggle').textContent=this.audio.toggle()?'SOUND ON':'SOUND OFF';};document.querySelector('.brand').onclick=e=>{e.preventDefault();if(this.state==='race'||this.state==='countdown')this.pause();else if(this.state!=='pause'){this.state='menu';this.ui.show('menu');}};
  const controlCodes=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight','KeyQ','KeyE','KeyR','Escape'];
  window.addEventListener('keydown',e=>{if(controlCodes.includes(e.code)&&['race','countdown','pause'].includes(this.state))e.preventDefault();if(e.code==='Escape'&&!e.repeat)this.pause();this.keys.add(e.code);});window.addEventListener('keyup',e=>this.keys.delete(e.code));window.addEventListener('blur',()=>{this.keys.clear();if(this.state==='race'||this.state==='countdown')this.pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){this.keys.clear();if(this.state==='race'||this.state==='countdown')this.pause();}});
  window.addEventListener('resize',()=>{this.renderer.setSize(innerWidth,innerHeight);this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();});
 }
 hangar(){this.state='selection';this.keys.clear();this.ui.show('selection');this.audio.update(0,false,false);}
 start(){this.audio.init();this.makeGrid();this.time=0;this.countdown=3;this.lastBeep=3;this.audio.tone(520,.12);this.state='countdown';this.keys.clear();this.chase.ready=false;this.accumulator=0;this.ui.noticeTime=0;for(const p of this.track.pickups)p.cooldown=0;this.ui.show('countdown');$('countdown').textContent='3';}
 pause(){if(this.state==='pause'){this.state=this.previousState;this.ui.show(this.state);this.keys.clear();}else if(this.state==='race'||this.state==='countdown'){this.previousState=this.state;this.state='pause';this.keys.clear();this.ui.show('pause');}}
 input(){const k=this.keys;return {accelerate:k.has('KeyW')||k.has('ArrowUp'),brake:k.has('KeyS')||k.has('ArrowDown'),left:k.has('KeyA')||k.has('ArrowLeft'),right:k.has('KeyD')||k.has('ArrowRight'),leftBrake:k.has('KeyQ'),rightBrake:k.has('KeyE'),boost:k.has('ShiftLeft')||k.has('ShiftRight'),drift:k.has('Space'),reset:k.has('KeyR')};}
 step(dt){
  if(this.state==='countdown'){this.countdown-=dt;const n=Math.ceil(this.countdown);if(n!==this.lastBeep){this.lastBeep=n;this.audio.tone(n?520:1040,n?.12:.35);$('countdown').textContent=n>0?n:'';}if(this.countdown<=0){this.state='race';this.ui.show('race');this.ui.notify('GO / OWN THE HORIZON',2);}return;}
  if(this.state!=='race')return;
  this.time+=dt;for(const pick of this.track.pickups)pick.cooldown=Math.max(0,pick.cooldown-dt);
  const events=[];updatePlayer(this.player,this.input(),dt,this.track,this.time,events);this.keys.delete('KeyR');
  for(let i=0;i<this.bots.length;i++){const b=this.bots[i];updateAI(b,dt,this.track,this.time,i);if(!this.player.respawn&&!this.player.fall&&this.track.distance(b.s,this.player.s)<4&&Math.abs(b.x-this.player.x)<3&&Math.abs(b.air-this.player.air)<2){damage(this.player,15/this.player.spec.stability,events);this.player.lateral+=(this.player.x>b.x?1:-1)*dt*35;this.player.speed*=.996;}}
  for(const event of events){this.audio.event(event.type);switch(event.type){case 'boost':this.ui.notify('BOOST',.8);break;case 'pad':this.ui.notify('OVERDRIVE',1);break;case 'pickup':this.ui.notify('SHIELD RESTORED',1.8);this.effects.burst(this.playerMesh.position,0x61eaff);break;case 'respawn':this.ui.notify(event.destruction?'SHIELD FAILURE / RESPAWNING':'RESPAWNING',1.2);this.effects.burst(this.playerMesh.position);break;case 'recovered':this.chase.ready=false;break;case 'collision':this.effects.burst(this.playerMesh.position,0xffaa66);break;case 'lap':this.ui.notify(this.player.completed===2?'FINAL LAP':'LAP COMPLETE',2.5);break;case 'finish':this.state='finish';this.ui.finish(this.player,this.bots);break;}}
 }
 frame(ms){const raw=this.last?(ms-this.last)/1000:1/60;this.last=ms;const dt=Math.min(raw,.1);this.clock+=dt;this.accumulator+=dt;while(this.accumulator>=1/120){this.step(1/120);this.accumulator-=1/120;}
  if(this.state==='menu'||this.state==='selection'){this.player.s=35;this.player.x=1;this.player.air=0;this.player.speed=0;this.player.steer=0;this.player.respawn=0;this.chase.menu(this.track,this.clock);this.botMeshes.forEach(m=>m.visible=false);}else{if(this.state!=='pause')this.chase.update(this.player,this.track,dt,this.clock);for(let i=0;i<this.bots.length;i++)poseCraft(this.botMeshes[i],this.bots[i],this.track,this.clock);}
  poseCraft(this.playerMesh,this.player,this.track,this.clock);if(this.state!=='pause')this.effects.update(dt,this.player,this.playerMesh,this.track);
  for(const pick of this.track.pickups){pick.mesh.visible=pick.cooldown<=0;pick.mesh.rotation.y=this.clock*1.8;pick.mesh.position.copy(this.track.point(pick.s,pick.x,2.5+Math.sin(this.clock*3)*.35));}
  if(['race','countdown','pause'].includes(this.state))this.ui.update(this.player,this.bots,this.time,this.state==='pause'?0:dt);else{$('damage').style.opacity=0;$('speed-lines').style.opacity=0;}
  this.audio.update(this.player.speed,this.player.boosting,this.state==='race');this.renderer.render(this.scene,this.camera);requestAnimationFrame(t=>this.frame(t));
 }
}
