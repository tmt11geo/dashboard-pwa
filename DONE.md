# Depth Anything TFJS WebGL — checkpoint

## Movable replay viewpoint implemented and approved — 2026-10-31

User explicitly requested implementation and deployment. Starting checkpoint
d7f387add4741fc7a1ce76ec94fd785010ea7108; main inspected at
37d4944434c91db3b3eb6c84ec28e7459e4a789d. No AGENTS.md.
Added one-pointer drag orbit, pinch zoom, two-pointer pan, mouse wheel zoom,
Shift/right drag pan, keyboard arrows/Shift arrows/+/-/R, zoom buttons and
Reset view. These change the viewing camera only; playback, recorded poses,
velocity and distances remain unchanged. Current camera basis drives trajectory,
cube, axes, velocity and face depth ordering. Camera persists during playback
and scrubbing; loading a new recording resets overview. Input cancellation,
capture transitions, zoom/pitch/pan bounds and canvas-only touch-action included.

32 motion tests PASS; JS syntax PASS. Controlled pointer tests cover pinch/pan,
pointer cancellation and disabled state; real browser drag orbit, wheel/button
zoom, keyboard pan and reset checked with synthetic rising-loop data. No physical
phone multi-touch validation claim. Evidence: tools/motion-lab/evidence/orbit-tests.log.
Build motion-lab-4; motion.html?v=5. No capture/schema/model/Access/nav changes.
Next: publish approved tree, verify exact Pages success and record receipt. User
saves current capture before refresh, loads JSON, drags/pinches/two-finger pans
while paused or playing; Reset view restores overview. Phone gesture check pending.

## 3D trajectory and distance replay deployed — 2026-10-31

User explicitly approved deployment. Main advanced with an expected-head lease
to 37d4944434c91db3b3eb6c84ec28e7459e4a789d; PR #4 is merged.
Pages run https://github.com/tmt11geo/dashboard-pwa/actions/runs/41203316020
completed SUCCESS for this exact SHA. Previous approval blocker is resolved.

Live: https://tmt11.com/dashboard-pwa/motion.html?v=4
Cube now moves and rotates on the full XYZ path in the same view, with attached
velocity. Bright/dim segments show travelled/remaining path. Readouts show path
travelled/total and straight-line distance from the first retained sample.
Tracking gaps remain disconnected and excluded from path length.

26 prior tests passed; browser rising-loop checks verified trajectory and distance
scrubbing. No code changes during deployment; no physical sensor accuracy claim.
Next: save any current capture before refreshing, open Motion Lab, Load trajectory
JSON or Stop then Use current recording, Play/scrub. Existing v1 JSON is compatible.
Check distance and path interpretation on phone; provide capture/diagnostics if needed.
Checkpoint remains depth-tfjs-webgl; main stays at the exact deployed SHA.

## Trajectory/distance update: deployment approval blocked — 2026-10-31

Implementation: d4e51bc1341b74d76cc14ad41a28d9a0d4f0585c on depth-tfjs-webgl.
26 tests PASS; browser synthetic rising-loop replay and distance scrubbing checked.
All ten changed remote files match tested content. Automatic approval review
rejected advancing main for these new trajectory/distance additions: the user
requests were treated as implementation approval, not live-deployment approval.
No retry/workaround. Main rechecked unchanged at 42ae89705aca10149dfc3e8af6711173846ffbda.
Exact next action: obtain explicit approval to deploy trajectory and distance
changes; recheck heads, leased main promotion, verify exact Pages success, receipt.
Then load existing JSON in motion.html?v=4; Play/scrub to see moving cube on 3D path,
path travelled/total and straight-line distance from first retained sample.
This supersedes any immediate-publication pointer below.

## Combined 3D trajectory replay — 2026-10-31

Started from depth-tfjs-webgl 9a35e70aeef4c430b351325c1cd776b6ba640512;
main verified 42ae89705aca10149dfc3e8af6711173846ffbda. No AGENTS.md.
User reported cube/playback good and requested trajectory in the same view.
Added full XYZ path, moving/rotating cube and attached velocity in one fixed
projection. Bright travelled/dim remaining segments split at current pose;
Start/End markers and corner world axes. View fits full capture once, with
padding for the constant-size orientation glyph. Tracking gaps stay disconnected.
Removed the separate X/Z inset. Capture, JSON format and velocity math unchanged.

26 motion tests PASS. Browser rising-loop fixture inspected at mid-replay.
Evidence: tools/motion-lab/evidence/trajectory-tests.log and docs/motion-replay.md.
Build motion-lab-3; motion.html?v=4. No physical phone accuracy claim.
Outcome branch depth-tfjs-webgl. Next: publish combined trajectory visualization
via existing Pages flow and verify exact success; user saves any current recording
before refresh, opens existing JSON or Use current recording, then Play/scrub.

## Replay and navigation deployed — 2026-10-31

User explicitly approved live publication. Main advanced with an expected-head
lease to 42ae89705aca10149dfc3e8af6711173846ffbda. PR #3 is merged.
Pages run https://github.com/tmt11geo/dashboard-pwa/actions/runs/41202668208
completed SUCCESS for this exact commit. Previous deployment blocker is resolved.

Live entry: https://tmt11.com/dashboard-pwa/?v=20
Motion Lab/replay: https://tmt11.com/dashboard-pwa/motion.html?v=3
Primary order: Map → Motion Lab → Camera → Depth → Experimental.
Dashboard is under Experimental tools:
https://tmt11.com/dashboard-pwa/depth-experimental.html?v=2

20 motion/replay tests and eight navigation checks passed, desktop/390px browser
checks completed; all 12 changed navigation/checkpoint files verified remotely.
No physical phone accuracy claim. Access/service-worker/sensor/model logic unchanged.
Exact next action: save any open capture before refreshing. Open Motion Lab, Stop
recording and Use current recording, or Load trajectory JSON; Play/scrub to inspect
cube rotation and velocity. Open Experimental to find Dashboard. Provide diagnostics
and optionally saved JSON for phone issues. Checkpoint branch depth-tfjs-webgl;
main remains the exact verified deployment commit.

## Navigation reorganization and replay approved — 2026-10-31

User requested Motion Lab immediately after Map, Dashboard under Experimental,
and explicitly approved the combined update for the live app. This resolves the
replay deployment approval blocker below. Starting checkpoint cec4216d7685b8135b35125a726157a01c12c098;
main verified e956b57b10f31093ca5e868d6422c02f307377dc. No AGENTS.md.

Primary navigation on eight app pages: Map, Motion Lab, Camera, Depth, Experimental.
Experimental page now contains Dashboard, Gather and Calibration links. Dashboard
remains functional at its original URL. Shared scoped navigation CSS wraps on phones.
Motion Lab includes the approved current-recording/JSON replay, rotating cube and
velocity visualization from the preceding checkpoint. Entry URL motion.html?v=3.

Eight HTML navigation checks PASS; 20 existing motion/replay tests PASS. 390px
browser layout inspected. No sensor/model, map logic, Access or service-worker
changes. Next: publish tested tree to main with expected-head lease, verify exact
Pages success, record deployed SHA and checkpoint. Actual phone AR/accuracy
remains a manual test; replay synthetic/browser validation is documented separately.

## Motion replay: deployment approval blocked — 2026-10-31

Tested implementation checkpoint: 8c22e5a2a7ed95560d1c762dd667b6742c26282e
on depth-tfjs-webgl. 20 tests passed; browser rendering/playback and 390px layout
checked with synthetic data. Source blobs match local tested bytes.
Automatic approval review rejected the leased main update: the new replay request
was treated as code-change authorization, not approval for this exact production
deployment. No workaround or retry attempted. Main rechecked unchanged at
e956b57b10f31093ca5e868d6422c02f307377dc. Replay is not live.
Exact next action: obtain user approval to deploy this replay update, recheck
branch heads, promote tested feature tree via leased main update, verify exact
Pages success and record receipt. Then test motion.html?v=2 by loading a v1
trajectory or stopping a new recording and selecting Use current recording.
This supersedes the earlier immediate-publication pointer.

## Motion replay implemented — 2026-10-31

Based on depth-tfjs-webgl 32e02db4c803c123002d0dcae5d3f4837f81bc37;
main inspected e956b57b10f31093ca5e868d6422c02f307377dc. No AGENTS.md.
Added Motion Lab replay for current capture and existing tactical-motion-1 JSON.
Centred rotating viewer cube, fixed world axes, amber velocity vector, numeric
speed/components, X/Z path, Play/Pause, scrub, rewind and 0.25–2x playback.
Velocity derives from adjacent positions/timestamps, not IMU integration; gaps
are not interpolated. Physical speed is independent of playback rate. Validated,
bounded local input; no added dependencies or uploads. Replay works without AR.
Build motion-lab-2; motion.html?v=2. Current capture must be saved before refresh.

20 Node core/lifecycle/replay checks PASS; JS syntax PASS. Browser synthetic
sequence verified rendering/scrub/play/pause and 390px layout. Production page
startup without AR verified; no phone sensor/accuracy claim. Reproduction,
conventions and evidence: docs/motion-replay.md, tools/motion-lab/evidence/replay-tests.log.
Ordinary Depth, scanner, map, model, Access and service worker remain unchanged.
Outcome branch depth-tfjs-webgl. Next: commit/publish via existing Pages, verify
exact deployed SHA, record receipt; user loads saved JSON or uses current capture
after Stop, then Play/scrub. No unsaved capture survives a page reload.

## Motion Lab deployed — 2026-10-31

User explicitly approved deployment. Main advanced with an expected-head lease to
e956b57b10f31093ca5e868d6422c02f307377dc. PR #2 is closed/merged.
GitHub Pages run https://github.com/tmt11geo/dashboard-pwa/actions/runs/41201439689
completed SUCCESS for this exact SHA. Ordinary Depth and Access remain unchanged.
Live demo: https://tmt11.com/dashboard-pwa/motion.html?v=1
Navigation: Experimental → Motion Lab.

10 prior Node core/controlled-lifecycle tests and syntax checks passed; unsupported
browser UI inspected. No code changes during deployment. Unauthenticated custom-domain
request returned HTTP 302; authenticated phone runtime is not verified here.

Exact next action: open Motion Lab in Android Chrome through normal Access login,
Start AR tracking, permit camera/AR, translate about one metre, rotate, return,
Reset origin, Stop and Save trajectory. Try installed PWA after Chrome succeeds.
If unsupported or startup fails, provide Diagnostics. Hardware camera/IMU tracking,
accuracy and installed-PWA acceptance remain pending; do not infer them from CI.
This receipt supersedes earlier deployment-pending text. Checkpoint branch remains
depth-tfjs-webgl; main remains the exact successful deployment SHA.

## Motion Lab camera + IMU demo checkpoint — 2026-10-31

Started from depth-tfjs-webgl 5ac55c8e8ef75dc7f8423292a931a7da2d8cf093;
remote main verified d40d914a9ae94e1a432e56d4df040505b1638e01. Recursive
repository tree contains no AGENTS.md. This new feature supersedes the previous
single-frame phone-test pointer for the current development task.

Added isolated motion.html (motion-lab-1), WebXR/ARCore local 6DoF pose demo:
XYZ metres, quaternion, displacement, bounded top-down trail, reset, stop, JSON
export, capability diagnostics. Linked from Experimental. No model download,
raw-frame upload, accelerometer dead reckoning, Depth fusion or mapping claim.
Ordinary Depth, scanner controllers, map logic, PWA service worker and Access unchanged.
Evaluated Depth Anything V2/3, ORB-SLAM3 and WebXR; decision and sources in
docs/motion-lab.md. WebXR is the first browser feasibility path, not a bundled
open-source VIO engine; Android Chrome uses platform ARCore.

10 Node core/controlled-lifecycle tests PASS; JS syntax PASS. Unsupported-device
UI rendered and inspected in cloud browser. Evidence: tools/motion-lab/evidence/
node-tests.log; reproducible commands and limitations in docs/motion-lab.md.
No physical camera/ARCore, metric accuracy, phone layout or installed-PWA success
claim. No deployment: main remains at the previous single-frame Depth release.

Outcome/checkpoint branch: depth-tfjs-webgl. Next action: review Motion Lab, then
promote approved code via existing main/Pages flow and verify exact deployment.
After deployment, test motion.html?v=1 in Android Chrome: start, translate about
one metre, rotate, return, reset, stop/save, restart. Then try installed PWA.
Provide Diagnostics if AR capability/permission fails. Do not integrate Depth
with AR camera or claim successful phone VIO until the real device test passes.


## Single-frame Depth deployed — 2026-10-31

User explicitly approved deployment to the live app. Main advanced with an
expected-head lease to d40d914a9ae94e1a432e56d4df040505b1638e01.
Pages run https://github.com/tmt11geo/dashboard-pwa/actions/runs/41200346308
completed SUCCESS for this exact SHA (build, deploy and report jobs succeeded).
PR #1 is closed/merged. The earlier deployment approval blocker is resolved.

Live ordinary Depth: https://tmt11.com/dashboard-pwa/depth.html?v=18
Preserved scanning: https://tmt11.com/dashboard-pwa/depth-experimental.html?v=1
Gather remains reachable from Experimental. TFJS WebGL is the default on Depth;
calibration is not required there. Full-screen relief and return remain available.
95 Node tests, 19 browser checks and four mobile layout checks passed before
deployment; evidence and reproduction are in docs/depth-single-frame.md.
Unauthenticated live Depth request returns HTTP 302; Access is unchanged.
Authenticated phone runtime remains a manual check, not a deployment claim.

Checkpoint branch depth-tfjs-webgl; this receipt follows the deployed code.
Exact next action: user opens Depth, Start depth camera, then 3D relief;
test Pause/One depth frame and Full screen/Return without importing calibration.
If startup fails, copy the depth-single-1 diagnostic log. No further scan changes
are required for this completed split. This supersedes pending deployment text.


## Single-frame split checkpoint: deployment awaits approval — 2026-10-31

Implementation: b53786318083c99aa5c1c69c3d486efe3c4efd30 on depth-tfjs-webgl.
All 21 changed remote blobs match tested local files. 95 Node tests, 19 actual-model
browser checks and four mobile layout checks PASS. Experimental controller matches
the previous controller byte-for-byte. No phone performance or new stitch claim.
Draft review: https://github.com/tmt11geo/dashboard-pwa/pull/1

Automatic approval review rejected the leased main update: updating the default
branch deploys the live app, and the user's code-change authorization was not
accepted as explicit production deployment approval. Do not retry deployment
until the user explicitly approves merging/deploying this change.
Remote heads rechecked: feature b53786318083c99aa5c1c69c3d486efe3c4efd30;
main still 01107843915c49461a9032d0105734f41e10802b. No deployment occurred.
This documentation receipt follows the implementation on the feature branch.

Exact next action: obtain explicit approval to merge PR #1 / advance main and
deploy, recheck both branch heads, deploy with an expected-head lease, verify
the exact Pages run succeeds, then record the deployment receipt. User then
tests depth.html?v=18 without calibration. Earlier deployment-pending text
below is superseded by this approval blocker.


## Restore single-frame Depth; isolate experimental scanning — 2026-10-31

User requested restoring the simple Depth page and preserving current scanning as
Experimental. This supersedes the earlier replay/stitching next-action pointer.
Started on depth-tfjs-webgl at 70600eaf9ff081109b8a77c634b85246f5bc9cf9;
main inspected at 01107843915c49461a9032d0105734f41e10802b. No AGENTS.md.
Restored pre-scan depth.html/depth.js from e599a76, retaining responsiveness,
full-screen relief and unrestricted horizontal rotation. TFJS WebGL is default;
no calibration/scanning imports or requirements on ordinary Depth.
Preserved former controller byte-for-byte as depth-experimental.js and former
scan page as depth-experimental.html. Gather uses that experimental controller.
Navigation and calibration return links updated; camera navigation wraps on phones.
Model, inference workers, calibration/stitching modules, file formats, Access,
service worker and map/tracker logic unchanged. Build depth-single-1.

95 Node tests PASS. Actual TFJS WebGL model browser/prefix checks, pause/step,
full-screen same-canvas return, experimental startup/navigation and narrow-screen
layout checks recorded in tools/depth-tfjs/evidence/single-frame-*.
See docs/depth-single-frame.md for reproduction and phone steps.
No physical camera/OnePlus runtime or new successful scan claim.
Outcome branch depth-tfjs-webgl; implementation complete, deployment pending.
Next action: commit verified files, leased main promotion, verify exact Pages
success and record receipt. Then user tests depth.html?v=18, Start depth camera,
3D relief, Pause/One depth frame and Full screen/Return to page without calibration.


## Progress-aware timeout fix deployed — 2026-10-25

Live main: 01107843915c49461a9032d0105734f41e10802b, workflow gather-4. Pages run
https://github.com/tmt11geo/dashboard-pwa/actions/runs/40226500300 completed SUCCESS
for this exact SHA. All 14 changed blobs verified before leased main promotion.
Checkpoint branch depth-tfjs-webgl; this receipt follows implementation. 95 Node,
10 focused timeout/replay browser and 28 existing full-screen checks PASS.
Evidence: tools/depth-calibration/evidence/gather-timeout-*. Private input retained
locally only. Unauthenticated scan.html?v=5 returns HTTP 302; Access unchanged.

Exact next action: open https://tmt11.com/dashboard-pwa/scan.html?v=5, Open capture
session tactical-gather-1792956186322.json, Stitch, keep page visible, Build relief.
No calibration import/camera/recapture needed. Expected local result: views 4/5
placed, 2/12 total, 3,846 points. Processing no longer expires merely because total
time exceeds three minutes; a three-minute absence of progress still terminates.
If phone timeout repeats, Save capture session and supply the new file (contains
processing status/last progress/elapsed time). Physical Android runtime validation
remains open. Other ten views still fail registration; no general 3D accuracy claim.
This supersedes deployment-pending text below.


## Twelve-view timeout investigation — 2026-10-25

Resumed depth-tfjs-webgl 37d5a2121e0b8ed78d8464288527dd33b361a70e;
main verified f37232a7c0fb65950aa4db90282e8f4073bd58cc. No AGENTS.md.
Private supplied 12-frame capture SHA256:
848cfda5e585aaf53ea7516eb192b8ec9adde85aafc4567ba837f7eee2cc678b.
First five image/depth buffers exactly match the previous lamp capture; seven more
views were appended after about 23 minutes. File contains no saved stitch decisions
or worker timing, so the phone timeout's exact location cannot be reconstructed.
Baseline local replay completes in 6.57s, 2/12 placed (views 4/5), 3,846 points.
Actual browser replay completes in 6.71s with the same result. Desktop timing is
NOT an Android performance claim. Remaining views fail matching/depth/geometry
checks; this change does not improve their placement or establish metric accuracy.

Found a fixed 180-second total processing deadline, regardless of worker progress.
Gather-4 resets the 180-second inactivity watchdog only on actual work progress;
preparation and individual reference/neighbour comparisons emit progress. UI names
view pairs and elapsed time, logs progress, and session export retains processing
status/elapsed time/last progress to diagnose any further timeout. Silent workers
still terminate; cancel/hidden-page cleanup and captures remain intact. No heartbeat
that could conceal stalled computation, no relaxed registration/calibration gates.

95 Node tests PASS; 28 existing full-screen/browser regression checks PASS
(gather-timeout-fullscreen.json). 10 focused browser checks PASS: actual private 12-view import,
real worker/relief; accelerated watchdog test lets a progressing job survive 3x
its deadline, stops a silent worker, exports timeout evidence/all 12 captures,
allows retry, and rejects late completion after cancellation. No uncaught errors.
Evidence: tools/depth-calibration/evidence/gather-timeout-{browser,replay}.json,
gather-timeout-node.log; harness test_gather_timeout_browser.cjs. Private captures
and screenshots remain local and are not committed.

Outcome branch depth-tfjs-webgl. Next: commit tested changes, leased main promotion,
verify exact Pages run and receipt. User next opens scan.html?v=5, Open capture
session with the SAME 12-view file, Stitch, keep page visible, Build relief. Expect
2/12 placed, not all twelve. No recapture/calibration/camera needed for replay. If
it still stalls, save the new session containing processing metadata. Physical
Android runtime is the remaining timeout-validation blocker. Access unchanged.


## Full-screen relief deployed — 2026-10-25

Live main: f37232a7c0fb65950aa4db90282e8f4073bd58cc. Pages run
https://github.com/tmt11geo/dashboard-pwa/actions/runs/40224910371 completed SUCCESS
for this exact SHA. All 11 changed remote blobs matched verified local bytes before
leased main promotion. Checkpoint branch depth-tfjs-webgl; this receipt follows code.
95 Node and 28 browser checks PASS, including native fullscreen, browser exit, return
button, Escape, denied-native fallback, same canvas/session and original page scroll.
Private layout screenshots not committed. Unauthenticated scan.html?v=4 returns
HTTP 302; Cloudflare Access and service worker policy unchanged.
Evidence: tools/depth-calibration/evidence/relief-fullscreen-*.json and node log.

Exact next action: open https://tmt11.com/dashboard-pwa/scan.html?v=4 (or
https://tmt11.com/dashboard-pwa/depth.html?v=16), display a 3D relief, tap Full screen
in the relief controls, rotate/zoom, then Return to page. Expect the same session,
rotation/zoom and page scroll, without navigation or recapture. Native fullscreen
on the physical Android/PWA remains a manual check; full-window modal is available
if native mode is refused. Stitching limitations from earlier checkpoints remain.
This supersedes deployment-pending text below.


## Full-screen relief viewer — 2026-10-25

Resumed depth-tfjs-webgl 51b26a7c02af35609774208b25171ebf8311ace6;
main verified 5eec56a74e763037058a3782d5a120b0028bc728. No AGENTS.md.
Added Full screen to relief tools on both Depth and Gather. The viewer moves the
existing canvas and controls into a modal, requests native fullscreen on its content
container, and retains a full-viewport modal if the browser refuses the request.
Return to page, Escape and browser fullscreen exit restore the same canvas/controls,
original page scroll and focus. No navigation, scan reset, model restart or copy of
scene state. Rotation/zoom handlers stay attached; canvas redraws for the new size.
Native fullscreen on dialog itself is prohibited, so the request targets its div.

95 Node tests PASS; 28 browser checks PASS using the actual five-view saved lamp
session and real registration. Tests cover native fullscreen, Return, browser-driven
exit, rejected fullscreen fallback, Escape, same canvas/control identity, retained
2-view result, restored scroll, no overflow/uncaught errors. Layout screenshot checked
locally; private image not committed. Browser simulated camera/inference only for
capture lifecycle; saved-session stitching and viewer are real. Evidence:
tools/depth-calibration/evidence/relief-fullscreen-browser.json and
relief-fullscreen-node.log. Capture/stitch geometry and Access policy unchanged.

Outcome branch depth-tfjs-webgl. Next in this run: commit, leased main promotion,
verify Pages success, checkpoint. User test: scan.html?v=4, Open capture session,
Stitch, Build relief, Full screen, rotate/zoom, Return to page. Or depth.html?v=16,
select 3D relief then Full screen. Expect same page/session/view after return; no
new file or capture required. Phone-specific fullscreen handling remains a manual
check; browsers that deny native mode still get a full-window viewer.


## Lamp-pair recovery deployed — 2026-10-25

Live main: 5eec56a74e763037058a3782d5a120b0028bc728, workflow gather-3.
Pages run https://github.com/tmt11geo/dashboard-pwa/actions/runs/40224102001
completed SUCCESS for this exact SHA. All 21 changed remote blobs matched local
bytes before leased main promotion. Working/checkpoint branch depth-tfjs-webgl;
this receipt follows implementation. 95 Node and 19 browser checks PASS. New lamp
session recovers views 4/5 into 3,846 points; earlier 8-view session remains 1/8.
Evidence: tools/depth-calibration/evidence/gather-lamp-*. No private images committed.
Unauthenticated scan.html?v=3 returned HTTP 302; Access unchanged.

Exact next action: open https://tmt11.com/dashboard-pwa/scan.html?v=3, Open capture
session with tactical-gather-1792954648479.json, then Stitch. Expect recovered group
starting at view 4 and 2/5 placed. Build relief shows the two-view reconstruction.
No calibration import, camera access or new capture needed for this replay. Views
1–3 still fail placement; ground-truth geometric accuracy is not known. User should
inspect the recovered pair before further capture. Do not claim all five views or
metric/full-object scanning solved. This supersedes deployment-pending text below.


## Lamp capture: recover a valid later component — 2026-10-25

Resumed depth-tfjs-webgl d0a4900509b305d3c90edca3a13dd508c46d04ee;
main verified 6bf7c0f66fa690b6cd3f69a41b04db927a3a7e33. No AGENTS.md.
New private five-view lamp session replays as one placed anchor in Gather-2.
Unlike the earlier room sweep, first-pair rotation support is only 0.30; do NOT
characterize this capture as pure rotation or blame user movement. It has 90 first-pair
matches but only 47/90 depth inliers. Views 2/3 are near-duplicates. Views 4/5 PASS
registration: 84 matches, 2/3 inlier ratio, median reprojection 0.42966px, normalized
3D residual 0.01112. They were excluded because neither connected to the first anchor.

Gather-3 performs one bounded restart when the original anchor stays isolated and
a neighbouring pair independently passes the unchanged pose/depth gates. Select
that pair's reference as the new anchor, clear pair cache, recompute poses/scale,
and use it only if more views are placed. Disconnected geometry is never merged.
This is not largest-component search or global optimization. Recovery start view is
shown in UI/logs; duplicate diagnostics now name the duplicate rather than depth.

Actual-file result: views 4 and 5 placed, 3,846 fused points; views 1–3 still unplaced.
Actual browser import/Stitch/Build relief reproduces this and the rendering was
inspected privately. Ground-truth shape/poses are unavailable: acceptance and visible
relief are not a metric-accuracy or full five-view reconstruction claim. Earlier
8-view rotation/depth-ambiguous file remains 1/8, preserving previous rejection.
95 Node tests PASS; 19 browser checks PASS (private calibration verification,
actual new session replay; simulated camera/inference for lifecycle tests). Synthetic
isolated-anchor recovery checks correct later-group translation and exclusion of
unrelated first geometry. Evidence: tools/depth-calibration/evidence/gather-lamp-*
and tools/depth-calibration/test_gather_lamp_browser.cjs. Private images are not in Git.

Outcome branch depth-tfjs-webgl; next in this run: leased commit/main promotion,
verify exact Pages success and checkpoint. Then user opens scan.html?v=3, Open capture
session with SAME five-view Gather JSON, Stitch, expects recovered group from view 4
and 2/5 placed, Build relief. No camera/calibration import/recapture required for this
replay. Remaining blocker: align views 1–3 and validate actual shape quality; user
can inspect recovered pair first. Existing calibration, model, live Depth pose gates,
Cloudflare Access and service worker policy unchanged.


## Actual-session matcher correction deployed — 2026-10-25

Live main: 6bf7c0f66fa690b6cd3f69a41b04db927a3a7e33, Gather workflow gather-2.
Pages run https://github.com/tmt11geo/dashboard-pwa/actions/runs/40223295249
completed SUCCESS for this exact SHA. All 24 changed remote blobs matched local
bytes before leased main promotion. Checkpoint branch depth-tfjs-webgl; this receipt
follows implementation. 94 Node, 19 Gather browser and 22 live-Depth browser checks
PASS. Numeric replay and source verification evidence are in
 tools/depth-calibration/evidence/gather-replay-*.json and gather-phone-*.json.
Private capture images/JSON were not uploaded to GitHub. Unauthenticated scan.html?v=2
returned HTTP 302. Cloudflare Access and navigation policy are unchanged.

IMPORTANT: this is a matching/diagnostic improvement, NOT successful reconstruction
of the user's eight-frame capture. It still places only the anchor. Wider matching
finds 67–123 neighbouring matches in the first six pairs; depth consensus remains
insufficient, with several rotation-like pairs. Final pair has 12 matches. Ground
truth motion is unknown. No acceptance thresholds were relaxed. Existing calibrated
Gather startup/inference is confirmed working in the user's phone logs.

Exact next action: user opens https://tmt11.com/dashboard-pwa/scan.html?v=2 and Open
capture session with the same saved Gather JSON (no calibration/camera needed), then
Stitch to inspect the improved explanations. For a controlled 3D test, load calibration,
Clear session, gather 3–4 views while translating the phone sideways and keeping its
pointing direction approximately fixed, on a stationary textured subject with overlap.
Save that session before processing; it is needed to test physical stitched quality.
Global refinement and rotation-only panoramic relief remain unimplemented. This
supersedes deployment-pending text below. Stop here pending physical translation data.


## Actual phone capture replay and matching correction — 2026-10-25

Resumed depth-tfjs-webgl a1ae7194153b72ae3fa0b1332da9822a03499311;
main verified 75ba53fb9706a68fdda029d4afe25bbd7071f4f2. No AGENTS.md.
User supplied an eight-frame private Gather session. SHA256:
1b90d01b301a8be6a3002fbadf3ef05e8f508816cdb6f23d36ff01dcdafa3305.
Images visibly overlap. Baseline reproduced 1/8 placed, all remaining shared-detail;
adjacent consistent matches were 9,11,11,15,0,7,0. Feature selection was sparse on
the dim stationary surfaces; bright moving content occupied many detected features.
The zero-initialized live optical-flow search is unsuitable for larger saved-view
motions. Do not blame the user for insufficient overlap from the old message.

Gather-2 uses denser distributed corners plus normalized 80x60 coarse patch search,
uniqueness check, seeded fine optical flow and forward/backward consistency. Only
saved-session matching changes; live scanner defaults and all depth/pose acceptance
thresholds are unchanged. Cache repeated reference pairs. Diagnostics distinguish
match count from coverage, retain nearest-neighbour diagnostics even without a
connected global pose, and compact log summaries avoid truncating the final frames.
Session exports retain detailed decisions; stale decisions clear on new capture/import.

On the supplied session, adjacent matches become 109,113,101,123,83,67,12.
First-pair rotation support is 0.9266 with 0.1762px median rotation residual at depth
resolution. Several neighbouring pairs are strongly rotation-like. All first six
neighbouring pairs still fail depth-consensus, last pair lacks sufficient matches.
The connected reconstruction remains ONE anchor, not a successful 3D stitch. Neither
metric camera motion nor true geometry is known, so this is rotation ambiguity and
relative-depth inconsistency evidence, not proof of zero translation. Do not relax
acceptance thresholds to force these images into a misleading reconstruction.

94 Node tests PASS, including affine-depth translation, pure rotations and unrelated
textures; 22 existing live-Depth browser checks PASS. 19 Gather browser checks PASS: actual uploaded session imported/replayed, actual
calibration/registration workers; simulated camera/inference for capture lifecycle.
Reconstruction remains one view in the actual-session browser test. Numeric evidence
only in tools/depth-calibration/evidence/gather-phone-{baseline,replay,neighbours}.json,
gather-replay-node.log, gather-replay-browser.json. Private images/JSON are NOT in Git.
Replay tool: node tools/depth-calibration/replay_gather.mjs PRIVATE.json REPORT.json.

Working/outcome branch depth-tfjs-webgl. Next: final existing-Depth regression, commit,
leased main deployment, verify exact Pages run and receipt. User can reopen the same
saved session at scan.html?v=2 without camera/calibration import to see the improved
diagnostics. It will still show one placed anchor. A new small translation capture
is needed to test actual reconstruction: move the phone sideways while keeping its
direction approximately fixed, retain overlap, use static textured surfaces. Global
optimization, handling moving objects and a rotation-only panoramic-relief mode are
not implemented. Cloudflare Access remains unchanged. Physical stitched success is
still blocked; startup/calibration/gathering succeeded in the supplied phone logs.


## Gather page deployed — 2026-10-24

Live main: 75ba53fb9706a68fdda029d4afe25bbd7071f4f2; workflow gather-1 (shared depth-lab-11 engine).
Pages run https://github.com/tmt11geo/dashboard-pwa/actions/runs/40096104137
completed SUCCESS for this exact SHA. All 19 changed remote blobs matched local
verified bytes before leased main promotion. Checkpoint branch depth-tfjs-webgl;
this documentation receipt follows implementation. 90 Node tests, 15 Gather browser
checks and 22 existing Depth browser checks PASS. Source/evidence/test procedure
recorded below and in docs/gather-stitch-test.md. No private images committed.
Unauthenticated scan.html?v=1 returned HTTP 302; Cloudflare Access configuration and
network-only navigation policy remain unchanged. No authenticated phone claim.

Exact next action: user opens https://tmt11.com/dashboard-pwa/scan.html?v=1 or taps
Gather in Tactical navigation. Load existing calibration, keep original landscape,
Start gathering, hold still/Capture view/wait for SAVED, repeat for 3–6 overlapping
views, Finish gathering, Save capture session, 2 · Stitch, 3 · Build relief. Share the
saved capture session privately if views are unplaced or misaligned. Existing camera
compatibility checks still apply; supply their exact message if startup is refused.
Physical multi-view phone performance/quality is the remaining blocker. The page
implements separate stages with pairwise registration and retry, not global pose
optimization. Captures can be reopened and reprocessed without another camera run.
This supersedes deployment-pending text below.


## Separate Gather → Stitch → Relief page — 2026-10-24

Resumed depth-tfjs-webgl 169ed85c48478cd2ca2935d97f9e8153981f9bd1;
main verified 895322f5f4d5f2febb671d5887bb5ec3d3fda06b. No AGENTS.md.
Added scan.html (gather-1 workflow) and Gather navigation on Map, Dashboard,
Camera and Depth. Existing Depth workflow remains the default. Shared depth host
selects the new controller only for data-workflow=gather; engine/calibration checks
are reused without assumed parameters or relaxed camera geometry.

Gather is manual: Start gathering, Capture view, wait for SAVED, move/hold, repeat.
No motion threshold or alignment gates gathering. At most 12 calibrated corrected
640x480 RGB + 224x168 relative-depth frames remain in memory. Finish releases camera
and model. Save/Open capture session retain all image/depth bytes, original verified
calibration and latest stitch decisions; files remain local, capped at 35 MB on import.
Save before closing; mobile beforeunload cannot guarantee recovery. Imported sessions
can be processed without camera access. Raw distorted images are not in this format;
corrected images plus calibration are preserved. Existing replay format is unchanged.

Stitch runs in a worker: prepare features, select a textured anchor, try up to three
nearby placed references, retry unplaced frames in a second pass. Existing calibrated
RGB/depth registration, rotation/scale/reprojection checks remain. This is pairwise
registration with composed poses, NOT global bundle adjustment, loop closure, robust
full orbit recovery or metric SLAM. Small motion can still be marked duplicate at
stitch time, but capture remains saved. Build relief separately fuses placed views
into up to 32,000 voxel points. Single-anchor results explicitly say no stitched
extension. Cancel/worker failure/visibility changes retain captures for retry.

Validation: 90 Node tests PASS; 15 Gather browser checks PASS; existing Depth 22
browser regression checks PASS. Real private calibration PNG verification and actual
registration workers; simulated camera/depth in browser. Synthetic tests recover
three translated views, revisit the anchor, reject mixed intrinsics and roundtrip
all image/depth bytes. Browser tests cover no automatic capture, three stationary
captures, finish cleanup, export/import, explicit unplaced frames, separate relief,
retry/cancel and no uncaught errors/overflow. Landscape screenshot inspected locally;
private images not committed. Physical multi-view reconstruction is not yet validated.
Evidence under tools/depth-calibration/evidence/: gather-node.log,
gather-browser.json, gather-regression.json, gather-verification.json.

Outcome branch depth-tfjs-webgl; next in this run: commit, leased main deployment,
verify exact Pages success and record receipt. User next opens scan.html?v=1 through
normal Access, loads existing calibration in original landscape, captures 3–6 nearby
overlapping views, Finish gathering, Save capture session, Stitch, Build relief.
Send the saved session if alignment is poor; no recapture is needed to retry processing.
Cloudflare Access and service worker policy unchanged. Phone camera-setting blockers
from previous checkpoints are not bypassed by this new workflow.


## Camera ID recovery deployed — 2026-10-24

Live main: 895322f5f4d5f2febb671d5887bb5ec3d3fda06b, build depth-lab-11.
GitHub Pages run 40094278074 completed SUCCESS for this exact commit.
Both remote heads verified at the implementation SHA before this documentation
receipt on depth-tfjs-webgl. All 14 changed remote blobs matched tested bytes.
86 Node tests and 22 browser checks pass. Evidence: binding-node.log,
scan-binding-browser.json, binding-verification.json and binding-deployment.json
under tools/depth-calibration/evidence/.

Unauthenticated live depth.html?v=12 returns HTTP 302 to Cloudflare Access login;
Access remains intact. No authenticated physical phone result claimed.
Next action: open https://tmt11.com/dashboard-pwa/depth.html?v=12, load the same
calibration JSON, keep original landscape direction, tap Start scan, allow camera
permission, and confirm reconnection ONLY on the same physical phone and camera.
If no unique camera match, the app stops with instructions rather than guessing.
If settings still differ, supply the exact new message/log; do not bypass checks.
After first view, move slightly sideways/hold for successive green cues, Finish,
and save replay for stitching diagnosis. Physical camera startup and reconstruction
quality remain the blockers requiring user interaction. This receipt supersedes
deployment-pending text below.


## Camera ID recovery — 2026-10-24

Resumed depth-tfjs-webgl at aa4ed72e83e5d43aa4cf0f5fea03d9ce38808549;
main verified c2b4c976697fc46452b14e9d0f8660cd0a450bc7. No AGENTS.md.
User build-10 screenshot identifies rejected deviceId, after successful calibration.
The saved handle is unavailable; whether permissions or browser ID renewal caused
it is not proven. This supersedes the previous unknown-constraint diagnosis.

Build depth-lab-11 refreshes permission only after a deviceId rejection, stops the
probe stream, enumerates cameras and retries the original ID if available. Otherwise
it requires exactly one nonempty exact camera-label match AND explicit user
confirmation that this is the same physical phone/camera. No arbitrary rear-camera
fallback. An ID/label read-back check precedes unchanged focus/zoom/size/orientation
checks; original calibration geometry/K/D/hash remain intact. Replay records the
binding method. A matching label plus user assertion is not optical identity proof;
use Cancel on another phone or if unsure, and recalibrate in that environment.
Permission-probe frames never reach inference. Cancellation releases streams.

Validation: 86 Node tests PASS; 22 real-browser checks PASS using the private phone
calibration PNGs and real calibration/registration workers, simulated camera/depth.
Tests cover original-ID refresh, unique-label confirmation, refusal/ambiguity,
wrong returned identity, cancellation, first calibrated relief after ID renewal,
probe cleanup, setting drift and replay. No physical startup/stitching success claim.
Evidence: tools/depth-calibration/evidence/binding-node.log, scan-binding-browser.json,
binding-verification.json. Private phone JSON/images are not committed.

Outcome branch: depth-tfjs-webgl. Deployment pending in this implementation commit;
next action is leased main promotion and exact Pages verification, followed by a
checkpoint receipt. User then opens depth.html?v=12, loads the SAME JSON, rotates
to calibration landscape and taps Start scan. Allow camera access; if prompted,
confirm only on the same phone/camera. Wait still for first green cue, then shift
slightly sideways and hold. Finish and save replay for any alignment failure.
Physical camera-setting compatibility and scene reconstruction remain unverified.
Cloudflare Access and unrelated application features are unchanged.


## Android startup fix deployed — 2026-10-24

Live main: c2b4c976697fc46452b14e9d0f8660cd0a450bc7, build depth-lab-10.
Pages run https://github.com/tmt11geo/dashboard-pwa/actions/runs/40090321380
completed SUCCESS for this exact SHA. All 15 changed remote file blobs matched
tested local bytes before main promotion. Main advanced by expected-head lease.
Working/checkpoint branch depth-tfjs-webgl; this receipt follows the implementation.

80 Node tests and 19 browser checks PASS. Existing phone JSON verifies successfully;
portrait preflight, Android-style exact-size rejection, preferred-size startup,
unchanged camera read-back checks, stale guidance cleanup and named constraint
diagnostics tested. Camera/inference are simulated in this startup regression test;
calibration PNG verification and registration workers are real. No physical phone
startup success claimed. Geometry/tracking/model unchanged from build 9.

Unauthenticated depth.html?v=11 request returned HTTP 403 / Cloudflare 1010 from
this environment; no Access alteration or bypass. Exact Pages success verified.
Evidence: tools/depth-calibration/evidence/startup-deployment.json.

Exact next action: user opens https://tmt11.com/dashboard-pwa/depth.html?v=11
through normal Access, confirms depth-lab-10, loads the SAME calibration JSON,
rotates to the original landscape direction, then Start scan. Expect camera/model
startup and a first green view cue. If refused again, copy the new diagnostics
with the named constraint. No new calibration requested. The old phone log did
not identify the rejected constraint; do not claim dimensions or deviceId proven
as its cause. Physical scene stitching quality remains waiting for device test.
This supersedes deployment-pending text below.


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

Updated: 2026-10-23. Repository: tmt11geo/dashboard-pwa.

## Where the work is

| Item | Location / state |
| --- | --- |
| Working branch | `depth-tfjs-webgl` |
| Branch containing this outcome | `depth-tfjs-webgl` |
| Starting main commit | `9db5c0345faf7339f3d4cc24142dad362122649e` |
| Live application branch | `main` |
| Live application commit last checked | `308686f9d81e1218c866c936b8a24e3a74064fe4` |
| Live diagnostic build | `depth-lab-8` |
| New TFJS backend deployed? | Yes; Pages success verified, authenticated device check pending |
| Active stage | PARTIAL: alignment/6DoF validation; phone stitching failed |
| Next stage | WAITING FOR DEVICE: calibration-1 session JSON |
| Current blocker | Real phone calibration session required |
| Outcome of this checkpoint | Calibration-1 deployed; exact Pages success verified |

Resolve the current checkpoint SHA from the branch head or the commit that last changed this file. Do not put a guessed/self-referential commit SHA here. Record completed implementation commits in the history below on subsequent checkpoints.

## Stage ledger

DONE means the stage's acceptance criteria and durable deliverables are available in the repository or verified immutable hosting. PARTIAL means useful work happened but some acceptance criteria or durable artifacts are missing.

| Stage | State | Completed work / remaining requirement |
| --- | --- | --- |
| 1. Audit and recover | **DONE** | Current main/tree/branches inspected; no AGENTS.md found; prior results preserved as historical evidence; plan and resume instructions saved. Local artifact recovery was attempted and files were absent. |
| 2. Conversion environment | **DONE** | Clean CPython 3.12.14 environment passes pip check, DepthAnythingBackbone import, TensorFlow operation and converter startup. Executable setup, complete version lock and evidence are under tools/depth-tfjs/. |
| 3. Pretrained conversion | **DONE** | Pinned source hashes verified; strict pretrained load; exact GELU smoke passed; two SavedModel → GraphModel conversions succeeded. All 24 shard hashes match between runs. Durable script, metadata and explicit regeneration/persistence arrangement in tools/depth-tfjs/CONVERSION.md; asset hosting remains stage 6. |
| 4. Numerical validation | **DONE** | Three revision/hash-pinned real images pass original vs rewrite, TFJS vs rewrite and TFJS vs original checks. Raw output shape/finite/range/error evidence and runnable tools committed under tools/depth-tfjs/. SwiftShader WebGL compatibility only. |
| 5. WebGL benchmark | **DONE** | Dedicated local worker benchmark runs actual fixed-224 graph with explicit WebGL and CPU forwarding disabled; two full first+3 warm cycles; live resources return to zero, context lost; failure/loading+inference cancel/timeout/restart checks PASS. SwiftShader compatibility only; see evidence/benchmark-results.json. |
| 6. Model packaging/hosting | **DONE** | 6A–6AE DONE; complete package integrity, immutable URLs, actual WebGL load/inference and cleanup verified. Live Pages deferred to stage 9. |
| 7. Camera integration | **DONE** | Explicit TFJS WebGL worker, fixed-224 letterboxing/crop, backpressure and diagnostics; actual app/model smoke PASS. |
| 8. Lifecycle/regressions | **DONE** | 56 Node tests, 23 actual-browser lifecycle checks and 8 deployment-prefix checks PASS; phone evaluation remains stage 10. |
| 9. Merge/deploy | **DONE** | Exact merged SHA deployed successfully; live automated requests blocked by Cloudflare. |
| 10. OnePlus device evaluation | **PARTIAL** | Hardware WebGL phone log received; responsiveness issue; lifecycle/baseline/heat pending. |

## Stage 6 substage ledger

| Substage | State | Exact scope |
| --- | --- | --- |
| 6A | DONE | Integrity audit and exact 25-file inventory (unchanged). |
| 6B | DONE | License/attribution and pilot transfer preparation only; no binary upload. |
| 6C | DONE | User browser upload and attachment verified; see latest checkpoint below. |
| 6D | DONE | Verify branch-referenced shard 1: length, SHA256 and Git blob ID from remote bytes. No upload. |
| 6E | DONE | Transfer shard 2 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6F | DONE | Transfer shard 3 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6G | DONE | Transfer shard 4 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6H | DONE | Transfer shard 5 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6I | DONE | Transfer shard 6 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6J | DONE | Transfer shard 7 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6K | DONE | Transfer shard 8 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6L | DONE | Transfer shard 9 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6M | DONE | Transfer shard 10 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6N | DONE | Transfer shard 11 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6O | DONE | Transfer shard 12 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6P | DONE | Transfer shard 13 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6Q | DONE | Transfer shard 14 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6R | DONE | Transfer shard 15 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6S | DONE | Transfer shard 16 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6T | DONE | Transfer shard 17 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6U | DONE | Transfer shard 18 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6V | DONE | Transfer shard 19 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6W | DONE | Transfer shard 20 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6X | DONE | Transfer shard 21 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6Y | DONE | Transfer shard 22 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6Z | DONE | Transfer shard 23 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6AA | DONE | Transfer shard 24 only; immediately commit, verify remote length/SHA256/blob ID, checkpoint and stop. |
| 6AB | DONE | Attach exact model.json only; verify remote bytes/hash and checkpoint. |
| 6AC | DONE | Audit all 25 branch assets and final license/provenance/integrity metadata. |
| 6AD | DONE | Verify all immutable intended URLs and downloaded hashes; record live Pages deferral to stage 9. |
| 6AE | DONE | Actual complete GraphModel load with explicit WebGL; only then mark parent stage 6 DONE. |

Complete only one substage per run. This finer split supersedes the old 6B–6J
scopes; completed 6A is unchanged. The original pilot's license/preparation is
6B, upload/attachment is 6C, and remote byte verification is 6D. Thereafter
transfer only one shard per run and commit it immediately before verification.
Resume partial work first. Parent stage 6 requires every row; a dangling blob
or inventory is not a hosted model. Never start a second substage in one run.

## Completed points

- [x] Inspect latest repository main rather than assume the supplied commit.
- [x] Check for repository AGENTS.md instructions.
- [x] Identify existing depth files, tests, worker scheduling, diagnostics and preservation requirements.
- [x] Preserve previous conversion findings and observed result values with their provenance limitations.
- [x] Establish ten bounded stages, branch tracking and reusable continuation instructions.
- [x] Commit and verify a reproducible conversion environment.
- [x] Preserve a reproducible pretrained conversion, metadata and regeneration arrangement.
- [x] Validate model outputs on three pinned real images, with raw numerical results.
- [x] Preserve hosted model assets.
- [x] Complete the isolated WebGL benchmark and resource/cancellation checks.
- [x] Complete camera integration and regressions.
- [ ] Complete deployment and phone evaluation.

## How to continue

Use [the reusable prompt](docs/depth-tfjs-continue-prompt.md). Read [the stage prompts](docs/depth-tfjs-plan.md) and [technical handoff](docs/depth-tfjs-status.md). Complete **one stage per run** and update this ledger before stopping. Do not re-run completed stages without a concrete reason; do reproduce historical results whose artifacts are missing.

## Checkpoint history

- 2026-10-18: Initial durable handoff on `depth-tfjs-webgl`, based on main `9db5c03`. Stages 2–5 retain historical execution evidence, not completed deliverable status.

- 2026-10-18: Stage 2 reproduced from starting checkpoint `56d4d161507ef865484f84014b7eb79005758fd2` on `depth-tfjs-webgl`. Evidence: `tools/depth-tfjs/evidence/`. Current main remains `9db5c0345faf7339f3d4cc24142dad362122649e`; successful Pages run: https://github.com/tmt11geo/dashboard-pwa/actions/runs/39104746337. No app or hosting configuration changed. Exact next action: run stage 3 using the committed environment, retrieve the pinned source/config/weights, verify their SHA256 values, then implement fixed-224 export and exact GELU rewrite. Do not treat historical stage 3–5 outputs as regenerated assets.

- 2026-10-18: Stage 3 completed from checkpoint `cf3af3af3e7b73a7304fcf0f84b1cea9b8e955d6` on `depth-tfjs-webgl`. Evidence: `tools/depth-tfjs/evidence/conversion-run-{1,2}.json` and `conversion-reproduction.json`. Both conversions succeeded; 24 byte-identical shards, semantically identical GraphModel JSON, 97,817,343 total bytes. Exact GELU rewrite smoke maximum error `3.337860107421875e-6`. Binary outputs are temporary; the committed converter regenerates them from immutable verified source files. No hosted assets or app changes. Main/live remain `9db5c0345faf7339f3d4cc24142dad362122649e` (Pages run 39104746337 successful). Exact next action: stage 4 only, pin at least three real-image fixtures and compare original pretrained outputs to rewritten/converted TFJS outputs before display normalization; commit the validator, provenance and numerical results. See technical status for available local outputs and regeneration command.

- 2026-10-18: Stage 4 completed from checkpoint `73eb63f07dff9efeb4103767125bc30587f3ecb4` on `depth-tfjs-webgl`. All nine comparisons PASS; largest error across all comparisons `8.380413055419922e-5`, largest MAE/source range `1.064663832685052e-6`, against limits `1e-3` and `1e-4`. Evidence: `tools/depth-tfjs/evidence/validation-results.json`; commands and fixture provenance: `tools/depth-tfjs/VALIDATION.md`, `validation-fixtures.json`. Explicit TFJS 4.22.0 WebGL, CPU forwarding false, Chromium 141 SwiftShader. No hardware/phone speed claim. Main/live remain `9db5c0345faf7339f3d4cc24142dad362122649e` (Pages run 39104746337 verified successful). Exact next action: stage 5 only, build the dedicated actual-model benchmark with repeated same-image timing, cancellation/failure logs and lifecycle/resource accounting. Do not integrate or deploy yet.

- 2026-10-18: Stage 5 completed from `59985fa561e435e96c54e125aaeaed5bbe1ad373` on `depth-tfjs-webgl`. Evidence: `tools/depth-tfjs/evidence/benchmark-results.json` and `benchmark.log`; runnable UI/worker/harness and commands in `BENCHMARK.md`. Two actual-model cycles each completed first+3 warm inferences of the identical stage 4 tensor. Warm medians 8078.1 / 8142.3 ms including readback (SwiftShader only). Normal disposal returned live tensors/data/GPU bytes to zero; 674,886,468 pooled bytes remained before backend removal/context loss. All seven checks PASS, including forced failure, loading/inference cancellation, timeout and restart. Viability: continue experimental packaging, with high memory/startup costs and real-device speed/support still unproven. Main/live unchanged at `9db5c0345faf7339f3d4cc24142dad362122649e`; Pages run 39104746337 successful. Exact next action: stage 6 only, package/license/host the validated FP32 graph and all 24 shards, verify intended URLs, hashes and actual loading. No app integration or deployment in this run.


- 2026-10-18: Stage 6A completed from `1b8409a367a1e816490aab117b35577f22d2d4e1` on `depth-tfjs-webgl`. User requested smaller chunks after blob-creation interruption. Recovered local stage 4 graph: all 25 files match stage 3 run-2 lengths/SHA256; 24 manifest shards total 97,145,740 bytes, complete graph 97,817,343 bytes. All expected Git blob IDs independently match `git hash-object`; corrupt/missing graph guards pass. Evidence: `tools/depth-tfjs/evidence/package-{inventory,checkpoint}.json`; verifier and `PACKAGING.md`. Recursive starting tree has no AGENTS.md or model assets; interrupted uploads cannot be recovered from branch state. No upload attempted in 6A. Main/live remain `9db5c0345faf7339f3d4cc24142dad362122649e`, Pages run 39104746337 verified successful. Exact next action: **6B only**, transfer `group1-shard1of24.bin` to `models/depth-anything-v2-small-tfjs-fp32-224-v1/`, commit and verify remote length/SHA256/blob ID. If transport fails, save a blocked checkpoint and stop. No application/deployment changes.

- 2026-10-18: Stage 6B (new smaller scope) completed from `d13dabeee16b56d001d8f3fa55c78ccc98edad36` on `depth-tfjs-webgl`. Split old 6B into license/preparation (6B), shard 1 upload/attachment (6C), remote byte verification (6D); all subsequent transfers are one shard each (6E–6AA), followed by separate manifest, audit, URL and load checkpoints (6AB–6AE). No partial branch assets were found to resume. Full Apache-2.0 text, exact hash-verified pinned Keras model card, authorship and modification notice committed at the model destination. Local shard 1 still matches 4,194,304 bytes, SHA256 `9fa4b753d284376f2bfd5831f583dec5c879dcdf92ddc41187732ec864c29855`, blob `465c35791bb7139749f64bd758c46971a7607477`. Evidence: `tools/depth-tfjs/evidence/package-license-checkpoint.json`. No binary upload attempted; transport remains unproven. Main remains `9db5c0345faf7339f3d4cc24142dad362122649e`; Pages run 39104746337 rechecked successful for that SHA. Exact next action: **6C only**, inspect the current branch/path and attempt one programmatic base64 upload of shard 1 through the connected integration, compare blob ID, immediately attach to a branch commit and checkpoint; stop on transport failure. Do not start 6D remote hash verification or shard 2 in that run.

## Stage 6C split — preparation checkpoint, 2026-10-18

This section supersedes earlier instructions to upload and attach shard 1 in one run.
User requested a durable checkpoint before the large binary tool call.

| Substage | State | Scope |
| --- | --- | --- |
| 6C1 | DONE | Check branch/path and local shard identity; commit preparation and stop before another binary upload. |
| 6C2 | DONE (user upload) | Inspect branch/path and recover expected blob if available; otherwise attempt one programmatic binary upload. Commit a small receipt or exact blocker to this branch, then stop. |
| 6C3 | DONE (user upload attachment) | Attach the expected blob to the model path using tree/commit/leased ref update; verify ref and tree path, size and blob ID; checkpoint and stop. |

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

Distance addition: replay displays path travelled / total (3D connected-sample
length) and straight-line distance from the first retained sample. Readouts follow
playback and scrubbing. Gaps excluded; noisy tracking can inflate length. Two
additional distance tests pass, including curved partial intervals and gap exclusion.
Browser rising-loop midpoint: 6.27 / 12.54 m path; 4.03 m displacement.
