# Technical handoff — Depth Anything V2 Small via TFJS WebGL

Updated 2026-10-18. Navigation: [DONE.md](../DONE.md), [stage plan](depth-tfjs-plan.md), [resume prompt](depth-tfjs-continue-prompt.md).

## Current scope and branch

Working/outcome branch: depth-tfjs-webgl. Base/main last checked: 9db5c0345faf7339f3d4cc24142dad362122649e. Current deliverable reconciles user upload: 6C2/6C3 and parent 6C DONE. The current split is 6B–6AE; old 6B–6J scopes are superseded. Stage 6 is PARTIAL. No TFJS camera
implementation or model assets have been deployed. Next task: 6D remote byte verification only.

The earlier temporary workspace is absent. Historical scripts, environments, binary fixtures, converted weights and original log files are unavailable. The adjacent evidence JSON was transcribed from actual tool output visible in the conversation; it is not a recovered original log. Stages 2–5 have now been reproduced below; durable scripts and evidence are committed.

## Existing implementation

- depth.html / depth.css / depth.js: camera UI, scheduling, pause/step, result/relief display.
- depth-core.js: ImageNet preprocessing, frame sizing, normalization and latest-frame geometry.
- depth-worker.js: ONNX Runtime Web 1.20.1 inference; one in-flight frame; dedicated module worker.
- depth-diagnostics.js: depth-lab-3, browser/GPU probes and copyable error logs.
- tests/depth*.test.mjs plus camera tests: historical baseline 47/47 passed; not rerun during this documentation checkpoint.
- index.html, map.html, camera.html and dashboard.html: navigation; sw.js / pwa-register.js / manifest.webmanifest: preserve behavior.
- ONNX model revision 4472b7362082ad9968fee890ca0f1e5aca36b93d. CPU uses INT8 (~27 MB), WebGPU uses FP16/FP32.
- Current sizes 224, 336, 518 maximum edge, dimensions multiples of 14.
- Relative inverse depth normalized per frame; relief is latest-frame arbitrary geometry, not metric depth or SLAM.
- Current README describes main/root Pages hosting and network-only navigation behind the existing Access flow.

Repository tree was inspected afresh on 2026-10-18; no AGENTS.md was present.

## Historical conversion recipe

Model: https://huggingface.co/keras/depth_anything_v2_small
Pinned revision: 0fa3d627036ffe8029b34850dbdab5028696f011

| Source file | Observed size | Observed SHA256 |
| --- | --- | --- |
| model.weights.h5 | 102051640 bytes | 7367dabc7e0e28512aea7d94f845dba542e4bdd88142debf580cc98c8d683b49 |
| config.json | 2266 bytes | c9fe5d3b68ff71854f08f378228ab6f60217b82964a5bd8bf3f0f6c60d03ac75 |

Observed working stack: CPython 3.12, tensorflow 2.19.0, tensorflow-text 2.19.0, tf-keras 2.19.0, keras 3.15.1, keras-hub 0.24.0, tensorflowjs 4.22.0, tensorflow-decision-forests 1.12.0, ydf 0.11.0, protobuf 5.29.6, setuptools 80.9.0, packaging 23.2, jax/jaxlib 0.5.3, flax 0.10.6. Stage 2 independently verified these pins and committed the complete resolved lockfile at tools/depth-tfjs/requirements.lock.txt.

Construction used keras.saving.deserialize_keras_object(config) after setting config['config']['image_encoder']['config']['image_shape'] to [224,224,3]. Strict model.load_weights succeeded, reporting 24883777 parameters. Final ReLU must be applied after the backbone to match the relative DepthEstimator.

Input is NHWC float32 [1,224,224,3], RGB /255, mean [.485,.456,.406], std [.229,.224,.225]. The three numerical fixtures used TensorFlow bilinear resizing to 224 square. This was a validation input choice, not a validated camera letterboxing path.

SavedModel wrapper used a tf.Module with a tracked model and a tf.function signature named images; output dictionary key depth, shape [1,224,224,1]. Converter command:

```sh
tensorflowjs_converter --input_format=tf_saved_model --output_format=tfjs_graph_model --signature_name=serving_default --saved_model_tags=serve --weight_shard_size_bytes=4194304 saved-depth converted-depth
```

Default TF 2.19 exact GELU emitted Erfc, which TFJS 4.22 rejected before optimization. Replacing the 12 Dense GELU activations with 0.5*x*(1+tf.math.erf(x/tf.sqrt(2))) allowed conversion. An initial random-input comparison observed maximum error 1.6689300537109375e-6. Validate again on representative images; do not use approximate GELU without a separate justification.

Other encountered dependency issues: KerasHub 0.22.2 lacked DepthAnythingBackbone; latest YDF generated Protobuf 6.31.1 code incompatible with runtime 5.29.6; newer setuptools removed pkg_resources used by tensorflow-hub. Compatible pins above resolved converter execution. Concurrent pip installs produced duplicate metadata; mutate one environment sequentially and require pip check to pass.

TFJS conversion generated 24 ~4 MiB shards and a graph, approximately 98 MB total. Binary files and exact generated checksums were not preserved. Confirm licensing for the Keras distribution and retain source-model/TFJS Apache-2.0 notices before distributing.

## Historical WebGL observations

See [historical evidence](depth-tfjs-historical-evidence.json). TFJS 4.22.0 ran the actual graph with setBackend('webgl'), getBackend() verification and WEBGL_CPU_FORWARD=false. Browser was Playwright Chromium 141 on Linux using ANGLE/SwiftShader. This is software-rendered WebGL, not a phone or hardware speed test.

Three different images (upstream assets/examples/demo01.jpg, demo02.jpg, demo03.jpg) were tested. Exact upstream commit and image checksums were not preserved; pin them during reproduction. Original TensorFlow outputs were generated before GELU rewriting, then clamped with ReLU. WebGL maximum errors were about 2.74e-5, 3.38e-5 and 1.36e-4. Normalized MAE was about 1.24e-7, 2.62e-7 and 1.76e-6.

First execution with readback took ~25.17 s in SwiftShader; subsequent different-image executions ~15.20 and ~16.83 s. These are not repeated same-image steady benchmarks. Live GPU bytes were ~98.6 MB and texture pool allocation reached ~674.9 MB. Model/input/output disposal returned live tensors and live GPU bytes to zero while the pool remained allocated. Include explicit pool/context accounting in lifecycle testing.

## Pending implementation decisions

The isolated stage 5 benchmark now verifies worker OffscreenCanvas/WebGL on this host, with cancellation and retained failures. Durable hosting and actual camera integration are not implemented; browser/device support still must be checked in that integration. Candidate design: explicit WebGL choice, fixed 224 mode, aspect-preserving letterboxing and output unpadding, existing one-frame backpressure and worker termination. Do not report this design as completed.

A local git dry-run push previously lacked credentials. Use the connected GitHub integration for repository writes. An interrupted blob-upload attempt is not evidence of completed hosting; verify actual branch-referenced assets before relying on uploads. Large binary transfer should be isolated into stage 6, with exact lengths/hashes and bounded chunks. Never concatenate independently padded base64 chunks as a complete encoding.

## Device constraints

OnePlus 12R, Android 16; reported Chrome 155. Existing WASM works around 2.7–3.1 s/frame at 224. Hardware WebGL was reported, while Core/compatibility WebGPU adapter requests returned null even in a regular browser tab. Do not assume WebGPU is available. No actual TFJS phone benchmark has been supplied.

## Next action

Run **6C only**, as specified in the Stage 6B appendix below and PACKAGING.md.
Historical next-action paragraphs below describe previous checkpoints and are
superseded by this pointer and DONE.md.

## Stage 2 reproduced — 2026-10-18

Working/outcome branch: `depth-tfjs-webgl`. Starting checkpoint:
`56d4d161507ef865484f84014b7eb79005758fd2`. Resolve the new checkpoint SHA from
the branch head/commit containing this section; a commit cannot embed its own SHA.

Current main: `9db5c0345faf7339f3d4cc24142dad362122649e`, unchanged from the
branch base. Pages run [39104746337](https://github.com/tmt11geo/dashboard-pwa/actions/runs/39104746337)
completed successfully for that exact SHA. No deployment was triggered by this stage;
Cloudflare Access and all application files remain unchanged. The only differences
from main are handoff documentation and conversion-environment tooling/evidence.

Durable tooling in `tools/depth-tfjs/`:

- `requirements.txt`: historical top-level versions, verified without changes.
- `requirements.lock.txt`: all 70 installed distributions, exact versions including pip 25.0.1.
- `setup.sh`: clean CPython 3.12 venv setup, sequential pip installs and smoke checks.
- `verify_environment.py`: version assertions, pip consistency, backbone/TFJS imports,
  TensorFlow operation, tensorflow Keras backend and bounded converter startup.
- `README.md`: commands, platform scope, failure notes and limitations.
- `evidence/environment.json`: first clean environment PASS.
- `evidence/environment-reproduced.json`: independent clean setup-script reproduction PASS.
- `evidence/converter-help.txt` and stderr logs: actual converter startup evidence.
- `evidence/reproduction.json`: commands, checksums, result and checkpoint provenance.

Acceptance: `pip check` reports “No broken requirements found.”;
`keras_hub.models.DepthAnythingBackbone` imports; TensorFlow sum returns 3;
`tensorflowjs_converter --help` exits 0 with the expected input-format option.
No model weights were downloaded and no model export/conversion was attempted.

Platform: CPython 3.12.14, Linux x86_64, glibc 2.39, CPU-only conversion use.
CUDA factory/initialization and legacy pkg_resources deprecation messages were observed,
but did not prevent the checks. Version pins avoid the historical YDF/Protobuf and
setuptools failures. The lock is platform-specific and version-pinned, not a wheel
archive with hash verification. Index/package availability remains external.

Stage 2 blocker at that checkpoint: none. Its stage 3 next action has been completed below.

## Stage 3 reproduced — 2026-10-18

Working/outcome branch: `depth-tfjs-webgl`. Starting checkpoint:
`cf3af3af3e7b73a7304fcf0f84b1cea9b8e955d6`. The branch head/commit containing
this section is the resulting checkpoint; no guessed self-referential SHA is embedded.

Main remains `9db5c0345faf7339f3d4cc24142dad362122649e`; latest main Pages run
[39104746337](https://github.com/tmt11geo/dashboard-pwa/actions/runs/39104746337)
is successful for that exact SHA. No deployment or application/Access/PWA change
occurred. Differences from main are documentation and conversion tooling/evidence only.

### Deliverables and acceptance evidence

- `tools/depth-tfjs/convert_model.py`: immutable source download with byte/hash
  verification, nested fixed-224 config, strict pretrained loading, exact GELU
  rewrite smoke, final ReLU, SavedModel export and TFJS conversion.
- `tools/depth-tfjs/CONVERSION.md`: executable regeneration command, external
  preprocessing contract, persistence plan and licensing provenance.
- `tools/depth-tfjs/evidence/conversion-run-1.json` and `conversion-run-2.json`:
  complete source revisions/hashes, signatures, graph/SavedModel operation counts,
  file lengths/hashes, parameter count, rewrite errors and converter commands.
- `tools/depth-tfjs/evidence/conversion-reproduction.json`: repeated conversion
  comparison, script/lock hashes, corrupt-cache rejection and provenance.
- Adjacent `conversion-run-*.log` and `conversion-converter.*.log`: actual logs,
  including nonfatal CPU-host CUDA warnings.

Two fresh output directories were converted successfully with the stage 2
environment. Run 1 preceded added signature/shard-byte assertions; run 2 uses the
final committed script. Export/conversion calculations were unchanged between runs.
All 24 binary shards are byte-identical. GraphModel JSON differs only in key
serialization order: parsed JSON, signatures, operation inventory and weight
manifest are identical. Reuse each model.json and shard set together.

Observed values:

| Check | Result |
| --- | --- |
| Source revision | `0fa3d627036ffe8029b34850dbdab5028696f011` |
| Config/weight SHA256 | Both exactly match the historical table above |
| Strict parameter count | 24,883,777 |
| Input | `images:0`, float32 [1,224,224,3], external RGB/ImageNet normalization |
| Output | key `depth`, tensor `Identity:0`, float32 [1,224,224,1], final ReLU |
| GELU rewrites | 12 Dense layers; exact erf formula, no approximate GELU |
| Synthetic rewrite max absolute error | 3.337860107421875e-6 (bound 1e-4) |
| Synthetic rewrite MAE | 1.0832089856194216e-6 |
| Original synthetic output range | [1.9410514831542969, 2.9254231452941895] |
| TFJS graph GELU operations | 12 Erf; zero Erfc |
| Shards | 24, maximum 4,194,304 bytes |
| Manifest/shard data bytes | 97,145,740, exact match |
| Graph including model.json | 97,817,343 bytes |
| Corrupt-source guard | Modified cached config rejected before model loading |

Licensing provenance: pinned Keras model card explicitly assigns Apache 2.0 to
Small weights; its exact URL/hash is in the reports. KerasHub 0.24.0 installed
metadata declares Apache-2.0; TFJS 4.22.0 declares Apache 2.0. Full distribution
license/attribution packaging remains stage 6.

### Persistence, limits and precise next action

Stage 3 acceptance is DONE: repeatable conversion, durable script/metadata and
explicit regeneration arrangements are committed. Binary asset hosting is not
claimed. Local source cache:
`/workspace/scratch/e11ad2108fd0/depth-stage3/source`.
Preferred local converted output:
`/workspace/scratch/e11ad2108fd0/depth-stage3/run-2` (contains saved-model,
graph-model, gelu-smoke.npz, conversion.json and converter logs).
These locations are transient; if absent, use the pinned setup and run:

```sh
/tmp/depth-tfjs-env/bin/python -u tools/depth-tfjs/convert_model.py \
  --source-dir /tmp/depth-tfjs-source \
  --output-dir /tmp/depth-tfjs-conversion
```

The synthetic input compares the original and rewritten TensorFlow models only.
It is not representative-image validation, converted TFJS runtime evidence,
WebGL viability, hardware acceleration evidence or phone performance.
Stages 4–5 remain PARTIAL based on historical evidence. Stage 3 has no blocker.

Exact next action: perform stage 4 as described in “Next action” above. Inspect
and use the existing run-2 output if still available; otherwise regenerate.
Keep raw relative-depth outputs before display min/max normalization, retain
immutable real-image provenance and record numerical pass/fail thresholds/results.
Stop after that stage; do not integrate or deploy.

## Stage 4 reproduced — 2026-10-18

Working/outcome branch: `depth-tfjs-webgl`; starting commit
`73eb63f07dff9efeb4103767125bc30587f3ecb4`. The resulting checkpoint is the
branch head containing this section. No AGENTS.md exists in the inspected recursive
tree. Main remains `9db5c0345faf7339f3d4cc24142dad362122649e`; Pages run
[39104746337](https://github.com/tmt11geo/dashboard-pwa/actions/runs/39104746337)
was verified successful for that SHA. Differences from main remain documentation
and tooling/evidence only. No application, Access, PWA or hosted model change.

### Deliverables and results

- `tools/depth-tfjs/validation-fixtures.json`: upstream revision
  `a561b849ebae10a6f5ef49e26c83cbbcd36c71bf`, immutable URLs, lengths and SHA256
  for demo01/02/03.jpg. Images are fetched locally, not redistributed.
- `prepare_validation.py`: verifies original source and converted graph files,
  strict original pretrained loading, RGB decoding, square bilinear resize,
  ImageNet normalization, original references before 12 exact GELU rewrites,
  rewritten references, finite/shape/error guards and byte-identical browser inputs.
- `validate_graph.cjs`: loopback-only numerical runner, tensor/model integrity,
  explicit TFJS 4.22.0 WebGL with WEBGL_CPU_FORWARD=false, raw float32 outputs,
  all nine comparisons, error reporting and bounded browser execution.
- `VALIDATION.md`: commands, dependency/browser pins, rationale, scope and limitations.
- `evidence/validation-results.json`, `validation-prepare.log`,
  `validation-browser.log`, `validation-checkpoint.json`: machine-readable results
  and actual execution/provenance. Python and Node syntax checks passed.

| Fixture | Original source range | Rewrite max error | TFJS vs rewrite max error | TFJS vs original max error | End-to-end MAE/source range |
| --- | --- | --- | --- | --- | --- |
| demo01 | 0–3.90340209 | 1.24276e-5 | 2.88934e-5 | 2.44081e-5 | 2.02941e-7 |
| demo02 | 0–3.15063858 | 2.26498e-5 | 4.04119e-5 | 3.30210e-5 | 2.49123e-7 |
| demo03 | 0.41774547–3.05141687 | 3.13520e-5 | 7.85589e-5 | 8.38041e-5 | 1.06466e-6 |

All nine comparisons PASS: maximum absolute error <=1e-3 and MAE/original
source range <=1e-4. Every output is finite float32 [1,224,224,1]. No display
normalization or fitted scaling was applied. These are float32 parity bounds,
not ground-truth depth accuracy. Three examples and square-resize input do not
validate all camera scenes or letterboxing.

Runtime: Playwright 1.62.1, headless Chromium 141.0.7390.37, WebGL 2.0 via
ANGLE Vulkan SwiftShader. This proves software-rendered WebGL numerical
compatibility only, not hardware acceleration, phone performance or stage 5 timing.
Default browser installers returned invalid ZIPs; an explicitly pinned headless-shell
archive from Microsoft's Playwright download host worked. Full Chrome failed
process-singleton socket creation. Details and archive hash are in VALIDATION.md.
An earlier headless numerical execution also passed; final committed evidence uses
the final preparer and runner (single-process/no-zygote flags). No stage 5 benchmark
was attempted; no timing or resource-retention conclusions are claimed.

### Persistence and exact next action

Stage 4 is DONE; blocker: none. Prepared local tensors and copied graph:
`/workspace/scratch/4c361dacd12f/stage4/final`. These are transient; regenerate with
VALIDATION.md if absent. The existing stage 3 source/environment/output paths
remain valid at this checkpoint; model and 24 shard hashes were verified before use.

Exact next action is stage 5 only: implement/run the dedicated same-image WebGL
benchmark, cancellation/cleanup and failure retention, memory accounting and
viability decision. Reuse `stage4/final/demo01-input.bin` and its graph if present,
otherwise regenerate. Do not start asset hosting, camera integration or deployment.

## Stage 5 reproduced — 2026-10-18

Working/outcome branch: `depth-tfjs-webgl`, starting commit
`59985fa561e435e96c54e125aaeaed5bbe1ad373`. The new checkpoint is the branch
head containing this section. Recursive tree inspection found no AGENTS.md.
Main/live remain `9db5c0345faf7339f3d4cc24142dad362122649e`; Pages run
[39104746337](https://github.com/tmt11geo/dashboard-pwa/actions/runs/39104746337)
was rechecked as successful for that exact commit. No app, Access, PWA or deployment
changes. Differences from main remain development documentation/tooling/evidence.

### Durable benchmark and checks

- `tools/depth-tfjs/benchmark/index.html`, `controller.js`, `worker.js`: isolated
  local UI with run/cancel/copy/download, retained logs, generation guards and
  dedicated worker; actual fixed-224 graph and identical stage 4 demo01 tensor.
- `run_benchmark.cjs`: verifies graph/input/TFJS hashes, loopback serving and
  automated actual-model checks; records full timing/resource/failure evidence.
- `BENCHMARK.md`: reproduction/UI commands, dependency pins via VALIDATION.md,
  timing boundaries, resource/cancellation semantics and limitations.
- `evidence/benchmark-results.json`, `benchmark.log`, `benchmark-checkpoint.json`:
  actual results/provenance. All three JavaScript syntax checks passed.

Runtime: Playwright 1.62.1, Chromium 141.0.7390.37, TFJS 4.22.0; dedicated worker
with OffscreenCanvas, WebGL 2.0, ANGLE/Vulkan SwiftShader. Explicit setBackend
succeeded, getBackend returned webgl and WEBGL_CPU_FORWARD remained false. This
is software-rendered compatibility evidence, not hardware or OnePlus performance.

| Full run | Local model load | First inference | Warm min / median / max | Warm mean |
| --- | --- | --- | --- | --- |
| Initial | 466.3 ms | 11,020.0 ms | 7,959.8 / 8,078.1 / 8,116.5 ms | 8,051.5 ms |
| Restart after interruptions | 591.6 ms | 18,908.0 ms | 8,102.6 / 8,142.3 / 8,163.6 ms | 8,136.2 ms |

Each cycle used the same input tensor for the first and three warm inferences.
Times include execution and complete output.data readback, excluding input
creation, finite/range scan and output disposal. Model load is local HTTP graph/
shard fetch and GraphModel construction, not an internet transfer prediction.
Different first-run times are retained as measured, not interpreted as stable
hardware startup performance. Every output was finite [1,224,224,1].

Each normal cycle: peak observed live GPU bytes 98,597,104; allocated texture
pool 674,886,468 bytes, equal in both cycles. After output/model/input disposal:
zero tensors, data buffers, JS-accounted tensor bytes and live GPU bytes; all
674,886,468 allocated bytes were then free pool. The backend was removed and
context loss observed. Pool allocation before context teardown is not a live-tensor
leak; context loss is not an OS-level GPU-memory measurement.

All seven checks PASS: actual graph first+3 warm runs; forced model-404 failure
with retained logs/restored controls; cancellation during delayed model load;
cancellation during first inference; bounded automatic timeout; complete restart
after failure/cancellation/timeout; logs retained across runs. Cancellation kills
the worker, avoiding main-thread inference blocking. Post-termination worker GPU
counters are unavailable; no measured-zero claim is made for cancelled contexts.
Normal completion performs measured disposal before parent termination. Full
camera/app lifecycle regressions remain stage 8.

### Viability, persistence and next action

Stage 5 is DONE; blocker for this stage: none. Continue the experimental WebGL
path to packaging: actual model execution, numerical parity, worker execution,
bounded interruption and normal cleanup are demonstrated on this host. The
~675 MB pool and 11–19 s first-inference costs are material limitations. SwiftShader
warm times (~8 s) cannot predict phone GPU speed or beat the phone's existing WASM
baseline. Hardware worker-WebGL support, device memory pressure, heat and sustained
performance remain unproven and must be evaluated later. No production readiness
or phone speed claim.

Artifacts reused locally: `/workspace/scratch/4c361dacd12f/stage4/final` contains
verified model/shards and tensors. Runtime bundle `/tmp/depth-tf.min.js`; browser
`/tmp/depth-headless/chrome-linux/headless_shell`. These are transient; recreate
via CONVERSION.md, VALIDATION.md and BENCHMARK.md if absent.

Exact next action: stage 6 only, package the validated FP32 GraphModel plus 24
shards with complete licenses/attribution; choose permitted durable hosting, verify
all intended URLs against committed lengths/hashes and test actual loading. Do
not change precision without new numerical validation. Do not integrate camera,
add a selectable backend or deploy the application in stage 6.


## Stage 6A — package integrity and bounded transfer plan, 2026-10-18

Working/outcome branch: `depth-tfjs-webgl`; starting commit
`1b8409a367a1e816490aab117b35577f22d2d4e1`. Checkpoint SHA is the branch commit
containing this appendix; resolve it from GitHub. User supplied screenshot shows
an interruption during binary blob creation. The current recursive branch tree
contains no model assets and no AGENTS.md; no remote blob success is inferred.

Recovered exact local graph at
`/workspace/scratch/4c361dacd12f/stage4/final/graph-model` (temporary).
`verify_package.py` verifies all 25 files against committed conversion-run-2.json,
checks manifest completeness and weight byte count, and derives Git blob IDs.
All SHA256/lengths match; all 25 blob IDs also match independent `git hash-object`.
Missing/corrupt model guards reject inputs. Total graph 97,817,343 bytes; weights
97,145,740 bytes. No numerical rerun needed: bytes are unchanged from validated
stage 4 and benchmarked stage 5. No precision or preprocessing changes.

Deliverables: `tools/depth-tfjs/verify_package.py`, `PACKAGING.md`,
`evidence/package-inventory.json`, `evidence/package-checkpoint.json`, updated
stage plan and reusable prompt. 6A DONE; 6B–6J NOT STARTED. No binary transfer
attempted in this substage. Remote content transfer capability remains unproven.
License-text/notice packaging is 6I; no redistribution of weights in 6A.

Main/live remain `9db5c0345faf7339f3d4cc24142dad362122649e`; Pages run
39104746337 rechecked completed/success for that exact SHA. Differences from main
remain development documentation/tooling/evidence; no application, Access,
service worker, hosting configuration or deployment change.

Exact next action: **6B only**. Verify cached graph with the committed verifier,
then attempt only shard 1 at the versioned destination in package-inventory.json.
Read/encode bytes programmatically, never emit multi-megabyte base64 into model
context. Verify create_blob SHA against inventory, immediately attach to a tree
and branch commit, then verify remote file length/SHA256/blob ID. A blob response
alone is insufficient. If transport is unavailable/fails, commit exact blocker and
safe alternative; do not keep retrying or start other shards. Parent stage 6
remains incomplete until full distribution and URL/load checks pass. Stop after 6B.

## Stage 6B — license and pilot preparation, 2026-10-18

Starting/outcome branch: `depth-tfjs-webgl`; starting commit
`d13dabeee16b56d001d8f3fa55c78ccc98edad36`. This user-requested finer split
supersedes every historical 6B–6J next-action/scope reference above. 6A remains DONE;
6B now completes only license/preparation. 6C uploads/attaches shard 1, 6D checks
its remote bytes, 6E–6AA transfer one subsequent shard each. 6AB adds model.json,
6AC audits distribution, 6AD checks immutable URLs, 6AE actually loads the model.

Deliverables: full `LICENSE.txt`, exact `SOURCE_MODEL_CARD.md` and
`ATTRIBUTION.md` at `models/depth-anything-v2-small-tfjs-fp32-224-v1/`.
The card downloaded from the immutable Keras revision matches stage 3's 4,720 bytes
and SHA256. Its pinned file listing has no separate LICENSE or NOTICE. The complete
Apache-2.0 text was retrieved using the connected GitHub integration from original
DepthAnything upstream commit `a561b849ebae10a6f5ef49e26c83cbbcd36c71bf`; author attribution
was checked against its README. The conversion modification notice accompanies
future binary shards without corrupting their bytes. Runtime dependency notice
audit remains required if runtime code is later distributed.

Evidence: `tools/depth-tfjs/evidence/package-license-checkpoint.json`.
Local shard 1 was re-read at the 6A source path; length/SHA256/blob ID match inventory.
Remote starting tree: no AGENTS.md, graph or weights; no partial branch asset to
resume. No upload attempted in this bounded substage. Binary transport remains
unproven, with no measured tool-limit/error claimed. No hosting or phone result.

Main/live state: main still `9db5c0345faf7339f3d4cc24142dad362122649e`;
Pages run 39104746337 rechecked `success` for that exact head. Only documentation,
evidence and license/provenance files change in this run. App, Access and deployment
configuration remain unchanged. No stage 6B blocker.

Exact next action: **6C only**. Re-read current branch head and intended shard path;
use the expected inventory to recover/skip already attached work. Read shard 1
programmatically from the recorded graph path, base64-encode without output to the
conversation, and make one create_blob call through the integration. Compare returned
blob ID `465c35791bb7139749f64bd758c46971a7607477`; immediately attach via tree,
commit and leased ref update. Record resulting commit and ref/tree metadata evidence,
then stop. If transport fails, capture exact error, checkpoint blocked and stop.
6D alone subsequently checks remote byte SHA256. Never count a dangling blob or
start shard 2 in 6C. No user input currently required.

## Stage 6C split — preparation checkpoint, 2026-10-18

This section supersedes earlier instructions to upload and attach shard 1 in one run.
User requested a durable checkpoint before the large binary tool call.

| Substage | State | Scope |
| --- | --- | --- |
| 6C1 | DONE | Check branch/path and local shard identity; commit preparation and stop before another binary upload. |
| 6C2 | NOT STARTED — NEXT | Inspect branch/path and recover expected blob if available; otherwise attempt one programmatic binary upload. Commit a small receipt or exact blocker to this branch, then stop. |
| 6C3 | NOT STARTED | Attach the expected blob to the model path using tree/commit/leased ref update; verify ref and tree path, size and blob ID; checkpoint and stop. |

Parent 6C remains PARTIAL until 6C3. 6D still performs remote byte verification.
No other Stage 6 scopes change. A dangling blob is not a hosted model.

Starting branch/head: `depth-tfjs-webgl` at `64a6c1091ffe2927f85299d95ff55dfa46d30f04`.
The inspected recursive tree had no AGENTS.md or binary model assets.
Local shard: `/workspace/scratch/4c361dacd12f/stage4/final/graph-model/group1-shard1of24.bin`.
Length 4,194,304 bytes; SHA256 `9fa4b753d284376f2bfd5831f583dec5c879dcdf92ddc41187732ec864c29855`;
Git blob ID `465c35791bb7139749f64bd758c46971a7607477`.
All match the inventory. These local bytes remain temporary.

Before the upload attempt, create_tree with the expected blob returned HTTP 422:
`tree.sha 465c35791bb7139749f64bd758c46971a7607477 is not a valid blob`.
A 5,592,408-character base64 payload was then prepared programmatically using
3-byte-aligned reads, without printing it. The subsequent create_blob call was
reported as `aborted by user after 5.8s`; no success response or blob ID was received.
This does not establish whether GitHub accepted the upload. No upload retry was made.
The branch head was re-read after interruption and remained at the starting commit.

Evidence: `tools/depth-tfjs/evidence/package-shard1-preparation.json`.
Blocker: binary upload outcome unknown; branch attachment not completed.
Main last checked at `9db5c0345faf7339f3d4cc24142dad362122649e`; last previously
verified successful Pages run 39104746337. No new deployment check is claimed.

Exact next action: run **6C2 only**. First inspect the current head/path and check
whether expected blob 465c35791bb7139749f64bd758c46971a7607477 can be recovered.
If absent, re-read and verify the local shard (or regenerate via CONVERSION.md if
missing), encode without emitting payloads, then make at most one create_blob attempt.
Record the returned ID or exact failure in a small committed receipt and update
DONE/status before stopping. Do not attach in 6C2, start 6D, or upload shard 2.
The upload request itself is indivisible with create_blob; this split saves progress
around it, not within it. Do not claim this removes any transport/context limit.


## Stage 6C2 blocked — phone upload handoff, 2026-10-18

Working/outcome branch: `depth-tfjs-webgl`; starting commit `d30f1d75d0ddbe252880abadddb9efc477a51812`.
6C2 remains BLOCKED pending manual upload. No 6C3 or 6D executed.
Fresh recursive tree inspection found no AGENTS.md or binary assets. Recovery probe
returned HTTP 422: expected blob 465c35791bb7139749f64bd758c46971a7607477 is not a valid blob.
Local shard was recovered and verified: 4,194,304 bytes, SHA256
9fa4b753d284376f2bfd5831f583dec5c879dcdf92ddc41187732ec864c29855,
Git blob 465c35791bb7139749f64bd758c46971a7607477.
One base64 create_blob attempt (5,592,408 characters) returned
"aborted by user after 6.1s" with no receipt. User screenshot shows conversation
maximum-length message. The interruption source is not established by the tool label;
no GitHub rejection or successful upload is inferred. Do not retry this large payload path.

Alternative requested by user: download the unchanged group1-shard1of24.bin to phone,
then use Chrome GitHub website (Desktop site if necessary), Add file > Upload files
inside models/depth-anything-v2-small-tfjs-fp32-224-v1 on branch depth-tfjs-webgl.
Commit only that file to this branch, never main. Browser upload combines upload and
attachment; next run must reconcile 6C2/6C3 against the actual user commit, not duplicate it.
GitHub documents a 25 MiB browser file limit; this file is 4 MiB.

Exact next action: wait for user upload/commit link; read current branch and path,
confirm expected blob ID and length, record receipt and reconcile attachment status.
Remote byte verification stays 6D. No shard 2, app integration or deployment in this run.
Main remains 9db5c0345faf7339f3d4cc24142dad362122649e; deployment not rechecked.
Only checkpoint documentation changes in this commit.


## Stage 6C completed by phone upload — 2026-10-18

This current checkpoint supersedes all earlier 6C waiting/blocker/next-action text.
Working/outcome branch: depth-tfjs-webgl. User uploaded shard 1 in commit
b1dcfe169931a425cb80a66d611c8f9f556a920b, parent 87b55b3d495a4a7c22fc2b7190c15eeb66816063.
Fresh immutable recursive tree inspection confirms the exact destination
models/depth-anything-v2-small-tfjs-fp32-224-v1/group1-shard1of24.bin,
mode 100644, length 4,194,304, blob 465c35791bb7139749f64bd758c46971a7607477.
Length and content-addressed Git blob identity exactly match the verified local
original and inventory. No AGENTS.md found. Browser upload combined upload and
attachment, so 6C2 and 6C3 are reconciled DONE; parent 6C DONE.
No duplicate upload/attachment performed. Only shard 1 is present.
Evidence: tools/depth-tfjs/evidence/package-shard1-upload.json.
Blocker: none for 6C. Stage 6 remains PARTIAL.
Exact next action: 6D only, independently retrieve remote shard bytes and verify
length/SHA256/Git blob ID, save evidence and checkpoint, then stop. This run
verified remote tree metadata/content identity, not an independent remote SHA256.
Main/live last checked at 9db5c0345faf7339f3d4cc24142dad362122649e; no deployment
performed or new deployment verification claimed. No app files changed.
