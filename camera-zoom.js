import {clamp} from './camera-core.js?v=3';
export const fullView=()=>({scale:1,x:0,y:0});
export function zoomRegion(view){return {x1:view.x,y1:view.y,x2:view.x+1/view.scale,y2:view.y+1/view.scale};}
export function zoomAt(view,scale,anchor={x:.5,y:.5},destination=anchor){
 scale=clamp(scale,1,8);
 const world={x:view.x+anchor.x/view.scale,y:view.y+anchor.y/view.scale};
 return {scale,x:clamp(world.x-destination.x/scale,0,1-1/scale),y:clamp(world.y-destination.y/scale,0,1-1/scale)};
}
export function panView(view,dx,dy){return {...view,x:clamp(view.x-dx/view.scale,0,1-1/view.scale),y:clamp(view.y-dy/view.scale,0,1-1/view.scale)};}
export function imagePoint(point,region){return {x:region.x1+point.x*(region.x2-region.x1),y:region.y1+point.y*(region.y2-region.y1)};}
export function imageBox(box,region){
 const a=imagePoint({x:box.x1,y:box.y1},region),b=imagePoint({x:box.x2,y:box.y2},region);
 return {x1:a.x,y1:a.y,x2:b.x,y2:b.y};
}
export function viewBox(box,region){
 const w=region.x2-region.x1,h=region.y2-region.y1;
 return {x1:(box.x1-region.x1)/w,y1:(box.y1-region.y1)/h,x2:(box.x2-region.x1)/w,y2:(box.y2-region.y1)/h};
}
export function followRegion(box,scale){
 const size=1/scale;
 return zoomRegion({scale,x:clamp((box.x1+box.x2)/2-size/2,0,1-size),y:clamp((box.y1+box.y2)/2-size/2,0,1-size)});
}
export function cropGray(frame,region,maxEdge=320){
 const sw=frame.width*(region.x2-region.x1),sh=frame.height*(region.y2-region.y1),scale=Math.min(1,maxEdge/Math.max(sw,sh));
 const width=Math.max(1,Math.round(sw*scale)),height=Math.max(1,Math.round(sh*scale)),data=new Uint8Array(width*height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const sx=clamp(Math.floor(region.x1*frame.width+x/scale),0,frame.width-1),sy=clamp(Math.floor(region.y1*frame.height+y/scale),0,frame.height-1);
  data[y*width+x]=frame.data[sy*frame.width+sx];
 }
 return {data,width,height};
}
