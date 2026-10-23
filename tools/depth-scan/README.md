# Guided persistent relief experiment

Build depth-lab-6 adds **Start guided scan** on depth.html. It selects TFJS WebGL,
waits for a steady camera image, captures one frame, aligns it, and rests at least
1.8 seconds before considering another. After rejection, the user must change
the view before retrying. Image difference controls stability/novelty only; it is
not claimed to measure pose or tracking confidence. Registration provides those
accept/reject decisions after the depth result is available.

Use a textured stationary scene. Keep most of the previous view visible, move a
little sideways, hold still, then wait for “View added”. Do not rotate the phone
between portrait and landscape during a scan. Pause keeps the camera/model ready;
Finish terminates both workers and camera tracks but retains accepted points.
Save relief file downloads a versioned JSON containing coloured geometry, not
source images. Open restores the saved scene for inspection, including after a
page reload. Saved scenes cannot resume tracking. Clear is required for a new scan.

## Implementation and limits

- The TFJS worker sends an independent raw inverse-depth buffer for scan requests.
  Display normalization remains separate. Capture timestamp, source dimensions,
  crop and screen orientation accompany each frozen input. Ordinary ONNX inference
  is unchanged. Ordinary TFJS mode now has at least one second of post-result rest.
- CPU registration runs in a separate module worker. Up to 240 distributed corner
  features, normalized patch descriptors and mutual ratio matching identify shared
  detail (32-pixel search radius in 224-scale frames).
- A rotation-only ray fit rejects near-pure rotation. RANSAC fits a 3D similarity
  transform while searching a per-frame inverse-depth offset. The transform uses
  Horn's quaternion absolute orientation with a Jacobi eigensolver; see
  https://doi.org/10.1364/JOSAA.4.000629 .
- Reject if fewer than 16 shared inliers, under 60% inliers, poor spatial coverage,
  median relative 3D error above .022, median reprojection above 1.8 px, rotation
  above .22 radians, or translation above .18 median-depth units. Near-zero/invalid
  inverse-depth samples are excluded rather than invalidating all correspondences.
- Intrinsics are approximate (55 degrees along the longer image dimension), scale
  is arbitrary, and Depth Anything geometry can change non-rigidly across frames.
  The system has no loop closure, bundle adjustment, calibrated tracking, metric
  distances or reliable moving-object separation. Repeated patterns can still
  mislead correspondence. This is an experimental short-scan relief, not a precise
  room survey. Some otherwise valid views will be rejected deliberately.
- Fuse by adding occupied voxels only where absent, retaining old geometry. This
  avoids moving earlier accepted surfaces but does not remove conflicting/occluded
  surfaces; drift can create ghosts. Limits: 32,000 points, 40 views, one retained
  keyframe, bounded cumulative scale and coordinate limits. No unbounded frame queue.
- Finish/navigation ignore stale messages, release resources and preserve the
  visible scene in memory. Persistence across closing the page requires Save.
  Import validates schema/version/counts/finite coordinates/colours and an 8 MiB cap.

## Reproduction

Dependencies: Node with Playwright, a compatible Chromium/headless shell, Python
standard library. Test inputs are downloaded to scratch with exact hashes:

```
python tools/depth-scan/prepare_fixtures.py /tmp/scan-fixtures
node --test tests/*.test.mjs
NODE_PATH=<playwright modules> DEPTH_CHROMIUM=<headless_shell> \
 node tools/depth-scan/run_browser.cjs /tmp/scan-fixtures
NODE_PATH=<playwright modules> DEPTH_CHROMIUM=<headless_shell> \
 node tools/depth-scan/run_browser.cjs /tmp/scan-fixtures --real
```

The browser UI test uses a controlled depth-inference double, a generated camera
stream, and the real mapping worker. The separate real test loads the actual
98 MB packaged model in TFJS WebGL with CPU forwarding disabled and processes five
Open3D SampleRedwoodRGBDImages colour images. Sensor depths are not fed to the
model. This five-image example is a small real-sequence feasibility check, not a
long-scan accuracy benchmark. Chromium 141 SwiftShader timings are not phone speed.

Evidence is in evidence/node-tests.log, browser-ui.json and real-sequence.json.
Synthetic tests cover known 3D transforms, affine depth changes, retained geometry,
rotation/large-move/texture rejection, invalid sample exclusion, budgets, file
validation and capture gating. No actual OnePlus guided-scan result is claimed.

## Next physical-device test

On OnePlus, open depth.html?v=7 and confirm depth-lab-7. Start guided scan facing
textured stationary furniture. Wait for the first view, move a few centimetres
sideways with overlap, hold and wait for acceptance. Try 3–5 views, pause, finish,
rotate the relief, Save, reload and Open. Share the diagnostic log and whether
geometry aligns, the UI responds, and the phone warms. If a view is rejected,
return towards the last accepted view; do not repeatedly sweep across the room.

Build 6 UX checks: evidence/browser-ui-v6.json (19 checks), node-tests-v6.log (64 tests). Both views and scan controls share one panel. Wait for the green MOVE NOW pulse before moving; amber capture/alignment means keep still. Reduced-motion preference replaces the pulse with a static outline.

Build 7: movement overlay uses a 72px preview and normalized translation correlation (not pose). Target 4–10 preview pixels, approximately 6–14% image shift. Capture is withheld outside this range or with ambiguous matches. 68 Node tests and 22 browser checks; evidence/node-tests-v7.log and browser-ui-v7.json. prepare_fixtures.py additionally creates rendered-move.json with larger sideways steps for this target. No new physical-device acceptance claim.

Build 8 is a diagnostic release, not a stitching fix. Read ../../docs/depth-scan-6dof-review.md. Run the browser harness with --real to regenerate actual TFJS model-frames.json, then node tools/depth-scan/review_alignment.mjs /path/to/fixtures for the final registration replay and pure-rotation stress cases. Evidence includes known failures; acceptance count is not a quality score. Phone log summaries do not establish which of build 7's two identically worded rejections fired.
