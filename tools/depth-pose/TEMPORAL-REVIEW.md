# Offline temporal/keyframe stage

Starting branch depth-tfjs-webgl: d9ea04e63ae92e4854d0141ed28d57339844e895. Main remains 308686f9d81e1218c866c936b8a24e3a74064fe4. This is a reference implementation, not a live scanner fix or a browser port.

## What was added

KeyframeTracker keeps an anchor image while movement accumulates. It uses the existing frozen RGB-only pair estimator, and promotes a new keyframe only after three consecutive distinct frames have compatible anchor-relative poses. Camera-centre directions are compared in the anchor frame (5-degree agreement bound), rather than mixing current-camera axes. Incremental rotation must agree with the anchor/previous-frame rotation chain within 1 degree. A refusal, repeated image, incompatible direction or rotation cycle restarts confirmation. Exact repeated images cannot manufacture temporal support.

The tracker retains at most an anchor image, previous image and a short list of directions. It copies input images/calibration to avoid caller mutation. Frame IDs must increase. A calibration-ID change, image dimension mismatch or invalid matrix is rejected; reset releases retained frames. Unit tests exercise these behaviors and transform-cycle consistency.

Returned R,t still describe a **local anchor-to-current transform with unit translation direction**. Unit translations from different keyframes are not added into a global path: their scales differ. No metric mapping, bundle adjustment, triangulated multi-frame landmark map, loop closure, depth alignment or fusion is implemented.

## Calibration contract

Inputs must be undistorted 640×480 grayscale images, with named measured or synthetic intrinsics, finite plausible matrix entries and recorded calibration reprojection RMS <=0.5 pixels. Assumed field of view is refused. The caller must supply an actually undistorted image; the tracker does not undistort it.

These are schema/provenance checks, **not an optical calibration verification**. A false calibration record can satisfy them. The adversarial claimed_wrong_calibration profile deliberately supplies wrong focal lengths/principal point with claimed-valid metadata to expose that limitation. Do not equate passing metadata checks with correct phone calibration.

## Sequence evaluation

temporal_spec.json fixes thresholds, fresh seeds 39517/79431, nine-frame trajectories, and clean/blur/noise/claimed-wrong-calibration profiles. Every seed changes texture and geometry; planes are painted far-to-near. The 15 paths comprise stationary, signed X/Y/Z translations, signed rotations around each axis, combined translation/rotation, and a reversal. The underlying renderer and type of static plane scene remain shared with development, so this is not real-world validation.

Development used seed 42 only. The candidate was frozen before the held-out run, with source hashes recorded in every result. No thresholds were adjusted from held-out results. Positive sequence success requires at least one emitted keyframe and every emitted pose within <2-degree rotation and <10-degree translation-direction errors. Negative sequences must emit no translation. A tracker that never emits anything therefore cannot pass. Reports include each selected anchor, raw anchor-pair score, confirmation count, rotation-cycle residual, image hash and emitted-pose error.

Raw-pair scores use the tracker's selected anchor. They are diagnostics on the same inputs, not an independent end-to-end baseline trajectory or a comparison of maps. Wrong raw poses withheld by temporal checks are useful; withheld valid trajectories remain failures.

## Run

Use the pinned virtual-environment Python from README.md:

    python -m unittest discover -s tools/depth-pose -p 'test_*.py' -v
    python tools/depth-pose/run_temporal.py --development
    python tools/depth-pose/run_temporal.py

Development and held-out reports are separate. Evaluation always writes evidence, then returns 1 if any quality criterion fails. The 17 unit tests do not override that quality gate. See README.md for the measured result table.

## Limits and next decision

Temporal agreement can repeat a systematic error. The current cycle check itself uses pair estimates: a rotation-like short-baseline increment may not uniquely resolve translation, and its rotation estimate can reject a valid translated trajectory. Constant-direction confirmation is conservative for curved paths. Reset after tracking loss is explicit; the tracker does not silently re-anchor a failed scene.

The next step must be chosen from the recorded failure types. If recovery fails, replace ambiguous pairwise cycle checks with shared-landmark multi-view consistency, retaining the refusal of unresolved scale. If wrong calibrated poses survive, add independent calibration/pose-consistency evidence before loosening acceptance. Do not integrate depth fusion or deploy the tracker just because multiple frames agree. No additional phone log retries are needed to continue offline work.
