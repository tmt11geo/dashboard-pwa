# Automatic gap correction and JSON export

Eligible tracking gaps are corrected automatically when a current recording or
JSON is loaded, and when Save trajectory is used. Live capture remains raw.

## Heading and position

Heading uses the final retained pose immediately before the gap as reference.
The wrapped yaw difference rotates all subsequent positions and orientations
about world +Y, initially pivoting around the first post-gap position.
A nearly vertical camera (horizontal forward projection below 0.1) has no usable
heading. Position-jump boundaries are excluded.

Position prediction uses net displacement over roughly 200 ms of contiguous
pre-gap history divided by elapsed time. At least 100 ms is required; gaps must
be <=1 second and average speed <=10 m/s. Sample spacing can extend the history
window. Expected position is last pre-gap position plus velocity times gap
duration. The entire subsequent trajectory is translated to that predicted point.
Prior rotations transform velocity into the corrected pre-gap coordinate frame.

These corrections assume unchanged phone heading and constant velocity during
the gap. They do not recover measurements, remove gradual drift or force closure.
Missing intervals stay disconnected and excluded from path length and speed.

## Replay and saving

Gap correction retains individual heading/motion controls, Undo selected gap and
Show original / Show corrected. Undo removes both newly applied transforms at the
selected gap. Rebuilds start from originals; multiple corrections compose.
Save trajectory exports the automatic correction of the live recording buffer.
Save replay JSON exports the displayed replay, respecting Undo and comparison.
The replay keeps its own source snapshot, independent of subsequent recordings.

Exports contain gapCorrections version 1 with processed=true and applied sample
indices. Loading a processed file preserves its choices rather than auto-applying
corrections again. Already-applied transforms are locked; they cannot be undone
without the original data. Saving the original comparison exports no new
corrections and preserves that choice on reload. Previously supplied reference
files with pre-gap-heading-yaw-v1 or pre-gap-heading-and-velocity-v1 markers are
recognized too. Corrected export does not embed a second raw sample array.
The original format tactical-motion-1 and timestamps remain compatible.

## Validation

66 automated tests pass. Evidence: ../tools/motion-lab/evidence/automatic-gap-tests.log.
Tests cover angle wrapping, unavailable headings, average velocity, multiple
transforms, gap exclusion, path preservation, source immutability, lifecycle,
Save trajectory, replay Save, Undo/comparison, export/reload and legacy markers.
Physical Android acceptance and browser rendering of the new Save button remain
pending. No user recordings or user-specific trajectory analysis are in the repo.
