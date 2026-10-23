# Six-degree-of-freedom review — build 8

The phone has three translations and three rotations. The current implementation can represent all six, but does not reliably observe all six from the available images.

| Motion in camera coordinates | Solver representation | Practical limitation |
| --- | --- | --- |
| X: left/right translation | t[0] | Image shift can also be caused by rotation about Y |
| Y: up/down translation | t[1] | Image shift can also be caused by rotation about X |
| Z: forward/back translation | t[2] | Expansion/contraction can be confused with changing predicted depth scale |
| Rotation about X | full 3×3 rotation | Preview guide has no rotation model; descriptors are not rotation invariant |
| Rotation about Y | full 3×3 rotation | Rotation-like prefilter can discard a genuine translation before 3D fitting |
| Rotation about Z | full 3×3 rotation | Roll damages patch matching; screen-orientation changes explicitly stop registration |

The code back-projects X right, Y up, Z forward. The fitted transform maps current-camera points into reference-camera coordinates: q = s R p + t. It is composed into the map coordinate frame. It is not a reading of Android device axes. Rotation matrices are used internally; diagnostics provide total angle and an axis-angle rotation vector in degrees, not three independent Euler angles. At nearly 180 degrees the vector is unavailable (null); the scalar angle is still reported.

Scale s is an additional fitting parameter to compensate for relative-depth predictions, not a seventh physical motion. A searched inverse-depth offset is another nuisance parameter. Translation is in arbitrary units, and translationOverDepth is dimensionless. The camera field of view is assumed (55 degrees), not calibrated. No IMU/gyroscope fusion, continuous six-axis camera tracker, bundle adjustment or loop closure is present.

## Guide versus registration

The live guide searches a 2D translation of a 72px preview. It estimates image shift, not the six-axis camera motion. It cannot distinguish X translation from Y rotation, Y translation from X rotation, or represent Z translation and roll correctly. A green progress indication is therefore only a capture/overlap heuristic. The separate accepted-view flash means the map accepted a view; it is not an accuracy guarantee.

Registration fits a full 3D similarity from matched patches and independently estimated depth. Patches are sampled on a two-pixel grid and are small and not rotation/scale invariant. Repetitive surfaces, depth changes and outliers can lead to apparently plausible but wrong fits. It compares only the latest accepted frame; errors can accumulate.

## Findings and release decision

The supplied build-7 phone log accepted frame 1 (1,658 points), rejected frames 2–5 with a shared rotation/translation message, and rejected frame 6 with 24/49 depth inliers. The first four messages are ambiguous: the same text was used for an early image-rotation veto and for a later small-translation check. They do not establish that the user rotated incorrectly.

A known-geometry fixture demonstrates that the early image-rotation veto can reject real translation. A separate rendered pure-rotation sweep also finds false acceptances (0.02 and 0.03 rad yaw). These are existing defects in the complete registration path. Solver-only recovery tests pass for both signs of all six axes and combined rotation, translation and scale; this does not validate real-camera tracking.

A candidate deferral of the early rotation veto with a reprojection-improvement requirement was explored. A robust-rotation variant then rejected useful translation while still admitting some false rotations. Neither candidate is shipped. Build 8 preserves build-7 acceptance thresholds and fitting behavior, adds stage-specific rejection codes and pose/depth/error diagnostics, and corrects messages that incorrectly imply knowledge of user motion.

Evidence: tests/depth-scan.test.mjs; tools/depth-scan/evidence/alignment-review-v8.json; node-tests-v8.log; browser-ui-v8.json; real-sequence-v8.json. The final algorithm is replayed on actual TFJS outputs from five pinned Redwood images. This is mixed real camera motion, not a controlled sideways-only phone sequence or a six-axis accuracy benchmark. Acceptance count alone is not a stitching-quality metric.

## Exact next action

Collect build-8 phone diagnostics to distinguish rotation-prefilter, translation-small, depth-consensus and geometry-limits. Develop a separate camera-pose validation harness using calibrated intrinsics, known poses, non-repetitive scenes and signed X/Y/Z translations, X/Y/Z rotations, and mixed motions. Measure pose direction/rotation error and overlapping-surface error, including pure rotation, stationary scenes and depth-scale changes as negative controls. Then evaluate a robust image-based pose tracker and relative-depth alignment together before changing fusion acceptance. Depth should support the tracked pose rather than being the only basis for it. Controlled phone image data is not available in the supplied logs; do not claim the phone stitching issue solved.
