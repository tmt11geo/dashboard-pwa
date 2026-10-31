const DEFAULT_YAW=Math.PI/4;
const DEFAULT_PITCH=Math.atan(.4*Math.SQRT2/(80/65));
const VERTICAL=Math.hypot(80/65,.4*Math.SQRT2);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class OrbitView {
  constructor(samples=[]){
    const points=samples.length?samples.map(p=>[p.x,p.y,p.z]):[[0,0,0]];
    this.pivot=[0,1,2].map(i=>(Math.min(...points.map(p=>p[i]))+Math.max(...points.map(p=>p[i])))/2);
    this.reset();
    const projected=points.map(p=>this.vector(p.map((v,i)=>v-this.pivot[i])));
    this.scale=Math.min(130,240/Math.max(.001,...projected.map(p=>Math.abs(p[0]))),100/Math.max(.001,...projected.map(p=>Math.abs(p[1]))));
  }
  reset(){this.yaw=DEFAULT_YAW;this.pitch=DEFAULT_PITCH;this.zoom=1;this.pan=[0,0];}
  vector([x,y,z]){
    const s=Math.sin(this.yaw),c=Math.cos(this.yaw),sp=Math.sin(this.pitch),cp=Math.cos(this.pitch);
    return [Math.SQRT2*(c*x-s*z),VERTICAL*(sp*(s*x+c*z)-cp*y)];
  }
  depth([x,y,z]){return Math.cos(this.pitch)*(Math.sin(this.yaw)*x+Math.cos(this.yaw)*z)+Math.sin(this.pitch)*y;}
  project(v){const p=this.vector(v.map((n,i)=>n-this.pivot[i]));return [350+this.pan[0]+p[0]*this.scale*this.zoom,200+this.pan[1]+p[1]*this.scale*this.zoom];}
  orbit(dx,dy){this.yaw=((this.yaw-dx*.008)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);this.pitch=clamp(this.pitch+dy*.008,-Math.PI/2+.03,Math.PI/2-.03);}
  move(dx,dy){this.pan=[clamp(this.pan[0]+dx,-2800,2800),clamp(this.pan[1]+dy,-1600,1600)];}
  zoomAt(factor,anchor=[350,200]){
    if(!Number.isFinite(factor)||factor<=0)return;
    const next=clamp(this.zoom*factor,.2,8),ratio=next/this.zoom;
    const old=this.pan;this.pan=[anchor[0]-350-(anchor[0]-350-old[0])*ratio,anchor[1]-200-(anchor[1]-200-old[1])*ratio];
    this.pan=[clamp(this.pan[0],-2800,2800),clamp(this.pan[1],-1600,1600)];this.zoom=next;
  }
}
// Input affects only the viewing camera, never replay time or source poses.
export function bindOrbit(canvas,{getView,enabled,changed}){
  const pointers=new Map();
  const point=e=>{const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)*700/Math.max(1,r.width),(e.clientY-r.top)*400/Math.max(1,r.height)];};
  const pair=()=>{const [a,b]=[...pointers.values()];return {centre:[(a.p[0]+b.p[0])/2,(a.p[1]+b.p[1])/2],distance:Math.hypot(a.p[0]-b.p[0],a.p[1]-b.p[1])};};
  function cancel(){for(const id of pointers.keys()){try{canvas.releasePointerCapture(id);}catch{}}pointers.clear();}
  canvas.addEventListener('pointerdown',e=>{
    if(!enabled() || (e.pointerType==='mouse'&&e.button!==0&&e.button!==2))return;
    e.preventDefault();canvas.focus({preventScroll:true});
    pointers.set(e.pointerId,{p:point(e),pan:e.shiftKey||e.button===2});
    try{canvas.setPointerCapture(e.pointerId);}catch{}
  });
  canvas.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId))return;
    if(!enabled()){cancel();return;}
    e.preventDefault();const view=getView(),old=pointers.get(e.pointerId),next=point(e);
    if(pointers.size===1){const dx=next[0]-old.p[0],dy=next[1]-old.p[1];old.pan||e.shiftKey?view.move(dx,dy):view.orbit(dx,dy);old.p=next;}
    else {const before=pair();old.p=next;const after=pair();if(before.distance>4&&after.distance>4)view.zoomAt(after.distance/before.distance,before.centre);view.move(after.centre[0]-before.centre[0],after.centre[1]-before.centre[1]);}
    changed();
  });
  const release=e=>{pointers.delete(e.pointerId);try{canvas.releasePointerCapture(e.pointerId);}catch{}};
  for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,release);
  canvas.addEventListener('contextmenu',e=>{if(enabled())e.preventDefault();});
  canvas.addEventListener('wheel',e=>{
    if(!enabled())return;e.preventDefault();
    const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?400:1);
    getView().zoomAt(Math.exp(clamp(-delta*.0015,-1,1)),point(e));changed();
  },{passive:false});
  canvas.addEventListener('keydown',e=>{
    if(!enabled())return;const v=getView(),amount=12;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
      const dx=e.key==='ArrowLeft'?-amount:e.key==='ArrowRight'?amount:0,dy=e.key==='ArrowUp'?-amount:e.key==='ArrowDown'?amount:0;
      e.shiftKey?v.move(dx,dy):v.orbit(dx,dy);
    }else if(e.key==='+'||e.key==='=')v.zoomAt(1.2);
    else if(e.key==='-')v.zoomAt(1/1.2);
    else if(e.key==='0'||e.key.toLowerCase()==='r'){cancel();v.reset();}
    else return;
    e.preventDefault();changed();
  });
  window.addEventListener('blur',cancel);
  window.addEventListener('pagehide',cancel);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
  return {cancel};
}
