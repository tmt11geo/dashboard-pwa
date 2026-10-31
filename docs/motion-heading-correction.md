# Replay heading correction

Load a recording, expand Gap correction, select a tracking gap, and press
Use previous heading. The reference is the heading of the sample immediately
before the gap, not an average or the direction of travel.

The correction is optional and assumes the phone did not physically turn during
the gap. It cannot establish the true route, recover missing movement, or fix
position drift. It does not force the endpoint back to the start.

## Transform

Camera forward (-Z) is projected onto the horizontal plane. The wrapped yaw
difference between the last pre-gap and first post-gap quaternion determines a
rotation about world +Y. The first post-gap position stays fixed; every later
position rotates around that pivot. Orientations receive the same world rotation,
and velocity is recalculated from transformed positions. Heights, timestamps,
segments, gap offsets, connected path length and speed magnitude remain intact.

Each additional selected gap adds a suffix transform. Rebuilds always start from
original samples, avoiding accumulated edits. Headings with horizontal projection
below 0.1 are unavailable. Position-jump boundaries are excluded from the selector.

## Controls and data

Apply, Undo selected gap, and Show original / Show corrected pause playback and
refit the view while retaining the timeline position. A persistent label identifies
the preview mode. Loading another recording resets corrections. Capture and JSON
Save remain original; corrected export is not provided in this version.
Controls are disabled while camera tracking is active.

## Verification

56 automated tests pass, including heading wraparound, vertical handling,
multiple corrections, input immutability, fixed pivots, path-length preservation,
rotated velocity, gap exclusion, apply/compare/undo/load reset and busy controls.
See ../tools/motion-lab/evidence/heading-tests.log.
Synthetic browser QA verified a 90-degree gap correction, original/corrected
comparison and timeline/readout consistency with narrow content width.
Physical Android tracking and field accuracy still require user testing.

## Optional motion-based position correction

Continue previous motion uses the net displacement over contiguous history of
roughly 200 ms immediately before the gap, divided by elapsed time, as the
average velocity vector. A sample interval can extend that window. At least
100 ms of history is required; gaps longer than 1 second and velocity above
10 m/s are unavailable. Only tracking gaps are offered, not position jumps.

The predicted first post-gap position is the last pre-gap position plus velocity
times gap duration. Translate the complete suffix by predicted minus recorded
position, after any selected heading rotation. Earlier corrections rotate the
velocity into the corrected pre-gap frame. Translation includes X, Y and Z.
Heading and motion can be applied independently; Undo removes both at the chosen
gap. Rebuilds start from original samples. Missing intervals remain disconnected
and excluded from measured totals; no synthetic samples are inserted.

This assumes constant velocity during missing tracking. The app cannot infer
whether the user stopped, turned or accelerated while tracking was lost.
There is no endpoint fitting. Original capture/export stays unchanged.
60 tests pass; see ../tools/motion-lab/evidence/gap-motion-tests.log.
