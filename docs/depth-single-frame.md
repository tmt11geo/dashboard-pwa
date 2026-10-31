# Single-frame Depth and experimental scanning

`depth.html?v=18` is the ordinary camera depth page (build `depth-single-1`).
Its controller is restored from the pre-scan deployment
`e599a76ad2a48e97650545f64980abf4756de3e8`, retaining the later one-second
TFJS rest interval, unrestricted horizontal rotation and full-screen viewer.
TFJS WebGL is selected by default. Auto, WebGPU and WASM remain selectable.
No calibration, guided scan or Gather controller is imported by ordinary Depth.
Each completed inference replaces the depth image and relief with one frame.

`depth-experimental.html?v=1` preserves the former Depth scan page. Its
`depth-experimental.js` is an exact copy of the controller at `70600ea`.
It also hosts `scan.html` (Gather) via the existing body workflow selector.
Calibration returns to Experimental. Main app navigation has Depth and
Experimental; Gather is available inside Experimental. Saved file formats,
calibration/registration behavior, workers and model bytes are unchanged.

## Phone check

1. Open Depth, verify TFJS WebGL is selected, tap Start depth camera.
2. Allow camera access and wait for model load and the first depth frame.
3. Select 3D relief. Pause depth to inspect one frame, or Stop & release to
   inspect the frozen relief with the camera/model released.
4. Try Full screen and Return to page. One depth frame works while paused.
5. Experimental opens the preserved scan workflow; Gather opens capture/stitch.

There is no requirement to import calibration on ordinary Depth. The relief is
relative and approximate, not metric reconstruction. Phone validation remains
manual; browser SwiftShader timing does not measure OnePlus GPU performance.

## Verification

- `node --test tests/*.test.mjs` (95 tests).
- `NODE_PATH=<playwright modules> DEPTH_CHROMIUM=<chromium> DEPTH_PREFIX=/dashboard-pwa DEPTH_SPLIT_CHECKS=1 node tools/depth-tfjs/run_camera_smoke.cjs <TFJS 4.22.0 tf.min.js> <demo01.jpg> tools/depth-tfjs/evidence/single-frame-browser.json`
- `NODE_PATH=<playwright modules> node tools/depth-tfjs/run_split_mobile.cjs`

Runtime and fixture hashes are checked by the browser harness; source URLs are
in the existing TFJS worker and validation-fixtures.json. Browser checks use
actual packaged model weights, a simulated camera, and real rendering.
Experimental navigation checks cover startup/controls, not a new calibrated
scan or physical stitching success. Evidence: `single-frame-{node.log,browser.json,mobile.json}`
in `tools/depth-tfjs/evidence/`. Screenshots are local review artifacts only.
Cloudflare Access, service worker, PWA identity, mapping and tracking logic are
unchanged. Camera navigation now wraps to fit narrow phone screens.
