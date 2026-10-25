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
    window.requests.push(options);if(options.video.width?.exact||options.video.height?.exact||options.video.resizeMode?.exact||window.rejectCamera){const e=new Error('');e.name='OverconstrainedError';e.constraint=window.rejectCamera||'width';throw e;}const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;const image=new Image();image.src='/private-image';await image.decode();canvas.getContext('2d').drawImage(image,0,0);const stream=canvas.captureStream(15),track=stream.getVideoTracks()[0];setInterval(()=>canvas.getContext('2d').drawImage(image,0,0),100);
    Object.defineProperty(track,'label',{value:g.label});track.getSettings=()=>({deviceId:window.staleId?'renewed-id':g.deviceId,width:640,height:480,facingMode:g.facingMode,focusMode:g.focusMode,focusDistance:g.focusDistance,zoom:window.zoomOverride??g.zoom,resizeMode:g.resizeMode});track.getCapabilities=()=>({focusMode:['manual'],focusDistance:{min:0,max:.57},zoom:{min:1,max:10}});track.applyConstraints=async options=>{window.constraints=options;};window.streams.push(stream);return stream;
   };
  },{g:session.metadata.geometry,real});

  await page.goto(`http://127.0.0.1:${server.address().port}/dashboard-pwa/scan.html?v=1`);
  await page.click('#scan-start');check('gather requires calibration',(await page.locator('#scan-guide').innerText()).includes('Load calibration'));
  await page.setInputFiles('#scan-calibration-file',sessionPath);await page.waitForFunction(()=>!document.querySelector('#scan-calibration').disabled,{},{timeout:180000});
  await page.click('#scan-start');await page.waitForFunction(()=>!document.querySelector('#gather-capture').disabled);
  check('gather starts without automatic inference',await page.evaluate(()=>sent.length===0));
  for(let n=1;n<=3;n++){await page.click('#gather-capture');await page.waitForFunction(n=>document.querySelector('#scan-count').textContent.startsWith(n+' /'),n);}
  check('three unchanged views gathered without motion or alignment gate',await page.evaluate(()=>sent.length===3));
  await page.click('#scan-finish');check('finish releases camera',await page.evaluate(()=>streams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))));
  const download=page.waitForEvent('download');await page.click('#session-save');await (await download).saveAs('/tmp/tactical-gather-test.json');
  const saved=JSON.parse(fs.readFileSync('/tmp/tactical-gather-test.json'));check('session contains all three calibrated image/depth captures',saved.frames.length===3&&saved.frames.every(f=>f.tracking&&f.raw&&f.K)&&!!saved.calibration.inputSha256);
  await page.click('#session-stitch');await page.waitForFunction(()=>!document.querySelector('#session-relief').disabled,{},{timeout:180000});
  check('stitch reports every saved view',await page.locator('#session-results li').count()===3);
  check('unplaced duplicates are explicit',(await page.locator('#session-results').innerText()).includes('unplaced'));
  check('relief is a separate stage',await page.locator('#scan-save').isDisabled());
  await page.click('#session-relief');await page.waitForFunction(()=>!document.querySelector('#scan-save').disabled);
  check('single-view limitation is clear',(await page.locator('#scan-guide').innerText()).includes('single view only'));
  check('relief canvas is visible',await page.locator('#relief').isVisible());
  await page.screenshot({path:'/tmp/gather-page-test.png'});
  await page.click('#scan-clear');await page.setInputFiles('#session-file','/tmp/tactical-gather-test.json');await page.waitForFunction(()=>document.querySelector('#scan-count').textContent.startsWith('3 /'));
  check('saved session opens for offline retry',await page.locator('#session-stitch').isEnabled());
  await page.click('#session-stitch');await page.click('#session-cancel');check('cancel preserves all captures',(await page.locator('#scan-count').innerText()).startsWith('3 /'));
  check('stitch retry enabled after cancel',await page.locator('#session-stitch').isEnabled());
  await page.click('#scan-clear');await page.setInputFiles('#session-file',process.argv[3]);await page.waitForFunction(()=>document.querySelector('#scan-count').textContent.startsWith('5 /'));
  await page.click('#session-stitch');await page.waitForFunction(()=>!document.querySelector('#session-relief').disabled,{},{timeout:180000});
  check('real saved lamp session recovers later anchor',(await page.locator('#scan-guide').innerText()).includes('starting at view 4'));
  check('real saved session retains all five decisions',await page.locator('#session-results li').count()===5);
  check('compact diagnostics retain final view',(await page.locator('#diagnostic-log').inputValue()).includes('"index":4'));
  await page.click('#session-relief');await page.waitForFunction(()=>!document.querySelector('#scan-save').disabled);
  check('real lamp session builds exactly two placed views',(await page.locator('#scan-guide').innerText()).includes('2 views in relief'));await page.screenshot({path:'/tmp/lamp-relief.png'});
  check('no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));check('no uncaught errors',report.errors.length===0);
 }finally{if(browser)await browser.close();server.close();fs.writeFileSync(path.join(root,'tools/depth-calibration/evidence/gather-lamp-browser.json'),JSON.stringify(report,null,2)+'\n');}
})().catch(e=>{console.error(e);process.exitCode=1;});
