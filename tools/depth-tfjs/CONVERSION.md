# Fixed-224 pretrained conversion (stage 3)

Use the branch pointer in `../../DONE.md`. This workflow produces a SavedModel
and unquantized float32 TFJS GraphModel. It does not enable a PWA compute option.

## Run

First create the pinned environment with `setup.sh` if necessary. Then, from the
repository root:

```sh
/tmp/depth-tfjs-env/bin/python -u tools/depth-tfjs/convert_model.py \
  --source-dir /tmp/depth-tfjs-source \
  --output-dir /tmp/depth-tfjs-conversion
```

The output directory must not exist. The source cache can be reused; every source
file is checked for exact length and SHA-256 before use. Downloads use immutable
Hugging Face revision `0fa3d627036ffe8029b34850dbdab5028696f011`; they are written
to `.part` files and renamed only after verification. A corrupt cache fails.
Run under an outer job timeout if download availability is uncertain; HTTP
connect/read timeouts and the converter's 600-second timeout bound individual
blocking operations. Monitor the parent log and `converter.stderr.log` during work.

The script sets the nested DINOV2 `image_shape` to `[224,224,3]` before model
construction. Position-embedding configuration is preserved. Strict pretrained
loading must give 24,883,777 parameters. It compares the unmodified backbone plus
final ReLU to all 12 Dense GELUs rewritten as `0.5*x*(1+erf(x/sqrt(2)))` on a
seeded ImageNet-normalized synthetic input. No approximate GELU is used. The
`1e-4` maximum absolute error limit is a float32 rewrite smoke bound; it does not
replace representative-image validation or TFJS execution in stage 4.

The SavedModel serving signature consumes **already preprocessed** float32 NHWC
`images` `[1,224,224,3]` and returns `depth` `[1,224,224,1]` after ReLU. RGB/255 and
ImageNet mean/std normalization are external. Outputs are relative inverse depth,
with no display min/max normalization or metric-depth interpretation. Camera
letterboxing has not been implemented or validated.

The converter creates 4 MiB maximum shards. Post-conversion checks enforce the
signature, absence of Erfc, presence of Erf, manifest/shard name completeness,
maximum shard size and equality of declared weight bytes to total shard bytes.
`conversion.json` records operation counts, lengths, hashes, signatures, source
revision, script/environment-lock hashes, rewrite error and tool versions.
Converters may reorder graph constants and shard contents between processes;
use the exact manifest and hashes from each successful run as one indivisible set.

## Artifact persistence and resuming

Committed durable deliverables are the converter, setup/lock, documentation and
compact evidence under `evidence/`. The ~98 MB generated graph and ~100 MB
SavedModel are **not hosted or committed as assets in stage 3**. Stage 6 owns
binary transfer and hosted-URL verification. No dangling Git blobs count as assets.

Retain the complete output directory together (SavedModel, GraphModel,
`gelu-smoke.npz`, converter logs and `conversion.json`) while doing stages 4–6.
In this session the successful output directories are under
`/workspace/scratch/e11ad2108fd0/depth-stage3/`; these are temporary caches, not a
durable asset host. If absent, regenerate with the command above and record the
new run's hashes. Use `make_backbone` and `rewrite_gelu` from `convert_model.py`
to recreate the original and rewritten source separately for stage 4. Do not use
the synthetic smoke result as the three required real-image comparisons.

Stage 4 must verify converted runtime numerics before the graph can be considered
validated. Stage 5 must execute the actual graph in WebGL before deciding runtime
viability. No phone performance conclusion follows from successful conversion.

## Licensing provenance

The [pinned Keras model card](https://huggingface.co/keras/depth_anything_v2_small/blob/0fa3d627036ffe8029b34850dbdab5028696f011/README.md)
states Apache 2.0 for **Small** weights (Base/Large have different terms). The
model card SHA-256 is recorded in each conversion report. The pinned repository
lists no separate LICENSE file. KerasHub 0.24.0 installed distribution metadata
declares `License-Expression: Apache-2.0`; TensorFlow.js 4.22.0 metadata declares
`License: Apache 2.0`. This records observed provenance; stage 6 must retain the
appropriate license texts, attribution and any notices when packaging assets.
