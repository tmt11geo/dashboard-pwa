# TMT11 Dashboard PWA

A mobile-first engineering demo using simulated data. No analytics or embedded credentials. Camera detection uses externally hosted YOLO weights and ONNX Runtime; maps use Leaflet and map tile providers.

## Publish and install

Keep GitHub Pages on `main` / `(root)`. Open `https://tmt11.com/dashboard-pwa/` in Android Chrome, sign in through your existing Cloudflare Access flow, then choose Chrome menu → Add to Home screen → Install. The in-page button uses `beforeinstallprompt` when Chrome exposes it.

All app paths are relative to support GitHub Pages project paths and custom domains. Manifest uses credentialed fetch for Access. App icons include 192px, 512px and a maskable 512px PNG.

## Authentication and offline behavior

Cloudflare policies are unchanged. Every navigation goes to the network. The service worker stores only the static offline notice after checking for redirects, content type and a page marker. It does not cache dashboard HTML, API data or sign-in pages. Offline navigation shows a reconnect notice. Already rendered content remains visible when connectivity changes. Public GitHub Pages origin and repository remain public.

The deployment's Cloudflare Access policy, redirects and headers must permit the browser to load the manifest, icons and service worker after sign-in. Installation through the protected domain still requires an Android device check.

## Demo interactions

Switch between seven and thirty days. Refresh demo changes simulated progress and tests; it does not fetch live measurements. All values reset on reload.

## Develop

Serve this folder using any static HTTP server on localhost. Production needs HTTPS. There is no build step. Use a new offline cache version when changing the offline notice. Modify sample data in app.js to connect a future data source; do not put secrets in static files.

## Market snapshot (v1.1)
Real daily closes for NOK (US ADR) and INTC, USD, 2026-09-09 through 2026-10-08. Retrieved 2026-10-09 from Stock Analysis history pages (S&P Global Market Intelligence). stocks.json is a dated snapshot, not an automatic feed. Engineering demo refresh does not change prices. Charts compare price return, excluding dividends.


## Camera object detection

Open `./camera.html` from Tactical navigation. Camera access is permission-based, HTTPS only, and starts on a user tap. YOLOv10n runs in a dedicated Web Worker with ONNX Runtime Web 1.20.1 (single-thread WASM, no COOP/COEP headers required). Frames are resized with longest edge 640, rescaled to RGB float32 [0,1], and zero-padded on the right/bottom to 640×640. The [1,300,6] output is decoded as xyxy, score, class ID. The model revision is pinned to `57657320425ee34056408a57ad9d29c4d4815bd8` from `onnx-community/yolov10n` (AGPL-3.0); runtime is MIT. Camera frames and results are never uploaded or recorded. Dependencies download from Hugging Face and jsDelivr, so Cloudflare/CSP settings must allow these origins and their model-download redirects. No hosting or Access policy changes are required by the app.

Tap a box or object button to select a lock. Locking terminates the YOLO worker, including any in-flight inference. A multi-feature pyramidal Lucas–Kanade tracker follows only the selected image patch at a target of 15 updates/s, using frames with a longest edge of 320 pixels. Forward/backward and local appearance checks filter feature correspondences, then a robust similarity fit estimates translation, scale and rotation. Normalised template matching is a recovery fallback; a fixed reference is retained for reacquisition. The template is seeded from the actual detection frame rather than a newer, potentially misaligned frame. Release / scan reloads the detector and resumes scanning; For a YOLO-labelled target, a likely exit (edge disappearance for at least 750 ms and five failed frames) automatically restarts YOLO for up to 30 seconds while retaining the original label, appearance reference and exit indicator. Reacquisition requires score ≥0.55, compatible size, appearance correlation ≥0.6, an unambiguous best match and two spatially consistent consecutive detections. The exit-side half of the view is preferred for the first four seconds, then the full view is allowed as the user may have panned. A successful match seeds a new visual tracker and immediately terminates YOLO again. Release / scan cancels the retained target and starts ordinary scanning. Search timeout or detector error preserves the lost target and stops YOLO. Interior loss continues to require manual scanning. Arrows and the MOVE DEVICE readout guide device movement toward the object: an object left of centre shows left, an object above centre shows up. This reverses the earlier box-movement guidance. The video is unmirrored for both cameras. Loss near an edge produces a **likely** exit side/corner from the last observed box; loss elsewhere is marked unknown. After 1.6 seconds without a reliable visual match, the lock is lost. Automatic reacquisition is attempted for a likely exit; Release / scan is available for manual recovery. Low-texture areas, occlusion, fast motion, rotation, large scale changes and similar image patches can defeat this tracker; it does not establish identity or sense outside the view. Stopping, hiding or leaving the page releases camera tracks and terminates inference. Existing theme keys, manifest identity, start URL and service worker/network-only navigation remain unchanged.

Pure geometry/tracking/decoder checks: `node --test tests/*.test.mjs`. Real permission, inference speed and camera alignment also need an Android Chrome device check.

### Zoom selection

Pinch (1–8×), drag, or use the zoom buttons while scanning. Only the currently visible crop is sent to YOLO. Zoom/pan immediately clears old boxes; in-flight detections from an earlier view revision are discarded. The video stage clips the crop and boxes/taps use the same coordinate transform, including portrait letterboxing. Selecting a label returns to the full image and stops YOLO. All detections/locks remain in full-image coordinates. A snapshot of the same source frame (up to 1280 px) seeds the tracker; its small tracking crop follows the target across the full image, preserving selected detail without zooming the main view. Automatic exit reacquisition operates in the full image. Digital zoom enlarges available camera detail; it does not create optical detail.

### Manual image-patch selection

Select area pauses and terminates YOLO, clears any previous target, and lets the user draw a rectangle directly in the live camera view. Single-pointer drags draw the box; two-pointer gestures still zoom/pan and cancel any draft. Rectangle coordinates are clamped to the displayed image and mapped back through the zoom region. A new live snapshot at pointer release seeds the existing tracker; no recognition label or inference result is needed. Small or low-texture selections remain in selection mode with an explanation. Valid selection restores the full image and follows only that patch. The tracking crop automatically preserves local detail where possible. Pointer cancellation does not create a lock. Cancel selection returns to YOLO scanning; Select area can also replace an existing lock. Manual targets retain direction/exit indicators and now use bitmap-based reacquisition after a likely exit, without starting YOLO. YOLO-labelled targets retain automatic reacquisition. No frames or selections are uploaded or persisted.

### Bitmap reacquisition

A manual target exiting an edge retains its original and most recent geometrically verified 16×16 normalised grayscale templates. A dedicated module worker searches correlation over multiple sizes (0.65–1.5× the last box, with local scale refinement), starting in the exit-side strip for four seconds, then expanding to the full view. A phased coarse grid bounds work per search and revisits skipped pixel offsets across frames, ranking spatially distinct candidates; a full-template pass requires correlation ≥0.78, agreement ≥0.70 with either retained reference, and a ≥0.10 margin over another distinct candidate. Three consecutive spatially consistent results seed a new tracker and terminate the search worker. No-match responses reset confirmation.

The search targets four updates/s with one frame in flight, adapting to actual runtime. Its working image is normally at most 640 px on the long edge, retaining up to 1280 px for small templates. Searches stop after 30 seconds, on error, camera stop/hide, manual replacement, or Release / scan. Stale worker results are ignored. Snapshots remain on-device and in memory. Large appearance changes or lookalikes can defeat/confuse matching; this is visual similarity, not guaranteed identity.

### Feature tracking and loss tolerance

Active tracking uses Shi–Tomasi-style corner scoring in the selected polygon and up to 60 points. Pyramidal Lucas–Kanade runs forward and backward (11 px windows, up to four pyramid levels, retrying one level finer when coarse flow is inconsistent); correspondences require ≤1.2 px round-trip error and local appearance agreement. Pair-consensus and least-squares similarity estimation reject outliers and support rotation/scale changes. Features are replenished inside the transformed object polygon. Moving tracking crops warp the previous image and feature coordinates into the new crop before computing flow. Template matching remains a recovery fallback and reseeds features after recovery.

Five failed video frames and at least 750 ms without a reliable observation are required to infer an edge exit; interior loss waits 1.6 seconds. A successful update resets the failure count. No unobserved position is claimed as a confirmed target. Existing bitmap/YOLO reacquisition paths and cancellation remain in place.

The locally vendored JSFeat LK implementation is MIT-licensed, pinned to `inspirit/jsfeat` commit `4c7b336bbeeb26e6cd4cdf3c7d414abe273846f3`. Only its UMD export was converted to ESM; see `vendor/jsfeat-LICENSE.txt`. No additional third-party runtime downloads are required for tracking.

Selection snapshots and live tracking now use consistent, pixel-centred nearest-neighbour sampling through the same capped source resolution. Tracking reads back only its small crop. This avoids comparing a nearest-sampled reference against differently smoothed live frames.

A separately retained last verified appearance keeps bitmap reacquisition compatible with changes in pose during optical-flow tracking. Search accepts a strong match to either that appearance or the original, while retaining its ambiguity margin and three-frame confirmation.

## Depth Lab

Open `./depth.html` from the map, camera, or dashboard navigation. This isolated experiment runs Depth Anything V2 Small with ONNX Runtime Web 1.20.1 in a dedicated module worker; YOLO is not loaded. The ONNX revision is pinned to `4472b7362082ad9968fee890ca0f1e5aca36b93d` from `onnx-community/depth-anything-v2-small` (Apache-2.0). Auto uses a WebGPU adapter where available: FP16 (~50 MB) with shader-f16, otherwise FP32 (~99 MB). CPU/WASM uses INT8 (~27 MB), one thread, without cross-origin-isolation requirements. GPU initialization failures are shown with an explicit CPU retry option rather than silently downloading another model.

Choose a maximum edge of 224, 336, or 518 px before starting. Both dimensions are rounded to multiples of 14 with aspect approximately preserved. RGB input is rescaled to [0,1], normalized with ImageNet mean [.485,.456,.406] and std [.229,.224,.225], and packed NCHW. Inference produces relative inverse depth, normalized independently for display. There is at most one frame in flight; the update limit is 1, 2, or 5/s and adapts to actual processing duration. Inference, warm-frame mean, delivered update rate and result age are displayed. First-frame compilation/warm-up is excluded from the running mean. Download/loading and inference have bounded watchdogs; stale worker/camera results after cancellation are ignored.

The optional rotatable 3D relief represents only the last frame, using an assumed 55-degree horizontal field of view and arbitrary inverse-depth scale. It is an illustrative point cloud, not metric geometry, accumulated SLAM mapping, occupancy mapping or relocalization. Depth colours do not indicate measured distances. The camera image is live; depth lags by inference time. Pause retains the live camera and model; a one-frame button is available while paused. Stop, pagehide or document hiding stops all camera tracks and terminates the worker. The last result remains only in memory for inspection. Starting again clears it. Frames and performance data are never uploaded; external network requests only retrieve runtime files and public model weights. Existing theme keys, service worker, map behavior and manifest are unchanged.

Validation includes geometry/preprocessing and cancellation/backpressure tests, plus the actual quantized ONNX model in the matching browser WASM runtime. Phone GPU support, sustained speed/heat, and permission/UI behavior still require an Android device check.
