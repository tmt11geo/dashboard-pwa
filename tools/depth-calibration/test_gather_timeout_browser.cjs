// Private session input; only numeric diagnostics are written to evidence.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http');
(async()=>{
 const root=path.resolve(__dirname,'../..'),report={checks:[],errors:[]};
 const server=http.createServer((req,res)=>{const file=path.join(root,new URL(req.url,'http://localhost').pathname.replace(/^\/dashboard-pwa\//,''));fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',/\.js$/.test(file)?'text/javascript':/\.html$/.test(file)?'text/html':'application/octet-stream');res.end(b);});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 const check=(name,pass)=>{report.checks.push({name,pass:!!pass});console.log(pass?'PASS':'FAIL',name);if(!pass)throw Error(name);};
 try{
  browser=await chromium.launch({executablePath:'/tmp/depth-browser/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({serviceWorkers:'block',acceptDownloads:true});page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/dashboard-pwa/scan.html`);
  await page.setInputFiles('#session-file',process.argv[2]);await page.waitForFunction(()=>document.querySelector('#scan-count').textContent.startsWith('12 /'));
  const start=Date.now();await page.click('#session-stitch');await page.waitForFunction(()=>!document.querySelector('#session-relief').disabled,{},{timeout:180000});report.replayMs=Date.now()-start;
  check('actual twelve-view replay completes',await page.locator('#session-results li').count()===12);
  check('actual replay preserves accepted views 4 and 5',await page.locator('#session-results li').evaluateAll(xs=>xs.filter(x=>/anchor|: placed$/.test(x.textContent)).map(x=>x.textContent.split(':')[0]).join(','))==='View 4,View 5');
  check('pair progress is logged',(await page.locator('#diagnostic-log').inputValue()).includes('session.progress'));
  await page.click('#session-relief');await page.waitForFunction(()=>!document.querySelector('#scan-save').disabled);
  check('actual replay builds two-view relief',(await page.locator('#scan-guide').innerText()).includes('2 views in relief'));
  await page.close();
  // Accelerated 3-minute idle deadline: 300ms. A 900ms job must survive
  // while making progress; a silent worker must still stop and export evidence.
  for(const mode of ['progress','stall','cancel']){
   const p=await browser.newPage({serviceWorkers:'block',acceptDownloads:true});p.on('pageerror',e=>report.errors.push(e.message));
   await p.addInitScript(mode=>{
    const nativeTimeout=window.setTimeout.bind(window);window.setTimeout=(fn,ms,...args)=>nativeTimeout(fn,ms===180000?300:ms,...args);
    const NativeWorker=Worker;window.Worker=class{
     constructor(url,opts){if(!String(url).includes('scan-session-worker'))return new NativeWorker(url,opts);this.timers=[];window.testWorker=this;}
     postMessage(){if(mode==='stall')return;for(let i=1;i<=8;i++)this.timers.push(nativeTimeout(()=>this.onmessage?.({data:{type:'progress',stage:'pair',reference:0,index:1,total:12,placed:1}}),i*100));this.timers.push(nativeTimeout(()=>this.onmessage?.({data:{type:'stitched',placed:1,results:Array.from({length:12},(_,index)=>({index,ok:index===0,anchor:index===0}))}}),900));}
     terminate(){this.timers.forEach(clearTimeout);window.workerTerminated=true;}
    };
   },mode);
   await p.goto(`http://127.0.0.1:${server.address().port}/dashboard-pwa/scan.html`);
   await p.setInputFiles('#session-file',process.argv[2]);await p.waitForFunction(()=>document.querySelector('#scan-count').textContent.startsWith('12 /'));
   await p.click('#session-stitch');
   if(mode==='progress'){
    await p.waitForFunction(()=>!document.querySelector('#session-relief').disabled);
    check('progressing job survives three total timeout intervals',!(await p.locator('#scan-guide').innerText()).includes('No stitching progress'));
   }else if(mode==='stall'){
    await p.waitForFunction(()=>document.querySelector('#scan-guide').textContent.includes('No stitching progress'));
    check('silent worker terminates and retains 12 captures',await p.evaluate(()=>workerTerminated&&document.querySelector('#scan-count').textContent.startsWith('12 /')));
    const download=p.waitForEvent('download');await p.click('#session-save');const file=await(await download).path();const saved=JSON.parse(fs.readFileSync(file));
    check('timeout export contains processing diagnostics and all frames',saved.frames.length===12&&saved.processing.status==='stalled'&&saved.processing.elapsedMs>=300);
    check('stitch retry enabled after idle timeout',await p.locator('#session-stitch').isEnabled());
   }else{
    await p.click('#session-cancel');await p.waitForTimeout(1000);
    check('cancel prevents late worker completion',await p.locator('#session-relief').isDisabled()&&(await p.locator('#scan-guide').innerText()).includes('cancelled'));
   }
   await p.close();
  }
  check('no uncaught browser errors',report.errors.length===0);
 }finally{if(browser)await browser.close();server.close();fs.writeFileSync(path.join(root,'tools/depth-calibration/evidence/gather-timeout-browser.json'),JSON.stringify(report,null,2)+'\n');}
})().catch(e=>{console.error(e);process.exitCode=1;});
