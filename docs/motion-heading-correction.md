# Replay heading correction

Load a recording, expand Heading correction, select a tracking gap, and press
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
