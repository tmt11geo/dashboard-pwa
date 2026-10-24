import fs from 'node:fs';
import {ScanMap} from '../../depth-scan-core.js';
import {scaledIntrinsics} from '../../depth-calibration-core.js';
import {render} from '../../tests/fixtures/scan-render.mjs';
const K=[429.3,0,320.2,0,422.9,245.7,0,0,1],k=scaledIntrinsics(K,224,168),cases=[];
for(const seed of [902,2061,18771,98211,31009])for(const affine of [[1,0],[1.4,.3],[.8,-.1]]){
 const frame=(x,a=0)=>({...render(x,a,x?affine:[1,0],{width:224,height:168,K:k,texture:'noise',seed}),K:k,tracking:render(x,a,[1,0],{width:640,height:480,K,texture:'noise',seed}).pixels});
 const map=new ScanMap();map.add(frame(0));
 for(const x of [.1,.2]){const r=map.add(frame(x)),error=r.ok?Math.hypot(map.reference.pose.t[0]-x*.25,map.reference.pose.t[1],map.reference.pose.t[2]):null;cases.push({seed,affine,type:'translation',x,accepted:r.ok,code:r.code,error,accurate:!r.ok||error<.005});}
 for(const a of [-.08,-.04,-.02,.02,.04,.08]){const m=new ScanMap();m.add(frame(0));const r=m.add(frame(0,a));cases.push({seed,affine,type:'rotation',a,accepted:r.ok,code:r.code,accurate:!r.ok});}
}
const report={mode:'Robust rotation residual competition; 902/2061 retained regressions, 18771/98211/31009 fresh evaluation; not phone accuracy',cases,acceptedTranslations:cases.filter(c=>c.type==='translation'&&c.accepted).length,translationCases:cases.filter(c=>c.type==='translation').length,falseRotations:cases.filter(c=>c.type==='rotation'&&c.accepted).length,inaccurateAcceptedTranslations:cases.filter(c=>c.type==='translation'&&c.accepted&&!c.accurate).length};
fs.writeFileSync(new URL('./evidence/scan-heldout.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log({...report,cases:undefined});if(cases.some(c=>!c.accurate))process.exitCode=1;
