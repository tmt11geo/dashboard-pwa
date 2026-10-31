# Motion Lab: camera + IMU feasibility demo

## Decision (2026-10-31)

Implement an isolated `motion.html` using WebXR immersive AR. On supported Android
Chrome devices, the underlying ARCore runtime fuses camera and inertial measurements.
Our JavaScript consumes the fused six-degree-of-freedom viewer pose; it does not
implement its own visual-inertial estimator or integrate DeviceMotion acceleration.
There is no new runtime/model download and no copied third-party source.

| Candidate | What it provides | Tactical fit |
| --- | --- | --- |
| Existing Depth Anything V2 Small | Single-image relative depth | Not a pose estimator or IMU fusion system |
| WebXR over ARCore | Runtime camera/inertial tracking with local metric poses | Selected for a small browser demo; hardware/runtime dependent |
| ORB-SLAM3 | C++ visual, visual-inertial and multi-map SLAM, GPLv3 | Substantial port/integration, calibrated and synchronized inputs; not a browser drop-in |
| Depth Anything 3 | Image-based multi-view depth and camera pose estimation | Interesting reconstruction route; upstream Python/PyTorch API is not a ready-made PWA VIO runtime |

Primary sources checked:
- https://github.com/DepthAnything/Depth-Anything-V2
- https://developers.google.com/ar/develop/fundamentals
- https://developers.google.com/ar/develop/webxr
- https://developers.google.com/ar/develop/webxr/requirements
- https://github.com/immersive-web/webxr-samples
- https://immersive-web.github.io/dom-overlays/
- https://github.com/UZ-SLAMLab/ORB_SLAM3
- https://github.com/ByteDance-Seed/Depth-Anything-3

## Scope

Build `motion-lab-1`: start/stop, supported-device check, local XYZ metres,
orientation quaternion, displacement, bounded top-down trail, origin reset,
JSON download and selectable diagnostic text. Link from Experimental navigation.
Requires `local` and `dom-overlay` features; failure is explicit. Transparent
XRWebGLLayer allows the runtime's camera background behind the DOM overlay.
The app never opens a separate getUserMedia stream during AR.

The first valid non-emulated pose defines position zero. Orientation remains in
runtime local axes, Y up; no compass alignment or geographic location. Retains
3,000 samples at <=10Hz. Missing/emulated/nonfinite poses are rejected; gaps create
separate trail segments. Reference-space reset clears incompatible coordinates.
Ending retains samples for export; a successfully started new session clears them.
Permission cancellation closes late sessions. Page exit requests session termination;
XR visibility interruptions suspend recording and break the trail. No raw camera
frames, raw IMU, room mesh, depth fusion, persistent anchors or accuracy guarantee.
Data stays in memory until downloaded; no application upload calls.

Ordinary Depth, experimental scanner controllers, model, map logic, service worker,
Access and hosting are unchanged. This does not solve earlier scan registration.
Do not run Depth and AR simultaneously as a proposed fusion technique: synchronized
camera access, intrinsics, pose timestamps and coordinate conventions need a separate
feasibility stage, and WebXR does not guarantee raw camera/depth access.

## Validation

`node --check motion.js`

`node --experimental-vm-modules --test tests/motion*.test.mjs`

10 tests pass: translation/rotation, invalid/emulated/missing poses, sampling bound,
origin reset, unsupported device, permission denial/retry, session lifecycle/export,
late permission cancellation, WebGL failure cleanup, XR visibility gap.
Lifecycle tests use controlled API doubles, not physical ARCore. Evidence:
`tools/motion-lab/evidence/node-tests.log`.

Cloud browser preview inspected: page styles render, no pose is fabricated,
unsupported capability message is visible, Start/Stop/Reset/Save are disabled.
This HTTP preview is not a secure AR-capable phone and cannot validate immersive
camera passthrough, DOM overlay, sensor accuracy, phone layout or hardware performance.
No actual AR success is claimed. Preview-only index/hosting files are not committed.

## Next action / phone acceptance

Implementation checkpoint on `depth-tfjs-webgl`, based on
`5ac55c8e8ef75dc7f8423292a931a7da2d8cf093`. Main inspected at
`d40d914a9ae94e1a432e56d4df040505b1638e01`; no deployment in this change.
Review the demo before promoting to main through the existing Pages deployment.
After deployment, open `motion.html?v=1` through normal Access authentication:

1. Start in Android Chrome with Google Play Services for AR enabled. Check support
   rather than assuming the OnePlus or installed PWA supports immersive AR.
2. Start AR, grant permission, verify the camera and readable overlay appear.
3. Translate sideways approximately one metre; check XYZ/displacement change.
4. Rotate mostly in place; check orientation changes with little translation.
5. Return to start; record closure error without calling it calibrated accuracy.
6. Interrupt visibility / cover the camera and restore a textured view; ensure
   tracking loss is explicit when the runtime returns no pose. A runtime may continue
   estimating through short occlusions, so covering the camera is not a guaranteed loss.
7. Reset origin, Stop, Save trajectory, restart, exit using the browser's AR control.
8. Repeat from installed PWA if Chrome works. Supply Diagnostics and optionally saved
   trajectory on failure. Saved JSON contains motion positions and orientations.

Physical phone acceptance is pending. If unsupported, determine runtime/device
compatibility before attempting an unrelated JavaScript SLAM port.
