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

## Calibration-to-scan integration (depth-lab-9)

See `docs/depth-calibrated-scan-test.md` for the phone workflow. `depth-calibration.js`
imports the original local session, verifies all PNG/corner observations using the
bundled actual OpenCV worker, recalibrates the interleaved folds, and binds the
result to the actual camera stream. The file's passed flag and saved K are not trusted.
No raw phone images or identifiers are committed to this repository.

`depth-calibration-core.js` maps undistorted output pixels back into the distorted
640x480 crop using Brown–Conrady coefficients and bilinear interpolation. K is
rescaled to the cropped model output using pixel-centre coordinates. Both model
RGB and tracking RGB come from this same corrected capture. The original distorted
640x480 crop is kept in the private bounded replay for independent processing.

`depth-scan-flow.js` tracks spatially distributed corners at 640x480 with pyramidal
Lucas–Kanade and a one-pixel forward/backward consistency bound. It supplies image
correspondences, not pose. The existing robust relative-depth similarity/offset
registration estimates pose/scale, now using calibrated projection and reprojection.
A robust rotation-only competitor prevents fusion when rotation explains the RGB
matches substantially better, or almost all matches with very small error. Existing
consensus, spatial coverage, pose, scale, duplicate and map memory gates remain.
The old 55-degree path remains solely for legacy core tests; the live scan requires
calibration and supplies K and 640x480 tracking images. Ordinary depth is unchanged.

Reproduce (private session path is an argument, never a repository fixture):

```
node --test tests/*.test.mjs
node tools/depth-calibration/evaluate_scan.mjs
DEPTH_CHROMIUM=/path/to/chromium node tools/depth-calibration/test_scan_browser.cjs SESSION.json
DEPTH_CHROMIUM=/path/to/chromium node tools/depth-calibration/test_scan_browser.cjs SESSION.json --real
python tools/depth-calibration/replay_scan.py SESSION.json SCAN_REPLAY.json REPORT.json
```

The actual-model test uses the pinned TFJS 4.22.0 runtime at `/tmp/tf.min.js` and checks
its SHA256 before routing the unchanged CDN URL locally. Browser tests simulate the
camera from one private saved image; they do not establish physical scan performance.
`replay_scan.py` independently validates the calibration again, binds its input hash
and geometry, undistorts RGB, and runs the existing `RecoveryTracker`. Its diagnostics
have no real-scene ground-truth pose. A one-frame test establishes only the anchor.

Evidence: `scan-node.log`, `scan-browser.json`, `scan-actual-tfjs.json`,
`scan-heldout.json`, `scan-heldout-initial.json`, `scan-verification.json`.
The initial evaluation recorded three false rotation acceptances (one scene under
three depth profiles). That failed candidate was not deployed. The subsequent
comparison of rotation residual against depth-pose reprojection error fixed these
regressions. Seeds 902/2061 are now regression data; 18771/98211/31009 were fresh after
that change. All final 30 translated views were accepted with <0.005 error in initial
arbitrary depth units; all 90 yaw-only rotations withheld. This is a bounded synthetic
suite, not general reconstruction accuracy. Development repetitive-texture failures
were retained as rejected observations, not counted as successful recovery.
