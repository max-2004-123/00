import * as T from '../vendor/three.module.js';
export class ChaseCamera{
 constructor(camera){this.camera=camera;this.ready=false;this.target=new T.Vector3();}
 update(p,track,dt,time){const f=track.frame(p.s);const base=track.point(p.s,p.x,1.5+Math.max(-10,p.air));const distance=13+Math.abs(p.speed)*.035;const goal=base.clone().addScaledVector(f.f,-distance).addScaledVector(f.n,6.2);const shake=(p.hit*.3+(p.boosting?.055:0));goal.x+=Math.sin(time*71)*shake;goal.y+=Math.cos(time*83)*shake;
  const look=track.point(p.s+22,p.x*.6,3+Math.max(-5,p.air));if(!this.ready){this.camera.position.copy(goal);this.target.copy(look);this.ready=true;}
  this.camera.position.lerp(goal,1-Math.exp(-dt*7));this.target.lerp(look,1-Math.exp(-dt*9));this.camera.up.lerp(new T.Vector3(0,1,0).lerp(f.n,.65).addScaledVector(f.r,p.steer*.045),1-Math.exp(-dt*4)).normalize();this.camera.lookAt(this.target);this.camera.fov+=(64+Math.abs(p.speed)*.055+(p.boosting?7:0)-this.camera.fov)*Math.min(1,dt*3);this.camera.updateProjectionMatrix();
 }
 menu(track,time){const f=track.frame(35);const goal=f.p.clone().addScaledVector(f.r,-30+Math.sin(time*.12)*3).addScaledVector(f.f,-33).addScaledVector(f.n,19);this.camera.position.copy(goal);this.camera.up.set(0,1,0);this.camera.lookAt(f.p.clone().addScaledVector(f.r,-9).addScaledVector(f.f,23));this.camera.fov=59;this.camera.updateProjectionMatrix();this.ready=false;}
}
