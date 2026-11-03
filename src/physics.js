export const CLASSES={
  light:{name:'NEEDLE',label:'LIGHT',description:'Razor-sharp response. Built for the inside line.',accel:38,max:132,handling:1.32,stability:.7,shield:75,color:0x65e6fc,stats:[98,96,52]},
  balanced:{name:'VECTOR',label:'BALANCED',description:'Precision in every corner. Power on every straight.',accel:31,max:143,handling:1,stability:1,shield:100,color:0xcaff69,stats:[80,80,76]},
  heavy:{name:'BASTION',label:'HEAVY',description:'Unshakeable momentum. Take the racing line by force.',accel:25,max:153,handling:.77,stability:1.5,shield:140,color:0xffa678,stats:[62,58,100]}
};
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function racer(kind='balanced',s=0,x=0){const spec=CLASSES[kind];return {kind,spec,s,x,speed:0,lateral:0,heading:0,shield:spec.shield,boost:100,boosting:false,drifting:false,pad:0,air:0,vertical:0,fall:0,respawn:0,safe:s,safeX:x,lastGate:0,completed:0,lapTimes:[],lapStart:0,finished:false,finishTime:0,invulnerable:0,hit:0,steer:0,left:0,right:0};}
export function resetRacer(p,events,destruction=false){if(p.respawn>0||p.finished)return;p.respawn=1.1;p.fall=0;p.speed=0;p.lateral=0;p.heading=0;p.air=0;p.vertical=0;p.boosting=false;p.drifting=false;events.push({type:'respawn',destruction});}
export function damage(p,amount,events){if(p.invulnerable>0||p.respawn>0)return;p.shield=Math.max(0,p.shield-amount);p.invulnerable=.65;p.hit=1;events.push({type:'collision'});if(p.shield<=0)resetRacer(p,events,true);}
export function updatePlayer(p,input,dt,track,time,events=[]){
  if(p.finished)return events;
  p.invulnerable=Math.max(0,p.invulnerable-dt);p.hit=Math.max(0,p.hit-dt*2.5);
  if(p.respawn>0){p.respawn=Math.max(0,p.respawn-dt);if(p.respawn===0){p.s=p.safe;p.x=p.safeX;p.shield=Math.max(p.shield,p.spec.shield*.7);p.invulnerable=2;events.push({type:'recovered'});}return events;}
  if(input.reset){resetRacer(p,events);return events;}
  if(p.fall>0){p.fall+=dt;p.air-=25*p.fall*dt;p.s+=p.speed*.55*dt;if(p.fall>1.15)resetRacer(p,events);return events;}
  const f=track.frame(p.s),old=p.s;
  p.left=input.leftBrake?1:0;p.right=input.rightBrake?1:0;
  const steer=(input.right?1:0)-(input.left?1:0);const brakeSteer=p.right-p.left;
  p.steer=clamp(steer+brakeSteer*.65,-1.6,1.6);p.drifting=!!input.drift&&Math.abs(p.steer)>.1&&p.speed>35;
  const wasBoosting=p.boosting;p.boosting=!!input.boost&&p.boost>1&&p.speed>10;
  if(p.boosting&&!wasBoosting)events.push({type:'boost'});
  p.boost=clamp(p.boost+(p.boosting?-28:9)*dt,0,100);p.pad=Math.max(0,p.pad-dt);
  const powered=p.boosting||p.pad>0;const max=p.spec.max*(powered?1.42:1);
  if(input.accelerate||powered)p.speed+=p.spec.accel*(powered?1.75:1)*dt;
  else p.speed-=Math.sign(p.speed)*Math.min(Math.abs(p.speed),7*dt);
  if(input.brake)p.speed-=((p.speed>8)?65:16)*dt;
  if(p.left||p.right)p.speed-=Math.max(0,p.speed)*.12*dt*(p.left+p.right);
  p.speed=clamp(p.speed,-18,max+15);if(p.speed>max)p.speed-=(p.speed-max)*dt*2;
  const target=p.steer*.28*p.spec.handling*(p.drifting?1.65:1);
  p.heading+=(target-p.heading)*Math.min(1,dt*(p.drifting?4.5:7));
  const lateralTarget=Math.sin(p.heading)*Math.abs(p.speed)*.64;
  p.lateral+=(lateralTarget-p.lateral)*Math.min(1,dt*(p.drifting?1.9:6)*p.spec.stability);
  p.lateral+=f.curvature*p.speed*p.speed*.065/p.spec.stability*dt;
  p.x+=p.lateral*dt;p.s+=p.speed*Math.max(.6,Math.cos(p.heading))*dt;
  const u=((p.s%track.length)+track.length)%track.length/track.length;
  const oldU=((old%track.length)+track.length)%track.length/track.length;
  if(oldU<=.529&&u>.529&&p.speed>0&&p.air<=.05){p.vertical=Math.max(14,p.speed*.22);p.air=.1;events.push({type:'jump'});}
  if(p.air>0){p.vertical-=34*dt;p.air+=p.vertical*dt;if(p.air<=0){p.air=0;p.vertical=0;if(track.gap(p.s))p.fall=.001;}}
  if(track.gap(p.s)&&p.air<=0)p.fall=.001;
  if(Math.abs(p.x)>11.9&&track.rail(p.s)&&p.air<1.8){p.x=Math.sign(p.x)*11.9;p.lateral*=-.35;p.speed*=.84;damage(p,Math.max(8,p.speed*.13)/p.spec.stability,events);}
  if(Math.abs(p.x)>14.2)p.fall=.001;
  for(const o of track.obstacles)if(track.distance(p.s,o.s)<3&&Math.abs(p.x-o.x)<2.6&&p.air<2){damage(p,22/p.spec.stability,events);p.speed*=.7;p.lateral+=(p.x>=o.x?1:-1)*12;}
  for(const pad of track.pads)if(track.distance(p.s,pad.s)<6&&Math.abs(p.x-pad.x)<3&&p.air<2&&p.pad<=0){p.pad=1.5;p.boost=Math.min(100,p.boost+12);events.push({type:'pad'});}
  for(const pick of track.pickups)if(pick.cooldown<=0&&track.distance(p.s,pick.s)<3.5&&Math.abs(p.x-pick.x)<2.8&&p.air<4){pick.cooldown=10;p.shield=Math.min(p.spec.shield,p.shield+32);events.push({type:'pickup'});}
  // Ordered sector gates prevent reversing over the finish or resetting from granting laps.
  const gate=Math.floor(p.s/(track.length/12));
  if(gate===p.lastGate+1&&old<gate*track.length/12&&!p.fall&&Math.abs(p.x)<12&&!track.gap(p.s)){
    p.lastGate=gate;p.safe=gate*track.length/12+1;p.safeX=clamp(p.x,-8,8);
    events.push({type:'checkpoint'});
    if(gate%12===0){p.completed++;p.lapTimes.push(time-p.lapStart);p.lapStart=time;events.push({type:'lap'});if(p.completed===3){p.finished=true;p.finishTime=time;events.push({type:'finish'});}}
  }
  return events;
}
export function updateAI(p,dt,track,time,index){
  if(p.finished)return;
  const curve=Math.abs(track.frame(p.s+35).curvature);const boost=Math.sin(time*.31+index*4)>.88;
  const target=(p.spec.max*.82-index*2)*clamp(1-curve*30,.5,1)*(boost?1.22:1);
  p.speed+=(target-p.speed)*Math.min(1,dt*.6);p.s+=p.speed*dt;
  p.x+=(Math.sin(p.s*.008+index*2)*7-p.x)*dt*1.4;p.heading=Math.cos(p.s*.008+index*2)*.035;p.boosting=boost;
  const u=((p.s%track.length)+track.length)%track.length/track.length;p.air=u>.527&&u<.55?Math.sin((u-.527)/.023*Math.PI)*6:0;
  if(!Number.isFinite(p.s)||Math.abs(p.x)>14){p.s=p.safe;p.x=0;p.speed=45;}
  p.safe=Math.floor(p.s/(track.length/12))*track.length/12;
  p.completed=Math.max(0,Math.floor(p.s/track.length));if(p.completed>=3){p.finished=true;p.finishTime=time;}
}
export function racePosition(player,bots){return 1+bots.filter(b=>player.finished?(b.finished&&b.finishTime<player.finishTime):(b.finished||b.s>player.s)).length;}
