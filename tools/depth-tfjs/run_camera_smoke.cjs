// Actual app and actual TFJS worker; synthetic camera uses a pinned local scene.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
(async()=>{
 const [tfFile,fixtureFile,output]=process.argv.slice(2),lifecycle=process.env.DEPTH_LIFECYCLE==='1',prefix=process.env.DEPTH_PREFIX||'';
 if(!output)throw Error('Usage: node run_camera_smoke.cjs TFJS_JS FIXTURE_JPG REPORT');
 const root=path.resolve(__dirname,'../..'),tf=fs.readFileSync(tfFile),fixture=fs.readFileSync(fixtureFile),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
 if(hash(tf)!=='300dfae273d20b4046f46a06d735688f03675a807561e9bcb5f664eb2f3d2831')throw Error('Runtime hash mismatch');
 const pinned=JSON.parse(fs.readFileSync(path.join(__dirname,'validation-fixtures.json'))).fixtures.find(f=>f.name==='demo01.jpg');
 if(fixture.length!==pinned.bytes||hash(fixture)!==pinned.sha256)throw Error('Fixture hash mismatch');
 const requests=[],report={stage:lifecycle||prefix?8:7,path_prefix:prefix,status:'FAIL',utc:new Date().toISOString(),checks:[],fixture_sha256:hash(fixture),runtime_sha256:hash(tf),scope:'Actual Depth Lab and TFJS worker on loopback, synthetic camera from local fixture; SwiftShader, not physical camera or phone'};
 const server=http.createServer((req,res)=>{
  const requestedPath=new URL(req.url,'http://localhost').pathname;
  const name=prefix&&requestedPath.startsWith(prefix+'/')?requestedPath.slice(prefix.length):requestedPath;
  if(req.method!=='GET'){res.writeHead(405).end();return;}
  const file=path.resolve(root,'.'+name);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  const send=b=>{requests.push({path:name,requestedPath,bytes:b.length});res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':name==='/fixture.jpg'?'image/jpeg':'application/octet-stream');res.end(b);};
  if(name==='/fixture.jpg')send(fixture);else fs.readFile(file,(err,b)=>err?res.writeHead(404).end():send(b));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser,page;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.DEPTH_CHROMIUM,args:['--no-sandbox','--no-zygote','--single-process','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  report.browser=browser.version();page=await browser.newPage({serviceWorkers:'block'});
  await page.route('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js',route=>route.fulfill({contentType:'text/javascript',body:tf}));
  await page.addInitScript(()=>{
   window.testStreams=[];window.testCanvases=[];window.testPortrait=false;window.testTimeouts={};
   const timeout=window.setTimeout.bind(window);window.setTimeout=(fn,ms,...args)=>timeout(fn,window.testTimeouts[ms]??ms,...args);
   navigator.mediaDevices.getUserMedia=async()=>{
    const image=new Image();image.src='/fixture.jpg';await image.decode();
    const canvas=document.createElement('canvas');canvas.width=window.testPortrait?480:640;canvas.height=window.testPortrait?640:480;
    const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,canvas.width,canvas.height);
    const stream=canvas.captureStream(10),timer=setInterval(()=>ctx.drawImage(image,0,0,canvas.width,canvas.height),100);
    for(const track of stream.getTracks()){const stop=track.stop.bind(track);track.stop=()=>{clearInterval(timer);stop();};}
    window.testStreams.push(stream);window.testCanvases.push(canvas);return stream;
   };
  });
  await page.goto(`http://127.0.0.1:${server.address().port}${prefix}/depth.html`);
  const check=(name,pass)=>{report.checks.push({name,pass});if(!pass)throw Error(name);console.log('PASS',name);};
  await page.selectOption('#resolution','518');await page.selectOption('#backend','tfjs-webgl');
  check('fixed resolution enforced',await page.locator('#resolution').inputValue()==='224'&&await page.locator('#resolution').isDisabled());
  await page.click('#start');
  await page.waitForFunction(()=>document.querySelector('#diagnostic-log').value.includes('worker.tfjs.identity'),{},{timeout:30000});
  await page.waitForFunction(()=>!document.querySelector('#pause').disabled,{},{timeout:30000});
  await page.click('#pause');
  await page.waitForFunction(()=>document.querySelector('#diagnostic-log').value.includes('main.frame.complete'),{},{timeout:90000});
  check('actual frame and aspect ratio',await page.locator('#depth-image').evaluate(e=>e.width===224&&e.height===168));
  check('accurate engine label',(await page.locator('#engine').textContent()).includes('TFJS WebGL'));
  await page.click('#step');
  await page.waitForFunction(()=>document.querySelector('#diagnostic-log').value.split('main.frame.complete').length>=3,{},{timeout:90000});
  check('pause then single step',!(await page.locator('#step').isDisabled()));
  report.logs=await page.locator('#diagnostic-log').inputValue();
  check('explicit WebGL without CPU forwarding',report.logs.includes('"backend":"webgl"')&&report.logs.includes('"cpuForward":false'));
  await page.click('#stop');
  check('camera tracks ended',await page.evaluate(()=>testStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))));
  check('controls restored',await page.locator('#start').isEnabled()&&await page.locator('#pause').isDisabled());
  check('all packaged model files requested',new Set(requests.filter(r=>r.path.startsWith('/models/')&&/\.bin$|model.json$/.test(r.path)).map(r=>r.path)).size===25);
  if(lifecycle){
   report.cycles=[];
   const logs=()=>page.locator('#diagnostic-log').inputValue();
   async function reset(){await page.click('#clear-log');await page.evaluate(()=>{window.testTimeouts={};});}
   async function stopped(){await page.waitForFunction(()=>!document.querySelector('#start').disabled,{},{timeout:90000});check('all tracks released after interruption',await page.evaluate(()=>testStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))));report.cycles.push(await logs());}
   async function waitLog(text,timeout=90000){await page.waitForFunction(t=>document.querySelector('#diagnostic-log').value.includes(t),text,{timeout});}
   // Missing model HTTP failure is retained, then the same page can restart.
   await reset();await page.route('**/models/**/model.json',r=>r.fulfill({status:404,body:'missing model'}));
   await page.click('#start');await waitLog('main.failure');await stopped();check('model failure retained',(await logs()).includes('worker.tfjs.failure'));
   await page.unroute('**/models/**/model.json');
   // A real delayed HTTP request lets Stop interrupt model loading.
   const delay=r=>new Promise(resolve=>setTimeout(resolve,3000)).then(()=>r.continue()).catch(()=>{});
   await reset();await page.route('**/models/**/model.json',delay);
   await page.click('#start');await waitLog('worker.tfjs.load.begin');await page.click('#stop');await stopped();check('stop during actual model loading',true);
   await page.unroute('**/models/**/model.json');
   // Shorten only the parent test deadline; exercise the production timeout path.
   await reset();await page.route('**/models/**/model.json',delay);await page.evaluate(()=>window.testTimeouts[240000]=1500);
   await page.click('#start');await waitLog('Model loading timed out');await stopped();check('loading deadline terminates worker',true);
   await page.unroute('**/models/**/model.json');
   await reset();await page.click('#start');await waitLog('worker.tfjs.inference.begin');await page.click('#stop');await stopped();check('stop during actual inference',true);
   await reset();await page.evaluate(()=>window.testTimeouts[60000]=500);
   await page.click('#start');await waitLog('Depth inference exceeded');await stopped();check('inference deadline terminates worker',true);
   // Portrait restart, repeated output disposal and actual WebGL context loss.
   await reset();await page.evaluate(()=>window.testPortrait=true);await page.click('#start');
   await page.waitForFunction(()=>!document.querySelector('#pause').disabled,{},{timeout:30000});await page.click('#pause');await waitLog('main.frame.complete');
   check('portrait restart alignment',await page.locator('#depth-image').evaluate(e=>e.width===168&&e.height===224));
   await page.click('#step');await page.waitForFunction(()=>document.querySelector('#diagnostic-log').value.split('main.frame.complete').length>=3,{},{timeout:90000});
   await waitLog('worker.tfjs.frame.disposed');
   const lines=(await logs()).split('\n').filter(l=>l.includes('worker.tfjs.frame.disposed'));
   const memories=lines.map(l=>JSON.parse(l.slice(l.indexOf('{'))));report.steady_memory=memories;
   check('repeated frames retain only model tensors',memories.length>=2&&memories.every(m=>m.numTensors===memories[0].numTensors&&m.numDataBuffers===memories[0].numDataBuffers&&m.numBytes===memories[0].numBytes));
   const worker=page.workers().find(w=>w.url().includes('depth-tfjs-worker'));
   await worker.evaluate(()=>tf.backend().gpgpu.gl.getExtension('WEBGL_lose_context').loseContext());
   await waitLog('context lost');await stopped();check('actual context loss fails visibly',true);
   await reset();await page.click('#start');await waitLog('worker.tfjs.load.complete');
   await page.goto('about:blank');check('navigation destroys worker',page.workers().length===0);
   report.lifecycle_requests=requests;
  }else report.logs=await page.locator('#diagnostic-log').inputValue();
  report.requests=requests;report.status='PASS';
 }catch(e){report.error=e.stack;if(page)report.failure_logs=await page.locator('#diagnostic-log').inputValue().catch(()=>null);}finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
 if(report.status!=='PASS')throw Error(report.error);console.log('PASS camera smoke');
})().catch(e=>{console.error(e);process.exitCode=1;});
