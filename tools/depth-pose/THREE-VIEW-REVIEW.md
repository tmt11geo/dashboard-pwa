# Shared-landmark three-view checkpoint

Offline experiment only. `three_view.py` leaves the live browser, Depth Anything,
`prototype.py` pair estimator and prior `temporal.py` unchanged.

The first validated anchor-to-second-view pair seeds a bounded landmark set.
Mutual SIFT descriptor matches identify the same anchor keypoints in the third
view. Two-view triangulation uses X_second = R X_anchor + t and a unit seed
baseline. Points must be in front of both cameras and reproject within one pixel.
The third camera is estimated using PnP RANSAC and refined using its inliers.
Acceptance requires at least 24 shared inliers, 60% support, five of nine image
cells, positive depth, median reprojection error <=1px, and agreement with the
independent anchor-to-third pair (<1 degree rotation, <5 degree direction).
The pair estimator's rotation and planar ambiguity guards remain in force.

Unlike the previous policy, this does not require three camera-centre directions
to agree along a straight line, or independently estimated incremental rotations
to compose at very short baselines. It requires landmarks shared by three views.
A successful third view becomes the next anchor. Only its unit translation
direction is exposed. Seed scale is arbitrary and discarded on promotion; there
is no global trajectory, metric scale, depth fusion or browser implementation.

Calibration and frame contracts remain those of `temporal.Calibration`. Metadata
cannot verify actual optics. Exact repeated images cannot confirm a pose. The
first seed remains until promotion/reset; a bad or obsolete seed can therefore
stall tracking. No relocalization, seed replacement, bundle adjustment, rolling
shutter model or moving-object segmentation is implemented. Descriptor identity
and pair/PnP agreement are not independent proof of geometric correctness.

## Reproduction

Use requirements.txt in an isolated Python environment, then from the repo root:

```
python -m unittest discover -s tools/depth-pose -p 'test*.py'
python tools/depth-pose/run_three_view.py --development
python tools/depth-pose/run_three_view.py
```

Quality runners save their reports even when they exit 1. Tests have known-pose
triangulation, behind-camera rejection, duplicate/reset/calibration contracts,
and the existing pair/temporal tests. Sequence fixtures independently render RGB
from known camera poses; the tracker receives RGB and intrinsics only. Ground
truth scores rotation and translation direction relative to each emitted pose's
reported anchor, never guides estimation.

`three_view_spec.json` was fixed before held-out evaluation. Prior seeds 39517
and 79431 retain all previous trajectories as regressions; seed 86243 supplies a
fresh texture/layout, and a curved path is added for all seeds. Each of four
profiles has 48 nine-frame sequences: clean, blur, noise and deliberately wrong
intrinsics with valid-looking metadata. Existing evidence is preserved. Prior
seed/path input hashes allow direct sequence comparison even though the two
trackers may select different intermediate anchors. No tuning follows these
results. Offline CPU tests do not establish phone speed or real-scene accuracy.

## Results — 2026-10-23

20 unit tests PASS, dependency check PASS, diff whitespace check PASS. Development
seed 42: 8/9 positive paths, 7/7 negative paths, 22 accurate keyframes; its curved
path remains withheld. Frozen evaluation: 192 sequences / 1,728 frames.

| Profile | Positive sequences passed | Negative sequences passed | Emitted keyframes | Inaccurate emissions |
| --- | --- | --- | --- | --- |
| Clean | 27/27 | 21/21 | 72 | 0 |
| Blur | 26/27 | 21/21 | 74 | 0 |
| Noise | 24/27 | 21/21 | 61 | 0 |
| Claimed wrong calibration | 25/27 | 21/21 | 61 | 2 |

Total 102/108 positive sequences passed; 84/84 negative sequences emitted no
translation. 268 emitted keyframes, 266 within the <2-degree rotation and
<10-degree translation-direction limits. Promotion FAIL (runner exits 1).
Wrong-calibration curved paths for seeds 39517 and 79431 accept direction errors
11.37 and 11.76 degrees, respectively. These are inaccurate accepted translations
on moving-camera sequences, distinct from false translations on negative controls.

On all 120 previous sequences, input hashes match exactly. Positive sequence
success improves from 45/64 to 62/64: 18 improvements, one regression. The new
noise regression is seed 79431 forward Z; its seed pair direction error is 11.26
degrees. All existing clean combined/reversal failures are recovered. Clean
emissions have maximum rotation/direction errors 0.492/4.843 degrees. There are
no ground-truth-guided runtime decisions. Comparisons score each tracker's own
chosen anchors, and cannot imply identical local pose estimates.

The blurred fresh curved failure starts from a seed with 10.61-degree direction
error. Subsequent PnP/pair checks reject it, but the stale seed is never replaced.
Thus accurate later pairs cannot restore progress. Calibration metadata remains
insufficient: wrong optics can produce mutually consistent but wrong estimates.
This change improves synthetic recovery but also exposes two accepted errors on
new paths, so it must not replace the live scanner yet.

Evidence: three-view-{clean,blur,noise,claimed_wrong_calibration,summary}.json,
three-view-development-{clean,summary}.json, three-view-comparison.json,
three-view-tests.log and three-view-runtime.json. Reports record source hashes,
input hashes, per-frame reasons, anchors, PnP diagnostics and ground-truth errors.
Run `python tools/depth-pose/compare_three_view.py` after both report sets exist.

Exact next bounded action: implement seed validation/replacement after repeated
three-view disagreement, with joint reprojection refinement or equivalent robust
initialization. Preserve every current failure (including both inaccurate
wrong-calibration curved emissions and the noisy forward regression), freeze the
candidate, and evaluate new curved/reversal/noisy scenes and calibration offsets.
Define independently verified camera-calibration requirements before a browser
port; low reprojection error alone must not be called calibration validation.
No threshold relaxation, phone retesting, fusion or deployment in this checkpoint.
