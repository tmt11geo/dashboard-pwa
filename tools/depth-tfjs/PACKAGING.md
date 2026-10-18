# Stage 6: resumable package checkpoints

Stage 6A verifies and inventories bytes; it does not upload or host the model.
Run only one substage from `../../DONE.md` per conversation. The original stage 6
is replaced by 6A–6AE in `../../docs/depth-tfjs-plan.md`.

## Verify the source package

From the repository root:

```sh
python tools/depth-tfjs/verify_package.py \
  --graph-dir /workspace/scratch/4c361dacd12f/stage4/final/graph-model \
  --output /tmp/package-inventory.json
```

Python standard library only. If the temporary directory is gone, regenerate
with CONVERSION.md. Compare the complete graph set against the committed
`evidence/package-inventory.json`; do not mix shards from different conversions.
A different graph serialization requires explicit provenance/semantic comparison,
not silently replacing the expected hashes. Revalidate numerical results if the
graph or weights have substantively changed.

Inventory includes exact lengths, SHA256 and expected Git blob SHA1. All 25 local
files match stage 3 run-2; all blob IDs independently match `git hash-object`.
Negative checks rejected a missing model and an extra byte in model.json. The
manifest names each of the 24 shards once; declared weight bytes are 97,145,740.
Complete graph is 97,817,343 bytes (93.29 MiB); largest shard 4,194,304 bytes.

## Hosting decision and impact

Proposed destination: `models/depth-anything-v2-small-tfjs-fp32-224-v1/` in this
repository. Keep paths relative to model.json and later to `/dashboard-pwa/`.
Use ordinary binary blobs, not Git LFS pointer files. Preserve original FP32 bytes.
Immutable commit-pinned raw GitHub URLs can be checked in 6AD; live custom-domain
Pages checks wait for stage 9. No branch merge, Access change or deployment in 6.

Starting recursive tree: 96 blobs, 578,288 bytes; adding this graph gives
98,395,631 bytes before additional documentation/notices. This is an uncompressed
current-tree estimate, not Git history size, compression or actual Pages output.
GitHub's documented Pages site limit is 1 GB, with a soft 100 GB/month bandwidth
limit. Thus the current package fits the site-size allowance, while each uncached
model load transfers about 98 MB; roughly 1,000 such loads approach 98 GB. This is
an assessment, not an observed traffic or cache guarantee. Do not precache the
model in the existing service worker as part of packaging.

Reference checked 2026-10-18:
https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

## Current transfer protocol — finer split after 6A

The old 6B–6J scopes are superseded. See the exact ledger in ../../DONE.md.
6B has committed LICENSE.txt, SOURCE_MODEL_CARD.md and ATTRIBUTION.md at the
model destination. No weights have been attached. 6C uploads/attaches only
shard 1; 6D verifies its remote bytes; 6E–6AA transfer one shard per run (2–24).
6AB adds model.json; 6AC audits complete distribution/notices; 6AD checks immutable
URLs/hashes; 6AE performs the actual explicit-WebGL load. Stop after one row.

1. Re-read branch head/tree and intended path. Resume partial work first. Skip
   attached files only when verified against inventory; never count dangling blobs.
2. Read and base64-encode binary programmatically without printing it. Pass directly
   to the integration create_blob tool; never paste megabytes through model context.
   The first 4 MiB request remains unproven. Do not assume shell git authentication.
3. Compare returned SHA to inventory; immediately create a referencing tree entry,
   commit with current parent and update the branch using expected-head lease.
   Inspect/preserve intervening commits if the lease fails. Verify ref/tree metadata.
4. For shard 1, stop at attachment in 6C; save its exact commit/path/blob ID.
   6D alone retrieves remote content programmatically and checks decoded length,
   SHA256 and Git blob ID. For later one-shard runs, attachment is immediately
   followed by these checks and a durable DONE/status/evidence checkpoint.
5. On failure, record exact error with at most one diagnostic follow-up, then commit
   a blocked checkpoint and stop. Do not repeat an upload indefinitely. If transfer
   cannot happen without printing a huge payload, record that limitation; evaluate
   an authenticated bounded alternative in a later run without requesting credentials.

Never concatenate padded base64 chunks. Do not repack, quantize or modify validated
bytes. Use ordinary Git blobs. Do not add the model to the service worker precache.
Parent stage 6 remains PARTIAL until full distribution, immutable URL and actual
load checks pass. Live custom-domain checks remain deferred to stage 9.

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


## Current distribution — stage 6AC

All 25 model files and three provenance documents are now attached. Earlier
transfer instructions above are historical; DONE.md is the authoritative ledger.
Run `python tools/depth-tfjs/audit_package.py` from the repository root to verify
the actual checked-out distribution, including the license/model-card hashes.
Evidence: `evidence/package-audit.json`. All model bytes are unchanged.
Next is 6AD URL/hash verification only; 6AE loading and stage 9 deployment remain.


## Immutable URLs — stage 6AD

All 25 commit-pinned raw GitHub URLs passed HTTP/length/SHA256/Git blob checks.
Reproduce with:

```sh
python tools/depth-tfjs/verify_package_urls.py --commit e1477f06af60f6cba2ff1271f4e98ee7bb858e80
```

Evidence: `evidence/package-urls.json`. The exact immutable base URL and each
manifest/shard URL are recorded there. Stage 6AE must still verify actual browser
WebGL GraphModel loading; live custom-domain Pages checks wait for stage 9.
