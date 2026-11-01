# Ripple Lab

Entry: `ripple.html`, linked from **Experimental → Ripple Lab · image water**.
Build: ripple-lab-1. Based on main `9150ee7121edde6327e5f704a73208b642bcf23d`.

Load a local image or use the built-in demo, then tap/drag the image. Multiple
pointers create overlapping waves. Viewing angle ranges from overhead (0°) to
oblique (70°); Rotate image changes the in-plane orientation. Ripple strength
applies to new touches. Gentle rain adds occasional drops. Calm water removes
waves and stops rain. Pause freezes waves and ignores touches until Resume.
Full screen returns to the same page/image; a CSS fallback is available when the
Fullscreen API is unavailable. Space on the focused canvas adds a centre ripple.

The image is a texture on a 96×96 subdivided plane. A WebGL vertex shader sums
up to 24 decaying radial wave packets, displaces the mesh and computes analytic
surface gradients. The fragment shader uses these gradients for image distortion
and lighting. This is a visual water effect, not a fluid solver or image-to-3D
reconstruction. Wave packets fade rather than reflect at the image boundaries.

Touch rays are transformed back from the perspective camera to the undeformed
image plane. Displacement is small; touch locations intentionally use that base
plane rather than an iterative intersection with the animated waves. Camera
fitting and ray casting share the same rotation/projection math. Aspect ratio is
preserved without cropping, and texture resolution is capped at 2048 px (or the
GPU limit). Pixel ratio is capped at 1.5 for mobile fill-rate. No framework, CDN,
model downloads, camera permissions, image uploads, or persistence are used.

Rendering stops when hidden or on pagehide, resuming on visibility/pageshow.
WebGL context loss produces a reload instruction. Undecodable images leave the
previous image intact; stale image decode completions cannot replace newer ones.
Files above 40 MB are rejected. The app's Access/network-only service worker and
other experiments are unchanged.

## Validation

`node --experimental-vm-modules --test tests/*.test.mjs`

164 tests pass, including the 3 new ripple tests. Projection/ray round-trips and
camera fitting cover portrait/landscape viewports, wide/portrait image planes,
0/45/70° tilt and rotations between -180° and 180°. Outside hits are rejected.
`node --check ripple.js` and `git diff --check` pass.

Physical Android GPU performance, heat and visual acceptance require a device
check. On the phone, load a portrait photograph, touch all four quadrants, change
angles, use two fingers, rotate the phone, enter/leave full screen, pause/resume,
and load a second image. Confirm the image stays correctly oriented and returns
intact after full screen. Reload clears the selected image.

Browser smoke checks PASS in headless Chromium with SwiftShader, at 412×915
and 1280×800: shader compilation/rendering, touch-induced pixel change, frozen
pause, calm restoration, view controls, portrait image upload, invalid-file
recovery, full-screen return, no mobile horizontal overflow, rain stop and resize.
Phone/portrait/desktop screenshots inspected. SwiftShader does not establish
physical phone GPU performance. Reproduce with `node tools/ripple-lab/browser-smoke.cjs`
with Playwright installed; optionally set `RIPPLE_BROWSER_PATH`.
