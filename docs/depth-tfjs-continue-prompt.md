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

6C and 6D are DONE; consult current DONE.md over historical instructions above.
Next: 6E only, shard 2. Inspect branch/path first. Use phone/browser upload handoff
if absent; checkpoint waiting for upload rather than retry large create_blob calls.
Then verify uploaded remote bytes and checkpoint. Do not start a second substage.
