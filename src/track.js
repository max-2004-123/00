import * as T from '../vendor/three.module.js';
export const WIDTH = 26;
export const wrap = (n,m) => ((n%m)+m)%m;
const up = new T.Vector3(0,1,0);
export class Track {
  constructor() {
    this.curve = new T.CatmullRomCurve3([
      [0,55,0],[0,57,220],[40,72,410],[220,87,490],[400,75,360],
      [390,64,200],[270,52,150],[260,58,40],[410,85,-90],[330,102,-250],
      [140,82,-310],[-75,60,-240],[-115,48,-100]
    ].map(p=>new T.Vector3(...p)),true,'catmullrom',.42);
    this.curve.arcLengthDivisions=2400;this.length=this.curve.getLength();
    this.samples=1600;this.frames=[];
    for(let i=0;i<=this.samples;i++) {
      const t=i/this.samples;const p=this.curve.getPointAt(t);const f=this.curve.getTangentAt(t).normalize();
      const f0=this.curve.getTangentAt(wrap(t-.001,1)), f1=this.curve.getTangentAt(wrap(t+.001,1));
      const curvature=(f0.x*f1.z-f0.z*f1.x)/(.002*this.length);
      const bank=T.MathUtils.clamp(curvature*25,-.36,.36);
      const r=new T.Vector3().crossVectors(up,f).normalize().applyAxisAngle(f,bank);
      const n=new T.Vector3().crossVectors(f,r).normalize();
      this.frames.push({p,f,r,n,curvature,bank});
    }
    this.pads=[.055,.22,.44,.68,.88].map((u,i)=>({s:u*this.length,x:i%2?6:-6,cooldown:0}));
    this.pickups=[.11,.29,.40,.57,.75,.94].map((u,i)=>({s:u*this.length,x:i%2?-7:7,cooldown:0}));
    this.obstacles=[{s:.345*this.length,x:8},{s:.805*this.length,x:-8}];
  }
  frame(s) {
    const index=wrap(s,this.length)/this.length*this.samples;const a=this.frames[Math.floor(index)], b=this.frames[Math.floor(index)+1], t=index%1;
    return {p:a.p.clone().lerp(b.p,t),f:a.f.clone().lerp(b.f,t).normalize(),r:a.r.clone().lerp(b.r,t).normalize(),n:a.n.clone().lerp(b.n,t).normalize(),curvature:a.curvature+(b.curvature-a.curvature)*t,bank:a.bank+(b.bank-a.bank)*t};
  }
  point(s,x=0,h=0){const a=this.frame(s);return a.p.addScaledVector(a.r,x).addScaledVector(a.n,h);}
  rail(s){const u=wrap(s,this.length)/this.length;return !(u>.49&&u<.64)&&!(u>.83&&u<.89);}
  gap(s){const u=wrap(s,this.length)/this.length;return u>.532&&u<.541;}
  distance(a,b){return Math.abs(wrap(a-b+this.length/2,this.length)-this.length/2);}
}
const mat=(c,glow=0)=>new T.MeshStandardMaterial({color:c,roughness:.65,metalness:.45,emissive:c,emissiveIntensity:glow});
export function buildTrack(scene,track) {
  const asphalt=mat(0x1c2a3f),edge=mat(0x526780),cyan=new T.MeshBasicMaterial({color:0x75ecff}),lime=new T.MeshBasicMaterial({color:0xcaff69});
  function ribbon(x0,x1,height,material,condition=()=>true){
    const vertices=[],indices=[];let v=0;
    for(let i=0;i<900;i++){
      const s=i/900*track.length,s1=(i+1)/900*track.length;
      if(track.gap((s+s1)/2)||!condition((s+s1)/2))continue;
      for(const [d,x] of [[s,x0],[s,x1],[s1,x0],[s1,x1]])vertices.push(...track.point(d,x,height).toArray());
      indices.push(v,v+2,v+1,v+1,v+2,v+3);v+=4;
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();
    const m=new T.Mesh(g,material);scene.add(m);return m;
  }
  ribbon(-13,13,0,asphalt);ribbon(-14,-13,-.2,edge);ribbon(13,14,-.2,edge);
  ribbon(-12.8,-12.5,.06,cyan);ribbon(12.5,12.8,.06,cyan);
  ribbon(-13.5,-13.1,1.45,cyan,s=>track.rail(s));ribbon(13.1,13.5,1.45,cyan,s=>track.rail(s));
  // Repeated center dashes, deck seams, and rail uprights share geometry.
  const dummy=new T.Object3D();const basis=new T.Matrix4();
  function place(inst,i,s,x,h,sx,sy,sz){const a=track.frame(s);dummy.position.copy(track.point(s,x,h));basis.makeBasis(a.r,a.n,a.f);dummy.quaternion.setFromRotationMatrix(basis);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);}
  const dashes=new T.InstancedMesh(new T.BoxGeometry(1,1,1),mat(0x8ca3b7,.2),180);
  for(let i=0;i<180;i++){let s=i/180*track.length;place(dashes,i,s,0,.03,.16,.04,track.gap(s)?0:3.5);}scene.add(dashes);
  const seams=new T.InstancedMesh(new T.BoxGeometry(1,1,1),mat(0x30455e),320);
  for(let i=0;i<320;i++){let s=i/320*track.length;place(seams,i,s,0,-.01,26,.04,track.gap(s)?0:.13);}scene.add(seams);
  const posts=new T.InstancedMesh(new T.BoxGeometry(1,1,1),edge,400);
  for(let i=0;i<200;i++)for(let side=0;side<2;side++){let s=i/200*track.length;place(posts,i*2+side,s,side?13.3:-13.3,.65,.35,track.rail(s)&&!track.gap(s)?1.5:0,.5);}scene.add(posts);
  const support=new T.InstancedMesh(new T.CylinderGeometry(2.2,4,1,6),mat(0x172139),45);
  for(let i=0;i<45;i++){const a=track.frame(i/45*track.length);dummy.position.copy(a.p);dummy.position.y=(a.p.y-90)/2;dummy.quaternion.identity();dummy.scale.set(1,a.p.y+90,1);dummy.updateMatrix();support.setMatrixAt(i,dummy.matrix);}scene.add(support);
  // A checker stripe and a freestanding start gantry.
  const start=new T.Group();const a=track.frame(0);start.position.copy(a.p);start.quaternion.setFromRotationMatrix(basis.makeBasis(a.r,a.n,a.f));
  for(let i=0;i<20;i++)for(let j=0;j<2;j++){const b=new T.Mesh(new T.BoxGeometry(1.3,.05,1.3),new T.MeshBasicMaterial({color:(i+j)%2?0x182238:0xe8f4f4}));b.position.set(-12.35+i*1.3,.07,j*1.3);start.add(b);}
  for(const x of [-15,15]){const p=new T.Mesh(new T.BoxGeometry(1,13,1.2),edge);p.position.set(x,6,0);start.add(p);}
  const bar=new T.Mesh(new T.BoxGeometry(31,1.4,1.3),edge);bar.position.y=12.5;start.add(bar);
  const label=sign('VOIDLINE  /  START',1024,128, '#caff69');label.position.set(0,12.5,-.71);label.rotation.y=Math.PI;label.scale.set(24,3,1);start.add(label);scene.add(start);
  for(let i=1;i<12;i++){
    const s=i/12*track.length;for(const x of [-14.5,14.5]){const pole=new T.Mesh(new T.BoxGeometry(.35,6,.35),i%3?cyan:lime);pole.position.copy(track.point(s,x,3));scene.add(pole);}
  }
  for(const pad of track.pads){const g=new T.Group();const f=track.frame(pad.s);g.position.copy(track.point(pad.s,pad.x,.08));g.quaternion.setFromRotationMatrix(basis.makeBasis(f.r,f.n,f.f));
    const bed=new T.Mesh(new T.BoxGeometry(5,.07,13),mat(0x436129,.5));g.add(bed);
    for(let i=0;i<4;i++)for(const side of [-1,1]){const b=new T.Mesh(new T.BoxGeometry(2,.08,.35),lime);b.position.set(side*.8,.08,-4+i*2.5);b.rotation.y=side*-.55;g.add(b);}scene.add(g);}
  for(const pick of track.pickups){const g=new T.Group();g.position.copy(track.point(pick.s,pick.x,2.4));const m=new T.Mesh(new T.OctahedronGeometry(1.05),new T.MeshBasicMaterial({color:0x60f1ff,wireframe:true}));g.add(m);const c=new T.Mesh(new T.OctahedronGeometry(.45),cyan);g.add(c);scene.add(g);pick.mesh=g;}
  for(const ob of track.obstacles){const g=new T.Group();g.position.copy(track.point(ob.s,ob.x,1.3));const b=new T.Mesh(new T.CylinderGeometry(1.3,1.8,2.6,6),mat(0x58627b));g.add(b);const light=new T.Mesh(new T.TorusGeometry(1.4,.12,4,6),new T.MeshBasicMaterial({color:0xffb762}));light.rotation.x=Math.PI/2;light.position.y=.8;g.add(light);scene.add(g);}
}
export function sign(text,w=512,h=128,color='#cffd75'){
  const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.fillStyle='#101a2c';ctx.fillRect(0,0,w,h);ctx.fillStyle=color;ctx.font=`bold ${h*.43}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,w/2,h/2);
  return new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),side:T.DoubleSide}));
}
