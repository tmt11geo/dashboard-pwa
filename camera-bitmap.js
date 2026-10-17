// Multiscale normalised correlation for saved, unlabelled image patches.
import {clamp,iou} from './camera-core.js?v=3';
const GRID=16;
function reference(values,stride){
 const samples=[];for(let y=0;y<GRID;y+=stride)for(let x=0;x<GRID;x+=stride)samples.push(values[y*GRID+x]);
 const mean=samples.reduce((a,b)=>a+b,0)/samples.length,std=Math.sqrt(samples.reduce((a,v)=>a+(v-mean)**2,0)/samples.length);
 return std>1e-5?samples.map(v=>(v-mean)/std):null;
}
function scaledFrame(frame,target){
 const small=Math.min((target.x2-target.x1)*frame.width,(target.y2-target.y1)*frame.height);
 const scale=Math.min(1,Math.max(640/Math.max(frame.width,frame.height),64/Math.max(1,small)));
 if(scale>=1)return frame;
 const width=Math.max(1,Math.round(frame.width*scale)),height=Math.max(1,Math.round(frame.height*scale)),data=new Uint8Array(width*height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)data[y*width+x]=frame.data[Math.min(frame.height-1,Math.floor((y+.5)/scale))*frame.width+Math.min(frame.width-1,Math.floor((x+.5)/scale))];
 return {data,width,height};
}
export class BitmapMatcher {
 constructor({anchor,recent,box,side}){
  if(anchor?.length!==256||recent?.length!==256)throw new Error('Invalid bitmap reference');
  this.box=box;this.side=side||'';this.pass=0;this.hint=null;
  this.refs={coarse:[reference(anchor,2),reference(recent,2)],fine:[reference(anchor,1),reference(recent,1)]};
  if(Object.values(this.refs).flat().some(v=>!v))throw new Error('Reference has too little detail');
 }
 score(frame,x,y,w,h,fine=false){
  const stride=fine?1:2,refs=this.refs[fine?'fine':'coarse'];let sum=0,squared=0,a=0,b=0,n=0;
  const pw=w*.82,ph=h*.82;
  if(pw<6||ph<6||x-pw/2<0||y-ph/2<0||x+pw/2>=frame.width||y+ph/2>=frame.height)return null;
  for(let yy=0;yy<GRID;yy+=stride)for(let xx=0;xx<GRID;xx+=stride){
   const px=Math.round(x+(xx/(GRID-1)-.5)*pw),py=Math.round(y+(yy/(GRID-1)-.5)*ph),v=frame.data[py*frame.width+px];
   sum+=v;squared+=v*v;a+=v*refs[0][n];b+=v*refs[1][n];n++;
  }
  const std=Math.sqrt(Math.max(0,squared/n-(sum/n)**2));if(std<7)return null;
  const original=a/(n*std),recent=b/(n*std);
  if(original<(fine?.55:.35))return null;
  return original*.65+recent*.35;
 }
 search(input,seconds=0){
  const frame=scaledFrame(input,this.box),W=frame.width,H=frame.height,bw=(this.box.x2-this.box.x1)*W,bh=(this.box.y2-this.box.y1)*H;
  const coarse=[],pass=this.pass++,minimumStep=Math.max(1,Math.ceil(Math.sqrt(W*H/80000)));
  const bounds=(x,y,w,h)=>({x1:clamp((x-w/2)/W),y1:clamp((y-h/2)/H),x2:clamp((x+w/2)/W),y2:clamp((y+h/2)/H)});
  const add=(list,candidate,limit)=>{
   const overlap=list.findIndex(c=>iou(c.box,candidate.box)>.2);
   if(overlap>=0){if(list[overlap].score>=candidate.score)return;list.splice(overlap,1);}
   list.push(candidate);list.sort((a,b)=>b.score-a.score);if(list.length>limit)list.length=limit;
  };
  // Once a likely patch is found, revisit its neighbourhood on every pass so
  // phased global sampling cannot interrupt temporal confirmation of a small target.
  if(this.hint){
   const box=this.hint.box,cx=(box.x1+box.x2)/2*W,cy=(box.y1+box.y2)/2*H;
   for(const scale of [.9,1,1.1])for(let dy=-12;dy<=12;dy+=2)for(let dx=-12;dx<=12;dx+=2){
    const x=cx+dx,y=cy+dy,w=(box.x2-box.x1)*W*scale,h=(box.y2-box.y1)*H*scale,score=this.score(frame,x,y,w,h);
    if(score!==null&&score>=.45)add(coarse,{x,y,w,h,step:2,score,box:bounds(x,y,w,h)},16);
   }
  }
  for(const scale of [.65,.8,1,1.25,1.5]){
   const w=bw*scale,h=bh*scale,step=Math.max(minimumStep,Math.min(4,Math.floor(Math.min(w,h)/10)));
   let left=Math.ceil(w*.41),right=Math.floor(W-1-w*.41),top=Math.ceil(h*.41),bottom=Math.floor(H-1-h*.41);
   if(seconds<4){
    if(this.side.includes('left'))right=Math.min(right,Math.ceil(W*.35));if(this.side.includes('right'))left=Math.max(left,Math.floor(W*.65));
    if(this.side.includes('top'))bottom=Math.min(bottom,Math.ceil(H*.35));if(this.side.includes('bottom'))top=Math.max(top,Math.floor(H*.65));
   }
   for(let y=top+Math.floor(pass/step)%step;y<=bottom;y+=step)for(let x=left+pass%step;x<=right;x+=step){
    const score=this.score(frame,x,y,w,h);if(score===null||score<.45)continue;
    add(coarse,{x,y,w,h,step,score,box:bounds(x,y,w,h)},16);
   }
  }
  const matches=[];
  for(const c of coarse){
   let best=null;
   for(const size of [.92,1,1.08])for(let dy=-c.step;dy<=c.step;dy++)for(let dx=-c.step;dx<=c.step;dx++){
    const x=c.x+dx,y=c.y+dy,w=c.w*size,h=c.h*size,score=this.score(frame,x,y,w,h,true);
    if(score!==null&&score>=.78&&(!best||score>best.score))best={score,box:bounds(x,y,w,h)};
   }
   if(best)add(matches,best,4);
  }
  if(!matches.length||(matches[1]&&matches[0].score-matches[1].score<.1)){this.hint=null;return null;}
  this.hint=matches[0];
  return {kind:'manual',label:'Manual target',score:matches[0].score,box:matches[0].box};
 }
}
