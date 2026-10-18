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
Immutable commit-pinned raw GitHub URLs can be checked in 6J; live custom-domain
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
