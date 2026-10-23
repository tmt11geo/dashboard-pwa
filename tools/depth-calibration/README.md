# Phone calibration capture / independent replay

Build `calibration-1`, linked from Depth Lab. The user authorized completing the
implementation, deployment and test handoff in one run; earlier one-stage stopping
instructions are superseded for this task. The existing relief solver is unchanged.

## User flow

Open `calibration-target.html`, print A4 landscape at actual size, keep the white
border and mount flat. In `calibration.html`, hold the phone landscape, start the
rear camera, follow the prompts, hold still for each capture, wait for green,
then change board pose. Minimum 16 accepted views, maximum 24. Validate and save
the session. Even a failing/provisional session can be exported for review.
The page has no upload endpoint. Reloading discards unsaved in-memory captures.

The page uses a dedicated worker and bundled, hash-verified OpenCV WASM. Runtime
transfer is 4,342,943 gzip bytes, split into eight repository transport parts;
original JS SHA-256 is recorded in vendor/calibration-opencv/manifest.json.
Parts are same-origin, combined, verified and decompressed before execution.
OpenCV Apache-2.0 / build-project MIT licences and source provenance are bundled.
No third-party runtime requests or camera-frame network requests occur.

## Camera and geometry contract

Capture the browser video's central 4:3 region, resize to 640x480, do not mirror,
rotate or undistort. Export source dimensions, crop, output dimensions, screen
angle, camera ID/label, facing, zoom/focus/resize settings and capabilities for
each view. Attempt manual focus locking after camera startup; if unsupported,
measurements are explicitly provisional. Geometry/focus/zoom changes stop capture.
Permission cancellation, late streams, worker failure/timeouts, hidden pages and
Stop release tracks/worker. Saved captures remain exportable after stopping.

Target: 10x8 squares, 9x7 internal corners, nominal 18 mm squares. Detection uses
subpixel refinement and rejects incomplete/small/edge-clipped/duplicate views.
Intrinsics/distortion calibration uses k1/k2/p1/p2, k3 fixed. Two interleaved groups
must agree within 2% focal/2px principal point, train and held-out RMS <=0.5px,
varied tilt and all four image quarters. No reported pass is applied automatically
to the current scanner. A finite test pass is not proof of real-scene pose accuracy.

## Validation

- 21 local Chromium browser checks PASS: actual runtime + actual board detection,
  16 captured views, duplicate rejection, known-intrinsic calibration, saved JSON,
  undo/invalidation, stop/hidden cleanup, denied/late permissions, runtime failure,
  changed zoom, no external requests, portrait/landscape layout.
- 5 actual-engine checks PASS: good calibration, insufficient/nonfinite/bad-group
  rejection and blank-image rejection.
- Independent Python replay PASS: all 16 PNG boards re-detected, recorded corners
  checked, raw-camera folds recomputed, corrected observations validated through
  VerifiedCalibration. RMS 0.253594 px. Camera is simulated, images independently
  rendered; no physical OnePlus measurement or performance claim.
- Existing Node suite: 72/72 PASS. Syntax/diff checks PASS.
- Mobile and landscape screenshots inspected. All capture controls and the whole
  preview fit together in the tested 915x412 landscape viewport.

Evidence lives in `evidence/`. Source/asset hashes are in verification.json.
No physical user images are committed; synthetic fixture generation is reproducible.

## Reproduce

Use tools/depth-pose/requirements.txt in a Python environment and Playwright with
Chromium. From the repository root:

```
python tools/depth-calibration/make_fixtures.py
DEPTH_CHROMIUM=/path/to/headless_shell node tools/depth-calibration/run_browser.cjs
node tools/depth-calibration/test_engine.cjs /tmp/calibration-fixtures/session.json
python tools/depth-calibration/validate_session.py /tmp/calibration-fixtures/session.json /tmp/replay.json
node --test tests/*.test.mjs
```

The browser harness makes the synthetic session for subsequent replay. Override
NODE_PATH if Playwright is installed outside the normal module path.
For a real exported file, run validate_session.py on that file, do not trust its
browser `passed` flag. It validates format/size, PNG dimensions, constant geometry,
re-detects corners, checks duplicate images, independently calibrates and evaluates
both held-out folds, then validates undistorted observations against the offline
tracker's evidence contract. The report binds the input file/images by hashes.

## Remaining device action

User captures and shares a session. Inspect focus lock, geometry, fit/replay errors
and camera behavior before integrating calibrated pose tracking with depth fusion.
Raw frames require undistortion with that exact K/distortion and unchanged crop.
Calibration consistency alone is not a reconstruction-quality gate. Keep Cloudflare
Access and existing PWA/navigation/ONNX choices intact.
