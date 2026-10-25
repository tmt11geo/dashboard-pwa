# Gather, Stitch and 3D relief phone test

Open https://tmt11.com/dashboard-pwa/scan.html?v=2 (Gather in navigation).

1. Load the existing calibration JSON, rotate to its original landscape direction.
2. Start gathering. Allow camera permission and confirm reconnection only on the same calibrated phone/camera if requested.
3. Aim at a stationary textured scene. Hold still, tap Capture view, and wait for SAVED.
4. Move a small step sideways with most of the previous view visible. Hold still and capture again. Start with 3–6 views; maximum 12. No movement threshold blocks gathering.
5. Finish gathering; Save capture session before leaving. This file contains private corrected camera images and depth. Nothing is uploaded automatically.
6. Tap 2 · Stitch. Review placed/unplaced views. Unplaced images remain in the saved session.
7. Tap 3 · Build relief. Drag to rotate, save the relief file. A single placed view is not a stitched reconstruction.
8. Open capture session to retry processing without the camera or another calibration import. Clear session before switching scenes/calibration.

Capture and depth computation still take time on the phone. Stitching remains experimental pairwise RGB/depth alignment; it does not globally refine poses, recover arbitrary camera motion, or guarantee a complete object scan. Calibration camera-setting checks remain enforced. Keep the page visible while processing; Cancel retains captures. Capture sessions stay in memory until saved and may be lost on reload or OS eviction. Share the saved capture session privately for diagnosis if stitching fails.

Gather-2 widens matching for saved captures and reports adjacent-view match/rotation ambiguity. A large overlap does not itself prove a reliable 3D pose. The October 25 eight-frame phone session still produces only its anchor; see numeric replay evidence. Shift the phone sideways with approximately fixed direction for a controlled translation test; avoid moving screens and largely featureless surfaces. Existing sessions can be reopened without recapture for matcher diagnosis.
