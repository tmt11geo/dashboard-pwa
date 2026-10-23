# Guided persistent relief — agreed design
Date: 2026-10-23. Checkpoint branch: depth-tfjs-webgl.
Reviewed feature head: 838eebbcb36b2f7eccc2d991fddd065516d8a52a.
Reviewed main: e599a76ad2a48e97650545f64980abf4756de3e8.
Status: design recorded; reconstruction and guidance not implemented.

## User goal
Accumulate newly observed surfaces into one approximate 3D scene while moving the
phone. Retain surfaces outside the current view; finish scanning, rotate/inspect
the result, and save/reopen locally. The user approved guided slow movement with
a move a little → hold → capture → move again flow. No metric accuracy promise.

## Guidance contract
Use text and icons as well as colour; keep controls available during processing.
- Initial: “Hold still—capturing first view.”
- Ready for another view: “Move slightly sideways; keep part of the last view visible.”
- Excess motion: “Slow down.”
- Stable candidate: “Hold still—capturing depth.”
- Alignment in progress: “Checking alignment.”
- Accepted: “View added.” Increment accepted-view count only after successful fusion.
- Insufficient texture: “Aim at a surface with more detail.”
- Lost alignment: “Return towards the last accepted view.” Freeze map additions.
- Paused/finished: retain the scene; Finish releases camera/model resources.
Start scan, Pause/Resume, Finish, Clear and Save/Open are the intended controls.
Clear must be explicit; normal stop/background must not discard an accepted map.

Signals must derive from image motion, feature coverage, robust alignment residuals
and overlap. Pixel-change magnitude alone is not camera pose or tracking confidence.
Do not label a frame “added” merely because inference finished.
Show an indeterminate capture indicator initially; estimated progress must not imply
a measured completion percentage. First inference can take longer than later frames.
Hold guidance helps capture stability; inference processes a frozen frame and does
not require the camera to remain stationary for every computation.

## Findings from current source
depth.js displayResult assigns points=makeRelief(...) each time and start clears it.
depth-tfjs-worker.js normalizes cropped depth before posting it. This discards
per-frame scale/range information needed to investigate consistent reconstruction.
depth-core.js makeRelief uses an assumed 55-degree horizontal field of view and an
arbitrary inverse-depth mapping. Its output cannot simply be concatenated across frames.
schedule measures time since dispatch, leaving essentially no idle time when the
requested interval is shorter than inference. The phone log demonstrates this.
No AGENTS.md found in either current recursive tree.

## Bounded implementation stages
| Stage | Scope | Acceptance |
| --- | --- | --- |
| R0 | Agreed flow, source audit and phone evidence | This document and stage10-phone-summary.json committed. Complete. |
| R1 | Capture data and guided scheduler | Preserve raw inverse depth alongside display-normalized output; attach frozen image, crop, orientation and capture timestamp to each candidate. One in-flight inference; deliberate post-result idle period; bounded buffers. Tests for raw-data preservation, cancellation/stale results and scheduling. No fusion claim. |
| R2 | Alignment feasibility | Evaluate a concrete visual pose method and camera intrinsics approach on overlapping image pairs; estimate relative-depth scale/offset consistently and reject degeneracy. Verify known synthetic transforms plus real stationary-scene pairs; pure rotation, low texture and moving objects must not create false map updates. Stop with evidence if accuracy is insufficient. |
| R3 | Bounded map fusion | Transform accepted observations into a common frame, downsample and fuse with confidence/visibility handling; retain old geometry and reject poor alignment. Cap memory and keyframes. Validate revisits, occlusion and drift. |
| R4 | Integrated scan guidance | Connect measured quality to the text/icon states above, keep UI responsive, implement pause/finish/clear and local versioned save/open with limits and validation. Test recovery and storage failure. |
| R5 | Deployment and OnePlus acceptance | Existing Pages/Access workflow; verify exact deployment. Test slow scans, return to prior view, portrait/landscape, interrupted capture, save/open, heat and responsiveness. |

Pose and scale recovery are feasibility gates, not solved by this design.
Device orientation can supplement rotation if available, but does not provide
reliable camera translation. Do not integrate accelerometer readings into an
unverified position estimate. Choose and validate dependencies during R2.
Use arbitrary scene units until calibration supports stronger claims.
Keep camera images local and preserve existing single-frame and ONNX modes.

## Next action
R1 only if continuing this approved feature: read latest main and checkpoint,
implement/test candidate capture data and a guided scheduling foundation on a
feature branch, then checkpoint. Keep R2–R5 explicitly incomplete.
Stage 10 of the existing TFJS project remains partial: supplied phone logs confirm
hardware WebGL startup and repeated inference, but WASM comparison, stop/restart,
background return, prolonged heat and alignment observations remain missing.
