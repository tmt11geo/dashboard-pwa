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
| Next stage | **6B — Pilot transfer of shard 1 only** |
| Current blocker | None for 6A; binary transport unproven; phone performance remains unknown |
| Outcome of this checkpoint | Stage 6A package audit PASS; exact transfer inventory and smaller 6B–6J checkpoints preserved; no binary assets uploaded |

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
| 6. Model packaging/hosting | **PARTIAL** | 6A DONE: all 25 recovered files match stage 3 hashes. 6B–6J pending; no branch-referenced model assets. |
| 7. Camera integration | **NOT STARTED** | Letterboxing and explicit 224 px mode were proposed only. |
| 8. Lifecycle/regressions | **NOT STARTED** | Existing baseline previously passed 47 tests; new backend lifecycle is unimplemented. |
| 9. Merge/deploy | **NOT STARTED** | Main has no TFJS implementation. |
| 10. OnePlus device evaluation | **WAITING ON STAGE 9** | No phone TFJS performance evidence. |

## Stage 6 substage ledger

| Substage | State | Exact scope |
| --- | --- | --- |
| 6A | **DONE** | Integrity audit, 25-file SHA256/length/Git blob inventory, verifier and bounded transfer plan. |
| 6B | **NOT STARTED — NEXT** | Only shard 1 with license/attribution: prove upload, branch commit and remote byte verification. |
| 6C | **NOT STARTED** | Shards 2–5. |
| 6D | **NOT STARTED** | Shards 6–9. |
| 6E | **NOT STARTED** | Shards 10–13. |
| 6F | **NOT STARTED** | Shards 14–17. |
| 6G | **NOT STARTED** | Shards 18–21. |
| 6H | **NOT STARTED** | Shards 22–24. |
| 6I | **NOT STARTED** | model.json, licenses/attribution, full branch asset verification. |
| 6J | **NOT STARTED** | Immutable URL hash checks and actual model load; document live URL deferral to stage 9. |

Complete only one substage per run. After each blob, commit it before the next
large upload. Resume partial batches before starting another. Parent stage 6
requires every row; an inventory or unreferenced blob is not hosted assets.

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
