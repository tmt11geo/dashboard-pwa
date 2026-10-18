# Ten bounded stage prompts

Use one stage per run. The reusable continuation prompt selects the next eligible stage from DONE.md. These prompts are repository instructions for this work, not instructions to execute all stages in one turn.

## Common instructions for every stage

Repository: tmt11geo/dashboard-pwa. Use the connected GitHub integration. Read latest branch files and applicable AGENTS.md first. Work on depth-tfjs-webgl unless DONE.md records a deliberate branch change; inspect current main before integration.

Complete only the selected stage, then stop. Commit checkpoints to the working branch. Only stage 9 merges into main and deploys. Existing authorization permits the requested implementation/deployment; do not request routine permission again.

Preserve Cloudflare Access, relative links/assets under /dashboard-pwa/, maps, saved themes, camera tracking, location tools, manifest/PWA identity and existing ONNX WASM/WebGPU options. Keep camera frames local. Do not silently fall back to CPU while reporting GPU inference.

Report progress at least every five minutes while active; keep individual waits short enough for updates. Record exact failures instead of retrying the same failing operation indefinitely. Split a large stage into a safe PARTIAL checkpoint if necessary.

Update DONE.md and docs/depth-tfjs-status.md before ending. Include stage/substep state, branch, commands, versions, revisions, artifact locations, checks, limitations, deployment state and exact next action. Commit durable deliverables; temporary local files alone are not a completed stage. Verify the remote commit. Do not move to the next stage automatically.

## 1 — Audit and recover existing work

Inspect current main, working branches and available local work from the interrupted attempt. Do not change application behavior. The earlier attempt started from 9db5c0345faf7339f3d4cc24142dad362122649e and created local conversion scripts under tactical/tools/depth-tfjs/. Recover useful scripts/logs/results if available. Distinguish historical observations from reproducible evidence. Inspect Depth Lab, tests, navigation, service worker and deployment arrangement. Commit the inventory, preservation requirements, stage plan and branch/resume pointers. Absence of recoverable files must be recorded, not concealed.
Acceptance: a new chat can locate the work and select the next task using repository files alone.

## 2 — Establish the conversion environment

Prepare and execute a pinned setup for KerasHub/TensorFlow and tensorflowjs_converter. Use the versions and failure notes in depth-tfjs-status.md as a starting point, verifying availability and compatibility. KerasHub 0.22.2 lacked Depth Anything; earlier problems included YDF/Protobuf incompatibility and missing pkg_resources.
Acceptance: dependency consistency check passes, DepthAnythingBackbone imports, converter starts, and setup commands/requirements are committed. Avoid concurrent pip mutations in one environment. Do not convert or integrate the model yet.

## 3 — Reproduce pretrained conversion

Implement and execute a reusable script for keras/depth_anything_v2_small, pinned to 0fa3d627036ffe8029b34850dbdab5028696f011. Verify checkpoint hashes from status.md. Use fixed float32 input [1,224,224,3], pretrained weights and final relative-estimator ReLU. Shape belongs to the nested DINOV2 encoder config.
Earlier export emitted unsupported Erfc for exact GELU. Test equivalent 0.5*x*(1+erf(x/sqrt(2))) against unmodified source output; do not silently switch to approximate GELU.
Export SavedModel and GraphModel with about 4 MiB shards. Record input/output signatures, operation inventory, sizes, hashes and licensing provenance.
Acceptance: repeatable successful conversion; durable script, metadata and explicit regeneration/asset persistence arrangements. No app backend option yet.

## 4 — Validate numerical outputs

Use at least three representative real images with pinned source revisions/checksums. Feed identical preprocessed tensors to the original pretrained source and converted TFJS model. Match RGB scaling, ImageNet normalization and final ReLU. Compare before per-frame display normalization.
Record shape, finite-value checks, output ranges, MAE, maximum error and MAE/source range. Define justified pass thresholds. Separate GELU rewrite error from conversion/runtime error. Preserve fixtures or immutable provenance and the runnable validator. Historical values are clues, not substitutes for fresh evidence.
Acceptance: all comparisons pass with committed tooling and compact machine-readable results. No camera integration.

## 5 — Actual-model single-image WebGL benchmark

Build and run a benchmark using the actual converted graph. Require successful setBackend('webgl'), verify getBackend(), disable WEBGL_CPU_FORWARD and fail explicitly on unsupported execution. Report runtime/WebGL/renderer identity, load time, first inference, repeated warm inference of the same image, readback scope and memory before/after disposal. Keep logs copyable after failure; implement cancellation and cleanup; no image uploads.
SwiftShader results establish software-rendered WebGL compatibility only. They do not prove hardware acceleration or phone speed.
Acceptance: durable runnable benchmark and results, explicit backend identity, repeated steady timings, resource accounting and a documented viability decision. Stop if actual-model execution remains blocked.

## 6 — Model packaging and hosting

Assess generated sizes, GitHub limits, repository impact, licenses and download behavior. Prefer relative assets in existing hosting where practical, or immutable public hosting. Earlier FP32 output was about 98 MB across 24 shards. A precision change requires repeated numerical validation.
Complete asset transfer as its own task. Verify manifest/shard completeness, checksums and loading from the intended URLs. Do not treat an interrupted upload or dangling blob as published assets. For chunked binary transport, preserve bytes correctly; independently padded base64 strings cannot simply be concatenated. Verify hashes after transfer.
Acceptance: all required assets are durably available with provenance and attribution. No selectable app backend until loading works.

## 7 — Camera integration

Add an explicit TFJS WebGL compute choice. Preserve existing ONNX WASM/WebGPU options and Auto behavior. Initially support only the validated 224x224 shape. Preserve the whole view/aspect ratio using documented letterboxing; remove output padding before existing depth/relief display. Prevent unsupported resolution selection.
Reuse one-frame backpressure, pause/resume and single-frame controls. Prefer worker inference; verify worker WebGL facilities instead of assuming they exist. Fail explicitly on missing requirements. Log backend, warm-up, inference and resources; keep frames local.
Acceptance: camera path works on the working branch, accurate engine labels, output alignment, bounded loading/inference and no silent fallback. Commit without deploying.

## 8 — Lifecycle and regressions

Verify stop during download/init/inference, rapid restart, pause/step, stale responses, hide/navigation, camera permission cancellation, worker crash, context loss and repeated cycles. Ensure tracks/workers/tensors release; retain failure logs. Distinguish live tensors from retained GPU texture pools.
Run existing tests and focused new lifecycle/preprocessing checks. Test letterboxing/alignment in portrait and landscape. Check original WASM/WebGPU behavior and PWA/theme/navigation preservation. Fix discovered regressions in scope.
Acceptance: recorded checks pass, failures are resolved or explicitly block deployment; phone-only limitations remain clearly stated.

## 9 — Merge and deploy

Authorization: merge the verified implementation into main and deploy via existing GitHub Pages. Inspect latest main and reconcile intervening changes safely. Bump affected asset queries and diagnostic build IDs. Preserve Access and existing PWA/service-worker policy.
Run final relevant checks. Verify Pages success for the exact merged commit; record run URL and deployment SHA. Check asset/application URLs where access permits without bypassing authentication. Distinguish Pages success from authenticated application validation.
Acceptance: deployment verified and live state updated in DONE.md; provide a short phone test sequence. Do not claim phone performance.

## 10 — OnePlus evaluation

Device: OnePlus 12R, Android 16; previously reported Chrome 155, hardware WebGL, unusable WebGPU adapter. Ask for the existing device logs if not already supplied; do not assume current browser version.
Provide tests for WASM baseline, explicit WebGL identity/start, warm-up and repeated timings, pause/step, stop/restart, background/return, failure copying and sustained heat/responsiveness. Wait for logs before conclusions. Record WAITING FOR DEVICE LOGS if absent and stop.
Evaluate speed, memory, stability and visual outputs. Recommend retaining, tuning or withdrawing the experiment based on evidence. Make focused justified fixes within existing authorization, repeat checks and verify any new deployment.
Acceptance: real device findings recorded, or an explicit waiting state with precise requested input.

## Required final handoff for every run

- Stage/substeps completed and acceptance evidence.
- Working/outcome branch and verified checkpoint commit link.
- Current main and known deployed SHA; do not equate working-branch commits with deployment.
- Durable artifact paths/URLs, checks and material limitations.
- Exact next stage/action or blocker and required user input.
