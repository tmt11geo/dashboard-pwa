// Actual page, calibration verification WASM and registration; controlled depth inference.
// Pass a PRIVATE calibration session; never write its images/identifiers to repository evidence.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http');
(async()=>{
 const root=path.resolve(__dirname,'../..'),sessionPath=process.argv[2],session=JSON.parse(fs.readFileSync(sessionPath)),real=process.argv.includes('--real'),report={checks:[],errors:[],mode:real?'Actual calibration WASM + TFJS WebGL + registration, simulated camera':'Actual calibration WASM + scan worker, simulated camera and depth inference'};
 const server=http.createServer((req,res)=>{const p=new URL(req.url,'http://localhost').pathname;if(p==='/private-image'){res.setHeader('Content-Type','image/png');res.end(Buffer.from(session.observations[0].image.split(',')[1],'base64'));return;}const file=path.join(root,p.replace(/^\/dashboard-pwa\//,''));fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',/\.js$/.test(file)?'text/javascript':/\.html$/.test(file)?'text/html':/\.css$/.test(file)?'text/css':/\.json$/.test(file)?'application/json':'application/octet-stream');res.end(b);});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 const check=(name,ok)=>{report.checks.push({name,pass:!!ok});console.log(ok?'PASS':'FAIL',name);if(!ok)throw Error(name);};
 try{
  browser=await chromium.launch({executablePath:process.env.DEPTH_CHROMIUM||'/tmp/depth-browser/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});report.browser=browser.version();
  const page=await browser.newPage({viewport:{width:915,height:412},acceptDownloads:true,serviceWorkers:'block'});page.on('pageerror',e=>report.errors.push(e.message));
  if(real){const runtime=fs.readFileSync('/tmp/tf.min.js');if(require('crypto').createHash('sha256').update(runtime).digest('hex')!=='300dfae273d20b4046f46a06d735688f03675a807561e9bcb5f664eb2f3d2831')throw Error('Wrong TFJS runtime');await page.route('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js',r=>r.fulfill({contentType:'text/javascript',body:runtime}));}
  await page.addInitScript(({g,real})=>{
   window.streams=[];window.sent=[];window.zoomOverride=null;window.requests=[];
   Object.defineProperty(screen.orientation,'angle',{get:()=>window.phoneAngle??g.screenAngle});
   const NativeWorker=Worker;
   window.Worker=class{
    constructor(url,opts){if(real||!String(url).includes('depth-tfjs-worker')){const w=new NativeWorker(url,opts);if(String(url).includes('depth-tfjs-worker')){const post=w.postMessage.bind(w);w.postMessage=(data,transfer)=>{if(data.type==='frame')window.sent.push({content:data.content,width:data.width,height:data.height});return post(data,transfer);};}
     if(String(url).includes('depth-scan-worker')){const post=w.postMessage.bind(w);w.postMessage=(data,transfer)=>{window.scanK=data.frame?.K;return post(data,transfer);};}return w;}}
    postMessage(data){if(data.type==='init'){setTimeout(()=>this.onmessage?.({data:{type:'ready',backend:'tfjs-webgl',precision:'FP32',modelBytes:97817343}}),10);return;}
     window.sent.push({content:data.content,width:data.width,height:data.height});
     const {x,y,width:w,height:h}=data.content,src=new Uint8ClampedArray(data.pixels),pixels=new Uint8ClampedArray(w*h*4),raw=new Float32Array(w*h),depth=new Float32Array(w*h);
     for(let v=0;v<h;v++)for(let u=0;u<w;u++){const i=v*w+u;pixels.set(src.subarray(((v+y)*224+u+x)*4,((v+y)*224+u+x)*4+4),i*4);raw[i]=1+u/w*.5+v/h*.3;depth[i]=(raw[i]-1)/.8;}
     setTimeout(()=>{if(!this.ended)this.onmessage?.({data:{type:'depth',id:data.id,width:w,height:h,pixels:pixels.buffer,rawDepth:raw.buffer,depth:depth.buffer,capture:data.capture,inferenceMs:30}});},30);
    }
    terminate(){this.ended=true;}
   };
   navigator.mediaDevices.enumerateDevices=async()=>[{kind:'videoinput',deviceId:'renewed-id',label:g.label}];
   navigator.mediaDevices.getUserMedia=async options=>{
    if(window.staleId&&options.video.deviceId?.exact===g.deviceId){const e=new Error('');e.name='OverconstrainedError';e.constraint='deviceId';throw e;}
    window.requests.push(options);if(options.video.width?.exact||options.video.height?.exact||options.video.resizeMode?.exact||window.rejectCamera){const e=new Error('');e.name='OverconstrainedError';e.constraint=window.rejectCamera||'width';throw e;}const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;const image=new Image();image.src='/private-image';await image.decode();canvas.getContext('2d').drawImage(image,0,0);const stream=canvas.captureStream(15),track=stream.getVideoTracks()[0];
    Object.defineProperty(track,'label',{value:g.label});track.getSettings=()=>({deviceId:window.staleId?'renewed-id':g.deviceId,width:640,height:480,facingMode:g.facingMode,focusMode:g.focusMode,focusDistance:g.focusDistance,zoom:window.zoomOverride??g.zoom,resizeMode:g.resizeMode});track.getCapabilities=()=>({focusMode:['manual'],focusDistance:{min:0,max:.57},zoom:{min:1,max:10}});track.applyConstraints=async options=>{window.constraints=options;};window.streams.push(stream);return stream;
   };
  },{g:session.metadata.geometry,real});
  const url=`http://127.0.0.1:${server.address().port}/dashboard-pwa/depth.html?v=12`;await page.goto(url);
  await page.click('#scan-start');check('scan requires calibration without assumed-camera fallback',(await page.locator('#scan-guide').innerText()).includes('Load your calibration'));
  await page.setInputFiles('#scan-calibration-file',sessionPath);await page.waitForFunction(()=>!document.querySelector('#scan-calibration').disabled,{},{timeout:180000});
  const message=await page.locator('#scan-calibration-status').innerText();console.log(message);check('real phone PNGs independently verified by browser',message.includes('Calibration ready'));
  check('successful import clears the stale load-calibration guide',(await page.locator('#scan-guide').innerText()).includes('Calibration ready'));
  await page.evaluate(()=>window.phoneAngle=0);await page.click('#scan-start');
  check('portrait start is blocked before camera permission',await page.evaluate(()=>requests.length===0&&document.querySelector('#scan-guide').textContent.includes('same landscape direction')));
  await page.evaluate(()=>window.phoneAngle=undefined);
  await page.click('#scan-start');await page.waitForFunction(()=>document.querySelector('#scan-count').textContent.includes('1 accepted'),{},{timeout:180000});
  if(real)check('actual WebGL backend and CPU forwarding disabled',(await page.locator('#diagnostic-log').inputValue()).includes('\"cpuForward\":false'));
  check('calibrated first relief is rendered',await page.locator('#relief').isVisible());
  check('corrected image letterboxes to 224x168 and calibrated K reaches registration',await page.evaluate(()=>sent[0].content.width===224&&sent[0].content.height===168&&scanK.length===9&&Math.abs(scanK[0]-150.26)<1));
  check('Android exact size rejection avoided with preferred dimensions',await page.evaluate(()=>requests[0].video.width.ideal===640&&requests[0].video.height.ideal===480&&requests[0].video.resizeMode.ideal==='none'));
  check('camera requested by exact calibrated identity',await page.evaluate(()=>!!requests[0].video.deviceId.exact));
  check('out-of-range Android focus distance is not blindly reapplied',await page.evaluate(()=>constraints.advanced[0].focusDistance===undefined));
  await page.evaluate(()=>scrollTo(0,0));
  check('landscape controls and both complete views fit viewport',await page.evaluate(()=>{const nodes=[...document.querySelectorAll('.scan-primary,.scan-panel .image-frame')];return nodes.every(n=>{const r=n.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;});}));
  await page.screenshot({path:'/tmp/calibrated-scan-landscape.png'});
  await page.click('#scan-finish');check('finish releases camera',await page.evaluate(()=>streams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))));
  check('replay becomes saveable',!await page.locator('#scan-replay-save').isDisabled());
  const download=page.waitForEvent('download');await page.click('#scan-replay-save');await (await download).saveAs('/tmp/calibrated-scan-replay.json');const replay=JSON.parse(fs.readFileSync('/tmp/calibrated-scan-replay.json'));
  check('replay contains bound calibration, raw RGB, relative depth and decision',replay.frames.length===1&&replay.calibration.inputSha256&&replay.frames[0].image.startsWith('data:image/png;base64,')&&replay.frames[0].depth.raw.length===224*168&&replay.frames[0].alignment.ok);
  await page.click('#scan-clear');await page.evaluate(()=>window.zoomOverride=2);await page.click('#scan-start');await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Camera differs'));
  check('zoom mismatch blocks scan and releases camera',await page.evaluate(()=>streams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))));
  if(!real){
   await page.evaluate(()=>window.zoomOverride=null);await page.click('#scan-start');await page.waitForFunction(()=>document.querySelector('#scan-count').textContent.includes('1 accepted'),{},{timeout:30000});
   await page.evaluate(()=>window.zoomOverride=2);await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Camera differs'));
   check('live settings change stops before more captures',await page.evaluate(()=>streams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))));
   await page.click('#scan-clear');await page.evaluate(()=>{window.zoomOverride=null;window.rejectCamera='deviceId';});await page.click('#scan-start');await page.waitForFunction(()=>document.querySelector('#scan-guide').textContent.includes('Camera request rejected (deviceId)'));
   check('rejected constraint appears in guide and diagnostics',(await page.locator('#diagnostic-log').inputValue()).includes('"constraint":"deviceId"'));
   await page.evaluate(()=>{window.rejectCamera=null;window.staleId=true;});
   page.once('dialog',d=>d.accept());await page.click('#scan-start');
   await page.waitForFunction(()=>document.querySelector('#scan-count').textContent.includes('1 accepted'),{},{timeout:30000});
   check('renewed ID with explicit same-phone confirmation reaches calibrated first view',await page.evaluate(()=>requests.at(-1).video.deviceId.exact==='renewed-id'));
   check('permission probe stopped before calibrated camera',await page.evaluate(()=>streams.slice(0,-1).every(s=>s.getTracks().every(t=>t.readyState==='ended'))));
   await page.click('#scan-finish');
   await page.click('#scan-clear');
   page.once('dialog',d=>d.dismiss());await page.click('#scan-start');await page.waitForFunction(()=>document.querySelector('#scan-guide').textContent.includes('reconnection cancelled'));
   check('declining identity confirmation leaves all cameras stopped',await page.evaluate(()=>streams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))));
   const bad=structuredClone(session);bad.observations[0].points=bad.observations[0].points.map(x=>x+20);
   await page.setInputFiles('#scan-calibration-file',{name:'invalid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});await page.waitForFunction(()=>!document.querySelector('#scan-calibration').disabled,{},{timeout:180000});
   check('tampered corners rejected without trusting passed flag',(await page.locator('#scan-calibration-status').innerText()).includes('Saved corners disagree'));
  }
  check('no horizontal page overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  check('no uncaught errors',report.errors.length===0);
 }finally{if(browser)await browser.close();server.close();fs.writeFileSync(path.join(root,'tools/depth-calibration/evidence/'+(real?'scan-actual-tfjs.json':'scan-binding-browser.json')),JSON.stringify(report,null,2)+'\n');}
})().catch(e=>{console.error(e);process.exitCode=1;});
