# Long Motion Lab recordings (motion-lab-5)

Recording and replay now accept 36,000 samples, approximately one hour at 10Hz.
The rolling buffer keeps the latest samples; once full it discards the oldest.
The live counter reports discarded samples. Export before closing, resetting or
starting a new recording. The v1 JSON schema stays compatible; droppedSamples is
additional optional metadata. Earlier 3,000-sample files still load.

Recording uses a ring buffer and a cached ordered snapshot rather than shifting
36,000 references for every new sample. Full retained samples are exported.
Capture and replay share limits in motion-path.mjs: 36,000 samples, 20 MiB import,
2,000 base display edges. A progress split can add one displayed edge.

Display paths use fixed-stride visual decimation. A bucket containing a segment
boundary or >500ms gap is omitted, never joined across the gap. The displayed path
is approximate and can omit short fragments; full samples still supply pose,
velocity, exact recorded polyline distance and export. Distance prefix sums are
computed once per loaded recording, then queried with binary search. Rendering
processes only bounded display edges, batched into two canvas strokes. Initial
camera bounds scan all samples without spread-argument limits. Viewpoint controls,
pause/step/scrub, calibration/Depth/navigation and Access are unchanged.

39 Node tests PASS: full-capacity and 36,001 rejection, old-file compatibility,
JSON round-trip, ring rollover/order/reset, long curved path distance vs original
calculation, gap-safe simplification, exact partial intervals, full-recording UI
import/scrub and large camera fit, plus earlier lifecycle/gesture tests.
Evidence: tools/motion-lab/evidence/long-tests.log.
Command: node --experimental-vm-modules --test tests/motion*.test.mjs

Actual browser with 36,000 synthetic samples: current recording loaded,
3599.9-second duration shown, scrub to 3500 seconds, Play, Pause and view zoom
worked. This is desktop/browser functional evidence, not physical phone performance
or an hour-long AR tracking test. Phone heat, tracking drift, long-session reliability
and responsiveness remain unverified.

Next phone check after deployment: motion.html?v=6. Load an existing capture first,
then a larger JSON if available. Confirm playback/drag/pinch responsiveness and save
new recordings. Long sessions remain in memory only; no automatic persistence.
