# TFJS WebGL camera path

The explicit `TFJS WebGL` choice uses a classic dedicated worker and pinned TFJS
4.22.0 from jsDelivr. The runtime is not bundled; its Apache-2.0 license is linked
in Depth Lab. The graph and unchanged FP32 shards load from relative same-origin
`models/depth-anything-v2-small-tfjs-fp32-224-v1/`. No service-worker precache change.
Auto and the existing ONNX WASM/WebGPU worker retain their selection behavior.

Input is fixed NHWC [1,224,224,3]. The canvas resizes the whole camera view to fit
224 square, rounding the content dimensions to pixels and centering the content.
The worker applies RGB/ImageNet normalization, with exact zero normalized padding
(equivalent to mean RGB). It crops the identical rectangle from raw depth and
colour pixels before normalizing depth and generating relief. Portrait/landscape
are preserved to pixel rounding accuracy; no arbitrary camera crop or stretching.
Higher detail settings are disabled for this compute option.

The worker requires OffscreenCanvas, TFJS WebGL backend selection and
WEBGL_CPU_FORWARD=false. Unsupported execution fails explicitly. Model loading has
a fixed 240-second parent deadline; inference/readback has a 60-second deadline.
The parent permits one frame in flight and reuses pause/step and generation guards.
Stop/hide/navigation terminate the worker and stop tracks, including late streams.
Termination delegates GPU context destruction to the browser; counters after
termination are unavailable. Each frame disposes its own input/output tensors;
TFJS live counters and retained pool counters are logged separately. Context loss
and errors are retained in the selectable/copyable diagnostic log.

`run_camera_smoke.cjs` exercises the actual page/worker/model using a loopback
canvas camera stream made from a pinned validation scene. It supplies the exact
hash-checked TFJS runtime locally through a browser route. No frames are uploaded.
Run with the same Playwright/headless shell environment described in VALIDATION.md:

```sh
NODE_PATH=<playwright modules> DEPTH_CHROMIUM=<headless_shell> \
node tools/depth-tfjs/run_camera_smoke.cjs <verified tf.js> <demo01.jpg> <report.json>
```

Evidence: `evidence/camera-smoke.json`. SwiftShader and a simulated camera establish
integration compatibility only. Physical camera/OnePlus behavior remains stage 10.
Main deployment and diagnostic build-id update remain stage 9.
