# Technical handoff — Depth Anything V2 Small via TFJS WebGL

Updated 2026-10-18. Navigation: [DONE.md](../DONE.md), [stage plan](depth-tfjs-plan.md), [resume prompt](depth-tfjs-continue-prompt.md).

## Current scope and branch

Working/outcome branch: depth-tfjs-webgl. Base/main last checked: 9db5c0345faf7339f3d4cc24142dad362122649e. Current deliverable completes stage 3: repeatable pinned pretrained conversion with exact GELU rewriting. No TFJS camera implementation or model assets have been deployed. Next task is stage 4.

The earlier temporary workspace is absent. Historical scripts, environments, binary fixtures, converted weights and original log files are unavailable. The adjacent evidence JSON was transcribed from actual tool output visible in the conversation; it is not a recovered original log. Stages 2 and 3 have now been reproduced below. Reproduction remains required before marking stages 4–5 DONE.

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

A dedicated benchmark, failure retention/cancellation, durable hosting, worker OffscreenCanvas/WebGL support and actual camera integration are not implemented. Candidate design: explicit WebGL choice, fixed 224 mode, aspect-preserving letterboxing and output unpadding, existing one-frame backpressure and worker termination. Do not report this design as completed.

A local git dry-run push previously lacked credentials. Use the connected GitHub integration for repository writes. An interrupted blob-upload attempt is not evidence of completed hosting; verify actual branch-referenced assets before relying on uploads. Large binary transfer should be isolated into stage 6, with exact lengths/hashes and bounded chunks. Never concatenate independently padded base64 chunks as a complete encoding.

## Device constraints

OnePlus 12R, Android 16; reported Chrome 155. Existing WASM works around 2.7–3.1 s/frame at 224. Hardware WebGL was reported, while Core/compatibility WebGPU adapter requests returned null even in a regular browser tab. Do not assume WebGPU is available. No actual TFJS phone benchmark has been supplied.

## Next action

Run stage 4 only: pin at least three representative real-image fixtures by immutable revision/checksum. Reuse the stage 3 original-model builder and exact GELU rewrite. Feed identical ImageNet-normalized tensors to the original pretrained source and converted TFJS graph, comparing outputs before display normalization; separate rewrite error from conversion/runtime error. Define justified thresholds, preserve fixture provenance, executable validation and machine-readable results. Do not start benchmarking or app integration. See the stage 3 output paths/regeneration instructions below.

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
