# Stage 5 actual-model WebGL benchmark

This isolated local benchmark uses the stage 3 FP32 graph, the stage 4 `demo01`
ImageNet-normalized float32 tensor, TFJS 4.22.0 and a dedicated worker. It does
not change Depth Lab, host model assets or use a camera. No images are uploaded.

## Reproduce

Prepare the graph and fixtures using CONVERSION.md and VALIDATION.md. Use the
same pinned TFJS bundle, Playwright 1.62.1 and headless Chromium 141 package listed
in VALIDATION.md. With those tools available:

```sh
DEPTH_CHROMIUM=/path/to/chrome-linux/headless_shell \
node tools/depth-tfjs/run_benchmark.cjs \
  /tmp/depth-validation /tmp/tf-4.22.0.min.js /tmp/benchmark-results.json
```

The runner verifies all graph files, the input tensor and TFJS bundle before
starting a loopback server. It runs the actual graph, then tests missing-model
failure, cancellation while loading and during first inference, automatic timeout,
and a complete restart in the same page. Each full run has one first inference
and three warm inferences of exactly the same tensor. Reports and console logs
are retained after errors. Input-integrity failures abort before browser startup.

For the interactive UI, copy `benchmark/index.html`, `controller.js` and `worker.js`
to the prepared fixture directory, and copy the pinned TFJS file there as `tf.js`.
Serve that directory locally:

```sh
python -m http.server 8000 --bind 127.0.0.1 --directory /tmp/depth-validation
```

Open http://127.0.0.1:8000/ on that computer. Run, cancel, copy retained logs or
download a JSON report. A browser requires dedicated-worker OffscreenCanvas WebGL
support; unsupported execution fails explicitly. No CPU backend fallback is used.
This local worker feasibility result does not complete camera integration.

## Measurement and cleanup contract

`model_load_ms` includes fetching/parsing the model and shards and constructing
the GraphModel from local HTTP. It excludes runtime import/backend initialization,
input download and input creation. It is not a public internet download estimate.
First and warm inference times are wall-clock `performance.now()` durations around
`executeAsync(input)` **and complete `output.data()` readback**. Output shape and
finite values are checked after timing. Input creation, numerical scans and output
disposal are excluded. No GPU timer-query/kernel-only time is claimed.

Every successful backend initialization requires `setBackend('webgl')` success,
`getBackend() === 'webgl'`, and `WEBGL_CPU_FORWARD=false`. TFJS/browser/WebGL/
renderer identity is recorded. Inference does not switch backend. Worker and
OffscreenCanvas identity are explicit. SwiftShader is software rendering.

`tf.memory()` snapshots are recorded before loading, after input/model load,
with each output alive, after each output disposal, and after final model/input
disposal. `numTensors`, `numDataBuffers`, `numBytes` and `numBytesInGPU` must return
to zero after normal disposal. GPU allocated/free texture-pool bytes are recorded
separately when TFJS exposes them. Pooled textures are not live tensors. The
backend is then removed and the WebGL context is explicitly lost; browser context
loss and backend absence are recorded. These are TFJS counters and context state,
not operating-system process-memory measurements.

Cancel and the 240-second run deadline terminate the dedicated worker, including
pending model loading or synchronous inference. The parent keeps logs and restores
the controls. Worker termination delegates context destruction to the browser;
post-termination GPU counters cannot be queried and are not reported as measured
zero. Generation checks ignore stale messages. Pagehide also cancels. Normal
completion/failure performs worker cleanup before the parent terminates it. This
is a benchmark lifecycle check; full app lifecycle/regressions remain stage 8.

## Evidence and decision

Committed `evidence/benchmark-results.json` records full runs, runtime identity,
all timing samples, memory snapshots, tested cancellation/failure/timeout outcomes,
and retained events. `evidence/benchmark.log` is the actual harness console log.
The technical status records observed values and the viability decision. Results
from this software-rendered host support continuing the experimental WebGL path,
subject to later packaging, camera integration and real-device evaluation. They
do not establish hardware acceleration, usable phone speed or production readiness.
