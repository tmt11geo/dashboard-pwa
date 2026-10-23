// UI uses a controlled inference double, real registration worker, real DOM/camera stream.
// Separate --real mode runs the actual TFJS graph on Open3D Redwood colour images.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
(async()=>{
 const root=path.resolve(__dirname,'../..'),fixtures=process.argv[2],real=process.argv.includes('--real'),report={mode:real?'actual TFJS + real sequence':'UI + inference double + real registration',checks:[],errors:[]};
 const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=pathname.startsWith('/fixtures/')?path.join(fixtures,pathname.slice(10)):path.join(root,pathname.replace(/^\/dashboard-pwa\//,''));
  fs.readFile(file,(err,b)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',/\.(js|mjs)$/.test(file)?'text/javascript':/\.html$/.test(file)?'text/html':/\.json$/.test(file)?'application/json':/\.css$/.test(file)?'text/css':'application/octet-stream');res.end(b);});
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 const check=(name,ok)=>{report.checks.push({name,pass:!!ok});console.log(ok?'PASS':'FAIL',name);if(!ok)throw Error(name);};
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.DEPTH_CHROMIUM,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  report.browser=browser.version();const page=await browser.newPage({viewport:{width:412,height:915},serviceWorkers:'block',acceptDownloads:true});
  page.on('pageerror',e=>report.errors.push(e.message));
  const url=`http://127.0.0.1:${server.address().port}/dashboard-pwa/depth.html`;
  if(real){
   const runtime=fs.readFileSync(path.join(fixtures,'tf.min.js'));
   report.runtime_sha256=crypto.createHash('sha256').update(runtime).digest('hex');
   if(report.runtime_sha256!=='300dfae273d20b4046f46a06d735688f03675a807561e9bcb5f664eb2f3d2831')throw Error('Wrong runtime');
   await page.route('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js',r=>r.fulfill({contentType:'text/javascript',body:runtime}));
   await page.goto(url);check('page initializes',report.errors.length===0);
   const result=await page.evaluate(async()=>{
    const {ScanMap}=await import('./depth-scan-core.js?v=1');const map=new ScanMap(),frames=[],logs=[];
    const worker=new Worker('./depth-tfjs-worker.js?v=2');
    const request=data=>new Promise((resolve,reject)=>{const deadline=setTimeout(()=>reject(Error('worker timeout')),90000);worker.onmessage=e=>{if(e.data.type==='diagnostic')logs.push(e.data);if(['ready','depth'].includes(e.data.type)){clearTimeout(deadline);resolve(e.data);}else if(e.data.type==='error'){clearTimeout(deadline);reject(Error(e.data.message));}};worker.postMessage(data);});
    await request({type:'init',backend:'tfjs-webgl'});
    for(let i=0;i<5;i++){
     const image=new Image();image.src=`/fixtures/redwood/color/${String(i).padStart(5,'0')}.jpg`;await image.decode();
     const canvas=document.createElement('canvas');canvas.width=canvas.height=224;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,28,224,168);const pixels=ctx.getImageData(0,0,224,224).data;
     const out=await request({type:'frame',id:i,width:224,height:224,content:{x:0,y:28,width:224,height:168},pixels:pixels.buffer,scan:true,capture:{orientation:0,timestamp:performance.now()}});
     const f={width:out.width,height:out.height,pixels:new Uint8ClampedArray(out.pixels),raw:new Float32Array(out.rawDepth),orientation:0};
     const registration=map.add(f);frames.push({index:i,inferenceMs:out.inferenceMs,registration,rawFinite:f.raw.every(Number.isFinite),rawRange:[Math.min(...f.raw),Math.max(...f.raw)],displayRange:[Math.min(...new Float32Array(out.depth)),Math.max(...new Float32Array(out.depth))]});
     // Make outputs reusable locally without rerunning expensive model inference.
     (window.realFrames??=[]).push({...f,raw:[...f.raw],pixels:[...f.pixels]});
    }
    worker.terminate();return {frames,logs,views:map.views,points:map.voxels.size};
   });Object.assign(report,result);
   fs.writeFileSync(path.join(fixtures,'model-frames.json'),JSON.stringify(await page.evaluate(()=>window.realFrames)));
   check('actual raw depth is finite and display is normalized',result.frames.every(f=>f.rawFinite&&f.rawRange[1]>1&&f.displayRange[0]===0&&f.displayRange[1]===1));
   check('actual WebGL backend, no CPU forwarding',result.logs.some(l=>l.event==='tfjs.identity'&&l.details.backend==='webgl'&&l.details.cpuForward===false));
   check('real sequence accumulates more than one accepted view',result.views>1);
  }else{
   await page.addInitScript(()=>{
    window.frameIndex=0;window.streams=[];window.fakeWorkers=[];window.modelDelay=60;
    const NativeWorker=window.Worker;
    window.Worker=class{constructor(url,options){if(!String(url).includes('depth-tfjs-worker'))return new NativeWorker(url,options);window.fakeWorkers.push(this);}
     postMessage(data){if(data.type==='init'){setTimeout(()=>this.onmessage?.({data:{type:'ready',backend:'tfjs-webgl',precision:'FP32',modelBytes:97817343}}),100);return;}
      const f=window.fixtures[window.frameIndex],raw=Float32Array.from(f.raw),pixels=Uint8ClampedArray.from(f.pixels),lo=Math.min(...raw),hi=Math.max(...raw),depth=raw.map(v=>(v-lo)/(hi-lo));
      setTimeout(()=>{if(!this.ended)this.onmessage?.({data:{type:'depth',id:data.id,width:f.width,height:f.height,depth:depth.buffer,rawDepth:raw.buffer,pixels:pixels.buffer,capture:data.capture,inferenceMs:60}});},window.modelDelay);}
     terminate(){this.ended=true;}
    };
    navigator.mediaDevices.getUserMedia=async()=>{
     window.fixtures??=await (await fetch('/fixtures/rendered.json')).json();
     const canvas=document.createElement('canvas');canvas.width=168;canvas.height=224;const ctx=canvas.getContext('2d');
     const draw=()=>{const f=fixtures[frameIndex];ctx.putImageData(new ImageData(Uint8ClampedArray.from(f.pixels),168,224),0,0);};draw();const timer=setInterval(draw,100),stream=canvas.captureStream(10);
     for(const t of stream.getTracks()){const stop=t.stop.bind(t);t.stop=()=>{clearInterval(timer);stop();};}streams.push(stream);return stream;
    };
   });
   await page.goto(url);check('page initializes',report.errors.length===0);
   await page.click('#scan-start');await page.waitForFunction(()=>document.querySelector('#scan-count').textContent.startsWith('1 accepted'),{},{timeout:20000});
   check('first view added and shown in relief',(await page.locator('#result-title').textContent()).includes('Scan relief'));
   check('accepted view gives move flash',await page.evaluate(()=>document.querySelector('#scan-workspace').classList.contains('move-flash')&&document.querySelector('#scan-guide').textContent.includes('MOVE NOW')));
   check('phone views stay beside each other with nearby controls',await page.evaluate(()=>{
    const cards=[...document.querySelectorAll('.scan-panel .depth-card')].map(e=>e.getBoundingClientRect()), controls=document.querySelector('.scan-command').getBoundingClientRect();
    return cards.length===2&&Math.abs(cards[0].top-cards[1].top)<2&&cards[0].top-controls.bottom<20&&document.documentElement.scrollWidth<=innerWidth;
   }));
   await page.emulateMedia({reducedMotion:'reduce'});
   check('reduced motion suppresses pulse',await page.locator('.image-frame').first().evaluate(e=>getComputedStyle(e,'::after').animationName==='none'));
   await page.emulateMedia({reducedMotion:'no-preference'});
   await page.screenshot({path:path.join(fixtures,'scan-phone.png'),fullPage:true});
   await page.evaluate(()=>frameIndex=1);await page.waitForFunction(()=>document.querySelector('#scan-count').textContent.startsWith('2 accepted'),{},{timeout:20000});
   check('moved view extends persistent scene',true);
   await page.click('#scan-pause');const paused=await page.locator('#scan-count').textContent();await page.evaluate(()=>frameIndex=2);await page.waitForTimeout(3000);
   check('pause clears flash',await page.evaluate(()=>!document.querySelector('#scan-workspace').classList.contains('move-flash')));
   check('pause prevents another capture',paused===await page.locator('#scan-count').textContent());
   await page.click('#scan-pause');await page.waitForFunction(()=>document.querySelector('#scan-count').textContent.startsWith('3 accepted'),{},{timeout:20000});
   check('resume adds another view',true);
   await page.click('#scan-finish');check('finish releases camera and model',await page.evaluate(()=>streams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))&&fakeWorkers.every(w=>w.ended)));
   const count=await page.locator('#scan-count').textContent();
   const download=page.waitForEvent('download');await page.click('#scan-save');const dl=await download;const saved=path.join(fixtures,'saved-relief.json');await dl.saveAs(saved);
   check('saved scene has all accepted views',JSON.parse(fs.readFileSync(saved)).views===3);
   await page.click('#scan-clear');check('clear removes the map',(await page.locator('#scan-count').textContent()).startsWith('No accepted'));
   await page.locator('#scan-file').setInputFiles(saved);await page.waitForFunction(()=>document.querySelector('#scan-count').textContent.startsWith('3 accepted'));
   check('open restores exact saved scene count',count===await page.locator('#scan-count').textContent());
   await page.reload();await page.locator('#scan-file').setInputFiles(saved);await page.waitForFunction(()=>document.querySelector('#scan-count').textContent.startsWith('3 accepted'));check('file survives page reload',true);
   await page.click('#scan-clear');await page.click('#scan-start');await page.waitForFunction(()=>document.querySelector('#scan-count').textContent.startsWith('1 accepted'),{},{timeout:20000});
   await page.evaluate(()=>{frameIndex=1;modelDelay=4000;});await page.waitForFunction(()=>document.querySelector('#scan-guide').textContent.includes('CAPTURING'),{},{timeout:15000});
   await page.click('#scan-pause');
   check('paused capture does not invite movement',(await page.locator('#scan-guide').textContent()).includes('PAUSED'));
   await page.click('#scan-pause');
   check('resumed pending capture still says wait',(await page.locator('#scan-guide').textContent()).includes('wait for green'));
   await page.click('#scan-finish');await page.waitForTimeout(4500);check('finish ignores late capture',(await page.locator('#scan-count').textContent()).startsWith('1 accepted'));
   check('all browser workers released',page.workers().length===0);
   check('no page errors',report.errors.length===0);
  }
  report.status='PASS';
 }catch(e){report.status='FAIL';report.error=e.stack;console.error(e);}finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));fs.writeFileSync(path.join(root,'tools/depth-scan/evidence',real?'real-sequence.json':'browser-ui-v6.json'),JSON.stringify(report,null,2)+'\n');}
 if(report.status!=='PASS')process.exitCode=1;
})();
