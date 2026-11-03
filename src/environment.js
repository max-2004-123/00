import * as T from '../vendor/three.module.js';
export function environment(scene){
  scene.fog=new T.FogExp2(0x17263f,.0015);
  scene.add(new T.HemisphereLight(0x9fcae9,0x1f173b,2.5));const sun=new T.DirectionalLight(0xffe4c9,3.5);sun.position.set(-200,400,-250);scene.add(sun);
  const sky=new T.Mesh(new T.SphereGeometry(3500,32,20),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{},vertexShader:'varying vec3 v; void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 v;void main(){float h=normalize(v).y;vec3 c=mix(vec3(.13,.21,.29),vec3(.018,.023,.075),smoothstep(-.1,.8,h));float neb=pow(max(0.,1.-abs(h-.19)*3.),5.);c+=vec3(.07,.025,.09)*neb;gl_FragColor=vec4(c,1.);}'}));scene.add(sky);
  const planet=new T.Mesh(new T.SphereGeometry(185,48,32),new T.MeshStandardMaterial({color:0x6c899b,roughness:1}));planet.position.set(670,380,950);scene.add(planet);
  const ring=new T.Mesh(new T.RingGeometry(224,290,96),new T.MeshBasicMaterial({color:0x91b4c5,side:T.DoubleSide,transparent:true,opacity:.18}));ring.position.copy(planet.position);ring.rotation.set(1.25,.3,.5);scene.add(ring);
  const moon=new T.Mesh(new T.SphereGeometry(47,24,16),new T.MeshStandardMaterial({color:0xc1c3cf,roughness:1}));moon.position.set(-630,400,800);scene.add(moon);
  let seed=42;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const stars=[];for(let i=0;i<1300;i++){const theta=random()*Math.PI*2, y=random()*.9+.1,r=1800;stars.push(Math.cos(theta)*r*Math.sqrt(1-y*y),r*y,Math.sin(theta)*r*Math.sqrt(1-y*y));}
  const starGeo=new T.BufferGeometry();starGeo.setAttribute('position',new T.Float32BufferAttribute(stars,3));scene.add(new T.Points(starGeo,new T.PointsMaterial({color:0xc6e7ff,size:2,sizeAttenuation:false,transparent:true,opacity:.65,fog:false})));
  const groundGeo=new T.PlaneGeometry(5000,5000,55,55);groundGeo.rotateX(-Math.PI/2);const pos=groundGeo.attributes.position;
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,-115+Math.sin(x*.007)*25+Math.cos(z*.009)*19+random()*20);}groundGeo.computeVertexNormals();scene.add(new T.Mesh(groundGeo,new T.MeshStandardMaterial({color:0x22293c,roughness:1,flatShading:true})));
  const dummy=new T.Object3D(),rocks=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),new T.MeshStandardMaterial({color:0x354157,roughness:.95,flatShading:true}),85);
  for(let i=0;i<85;i++){let x=(random()-.5)*2100,z=(random()-.5)*2100;if(x>-180&&x<470&&z>-360&&z<540)x+=750;dummy.position.set(x,-40+random()*100,z);dummy.scale.set(12+random()*35,20+random()*65,12+random()*30);dummy.rotation.set(random(),random(),random());dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);}scene.add(rocks);
  const buildings=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshStandardMaterial({color:0x202a43,metalness:.6,roughness:.5}),70);
  const strips=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial({color:0x4eafcb}),70);
  for(let i=0;i<70;i++){const angle=random()*Math.PI*2,rad=650+random()*500;const h=30+random()*220;dummy.position.set(160+Math.cos(angle)*rad,h/2-90,100+Math.sin(angle)*rad);dummy.rotation.set(0,random()*Math.PI,0);dummy.scale.set(10+random()*20,h,10+random()*20);dummy.updateMatrix();buildings.setMatrixAt(i,dummy.matrix);dummy.position.y+=h/2;dummy.scale.y=1;dummy.updateMatrix();strips.setMatrixAt(i,dummy.matrix);}scene.add(buildings,strips);
}
