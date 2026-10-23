const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
(async()=>{
 const root=path.resolve(__dirname,'../..'),fixtures='/tmp/calibration-fixtures',report={mode:'Actual bundled OpenCV worker; rendered checkerboards; simulated camera only',checks:[],errors:[]};
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');const name=url.pathname.startsWith('/fixtures/')?path.join(fixtures,url.pathname.slice(10)):path.join(root,url.pathname.replace(/^\/dashboard-pwa\//,''));fs.readFile(name,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',/\.js$/.test(name)?'text/javascript':/\.html$/.test(name)?'text/html':/\.css$/.test(name)?'text/css':/\.json$/.test(name)?'application/json':/\.svg$/.test(name)?'image/svg+xml':/\.png$/.test(name)?'image/png':'application/octet-stream');res.end(b);});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 const check=(name,pass)=>{report.checks.push({name,pass:!!pass});console.log(pass?'PASS':'FAIL',name);if(!pass)throw Error(name);};
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.DEPTH_CHROMIUM||'/tmp/depth-browser/chrome-linux/headless_shell',args:['--no-sandbox']});report.browser=browser.version();const page=await browser.newPage({viewport:{width:412,height:915},acceptDownloads:true});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  const requests=[];page.on('request',r=>requests.push(r.url()));
  await page.addInitScript(()=>{
   window.streams=[];let canvas,current;
   window.setFixture=async i=>{const image=new Image();image.src='/fixtures/'+String(i).padStart(2,'0')+'.png';await image.decode();current=image;if(canvas)canvas.getContext('2d').drawImage(current,0,0);};
   navigator.mediaDevices.getUserMedia=async()=>{canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;if(!current)await window.setFixture(0);canvas.getContext('2d').drawImage(current,0,0);const stream=canvas.captureStream(15),t=stream.getVideoTracks()[0];t.getSettings=()=>({width:640,height:480,frameRate:15,deviceId:'fixture-camera',facingMode:'environment',focusMode:'manual',focusDistance:1,zoom:window.testZoom||1});t.getCapabilities=()=>({focusMode:['manual'],zoom:{min:1,max:1}});t.applyConstraints=async()=>{};window.streams.push(stream);return stream;};
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/dashboard-pwa/calibration.html?v=1`);check('relative page opens',await page.title()==='Camera calibration · Tactical');
  check('no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.click('#start');await page.waitForFunction(()=>!document.querySelector('#capture').disabled,{},{timeout:90000});check('actual worker/runtime ready',true);
  async function capture(i){await page.evaluate(i=>window.setFixture(i),i);await page.click('#capture');await page.waitForFunction(()=>!document.querySelector('#capture').disabled,{},{timeout:30000});return page.locator('#status').innerText();}
  console.log(await capture(0));check('first board accepted',(await page.locator('#count').innerText()).startsWith('1 /'));
  console.log(await capture(0));check('duplicate rejected',(await page.locator('#count').innerText()).startsWith('1 /'));
  for(let i=1;i<24&&!((await page.locator('#count').innerText()).startsWith('16 /'));i++){console.log(i,await capture(i));}
  check('16 actual boards detected',(await page.locator('#count').innerText()).startsWith('16 /'));
  await page.screenshot({path:path.join(root,'tools/depth-calibration/evidence/capture-mobile.png'),fullPage:true});
  await page.setViewportSize({width:915,height:412});await page.evaluate(()=>scrollTo(0,0));
  check('landscape capture controls and whole preview visible',await page.evaluate(()=>{const p=document.querySelector('.preview').getBoundingClientRect(),c=document.querySelector('#capture').getBoundingClientRect();return p.bottom<=innerHeight&&p.top>=0&&c.bottom<=innerHeight&&c.top>=0;}));
  await page.screenshot({path:path.join(root,'tools/depth-calibration/evidence/capture-landscape.png'),fullPage:true});await page.setViewportSize({width:412,height:915});
  await page.click('#validate');await page.waitForFunction(()=>!document.querySelector('#validate').disabled,{},{timeout:60000});report.resultText=await page.locator('#result').innerText();console.log(report.resultText);
  check('independent calibration validation passes',(await page.locator('#result').getAttribute('class'))==='pass');
  const downloadPromise=page.waitForEvent('download');await page.click('#save');const download=await downloadPromise;await download.saveAs('/tmp/calibration-fixtures/session.json');const bundle=JSON.parse(fs.readFileSync('/tmp/calibration-fixtures/session.json','utf8'));report.calibration=bundle.calibration;
  check('export includes raw images/corners and geometry',bundle.observations.length===16&&bundle.observations.every(v=>v.points.length===126&&v.image.startsWith('data:image/png;base64,'))&&bundle.metadata.geometry.outputWidth===640&&bundle.metadata.focusLock.locked);
  check('known camera focal recovered',Math.abs(bundle.calibration.cameraMatrix[0]-500)<10&&Math.abs(bundle.calibration.cameraMatrix[4]-500)<10);
  await page.click('#undo');await page.waitForFunction(()=>document.querySelector('#count').textContent.startsWith('15 /'));check('undo removes view and invalidates result',(await page.locator('#count').innerText()).startsWith('15 /')&&await page.locator('#result').isHidden());
  await page.click('#stop');check('stop releases camera',await page.evaluate(()=>window.streams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))));check('partial export remains available',!await page.locator('#save').isDisabled());
  check('no external runtime/data requests',requests.every(u=>u.startsWith('http://127.0.0.1:')||u.startsWith('blob:')));
  page.on('dialog',d=>d.accept());await page.click('#clear');check('clear permits a fresh session',!await page.locator('#start').isDisabled());
  await page.click('#start');await page.waitForFunction(()=>!document.querySelector('#capture').disabled,{},{timeout:90000});
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});check('hidden page stops camera',await page.evaluate(()=>window.streams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))));
  check('no uncaught page errors',report.errors.length===0);
  const base=`http://127.0.0.1:${server.address().port}/dashboard-pwa/calibration.html`;
  const denied=await browser.newPage();await denied.addInitScript(()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('Permission denied','NotAllowedError');};});await denied.goto(base);await denied.click('#start');await denied.waitForFunction(()=>document.querySelector('#status').textContent.includes('Could not start'));check('permission denial restores start',!await denied.locator('#start').isDisabled());await denied.close();
  await page.reload();await page.evaluate(()=>{const original=navigator.mediaDevices.getUserMedia;navigator.mediaDevices.getUserMedia=async()=>{await new Promise(r=>window.releasePermission=r);return original();};});await page.click('#start');await page.waitForFunction(()=>typeof window.releasePermission==='function');await page.click('#stop');await page.evaluate(()=>window.releasePermission());await page.waitForFunction(()=>window.streams.length>0&&window.streams.every(s=>s.getTracks().every(t=>t.readyState==='ended')));check('late camera permission result is stopped',true);
  await page.reload();await page.route('**/vendor/calibration-opencv/part-00.bin',route=>route.fulfill({status:404,body:'missing'}));await page.click('#start');await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Could not start'),{},{timeout:30000});check('runtime download failure releases camera',await page.evaluate(()=>window.streams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))));await page.unroute('**/vendor/calibration-opencv/part-00.bin');
  await page.reload();await page.click('#start');await page.waitForFunction(()=>!document.querySelector('#capture').disabled,{},{timeout:90000});await page.evaluate(()=>window.testZoom=2);await page.click('#capture');await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('geometry'));check('changed zoom rejects capture and stops camera',(await page.locator('#count').innerText()).startsWith('0 /')&&await page.evaluate(()=>window.streams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))));

 }catch(e){report.failure=e.message;process.exitCode=1;console.error(e);}finally{fs.writeFileSync(path.join(root,'tools/depth-calibration/evidence/browser.json'),JSON.stringify(report,null,2));await browser?.close();server.close();}
})();
