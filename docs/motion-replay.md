# Movable viewpoint update (motion-lab-4)

Open motion.html?v=5. One-finger drag orbits, pinch zooms, two-finger drag pans.
Mouse wheel zooms; Shift-drag/right-drag pans. Focus the canvas for arrow orbit,
Shift+arrow pan, +/- zoom, R/0 reset. Buttons provide zoom and Reset view.

All geometry uses the same orbit basis, including cube face sorting. View changes
preserve source samples, playback time/rate and physical speed/distance. Zoom is
bounded 0.2–8x, pitch avoids pole singularities, pan is bounded; reset is always
available. Gestures are scoped to the canvas. Scroll outside it to move the page.
New recordings reset the camera; scrub/play do not. Pointer cancellation, lost
capture, hidden page and starting AR clear active gestures. Physical phone
multi-touch remains a manual check; controlled pinch/pan tests pass.

32 Node tests PASS; real browser drag/wheel/zoom-button/keyboard/reset verified
with a synthetic rising loop. Prior capture/replay/trajectory tests still pass.
Evidence: tools/motion-lab/evidence/orbit-tests.log. Historical fixed-view
statements below describe the previous version and are superseded here.

# Motion Lab replay (motion-lab-3)

Open motion.html?v=4. Stop AR, then choose **Use current recording**, or
**Load trajectory JSON** from Motion Lab v1/v2. Press Play; pause/scrub with the
slider, rewind, or choose 0.25/0.5/1/2x playback. No AR support or camera permission
is required for replay. Export the current capture before refreshing the page.
A page reload cannot recover an unsaved prior in-memory capture.

## Display and conventions

The cube moves along the recorded XYZ trajectory and follows the recorded WebXR viewer quaternion, in runtime
local coordinates (not compass north). Local axes show right +X, up +Y, view -Z.
This represents the XR viewer frame, not a calibrated phone-chassis coordinate frame.
A fixed isometric view and coloured faces/axes make rotation visible. Position is
shown numerically and as the complete 3D trajectory in the same view. A corner axis legend stays fixed.

The amber vector is velocity in that same local world frame. Numeric speed is
sqrt(Vx²+Vy²+Vz²), in metres/second; components are shown separately. Its visible
length grows with speed, with a minimum length for slow movement and a visual cap
at 2 m/s. Numeric speed is not capped. There is no accelerometer integration.
Velocity is the adjacent recorded position difference divided by timestamp difference
in seconds. It is a finite-difference estimate, sensitive to noise and tracking jumps;
not independently measured ground-truth speed. Playback rate never scales velocity.

Pose interpolation uses linear position interpolation and shortest-arc quaternion
SLERP. Quaternion sign equivalence is handled. Segment changes and intervals >500ms
are gaps: no pose interpolation, arrow or velocity across them. Endpoint velocity
uses a valid adjacent interval. One-sample files show orientation/position but cannot
play or estimate speed. Replay samples are copied, so subsequent live resets do not
alter a loaded replay. Starting AR pauses playback and invalidates pending file reads.
Hidden-page/page-exit pauses replay; loading/replay controls are disabled during AR.

## Input validation / scope

Only tactical-motion-1, metres, local reference-space JSON is accepted. Maximum file
size 5 MiB, 1–3000 samples. Reject non-finite or extreme positions, unordered/duplicate
or negative timestamps, invalid/descending segment IDs and invalid quaternions.
Small quaternion normalization errors are corrected. Times are rebased to the first
retained sample. A rejected file leaves the previous valid replay usable. File names
and errors render via textContent. Files stay local; no new dependency or upload.

Source: motion-replay-core.mjs and motion-replay.js. Existing capture math and JSON
export schema are unchanged. The capture controller only initializes/coordinates the
replay controls. No Depth, calibration, scan, map, Access or service-worker changes.

## Validation

`node --check motion.js` and `node --check motion-replay.js`

`node --experimental-vm-modules --test tests/motion*.test.mjs`

20 tests PASS, including the ten original capture tests. New tests cover validation,
quaternion interpolation/signs, known rotation, 1 m/s motion, stationary/single-frame,
gaps, current snapshot, JSON errors/size, play/pause/scrub/rate/end/rewind and lifecycle.
API/DOM tests use controlled doubles. Evidence: tools/motion-lab/evidence/replay-tests.log.
Browser checks with a synthetic 101-sample/10s sequence: Use current, time scrub to
5s, visible rotated cube, 0.25x playback, Pause; responsive 390px iframe layout; actual
production page starts cleanly without AR and retains Load trajectory JSON. Synthetic
fixture/preview wrapper is not shipped. It is not physical sensor evidence.

Phone next action: load an existing saved Motion Lab JSON, Play and scrub; compare
rotation and speed to remembered motion. Then record a short new sequence, Stop,
Use current recording. Report any rendering/runtime issue with diagnostics and,
optionally, the trajectory JSON. Phone hardware accuracy remains unverified.

## Combined trajectory view — 2026-10-31

The full XYZ path and cube share the same oblique world projection. The camera fit
is computed once for the complete recording, so playback and scrubbing never move
the viewport or change zoom. The cube is a constant-sized orientation glyph placed
at the interpolated metric trajectory position; its visual dimensions are not phone
size. The velocity arrow originates at the cube. Bright green marks travelled path,
dim green the remaining path, with a split precisely at the current pose. Start/end
markers identify recording bounds. Tracking gaps remain disconnected. Single-frame
and stationary data remain finite. The previous separate X/Z inset is replaced.

26 Node tests pass, including four projection/path tests for bounds, vertical motion,
stationary inputs, current-pose path split and gap exclusion. Browser rising-loop
fixture inspected at mid-replay: moving/rotating cube, bright/dim path and attached
velocity render correctly. No physical phone accuracy claim. Evidence:
tools/motion-lab/evidence/trajectory-tests.log. Reproduce with the existing motion
suite command. JSON schema, capture, speed calculation and navigation are unchanged.

Distance addition: replay displays path travelled / total (3D connected-sample
length) and straight-line distance from the first retained sample. Readouts follow
playback and scrubbing. Gaps excluded; noisy tracking can inflate length. Two
additional distance tests pass, including curved partial intervals and gap exclusion.
Browser rising-loop midpoint: 6.27 / 12.54 m path; 4.03 m displacement.
