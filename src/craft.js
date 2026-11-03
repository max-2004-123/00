import * as T from '../vendor/three.module.js';
import { CLASSES } from './physics.js';
const material=(color,emissive=0)=>new T.MeshStandardMaterial({color,metalness:.65,roughness:.32,emissive:color,emissiveIntensity:emissive});
function hull(width,length,height){
  const verts=new Float32Array([0,height,length*.58,-width,height*.2,-length*.35,width,height*.2,-length*.35,0,-height*.5,length*.48,-width*.8,-height*.5,-length*.4,width*.8,-height*.5,-length*.4]);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(verts,3));g.setIndex([0,2,1,3,4,5,0,1,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,4]);g.computeVertexNormals();return g;
}
export function createCraft(kind='balanced',color=CLASSES[kind].color){
  const root=new T.Group(),body=new T.Group();root.add(body);const spec=CLASSES[kind];
  const paint=material(color),dark=material(0x192331),metal=material(0x758897),glass=material(0x174f65,.5),light=new T.MeshBasicMaterial({color});
  const wide=kind==='heavy'?1.35:kind==='light'?.8:1, len=kind==='light'?7.2:6.1;
  const main=new T.Mesh(hull(1.3*wide,len,.9),paint);body.add(main);
  const cockpit=new T.Mesh(hull(.62,len*.53,.7),glass);cockpit.position.set(0,.55,-.3);body.add(cockpit);
  const spine=new T.Mesh(new T.BoxGeometry(.16,.12,len*.75),metal);spine.position.set(0,.55,-.5);body.add(spine);
  const brakes=[],flames=[];
  for(const side of [-1,1]){
    const wing=new T.Mesh(hull(1.1*wide,kind==='heavy'?4.5:3.6,.5),paint);wing.position.set(side*2*wide,-.18,-.6);wing.rotation.y=side*-.12;body.add(wing);
    const strut=new T.Mesh(new T.BoxGeometry(2.1*wide,.24,.8),dark);strut.position.set(side*1.7,-.1,-1.2);body.add(strut);
    const engine=new T.Mesh(new T.CylinderGeometry(.46,.57,2.5,8),dark);engine.rotation.x=Math.PI/2;engine.position.set(side*1.95*wide,-.12,-1.4);body.add(engine);
    const ring=new T.Mesh(new T.TorusGeometry(.42,.08,6,12),light);ring.position.set(side*1.95*wide,-.12,-2.68);body.add(ring);
    const flame=new T.Mesh(new T.ConeGeometry(.37,2.5,8),new T.MeshBasicMaterial({color:0x8df5ff,transparent:true,opacity:.8,blending:T.AdditiveBlending,depthWrite:false}));flame.rotation.x=-Math.PI/2;flame.position.set(side*1.95*wide,-.12,-3.6);body.add(flame);flames.push(flame);
    const panel=new T.Group();panel.position.set(side*2.4*wide,.05,-1);const b=new T.Mesh(new T.BoxGeometry(.65,.13,1.7),metal);b.position.x=side*.25;panel.add(b);const strip=new T.Mesh(new T.BoxGeometry(.1,.16,1.5),light);strip.position.x=side*.55;panel.add(strip);body.add(panel);brakes.push(panel);
    const stripe=new T.Mesh(new T.BoxGeometry(.11,.07,2.3),light);stripe.position.set(side*1.7*wide,.22,.1);body.add(stripe);
  }
  if(kind==='heavy'){const plate=new T.Mesh(new T.BoxGeometry(2.5,.5,1.5),dark);plate.position.set(0,.45,-2.1);body.add(plate);}
  if(kind==='light'){const fin=new T.Mesh(hull(.12,2,1.4),dark);fin.position.set(0,.65,-1.9);body.add(fin);}
  const glow=new T.Mesh(new T.CircleGeometry(2.4,24),new T.MeshBasicMaterial({color,transparent:true,opacity:.11,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide}));glow.rotation.x=-Math.PI/2;glow.position.y=-.65;root.add(glow);
  root.userData={body,brakes,flames,glow};return root;
}
const basis=new T.Matrix4();
export function poseCraft(mesh,p,track,time){
  const f=track.frame(p.s);mesh.position.copy(f.p).addScaledVector(f.r,p.x).addScaledVector(f.n,1.4+p.air+Math.sin(time*6+p.s)*.11);
  mesh.quaternion.setFromRotationMatrix(basis.makeBasis(f.r,f.n,f.f));
  const {body,brakes,flames,glow}=mesh.userData;
  body.rotation.y=p.heading;body.rotation.z=-p.steer*.16-(p.drifting?p.steer*.12:0);body.rotation.x=-p.vertical*.004;
  brakes[0].rotation.z=p.left?-.8:0;brakes[1].rotation.z=p.right?.8:0;
  for(const flame of flames){const l=.45+Math.abs(p.speed)/120+(p.boosting||p.pad>0?1.8:0);flame.scale.y=l*(.95+Math.sin(time*65)*.05);flame.position.z=-2.7-1.2*l;}
  glow.material.opacity=.08+Math.abs(p.speed)*.0008;mesh.visible=p.respawn<=0||(Math.floor(time*12)%2===0&&p.respawn<.5);
}
