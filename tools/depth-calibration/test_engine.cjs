const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto'),assert=require('node:assert/strict');
(async()=>{const root=path.resolve(__dirname,'../..'),vendor=path.join(root,'vendor/calibration-opencv'),manifest=JSON.parse(fs.readFileSync(path.join(vendor,'manifest.json')));const code=zlib.gunzipSync(Buffer.concat(manifest.parts.map(p=>fs.readFileSync(path.join(vendor,p.path)))));assert.equal(crypto.createHash('sha256').update(code).digest('hex'),manifest.runtimeSha256);const m={exports:{}};new Function('module','exports','require','__dirname','__filename',code.toString())(m,m.exports,require,vendor,path.join(vendor,'opencv.cjs'));const cv=await m.exports;require(path.join(root,'calibration-engine.js'));const E=globalThis.CalibrationEngine,views=JSON.parse(fs.readFileSync(process.argv[2]||'/tmp/calibration-fixtures/session.json')).observations;const checks=[];
function check(name,condition){assert(condition,name);checks.push({name,pass:true});}
check('actual bundled engine calibrates known views',E.calibrate(cv,views).passed);
assert.throws(()=>E.calibrate(cv,views.slice(0,15)));check('insufficient views rejected',true);
const bad=views.map((v,i)=>({...v,points:v.points.map((x,j)=>i%2?x:(x-(j%2?240:320))*1.15+(j%2?240:320))}));check('inconsistent view groups rejected',!E.calibrate(cv,bad).passed);
const malformed=views.map(v=>({...v,points:[...v.points]}));malformed[0].points[0]=NaN;assert.throws(()=>E.calibrate(cv,malformed));check('nonfinite observations rejected',true);
const blank=new Uint8Array(640*480*4).fill(127);check('blank image rejected',!E.detect(cv,blank).accepted);
fs.writeFileSync(path.join(root,'tools/depth-calibration/evidence/engine.json'),JSON.stringify({checks,runtimeSha256:manifest.runtimeSha256},null,2));console.log(checks);
})().catch(e=>{console.error(e);process.exitCode=1;});
