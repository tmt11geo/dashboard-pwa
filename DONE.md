# Depth Anything TFJS WebGL — checkpoint

## Movement guidance follow-up — 2026-10-23

User reports additions remain difficult and requested a visible movement amount. Scope: this UX/capture-guidance follow-up only; original stage 10 remains PARTIAL. Starting/outcome branch depth-tfjs-webgl at 8f23c7f80e62f9bcd84bf817fbc0e4dfa3afac87; starting main 1df5e0fb48d13e3a645a17b0a7808e1090ef2cca.

Build depth-lab-7 adds local 72px preview translation matching against the last accepted capture. Camera overlay shows direction, progress, approximate image shift and a suggested 6–14% range. Small movement asks for more; sufficient movement asks to hold still; overshoot points back; weak or ambiguous overlap asks to return. Capture requires a first view or a confident shift in range, plus existing stability/cooldown/retry checks. Accepted-view flash, pause, cleanup and saved scenes retained. This is a heuristic image translation, not camera pose, degrees, centimetres, or a guarantee of successful 3D alignment. Rotation, parallax, repetitive texture and moving objects can make it uncertain. Actual-model registration and thresholds unchanged.

Validation: 68 Node tests PASS; 22 local Chromium UI checks PASS, including uncertain-overlap gating, overshoot arrow, three registered additions, pause/resume, stop cleanup and file roundtrip. Evidence: tools/depth-scan/evidence/node-tests-v7.log and browser-ui-v7.json. Synthetic rendered camera + inference double + real registration; no new physical-phone performance or real-model claim. Phone screenshot reviewed. Fixtures use larger sideways steps for the new movement target; old evidence preserved.
Deployment receipt: main 21523a1e26f1702b807c8842509c81b5e75dd972, build depth-lab-7; Pages run 40007740622 succeeded for that exact SHA. This documentation receipt is on depth-tfjs-webgl. Remote refs and checkpoint files verified through GitHub.
Blocker: OnePlus guidance/registration acceptance is still unverified; live automated requests were previously blocked by Access.
Exact next action: open depth.html?v=7, confirm depth-lab-7. After the first accepted view, move sideways following the arrow until the bar fills and HOLD STILL appears; keep still until the accepted-view green flash. If overshooting, follow the return arrow. Try 3–5 views and send diagnostic logs plus whether the guidance reaches the target and additions align. Keep phone pointing the same way. Working/outcome branch: depth-tfjs-webgl.

## Compact scan controls and move cue — 2026-10-23

User-requested device UX follow-up only, based on depth-tfjs-webgl ecbf42d357670c31b354e5b6260ca5a6f135a565; main before this change faf6339373a38345905949b864cd1c651ccc9689.
Build depth-lab-6 places camera and relief together with sticky Start/Pause/Finish controls and guidance immediately above, rotation and file controls below. Compute/single-frame controls are collapsed. Each accepted scene addition gets one soft green pulse across both views and MOVE NOW; capture/alignment say wait for green. Pause clears the pulse, deferred acceptance cues wait until resume, and pending captures never invite movement on resume. Reduced-motion mode uses a static outline.

Validation: 64/64 Node tests and 19/19 local Chromium browser checks PASS. Evidence: tools/depth-scan/evidence/browser-ui-v6.json and node-tests-v6.log; harness tools/depth-scan/run_browser.cjs. Phone-sized screenshot visually inspected; side-by-side geometry, adjacent controls, no horizontal overflow, reduced motion, pause/resume, finish, file save/open/reload checked. Browser uses an inference double with real registration. Existing actual-model feasibility evidence is preserved; no phone performance or physical acceptance claim. Model, registration and capture thresholds unchanged.

Deployment receipt: main implementation 1df5e0fb48d13e3a645a17b0a7808e1090ef2cca, build depth-lab-6. Pages run 40006383084 completed successfully for that exact SHA. Working/outcome branch depth-tfjs-webgl adds this documentation receipt. Remote refs and checkpoint files verified through the connected GitHub integration. Protected live-browser validation remains a device action.
Blocker: physical-device usability acceptance remains pending; automated live requests were previously blocked by Access (403/1010).
Exact next action: open depth.html?v=6 on OnePlus, confirm depth-lab-6, start a scan, hold until green MOVE NOW, shift slightly sideways, hold for the next addition; repeat 3–5 times, then Pause/Finish/Save/Open. Report cue visibility, responsiveness and alignment with the diagnostic log. Working/outcome branch depth-tfjs-webgl. Original stage 10 remains PARTIAL; no new conversion stage started.

Updated: 2026-10-23. Repository: tmt11geo/dashboard-pwa.

## Where the work is

| Item | Location / state |
| --- | --- |
| Working branch | `depth-tfjs-webgl` |
| Branch containing this outcome | `depth-tfjs-webgl` |
| Starting main commit | `9db5c0345faf7339f3d4cc24142dad362122649e` |
| Live application branch | `main` |
| Live application commit last checked | `21523a1e26f1702b807c8842509c81b5e75dd972` |
| Live diagnostic build | `depth-lab-7` |
| New TFJS backend deployed? | Yes; Pages success verified, authenticated device check pending |
| Active stage | Guided scan deployed; waiting for OnePlus acceptance |
| Next stage | OnePlus guided-scan acceptance |
| Current blocker | Physical guided-scan observations needed; automated live URLs return 403/1010 |
| Outcome of this checkpoint | Movement amount, direction and overlap guidance deployed; Pages success verified |

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
| 6. Model packaging/hosting | **DONE** | 6A–6AE DONE; complete package integrity, immutable URLs, actual WebGL load/inference and cleanup verified. Live Pages deferred to stage 9. |
| 7. Camera integration | **DONE** | Explicit TFJS WebGL worker, fixed-224 letterboxing/crop, backpressure and diagnostics; actual app/model smoke PASS. |
| 8. Lifecycle/regressions | **DONE** | 56 Node tests, 23 actual-browser lifecycle checks and 8 deployment-prefix checks PASS; phone evaluation remains stage 10. |
| 9. Merge/deploy | **DONE** | Exact merged SHA deployed successfully; live automated requests blocked by Cloudflare. |
| 10. OnePlus device evaluation | **PARTIAL** | Hardware WebGL phone log received; responsiveness issue; lifecycle/baseline/heat pending. |

## Stage 6 substage ledger

| Substage | State | Exact scope |
| --- | --- | --- |
| 6A | DONE | Integrity audit and exact 25-file inventory (unchanged). |
| 6B | DONE | License/attribution and pilot transfer preparation only; no binary upload. |
| 6C | DONE | User browser upload and attachment verified; see latest checkpoint below. |
| 6D | DONE | Verify branch-referenced shard 1: length, SHA256 and Git blob ID from remote bytes. No upload. |
| 6E | DONE | Transfer shard 2 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6F | DONE | Transfer shard 3 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6G | DONE | Transfer shard 4 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6H | DONE | Transfer shard 5 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6I | DONE | Transfer shard 6 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6J | DONE | Transfer shard 7 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6K | DONE | Transfer shard 8 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6L | DONE | Transfer shard 9 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6M | DONE | Transfer shard 10 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6N | DONE | Transfer shard 11 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6O | DONE | Transfer shard 12 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6P | DONE | Transfer shard 13 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6Q | DONE | Transfer shard 14 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6R | DONE | Transfer shard 15 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6S | DONE | Transfer shard 16 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6T | DONE | Transfer shard 17 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6U | DONE | Transfer shard 18 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6V | DONE | Transfer shard 19 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6W | DONE | Transfer shard 20 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6X | DONE | Transfer shard 21 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6Y | DONE | Transfer shard 22 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6Z | DONE | Transfer shard 23 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6AA | DONE | Transfer shard 24 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6AB | DONE | Attach exact model.json only; verify remote bytes/hash and checkpoint. |
| 6AC | DONE | Audit all 25 branch assets and final license/provenance/integrity metadata. |
| 6AD | DONE | Verify all immutable intended URLs and downloaded hashes; record live Pages deferral to stage 9. |
| 6AE | DONE | Actual complete GraphModel load with explicit WebGL; only then mark parent stage 6 DONE. |

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
- [x] Preserve hosted model assets.
- [x] Complete the isolated WebGL benchmark and resource/cancellation checks.
- [x] Complete camera integration and regressions.
- [ ] Complete deployment and phone evaluation.

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


## Stage 6E complete — shard 2 remote verification, 2026-10-18

Working/outcome branch: depth-tfjs-webgl; user upload/start commit 42e5bf8a83bac3ab922184351edbf41cdee593a2.
Connected GitHub tree confirms correct model path, mode 100644, 4,194,304 bytes,
blob 63c58b0a76b53613d829b08b8f8655b7052fd50a. No AGENTS.md found.
Independently downloaded complete shard bytes via Python urllib from the immutable
raw GitHub URL at that commit (HTTP 200, timeout 30s). Length, SHA256
29341eab5d3feed201a3c539f4fc5f69c9f2534ceeced61bbcabc8e9a472492a and Git blob
ID all exactly match package-inventory.json. All assertions pass, exit 0.
Evidence: tools/depth-tfjs/evidence/package-shard2-remote.json.
6E DONE; no blocker. Stage 6 remains PARTIAL; shards 1 and 2 now verified.
Exact next action: **6F only**, shard 3. Inspect current head/path; if absent,
prepare the verified local shard for phone/browser upload and checkpoint waiting.
After upload verify immutable remote bytes before marking 6F complete. Do not
retry the interrupted large create_blob path. No shard 3 work in this run.
Main/live last checked at 9db5c0345faf7339f3d4cc24142dad362122649e; no deployment
performed or rechecked. App, Access and PWA unchanged. This supersedes earlier
6E waiting/next-action text. Documentation and evidence only in this checkpoint.


## User-authorized paired upload: 6F + 6G, 2026-10-18

User explicitly requested the next two shards in one upload; this overrides the
one-substage restriction for this pair only. Starting/outcome branch depth-tfjs-webgl,
starting commit 98562dffeb027fb2a0adbe634434cee89d2b68d1. Fresh recursive tree has no AGENTS.md or shard 3/4.
Both originals recovered; lengths, SHA256 and Git blob IDs verified against inventory.
Download copies prepared at /workspace/scratch/c49fd39fc577/group1-shard{3,4}of24.bin.
Evidence: tools/depth-tfjs/evidence/package-shards3-4-preparation.json.
6F and 6G PARTIAL / WAITING FOR USER UPLOAD; neither is complete yet.
Exact next action: upload both unchanged files into
models/depth-anything-v2-small-tfjs-fp32-224-v1 on depth-tfjs-webgl in one commit.
Then inspect current head and independently download/hash both immutable remote
files; mark each stage DONE only if its length/SHA256/Git blob checks pass.
Stop after this pair; do not start 6H/shard 5. No binary tool upload attempted.
Main/live last checked at 9db5c0345faf7339f3d4cc24142dad362122649e; no app,
Access, PWA or deployment changes; deployment not rechecked.


## Stages 6F + 6G complete — paired remote verification, 2026-10-18

User-authorized pair verified on depth-tfjs-webgl, upload/start commit
74791062c1c1600dc2f431a5a0f7b299887fea07. Remote tree confirms correct paths/mode 100644;
no AGENTS.md found. Independently downloaded both complete files at immutable
raw GitHub commit URLs using Python urllib (30s timeout) and hashlib.
Both HTTP 200, 4,194,304 bytes; SHA256 and Git blob IDs exactly match inventory.
All assertions passed, exit 0. Evidence: tools/depth-tfjs/evidence/package-shards3-4-remote.json.
6F DONE and 6G DONE; no blocker. Shards 1–4 verified; stage 6 still PARTIAL.
Exact next action: **6H only, shard 5**. Inspect current branch/path; if absent,
prepare verified file for phone/browser upload and checkpoint waiting. Verify
immutable remote bytes after upload before marking complete. Stop after 6H;
paired authorization applied only to shards 3 and 4. No shard 5 work in this run.
Main/live last checked at 9db5c0345faf7339f3d4cc24142dad362122649e; no deployment
performed or rechecked; no app, Access or PWA changes. This supersedes earlier
paired waiting instructions. This checkpoint changes documentation/evidence only.


## User-authorized remaining-shard batch — 2026-10-18

User requested all remaining shards for one download/upload. This explicitly
supersedes the one-shard restriction for shards 5–24 (6H–6AA) only.
Branch depth-tfjs-webgl; starting commit 893c02a6dec3d470f62755038fe42466dfa8c368.
Fresh tree contains shards 1–4 only and no AGENTS.md.
All 20 original shards 5–24 independently match inventory length/SHA256/Git blob ID.
Prepared flat ZIP depth-shards-05-24.zip: 74,872,666 bytes; uncompressed 80,368,524 bytes.
ZIP SHA256 c66e9d315c1ba6b2d9773feec37a1c5781a98df5c446056fe548f3f82195a6ae.
Reopened ZIP, CRC check passed, all 20 extracted member SHA256 values match inventory.
Temporary download: /workspace/scratch/c49fd39fc577/depth-shards-05-24.zip.
Evidence: tools/depth-tfjs/evidence/package-shards5-24-preparation.json.
6H–6AA PARTIAL / WAITING FOR USER UPLOAD. No binary tool upload attempted.

Exact next action: user extracts ZIP on phone and uploads its 20 .bin files directly
into models/depth-anything-v2-small-tfjs-fp32-224-v1 on depth-tfjs-webgl in one commit.
Do not upload ZIP itself or an enclosing folder. After upload inspect branch/tree,
independently download and verify each immutable remote shard, commit evidence and
mark only passing rows DONE. Stop after this authorized batch. model.json remains
6AB, not included or started; final audit/URLs/model load remain 6AC–6AE.
Main/live last checked at 9db5c0345faf7339f3d4cc24142dad362122649e; no app,
Access, PWA or deployment changes; no new deployment verification claimed.


## Remaining batch partially uploaded — 2026-10-18

Branch depth-tfjs-webgl; inspected upload/start commit f7ae565fe9cfd937ce9f456c3209e207041b94f6.
Complete recursive tree has shards 1–4 and 9–24. Shards 5,6,7,8 are absent;
no AGENTS.md found. All 16 newly uploaded shards 9–24 independently downloaded
from immutable raw GitHub URLs, HTTP 200; lengths/SHA256/Git blob IDs all match
package inventory (Python urllib, timeout 30s, hashlib; exit 0).
Evidence: tools/depth-tfjs/evidence/package-shards5-24-remote.json.
6L–6AA DONE (shards 9–24). 6H–6K remain PARTIAL/WAITING FOR USER UPLOAD (5–8).
Together with prior verified shards 1–4, 20 of 24 shards are verified.

Exact next action: user uploads only group1-shard5of24.bin, group1-shard6of24.bin,
group1-shard7of24.bin and group1-shard8of24.bin from the previously supplied ZIP
into models/depth-anything-v2-small-tfjs-fp32-224-v1 on depth-tfjs-webgl.
Then verify these four immutable remote files and checkpoint; no need to reupload
9–24. model.json remains absent and stage 6AB is not started. Stop after closing
this batch; do not begin model.json or final package audit in the same run.
Main/live last checked at 9db5c0345faf7339f3d4cc24142dad362122649e; no deployment
performed/rechecked, no application/Access/PWA changes. Only docs/evidence changed.


## Remaining shard batch complete — 2026-10-18

Branch depth-tfjs-webgl; upload/start commit c6cc4c87f2aa398ead679e168a5c6f95ab99a6a6.
Fresh complete recursive tree: all 24 shard paths, sizes and Git blob IDs match
inventory; no AGENTS.md found. Shards 5–8 independently downloaded from immutable
raw GitHub commit URLs: HTTP 200, each 4,194,304 bytes; SHA256 and Git blob hashes
all exactly match inventory. Python urllib (30s timeout), hashlib, four assertions
pass, process exit 0. Evidence: tools/depth-tfjs/evidence/package-shards5-8-remote.json.
6H–6K DONE; combined with earlier verification 6A–6AA DONE. All 24 shards verified
across recorded runs and still present with identical blob IDs in this tree.
No blocker for shard transfer. Parent stage 6 remains PARTIAL: model.json absent,
complete distribution audit, URL checks and actual model loading still pending.
Exact next action: **6AB only**, attach exact inventory-matching model.json,
verify its remote bytes, update checkpoint and stop. No model.json work in this run.
Main/live last checked at 9db5c0345faf7339f3d4cc24142dad362122649e; no deployment
performed/rechecked or app/Access/PWA changes. Documentation/evidence only.
This pointer supersedes all earlier missing-shard and batch-waiting instructions.


## Stage 6AB complete — exact model.json attached and verified, 2026-10-18

Working/outcome branch: `depth-tfjs-webgl`; starting commit
`7e037875f341f89d11d6d5526f7d89b60662e1ab`.
Original local model.json passed inventory length/SHA256/Git blob checks.
Attached unchanged UTF-8 bytes through the connected GitHub integration in commit
`8d6ba9f6e6fa1708f3cc445bdba9f1624e7df7bf`, then updated the branch with an expected-head lease.
Remote tree confirms intended model path, mode 100644, 671,603 bytes and blob
`8daa3840f06ea22aa70b144e53e66c51befbb0ea`.
Independently downloaded immutable remote bytes using Python urllib (30-second
timeout): HTTP 200; length 671,603; SHA256
`5ab6f29764edf13ae194d53a23f09ece13a6bce1edd5de2b2d820c8a1e2a7c3f`;
Git blob ID matches inventory. JSON parse passed; all assertions passed.
Evidence: `tools/depth-tfjs/evidence/package-model-remote.json`.
Fresh complete starting tree contained no AGENTS.md or model.json; no partial
manifest upload was present. 6AB DONE; no blocker. Parent stage 6 remains PARTIAL.

Main has advanced independently to `d9651e62b82ae1f4152e1ed2414b5f285e7c06cf`:
its upload commit adds duplicate shards 5–8 at repository root. Pages run
https://github.com/tmt11geo/dashboard-pwa/actions/runs/39132225480
completed successfully for that exact SHA. Preserve/reconcile this intervening
main work during stage 9; no main edits or deployment were made by this run.
The feature branch retains the correctly located shards. This run adds only
model.json and checkpoint documentation/evidence; app, Access and PWA unchanged.

Exact next action: **6AC only**. Read current branch/head and audit all 25 model
assets against package-inventory.json plus final license/provenance/integrity
metadata. Commit evidence and updated checkpoint, then stop. Full immutable URL
checks remain 6AD and actual explicit-WebGL GraphModel load remains 6AE.
This pointer supersedes historical next-action text; 6AC was not started here.


## Stage 6AC complete — distribution audit, 2026-10-18

Working/outcome branch: `depth-tfjs-webgl`; audited starting commit
`56e4193b402ca4630207684f92e3af57978796ca`.
Connected GitHub integration returned the complete recursive tree (no AGENTS.md).
All 25 asset paths, modes 100644, sizes and Git blob IDs match the inventory.
A fresh Git checkout of that exact commit independently passed SHA256, length
and Git blob checks for every asset against the inventory and conversion-run-2.
The manifest references exactly 24 unique, ordered relative shards; declared
unquantized weights total 97,145,740 bytes, full model 97,817,343 bytes.
The exact pinned model card and full Apache-2.0 license still match their stage
6B lengths/hashes; source revision agrees across conversion/inventory/provenance.
Authorship and modification notice retained; stale pre-upload wording and relative
provenance links corrected. No model bytes changed.

Reproduce: `python tools/depth-tfjs/audit_package.py` (Python standard library + Git,
exit 0). Evidence: `tools/depth-tfjs/evidence/package-audit.json`.
6AC DONE; blockers: none. Parent stage 6 remains PARTIAL.
Main/live is `7386a02552ee1e8d55a52bd5025d5112614ea276`; Pages run
https://github.com/tmt11geo/dashboard-pwa/actions/runs/39133290852 completed
successfully for that exact SHA. Main's separate cleanup removed root duplicates;
correct feature-branch assets remain intact. No app, Access, PWA, main or deployment
changes in this run. Preserve current main during stage 9 reconciliation.

Exact next action: **6AD only**. Pin the current feature-branch commit, download
all 25 assets from their intended immutable raw GitHub URLs, verify full response
length/SHA256/Git blob against inventory, and commit URL/hash evidence plus updated
DONE/status. Live custom-domain Pages checks remain deferred to stage 9. Stop
after 6AD; actual explicit-WebGL GraphModel loading remains 6AE.
This supersedes earlier continuation pointers. No URL sweep or runtime load was
performed in 6AC; Git checkout verification is not a claim about HTTP model loading.


## Stage 6AD complete — immutable URLs verified, 2026-10-18

Working/outcome branch: `depth-tfjs-webgl`; starting and asset commit:
`e1477f06af60f6cba2ff1271f4e98ee7bb858e80`.
Fresh connected-integration recursive tree was complete and had no AGENTS.md.
Downloaded every asset from the commit-pinned raw.githubusercontent.com path
under `models/depth-anything-v2-small-tfjs-fp32-224-v1/`.
All 25 URLs returned HTTP 200 without redirects. Complete downloaded lengths,
SHA256 and Git blob IDs match `package-inventory.json`: 97,817,343 bytes total.
The downloaded model.json parses and references the exact 24 ordered relative
shard paths. No model bytes or application files changed.

Command (Python 3.12.14, standard library, four concurrent downloads, 30-second
socket timeout, no automatic retries):
`python tools/depth-tfjs/verify_package_urls.py --commit e1477f06af60f6cba2ff1271f4e98ee7bb858e80`
Evidence: `tools/depth-tfjs/evidence/package-urls.json`, including every immutable
URL, response status, length and both hashes. All checks passed; process exit 0.
6AD DONE; blockers: none. Parent stage 6 remains PARTIAL pending 6AE.

Main/live remains `7386a02552ee1e8d55a52bd5025d5112614ea276`; Pages run
https://github.com/tmt11geo/dashboard-pwa/actions/runs/39133290852 rechecked
completed/success for that exact SHA. No merge/deployment/Access/PWA changes.
Live custom-domain Pages URL and authenticated application checks are deferred
to stage 9. Raw HTTP success does not establish browser CORS, WebGL loading,
phone speed, or the availability of the feature branch on live Pages.

Exact next action: **6AE only**. Use the verified complete package and committed
benchmark/validation tooling to perform an actual GraphModel load with explicit
WebGL and CPU forwarding disabled; record runtime/backend identity, load outcome,
errors and cleanup. If successful, checkpoint 6AE and parent stage 6 DONE, then
stop before stage 7 camera integration. If blocked, preserve evidence and exact
blocker instead. This pointer supersedes historical continuation instructions.


## Stage 6AE complete — packaged GraphModel WebGL load, 2026-10-18

Branch: depth-tfjs-webgl. Starting commit: 591483b4c68b45656d61ae7106303135e2fde5f3.
User explicitly authorized at least three steps this run: 6AE, 7, 8; stop before deployment.
`run_package_load.cjs` verified all branch model bytes and pinned TFJS/input hashes,
served the actual package at its relative models path on loopback HTTP, and ran
the existing dedicated-worker benchmark. All 25 assets fetched. TFJS 4.22.0,
WebGL, WEBGL_CPU_FORWARD=false, Chromium 141 / SwiftShader. First plus three warm
inferences PASS. Load 525.4 ms; first 12319 ms; warm median 9335.2 ms (local HTTP,
software renderer only). Finite [1,224,224,1] outputs; live tensor/data/GPU counters
returned to zero, backend removed, context lost. Texture pools reported separately.
Evidence: tools/depth-tfjs/evidence/package-load.json. Runner: run_package_load.cjs.
Command: NODE_PATH=<playwright modules> DEPTH_CHROMIUM=<headless_shell> node
 tools/depth-tfjs/run_package_load.cjs <verified tf.js> <prepared fixtures> <report>.
Exit 0. Dependencies and fixture regeneration: VALIDATION.md. All stage 6 rows DONE.
No blockers. No physical camera/hardware-GPU/phone performance claim; no live Pages
validation. Main remains 7386a02552ee1e8d55a52bd5025d5112614ea276 (successful Pages
run 39133290852 checked in 6AD); no deployment in this step.
Next: stage 7 camera integration, fixed-224 letterboxing, explicit TFJS WebGL,
worker/backpressure/diagnostics, preserve ONNX paths. Then stage 8 as authorized.


## Stage 7 complete — explicit TFJS camera option, 2026-10-18

Branch: depth-tfjs-webgl. Preceding 6AE checkpoint: 7fe68183a1a0175411bf6e239e7466468c36a392.
Added separate TFJS worker and fixed-224 NHWC helpers; explicit WebGL/no CPU
forwarding, relative same-origin model paths, full-view letterboxing and matching
raw depth/colour crop. Existing ONNX Auto/WASM/WebGPU path preserved. Resolution
is locked for TFJS; loading/inference deadlines, one-frame backpressure, pause/step,
copyable identity/timing/memory/errors, context-loss handling and termination remain
explicit. TFJS runtime version and license linked; no runtime bundle redistribution.
Actual page + actual model smoke passed eight checks with a simulated camera:
fixed resolution, correct 224x168 landscape output, engine label, pause/step,
WebGL identity, ended tracks, controls restored, all 25 package assets requested.
Evidence: tools/depth-tfjs/evidence/camera-smoke.json; runner and CAMERA.md committed.
Existing depth tests: 9/9 PASS (`node --test tests/depth*.test.mjs`). JS syntax and
`git diff --check` pass. No physical-camera/phone performance claim.
Main/live remains 7386a02552ee1e8d55a52bd5025d5112614ea276; no deployment,
Access, map, theme, tracker, navigation, manifest or service-worker changes.
Blockers: none. Exact next action: stage 8 only, test lifecycle failures, timeouts,
stale responses, repeated runs and portrait/landscape alignment; fix regressions,
commit evidence. User authorized continuing to stage 8 in this run. Stage 9 excluded.


## Stage 8 complete — lifecycle and regression evidence, 2026-10-18

Working/outcome branch: depth-tfjs-webgl. Preceding stage 7 checkpoint:
9342505ffdca403362b78ba1878d4e586547ba3c. User authorized three steps; 6AE, 7 and 8
are now complete. Stop before stage 9; no merge/deployment in this run.

`node --test tests/*.test.mjs`: 56/56 PASS. Includes new exhaustive pixel alignment
and normalized-padding checks in landscape, portrait, square and widescreen;
invalid/nonfinite guards; fixed loading/inference deadlines; stale responses;
worker crash/message errors; hide/navigation; late permissions/denial; switching
back to Auto/WASM/WebGPU; unsupported worker/backend and silent-CPU rejection.
Actual browser/TFJS worker lifecycle: 23 checks PASS. Covers missing-model error,
Stop during real HTTP loading and inference, both parent deadline paths, portrait
restart with actual inference, two-frame stable live resources, actual WebGL context
loss, camera tracks ended after each interruption, navigation worker destruction.
Separate `/dashboard-pwa/` prefix run: 8 checks PASS, including correct relative
worker/module/model resolution and all 25 package assets. Browser tests use a local
pinned scene as a simulated camera and the hash-verified pinned TFJS runtime.
TFJS 4.22.0, Chromium 141, SwiftShader, WebGL CPU forwarding false.

After each portrait inference: 562 model tensors/data buffers, 97,145,740 live
CPU bytes, 97,392,336 live GPU bytes; no per-frame growth. Allocated GPU pool was
674,689,860 then 674,886,468 bytes; this retained pool is not reported as a leak or
as freed. Stop terminates the worker; post-termination GPU counters unavailable.
Stage 6AE separately measured normal model/backend/context disposal to zero.
Added an inference-start diagnostic to make cancellation timing observable.

Evidence: tools/depth-tfjs/evidence/stage8-results.json, stage8-node-tests.log,
camera-lifecycle.json, camera-prefix.json. Reproduction: CAMERA.md.
JS syntax and diff whitespace checks PASS. Protected files compared byte-for-byte
to current main: map/navigation/theme/tracker/PWA and existing ONNX worker/core/
diagnostics unchanged. ONNX preservation is backed by unchanged source and tests;
no new actual ONNX device inference claim. No physical camera/phone/hardware-GPU
performance evidence; stage 10 remains required. Stage 8 blockers: none.

Main/live still 7386a02552ee1e8d55a52bd5025d5112614ea276. Pages run
https://github.com/tmt11geo/dashboard-pwa/actions/runs/39133290852 rechecked
completed/success for this exact SHA. No Access/configuration/deployment changes.

Exact next action: **stage 9 only**. Inspect latest main and reconcile intervening
changes (root duplicates already removed), bump affected asset queries and diagnostic
build IDs, run final relevant checks, merge verified implementation and deploy via
the existing Pages setup, preserving Cloudflare Access. Verify Pages for the exact
merged commit and accessible asset URLs without bypassing authentication. Record
live state and provide OnePlus test instructions. Do not claim phone results or
start stage 10 automatically. This pointer supersedes historical instructions.


## Stage 9 deployment preparation — 2026-10-18

Working branch depth-tfjs-webgl; starting commit 87e998cd3d1dbe98313d5558b24c6a8fe9b43dbb.
Main 7386a02552ee1e8d55a52bd5025d5112614ea276 has no net tree changes since
the common ancestor (duplicate root shards uploaded then removed). No AGENTS.md.
Bumped diagnostic build to depth-lab-4, page script to depth.js?v=5 and
diagnostics import to v=3. New TFJS worker/core retain their first-release v=1.
56/56 Node tests PASS; full 25-file package audit PASS; git diff --check PASS.
Evidence: tools/depth-tfjs/evidence/stage9-node-tests.log and stage9-package-audit.json.
Protected existing app files and service-worker policy unchanged. Prior stage 8
actual-model browser/prefix evidence remains applicable; only build/cache IDs changed.
Stage 9 PARTIAL pending merge and exact Pages deployment verification.
Exact next action: merge this verified tree with current main, verify the resulting
Pages run and protected URLs, then save deployment receipt and phone test handoff.
No stage 10 execution or phone performance claim.


## Stage 9 complete — merge and deployment verified, 2026-10-18

Working/outcome checkpoint branch: depth-tfjs-webgl. Starting feature commit:
87e998cd3d1dbe98313d5558b24c6a8fe9b43dbb. Preparation commit:
207458ca50a92ad01d9949f4be0f07567c81d7d5. Merged/deployed main: e599a76ad2a48e97650545f64980abf4756de3e8.
The merge has both main and feature parents, preserves main's duplicate-shard
cleanup and uses the exact verified preparation tree 068f6f605347661dbaf476bc8b6c1473d8cde977.
Main had no net changes since the common ancestor; no AGENTS.md found.
Connected integration updated refs with expected-head leases.

Pages run https://github.com/tmt11geo/dashboard-pwa/actions/runs/39134967348
completed successfully for this exact merged SHA; build, deploy and report jobs
all succeeded. Remote main fetched and matches the deployed SHA; deployed app
files match the tested working bytes. Final receipt is on depth-tfjs-webgl only,
so main remains the exact verified deployment commit.

Build depth-lab-4; depth.html loads depth.js?v=5, which imports diagnostics?v=3.
New TFJS modules/worker use first-release v=1. Existing unchanged asset versions
remain valid. Final checks: 56/56 Node tests, full 25-file/97,817,343-byte model
audit, JS syntax and git diff --check PASS. Protected map/navigation/theme/tracker/
PWA files and ONNX worker/core match main byte-for-byte. No Access or service-worker
configuration changed. Prior stage 8 browser evidence retained; no new phone test.
Evidence: tools/depth-tfjs/evidence/stage9-{node-tests.log,package-audit.json,
deployment.json,live-urls.json}.

Unauthenticated checks of the live depth page, depth.js and model.json returned
HTTP 403. A follow-up page response identifies Cloudflare error 1010 (cfOrigin=0).
This is an environment/client access limitation, not evidence of missing assets,
and does not independently verify the Access login policy. No alternate hostname
or authentication bypass attempted. Authenticated live app/model validation remains
for the user; Pages success is verified separately. Stage 9 has no deployment blocker.

Exact next action: stage 10 only, OnePlus evaluation. Open
https://tmt11.com/dashboard-pwa/depth.html?v=4 through normal Access authentication;
confirm diagnostics show depth-lab-4. See docs/depth-tfjs-phone-test.md for the
short baseline/WebGL/timing/lifecycle sequence and requested copied logs.
Stage 10 NOT STARTED; no phone performance or hardware acceleration result claimed.
This pointer supersedes all historical deployment-preparation/next-action text.


## Guided persistent relief design checkpoint — 2026-10-23

User approved persistent 3D relief and measured move–hold–capture guidance.
R0 design/source audit complete; see docs/depth-relief-scan-plan.md. No scanner
implementation or deployment in this checkpoint. Starting/outcome branch
 depth-tfjs-webgl at 838eebbcb36b2f7eccc2d991fddd065516d8a52a.
Main remains e599a76ad2a48e97650545f64980abf4756de3e8; deployment not rechecked.
Phone log supplied in this conversation confirms Adreno 740 WebGL with CPU
forwarding disabled, 8.392 s loading, 5.034 s first inference and 1.837–1.873 s
warm inferences. Stable live counters across 11 completed frames; user reports
poor browser responsiveness at requested 1/s. Evidence summary:
tools/depth-tfjs/evidence/stage10-phone-summary.json (not a full raw-log archive).
Stage 10 is PARTIAL, not “no phone evidence”; lifecycle/baseline/heat remain pending.
Fresh source audit: relief is replaced each frame; worker discards raw depth range
via normalization; assumed camera FOV and arbitrary geometry cannot establish a
consistent map. No AGENTS.md in either inspected tree. Documentation-only change;
source inspection performed, no new runtime tests claimed.
Exact next implementation action for the newly approved feature: R1 only in the
scan plan, preserve raw capture data and build bounded guided scheduling. Pose,
scale alignment and fusion remain R2/R3 feasibility work. No mapping claim yet.
This additive project pointer supersedes “no phone results” wording above.


## Guided scan implementation — 2026-10-23

User explicitly asked to build and deploy the guided persistent scan, superseding
the earlier R1-only planning pointer. Started on depth-tfjs-webgl at
dd5186ed28609ad85512fb531339e1e46ab53062; main inspected at
e599a76ad2a48e97650545f64980abf4756de3e8. No AGENTS.md found.
Implemented raw capture data, measured hold/move cues, bounded worker registration,
accepted-view accumulation, pause/finish/clear and versioned local file save/open.
Build depth-lab-5. Ordinary TFJS also rests at least one second after each result.
The experimental scan uses relative-depth offset search and robust similarity
registration with feature coverage, geometric and reprojection rejection gates.
It is approximate, arbitrary-scale, limited to 40 views/32,000 points, and has no
loop closure, calibrated pose or long-scan accuracy guarantee.

Verification: 64 Node tests PASS; browser UI test with controlled inference and
real registration PASS (three-view accumulation, pause/resume, finish release,
save/clear/open/reload, late-result rejection). Actual TFJS WebGL/no CPU forwarding
with packaged model on five Redwood colour images PASS: two accepted views, finite
raw depth retained separately from normalized display. Chromium 141 SwiftShader;
no OnePlus guided-scan performance claim. Source hashes, reproducible harness,
fixture hashes and results are in tools/depth-scan/. Mobile screenshot inspected;
controls also placed over camera, and diagnostics collapsed initially.
A failed real test revealed invalid-depth correspondences rejecting entire frames;
fixed by excluding those samples, with regression test. No quality thresholds were
relaxed to turn that real test into a pass. Earlier synthetic testing adjusted
scale-correction search and added rotation/repetition rejection.

R1–R4 implementation complete for experimental short scans; R2 has bounded
synthetic/real feasibility evidence, not general reconstruction accuracy. R5
deployment pending; physical OnePlus acceptance remains pending. Original stage 10
is still partial. No map/tracker/theme/PWA/Access or ONNX behavior changes intended.
Exact next action in this run: commit, deploy main, verify exact Pages success,
then checkpoint the receipt and give the user the new scan URL and steps.


## Guided scan deployed — 2026-10-23

Implementation/main commit: faf6339373a38345905949b864cd1c651ccc9689. Build depth-lab-5.
Pages run https://github.com/tmt11geo/dashboard-pwa/actions/runs/40004530154
completed/success for this exact SHA. Main advanced by an expected-head lease;
all seven source files in the verification manifest match remote main bytes.
Final documentation receipt is on depth-tfjs-webgl; main stays at the verified
implementation/deployment SHA.

Experimental guided scanning is now available at
https://tmt11.com/dashboard-pwa/depth.html?v=5 via the normal Access flow.
Use Start guided scan, move slightly sideways with overlap, hold still, wait for
View added, Finish, then Save relief file. Open restores a saved scene for
inspection; saved files cannot resume tracking. Clear starts a new scene.

Evidence: tools/depth-scan/evidence/. 64 Node tests PASS, 13 browser UI/lifecycle/
save-open checks PASS, actual model/real-sequence checks PASS (2 accepted views,
2,065 points from five images; overly similar views rejected). Synthetic 3D
transform, affine depth and negative cases pass. Physical phone acceptance,
long-scan drift, heat and responsiveness remain unverified. No metric accuracy
or general SLAM claim. The R1–R4 implementation and R5 deployment are complete
for this experimental release; R5 OnePlus acceptance remains open.

Automated custom-domain page/script/core requests returned HTTP 403 with body
error code 1010. No authentication bypass attempted; Pages success is separate
from authenticated live-app validation. Access configuration is unchanged.
Evidence: live-urls.json and deployment.json.

Exact next action: user tests 3–5 views on OnePlus, pauses/finishes, rotates, saves,
reloads and opens the scene; supply diagnostics and alignment/responsiveness/heat
observations. Resume from this branch checkpoint and inspect main before fixes.
This supersedes all earlier R1-only and deployment-pending pointers.
