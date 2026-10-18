// Actual app and actual TFJS worker; synthetic camera uses a pinned local scene.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
(async()=>{
 const [tfFile,fixtureFile,output]=process.argv.slice(2);
 if(!output)throw Error('Usage: node run_camera_smoke.cjs TFJS_JS FIXTURE_JPG REPORT');
 const root=path.resolve(__dirname,'../..'),tf=fs.readFileSync(tfFile),fixture=fs.readFileSync(fixtureFile),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
 if(hash(tf)!=='300dfae273d20b4046f46a06d735688f03675a807561e9bcb5f664eb2f3d2831')throw Error('Runtime hash mismatch');
 const requests=[],report={stage:7,status:'FAIL',utc:new Date().toISOString(),checks:[],fixture_sha256:hash(fixture),runtime_sha256:hash(tf),scope:'Actual Depth Lab and TFJS worker on loopback, synthetic camera from local fixture; SwiftShader, not physical camera or phone'};
 const server=http.createServer((req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname;
  if(req.method!=='GET'){res.writeHead(405).end();return;}
  const file=path.resolve(root,'.'+name);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  const send=b=>{requests.push({path:name,bytes:b.length});res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':name==='/fixture.jpg'?'image/jpeg':'application/octet-stream');res.end(b);};
  if(name==='/fixture.jpg')send(fixture);else fs.readFile(file,(err,b)=>err?res.writeHead(404).end():send(b));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.DEPTH_CHROMIUM,args:['--no-sandbox','--no-zygote','--single-process','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  report.browser=browser.version();const page=await browser.newPage({serviceWorkers:'block'});
  await page.route('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js',route=>route.fulfill({contentType:'text/javascript',body:tf}));
  await page.addInitScript(()=>{
   window.testStreams=[];window.testCanvases=[];
   navigator.mediaDevices.getUserMedia=async()=>{
    const image=new Image();image.src='/fixture.jpg';await image.decode();
    const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;
    const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,640,480);
    const stream=canvas.captureStream(10),timer=setInterval(()=>ctx.drawImage(image,0,0,640,480),100);
    for(const track of stream.getTracks()){const stop=track.stop.bind(track);track.stop=()=>{clearInterval(timer);stop();};}
    window.testStreams.push(stream);window.testCanvases.push(canvas);return stream;
   };
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/depth.html`);
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
  report.logs=await page.locator('#diagnostic-log').inputValue();report.requests=requests;report.status='PASS';
 }catch(e){report.error=e.stack;}finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
 if(report.status!=='PASS')throw Error(report.error);console.log('PASS camera smoke');
})().catch(e=>{console.error(e);process.exitCode=1;});
