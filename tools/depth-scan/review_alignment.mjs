// Run after run_browser.cjs --real has generated model-frames.json.
// Output is a diagnostic replay, not a claim of reconstruction accuracy.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {ScanMap} from '../../depth-scan-core.js';
import {render} from '../../tests/fixtures/scan-render.mjs';
const dir=process.argv[2];if(!dir)throw Error('Pass fixture directory');
const bytes=fs.readFileSync(dir+'/model-frames.json');
const map=new ScanMap(),frames=JSON.parse(bytes).map((f,index)=>({index,result:map.add({...f,raw:Float32Array.from(f.raw),pixels:Uint8ClampedArray.from(f.pixels)})}));
const rotationCases=[.01,.02,.03,.035,.04,.05,.07,.1].map(yawRadians=>{
 const m=new ScanMap();m.add(render());return {yawRadians,truthTranslation:[0,0,0],result:m.add(render(0,yawRadians))};
});
const report={scope:'Final shipped algorithm; real TFJS output replay and synthetic rotation stress cases',
 inputSha256:crypto.createHash('sha256').update(bytes).digest('hex'),
 limitation:'Five Redwood frames contain mixed motion, not a controlled phone sideways/6DoF accuracy benchmark. Pure-rotation false acceptances below are known defects, not successful reconstruction.',
 frames,acceptedViews:map.views,rotationCases,falseRotationAcceptances:rotationCases.filter(x=>x.result.ok).length};
fs.writeFileSync(new URL('./evidence/alignment-review-v8.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({acceptedViews:map.views,falseRotationAcceptances:report.falseRotationAcceptances}));
