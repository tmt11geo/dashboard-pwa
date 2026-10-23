# Phone calibration test — calibration-1

Deployment pending: implementation 2470240782714686c033364485e94040e5a236aa is
on depth-tfjs-webgl. The links below become available after approved main deployment.

1. Open https://tmt11.com/dashboard-pwa/calibration-target.html on a device connected
   to a printer. Print A4 landscape, 100% / actual size, without headers/footers.
   Keep the white border. Attach the sheet flat to a rigid board.
2. On the OnePlus, open https://tmt11.com/dashboard-pwa/calibration.html?v=1 through
   the normal Access login. Confirm the header says CALIBRATION · 1.
3. Hold the phone in landscape before Start camera. Allow the rear camera and wait
   for Ready. Bright, even light helps. Keep the whole board and border visible.
4. Follow each pose prompt, hold still and tap Capture view. Wait for the green
   saved-view confirmation, then move the board to the next position/tilt.
   Rejected duplicates do not count. Capture 16 accepted views; up to 24 allowed.
5. Tap Validate calibration, then Save session. If validation asks for better views,
   add two or more varied/sharp views and retry, or save the current session anyway.
6. Share the downloaded tactical-calibration-….json file in the conversation.
   Include whether the page reports focus locked/provisional and any usability issue.

Images stay on your device until you explicitly share the saved file. Save before
reloading or clearing. Stop/hidden pages release the camera. An interrupted session
can still be saved; clear it to start a new camera session. A numerical pass does
not yet modify the existing relief scanner. Independent checking of your actual
camera is the next required input before calibrated tracking/fusion integration.
