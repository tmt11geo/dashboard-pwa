# Bounded stage prompts (stage 6 split into checkpoints)

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

## 6 — Model packaging and hosting (parent stage)

Stage 6 remains PARTIAL until 6A–6AE pass. This finer split supersedes the
previous 6B–6J scopes. Each row is ONE run. Resume partial work first; stop after
the selected checkpoint. See tools/depth-tfjs/PACKAGING.md.

| Substage | State | Exact scope |
| --- | --- | --- |
| 6A | DONE | Integrity audit and exact 25-file inventory (unchanged). |
| 6B | DONE | License/attribution and pilot transfer preparation only; no binary upload. |
| 6C | DONE | Phone upload and attachment verified. |
| 6D | DONE | Verify branch-referenced shard 1: length, SHA256 and Git blob ID from remote bytes. No upload. |
| 6E | NOT STARTED | Transfer shard 2 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6F | NOT STARTED | Transfer shard 3 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6G | NOT STARTED | Transfer shard 4 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6H | NOT STARTED | Transfer shard 5 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6I | NOT STARTED | Transfer shard 6 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6J | NOT STARTED | Transfer shard 7 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6K | NOT STARTED | Transfer shard 8 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6L | NOT STARTED | Transfer shard 9 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6M | NOT STARTED | Transfer shard 10 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6N | NOT STARTED | Transfer shard 11 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6O | NOT STARTED | Transfer shard 12 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6P | NOT STARTED | Transfer shard 13 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6Q | NOT STARTED | Transfer shard 14 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6R | NOT STARTED | Transfer shard 15 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6S | NOT STARTED | Transfer shard 16 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6T | NOT STARTED | Transfer shard 17 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6U | NOT STARTED | Transfer shard 18 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6V | NOT STARTED | Transfer shard 19 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6W | NOT STARTED | Transfer shard 20 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6X | NOT STARTED | Transfer shard 21 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6Y | NOT STARTED | Transfer shard 22 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6Z | NOT STARTED | Transfer shard 23 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6AA | NOT STARTED | Transfer shard 24 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6AB | NOT STARTED | Attach exact model.json only; verify remote bytes/hash and checkpoint. |
| 6AC | NOT STARTED | Audit all 25 branch assets and final license/provenance/integrity metadata. |
| 6AD | NOT STARTED | Verify all immutable intended URLs and downloaded hashes; record live Pages deferral to stage 9. |
| 6AE | NOT STARTED | Actual complete GraphModel load with explicit WebGL; only then mark parent stage 6 DONE. |

6B acceptance: full Apache-2.0 license, pinned hash-verified source model card,
authorship/modification notice, shard 1 local readiness evidence and this plan
are committed. No binary transfer in 6B.

For 6C, read the current head/path first. Programmatically encode shard 1 and
pass it directly to create_blob without printing binary/base64. Require expected
blob ID, create a tree referencing it, commit against the current parent and
update the branch with an expected-head lease. A dangling blob is not completion.
After attachment, verify the ref and tree path/size/blob metadata; the remote
byte SHA256 check is a separate run (6D). If interrupted, recover/attach an existing
verified blob before attempting another upload. If transport fails, capture the
exact error and stop with a blocked checkpoint; at most one diagnostic follow-up.

6D downloads/decode-checks the attached shard programmatically, then records its
remote length/SHA256/blob ID. For 6E–6AA the now-proven transport transfers and
verifies just one shard per run, committing immediately after upload. If still
too large, split that row before working. Keep per-file evidence in DONE/status.
Use unchanged FP32 bytes and manifest; no repacking/quantization or LFS pointers.
Never concatenate independently padded base64 strings. No main merge, deployment,
camera integration or phone performance claims in stage 6.

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


## Current continuation pointer — 2026-10-18

6A–6AD are DONE; DONE.md is authoritative over historical instructions above.
Next: **6AE only**, actual complete GraphModel loading with explicit WebGL and
CPU forwarding disabled. Use the immutable asset URLs in
`tools/depth-tfjs/evidence/package-urls.json`. Record load/backend/cleanup evidence
and checkpoint; mark parent stage 6 DONE only if 6AE passes. Stop before stage 7.
