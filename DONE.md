# Depth Anything TFJS WebGL — checkpoint

Updated: 2026-10-18. Repository: tmt11geo/dashboard-pwa.

## Where the work is

| Item | Location / state |
| --- | --- |
| Working branch | `depth-tfjs-webgl` |
| Branch containing this outcome | `depth-tfjs-webgl` |
| Starting main commit | `9db5c0345faf7339f3d4cc24142dad362122649e` |
| Live application branch | `main` |
| Live application commit last checked | `9db5c0345faf7339f3d4cc24142dad362122649e` |
| Live diagnostic build | `depth-lab-3` |
| New TFJS backend deployed? | No |
| Active stage | None; this is a saved handoff |
| Next stage | **6E — WAITING FOR USER UPLOAD of shard 2** |
| Current blocker | Waiting for user browser upload of verified shard 2 |
| Outcome of this checkpoint | 6E PARTIAL; shard 2 verified locally and download prepared |

Resolve the current checkpoint SHA from the branch head or the commit that last changed this file. Do not put a guessed/self-referential commit SHA here. Record completed implementation commits in the history below on subsequent checkpoints.

## Stage ledger

DONE means the stage's acceptance criteria and durable deliverables are available in the repository or verified immutable hosting. PARTIAL means useful work happened but some acceptance criteria or durable artifacts are missing.

| Stage | State | Completed work / remaining requirement |
| --- | --- | --- |
| 1. Audit and recover | **DONE** | Current main/tree/branches inspected; no AGENTS.md found; prior results preserved as historical evidence; plan and resume instructions saved. Local artifact recovery was attempted and files were absent. |
| 2. Conversion environment | **DONE** | Clean CPython 3.12.14 environment passes pip check, DepthAnythingBackbone import, TensorFlow operation and converter startup. Executable setup, complete version lock and evidence are under tools/depth-tfjs/. |
| 3. Pretrained conversion | **DONE** | Pinned source hashes verified; strict pretrained load; exact GELU smoke passed; two SavedModel → GraphModel conversions succeeded. All 24 shard hashes match between runs. Durable script, metadata and explicit regeneration/persistence arrangement in tools/depth-tfjs/CONVERSION.md; asset hosting remains stage 6. |
| 4. Numerical validation | **DONE** | Three revision/hash-pinned real images pass original vs rewrite, TFJS vs rewrite and TFJS vs original checks. Raw output shape/finite/range/error evidence and runnable tools committed under tools/depth-tfjs/. SwiftShader WebGL compatibility only. |
| 5. WebGL benchmark | **DONE** | Dedicated local worker benchmark runs actual fixed-224 graph with explicit WebGL and CPU forwarding disabled; two full first+3 warm cycles; live resources return to zero, context lost; failure/loading+inference cancel/timeout/restart checks PASS. SwiftShader compatibility only; see evidence/benchmark-results.json. |
| 6. Model packaging/hosting | **PARTIAL** | 6A–6D DONE; shard 1 attached and remote bytes verified. 6E–6AE pending; remaining 23 shards and model.json not attached. |
| 7. Camera integration | **NOT STARTED** | Letterboxing and explicit 224 px mode were proposed only. |
| 8. Lifecycle/regressions | **NOT STARTED** | Existing baseline previously passed 47 tests; new backend lifecycle is unimplemented. |
| 9. Merge/deploy | **NOT STARTED** | Main has no TFJS implementation. |
| 10. OnePlus device evaluation | **WAITING ON STAGE 9** | No phone TFJS performance evidence. |

## Stage 6 substage ledger

| Substage | State | Exact scope |
| --- | --- | --- |
| 6A | DONE | Integrity audit and exact 25-file inventory (unchanged). |
| 6B | DONE | License/attribution and pilot transfer preparation only; no binary upload. |
| 6C | DONE | User browser upload and attachment verified; see latest checkpoint below. |
| 6D | DONE | Verify branch-referenced shard 1: length, SHA256 and Git blob ID from remote bytes. No upload. |
| 6E | PARTIAL — WAITING FOR USER UPLOAD | Transfer shard 2 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
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

Complete only one substage per run. This finer split supersedes the old 6B–6J
scopes; completed 6A is unchanged. The original pilot's license/preparation is
6B, upload/attachment is 6C, and remote byte verification is 6D. Thereafter
transfer only one shard per run and commit it immediately before verification.
Resume partial work first. Parent stage 6 requires every row; a dangling blob
or inventory is not a hosted model. Never start a second substage in one run.

## Completed points

- [x] Inspect latest repository main rather than assume the supplied commit.
- [x] Check for repository AGENTS.md instructions.
- [x] Identify existing depth files, tests, worker scheduling, diagnostics and preservation requirements.
- [x] Preserve previous conversion findings and observed result values with their provenance limitations.
- [x] Establish ten bounded stages, branch tracking and reusable continuation instructions.
- [x] Commit and verify a reproducible conversion environment.
- [x] Preserve a reproducible pretrained conversion, metadata and regeneration arrangement.
- [x] Validate model outputs on three pinned real images, with raw numerical results.
- [ ] Preserve hosted model assets.
- [x] Complete the isolated WebGL benchmark and resource/cancellation checks.
- [ ] Complete camera integration, regressions, deployment and phone evaluation.

## How to continue

Use [the reusable prompt](docs/depth-tfjs-continue-prompt.md). Read [the stage prompts](docs/depth-tfjs-plan.md) and [technical handoff](docs/depth-tfjs-status.md). Complete **one stage per run** and update this ledger before stopping. Do not re-run completed stages without a concrete reason; do reproduce historical results whose artifacts are missing.

## Checkpoint history

- 2026-10-18: Initial durable handoff on `depth-tfjs-webgl`, based on main `9db5c03`. Stages 2–5 retain historical execution evidence, not completed deliverable status.

- 2026-10-18: Stage 2 reproduced from starting checkpoint `56d4d161507ef865484f84014b7eb79005758fd2` on `depth-tfjs-webgl`. Evidence: `tools/depth-tfjs/evidence/`. Current main remains `9db5c0345faf7339f3d4cc24142dad362122649e`; successful Pages run: https://github.com/tmt11geo/dashboard-pwa/actions/runs/39104746337. No app or hosting configuration changed. Exact next action: run stage 3 using the committed environment, retrieve the pinned source/config/weights, verify their SHA256 values, then implement fixed-224 export and exact GELU rewrite. Do not treat historical stage 3–5 outputs as regenerated assets.

- 2026-10-18: Stage 3 completed from checkpoint `cf3af3af3e7b73a7304fcf0f84b1cea9b8e955d6` on `depth-tfjs-webgl`. Evidence: `tools/depth-tfjs/evidence/conversion-run-{1,2}.json` and `conversion-reproduction.json`. Both conversions succeeded; 24 byte-identical shards, semantically identical GraphModel JSON, 97,817,343 total bytes. Exact GELU rewrite smoke maximum error `3.337860107421875e-6`. Binary outputs are temporary; the committed converter regenerates them from immutable verified source files. No hosted assets or app changes. Main/live remain `9db5c0345faf7339f3d4cc24142dad362122649e` (Pages run 39104746337 successful). Exact next action: stage 4 only, pin at least three real-image fixtures and compare original pretrained outputs to rewritten/converted TFJS outputs before display normalization; commit the validator, provenance and numerical results. See technical status for available local outputs and regeneration command.

- 2026-10-18: Stage 4 completed from checkpoint `73eb63f07dff9efeb4103767125bc30587f3ecb4` on `depth-tfjs-webgl`. All nine comparisons PASS; largest error across all comparisons `8.380413055419922e-5`, largest MAE/source range `1.064663832685052e-6`, against limits `1e-3` and `1e-4`. Evidence: `tools/depth-tfjs/evidence/validation-results.json`; commands and fixture provenance: `tools/depth-tfjs/VALIDATION.md`, `validation-fixtures.json`. Explicit TFJS 4.22.0 WebGL, CPU forwarding false, Chromium 141 SwiftShader. No hardware/phone speed claim. Main/live remain `9db5c0345faf7339f3d4cc24142dad362122649e` (Pages run 39104746337 verified successful). Exact next action: stage 5 only, build the dedicated actual-model benchmark with repeated same-image timing, cancellation/failure logs and lifecycle/resource accounting. Do not integrate or deploy yet.

- 2026-10-18: Stage 5 completed from `59985fa561e435e96c54e125aaeaed5bbe1ad373` on `depth-tfjs-webgl`. Evidence: `tools/depth-tfjs/evidence/benchmark-results.json` and `benchmark.log`; runnable UI/worker/harness and commands in `BENCHMARK.md`. Two actual-model cycles each completed first+3 warm inferences of the identical stage 4 tensor. Warm medians 8078.1 / 8142.3 ms including readback (SwiftShader only). Normal disposal returned live tensors/data/GPU bytes to zero; 674,886,468 pooled bytes remained before backend removal/context loss. All seven checks PASS, including forced failure, loading/inference cancellation, timeout and restart. Viability: continue experimental packaging, with high memory/startup costs and real-device speed/support still unproven. Main/live unchanged at `9db5c0345faf7339f3d4cc24142dad362122649e`; Pages run 39104746337 successful. Exact next action: stage 6 only, package/license/host the validated FP32 graph and all 24 shards, verify intended URLs, hashes and actual loading. No app integration or deployment in this run.


- 2026-10-18: Stage 6A completed from `1b8409a367a1e816490aab117b35577f22d2d4e1` on `depth-tfjs-webgl`. User requested smaller chunks after blob-creation interruption. Recovered local stage 4 graph: all 25 files match stage 3 run-2 lengths/SHA256; 24 manifest shards total 97,145,740 bytes, complete graph 97,817,343 bytes. All expected Git blob IDs independently match `git hash-object`; corrupt/missing graph guards pass. Evidence: `tools/depth-tfjs/evidence/package-{inventory,checkpoint}.json`; verifier and `PACKAGING.md`. Recursive starting tree has no AGENTS.md or model assets; interrupted uploads cannot be recovered from branch state. No upload attempted in 6A. Main/live remain `9db5c0345faf7339f3d4cc24142dad362122649e`, Pages run 39104746337 verified successful. Exact next action: **6B only**, transfer `group1-shard1of24.bin` to `models/depth-anything-v2-small-tfjs-fp32-224-v1/`, commit and verify remote length/SHA256/blob ID. If transport fails, save a blocked checkpoint and stop. No application/deployment changes.

- 2026-10-18: Stage 6B (new smaller scope) completed from `d13dabeee16b56d001d8f3fa55c78ccc98edad36` on `depth-tfjs-webgl`. Split old 6B into license/preparation (6B), shard 1 upload/attachment (6C), remote byte verification (6D); all subsequent transfers are one shard each (6E–6AA), followed by separate manifest, audit, URL and load checkpoints (6AB–6AE). No partial branch assets were found to resume. Full Apache-2.0 text, exact hash-verified pinned Keras model card, authorship and modification notice committed at the model destination. Local shard 1 still matches 4,194,304 bytes, SHA256 `9fa4b753d284376f2bfd5831f583dec5c879dcdf92ddc41187732ec864c29855`, blob `465c35791bb7139749f64bd758c46971a7607477`. Evidence: `tools/depth-tfjs/evidence/package-license-checkpoint.json`. No binary upload attempted; transport remains unproven. Main remains `9db5c0345faf7339f3d4cc24142dad362122649e`; Pages run 39104746337 rechecked successful for that SHA. Exact next action: **6C only**, inspect the current branch/path and attempt one programmatic base64 upload of shard 1 through the connected integration, compare blob ID, immediately attach to a branch commit and checkpoint; stop on transport failure. Do not start 6D remote hash verification or shard 2 in that run.

## Stage 6C split — preparation checkpoint, 2026-10-18

This section supersedes earlier instructions to upload and attach shard 1 in one run.
User requested a durable checkpoint before the large binary tool call.

| Substage | State | Scope |
| --- | --- | --- |
| 6C1 | DONE | Check branch/path and local shard identity; commit preparation and stop before another binary upload. |
| 6C2 | DONE (user upload) | Inspect branch/path and recover expected blob if available; otherwise attempt one programmatic binary upload. Commit a small receipt or exact blocker to this branch, then stop. |
| 6C3 | DONE (user upload attachment) | Attach the expected blob to the model path using tree/commit/leased ref update; verify ref and tree path, size and blob ID; checkpoint and stop. |

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


## Stage 6D complete — remote bytes verified, 2026-10-18

Working/outcome branch: depth-tfjs-webgl; starting commit cefe6c4c8f4d20dadfbae0c47a2b9c98ebe0b8aa.
Downloaded shard 1 from the immutable raw GitHub URL recorded in
`tools/depth-tfjs/evidence/package-shard1-remote.json`, using Python urllib
with a 30-second timeout. HTTP 200; complete response: 4,194,304 bytes.
Independent SHA256: 9fa4b753d284376f2bfd5831f583dec5c879dcdf92ddc41187732ec864c29855.
Independent Git blob ID: 465c35791bb7139749f64bd758c46971a7607477.
All three assertions match the committed package inventory; process exit 0.
Connected integration confirmed the branch-referenced path/blob/size; complete
recursive tree has no AGENTS.md and only shard 1 among the binary model assets.
6D DONE; no blocker. Stage 6 remains PARTIAL; complete model loading is not yet possible.
Main remains 9db5c0345faf7339f3d4cc24142dad362122649e. No app, Access, PWA or deployment changes;
no new deployment check claimed. This run changes documentation/evidence only.

Exact next action: **6E only**, transfer and verify shard 2. First inspect current
branch/path and resume any user upload. Use the proven phone/browser upload handoff
if absent: prepare verified shard 2 for download and checkpoint WAITING FOR USER
UPLOAD; after upload verify immutable remote bytes. Do not repeat the interrupted
multi-megabyte create_blob path. Do not upload shard 2 during this 6D run.
This pointer supersedes all historical next-action paragraphs.


## Stage 6E partial — shard 2 phone upload ready, 2026-10-18

Working/outcome branch: depth-tfjs-webgl; starting commit e59a83b7a83e40139f470a9f7c759154ec209022.
Fresh complete recursive tree: no AGENTS.md and no shard 2 path.
Recovered original group1-shard2of24.bin and verified length 4,194,304 bytes,
SHA256 29341eab5d3feed201a3c539f4fc5f69c9f2534ceeced61bbcabc8e9a472492a,
Git blob 63c58b0a76b53613d829b08b8f8655b7052fd50a. All match package-inventory.json.
Download copy: /workspace/scratch/c49fd39fc577/group1-shard2of24.bin (temporary).
Evidence: tools/depth-tfjs/evidence/package-shard2-preparation.json.
6E PARTIAL / WAITING FOR USER UPLOAD. No binary tool upload attempted.

Exact next action: user downloads unchanged shard 2 and uploads it through GitHub
website into models/depth-anything-v2-small-tfjs-fp32-224-v1 on depth-tfjs-webgl,
committing only that file. Then resume 6E: inspect current head/path, download bytes
from immutable commit URL and verify length/SHA256/blob against inventory, commit
receipt and mark 6E DONE only on success. Do not begin 6F or upload shard 3.
Main/live last checked at 9db5c0345faf7339f3d4cc24142dad362122649e; no deployment
performed or rechecked. No app/Access/PWA changes. Only documentation/evidence changed.
