import {stitchFrames,buildRelief} from './scan-session-core.js?v=4';
let aligned=null;
self.onmessage=({data})=>{try{
 if(data.type==='stitch'){aligned=null;aligned=stitchFrames(data.frames,p=>self.postMessage({type:'progress',...p}));self.postMessage({type:'stitched',results:aligned.results,placed:aligned.placed.length,anchorRecovery:aligned.anchorRecovery});}
 if(data.type==='relief'){if(!aligned)throw Error('Stitch first');self.postMessage({type:'relief',scene:buildRelief(aligned)});}
}catch(e){self.postMessage({type:'error',message:e.message});}};
