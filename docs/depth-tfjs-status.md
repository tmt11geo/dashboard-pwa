# Technical handoff — Depth Anything V2 Small via TFJS WebGL

## Android camera-startup correction — 2026-10-24

Resumed depth-tfjs-webgl at 96b377a74e22994fbc140a63ec296338db58f9cd;
main inspected at 3a1eab49ebe713b5250de1a98eb3573fe5a94dda. No AGENTS.md.
Phone build-9 logs prove calibration import passed repeatedly (16 views,
RMS 0.250362 px), then getUserMedia rejected four starts with OverconstrainedError
before camera frames/model startup. The old logger omitted error.constraint, so
its exact cause is unknown. Screenshot is portrait despite landscape calibration,
and shows stale Load calibration guidance next to Calibration ready.

Implemented depth-lab-10: preflight orientation before camera permission; use
ideal source dimensions/resize mode while retaining exact calibrated deviceId;
unchanged mandatory actual geometry/identity/focus/zoom checks before inference
and during scanning. No guessed camera or relaxed calibration application. Import
status now refreshes scan guidance; startup failures appear next to Start scan.
Diagnostics include rejected constraint and sanitized request size/orientation,
without exposing device IDs. Generic reduce-detail advice removed for startup errors.

80 Node tests PASS; 19 actual-browser checks PASS with the real private calibration
images, real verification/registration workers and controlled inference/camera.
Simulated Android rejects old exact size/resize requests: new preferences succeed.
Portrait start makes no camera request; stale guidance clears; injected deviceId
rejection is visible in guidance/logs; camera mismatch/cleanup/replay gates pass.
No new physical startup or actual-TFJS performance claim. Existing model, geometry,
tracking/fusion, Access, maps, ONNX and PWA policy are unchanged.
Evidence: tools/depth-calibration/evidence/startup-node.log,
scan-startup-browser.json and startup-verification.json. Private images/logs not
uploaded to GitHub. This correction addresses startup negotiation and diagnosis,
not the still-unmeasured physical scene stitching quality.

Next action in this run: commit, deploy via leased main update, verify exact Pages
success and checkpoint receipt. Then user retries the same calibration file at
depth.html?v=11, in the original landscape direction, expecting camera/model startup
and first green view cue. If Android still refuses, send the newly named constraint;
exact device identity is intentionally not bypassed. No recalibration requested.


## Calibrated scan deployed — 2026-10-24

Implementation/live main: 3a1eab49ebe713b5250de1a98eb3573fe5a94dda,
build depth-lab-9. GitHub Pages run
https://github.com/tmt11geo/dashboard-pwa/actions/runs/40083811949
completed SUCCESS for this exact commit. All 28 changed remote file blobs match
the tested local bytes. Main advanced with an expected-head lease from
2470240782714686c033364485e94040e5a236aa. Working/checkpoint branch:
depth-tfjs-webgl; this documentation-only receipt follows the implementation.

79 Node tests, 14 actual-model browser checks, 15 controlled-inference browser
checks PASS. Actual calibration PNG verification, TFJS WebGL with CPU forwarding
disabled, calibrated K delivery, relief rendering, replay export, camera mismatch
cleanup and landscape viewport tested. Chromium 141/SwiftShader and simulated
camera, not phone performance. Final bounded synthetic evaluation: 30/30
translations within the 0.005 initial-depth-unit position limit and 90/90 yaw-only
rotations withheld. Initial false-rotation evidence retained separately.

Live unauthenticated request to depth.html?v=10 returned HTTP 403 / Cloudflare
1010 from this environment. No Access configuration, bypass or alternate public
host was used. Exact Pages success is independently verified. No PWA policy change.
Evidence: tools/depth-calibration/evidence/scan-deployment.json.

Exact next action requires the user's physical Android camera: open
https://tmt11.com/dashboard-pwa/depth.html?v=10, keep the same landscape direction,
Load calibration JSON (the existing 16-view file), wait for Calibration ready,
Start scan on a textured stationary scene with depth variation, hold for the green
MOVE NOW cue, take small sideways steps (3–8% image shift), and collect three
accepted views. Finish, Save relief file and Save scan replay; share replay
privately even if views are rejected. Full steps: docs/depth-calibrated-scan-test.md.
Do not request another checkerboard session unless new evidence requires it.

Software delivery for this calibration-to-scan test COMPLETE; physical scene
accuracy remains WAITING FOR DEVICE TEST. After receiving a replay, independently
validate its calibration binding, undistort RGB and run replay_scan.py; inspect
actual alignment/depth failures before further tuning. Calibration is genuinely
used in live geometry, but no reliable full orbit, metric map, general six-axis
reconstruction or completed offline-tracker browser port is claimed.
This receipt supersedes earlier deployment-pending text.


## Calibrated scan integration ready — 2026-10-24

User authorized consecutive implementation, testing and deployment through a
phone-testable build. Started from depth-tfjs-webgl
1d2c42e8e575031b3108a819ac36070235ce6ac4; inspected main at
2470240782714686c033364485e94040e5a236aa. No AGENTS.md found. Resumed unfinished
local integration; no intervening remote changes. Working branch depth-tfjs-webgl.

Implemented depth-lab-9: private calibration JSON import, actual PNG/corner replay
and fold recalibration, camera identity/geometry/zoom/focus checks at startup and
throughout scanning, distortion correction before depth inference, calibrated K
in projection/reprojection and relative-depth fusion. Scanning requires calibration;
no silent assumed-camera fallback. Ordinary depth still works independently.

640x480 RGB pyramidal optical flow with forward/backward consistency replaces
small-image descriptor matching in calibrated scans. A robust rotation competitor
rejects ambiguous rotation; relative-depth offset/scale fit, coverage/consensus,
pose limits and retained-map rejection remain. Depth inference stays 224. Guidance
requests approximately 3–8% image shift; landscape controls and both views fit the
viewport. Save scan replay keeps the first 12 completed RGB/depth/decision records
locally; independent Python replay binds the original calibration and runs the
offline calibrated tracker. The latter is not the live fusion algorithm.

79 Node tests PASS. Actual browser calibration re-verifies the user's 16 saved
PNGs; simulated-camera integration and actual TFJS WebGL/no CPU-forwarding smoke
PASS. Landscape screenshot visually checked (kept private). One-frame exported
replay passes the independent reader and initializes its anchor; no motion accuracy
claim from that single frame. JS syntax/whitespace checks PASS.

Initial motion evaluation exposed false rotation fusion, retained in
scan-heldout-initial.json; that candidate was not deployed. Final suite:
30/30 translated views accepted within 0.005 initial arbitrary-depth units;
90/90 yaw-only rotation views withheld. Of these, 18 translations/54 rotations use
fresh seeds after the rotation-competition fix; 12/36 are regression cases.
No false rotation or inaccurate accepted translation in this bounded suite.
Evidence, reproduction and source hashes: tools/depth-calibration/README.md and
its evidence/scan-* files. Raw phone images, camera identifiers and screenshots
are not committed. Access, maps, PWA policy and ONNX behavior remain unchanged.

Implementation and local validation COMPLETE; deployment verification is next in
this run. Commit this tree, advance main with an expected-head lease, verify the
exact Pages run, and checkpoint the receipt. Then physical Android scene testing
is required: docs/depth-calibrated-scan-test.md. Existing calibration is sufficient;
no repeat checkerboard capture requested. Begin with three textured, overlapping
views; save relief and private scan replay, including rejection cases.

Limitations: short-scan experiment, arbitrary depth scale, no loop closure, no full
six-axis/real-scene accuracy or phone performance proof. The submitted camera's
focus-distance metadata exceeds its capability range; no out-of-range constraint
is applied, matching read-back is required. More general calibrated multi-view pose
and fusion promotion require actual scene replay evidence. This supersedes the
prior waiting-for-implementation pointer; user phone testing follows deployment.


## Real phone calibration independently verified — 2026-10-24

Completed the next eligible step: replay of the user's actual 16-image calibration
session. Starting/work branch depth-tfjs-webgl at
0d1f3d54bc6a024d4cb4c15d217db0230c4f6a5f; main remains
2470240782714686c033364485e94040e5a236aa (calibration-1).
No application changes or deployment in this checkpoint.

Pinned numpy 2.2.6 / OpenCV 4.11.0.86; ran validate_session.py on the private
uploaded JSON. Exit 0: all 16 PNGs independently re-detected, numericPassed and
readyForControlledTrackerReplay true, VerifiedCalibration after undistortion
passed. RMS 0.250631 px; maximum recorded/replayed corner difference 0.007513 px;
fold focal disagreement 0.2273%, principal-point disagreement 1.88426 px
(limit 2 px), held-out maxima 0.38956 / 0.36347 px. All four quadrants covered.
Visual inspection of all 16 views confirms varied position, size and tilt.
No repeat calibration requested; the user's movement was sufficient for these gates.

Evidence: tools/depth-calibration/evidence/phone-2026-10-24.json, containing
input hash and sanitized numerical results. Raw session/PNGs, device identifier
and per-image hashes are not committed. Reproduce privately with:
python tools/depth-calibration/validate_session.py SESSION.json REPORT.json

Caveat: browser reports manual focus and stable geometry, but focusDistance
3.448276 is outside advertised capability maximum 0.572727. This is inconsistent
camera metadata, not proof of optical movement. Do not blindly reapply the value;
verify settings and calibration consistency when opening a tracking stream.
Results apply only to this rear camera, unmirrored landscape 640x480, uncropped,
zoom 1 and observed focus state. Target flatness/physical dimensions are not
independently certified. Existing scanner remains depth-lab-8; no stitching fix
or real-scene pose accuracy is claimed.

Exact next action: implement a private calibration-session import and controlled
RGB sequence capture/replay bridge bound to the same camera/crop/orientation/zoom/
focus, with undistortion using the verified K/D. Validate actual scene sequences
against the existing calibrated tracker before fusion or scanner promotion.
No additional phone capture is needed until that bridge is testable.
This supersedes the prior waiting-for-calibration pointer.


## Phone calibration deployed — 2026-10-24

User explicitly approved deployment. Main now points to tested implementation
2470240782714686c033364485e94040e5a236aa (calibration-1). GitHub Pages run
https://github.com/tmt11geo/dashboard-pwa/actions/runs/40059532812 completed
successfully for this exact SHA. The earlier automatic approval block is resolved.
Working/outcome checkpoint branch: depth-tfjs-webgl, starting at
1ae645158a2c7176ea12e640fbe56f4e5242ca22. Main was advanced with an expected-head
lease from 308686f9d81e1218c866c936b8a24e3a74064fe4; no rebuild or code changes.

The deployed commit resolves to the previously verified tree
dff2d47f0725edb4846f869a60587b2845588856. Calibration page, printable target,
worker, engine and all eight runtime parts are present. Existing evidence remains:
21 browser checks, 5 engine checks, 72 regression tests, independent 16-image replay
PASS. Existing relief solver, Access and PWA policy unchanged. No phone result claimed.

Unauthenticated custom-domain checks of page, target and runtime manifest returned
403 / Cloudflare 1010 from this environment. No bypass attempted. Exact Pages
success is verified separately; user tests through normal Access authentication.
Evidence: tools/depth-calibration/evidence/deployment.json.

Next required action is the user's real-camera test, not another implementation
step: print calibration-target.html at 100% landscape, open calibration.html?v=1,
capture 16 accepted guided views, Validate, Save session and share the JSON file.
Save even a failed/provisional result for review. Full instructions are in
docs/depth-calibration-phone-test.md. Upon receipt, independently validate the
actual PNG/corner observations with validate_session.py before tracker integration.
Calibration capture is ready to try; calibrated relief integration still depends
on real camera evidence. This receipt supersedes earlier deployment-blocked text.


## Phone calibration implemented; deployment review blocked — 2026-10-23

Implementation complete and remote-verified at
2470240782714686c033364485e94040e5a236aa on depth-tfjs-webgl. 21 browser checks,
5 engine checks, 72 existing Node tests and independent 16-image replay PASS.
All 35 changed-file blobs match tested local bytes, including runtime parts and
screenshots. No rebuild/retest is required for this unchanged commit.

The attempt to advance main was rejected by automatic approval review, which
stated that explicit permission to promote this commit was missing. The rejected
action was github_update_ref(main, expected_sha=308686f9d81e1218c866c936b8a24e3a74064fe4,
sha=2470240782714686c033364485e94040e5a236aa). Main was re-read and remains
308686f9d81e1218c866c936b8a24e3a74064fe4. The new calibration page is NOT live yet.
No alternative publishing path or approval bypass was attempted.

Exact next action: get explicit user approval to deploy implementation commit
2470240782714686c033364485e94040e5a236aa to main. Then perform the leased ref update,
verify the exact Pages run and remote assets, checkpoint the receipt and provide
the links/instructions in docs/depth-calibration-phone-test.md. This is the only
remaining software-delivery step before the user can test calibration capture.
Actual-phone calibration data then remains necessary before relief integration.
Evidence: tools/depth-calibration/evidence/deployment.json. Working/outcome branch
is depth-tfjs-webgl; this documentation-only receipt follows the implementation.


## Phone calibration ready for deployment — 2026-10-23

User explicitly authorized finishing implementation, deployment and phone-test
handoff without intermediate stage stops. Starting/work branch depth-tfjs-webgl
106ffaa9fad456b057fbff39c1e2bb6386fa0aa0; starting main
308686f9d81e1218c866c936b8a24e3a74064fe4 is its ancestor. No intervening app changes.

Implemented calibration-1: printable checkerboard, guided rear-camera capture,
nearby controls and landscape layout, green saved-view cue, actual OpenCV worker
board detection and duplicate rejection, 16–24 views, two-fold calibration checks,
geometry/focus binding, local JSON export and independent Python PNG/corner replay.
Bundled same-origin runtime has eight hash-verified parts (4.343 MB gzip), licences
and provenance. No frame uploads. Current relief algorithm, model, ONNX, map,
Access and PWA policy remain unchanged; Depth Lab gains a calibration link.

21 browser checks PASS using actual WASM/detection/calibration and a simulated
camera; 5 actual-engine checks PASS; 72 existing Node tests PASS; independent
16-image replay PASS (RMS 0.253594 px), including the offline VerifiedCalibration
contract after undistortion. Syntax/diff checks PASS. Screenshots inspected in
portrait and landscape. No physical OnePlus performance/accuracy result claimed.
Evidence/reproduction: tools/depth-calibration/README.md and evidence/*.json,
node-regression.log, capture-mobile.png, capture-landscape.png. Source/asset hashes
in verification.json. Phone instructions: docs/depth-calibration-phone-test.md.

Implementation COMPLETE; deployment verification is the next action in this run.
Commit the tested tree, advance main with an expected-head lease, verify exact
Pages success and remote assets, then write the deployment receipt on the feature
branch. Do not stop to request routine approval. After deployment the required
user input is a real phone session JSON, even if numerical validation is provisional
or fails. Actual camera evidence is necessary before calibrated relief integration;
this is a testable capture/validation flow, not a claim of fixed live stitching.


## Seed recovery and calibration verification — 2026-10-23

Bounded offline task COMPLETE; offline candidate gate PASS. Browser/real-phone
promotion remains BLOCKED; scanner/stage 10 remains PARTIAL. Starting commit
68c6f815b7cb2597b6e7def84335b7955ffce7b0; working/outcome branch depth-tfjs-webgl.
Main remains 308686f9d81e1218c866c936b8a24e3a74064fe4 (depth-lab-8), no deployment
or application changes. Previous implementations/evidence preserved unchanged.

`tools/depth-pose/recovery.py` replaces a failing landmark seed after two failed
third-view checks, using a newly validated anchor pair. Reseeding retains the
anchor and emits no pose; a subsequent distinct image must pass the unchanged
acceptance gates. `calibration_evidence.py` requires independent known-target
observations, two calibration folds, varied target tilt, focal/centre agreement
and held-out reprojection checks. Metadata-only calibration is refused. This
rejects unsupported optics; it does not magically recover motion with wrong
intrinsics. Synthetic target observations are for fixtures only, never phone proof.

24 unit tests PASS; 15 calibration-audit cases PASS; dependency/whitespace checks
PASS. Development: 9/9 positive and 7/7 negative paths, 23 accurate emissions.
Frozen evaluation: 320 scenarios, 192 calibrated sequences / 1,728 RGB frames,
128 invalid-calibration scenarios rejected before tracking. Correct calibration:
108/108 movement paths, 84/84 negative paths, 283/283 accurate emitted keyframes
(<2-degree rotation and <10-degree direction error), zero false translations.
Clean/blur/noise each pass 36/36 positive and 28/28 negative paths; emit 94/100/89
accurate poses. Both mismatch profiles reject all 64 scenarios each. Runner exits
0; unsupported-camera rejection is separate from pose recovery.

All 144 prior correctly calibrated sequence input hashes match. Positive recovery
improves 77/81 → 81/81, all four prior failures recovered, zero regressions. The
blurred curve reseeds at frame 3 and accepts at frame 4. Fresh seed 117293 also
passes. Both earlier inaccurately accepted wrong-calibration curved scenarios
are now blocked by independent target validation. No held-out tuning occurred.

Evidence/method: tools/depth-pose/RECOVERY-REVIEW.md, recovery_spec.json,
run_recovery.py, audit_calibration.py, compare_recovery.py, evidence/recovery-*.json
and recovery-tests.log. Reports preserve source/image hashes, per-frame diagnostics,
pose errors, calibration evidence hashes and fold residuals. Source hashes verified
against the final candidate. No physical phone/browser speed or accuracy claim.

Remaining blockers: actual phone calibration, capture-geometry binding,
undistortion, rolling shutter, real-scene accuracy, browser implementation/runtime
and fusion. Exact next bounded action: local phone calibration-capture/replay
bridge. Record target observations with camera identity, dimensions, orientation,
crop, zoom/focus and distortion/undistortion metadata; export locally, independently
validate and replay with this tracker. Do not use synthetic evidence for a physical
camera. Keep main unchanged until browser integration is tested and authorized.
No further phone log retries needed now; capture instructions follow the bridge.
Verify remote feature head and all changed-file blobs before stopping.


## Shared-landmark three-view checkpoint — 2026-10-23

Bounded offline task COMPLETE; promotion FAIL; live scanner/stage 10 remains PARTIAL.
Starting commit 0efa8c3ff65527aa9083a4764cf3485b3eec8dc1; working/outcome branch
`depth-tfjs-webgl`. Main unchanged at 308686f9d81e1218c866c936b8a24e3a74064fe4
(depth-lab-8). No application changes or deployment.

Added `tools/depth-pose/three_view.py`: seed triangulated landmarks from a validated
pair, match the same anchor landmarks in a third image, estimate/refine PnP pose,
check positive depth, coverage, reprojection and pair agreement, then promote a
local keyframe. No straight-line direction requirement or incremental rotation
cycle. Translation remains a local unit direction; no global/metric map or fusion.
Previous pair/temporal implementations and evidence are preserved unchanged.

20 unit tests PASS; dependency and whitespace checks PASS. Frozen 192-sequence /
1,728-frame evaluation: 102/108 positive paths pass; 84/84 negative paths emit no
translation. 268 keyframes emitted, 266 accurate. Clean 27/27, blur 26/27, noise
24/27, claimed-wrong-calibration 25/27 positive paths. Two wrong-calibration curved
emissions have 11.37/11.76-degree direction errors and fail the 10-degree limit.
No other emitted pose exceeds limits. Development 8/9 positive, 7/7 negative,
22 accurate emissions, curved path withheld. Quality runner correctly exits 1.

Comparison verifies identical image hashes for all 120 prior sequences: positive
recovery 45/64 → 62/64 (18 improvements, one regression). All prior clean combined
and reversal failures now pass. One noisy forward-Z path regresses to withholding;
its initial seed has 11.26-degree direction error. A fresh blurred curve similarly
stalls behind a bad seed. The new accepted wrong-calibration errors are explicit
blockers; improved recovery does not establish safe deployment or phone accuracy.

Evidence and reproduction: tools/depth-pose/THREE-VIEW-REVIEW.md,
three_view_spec.json, run_three_view.py, compare_three_view.py,
evidence/three-view-{clean,blur,noise,claimed_wrong_calibration,summary,comparison}.json,
three-view-development-{clean,summary}.json, three-view-tests.log and
three-view-runtime.json. Source/input hashes and per-frame diagnostics recorded.

Exact next bounded action: robust seed validation/replacement after repeated
three-view disagreement, with joint reprojection refinement or equivalent robust
initialization. Preserve all current failures, especially both inaccurately
accepted wrong-calibration curves and the noisy forward regression; freeze and
evaluate on fresh curved/reversal/noisy scenes and calibration offsets. Define
independently verified camera-calibration requirements before browser integration.
Keep main unchanged until quality gates pass. No phone input needed for this offline
step. Verify the feature head and changed-file blobs remotely before stopping.


## Temporal/keyframe checkpoint — 2026-10-23

Bounded offline task COMPLETE; promotion remains FAIL and stage 10/scanner remains PARTIAL. Starting branch depth-tfjs-webgl d9ea04e63ae92e4854d0141ed28d57339844e895; working/outcome branch depth-tfjs-webgl. Main unchanged at 308686f9d81e1218c866c936b8a24e3a74064fe4 (depth-lab-8), no deployment.

Added offline temporal.py: retain anchor while baseline accumulates, require three compatible distinct frames, compare translation directions in anchor coordinates, enforce rotation-cycle consistency, then promote a local keyframe. Missing/assumed or incompatible calibration is refused; valid-looking metadata cannot prove true optical calibration. Only local unit translation direction is returned; no global path, scale recovery, depth alignment, fusion or browser port.

Seventeen unit tests PASS; dependency check PASS. Development: 6/8 translated paths completed, 9 accurate keyframes. Frozen held-out test: 120 sequences / 1,080 frames over fresh textures/layouts with clean, blur, noise and claimed-wrong-calibration profiles. 45/64 positive paths completed; 56/56 stationary/rotation-only paths emitted no translation. All 61 emitted keyframes met <2-degree rotation and <10-degree direction error. Clean profile recovers all 12 signed X/Y/Z translations; combined motions and one reversal are withheld. Two inaccurate noisy raw pair estimates were not promoted. Gate correctly exits 1 because coverage/recovery is incomplete; no claim of a fixed phone scanner.

Per profile positive completion: clean 13/16, blur 14/16, noise 11/16, claimed wrong calibration 7/16. Each has 14/14 safe negative paths and zero inaccurate emitted keyframes. Evidence/source hashes: tools/depth-pose/evidence/temporal-summary.json, temporal-{clean,blur,noise,claimed_wrong_calibration}.json, temporal-development-{clean,summary}.json, temporal-unit-tests.log and temporal-runtime.json. Method/conventions/commands: tools/depth-pose/TEMPORAL-REVIEW.md and README.md.

Blockers: withheld valid combined/reversal paths; pairwise cycle estimates can be ambiguous at short baselines; calibration metadata is not verification; no real-device/global/fused-map accuracy evidence. Exact next bounded action: shared-landmark three-view tracking with triangulation/PnP or equivalent multi-view consistency; evaluate on fresh curved/reversal trajectories and retain current failures as regressions before browser integration. Main remains unchanged; no further phone log retries needed for offline work. Verify remote branch/checkpoint files before stopping.

## Rotation competition and held-out stress checkpoint — 2026-10-23

Bounded offline task COMPLETE, promotion gate FAIL; scanner/stage 10 remains PARTIAL. Starting branch depth-tfjs-webgl b8b1ff4f43dd1748fa7cd13ec59cc9eb83977d2d. Working/outcome branch depth-tfjs-webgl. Main remains 308686f9d81e1218c866c936b8a24e3a74064fe4 (depth-lab-8); no deployment or app/depth changes.

Added robust rotation-only model competition using calibrated matched rays, preserving the prior prototype byte-for-byte for same-input comparisons. Frozen candidate/specification before held-out evaluation; no tuning on held-out results. Tested 456 new-texture/profile cases (clean, blur, noise, deliberately wrong calibration; 640 and 224) plus 64 unseen-layout cases, each through baseline and candidate. Source/input hashes and per-case results are committed. Nine unit tests PASS; dependency check PASS. Quality runners correctly exit 1.

Results: zero false translations and correct required orientations across all 268 candidate negative controls; 13 inaccurate accepted positive poses remain. Correct pose recovery across held-out sets at 640 is unchanged at 91/126; at 224 it falls from baseline 67/126 to candidate 44/126. On new layouts alone, 640 recovers 9/18 poses, 224 candidate 1/18. This is a conservative rotation-discrimination change, not an overall reconstruction fix. No real-phone/browser performance or stitching accuracy claim.

Evidence/method: tools/depth-pose/STRESS-REVIEW.md, README.md comparison table, stress_spec.json, evidence/stress-summary.json, stress-{clean,blur,noise,wrong_calibration}.json, layouts.json, development-rotation.json, stress-unit-tests.log. Previous baseline evidence retained. The new textures initially shared geometry; a separate two-layout run changes surface depth/extent/position.

Blockers: pairwise low-parallax recovery, incorrect accepted translation direction under low resolution/wrong calibration, no ground-truth real-device sequence or browser port. Exact next bounded action: temporal/keyframe tracking at 640 to accumulate useful baseline, explicit calibration checks, fresh held-out sequences and pose-consistency evaluation; retain current failures as regression cases. Keep depth at 224 as a future integration choice, but do not fuse/deploy until quality gates pass. No more phone-log retries needed for this offline work. Verify remote checkpoint and unchanged main after committing.

## Offline image-pose prototype checkpoint — 2026-10-23

Bounded task COMPLETE: separate repeatable six-axis image harness and RGB-only reference pose prototype, with a measured FAIL for promotion. Overall scanner/stage 10 remains PARTIAL. Starting/work/outcome branch depth-tfjs-webgl at 0169f3950b7d778e6b4c6e78b89defac6a287b30. Live main remains 308686f9d81e1218c866c936b8a24e3a74064fe4 (depth-lab-8); no deployment or application-code changes in this task.

Build-8 phone evidence received: frames 2/5 hit rotation-prefilter; frames 3/4/6 depth-consensus ratios 25/58, 27/54, 21/51; scene stayed at one view. No more log retries needed to establish this failure. The new offline prototype uses only RGB plus known intrinsics: SIFT/mutual matches, essential pose, cheirality, parallax/coverage and homography ambiguity checks. Optical coordinates and transform direction differ from the live scanner and are explicitly documented. Translation is a direction, not metric distance.

Durable implementation, reproduction commands, conventions and next action: tools/depth-pose/README.md. Evidence: tools/depth-pose/evidence/synthetic.json (105 cases, deterministic image/source hashes), real.json (4 pinned real RGB pair sanity replays, not accuracy proof), unit-tests.log (5 contract tests PASS). Dependencies pinned; pip check PASS. Synthetic pose criteria: rotation <2 degrees, translation direction <10 degrees; no false translation on negative controls. Results: 640px 21/27 pose recoveries, 30/30 negatives, zero false translations; 224px 13/27 recoveries, 20/21 negatives, one false translation. The validation command correctly exits 1. No Depth Anything input or depth-scale tuning is used. The limited 640px successes do not establish real-phone accuracy or better reconstruction.

Blockers: low-parallax forward/back recovery, incorrect low-resolution directions, one false roll translation, no calibrated phone/ground-truth real-sequence evaluation or browser port. No fusion was attempted. Exact next bounded action: improve competing rotation/translation model selection at a separate tracking resolution; add held-out seeds, blur/noise and wrong-calibration stress tests before tuning; compare old/new on identical known-pose frames and retain zero false translation. Do not connect to the live scanner until quality gates pass. Main stays unchanged. Remote feature checkpoint and changed files must be verified after commit.

## Alignment diagnostics and six-axis review — 2026-10-23

Scope PARTIAL: investigate reported build-7 stitching failures and review X/Y/Z translation plus X/Y/Z rotation. Started on depth-tfjs-webgl df6b65a5bfc311e9c34b06fb65dbab934bacd533; live main was 21523a1e26f1702b807c8842509c81b5e75dd972. Working/outcome branch remains depth-tfjs-webgl.

Finding: the supplied phone log contains one accepted view and five rejections. Four identical messages cannot distinguish an early rotation-like image check (before translation is fitted) from a later small-translation check. The guide is 2D image shift, not six-axis pose. Full review: docs/depth-scan-6dof-review.md. The solver represents six rigid-motion degrees plus nuisance depth scale/offset, but image matching and depth errors remain limiting. Known-geometry tests expose false rejection of translation and false acceptance of some pure rotations.

Build depth-lab-8 preserves the shipped acceptance logic and thresholds. It adds stage-specific rejection codes, translation vector/relative magnitude, total rotation and axis-angle vector, depth scale/offset, consensus and reprojection errors; unavailable estimates remain null. Messages no longer assert the user moved incorrectly. An attempted alignment correction did not generalize and was not shipped.

Evidence: 72 Node tests, 23 browser UI checks and 4 actual-TFJS real-sequence checks PASS. Final replay on five real Redwood images accepts 2 views, unchanged; synthetic rotation sweep exposes 2 false acceptances. See tools/depth-scan/evidence/{node-tests-v8.log,browser-ui-v8.json,real-sequence-v8.json,alignment-review-v8.json,phone-build7-rejections.json}. Passing checks do not establish stitching accuracy. Tests now cover solver recovery for signed six-axis and combined motion, and preserve known failure cases.
Deployment receipt: main 308686f9d81e1218c866c936b8a24e3a74064fe4, build depth-lab-8; Pages run 40009379745 succeeded for the exact SHA. Documentation receipt on depth-tfjs-webgl; remote checkpoint files and refs verified through GitHub.
Blockers: supplied phone logs contain no images or known camera poses; no controlled six-axis phone accuracy dataset. The available real sequence is mixed motion, not a sideways-only validation. Stitching remains unresolved.
Exact next action: collect build-8 phone diagnostic logs, identify the failing stage, then implement the calibrated six-axis pose/overlap validation harness specified in docs/depth-scan-6dof-review.md before replacing registration/fusion. Original stage 10 remains PARTIAL. No threshold relaxation or claim of fixed stitching.

## Movement guidance follow-up — 2026-10-23

User reports additions remain difficult and requested a visible movement amount. Scope: this UX/capture-guidance follow-up only; original stage 10 remains PARTIAL. Starting/outcome branch depth-tfjs-webgl at 8f23c7f80e62f9bcd84bf817fbc0e4dfa3afac87; starting main 1df5e0fb48d13e3a645a17b0a7808e1090ef2cca.

Build depth-lab-7 adds local 72px preview translation matching against the last accepted capture. Camera overlay shows direction, progress, approximate image shift and a suggested 6–14% range. Small movement asks for more; sufficient movement asks to hold still; overshoot points back; weak or ambiguous overlap asks to return. Capture requires a first view or a confident shift in range, plus existing stability/cooldown/retry checks. Accepted-view flash, pause, cleanup and saved scenes retained. This is a heuristic image translation, not camera pose, degrees, centimetres, or a guarantee of successful 3D alignment. Rotation, parallax, repetitive texture and moving objects can make it uncertain. Actual-model registration and thresholds unchanged.

Validation: 68 Node tests PASS; 22 local Chromium UI checks PASS, including uncertain-overlap gating, overshoot arrow, three registered additions, pause/resume, stop cleanup and file roundtrip. Evidence: tools/depth-scan/evidence/node-tests-v7.log and browser-ui-v7.json. Synthetic rendered camera + inference double + real registration; no new physical-phone performance or real-model claim. Phone screenshot reviewed. Fixtures use larger sideways steps for the new movement target; old evidence preserved.
Deployment receipt: main 21523a1e26f1702b807c8842509c81b5e75dd972, build depth-lab-7; Pages run 40007740622 succeeded for that exact SHA. This documentation receipt is on depth-tfjs-webgl. Remote refs and checkpoint files verified through GitHub.
Blocker: OnePlus guidance/registration acceptance is still unverified; live automated requests were previously blocked by Access.
Exact next action: open depth.html?v=7, confirm depth-lab-7. After the first accepted view, move sideways following the arrow until the bar fills and HOLD STILL appears; keep still until the accepted-view green flash. If overshooting, follow the return arrow. Try 3–5 views and send diagnostic logs plus whether the guidance reaches the target and additions align. Keep phone pointing the same way. Working/outcome branch: depth-tfjs-webgl.

## Compact scan controls and move cue — 2026-10-23

User-requested device UX follow-up only, based on depth-tfjs-webgl ecbf42d357670c31b354e5b6260ca5a6f135a565; main before this change faf6339373a38345905949b864cd1c651ccc9689.
Build depth-lab-6 places camera and relief together with sticky Start/Pause/Finish controls and guidance immediately above, rotation and file controls below. Compute/single-frame controls are collapsed. Each accepted scene addition gets one soft green pulse across both views and MOVE NOW; capture/alignment say wait for green. Pause clears the pulse, deferred acceptance cues wait until resume, and pending captures never invite movement on resume. Reduced-motion mode uses a static outline.

Validation: 64/64 Node tests and 19/19 local Chromium browser checks PASS. Evidence: tools/depth-scan/evidence/browser-ui-v6.json and node-tests-v6.log; harness tools/depth-scan/run_browser.cjs. Phone-sized screenshot visually inspected; side-by-side geometry, adjacent controls, no horizontal overflow, reduced motion, pause/resume, finish, file save/open/reload checked. Browser uses an inference double with real registration. Existing actual-model feasibility evidence is preserved; no phone performance or physical acceptance claim. Model, registration and capture thresholds unchanged.

Deployment receipt: main implementation 1df5e0fb48d13e3a645a17b0a7808e1090ef2cca, build depth-lab-6. Pages run 40006383084 completed successfully for that exact SHA. Working/outcome branch depth-tfjs-webgl adds this documentation receipt. Remote refs and checkpoint files verified through the connected GitHub integration. Protected live-browser validation remains a device action.
Blocker: physical-device usability acceptance remains pending; automated live requests were previously blocked by Access (403/1010).
Exact next action: open depth.html?v=6 on OnePlus, confirm depth-lab-6, start a scan, hold until green MOVE NOW, shift slightly sideways, hold for the next addition; repeat 3–5 times, then Pause/Finish/Save/Open. Report cue visibility, responsiveness and alignment with the diagnostic log. Working/outcome branch depth-tfjs-webgl. Original stage 10 remains PARTIAL; no new conversion stage started.

Updated 2026-10-23. Navigation: [DONE.md](../DONE.md), [stage plan](depth-tfjs-plan.md), [resume prompt](depth-tfjs-continue-prompt.md).

## Current scope and branch

Working/outcome branch: depth-tfjs-webgl. Temporal/keyframe stage complete: 61 accurate emitted keyframes, 45/64 translated paths recovered, promotion FAIL. Main unchanged at 308686f9d81e1218c866c936b8a24e3a74064fe4, depth-lab-8. Next: shared-landmark three-view consistency on fresh trajectories; no phone-log retries needed.

The earlier temporary workspace is absent. Historical scripts, environments, binary fixtures, converted weights and original log files are unavailable. The adjacent evidence JSON was transcribed from actual tool output visible in the conversation; it is not a recovered original log. Stages 2–5 have now been reproduced below; durable scripts and evidence are committed.

## Existing implementation

- depth.html / depth.css / depth.js: camera UI, scheduling, pause/step, result/relief display.
- depth-core.js: ImageNet preprocessing, frame sizing, normalization and latest-frame geometry.
- depth-worker.js: ONNX Runtime Web 1.20.1 inference; one in-flight frame; dedicated module worker.
- depth-diagnostics.js: depth-lab-3, browser/GPU probes and copyable error logs.
- tests/depth*.test.mjs plus camera tests: historical baseline 47/47 passed; not rerun during this documentation checkpoint.
- index.html, map.html, camera.html and dashboard.html: navigation; sw.js / pwa-register.js / manifest.webmanifest: preserve behavior.
- ONNX model revision 4472b7362082ad9968fee890ca0f1e5aca36b93d. CPU uses INT8 (~27 MB), WebGPU uses FP16/FP32.
- Current sizes 224, 336, 518 maximum edge, dimensions multiples of 14.
- Relative inverse depth normalized per frame; relief is latest-frame arbitrary geometry, not metric depth or SLAM.
- Current README describes main/root Pages hosting and network-only navigation behind the existing Access flow.

Repository tree was inspected afresh on 2026-10-18; no AGENTS.md was present.

## Historical conversion recipe

Model: https://huggingface.co/keras/depth_anything_v2_small
Pinned revision: 0fa3d627036ffe8029b34850dbdab5028696f011

| Source file | Observed size | Observed SHA256 |
| --- | --- | --- |
| model.weights.h5 | 102051640 bytes | 7367dabc7e0e28512aea7d94f845dba542e4bdd88142debf580cc98c8d683b49 |
| config.json | 2266 bytes | c9fe5d3b68ff71854f08f378228ab6f60217b82964a5bd8bf3f0f6c60d03ac75 |

Observed working stack: CPython 3.12, tensorflow 2.19.0, tensorflow-text 2.19.0, tf-keras 2.19.0, keras 3.15.1, keras-hub 0.24.0, tensorflowjs 4.22.0, tensorflow-decision-forests 1.12.0, ydf 0.11.0, protobuf 5.29.6, setuptools 80.9.0, packaging 23.2, jax/jaxlib 0.5.3, flax 0.10.6. Stage 2 independently verified these pins and committed the complete resolved lockfile at tools/depth-tfjs/requirements.lock.txt.

Construction used keras.saving.deserialize_keras_object(config) after setting config['config']['image_encoder']['config']['image_shape'] to [224,224,3]. Strict model.load_weights succeeded, reporting 24883777 parameters. Final ReLU must be applied after the backbone to match the relative DepthEstimator.

Input is NHWC float32 [1,224,224,3], RGB /255, mean [.485,.456,.406], std [.229,.224,.225]. The three numerical fixtures used TensorFlow bilinear resizing to 224 square. This was a validation input choice, not a validated camera letterboxing path.

SavedModel wrapper used a tf.Module with a tracked model and a tf.function signature named images; output dictionary key depth, shape [1,224,224,1]. Converter command:

```sh
tensorflowjs_converter --input_format=tf_saved_model --output_format=tfjs_graph_model --signature_name=serving_default --saved_model_tags=serve --weight_shard_size_bytes=4194304 saved-depth converted-depth
```

Default TF 2.19 exact GELU emitted Erfc, which TFJS 4.22 rejected before optimization. Replacing the 12 Dense GELU activations with 0.5*x*(1+tf.math.erf(x/tf.sqrt(2))) allowed conversion. An initial random-input comparison observed maximum error 1.6689300537109375e-6. Validate again on representative images; do not use approximate GELU without a separate justification.

Other encountered dependency issues: KerasHub 0.22.2 lacked DepthAnythingBackbone; latest YDF generated Protobuf 6.31.1 code incompatible with runtime 5.29.6; newer setuptools removed pkg_resources used by tensorflow-hub. Compatible pins above resolved converter execution. Concurrent pip installs produced duplicate metadata; mutate one environment sequentially and require pip check to pass.

TFJS conversion generated 24 ~4 MiB shards and a graph, approximately 98 MB total. Binary files and exact generated checksums were not preserved. Confirm licensing for the Keras distribution and retain source-model/TFJS Apache-2.0 notices before distributing.

## Historical WebGL observations

See [historical evidence](depth-tfjs-historical-evidence.json). TFJS 4.22.0 ran the actual graph with setBackend('webgl'), getBackend() verification and WEBGL_CPU_FORWARD=false. Browser was Playwright Chromium 141 on Linux using ANGLE/SwiftShader. This is software-rendered WebGL, not a phone or hardware speed test.

Three different images (upstream assets/examples/demo01.jpg, demo02.jpg, demo03.jpg) were tested. Exact upstream commit and image checksums were not preserved; pin them during reproduction. Original TensorFlow outputs were generated before GELU rewriting, then clamped with ReLU. WebGL maximum errors were about 2.74e-5, 3.38e-5 and 1.36e-4. Normalized MAE was about 1.24e-7, 2.62e-7 and 1.76e-6.

First execution with readback took ~25.17 s in SwiftShader; subsequent different-image executions ~15.20 and ~16.83 s. These are not repeated same-image steady benchmarks. Live GPU bytes were ~98.6 MB and texture pool allocation reached ~674.9 MB. Model/input/output disposal returned live tensors and live GPU bytes to zero while the pool remained allocated. Include explicit pool/context accounting in lifecycle testing.

## Pending implementation decisions

The isolated stage 5 benchmark now verifies worker OffscreenCanvas/WebGL on this host, with cancellation and retained failures. Durable hosting and actual camera integration are not implemented; browser/device support still must be checked in that integration. Candidate design: explicit WebGL choice, fixed 224 mode, aspect-preserving letterboxing and output unpadding, existing one-frame backpressure and worker termination. Do not report this design as completed.

A local git dry-run push previously lacked credentials. Use the connected GitHub integration for repository writes. An interrupted blob-upload attempt is not evidence of completed hosting; verify actual branch-referenced assets before relying on uploads. Large binary transfer should be isolated into stage 6, with exact lengths/hashes and bounded chunks. Never concatenate independently padded base64 chunks as a complete encoding.

## Device constraints

OnePlus 12R, Android 16; reported Chrome 155. Existing WASM works around 2.7–3.1 s/frame at 224. Hardware WebGL was reported, while Core/compatibility WebGPU adapter requests returned null even in a regular browser tab. Do not assume WebGPU is available. No actual TFJS phone benchmark has been supplied.

## Next action

Run **6AC only**: audit all 25 model assets and final license/provenance/integrity metadata. See latest 6AB appendix and DONE.md. Historical pointers below are superseded.

## Stage 2 reproduced — 2026-10-18

Working/outcome branch: `depth-tfjs-webgl`. Starting checkpoint:
`56d4d161507ef865484f84014b7eb79005758fd2`. Resolve the new checkpoint SHA from
the branch head/commit containing this section; a commit cannot embed its own SHA.

Current main: `9db5c0345faf7339f3d4cc24142dad362122649e`, unchanged from the
branch base. Pages run [39104746337](https://github.com/tmt11geo/dashboard-pwa/actions/runs/39104746337)
completed successfully for that exact SHA. No deployment was triggered by this stage;
Cloudflare Access and all application files remain unchanged. The only differences
from main are handoff documentation and conversion-environment tooling/evidence.

Durable tooling in `tools/depth-tfjs/`:

- `requirements.txt`: historical top-level versions, verified without changes.
- `requirements.lock.txt`: all 70 installed distributions, exact versions including pip 25.0.1.
- `setup.sh`: clean CPython 3.12 venv setup, sequential pip installs and smoke checks.
- `verify_environment.py`: version assertions, pip consistency, backbone/TFJS imports,
  TensorFlow operation, tensorflow Keras backend and bounded converter startup.
- `README.md`: commands, platform scope, failure notes and limitations.
- `evidence/environment.json`: first clean environment PASS.
- `evidence/environment-reproduced.json`: independent clean setup-script reproduction PASS.
- `evidence/converter-help.txt` and stderr logs: actual converter startup evidence.
- `evidence/reproduction.json`: commands, checksums, result and checkpoint provenance.

Acceptance: `pip check` reports “No broken requirements found.”;
`keras_hub.models.DepthAnythingBackbone` imports; TensorFlow sum returns 3;
`tensorflowjs_converter --help` exits 0 with the expected input-format option.
No model weights were downloaded and no model export/conversion was attempted.

Platform: CPython 3.12.14, Linux x86_64, glibc 2.39, CPU-only conversion use.
CUDA factory/initialization and legacy pkg_resources deprecation messages were observed,
but did not prevent the checks. Version pins avoid the historical YDF/Protobuf and
setuptools failures. The lock is platform-specific and version-pinned, not a wheel
archive with hash verification. Index/package availability remains external.

Stage 2 blocker at that checkpoint: none. Its stage 3 next action has been completed below.

## Stage 3 reproduced — 2026-10-18

Working/outcome branch: `depth-tfjs-webgl`. Starting checkpoint:
`cf3af3af3e7b73a7304fcf0f84b1cea9b8e955d6`. The branch head/commit containing
this section is the resulting checkpoint; no guessed self-referential SHA is embedded.

Main remains `9db5c0345faf7339f3d4cc24142dad362122649e`; latest main Pages run
[39104746337](https://github.com/tmt11geo/dashboard-pwa/actions/runs/39104746337)
is successful for that exact SHA. No deployment or application/Access/PWA change
occurred. Differences from main are documentation and conversion tooling/evidence only.

### Deliverables and acceptance evidence

- `tools/depth-tfjs/convert_model.py`: immutable source download with byte/hash
  verification, nested fixed-224 config, strict pretrained loading, exact GELU
  rewrite smoke, final ReLU, SavedModel export and TFJS conversion.
- `tools/depth-tfjs/CONVERSION.md`: executable regeneration command, external
  preprocessing contract, persistence plan and licensing provenance.
- `tools/depth-tfjs/evidence/conversion-run-1.json` and `conversion-run-2.json`:
  complete source revisions/hashes, signatures, graph/SavedModel operation counts,
  file lengths/hashes, parameter count, rewrite errors and converter commands.
- `tools/depth-tfjs/evidence/conversion-reproduction.json`: repeated conversion
  comparison, script/lock hashes, corrupt-cache rejection and provenance.
- Adjacent `conversion-run-*.log` and `conversion-converter.*.log`: actual logs,
  including nonfatal CPU-host CUDA warnings.

Two fresh output directories were converted successfully with the stage 2
environment. Run 1 preceded added signature/shard-byte assertions; run 2 uses the
final committed script. Export/conversion calculations were unchanged between runs.
All 24 binary shards are byte-identical. GraphModel JSON differs only in key
serialization order: parsed JSON, signatures, operation inventory and weight
manifest are identical. Reuse each model.json and shard set together.

Observed values:

| Check | Result |
| --- | --- |
| Source revision | `0fa3d627036ffe8029b34850dbdab5028696f011` |
| Config/weight SHA256 | Both exactly match the historical table above |
| Strict parameter count | 24,883,777 |
| Input | `images:0`, float32 [1,224,224,3], external RGB/ImageNet normalization |
| Output | key `depth`, tensor `Identity:0`, float32 [1,224,224,1], final ReLU |
| GELU rewrites | 12 Dense layers; exact erf formula, no approximate GELU |
| Synthetic rewrite max absolute error | 3.337860107421875e-6 (bound 1e-4) |
| Synthetic rewrite MAE | 1.0832089856194216e-6 |
| Original synthetic output range | [1.9410514831542969, 2.9254231452941895] |
| TFJS graph GELU operations | 12 Erf; zero Erfc |
| Shards | 24, maximum 4,194,304 bytes |
| Manifest/shard data bytes | 97,145,740, exact match |
| Graph including model.json | 97,817,343 bytes |
| Corrupt-source guard | Modified cached config rejected before model loading |

Licensing provenance: pinned Keras model card explicitly assigns Apache 2.0 to
Small weights; its exact URL/hash is in the reports. KerasHub 0.24.0 installed
metadata declares Apache-2.0; TFJS 4.22.0 declares Apache 2.0. Full distribution
license/attribution packaging remains stage 6.

### Persistence, limits and precise next action

Stage 3 acceptance is DONE: repeatable conversion, durable script/metadata and
explicit regeneration arrangements are committed. Binary asset hosting is not
claimed. Local source cache:
`/workspace/scratch/e11ad2108fd0/depth-stage3/source`.
Preferred local converted output:
`/workspace/scratch/e11ad2108fd0/depth-stage3/run-2` (contains saved-model,
graph-model, gelu-smoke.npz, conversion.json and converter logs).
These locations are transient; if absent, use the pinned setup and run:

```sh
/tmp/depth-tfjs-env/bin/python -u tools/depth-tfjs/convert_model.py \
  --source-dir /tmp/depth-tfjs-source \
  --output-dir /tmp/depth-tfjs-conversion
```

The synthetic input compares the original and rewritten TensorFlow models only.
It is not representative-image validation, converted TFJS runtime evidence,
WebGL viability, hardware acceleration evidence or phone performance.
Stages 4–5 remain PARTIAL based on historical evidence. Stage 3 has no blocker.

Exact next action: perform stage 4 as described in “Next action” above. Inspect
and use the existing run-2 output if still available; otherwise regenerate.
Keep raw relative-depth outputs before display min/max normalization, retain
immutable real-image provenance and record numerical pass/fail thresholds/results.
Stop after that stage; do not integrate or deploy.

## Stage 4 reproduced — 2026-10-18

Working/outcome branch: `depth-tfjs-webgl`; starting commit
`73eb63f07dff9efeb4103767125bc30587f3ecb4`. The resulting checkpoint is the
branch head containing this section. No AGENTS.md exists in the inspected recursive
tree. Main remains `9db5c0345faf7339f3d4cc24142dad362122649e`; Pages run
[39104746337](https://github.com/tmt11geo/dashboard-pwa/actions/runs/39104746337)
was verified successful for that SHA. Differences from main remain documentation
and tooling/evidence only. No application, Access, PWA or hosted model change.

### Deliverables and results

- `tools/depth-tfjs/validation-fixtures.json`: upstream revision
  `a561b849ebae10a6f5ef49e26c83cbbcd36c71bf`, immutable URLs, lengths and SHA256
  for demo01/02/03.jpg. Images are fetched locally, not redistributed.
- `prepare_validation.py`: verifies original source and converted graph files,
  strict original pretrained loading, RGB decoding, square bilinear resize,
  ImageNet normalization, original references before 12 exact GELU rewrites,
  rewritten references, finite/shape/error guards and byte-identical browser inputs.
- `validate_graph.cjs`: loopback-only numerical runner, tensor/model integrity,
  explicit TFJS 4.22.0 WebGL with WEBGL_CPU_FORWARD=false, raw float32 outputs,
  all nine comparisons, error reporting and bounded browser execution.
- `VALIDATION.md`: commands, dependency/browser pins, rationale, scope and limitations.
- `evidence/validation-results.json`, `validation-prepare.log`,
  `validation-browser.log`, `validation-checkpoint.json`: machine-readable results
  and actual execution/provenance. Python and Node syntax checks passed.

| Fixture | Original source range | Rewrite max error | TFJS vs rewrite max error | TFJS vs original max error | End-to-end MAE/source range |
| --- | --- | --- | --- | --- | --- |
| demo01 | 0–3.90340209 | 1.24276e-5 | 2.88934e-5 | 2.44081e-5 | 2.02941e-7 |
| demo02 | 0–3.15063858 | 2.26498e-5 | 4.04119e-5 | 3.30210e-5 | 2.49123e-7 |
| demo03 | 0.41774547–3.05141687 | 3.13520e-5 | 7.85589e-5 | 8.38041e-5 | 1.06466e-6 |

All nine comparisons PASS: maximum absolute error <=1e-3 and MAE/original
source range <=1e-4. Every output is finite float32 [1,224,224,1]. No display
normalization or fitted scaling was applied. These are float32 parity bounds,
not ground-truth depth accuracy. Three examples and square-resize input do not
validate all camera scenes or letterboxing.

Runtime: Playwright 1.62.1, headless Chromium 141.0.7390.37, WebGL 2.0 via
ANGLE Vulkan SwiftShader. This proves software-rendered WebGL numerical
compatibility only, not hardware acceleration, phone performance or stage 5 timing.
Default browser installers returned invalid ZIPs; an explicitly pinned headless-shell
archive from Microsoft's Playwright download host worked. Full Chrome failed
process-singleton socket creation. Details and archive hash are in VALIDATION.md.
An earlier headless numerical execution also passed; final committed evidence uses
the final preparer and runner (single-process/no-zygote flags). No stage 5 benchmark
was attempted; no timing or resource-retention conclusions are claimed.

### Persistence and exact next action

Stage 4 is DONE; blocker: none. Prepared local tensors and copied graph:
`/workspace/scratch/4c361dacd12f/stage4/final`. These are transient; regenerate with
VALIDATION.md if absent. The existing stage 3 source/environment/output paths
remain valid at this checkpoint; model and 24 shard hashes were verified before use.

Exact next action is stage 5 only: implement/run the dedicated same-image WebGL
benchmark, cancellation/cleanup and failure retention, memory accounting and
viability decision. Reuse `stage4/final/demo01-input.bin` and its graph if present,
otherwise regenerate. Do not start asset hosting, camera integration or deployment.

## Stage 5 reproduced — 2026-10-18

Working/outcome branch: `depth-tfjs-webgl`, starting commit
`59985fa561e435e96c54e125aaeaed5bbe1ad373`. The new checkpoint is the branch
head containing this section. Recursive tree inspection found no AGENTS.md.
Main/live remain `9db5c0345faf7339f3d4cc24142dad362122649e`; Pages run
[39104746337](https://github.com/tmt11geo/dashboard-pwa/actions/runs/39104746337)
was rechecked as successful for that exact commit. No app, Access, PWA or deployment
changes. Differences from main remain development documentation/tooling/evidence.

### Durable benchmark and checks

- `tools/depth-tfjs/benchmark/index.html`, `controller.js`, `worker.js`: isolated
  local UI with run/cancel/copy/download, retained logs, generation guards and
  dedicated worker; actual fixed-224 graph and identical stage 4 demo01 tensor.
- `run_benchmark.cjs`: verifies graph/input/TFJS hashes, loopback serving and
  automated actual-model checks; records full timing/resource/failure evidence.
- `BENCHMARK.md`: reproduction/UI commands, dependency pins via VALIDATION.md,
  timing boundaries, resource/cancellation semantics and limitations.
- `evidence/benchmark-results.json`, `benchmark.log`, `benchmark-checkpoint.json`:
  actual results/provenance. All three JavaScript syntax checks passed.

Runtime: Playwright 1.62.1, Chromium 141.0.7390.37, TFJS 4.22.0; dedicated worker
with OffscreenCanvas, WebGL 2.0, ANGLE/Vulkan SwiftShader. Explicit setBackend
succeeded, getBackend returned webgl and WEBGL_CPU_FORWARD remained false. This
is software-rendered compatibility evidence, not hardware or OnePlus performance.

| Full run | Local model load | First inference | Warm min / median / max | Warm mean |
| --- | --- | --- | --- | --- |
| Initial | 466.3 ms | 11,020.0 ms | 7,959.8 / 8,078.1 / 8,116.5 ms | 8,051.5 ms |
| Restart after interruptions | 591.6 ms | 18,908.0 ms | 8,102.6 / 8,142.3 / 8,163.6 ms | 8,136.2 ms |

Each cycle used the same input tensor for the first and three warm inferences.
Times include execution and complete output.data readback, excluding input
creation, finite/range scan and output disposal. Model load is local HTTP graph/
shard fetch and GraphModel construction, not an internet transfer prediction.
Different first-run times are retained as measured, not interpreted as stable
hardware startup performance. Every output was finite [1,224,224,1].

Each normal cycle: peak observed live GPU bytes 98,597,104; allocated texture
pool 674,886,468 bytes, equal in both cycles. After output/model/input disposal:
zero tensors, data buffers, JS-accounted tensor bytes and live GPU bytes; all
674,886,468 allocated bytes were then free pool. The backend was removed and
context loss observed. Pool allocation before context teardown is not a live-tensor
leak; context loss is not an OS-level GPU-memory measurement.

All seven checks PASS: actual graph first+3 warm runs; forced model-404 failure
with retained logs/restored controls; cancellation during delayed model load;
cancellation during first inference; bounded automatic timeout; complete restart
after failure/cancellation/timeout; logs retained across runs. Cancellation kills
the worker, avoiding main-thread inference blocking. Post-termination worker GPU
counters are unavailable; no measured-zero claim is made for cancelled contexts.
Normal completion performs measured disposal before parent termination. Full
camera/app lifecycle regressions remain stage 8.

### Viability, persistence and next action

Stage 5 is DONE; blocker for this stage: none. Continue the experimental WebGL
path to packaging: actual model execution, numerical parity, worker execution,
bounded interruption and normal cleanup are demonstrated on this host. The
~675 MB pool and 11–19 s first-inference costs are material limitations. SwiftShader
warm times (~8 s) cannot predict phone GPU speed or beat the phone's existing WASM
baseline. Hardware worker-WebGL support, device memory pressure, heat and sustained
performance remain unproven and must be evaluated later. No production readiness
or phone speed claim.

Artifacts reused locally: `/workspace/scratch/4c361dacd12f/stage4/final` contains
verified model/shards and tensors. Runtime bundle `/tmp/depth-tf.min.js`; browser
`/tmp/depth-headless/chrome-linux/headless_shell`. These are transient; recreate
via CONVERSION.md, VALIDATION.md and BENCHMARK.md if absent.

Exact next action: stage 6 only, package the validated FP32 GraphModel plus 24
shards with complete licenses/attribution; choose permitted durable hosting, verify
all intended URLs against committed lengths/hashes and test actual loading. Do
not change precision without new numerical validation. Do not integrate camera,
add a selectable backend or deploy the application in stage 6.


## Stage 6A — package integrity and bounded transfer plan, 2026-10-18

Working/outcome branch: `depth-tfjs-webgl`; starting commit
`1b8409a367a1e816490aab117b35577f22d2d4e1`. Checkpoint SHA is the branch commit
containing this appendix; resolve it from GitHub. User supplied screenshot shows
an interruption during binary blob creation. The current recursive branch tree
contains no model assets and no AGENTS.md; no remote blob success is inferred.

Recovered exact local graph at
`/workspace/scratch/4c361dacd12f/stage4/final/graph-model` (temporary).
`verify_package.py` verifies all 25 files against committed conversion-run-2.json,
checks manifest completeness and weight byte count, and derives Git blob IDs.
All SHA256/lengths match; all 25 blob IDs also match independent `git hash-object`.
Missing/corrupt model guards reject inputs. Total graph 97,817,343 bytes; weights
97,145,740 bytes. No numerical rerun needed: bytes are unchanged from validated
stage 4 and benchmarked stage 5. No precision or preprocessing changes.

Deliverables: `tools/depth-tfjs/verify_package.py`, `PACKAGING.md`,
`evidence/package-inventory.json`, `evidence/package-checkpoint.json`, updated
stage plan and reusable prompt. 6A DONE; 6B–6J NOT STARTED. No binary transfer
attempted in this substage. Remote content transfer capability remains unproven.
License-text/notice packaging is 6I; no redistribution of weights in 6A.

Main/live remain `9db5c0345faf7339f3d4cc24142dad362122649e`; Pages run
39104746337 rechecked completed/success for that exact SHA. Differences from main
remain development documentation/tooling/evidence; no application, Access,
service worker, hosting configuration or deployment change.

Exact next action: **6B only**. Verify cached graph with the committed verifier,
then attempt only shard 1 at the versioned destination in package-inventory.json.
Read/encode bytes programmatically, never emit multi-megabyte base64 into model
context. Verify create_blob SHA against inventory, immediately attach to a tree
and branch commit, then verify remote file length/SHA256/blob ID. A blob response
alone is insufficient. If transport is unavailable/fails, commit exact blocker and
safe alternative; do not keep retrying or start other shards. Parent stage 6
remains incomplete until full distribution and URL/load checks pass. Stop after 6B.

## Stage 6B — license and pilot preparation, 2026-10-18

Starting/outcome branch: `depth-tfjs-webgl`; starting commit
`d13dabeee16b56d001d8f3fa55c78ccc98edad36`. This user-requested finer split
supersedes every historical 6B–6J next-action/scope reference above. 6A remains DONE;
6B now completes only license/preparation. 6C uploads/attaches shard 1, 6D checks
its remote bytes, 6E–6AA transfer one subsequent shard each. 6AB adds model.json,
6AC audits distribution, 6AD checks immutable URLs, 6AE actually loads the model.

Deliverables: full `LICENSE.txt`, exact `SOURCE_MODEL_CARD.md` and
`ATTRIBUTION.md` at `models/depth-anything-v2-small-tfjs-fp32-224-v1/`.
The card downloaded from the immutable Keras revision matches stage 3's 4,720 bytes
and SHA256. Its pinned file listing has no separate LICENSE or NOTICE. The complete
Apache-2.0 text was retrieved using the connected GitHub integration from original
DepthAnything upstream commit `a561b849ebae10a6f5ef49e26c83cbbcd36c71bf`; author attribution
was checked against its README. The conversion modification notice accompanies
future binary shards without corrupting their bytes. Runtime dependency notice
audit remains required if runtime code is later distributed.

Evidence: `tools/depth-tfjs/evidence/package-license-checkpoint.json`.
Local shard 1 was re-read at the 6A source path; length/SHA256/blob ID match inventory.
Remote starting tree: no AGENTS.md, graph or weights; no partial branch asset to
resume. No upload attempted in this bounded substage. Binary transport remains
unproven, with no measured tool-limit/error claimed. No hosting or phone result.

Main/live state: main still `9db5c0345faf7339f3d4cc24142dad362122649e`;
Pages run 39104746337 rechecked `success` for that exact head. Only documentation,
evidence and license/provenance files change in this run. App, Access and deployment
configuration remain unchanged. No stage 6B blocker.

Exact next action: **6C only**. Re-read current branch head and intended shard path;
use the expected inventory to recover/skip already attached work. Read shard 1
programmatically from the recorded graph path, base64-encode without output to the
conversation, and make one create_blob call through the integration. Compare returned
blob ID `465c35791bb7139749f64bd758c46971a7607477`; immediately attach via tree,
commit and leased ref update. Record resulting commit and ref/tree metadata evidence,
then stop. If transport fails, capture exact error, checkpoint blocked and stop.
6D alone subsequently checks remote byte SHA256. Never count a dangling blob or
start shard 2 in 6C. No user input currently required.

## Stage 6C split — preparation checkpoint, 2026-10-18

This section supersedes earlier instructions to upload and attach shard 1 in one run.
User requested a durable checkpoint before the large binary tool call.

| Substage | State | Scope |
| --- | --- | --- |
| 6C1 | DONE | Check branch/path and local shard identity; commit preparation and stop before another binary upload. |
| 6C2 | NOT STARTED — NEXT | Inspect branch/path and recover expected blob if available; otherwise attempt one programmatic binary upload. Commit a small receipt or exact blocker to this branch, then stop. |
| 6C3 | NOT STARTED | Attach the expected blob to the model path using tree/commit/leased ref update; verify ref and tree path, size and blob ID; checkpoint and stop. |

Parent 6C remains PARTIAL until 6C3. 6D still performs remote byte verification.
No other Stage 6 scopes change. A dangling blob is not a hosted model.

Starting branch/head: `depth-tfjs-webgl` at `64a6c1091ffe2927f85299d95ff55dfa46d30f04`.
The inspected recursive tree had no AGENTS.md or binary model assets.
Local shard: `/workspace/scratch/4c361dacd12f/stage4/final/graph-model/group1-shard1of24.bin`.
Length 4,194,304 bytes; SHA256 `9fa4b753d284376f2bfd5831f583dec5c879dcdf92ddc41187732ec864c29855`;
Git blob ID `465c35791bb7139749f64bd758c46971a7607477`.
All match the inventory. These local bytes remain temporary.

Before the upload attempt, create_tree with the expected blob returned HTTP 422:
`tree.sha 465c35791bb7139749f64bd758c46971a7607477 is not a valid blob`.
A 5,592,408-character base64 payload was then prepared programmatically using
3-byte-aligned reads, without printing it. The subsequent create_blob call was
reported as `aborted by user after 5.8s`; no success response or blob ID was received.
This does not establish whether GitHub accepted the upload. No upload retry was made.
The branch head was re-read after interruption and remained at the starting commit.

Evidence: `tools/depth-tfjs/evidence/package-shard1-preparation.json`.
Blocker: binary upload outcome unknown; branch attachment not completed.
Main last checked at `9db5c0345faf7339f3d4cc24142dad362122649e`; last previously
verified successful Pages run 39104746337. No new deployment check is claimed.

Exact next action: run **6C2 only**. First inspect the current head/path and check
whether expected blob 465c35791bb7139749f64bd758c46971a7607477 can be recovered.
If absent, re-read and verify the local shard (or regenerate via CONVERSION.md if
missing), encode without emitting payloads, then make at most one create_blob attempt.
Record the returned ID or exact failure in a small committed receipt and update
DONE/status before stopping. Do not attach in 6C2, start 6D, or upload shard 2.
The upload request itself is indivisible with create_blob; this split saves progress
around it, not within it. Do not claim this removes any transport/context limit.


## Stage 6C2 blocked — phone upload handoff, 2026-10-18

Working/outcome branch: `depth-tfjs-webgl`; starting commit `d30f1d75d0ddbe252880abadddb9efc477a51812`.
6C2 remains BLOCKED pending manual upload. No 6C3 or 6D executed.
Fresh recursive tree inspection found no AGENTS.md or binary assets. Recovery probe
returned HTTP 422: expected blob 465c35791bb7139749f64bd758c46971a7607477 is not a valid blob.
Local shard was recovered and verified: 4,194,304 bytes, SHA256
9fa4b753d284376f2bfd5831f583dec5c879dcdf92ddc41187732ec864c29855,
Git blob 465c35791bb7139749f64bd758c46971a7607477.
One base64 create_blob attempt (5,592,408 characters) returned
"aborted by user after 6.1s" with no receipt. User screenshot shows conversation
maximum-length message. The interruption source is not established by the tool label;
no GitHub rejection or successful upload is inferred. Do not retry this large payload path.

Alternative requested by user: download the unchanged group1-shard1of24.bin to phone,
then use Chrome GitHub website (Desktop site if necessary), Add file > Upload files
inside models/depth-anything-v2-small-tfjs-fp32-224-v1 on branch depth-tfjs-webgl.
Commit only that file to this branch, never main. Browser upload combines upload and
attachment; next run must reconcile 6C2/6C3 against the actual user commit, not duplicate it.
GitHub documents a 25 MiB browser file limit; this file is 4 MiB.

Exact next action: wait for user upload/commit link; read current branch and path,
confirm expected blob ID and length, record receipt and reconcile attachment status.
Remote byte verification stays 6D. No shard 2, app integration or deployment in this run.
Main remains 9db5c0345faf7339f3d4cc24142dad362122649e; deployment not rechecked.
Only checkpoint documentation changes in this commit.


## Stage 6C completed by phone upload — 2026-10-18

This current checkpoint supersedes all earlier 6C waiting/blocker/next-action text.
Working/outcome branch: depth-tfjs-webgl. User uploaded shard 1 in commit
b1dcfe169931a425cb80a66d611c8f9f556a920b, parent 87b55b3d495a4a7c22fc2b7190c15eeb66816063.
Fresh immutable recursive tree inspection confirms the exact destination
models/depth-anything-v2-small-tfjs-fp32-224-v1/group1-shard1of24.bin,
mode 100644, length 4,194,304, blob 465c35791bb7139749f64bd758c46971a7607477.
Length and content-addressed Git blob identity exactly match the verified local
original and inventory. No AGENTS.md found. Browser upload combined upload and
attachment, so 6C2 and 6C3 are reconciled DONE; parent 6C DONE.
No duplicate upload/attachment performed. Only shard 1 is present.
Evidence: tools/depth-tfjs/evidence/package-shard1-upload.json.
Blocker: none for 6C. Stage 6 remains PARTIAL.
Exact next action: 6D only, independently retrieve remote shard bytes and verify
length/SHA256/Git blob ID, save evidence and checkpoint, then stop. This run
verified remote tree metadata/content identity, not an independent remote SHA256.
Main/live last checked at 9db5c0345faf7339f3d4cc24142dad362122649e; no deployment
performed or new deployment verification claimed. No app files changed.


## Stage 6D complete — remote bytes verified, 2026-10-18

Working/outcome branch: depth-tfjs-webgl; starting commit cefe6c4c8f4d20dadfbae0c47a2b9c98ebe0b8aa.
Downloaded shard 1 from the immutable raw GitHub URL recorded in
`tools/depth-tfjs/evidence/package-shard1-remote.json`, using Python urllib
with a 30-second timeout. HTTP 200; complete response: 4,194,304 bytes.
Independent SHA256: 9fa4b753d284376f2bfd5831f583dec5c879dcdf92ddc41187732ec864c29855.
Independent Git blob ID: 465c35791bb7139749f64bd758c46971a7607477.
All three assertions match the committed package inventory; process exit 0.
Connected integration confirmed the branch-referenced path/blob/size; complete
recursive tree has no AGENTS.md and only shard 1 among the binary model assets.
6D DONE; no blocker. Stage 6 remains PARTIAL; complete model loading is not yet possible.
Main remains 9db5c0345faf7339f3d4cc24142dad362122649e. No app, Access, PWA or deployment changes;
no new deployment check claimed. This run changes documentation/evidence only.

Exact next action: **6E only**, transfer and verify shard 2. First inspect current
branch/path and resume any user upload. Use the proven phone/browser upload handoff
if absent: prepare verified shard 2 for download and checkpoint WAITING FOR USER
UPLOAD; after upload verify immutable remote bytes. Do not repeat the interrupted
multi-megabyte create_blob path. Do not upload shard 2 during this 6D run.
This pointer supersedes all historical next-action paragraphs.


## Stage 6E partial — shard 2 phone upload ready, 2026-10-18

Working/outcome branch: depth-tfjs-webgl; starting commit e59a83b7a83e40139f470a9f7c759154ec209022.
Fresh complete recursive tree: no AGENTS.md and no shard 2 path.
Recovered original group1-shard2of24.bin and verified length 4,194,304 bytes,
SHA256 29341eab5d3feed201a3c539f4fc5f69c9f2534ceeced61bbcabc8e9a472492a,
Git blob 63c58b0a76b53613d829b08b8f8655b7052fd50a. All match package-inventory.json.
Download copy: /workspace/scratch/c49fd39fc577/group1-shard2of24.bin (temporary).
Evidence: tools/depth-tfjs/evidence/package-shard2-preparation.json.
6E PARTIAL / WAITING FOR USER UPLOAD. No binary tool upload attempted.

Exact next action: user downloads unchanged shard 2 and uploads it through GitHub
website into models/depth-anything-v2-small-tfjs-fp32-224-v1 on depth-tfjs-webgl,
committing only that file. Then resume 6E: inspect current head/path, download bytes
from immutable commit URL and verify length/SHA256/blob against inventory, commit
receipt and mark 6E DONE only on success. Do not begin 6F or upload shard 3.
Main/live last checked at 9db5c0345faf7339f3d4cc24142dad362122649e; no deployment
performed or rechecked. No app/Access/PWA changes. Only documentation/evidence changed.


## Stage 6E complete — shard 2 remote verification, 2026-10-18

Working/outcome branch: depth-tfjs-webgl; user upload/start commit 42e5bf8a83bac3ab922184351edbf41cdee593a2.
Connected GitHub tree confirms correct model path, mode 100644, 4,194,304 bytes,
blob 63c58b0a76b53613d829b08b8f8655b7052fd50a. No AGENTS.md found.
Independently downloaded complete shard bytes via Python urllib from the immutable
raw GitHub URL at that commit (HTTP 200, timeout 30s). Length, SHA256
29341eab5d3feed201a3c539f4fc5f69c9f2534ceeced61bbcabc8e9a472492a and Git blob
ID all exactly match package-inventory.json. All assertions pass, exit 0.
Evidence: tools/depth-tfjs/evidence/package-shard2-remote.json.
6E DONE; no blocker. Stage 6 remains PARTIAL; shards 1 and 2 now verified.
Exact next action: **6F only**, shard 3. Inspect current head/path; if absent,
prepare the verified local shard for phone/browser upload and checkpoint waiting.
After upload verify immutable remote bytes before marking 6F complete. Do not
retry the interrupted large create_blob path. No shard 3 work in this run.
Main/live last checked at 9db5c0345faf7339f3d4cc24142dad362122649e; no deployment
performed or rechecked. App, Access and PWA unchanged. This supersedes earlier
6E waiting/next-action text. Documentation and evidence only in this checkpoint.


## User-authorized paired upload: 6F + 6G, 2026-10-18

User explicitly requested the next two shards in one upload; this overrides the
one-substage restriction for this pair only. Starting/outcome branch depth-tfjs-webgl,
starting commit 98562dffeb027fb2a0adbe634434cee89d2b68d1. Fresh recursive tree has no AGENTS.md or shard 3/4.
Both originals recovered; lengths, SHA256 and Git blob IDs verified against inventory.
Download copies prepared at /workspace/scratch/c49fd39fc577/group1-shard{3,4}of24.bin.
Evidence: tools/depth-tfjs/evidence/package-shards3-4-preparation.json.
6F and 6G PARTIAL / WAITING FOR USER UPLOAD; neither is complete yet.
Exact next action: upload both unchanged files into
models/depth-anything-v2-small-tfjs-fp32-224-v1 on depth-tfjs-webgl in one commit.
Then inspect current head and independently download/hash both immutable remote
files; mark each stage DONE only if its length/SHA256/Git blob checks pass.
Stop after this pair; do not start 6H/shard 5. No binary tool upload attempted.
Main/live last checked at 9db5c0345faf7339f3d4cc24142dad362122649e; no app,
Access, PWA or deployment changes; deployment not rechecked.


## Stages 6F + 6G complete — paired remote verification, 2026-10-18

User-authorized pair verified on depth-tfjs-webgl, upload/start commit
74791062c1c1600dc2f431a5a0f7b299887fea07. Remote tree confirms correct paths/mode 100644;
no AGENTS.md found. Independently downloaded both complete files at immutable
raw GitHub commit URLs using Python urllib (30s timeout) and hashlib.
Both HTTP 200, 4,194,304 bytes; SHA256 and Git blob IDs exactly match inventory.
All assertions passed, exit 0. Evidence: tools/depth-tfjs/evidence/package-shards3-4-remote.json.
6F DONE and 6G DONE; no blocker. Shards 1–4 verified; stage 6 still PARTIAL.
Exact next action: **6H only, shard 5**. Inspect current branch/path; if absent,
prepare verified file for phone/browser upload and checkpoint waiting. Verify
immutable remote bytes after upload before marking complete. Stop after 6H;
paired authorization applied only to shards 3 and 4. No shard 5 work in this run.
Main/live last checked at 9db5c0345faf7339f3d4cc24142dad362122649e; no deployment
performed or rechecked; no app, Access or PWA changes. This supersedes earlier
paired waiting instructions. This checkpoint changes documentation/evidence only.


## User-authorized remaining-shard batch — 2026-10-18

User requested all remaining shards for one download/upload. This explicitly
supersedes the one-shard restriction for shards 5–24 (6H–6AA) only.
Branch depth-tfjs-webgl; starting commit 893c02a6dec3d470f62755038fe42466dfa8c368.
Fresh tree contains shards 1–4 only and no AGENTS.md.
All 20 original shards 5–24 independently match inventory length/SHA256/Git blob ID.
Prepared flat ZIP depth-shards-05-24.zip: 74,872,666 bytes; uncompressed 80,368,524 bytes.
ZIP SHA256 c66e9d315c1ba6b2d9773feec37a1c5781a98df5c446056fe548f3f82195a6ae.
Reopened ZIP, CRC check passed, all 20 extracted member SHA256 values match inventory.
Temporary download: /workspace/scratch/c49fd39fc577/depth-shards-05-24.zip.
Evidence: tools/depth-tfjs/evidence/package-shards5-24-preparation.json.
6H–6AA PARTIAL / WAITING FOR USER UPLOAD. No binary tool upload attempted.

Exact next action: user extracts ZIP on phone and uploads its 20 .bin files directly
into models/depth-anything-v2-small-tfjs-fp32-224-v1 on depth-tfjs-webgl in one commit.
Do not upload ZIP itself or an enclosing folder. After upload inspect branch/tree,
independently download and verify each immutable remote shard, commit evidence and
mark only passing rows DONE. Stop after this authorized batch. model.json remains
6AB, not included or started; final audit/URLs/model load remain 6AC–6AE.
Main/live last checked at 9db5c0345faf7339f3d4cc24142dad362122649e; no app,
Access, PWA or deployment changes; no new deployment verification claimed.


## Remaining batch partially uploaded — 2026-10-18

Branch depth-tfjs-webgl; inspected upload/start commit f7ae565fe9cfd937ce9f456c3209e207041b94f6.
Complete recursive tree has shards 1–4 and 9–24. Shards 5,6,7,8 are absent;
no AGENTS.md found. All 16 newly uploaded shards 9–24 independently downloaded
from immutable raw GitHub URLs, HTTP 200; lengths/SHA256/Git blob IDs all match
package inventory (Python urllib, timeout 30s, hashlib; exit 0).
Evidence: tools/depth-tfjs/evidence/package-shards5-24-remote.json.
6L–6AA DONE (shards 9–24). 6H–6K remain PARTIAL/WAITING FOR USER UPLOAD (5–8).
Together with prior verified shards 1–4, 20 of 24 shards are verified.

Exact next action: user uploads only group1-shard5of24.bin, group1-shard6of24.bin,
group1-shard7of24.bin and group1-shard8of24.bin from the previously supplied ZIP
into models/depth-anything-v2-small-tfjs-fp32-224-v1 on depth-tfjs-webgl.
Then verify these four immutable remote files and checkpoint; no need to reupload
9–24. model.json remains absent and stage 6AB is not started. Stop after closing
this batch; do not begin model.json or final package audit in the same run.
Main/live last checked at 9db5c0345faf7339f3d4cc24142dad362122649e; no deployment
performed/rechecked, no application/Access/PWA changes. Only docs/evidence changed.


## Remaining shard batch complete — 2026-10-18

Branch depth-tfjs-webgl; upload/start commit c6cc4c87f2aa398ead679e168a5c6f95ab99a6a6.
Fresh complete recursive tree: all 24 shard paths, sizes and Git blob IDs match
inventory; no AGENTS.md found. Shards 5–8 independently downloaded from immutable
raw GitHub commit URLs: HTTP 200, each 4,194,304 bytes; SHA256 and Git blob hashes
all exactly match inventory. Python urllib (30s timeout), hashlib, four assertions
pass, process exit 0. Evidence: tools/depth-tfjs/evidence/package-shards5-8-remote.json.
6H–6K DONE; combined with earlier verification 6A–6AA DONE. All 24 shards verified
across recorded runs and still present with identical blob IDs in this tree.
No blocker for shard transfer. Parent stage 6 remains PARTIAL: model.json absent,
complete distribution audit, URL checks and actual model loading still pending.
Exact next action: **6AB only**, attach exact inventory-matching model.json,
verify its remote bytes, update checkpoint and stop. No model.json work in this run.
Main/live last checked at 9db5c0345faf7339f3d4cc24142dad362122649e; no deployment
performed/rechecked or app/Access/PWA changes. Documentation/evidence only.
This pointer supersedes all earlier missing-shard and batch-waiting instructions.


## Stage 6AB complete — exact model.json attached and verified, 2026-10-18

Working/outcome branch: `depth-tfjs-webgl`; starting commit
`7e037875f341f89d11d6d5526f7d89b60662e1ab`.
Original local model.json passed inventory length/SHA256/Git blob checks.
Attached unchanged UTF-8 bytes through the connected GitHub integration in commit
`8d6ba9f6e6fa1708f3cc445bdba9f1624e7df7bf`, then updated the branch with an expected-head lease.
Remote tree confirms intended model path, mode 100644, 671,603 bytes and blob
`8daa3840f06ea22aa70b144e53e66c51befbb0ea`.
Independently downloaded immutable remote bytes using Python urllib (30-second
timeout): HTTP 200; length 671,603; SHA256
`5ab6f29764edf13ae194d53a23f09ece13a6bce1edd5de2b2d820c8a1e2a7c3f`;
Git blob ID matches inventory. JSON parse passed; all assertions passed.
Evidence: `tools/depth-tfjs/evidence/package-model-remote.json`.
Fresh complete starting tree contained no AGENTS.md or model.json; no partial
manifest upload was present. 6AB DONE; no blocker. Parent stage 6 remains PARTIAL.

Main has advanced independently to `d9651e62b82ae1f4152e1ed2414b5f285e7c06cf`:
its upload commit adds duplicate shards 5–8 at repository root. Pages run
https://github.com/tmt11geo/dashboard-pwa/actions/runs/39132225480
completed successfully for that exact SHA. Preserve/reconcile this intervening
main work during stage 9; no main edits or deployment were made by this run.
The feature branch retains the correctly located shards. This run adds only
model.json and checkpoint documentation/evidence; app, Access and PWA unchanged.

Exact next action: **6AC only**. Read current branch/head and audit all 25 model
assets against package-inventory.json plus final license/provenance/integrity
metadata. Commit evidence and updated checkpoint, then stop. Full immutable URL
checks remain 6AD and actual explicit-WebGL GraphModel load remains 6AE.
This pointer supersedes historical next-action text; 6AC was not started here.


## Stage 6AC complete — distribution audit, 2026-10-18

Working/outcome branch: `depth-tfjs-webgl`; audited starting commit
`56e4193b402ca4630207684f92e3af57978796ca`.
Connected GitHub integration returned the complete recursive tree (no AGENTS.md).
All 25 asset paths, modes 100644, sizes and Git blob IDs match the inventory.
A fresh Git checkout of that exact commit independently passed SHA256, length
and Git blob checks for every asset against the inventory and conversion-run-2.
The manifest references exactly 24 unique, ordered relative shards; declared
unquantized weights total 97,145,740 bytes, full model 97,817,343 bytes.
The exact pinned model card and full Apache-2.0 license still match their stage
6B lengths/hashes; source revision agrees across conversion/inventory/provenance.
Authorship and modification notice retained; stale pre-upload wording and relative
provenance links corrected. No model bytes changed.

Reproduce: `python tools/depth-tfjs/audit_package.py` (Python standard library + Git,
exit 0). Evidence: `tools/depth-tfjs/evidence/package-audit.json`.
6AC DONE; blockers: none. Parent stage 6 remains PARTIAL.
Main/live is `7386a02552ee1e8d55a52bd5025d5112614ea276`; Pages run
https://github.com/tmt11geo/dashboard-pwa/actions/runs/39133290852 completed
successfully for that exact SHA. Main's separate cleanup removed root duplicates;
correct feature-branch assets remain intact. No app, Access, PWA, main or deployment
changes in this run. Preserve current main during stage 9 reconciliation.

Exact next action: **6AD only**. Pin the current feature-branch commit, download
all 25 assets from their intended immutable raw GitHub URLs, verify full response
length/SHA256/Git blob against inventory, and commit URL/hash evidence plus updated
DONE/status. Live custom-domain Pages checks remain deferred to stage 9. Stop
after 6AD; actual explicit-WebGL GraphModel loading remains 6AE.
This supersedes earlier continuation pointers. No URL sweep or runtime load was
performed in 6AC; Git checkout verification is not a claim about HTTP model loading.


## Stage 6AD complete — immutable URLs verified, 2026-10-18

Working/outcome branch: `depth-tfjs-webgl`; starting and asset commit:
`e1477f06af60f6cba2ff1271f4e98ee7bb858e80`.
Fresh connected-integration recursive tree was complete and had no AGENTS.md.
Downloaded every asset from the commit-pinned raw.githubusercontent.com path
under `models/depth-anything-v2-small-tfjs-fp32-224-v1/`.
All 25 URLs returned HTTP 200 without redirects. Complete downloaded lengths,
SHA256 and Git blob IDs match `package-inventory.json`: 97,817,343 bytes total.
The downloaded model.json parses and references the exact 24 ordered relative
shard paths. No model bytes or application files changed.

Command (Python 3.12.14, standard library, four concurrent downloads, 30-second
socket timeout, no automatic retries):
`python tools/depth-tfjs/verify_package_urls.py --commit e1477f06af60f6cba2ff1271f4e98ee7bb858e80`
Evidence: `tools/depth-tfjs/evidence/package-urls.json`, including every immutable
URL, response status, length and both hashes. All checks passed; process exit 0.
6AD DONE; blockers: none. Parent stage 6 remains PARTIAL pending 6AE.

Main/live remains `7386a02552ee1e8d55a52bd5025d5112614ea276`; Pages run
https://github.com/tmt11geo/dashboard-pwa/actions/runs/39133290852 rechecked
completed/success for that exact SHA. No merge/deployment/Access/PWA changes.
Live custom-domain Pages URL and authenticated application checks are deferred
to stage 9. Raw HTTP success does not establish browser CORS, WebGL loading,
phone speed, or the availability of the feature branch on live Pages.

Exact next action: **6AE only**. Use the verified complete package and committed
benchmark/validation tooling to perform an actual GraphModel load with explicit
WebGL and CPU forwarding disabled; record runtime/backend identity, load outcome,
errors and cleanup. If successful, checkpoint 6AE and parent stage 6 DONE, then
stop before stage 7 camera integration. If blocked, preserve evidence and exact
blocker instead. This pointer supersedes historical continuation instructions.


## Stage 6AE complete — packaged GraphModel WebGL load, 2026-10-18

Branch: depth-tfjs-webgl. Starting commit: 591483b4c68b45656d61ae7106303135e2fde5f3.
User explicitly authorized at least three steps this run: 6AE, 7, 8; stop before deployment.
`run_package_load.cjs` verified all branch model bytes and pinned TFJS/input hashes,
served the actual package at its relative models path on loopback HTTP, and ran
the existing dedicated-worker benchmark. All 25 assets fetched. TFJS 4.22.0,
WebGL, WEBGL_CPU_FORWARD=false, Chromium 141 / SwiftShader. First plus three warm
inferences PASS. Load 525.4 ms; first 12319 ms; warm median 9335.2 ms (local HTTP,
software renderer only). Finite [1,224,224,1] outputs; live tensor/data/GPU counters
returned to zero, backend removed, context lost. Texture pools reported separately.
Evidence: tools/depth-tfjs/evidence/package-load.json. Runner: run_package_load.cjs.
Command: NODE_PATH=<playwright modules> DEPTH_CHROMIUM=<headless_shell> node
 tools/depth-tfjs/run_package_load.cjs <verified tf.js> <prepared fixtures> <report>.
Exit 0. Dependencies and fixture regeneration: VALIDATION.md. All stage 6 rows DONE.
No blockers. No physical camera/hardware-GPU/phone performance claim; no live Pages
validation. Main remains 7386a02552ee1e8d55a52bd5025d5112614ea276 (successful Pages
run 39133290852 checked in 6AD); no deployment in this step.
Next: stage 7 camera integration, fixed-224 letterboxing, explicit TFJS WebGL,
worker/backpressure/diagnostics, preserve ONNX paths. Then stage 8 as authorized.


## Stage 7 complete — explicit TFJS camera option, 2026-10-18

Branch: depth-tfjs-webgl. Preceding 6AE checkpoint: 7fe68183a1a0175411bf6e239e7466468c36a392.
Added separate TFJS worker and fixed-224 NHWC helpers; explicit WebGL/no CPU
forwarding, relative same-origin model paths, full-view letterboxing and matching
raw depth/colour crop. Existing ONNX Auto/WASM/WebGPU path preserved. Resolution
is locked for TFJS; loading/inference deadlines, one-frame backpressure, pause/step,
copyable identity/timing/memory/errors, context-loss handling and termination remain
explicit. TFJS runtime version and license linked; no runtime bundle redistribution.
Actual page + actual model smoke passed eight checks with a simulated camera:
fixed resolution, correct 224x168 landscape output, engine label, pause/step,
WebGL identity, ended tracks, controls restored, all 25 package assets requested.
Evidence: tools/depth-tfjs/evidence/camera-smoke.json; runner and CAMERA.md committed.
Existing depth tests: 9/9 PASS (`node --test tests/depth*.test.mjs`). JS syntax and
`git diff --check` pass. No physical-camera/phone performance claim.
Main/live remains 7386a02552ee1e8d55a52bd5025d5112614ea276; no deployment,
Access, map, theme, tracker, navigation, manifest or service-worker changes.
Blockers: none. Exact next action: stage 8 only, test lifecycle failures, timeouts,
stale responses, repeated runs and portrait/landscape alignment; fix regressions,
commit evidence. User authorized continuing to stage 8 in this run. Stage 9 excluded.


## Stage 8 complete — lifecycle and regression evidence, 2026-10-18

Working/outcome branch: depth-tfjs-webgl. Preceding stage 7 checkpoint:
9342505ffdca403362b78ba1878d4e586547ba3c. User authorized three steps; 6AE, 7 and 8
are now complete. Stop before stage 9; no merge/deployment in this run.

`node --test tests/*.test.mjs`: 56/56 PASS. Includes new exhaustive pixel alignment
and normalized-padding checks in landscape, portrait, square and widescreen;
invalid/nonfinite guards; fixed loading/inference deadlines; stale responses;
worker crash/message errors; hide/navigation; late permissions/denial; switching
back to Auto/WASM/WebGPU; unsupported worker/backend and silent-CPU rejection.
Actual browser/TFJS worker lifecycle: 23 checks PASS. Covers missing-model error,
Stop during real HTTP loading and inference, both parent deadline paths, portrait
restart with actual inference, two-frame stable live resources, actual WebGL context
loss, camera tracks ended after each interruption, navigation worker destruction.
Separate `/dashboard-pwa/` prefix run: 8 checks PASS, including correct relative
worker/module/model resolution and all 25 package assets. Browser tests use a local
pinned scene as a simulated camera and the hash-verified pinned TFJS runtime.
TFJS 4.22.0, Chromium 141, SwiftShader, WebGL CPU forwarding false.

After each portrait inference: 562 model tensors/data buffers, 97,145,740 live
CPU bytes, 97,392,336 live GPU bytes; no per-frame growth. Allocated GPU pool was
674,689,860 then 674,886,468 bytes; this retained pool is not reported as a leak or
as freed. Stop terminates the worker; post-termination GPU counters unavailable.
Stage 6AE separately measured normal model/backend/context disposal to zero.
Added an inference-start diagnostic to make cancellation timing observable.

Evidence: tools/depth-tfjs/evidence/stage8-results.json, stage8-node-tests.log,
camera-lifecycle.json, camera-prefix.json. Reproduction: CAMERA.md.
JS syntax and diff whitespace checks PASS. Protected files compared byte-for-byte
to current main: map/navigation/theme/tracker/PWA and existing ONNX worker/core/
diagnostics unchanged. ONNX preservation is backed by unchanged source and tests;
no new actual ONNX device inference claim. No physical camera/phone/hardware-GPU
performance evidence; stage 10 remains required. Stage 8 blockers: none.

Main/live still 7386a02552ee1e8d55a52bd5025d5112614ea276. Pages run
https://github.com/tmt11geo/dashboard-pwa/actions/runs/39133290852 rechecked
completed/success for this exact SHA. No Access/configuration/deployment changes.

Exact next action: **stage 9 only**. Inspect latest main and reconcile intervening
changes (root duplicates already removed), bump affected asset queries and diagnostic
build IDs, run final relevant checks, merge verified implementation and deploy via
the existing Pages setup, preserving Cloudflare Access. Verify Pages for the exact
merged commit and accessible asset URLs without bypassing authentication. Record
live state and provide OnePlus test instructions. Do not claim phone results or
start stage 10 automatically. This pointer supersedes historical instructions.


## Stage 9 deployment preparation — 2026-10-18

Working branch depth-tfjs-webgl; starting commit 87e998cd3d1dbe98313d5558b24c6a8fe9b43dbb.
Main 7386a02552ee1e8d55a52bd5025d5112614ea276 has no net tree changes since
the common ancestor (duplicate root shards uploaded then removed). No AGENTS.md.
Bumped diagnostic build to depth-lab-4, page script to depth.js?v=5 and
diagnostics import to v=3. New TFJS worker/core retain their first-release v=1.
56/56 Node tests PASS; full 25-file package audit PASS; git diff --check PASS.
Evidence: tools/depth-tfjs/evidence/stage9-node-tests.log and stage9-package-audit.json.
Protected existing app files and service-worker policy unchanged. Prior stage 8
actual-model browser/prefix evidence remains applicable; only build/cache IDs changed.
Stage 9 PARTIAL pending merge and exact Pages deployment verification.
Exact next action: merge this verified tree with current main, verify the resulting
Pages run and protected URLs, then save deployment receipt and phone test handoff.
No stage 10 execution or phone performance claim.


## Stage 9 complete — merge and deployment verified, 2026-10-18

Working/outcome checkpoint branch: depth-tfjs-webgl. Starting feature commit:
87e998cd3d1dbe98313d5558b24c6a8fe9b43dbb. Preparation commit:
207458ca50a92ad01d9949f4be0f07567c81d7d5. Merged/deployed main: e599a76ad2a48e97650545f64980abf4756de3e8.
The merge has both main and feature parents, preserves main's duplicate-shard
cleanup and uses the exact verified preparation tree 068f6f605347661dbaf476bc8b6c1473d8cde977.
Main had no net changes since the common ancestor; no AGENTS.md found.
Connected integration updated refs with expected-head leases.

Pages run https://github.com/tmt11geo/dashboard-pwa/actions/runs/39134967348
completed successfully for this exact merged SHA; build, deploy and report jobs
all succeeded. Remote main fetched and matches the deployed SHA; deployed app
files match the tested working bytes. Final receipt is on depth-tfjs-webgl only,
so main remains the exact verified deployment commit.

Build depth-lab-4; depth.html loads depth.js?v=5, which imports diagnostics?v=3.
New TFJS modules/worker use first-release v=1. Existing unchanged asset versions
remain valid. Final checks: 56/56 Node tests, full 25-file/97,817,343-byte model
audit, JS syntax and git diff --check PASS. Protected map/navigation/theme/tracker/
PWA files and ONNX worker/core match main byte-for-byte. No Access or service-worker
configuration changed. Prior stage 8 browser evidence retained; no new phone test.
Evidence: tools/depth-tfjs/evidence/stage9-{node-tests.log,package-audit.json,
deployment.json,live-urls.json}.

Unauthenticated checks of the live depth page, depth.js and model.json returned
HTTP 403. A follow-up page response identifies Cloudflare error 1010 (cfOrigin=0).
This is an environment/client access limitation, not evidence of missing assets,
and does not independently verify the Access login policy. No alternate hostname
or authentication bypass attempted. Authenticated live app/model validation remains
for the user; Pages success is verified separately. Stage 9 has no deployment blocker.

Exact next action: stage 10 only, OnePlus evaluation. Open
https://tmt11.com/dashboard-pwa/depth.html?v=4 through normal Access authentication;
confirm diagnostics show depth-lab-4. See docs/depth-tfjs-phone-test.md for the
short baseline/WebGL/timing/lifecycle sequence and requested copied logs.
Stage 10 NOT STARTED; no phone performance or hardware acceleration result claimed.
This pointer supersedes all historical deployment-preparation/next-action text.


## Guided persistent relief design checkpoint — 2026-10-23

User approved persistent 3D relief and measured move–hold–capture guidance.
R0 design/source audit complete; see docs/depth-relief-scan-plan.md. No scanner
implementation or deployment in this checkpoint. Starting/outcome branch
 depth-tfjs-webgl at 838eebbcb36b2f7eccc2d991fddd065516d8a52a.
Main remains e599a76ad2a48e97650545f64980abf4756de3e8; deployment not rechecked.
Phone log supplied in this conversation confirms Adreno 740 WebGL with CPU
forwarding disabled, 8.392 s loading, 5.034 s first inference and 1.837–1.873 s
warm inferences. Stable live counters across 11 completed frames; user reports
poor browser responsiveness at requested 1/s. Evidence summary:
tools/depth-tfjs/evidence/stage10-phone-summary.json (not a full raw-log archive).
Stage 10 is PARTIAL, not “no phone evidence”; lifecycle/baseline/heat remain pending.
Fresh source audit: relief is replaced each frame; worker discards raw depth range
via normalization; assumed camera FOV and arbitrary geometry cannot establish a
consistent map. No AGENTS.md in either inspected tree. Documentation-only change;
source inspection performed, no new runtime tests claimed.
Exact next implementation action for the newly approved feature: R1 only in the
scan plan, preserve raw capture data and build bounded guided scheduling. Pose,
scale alignment and fusion remain R2/R3 feasibility work. No mapping claim yet.
This additive project pointer supersedes “no phone results” wording above.


## Guided scan implementation — 2026-10-23

User explicitly asked to build and deploy the guided persistent scan, superseding
the earlier R1-only planning pointer. Started on depth-tfjs-webgl at
dd5186ed28609ad85512fb531339e1e46ab53062; main inspected at
e599a76ad2a48e97650545f64980abf4756de3e8. No AGENTS.md found.
Implemented raw capture data, measured hold/move cues, bounded worker registration,
accepted-view accumulation, pause/finish/clear and versioned local file save/open.
Build depth-lab-5. Ordinary TFJS also rests at least one second after each result.
The experimental scan uses relative-depth offset search and robust similarity
registration with feature coverage, geometric and reprojection rejection gates.
It is approximate, arbitrary-scale, limited to 40 views/32,000 points, and has no
loop closure, calibrated pose or long-scan accuracy guarantee.

Verification: 64 Node tests PASS; browser UI test with controlled inference and
real registration PASS (three-view accumulation, pause/resume, finish release,
save/clear/open/reload, late-result rejection). Actual TFJS WebGL/no CPU forwarding
with packaged model on five Redwood colour images PASS: two accepted views, finite
raw depth retained separately from normalized display. Chromium 141 SwiftShader;
no OnePlus guided-scan performance claim. Source hashes, reproducible harness,
fixture hashes and results are in tools/depth-scan/. Mobile screenshot inspected;
controls also placed over camera, and diagnostics collapsed initially.
A failed real test revealed invalid-depth correspondences rejecting entire frames;
fixed by excluding those samples, with regression test. No quality thresholds were
relaxed to turn that real test into a pass. Earlier synthetic testing adjusted
scale-correction search and added rotation/repetition rejection.

R1–R4 implementation complete for experimental short scans; R2 has bounded
synthetic/real feasibility evidence, not general reconstruction accuracy. R5
deployment pending; physical OnePlus acceptance remains pending. Original stage 10
is still partial. No map/tracker/theme/PWA/Access or ONNX behavior changes intended.
Exact next action in this run: commit, deploy main, verify exact Pages success,
then checkpoint the receipt and give the user the new scan URL and steps.


## Guided scan deployed — 2026-10-23

Implementation/main commit: faf6339373a38345905949b864cd1c651ccc9689. Build depth-lab-5.
Pages run https://github.com/tmt11geo/dashboard-pwa/actions/runs/40004530154
completed/success for this exact SHA. Main advanced by an expected-head lease;
all seven source files in the verification manifest match remote main bytes.
Final documentation receipt is on depth-tfjs-webgl; main stays at the verified
implementation/deployment SHA.

Experimental guided scanning is now available at
https://tmt11.com/dashboard-pwa/depth.html?v=5 via the normal Access flow.
Use Start guided scan, move slightly sideways with overlap, hold still, wait for
View added, Finish, then Save relief file. Open restores a saved scene for
inspection; saved files cannot resume tracking. Clear starts a new scene.

Evidence: tools/depth-scan/evidence/. 64 Node tests PASS, 13 browser UI/lifecycle/
save-open checks PASS, actual model/real-sequence checks PASS (2 accepted views,
2,065 points from five images; overly similar views rejected). Synthetic 3D
transform, affine depth and negative cases pass. Physical phone acceptance,
long-scan drift, heat and responsiveness remain unverified. No metric accuracy
or general SLAM claim. The R1–R4 implementation and R5 deployment are complete
for this experimental release; R5 OnePlus acceptance remains open.

Automated custom-domain page/script/core requests returned HTTP 403 with body
error code 1010. No authentication bypass attempted; Pages success is separate
from authenticated live-app validation. Access configuration is unchanged.
Evidence: live-urls.json and deployment.json.

Exact next action: user tests 3–5 views on OnePlus, pauses/finishes, rotates, saves,
reloads and opens the scene; supply diagnostics and alignment/responsiveness/heat
observations. Resume from this branch checkpoint and inspect main before fixes.
This supersedes all earlier R1-only and deployment-pending pointers.
