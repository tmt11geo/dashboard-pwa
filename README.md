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

Tap a box or object button to select a lock. Locking terminates the YOLO worker, including any in-flight inference. A small 16×16 grayscale template tracker follows only the selected image patch at a target of 15 updates/s, using frames with a longest edge of 320 pixels. It searches translation and small scale changes with normalised correlation; an initial fixed template limits drift. The template is seeded from the actual detection frame rather than a newer, potentially misaligned frame. Release / scan reloads the detector and resumes scanning; YOLO never restarts automatically during a lock or after track loss. Arrows and the MOVE DEVICE readout guide device movement toward the object: an object left of centre shows left, an object above centre shows up. This reverses the earlier box-movement guidance. The video is unmirrored for both cameras. Loss near an edge produces a **likely** exit side/corner from the last observed box; loss elsewhere is marked unknown. After 0.9 seconds without a reliable visual match, the lock is lost. Release / scan is required to detect and select again. Low-texture areas, occlusion, fast motion, rotation, large scale changes and similar image patches can defeat this tracker; it does not establish identity or sense outside the view. Stopping, hiding or leaving the page releases camera tracks and terminates inference. Existing theme keys, manifest identity, start URL and service worker/network-only navigation remain unchanged.

Pure geometry/tracking/decoder checks: `node --test tests/*.test.mjs`. Real permission, inference speed and camera alignment also need an Android Chrome device check.
