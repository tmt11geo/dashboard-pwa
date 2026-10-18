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
| Next stage | **3 — Reproduce pretrained conversion** |
| Current blocker | None for stage 2; stage 3 conversion scripts and model artifacts still need reproduction |
| Outcome of this checkpoint | Stage 2 environment reproduced and pinned; application unchanged |

Resolve the current checkpoint SHA from the branch head or the commit that last changed this file. Do not put a guessed/self-referential commit SHA here. Record completed implementation commits in the history below on subsequent checkpoints.

## Stage ledger

DONE means the stage's acceptance criteria and durable deliverables are available in the repository or verified immutable hosting. PARTIAL means useful work happened but some acceptance criteria or durable artifacts are missing.

| Stage | State | Completed work / remaining requirement |
| --- | --- | --- |
| 1. Audit and recover | **DONE** | Current main/tree/branches inspected; no AGENTS.md found; prior results preserved as historical evidence; plan and resume instructions saved. Local artifact recovery was attempted and files were absent. |
| 2. Conversion environment | **DONE** | Clean CPython 3.12.14 environment passes pip check, DepthAnythingBackbone import, TensorFlow operation and converter startup. Executable setup, complete version lock and evidence are under tools/depth-tfjs/. |
| 3. Pretrained conversion | **PARTIAL** | Earlier fixed-shape SavedModel → GraphModel conversion succeeded after GELU rewrite. Scripts and binaries were not durably saved; reproduce and preserve them. |
| 4. Numerical validation | **PARTIAL** | Three earlier real-image WebGL comparisons had small errors. Fixtures, exact image revisions and runnable validation must be preserved/reproduced. |
| 5. WebGL benchmark | **PARTIAL** | Actual graph ran with webgl selected and CPU forwarding disabled; disposal reached zero tensors. Dedicated benchmark UI, repeated same-image timings and lifecycle checks remain. |
| 6. Model packaging/hosting | **NOT STARTED** | Earlier local shards existed; no verified hosted backend assets or completed repository upload. |
| 7. Camera integration | **NOT STARTED** | Letterboxing and explicit 224 px mode were proposed only. |
| 8. Lifecycle/regressions | **NOT STARTED** | Existing baseline previously passed 47 tests; new backend lifecycle is unimplemented. |
| 9. Merge/deploy | **NOT STARTED** | Main has no TFJS implementation. |
| 10. OnePlus device evaluation | **WAITING ON STAGE 9** | No phone TFJS performance evidence. |

## Completed points

- [x] Inspect latest repository main rather than assume the supplied commit.
- [x] Check for repository AGENTS.md instructions.
- [x] Identify existing depth files, tests, worker scheduling, diagnostics and preservation requirements.
- [x] Preserve previous conversion findings and observed result values with their provenance limitations.
- [x] Establish ten bounded stages, branch tracking and reusable continuation instructions.
- [x] Commit and verify a reproducible conversion environment.
- [ ] Preserve a reproducible conversion and validated model assets.
- [ ] Complete the benchmark, camera integration, tests, deployment and phone evaluation.

## How to continue

Use [the reusable prompt](docs/depth-tfjs-continue-prompt.md). Read [the stage prompts](docs/depth-tfjs-plan.md) and [technical handoff](docs/depth-tfjs-status.md). Complete **one stage per run** and update this ledger before stopping. Do not re-run completed stages without a concrete reason; do reproduce historical results whose artifacts are missing.

## Checkpoint history

- 2026-10-18: Initial durable handoff on `depth-tfjs-webgl`, based on main `9db5c03`. Stages 2–5 retain historical execution evidence, not completed deliverable status.

- 2026-10-18: Stage 2 reproduced from starting checkpoint `56d4d161507ef865484f84014b7eb79005758fd2` on `depth-tfjs-webgl`. Evidence: `tools/depth-tfjs/evidence/`. Current main remains `9db5c0345faf7339f3d4cc24142dad362122649e`; successful Pages run: https://github.com/tmt11geo/dashboard-pwa/actions/runs/39104746337. No app or hosting configuration changed. Exact next action: run stage 3 using the committed environment, retrieve the pinned source/config/weights, verify their SHA256 values, then implement fixed-224 export and exact GELU rewrite. Do not treat historical stage 3–5 outputs as regenerated assets.
