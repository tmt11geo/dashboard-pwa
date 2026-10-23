# RGB-only pose prototype — offline, not deployed

This bounded experiment replaces neither the live scanner nor its fusion. It tests whether camera motion can be estimated independently of Depth Anything. Python/OpenCV is a reference implementation, not a browser-ready dependency. No application files import it.

## Reproduce

From the repository root (Python 3.11 used):

    python -m venv /tmp/depth-pose-venv
    /tmp/depth-pose-venv/bin/pip install -r tools/depth-pose/requirements.txt
    /tmp/depth-pose-venv/bin/python -m unittest discover -s tools/depth-pose -p 'test_*.py' -v
    /tmp/depth-pose-venv/bin/python tools/depth-pose/run_validation.py
    /tmp/depth-pose-venv/bin/python tools/depth-pose/run_real.py /path/to/scan-fixtures

The final command uses pinned inputs downloaded by tools/depth-scan/prepare_fixtures.py. run_validation.py always writes evidence/synthetic.json and exits **1 if any quality criterion fails**. That is the current expected outcome; do not suppress it in a promotion check. Use --out for a separate report and --images for optional regenerated image fixtures. No images need to be stored in the repository.

## Method and conventions

SIFT features, mutual descriptor matching with ratio checks, robust essential-matrix estimation, cheirality filtering, parallax and spatial-coverage checks. A dominant homography is flagged as rotation/planar ambiguity and supplies no translation. The reported polar-rotation approximation in that ambiguous state must not be used as a trusted general planar camera pose.

Coordinate convention: OpenCV optical X right, Y down, Z forward. Output maps first-camera points to second-camera coordinates: X2 = R X1 + t. Unit t is translation direction only; absolute scale is unobservable here. This differs from the app's X right/Y up convention and current-to-reference transform. A future port must explicitly invert the transform and convert axes; do not copy matrices directly. No depth, IMU, fusion or multi-frame bundle adjustment is used.

OpenCV's default recoverPose distance threshold is 50 unit baselines, not metres. The prototype explicitly uses 10000 and then checks actual median parallax (0.5 degrees minimum). It does not infer metric range from this parameter.

API references:
- https://docs.opencv.org/4.11.0/d9/d0c/group__calib3d.html (findEssentialMat, recoverPose)
- https://docs.opencv.org/4.11.0/d7/d60/classcv_1_1SIFT.html
- https://docs.opencv.org/4.11.0/d1/de0/tutorial_py_feature_homography.html

Dependencies: numpy 2.2.6; opencv-python-headless 4.11.0.86. Exact runtime versions are recorded in evidence/synthetic.json. No production/PWA runtime dependency was added.

## Test design

Independent pinhole renderer: non-repeating textured planes at four known depths, exact intrinsics, fixed seeds 42/117/903. Camera matrices and centres are ground truth; the estimator receives only rendered grayscale image pairs and K. Signed X/Y/Z translations, rotations around each axis, combined six-axis motion, stationary scenes, untextured images, unrelated scenes and a single-plane ambiguity control. Both 640×480 and 224×168 are tested (the three special ambiguity controls currently at 640 only). Small translation magnitude is 0.15 world units, with additional ±0.5 Z cases to test larger forward/back motion. Pixel-centre calibration follows resizing.

Criteria fixed before evaluation: rotation error <2 degrees and translation-direction error <10 degrees for translation cases. Rotation-only cases must return orientation within 2 degrees and no translation; other negative controls must return no translation. Tests report rejection of valid translation as failed recovery, not success. Inputs are hashed; fixtures regenerate deterministically. Report timings are desktop Python timings, not phone/browser performance. The scene is idealized, has sharp/static texture, and does not model rolling shutter or phone exposure.

## Result — promotion gate FAIL

| Resolution | Translation pose recovery | Negative controls | False translations |
| --- | --- | --- | --- |
| 640 | 21/27 | 30/30 | 0 |
| 224 | 13/27 | 20/21 | 1 |

All signed rotation-only cases at 640 recover orientation within the criterion. Small Z motion fails the parallax gate; larger Z motion recovers at 640. At 224, some accepted translations exceed the direction-error limit and one roll-only case emits a false translation. The 5 unit contract tests pass, but that does **not** override the quality-gate failure.

The real-data sanity replay estimates poses for four Redwood pairs using RGB and supplied calibration. It does not use the dataset's depth or claim verified ground-truth pose accuracy. Four recovered pairs are not evidence of better stitching than the existing app; there is no apples-to-apples reconstruction-quality comparison yet.

Evidence: synthetic.json, real.json, unit-tests.log. The earlier 50-baseline default rejected more valid translations; after making the cutoff explicit the remaining failures above remain in the committed report, without loosening the error criteria.

## Next bounded action

Improve rotation-versus-translation model selection and track quality at a separate tracking resolution (evaluate 640 while keeping depth at 224). Add held-out texture seeds, image noise/blur and wrong-calibration stress cases before tuning. Require zero false translations on negative controls and retained accurate recovery on signed six-axis cases. Establish ground-truth real-sequence pose errors and an old/new comparison on identical frames. Only then port the validated estimator to a worker/browser and proceed to depth alignment/fusion. No additional user phone logs are needed for this offline step; phone frames/calibration will eventually be needed for device accuracy evaluation.

## Next-stage rotation competition — 2026-10-23

The current candidate adds a robust rotation-only competitor. Historical results above belong to the preserved baseline. Full method, reproducibility, experiment policy and interpretation: [STRESS-REVIEW.md](STRESS-REVIEW.md).

The candidate was frozen before held-out evaluation. 456 cases cover new textures at two resolutions under clean, blur, noise and wrong-calibration conditions; another 64 cover two unseen geometric layouts. Both baseline and candidate process every identical input (1,040 estimator evaluations). Nine unit tests PASS; both quality evaluation commands exit 1, as expected from the failures.

| Test / width | Baseline correct poses | Candidate correct poses | Candidate false translations | Candidate inaccurate accepted poses |
| --- | --- | --- | --- | --- |
| clean / 640 | 21/27 | 21/27 | 0 | 0 |
| clean / 224 | 17/27 | 9/27 | 0 | 3 |
| blur / 640 | 21/27 | 21/27 | 0 | 0 |
| blur / 224 | 24/27 | 24/27 | 0 | 0 |
| noise / 640 | 21/27 | 21/27 | 0 | 0 |
| noise / 224 | 6/27 | 3/27 | 0 | 5 |
| wrong_calibration / 640 | 19/27 | 19/27 | 0 | 1 |
| wrong_calibration / 224 | 16/27 | 7/27 | 0 | 2 |
| new layouts / 640 | 9/18 | 9/18 | 0 | 0 |
| new layouts / 224 | 4/18 | 1/18 | 0 | 2 |

Promotion gate remains **FAIL**. The candidate emits no false translation across 268 negative controls, and recovers their required orientations. However, it still accepts 13 inaccurate poses across positive translation cases, and valid pose recovery falls at 224. Across all held-out sets, 640 recovery is unchanged at 91/126; 224 recovery falls from 67/126 to 44/126. Do not summarize the conservative rotation check as an overall accuracy improvement. Blur improves some 224 cases; higher resolution is not universally superior, although these tests favour 640 for reliable accepted directions with correct calibration.

Main remains unchanged. Next: temporal/keyframe tracking at 640 with calibration checks and fresh held-out sequences, retaining these failures as regressions; no fusion/browser integration or additional phone-log retry yet.

## Temporal/keyframe stage — 2026-10-23

New offline module: temporal.py. It retains an anchor to accumulate baseline and requires three compatible pose observations, with direction and rotation-cycle consistency. It enforces an explicit calibration contract. Full method, caveats and commands: [TEMPORAL-REVIEW.md](TEMPORAL-REVIEW.md).

Seventeen unit tests PASS. Development completed 6/8 translated sequences with 9 accurate keyframes. Frozen held-out evaluation used two new texture/layout seeds, 15 nine-frame paths and four profiles: 120 sequences / 1,080 frames. All emitted relative poses met <2-degree rotation and <10-degree translation-direction errors. The score is local keyframe pose, not global trajectory or fused-surface accuracy.

| Profile | Translated paths completed | Negative paths safe | Keyframes | Inaccurate keyframes |
| --- | --- | --- | --- | --- |
| clean | 13/16 | 14/14 | 18 | 0 |
| blur | 14/16 | 14/14 | 20 | 0 |
| noise | 11/16 | 14/14 | 14 | 0 |
| claimed_wrong_calibration | 7/16 | 14/14 | 9 | 0 |

Totals: 45/64 translated sequences completed; 56/56 negative sequences emitted no translation; 61 emitted keyframes, zero inaccurate/false translations. In the clean profile all 12 signed X/Y/Z translation sequences succeeded; both combined-motion sequences and one reversal were withheld. Two inaccurate raw anchor-pair estimates in the noisy profile were not promoted. Raw-pair counts are diagnostics on tracker-selected anchors, not a separate full-pipeline baseline.

Promotion gate remains **FAIL** because valid paths are still withheld. The wrong-calibration profile supplies incorrect intrinsics with claimed-valid metadata; passing metadata checks does not establish optical correctness. There were no inaccurate emitted poses in this test, but only 7/16 translated paths completed under that profile. No real-phone, rolling-shutter, metric-scale, global trajectory or fused-map accuracy claim is made.

Evidence: temporal-{clean,blur,noise,claimed_wrong_calibration}.json, temporal-summary.json, temporal-development-{clean,summary}.json, temporal-unit-tests.log, temporal-runtime.json. Each evaluation command deliberately returns 1 on quality-gate failure. Main and the live app are unchanged.

Next bounded action: track shared landmarks across three views and test triangulation/PnP or equivalent multi-view consistency, replacing ambiguous pairwise rotation-cycle evidence. Retain these failures as regressions and add fresh curved/reversal trajectories. Require accurate recovery as well as safe refusal before a browser port or depth fusion. No extra phone-log retries needed.

## Shared-landmark three-view experiment

See [THREE-VIEW-REVIEW.md](THREE-VIEW-REVIEW.md). 192 sequences: 102/108 positive
paths pass, 84/84 negatives safe, 266/268 emitted poses accurate. On identical
prior inputs recovery improves 45/64 → 62/64, with one noisy forward regression.
Two incorrect-calibration curved poses are inaccurately accepted. Promotion FAIL;
main unchanged. Next: robust seed validation/replacement and calibration policy.

## Seed recovery and independent calibration verification

See [RECOVERY-REVIEW.md](RECOVERY-REVIEW.md). Offline gate PASS: 108/108 movement
paths, 283/283 accurate poses, 84/84 safe negative paths, 128/128 unsupported-camera
scenarios rejected before tracking. All four correctly calibrated three-view
failures are recovered without regressions on identical prior inputs. 24 unit
tests pass. Main is unchanged. Next: phone calibration-capture/replay bridge;
synthetic evidence cannot validate the physical phone.
