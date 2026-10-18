// Stage 6AE: load the checked-out package over HTTP in the proven worker benchmark.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
(async()=>{
 const [tfFile,fixtureDir,output]=process.argv.slice(2);
 if(!output)throw Error('Usage: node run_package_load.cjs TFJS_JS PREPARED_FIXTURES OUTPUT_JSON');
 const root=path.resolve(__dirname,'../..'),base='/models/depth-anything-v2-small-tfjs-fp32-224-v1/';
 const inv=JSON.parse(fs.readFileSync(path.join(__dirname,'evidence/package-inventory.json')));
 const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
 for(const f of inv.files){const b=fs.readFileSync(path.join(root,inv.destination,f.name));if(b.length!==f.bytes||hash(b)!==f.sha256)throw Error('Asset mismatch: '+f.name);}
 if(hash(fs.readFileSync(tfFile))!=='300dfae273d20b4046f46a06d735688f03675a807561e9bcb5f664eb2f3d2831')throw Error('Runtime mismatch');
 const prep=JSON.parse(fs.readFileSync(path.join(fixtureDir,'prepared.json'))),input=prep.fixtures.find(x=>x.name==='demo01').files.input;
 if(hash(fs.readFileSync(path.join(fixtureDir,input.path)))!==input.sha256)throw Error('Fixture mismatch');
 const requests=[];
 const server=http.createServer((req,res)=>{
  const n=new URL(req.url,'http://localhost').pathname;
  let f=n==='/tf.js'?tfFile:n==='/demo01-input.bin'?path.join(fixtureDir,input.path):n.startsWith(base)?path.join(root,n):path.join(__dirname,'benchmark',n==='/'?'index.html':n);
  fs.readFile(f,(err,b)=>{if(err){res.writeHead(404).end();return;}if(n.startsWith(base))requests.push({path:n,bytes:b.length,sha256:hash(b)});res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.html')?'text/html':f.endsWith('.json')?'application/json':'application/octet-stream');res.end(b);});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const report={stage:'6AE',status:'FAIL',utc:new Date().toISOString(),model_files:inv.files,fixture:input,requests,scope:'Exact branch package served on loopback HTTP; SwiftShader compatibility only; live Pages deferred to stage 9'};
 let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.DEPTH_CHROMIUM,args:['--no-sandbox','--no-zygote','--single-process','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  report.browser=browser.version();const page=await browser.newPage();
  page.on('console',m=>console.log(m.type(),m.text()));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(url=>window.depthBenchmark.start({modelUrl:url}),base+'model.json');
  await page.waitForFunction(()=>window.depthBenchmark.report!==null,{},{timeout:250000});
  report.run=await page.evaluate(()=>window.depthBenchmark.report);
  report.events=await page.evaluate(()=>window.depthBenchmark.events);
  const r=report.run;
  if(r.status!=='PASS'||!r.live_resources_released||!r.context_lost||!r.backend_removed)throw Error('Load/inference/cleanup failed');
  if(new Set(requests.map(r=>r.path)).size!==25)throw Error('Incomplete asset requests');
  report.status='PASS';
 }catch(e){report.error=e.stack;}
 finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
 console.log(report.status,report.run?.environment,report.run?.timings);
 if(report.status!=='PASS')process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
