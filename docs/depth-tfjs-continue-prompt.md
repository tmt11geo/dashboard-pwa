# Reusable continuation prompt

Paste the following into a fresh chat after an interruption, or to start the next bounded stage:

---

Continue the Depth Anything TFJS WebGL work in GitHub repository tmt11geo/dashboard-pwa using the connected GitHub integration.

First inspect branch depth-tfjs-webgl and read DONE.md from that branch, plus any applicable AGENTS.md instructions. Follow the current working-branch pointer in DONE.md if it has changed. Read docs/depth-tfjs-status.md and docs/depth-tfjs-plan.md on the identified branch. Do not assume these files are on main.

Tell me which branch and commit you are using, the current live/deployed commit, and which stage you will handle. Complete ONLY the earliest incomplete stage whose prerequisites are satisfied. Resume a partially completed stage before starting another. Use previous evidence to avoid rediscovery, but do not treat historical results with missing artifacts as reproducible deliverables.

For stage 6, select only the earliest incomplete substage 6A–6AE from DONE.md; never run the whole parent stage. Resume a PARTIAL substage first and skip verified branch-referenced files. Stage 6B is license/preparation only, 6C is shard 1 upload/attachment, 6D is remote byte verification; later transfers are one shard per run. Follow the revised ledger rather than historical 6B–6J scopes. Stop after that one substage, including a blocked checkpoint. Never print binary/base64 payloads into the conversation.

Work autonomously within that single stage. I authorize committing checkpoints to the documented working branch. At stage 9 I authorize merging the verified changes into main and deploying through the existing Pages arrangement, then verifying the exact deployment succeeds. At stage 10, if device logs are missing, provide the test sequence and stop with WAITING FOR DEVICE LOGS; do not invent results.

Report progress at least every five minutes while actively working. Prefer tool waits under 60 seconds. If a stage becomes too large, commit a smaller safe checkpoint, mark it PARTIAL, and record the exact next action. Do not continue into another stage in this run.

Preserve Cloudflare Access, relative app paths under /dashboard-pwa/, existing WASM/WebGPU choices, maps, themes, tracker, location tools and PWA behavior. Frames stay local. Do not report GPU operation after CPU fallback, deploy a nonfunctional backend, or claim phone GPU performance from SwiftShader.

Before ending, commit all useful deliverables and update DONE.md and docs/depth-tfjs-status.md with completed checks, evidence paths, current/outcome branch, live deployment state, blockers and next stage/action. Record any difference from current main and protect intervening work. Verify the branch head and changed files through GitHub after committing.

Finish with the checkpoint commit link, branch, completed stage or partial scope, next action, and any input required from me. Then stop.

---


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

Stages 1–8, including all 6A–6AE substages, are DONE. DONE.md is authoritative
above historical instructions. The user authorized 6AE, 7 and 8 together, all now
checkpointed. Next: **stage 9 only**, reconcile latest main, bump diagnostic build
and affected asset queries, final checks, merge/deploy through existing Pages,
verify exact deployment and preserve Cloudflare Access. Stop before stage 10.
No TFJS camera deployment or phone performance claim has been made yet.


## Latest pointer after stage 9 — 2026-10-18

Stages 1–9 DONE. Main e599a76ad2a48e97650545f64980abf4756de3e8 deployed
successfully (Pages run 39134967348). Latest checkpoint remains on depth-tfjs-webgl.
Next: stage 10 only, obtain OnePlus logs using docs/depth-tfjs-phone-test.md.
No phone results yet. Automated live URL checks received Cloudflare 403/1010;
authenticated application verification is pending. This supersedes earlier pointers.

## Guided scan implementation pointer — 2026-10-23

The user requested building and deploying the guided persistent-relief feature.
Read the newest DONE.md checkpoint and tools/depth-scan/README.md. R1–R4 now have
an experimental implementation and synthetic/real/browser evidence. Check R5's
latest deployment receipt before taking action; phone acceptance remains separate.
Do not rerun completed conversion or shard stages. Stage 10's earlier phone log
covers ordinary TFJS depth, not the new scanner. Request scanner diagnostics if
none have been supplied; do not claim OnePlus scan success from local tests.


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
