# Stage 6: resumable package checkpoints

Stage 6A verifies and inventories bytes; it does not upload or host the model.
Run only one substage from `../../DONE.md` per conversation. The original stage 6
is replaced by 6A–6J in `../../docs/depth-tfjs-plan.md`.

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

## Transfer protocol (6B pilot, then 6C–6H batches)

Before the first weight is attached, preserve the Apache-2.0 license text and
source/derivative attribution alongside it; use the pinned provenance in
CONVERSION.md and conversion-run-2.json. Stage 6I audits the completed distribution
and notices. The pilot must not redistribute weights without their license.

1. Read current branch head/tree and the intended path. Skip a file only after
   checking its remote content, size and blob ID against inventory.
2. Read binary bytes and base64-encode programmatically without printing the
   encoded string or a binary fetch response into the conversation. Pass content
   directly to the GitHub integration's `create_blob` call. Never paste a 5.6 MB
   payload through model context. Whether this tool path supports the request is
   unproven: **6B tests only shard 1**, not the full model or the 24-shard loop.
3. Compare returned SHA to inventory. Create a tree entry referencing that SHA,
   commit with current branch head as parent, then update the branch with an
   expected-head lease. Preserve intervening commits if the lease fails.
4. Verify branch head/path, remote size and blob ID, then decode a remote content
   response programmatically to check SHA256. Commit DONE/status with per-file
   progress before the next large upload. Never count an unattached blob.
5. Stop after the assigned batch. If any call fails or transfer cannot be made
   without printing a huge payload, capture the exact limit/error and commit a
   blocked checkpoint. Do not repeat the failed operation indefinitely. Choose
   an available authenticated bounded binary-transfer alternative in a later run;
   do not request credentials or assume shell git has authentication.

6B = shard 1; 6C = 2–5; 6D = 6–9; 6E = 10–13; 6F = 14–17;
6G = 18–21; 6H = 22–24. A partially completed batch resumes first. Make smaller
checkpoints if required; never combine batches to fill a conversation.

Stage 6I adds exact model.json and final attribution/integrity metadata and audits
all branch assets. Stage 6J checks all immutable URLs/bytes and performs an actual
GraphModel load with explicit WebGL. Hosting is not DONE until those checks pass.
Keep the live-URL deferral explicit until stage 9; no phone speed claim follows.
