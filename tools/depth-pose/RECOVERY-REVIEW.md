# Landmark recovery and independent calibration evidence

This offline candidate preserves `three_view.py`, `temporal.py`, the pair
estimator, all previous evidence, and the live browser unchanged.

## Seed recovery

`RecoveryTracker` retains the existing pair, PnP, coverage, cheirality and
reprojection thresholds. When two evaluated third-view checks fail, it replaces
the seed using the current validated anchor pair. Replacement requires at least
24 triangulated positive-depth points with <1px reprojection error in each image.
The anchor stays unchanged, no translation is emitted, and a subsequent distinct
image must independently pass the normal third-view checks before promotion.
There is one bounded landmark map; no growing list of candidate maps. Reset also
releases anchor features and clears the failure counter. Duplicates do not count
as validation or failure. Pair-level rejections cannot seed a map.

This is bounded reinitialization, not bundle adjustment. It removes the permanent
bad-seed stall but cannot guarantee the replacement seed is accurate. Tests must
measure resulting emissions, not just whether more sequences produce additions.

## Calibration contract

`VerifiedCalibration` requires separate observations of a known calibration
target in at least 12 views. Interleaved folds independently fit undistorted
intrinsics and must support the supplied focal lengths within 2% and principal
point within 2px. Each fold needs six distinct views and varied target tilt.
Fitted RMS and held-out target RMS must be <=0.5px. Lens distortion is fixed to
zero because the tracker contract requires already-undistorted images.

The candidate refuses the previous metadata-only `Calibration`. Evidence must
come from the same camera, resolution, crop, zoom and focus as tracking, and the
undistortion pipeline must match. The offline synthetic target is solely a test
fixture; it must NEVER be supplied as evidence for a physical phone. A camera
identity string or evidence hash does not authenticate the camera or observations.
The caller is responsible for binding target evidence to the capture pipeline.

Validation can reject the deliberately wrong intrinsics using independent target
measurements; it does not infer correct optics from arbitrary scene motion.
This is an explicit prerequisite, not improved pose recovery under wrong optics.
The 2%/2px tolerances are bounded engineering checks, not a universal pose-error
guarantee. Real lens distortion, rolling shutter, autofocus and calibration
uncertainty still need device validation before production use.

## Reproduction and test separation

Use the existing pinned requirements.txt. From the repository root:

```
python -m unittest discover -s tools/depth-pose -p 'test*.py'
python tools/depth-pose/audit_calibration.py
python tools/depth-pose/run_recovery.py --development
python tools/depth-pose/run_recovery.py
python tools/depth-pose/compare_recovery.py
```

The tracker receives RGB, intrinsics and independent calibration target evidence;
it never receives tracking ground truth or Depth Anything outputs. Target evidence
is generated separately with its own seed, and is reproducible from
`calibration_fixtures.py`. Known tracking poses are used only to score output.
Reports record source/image hashes and per-frame reseeding/PnP diagnostics.
`recovery_spec.json` is frozen before evaluation; no tuning on held-out results.

Previous three-view scenes remain regressions. Fresh seed 117293 adds layout and
texture variation; negative calibration offsets add a fresh mismatch profile.
Correctly calibrated positive paths must yield at least one accurate keyframe,
all emissions must meet <2-degree rotation / <10-degree direction error, negative
paths must not emit translation, and invalid calibration must be rejected before
tracking. Invalid-camera rejection is reported separately, never as successful
pose recovery. Compare inputs and per-sequence outcomes with compare_recovery.py.
No browser performance, physical phone accuracy, global scale or fusion claim.

## Results — 2026-10-23

Offline candidate gate PASS. This does not authorize browser/phone promotion.
24 unit tests PASS; 15 independent calibration-audit cases PASS; dependency and
whitespace checks PASS. Development: 9/9 movement paths, 7/7 negative paths,
23 accurate emissions. Frozen evaluation: 320 scenarios, of which 192 correctly
calibrated sequences process 1,728 RGB frames and 128 invalid-camera scenarios
are rejected before tracking.

| Profile | Movement paths | Negative paths | Accurate/emitted keyframes | Calibration rejections |
| --- | --- | --- | --- | --- |
| Clean | 36/36 | 28/28 | 94/94 | 0 |
| Blur | 36/36 | 28/28 | 100/100 | 0 |
| Noise | 36/36 | 28/28 | 89/89 | 0 |
| Wrong +15% focal, shifted centre | Not run | Not run | 0/0 | 64/64 |
| Wrong −10% focal, shifted centre | Not run | Not run | 0/0 | 64/64 |

All 108 correctly calibrated movement paths pass; all 283 emitted poses meet
<2-degree rotation and <10-degree direction error. All 84 negative paths emit
no translation. Wrong-calibration rejection is not counted as recovered motion.
It explicitly blocks the two previously inaccurate curved-path emissions.

Input hashes match across all 144 previously evaluated correctly calibrated
sequences. Movement recovery improves 77/81 → 81/81, four improvements and no
regressions. Recovered cases: blurred curve seed 86243; noisy backward Z and curve
seed 39517; noisy forward Z seed 79431. The blurred curve reseeds at frame 3,
then passes ordinary third-view consensus at frame 4. Fresh seed 117293 also
passes all clean/blur/noise paths. No implementation changes followed held-out
results; report source hashes match the committed candidate.

Evidence: recovery-{clean,blur,noise,claimed_wrong_calibration,
wrong_calibration_minus,summary,comparison}.json, recovery-development-{clean,
summary}.json, recovery-calibration-audit.json, recovery-tests.log and
recovery-runtime.json. Source and image hashes, reseeding reasons, pose errors,
calibration audit fold errors and evidence hashes are preserved.

Remaining boundary: this is Python/OpenCV offline code and synthetic camera
validation. The live phone scanner is unchanged. Real camera/crop/focus binding,
distortion correction, rolling shutter, real-scene accuracy, browser availability
of the tracking operations, runtime cost and relief fusion remain unverified.
Passing these finite tests is not a universal calibration or SLAM guarantee.

Exact next bounded step: build a local phone calibration-capture/replay bridge.
Record known-target observations with camera identity, actual image dimensions,
orientation, crop, zoom/focus and distortion/undistortion metadata. Export locally
for independent validation and replay through this tracker; do not substitute
synthetic calibration evidence for phone measurements. Confirm real-camera
calibration and pose behavior before browser tracker integration or depth fusion.
Keep main/depth-lab-8 unchanged until that integration is tested and authorized.
