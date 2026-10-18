# Stage 4 numerical validation

This compares three pinned upstream JPEG examples against the unmodified pretrained
Keras backbone plus final ReLU. It separately measures the exact GELU rewrite,
TFJS against the rewritten source, and end-to-end TFJS against the original source.
All comparisons use raw relative inverse depth, before display normalization.
This is numerical parity evidence, not model accuracy against ground truth.

`validation-fixtures.json` pins the upstream revision, URL, byte length and SHA256
for each example. Images are fetched for local validation; they are not redistributed
in this repository. Three example scenes are a small regression set, not exhaustive
coverage. Square resizing is deliberate here; camera letterboxing is stage 7.

## Run

Use the stage 2 environment and stage 3 conversion (see CONVERSION.md). The
preparer verifies pinned source files and every converted asset against its
conversion report, downloads/verifies each JPEG, builds the original model,
then rewrites GELU only after all original references have been computed.
RGB JPEG decoding and bilinear resizing happen once in TensorFlow. The exact
little-endian float32 NHWC tensor bytes are served to TFJS, eliminating differences
in browser image decoding/resizing from this comparison.

```sh
/tmp/depth-tfjs-env/bin/python -u tools/depth-tfjs/prepare_validation.py \
  --source-dir /tmp/depth-tfjs-source \
  --conversion-dir /tmp/depth-tfjs-conversion \
  --output-dir /tmp/depth-validation

# Use Node 22+ with playwright 1.62.1 available to require(). For example:
npm install --prefix /tmp/depth-validation-node playwright@1.62.1
curl -fL -o /tmp/tf-4.22.0.min.js \
  https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js
# Expected SHA256: 300dfae273d20b4046f46a06d735688f03675a807561e9bcb5f664eb2f3d2831

NODE_PATH=/tmp/depth-validation-node/node_modules \
DEPTH_CHROMIUM=/path/to/headless_shell \
node tools/depth-tfjs/validate_graph.cjs \
  /tmp/depth-validation /tmp/tf-4.22.0.min.js /tmp/validation-results.json
```

The verified browser is headless Chromium 141.0.7390.37, Playwright build 1194:
https://playwright.download.prss.microsoft.com/dbazure/download/playwright/builds/chromium/1194/chromium-headless-shell-linux.zip
Archive SHA256: `d745c7210cc88b73c7991a22c9624819960d84bc3de77ac7336d2de841a8c91f`.
Extract and set DEPTH_CHROMIUM to `chrome-linux/headless_shell`. Current default
Playwright browser downloads returned invalid ZIPs on this host. Full Chrome
failed its process-singleton socket creation; headless shell succeeded. The final
runner uses single-process/no-zygote flags on this restricted numerical-test host.
These flags and SwiftShader are not production app recommendations.

The server binds only loopback and serves local inputs, references, model and TFJS.
No images or tensors are uploaded. The runner requires TFJS 4.22.0, explicit WebGL,
WEBGL_CPU_FORWARD=false and the expected output shape/dtype. Tensor and model
hashes are checked before execution; references and every output must be finite.
Outputs are read back for comparison. The runner closes the browser after a
240-second execution deadline, preserves a JSON failure report for browser/runtime
failures and returns nonzero when validation fails. Input-integrity failures abort
before browser startup. Models and per-fixture tensors are disposed.

## Acceptance bounds

Each of the three comparisons for every image must have maximum absolute error
at most **1e-3** and MAE divided by the **original source output range** at most
**1e-4**. These predeclared float32 parity bounds tolerate accumulated rounding in
the transformer while rejecting appreciable numerical drift: mean error is limited
to 0.01% of source dynamic range; the absolute bound is about 0.026–0.038% of the
observed source ranges. No per-frame normalization, relative scale fitting or
approximate GELU is used. Degenerate ranges are rejected. Bounds are not a metric
depth accuracy claim. New precision, shapes or preprocessing require validation.

## Durable results

`evidence/validation-results.json` contains fixture and tensor provenance, asset
hashes, runtime identity, shapes, finite-value checks, ranges and all error metrics.
`evidence/validation-prepare.log` and `validation-browser.log` preserve execution
logs. Prepared binary tensors and assets are reproducible temporary files; no
hosting is claimed. The recorded script hashes identify the exact validator used.

Stage 5 must separately implement repeated same-image timings, loading/cancellation,
failure retention, memory/disposal accounting and a viability decision. Stage 4
does not complete that benchmark or establish hardware/OnePlus performance.
