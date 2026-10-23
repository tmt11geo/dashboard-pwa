# Rotation competition and held-out evaluation

Starting branch: depth-tfjs-webgl at b8b1ff4f43dd1748fa7cd13ec59cc9eb83977d2d. Scope: improve offline model selection and compare on new images at 640 and 224 pixels. No app, depth inference, fusion or deployment changes.

## Candidate and experiment policy

The candidate fits a calibrated rotation-only model directly to matched rays. A deterministic 96-trial, three-correspondence robust fit competes with the essential-matrix path. When at least 85% of matches fit rotation to within one image pixel, it returns rotation without inventing a translation. Existing descriptor, essential, cheirality, parallax and coverage thresholds remain unchanged. This is conservative model selection, not proof of a stationary camera centre.

baseline_b8b1ff4.py is byte-identical to the previous prototype, verified against its recorded source hash. Both estimators receive exactly the same images/calibration and each resets its random seed. The candidate was developed on the existing seeds only, then frozen before run_stress.py. No candidate changes or threshold tuning were made after inspecting held-out results.

stress_spec.json records seeds 211/683/1559, both resolutions, Gaussian blur sigma 1.2 output pixels, independent noise sigma 8 intensity levels, and a calibration stress with focal lengths 15% high and principal-point offsets (+8,-6) scaled from 640 pixels. These are controlled stress levels, not a distribution measured on the phone. The noise profile can turn a flat image into different random noise; its expected output remains no translation.

The first held-out set changes textures but retains the development scene geometry. run_layouts.py separately changes depths, centres and surface extents with unseen seeds 57291/90210, and paints far-to-near. This is still a synthetic plane renderer, not independent real-world six-axis ground truth. Held-out sets become consumed evaluation data after this run; future tuning needs additional untouched data.

## Reproduce

Use the pinned environment in README.md:

    python tools/depth-pose/run_validation.py --out /tmp/development-rotation.json
    python -m unittest discover -s tools/depth-pose -p 'test_*.py' -v
    python tools/depth-pose/run_stress.py
    python tools/depth-pose/run_layouts.py

Use the virtual-environment Python from README.md. Both evaluation programs save all failures and return 1 if any candidate quality criterion fails. Nine unit tests verify contracts, signed rotations, rotation fitting with correspondence outliers, clear-parallax recovery and the original low-resolution roll regression. Unit success is not a promotion pass.

Criteria are unchanged: <2 degrees rotation error; <10 degrees translation-direction error for every positive pose. Negative controls must output no translation; stationary/rotation cases must also recover orientation. Withholding a genuinely translated pose counts as failed recovery. A pose with a wrong direction counts as an inaccurate accepted pose, separately from translation falsely output for a negative control.

Evidence includes source/input hashes and per-case outputs. The baseline's original evidence/synthetic.json is preserved. New development results are in development-rotation.json; comparison results are in stress-summary.json, stress-{clean,blur,noise,wrong_calibration}.json and layouts.json. No timing here establishes browser/mobile performance. Depth stays at 224 only as an intended architecture; no depth execution is part of these tests.

## Interpretation and next action

Read the accompanying summary table in README.md. This candidate is an offline experiment and is not ready for browser integration. A safer refusal is useful, but must not be counted as successful reconstruction. No claim is made that the model-selection change fixes low-parallax forward motion, bad calibration or erroneous low-resolution translation direction.

Next bounded task: add temporal baseline/keyframe selection and pose-consistency validation at 640 tracking resolution, with explicit calibration requirements. Preserve the current held-out failures as regression cases and use fresh geometry/noise samples for evaluation. Establish trustworthy real-sequence pose errors before a worker/browser port or depth fusion. Do not ask for more phone log retries at this point.
