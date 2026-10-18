# OnePlus Depth Lab test

Open https://tmt11.com/dashboard-pwa/depth.html?v=4 in Chrome through your normal
Cloudflare Access login. Reload and confirm the diagnostics label is `depth-lab-4`.

1. Select WASM, start the camera and let a few frames complete. Copy the diagnostic
   log as the baseline, then Stop.
2. Select **TFJS WebGL**, Start, and keep the phone facing the same scene. The first
   model download is about 98 MB; use Wi-Fi. Detail is fixed at 224. Initialization
   may take time; allow the existing loading deadline to report any failure.
3. After the first depth image, allow at least three more frames. Copy diagnostics
   with backend identity, first/warm timings and memory. Confirm the depth image
   aligns with the full camera view. Note responsiveness and warmth.
4. Pause, step one frame, resume, then Stop and Start again. Rotate between portrait
   and landscape. Check camera/depth alignment and that Stop releases the camera.
5. Background Chrome and return. Camera processing should stop; restart explicitly.
   If anything fails, copy the failure log before reloading.

Send the baseline and TFJS logs, current Android/Chrome versions, and a short note
on visual alignment, responsiveness and heat. Frames stay local; no camera image
upload is needed. These instructions do not establish a successful device result.
