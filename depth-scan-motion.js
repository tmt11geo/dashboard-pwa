// Small preview translation estimate, not camera pose or metric distance.
// Positive dx means scene detail moved right in the camera image.
export function estimateMovement(anchor,image,size=72){
 if(!anchor)return {state:'first',progress:0,arrow:'↔',message:'Hold still for the first view'};
 const margin=20,step=3,limit=18,scores=[];
 for(let dy=-limit;dy<=limit;dy++)for(let dx=-limit;dx<=limit;dx++){
  let a=0,b=0,aa=0,bb=0,ab=0,n=0;
  for(let y=margin;y<size-margin;y+=step)for(let x=margin;x<size-margin;x+=step){
   const av=anchor[y*size+x],bv=image[(y+dy)*size+x+dx];a+=av;b+=bv;aa+=av*av;bb+=bv*bv;ab+=av*bv;n++;
  }
  const va=aa-a*a/n,vb=bb-b*b/n;
  scores.push({dx,dy,score:va>.025&&vb>.025?(ab-a*b/n)/Math.sqrt(va*vb):-1});
 }
 scores.sort((a,b)=>b.score-a.score);const best=scores[0];
 const other=scores.find(s=>Math.hypot(s.dx-best.dx,s.dy-best.dy)>4);
 if(best.score<.68||best.score-(other?.score??-1)<.035)return {confidence:best.score,ambiguity:best.score-(other?.score??-1),state:'lost',progress:0,arrow:'↶',message:'Overlap uncertain — return toward the last view'};
 const distance=Math.hypot(best.dx,best.dy),progress=Math.min(100,Math.round(distance/4*100));
 const horizontal=Math.abs(best.dx)>=Math.abs(best.dy);
 const forward=horizontal?(best.dx>0?'←':'→'):(best.dy>0?'↑':'↓');
 const back=horizontal?(best.dx>0?'→':'←'):(best.dy>0?'↓':'↑');
 const common={dx:best.dx,dy:best.dy,progress,shift:Math.round(distance/size*100),confidence:best.score};
 if(distance>10)return {...common,state:'back',arrow:back,message:'Move back slightly — keep more overlap'};
 if(distance>=4)return {...common,state:'ready',arrow:'Ⅱ',message:'Enough movement — hold still'};
 return {...common,state:'more',arrow:distance?forward:'↔',message:'Move a little more sideways'};
}
