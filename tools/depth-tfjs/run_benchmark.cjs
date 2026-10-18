/* Local stage 5 harness. No deployment or camera. */
const {chromium} = require('playwright');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), crypto = require('node:crypto');
async function main() {
  const [directory, tfjsFile, output] = process.argv.slice(2);
  if (!output) throw Error('Usage: node run_benchmark.cjs PREPARED_DIR TFJS_JS REPORT_JSON');
  const root = path.resolve(directory), ui = path.join(__dirname, 'benchmark');
  const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const prepared = JSON.parse(fs.readFileSync(path.join(root, 'prepared.json')));
  for (const [name, f] of Object.entries(prepared.model_files)) {
    const file = path.join(root, 'graph-model', name);
    if (hash(file) !== f.sha256 || fs.statSync(file).size !== f.bytes) throw Error('Model integrity failed: ' + name);
  }
  const input = prepared.fixtures.find(f => f.name === 'demo01').files.input;
  if (hash(path.join(root,input.path)) !== input.sha256) throw Error('Input integrity failure');
  if (hash(tfjsFile) !== '300dfae273d20b4046f46a06d735688f03675a807561e9bcb5f664eb2f3d2831') throw Error('Unexpected TFJS bundle');
  let delayModel = false;
  const server = http.createServer((req,res) => {
    const name = decodeURIComponent(req.url.split('?')[0]);
    const uiName = name === '/' ? 'index.html' : name.slice(1);
    const file = name === '/tf.js' ? path.resolve(tfjsFile) : ['index.html','controller.js','worker.js'].includes(uiName) ? path.join(ui,uiName) : path.resolve(root, '.' + name);
    if (name !== '/tf.js' && !file.startsWith(root + path.sep) && !file.startsWith(ui + path.sep)) {res.writeHead(403).end();return;}
    const send = () => fs.readFile(file,(err,bytes) => {if(res.destroyed) return; if(err)res.writeHead(404).end();else {res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.html') ? 'text/html' : 'application/octet-stream');res.end(bytes);}});
    if (delayModel && name === '/graph-model/model.json') setTimeout(send,1500); else send();
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const report = {stage:5,status:'FAIL',utc:new Date().toISOString(), fixture:'demo01',input,model_files:prepared.model_files,
    tfjs_sha256:hash(tfjsFile), scripts:Object.fromEntries(['run_benchmark.cjs','benchmark/controller.js','benchmark/worker.js','benchmark/index.html'].map(n=>[n,hash(path.join(__dirname,n))])),runs:[],checks:[]};
  let browser;
  try {
    browser = await chromium.launch({headless:true,executablePath:process.env.DEPTH_CHROMIUM || undefined,
      args:['--no-sandbox','--no-zygote','--single-process','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    report.browser = browser.version();
    const page = await browser.newPage();
    page.on('console',m=>console.log(m.type(),m.text()));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    async function waitDone() {await page.waitForFunction(()=>window.depthBenchmark.report !== null,{},{timeout:250000});return page.evaluate(()=>window.depthBenchmark.report);}
    function check(name,pass) {report.checks.push({name,pass});if(!pass)throw Error(name);console.log('PASS',name);}
    await page.click('#run');
    let first = await waitDone(); report.runs.push(first);
    check('actual graph first + three same-image warm runs',first.status==='PASS' && first.samples.length===4 && first.live_resources_released && first.context_lost && first.backend_removed);
    // Forced 404 verifies failure retention and re-enabled controls.
    await page.evaluate(()=>window.depthBenchmark.start({modelUrl:'/missing-model.json'}));
    const failure=await waitDone(); report.failure=failure;
    check('failure retained and controls restored',failure.status==='FAIL' && await page.locator('#run').isEnabled() && (await page.locator('#logs').inputValue()).includes('failure'));
    delayModel=true;
    await page.click('#run');
    await page.waitForFunction(()=>window.depthBenchmark.phase==='loading');
    await page.click('#cancel');
    const cancelled=await waitDone(); report.cancel_loading=cancelled;
    check('cancel during loading',cancelled.status==='CANCELLED' && cancelled.phase==='loading');
    delayModel=false;
    await page.click('#run');
    await page.waitForFunction(()=>window.depthBenchmark.phase==='first-inference',{},{timeout:30000});
    await page.waitForTimeout(100);
    await page.click('#cancel');
    report.cancel_inference=await waitDone();
    check('cancel during inference',report.cancel_inference.status==='CANCELLED' && report.cancel_inference.phase==='first-inference');
    // Exercise the automatic timeout through the same termination path.
    delayModel=true;
    await page.evaluate(()=>window.depthBenchmark.start({deadlineMs:250}));
    report.timeout=await waitDone();
    check('bounded timeout',report.timeout.status==='TIMEOUT'); delayModel=false;
    await page.click('#run');
    let restart=await waitDone();report.runs.push(restart);
    check('restart after failure/cancel/timeout',restart.status==='PASS' && restart.live_resources_released && restart.context_lost && restart.backend_removed);
    report.events=await page.evaluate(()=>window.depthBenchmark.events);
    check('copyable logs retained across runs',(await page.locator('#logs').inputValue()).includes('CANCELLED') || report.events.some(e=>e.type==='cancel'));
    report.status='PASS';
  } catch(error) {report.error=error.stack;}
  finally {
    if(browser)await browser.close();
    server.closeAllConnections(); await new Promise(resolve=>server.close(resolve));
    fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
  }
  if(report.status!=='PASS')throw Error('Benchmark failed: '+output);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
