# Calibrated relief scan — depth-lab-10

Open https://tmt11.com/dashboard-pwa/depth.html?v=11 through your usual Access login.
The diagnostic build is **depth-lab-10**. No Access or PWA installation change is needed.

1. Turn the phone landscape in the same direction as during calibration.
2. Choose **Load calibration JSON** and select the original saved Tactical calibration
   file. It re-checks the images locally; wait for **Calibration ready · 0.25 px**
   (the exact error depends on the file). No upload occurs. Reloading requires import again.
3. Aim at a stationary textured object and its surroundings, with visible surfaces
   at different distances. Use even light. Avoid a blank wall, shiny/transparent
   surfaces or a repeating checkerboard as the scanning scene.
4. Press **Start scan** and hold still until the first green **VIEW ADDED — MOVE NOW**.
   The same camera, dimensions, orientation, zoom and reported manual focus must match.
5. Move the phone a small distance sideways while keeping it pointed approximately
   the same way. Follow the movement bar (roughly 3–8% image shift), stop when it
   says **Enough movement — hold still**, and wait for the next green flash.
   Start with three accepted views. Do not attempt a full orbit yet.
6. Press **Finish scan**. Drag the relief to inspect it, then **Save relief file**.
   Also press **Save scan replay**, including if views were rejected. Share that
   replay privately for diagnosis. It contains camera images, relative depth and
   decisions from the first 12 completed attempts. Do not post it in a public issue.

Expected: accepted views add points to one relief, rejected views leave it unchanged.
The camera and TFJS worker stop on Finish or when the page is hidden. Scale remains
arbitrary. Calibration is now used in projection/reprojection, with lens correction
before model inference and 640x480 RGB tracking; depth inference stays at 224.

If camera settings differ, the scan stops rather than using guessed calibration.
Do not zoom or rotate the phone during a scan. If a mismatch persists at startup,
copy diagnostics and report the named setting; do not blindly repeat calibration.
The Android focus-distance metadata in the submitted session is inconsistent with
its advertised range. The app never applies that out-of-range number; it requires
matching read-back instead. Browser metadata is not independent proof of optics.

This is a short-scan experiment. Real-phone stitching quality is the next required
observation. Synthetic pose checks and a real-model browser smoke test do not prove
physical accuracy, full six-axis coverage, loop closure, metric scale or long-scan
stability. The offline multi-view RGB tracker is available for replay diagnosis;
it is not the live browser fusion algorithm.

Build 10 checks landscape orientation before opening the camera. It requests the
calibrated size/resize mode as preferences and verifies actual settings afterward;
the calibrated camera identity is still mandatory. A successful import also clears
the old Load calibration warning. If startup is rejected, the scan guide and logs
show the rejected constraint when Android supplies it. The same JSON remains valid.
