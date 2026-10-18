# Depth Anything V2 Small — converted FP32, fixed 224

Model weights: Apache-2.0. See LICENSE.txt and the unmodified SOURCE_MODEL_CARD.md.
Only the Small model is packaged here.

Original model: Depth Anything V2, by Lihe Yang, Bingyi Kang, Zilong Huang,
Zhen Zhao, Xiaogang Xu, Jiashi Feng and Hengshuang Zhao.
Project: https://github.com/DepthAnything/Depth-Anything-V2
Author attribution source: https://github.com/DepthAnything/Depth-Anything-V2/blob/a561b849ebae10a6f5ef49e26c83cbbcd36c71bf/README.md
Keras distribution: https://huggingface.co/keras/depth_anything_v2_small/tree/0fa3d627036ffe8029b34850dbdab5028696f011

## Modification notice — 2026-10-18

This directory contains a derived TensorFlow.js GraphModel produced for
tmt11geo/dashboard-pwa. KerasHub 0.24.0 / Keras 3.15.1 constructed the pretrained
backbone; TensorFlow 2.19.0 exported it; TensorFlow.js Converter 4.22.0 converted it.
The input shape was fixed to [1,224,224,3]; 12 exact GELUs were rewritten to
0.5*x*(1+erf(x/sqrt(2))); final ReLU was added. Weights remain FP32 without
quantization. The model.json and group1-shard*of24.bin files are the
converted representation; this notice accompanies those binary files, which
cannot carry text headers without changing their required bytes.

Input RGB/ImageNet normalization is external. Output is relative inverse depth,
not metric distance. See [conversion provenance](../../tools/depth-tfjs/CONVERSION.md),
[numerical validation](../../tools/depth-tfjs/VALIDATION.md), and
[exact file hashes](../../tools/depth-tfjs/evidence/package-inventory.json).

## License provenance and distribution state

SOURCE_MODEL_CARD.md is the exact 4,720-byte pinned Keras model card, SHA256
96e49b7f17fdb5c5adbb9740ea6581f699be39f03bb327bac03cdc0ed2de126d.
LICENSE.txt is the complete Apache-2.0 text retrieved from the original project:
https://github.com/DepthAnything/Depth-Anything-V2/blob/a561b849ebae10a6f5ef49e26c83cbbcd36c71bf/LICENSE
The pinned Keras model repository has no separate LICENSE or NOTICE file.
This attribution is a dashboard-pwa packaging notice, not an upstream NOTICE file.
KerasHub and TFJS are conversion/runtime dependencies; their runtime distribution
notices must be audited when runtime assets are added. No runtime code is bundled here.

Stage 6AC audited all 25 model assets (97,817,343 bytes), the ordered 24-shard
manifest and these provenance documents. All model bytes match the validated
conversion inventory. Reproduce with `python tools/depth-tfjs/audit_package.py`
from the repository root; evidence is in
[package-audit.json](../../tools/depth-tfjs/evidence/package-audit.json).
Immutable URL checks remain stage 6AD, complete WebGL loading remains 6AE, and
live Pages deployment remains stage 9. Phone performance remains unproven.
