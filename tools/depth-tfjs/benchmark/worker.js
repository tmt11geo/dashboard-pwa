'use strict';
const emit = (type, values = {}) => postMessage({type, ...values});
const phase = name => emit('phase', {phase: name});
const snapshot = () => JSON.parse(JSON.stringify(tf.memory()));
onmessage = async ({data}) => {
  let model, input, gl;
  const report = {stage: 5, status: 'FAIL', timings: {}, memory: {}, samples: [],
    timing_scope: 'performance.now wall ms; executeAsync plus complete output.data readback; input creation excluded',
    environment: {userAgent: navigator.userAgent, worker: true, offscreenCanvas: typeof OffscreenCanvas !== 'undefined'}};
  try {
    phase('runtime');
    importScripts('/tf.js');
    if (tf.version.tfjs !== '4.22.0') throw Error('TFJS 4.22.0 required');
    tf.env().set('WEBGL_CPU_FORWARD', false);
    if (!await tf.setBackend('webgl')) throw Error('WebGL backend unavailable in worker');
    await tf.ready();
    if (tf.getBackend() !== 'webgl' || tf.env().get('WEBGL_CPU_FORWARD') !== false) throw Error('Incorrect backend');
    gl = tf.backend().gpgpu.gl;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    report.environment = {...report.environment, tfjs: tf.version.tfjs, backend: tf.getBackend(),
      cpu_forward: tf.env().get('WEBGL_CPU_FORWARD'), webgl: gl.getParameter(gl.VERSION),
      renderer: gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER)};
    emit('identity', report.environment);
    report.memory.before_load = snapshot();
    phase('loading');
    const loadStart = performance.now();
    model = await tf.loadGraphModel(data.modelUrl);
    report.timings.model_load_ms = performance.now() - loadStart;
    const buffer = await (await fetch(`/${data.fixture}-input.bin`)).arrayBuffer();
    if (buffer.byteLength !== 1 * 224 * 224 * 3 * 4) throw Error('Unexpected input bytes');
    input = tf.tensor(new Float32Array(buffer), [1,224,224,3], 'float32');
    report.memory.loaded = snapshot();
    for (let i = 0; i < 4; ++i) {
      phase(i === 0 ? 'first-inference' : `warm-${i}`);
      let output;
      try {
        const start = performance.now();
        output = await model.executeAsync(input);
        if (Array.isArray(output) || output.shape.join() !== '1,224,224,1') throw Error('Unexpected output shape');
        const values = await output.data();
        const elapsed = performance.now() - start;
        let min = Infinity, max = -Infinity;
        for (const v of values) {if (!Number.isFinite(v)) throw Error('Nonfinite output'); min = Math.min(min,v); max = Math.max(max,v);}
        if (tf.getBackend() !== 'webgl') throw Error('Backend changed');
        const sample = {kind: i === 0 ? 'first' : 'warm', index: i, elapsed_ms: elapsed, output_range: [min,max], shape: output.shape};
        report.samples.push(sample); emit('sample', {sample});
        report.memory[`inference_${i}`] = snapshot();
      } finally {if (output) tf.dispose(output);}
      report.memory[`after_sample_${i}`] = snapshot();
    }
    const warm = report.samples.slice(1).map(x => x.elapsed_ms).sort((a,b) => a-b);
    report.timings.first_ms = report.samples[0].elapsed_ms;
    report.timings.warm_ms = {min: warm[0], median: warm[1], max: warm[2], mean: warm.reduce((a,b)=>a+b,0)/warm.length};
    report.status = 'PASS';
  } catch (error) {report.error = error.stack || String(error); emit('failure', {error: report.error});}
  finally {
    phase('cleanup');
    try {
      if (input) input.dispose();
      if (model) model.dispose();
      if (typeof tf !== 'undefined' && tf.getBackend() === 'webgl') {
        report.memory.after_dispose = snapshot();
        const m = report.memory.after_dispose;
        report.live_resources_released = m.numTensors === 0 && m.numDataBuffers === 0 && m.numBytes === 0 && m.numBytesInGPU === 0;
        if (!report.live_resources_released) {report.status = 'FAIL'; report.cleanup_error = 'Live tensor/GPU bytes remain';}
        tf.removeBackend('webgl');
        if (gl && !gl.isContextLost()) gl.getExtension('WEBGL_lose_context')?.loseContext();
        await new Promise(resolve => setTimeout(resolve, 50));
        report.context_lost = gl ? gl.isContextLost() : null;
        report.backend_removed = !tf.findBackend('webgl');
      }
    } catch (error) {report.status = 'FAIL'; report.cleanup_error = String(error);}
    emit('result', {report});
  }
};
