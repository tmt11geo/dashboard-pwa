/* Numerical validation only: no camera, timing benchmark or deployment. */
const {chromium} = require('playwright');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const crypto = require('node:crypto');

async function main() {
  const [directory, tfjsFile, output] = process.argv.slice(2);
  if (!directory || !tfjsFile || !output) throw Error('Usage: node validate_graph.cjs PREPARED_DIR TFJS_4_22_MIN_JS REPORT_JSON');
  const root = path.resolve(directory);
  const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const prepared = JSON.parse(fs.readFileSync(path.join(root, 'prepared.json')));
  for (const row of prepared.fixtures) for (const file of Object.values(row.files)) {
    const p = path.join(root, file.path);
    if (hash(p) !== file.sha256 || fs.statSync(p).size !== file.bytes) throw Error('Tensor integrity failure');
  }
  for (const [name, f] of Object.entries(prepared.model_files)) {
    const p = path.join(root, 'graph-model', name);
    if (hash(p) !== f.sha256 || fs.statSync(p).size !== f.bytes) throw Error('Model integrity failure');
  }
  const server = http.createServer((req, res) => {
    const file = req.url === '/tf.js' ? path.resolve(tfjsFile) : path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
    if (req.url === '/') {res.end('<!doctype html><script src="/tf.js"></script>'); return;}
    if (req.url !== '/tf.js' && !file.startsWith(root + path.sep)) {res.writeHead(403).end(); return;}
    fs.readFile(file, (err, data) => {if (err) res.writeHead(404).end(); else res.end(data);});
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser, deadline;
  let report = {stage: 4, status: 'FAIL', prepared, tfjs_bundle_sha256: hash(tfjsFile), runner_sha256: hash(__filename)};
  try {
    browser = await chromium.launch({headless: true, executablePath: process.env.DEPTH_CHROMIUM || undefined,
      args: ['--no-sandbox', '--no-zygote', '--single-process', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
    deadline = setTimeout(() => browser.close().catch(() => {}), 240000);
    const page = await browser.newPage();
    page.on('console', m => console.log(m.type(), m.text()));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    report.browser = browser.version();
    const result = await page.evaluate(async rows => {
      if (tf.version.tfjs !== '4.22.0') throw Error('Require TFJS 4.22.0');
      tf.env().set('WEBGL_CPU_FORWARD', false);
      if (!await tf.setBackend('webgl')) throw Error('WebGL unavailable');
      await tf.ready();
      if (tf.getBackend() !== 'webgl' || tf.env().get('WEBGL_CPU_FORWARD') !== false) throw Error('Incorrect backend');
      const gl = tf.backend().gpgpu.gl;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const identity = {backend: tf.getBackend(), cpu_forward: tf.env().get('WEBGL_CPU_FORWARD'),
        version: gl.getParameter(gl.VERSION), renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        tfjs: tf.version.tfjs, userAgent: navigator.userAgent};
      const model = await tf.loadGraphModel('/graph-model/model.json');
      const get = async name => new Float32Array(await (await fetch('/' + name)).arrayBuffer());
      function compare(a, b, range) {
        if (a.length !== 224 * 224 || b.length !== a.length) throw Error('Output element count mismatch');
        let sum = 0, max = 0;
        for (let i = 0; i < a.length; ++i) {
          if (!Number.isFinite(a[i]) || !Number.isFinite(b[i])) throw Error('Non-finite output');
          const d = Math.abs(a[i] - b[i]); sum += d; max = Math.max(max, d);
        }
        return {mae: sum/a.length, max_abs_error: max, mae_source_range: sum/a.length/range};
      }
      const thresholds = {max_abs_error: 1e-3, mae_source_range: 1e-4};
      const results = [];
      try {
        for (const row of rows) {
          const original = await get(row.files.original.path), rewritten = await get(row.files.rewritten.path);
          const sourceRange = [Math.min(...original), Math.max(...original)];
          const range = sourceRange[1] - sourceRange[0];
          if (!(range > 1e-6)) throw Error('Degenerate source range');
          const input = tf.tensor(await get(row.files.input.path), [1,224,224,3], 'float32');
          let output;
          try {
            output = await model.executeAsync(input);
            if (Array.isArray(output) || output.dtype !== 'float32' || output.shape.join() !== '1,224,224,1') throw Error('Unexpected output signature');
            const values = await output.data();
            const comparisons = {rewrite_vs_original: compare(original, rewritten, range),
              tfjs_vs_rewritten: compare(rewritten, values, range), tfjs_vs_original: compare(original, values, range)};
            const pass = Object.values(comparisons).every(c => c.max_abs_error <= thresholds.max_abs_error && c.mae_source_range <= thresholds.mae_source_range);
            results.push({fixture: row.name, shape: output.shape, finite: true, source_range: sourceRange,
              rewritten_range: [Math.min(...rewritten), Math.max(...rewritten)], tfjs_range: [Math.min(...values), Math.max(...values)], comparisons, pass});
            console.log(row.name + ': ' + (pass ? 'PASS' : 'FAIL'));
          } finally {input.dispose(); if (output) tf.dispose(output);}
        }
      } finally {model.dispose();}
      return {identity, thresholds, results, pass: results.length >= 3 && results.every(r => r.pass)};
    }, prepared.fixtures);
    Object.assign(report, result, {status: result.pass ? 'PASS' : 'FAIL'});
  } catch (e) {report.error = e.stack;} finally {
    clearTimeout(deadline);
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
    fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  }
  if (report.status !== 'PASS') throw Error('Validation failed; inspect ' + output);
}
main().catch(e => {console.error(e); process.exitCode = 1;});
