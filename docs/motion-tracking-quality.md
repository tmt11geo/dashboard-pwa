# Motion tracking quality checks

Implemented in motion-lab-7. This is a walking-demo heuristic, not a measured
ARCore confidence score or a drift-correction algorithm.

## Capture and replay
- Suspicious jump: more than 0.3 m and more than 10 m/s within 250 ms.
- Live capture compares consecutive valid frame poses, including frames that
  would not otherwise be saved at the selected rate. A jump starts a new
  segment and saves the boundary immediately; rare event samples can exceed
  the requested sampling rate. Invalid/emulated poses and pauses over 500 ms
  also break tracking. Repeated invalid frames count as one interruption.
- Live warnings and diagnostics report jump/gap counts; warnings persist after
  tracking resumes. Reset origin clears those counts with the recording.
- Normal Stop does not create a spurious tracking-gap event.
- Exports preserve coordinates with optional breakReason and quality metadata.
- Replay checks legacy recordings as well as new files. It creates a separate
  segmented copy, leaving source arrays and input files untouched. Positions,
  orientations and timestamps retain their validated values.
- Broken intervals are not interpolated, drawn as connecting lines, or included
  in speed/path length. Later segments keep their real recorded offsets.
  Displacement is still from the first retained sample.
- Amber rings mark up to the latest 100 suspected jumps in the replay view.
- Live counts cover the session since origin reset; replay checks the retained
  sample window. Recording starts with no prior interval to assess.

## Limits
Fast real movement can trigger this walking-specific rule. Smaller errors,
slow drift and incorrect scale can remain undetected. Excluding intervals can
underestimate real travelled distance. Lower reported path length does not mean
the trajectory is repaired. No endpoint snapping, smoothing or coordinate shifts
are applied.

## Validation
49 tests pass, including event detection on unsampled frames, gap recovery,
no double counting, JSON annotations, legacy replay, unchanged coordinates,
distance/speed exclusion and warning UI. Existing rate-test fixtures were changed
from metre-per-frame movement to ordinary walking-scale movement so those tests
continue testing sampling rather than deliberately triggering jump detection.
JS syntax checks pass. Browser QA at 390px content width with synthetic input
confirmed warning text, marker, broken path and unavailable speed across a jump.
No physical-phone acceptance is claimed.

The user-provided recording was checked locally for jump detection and unchanged
coordinates. The raw trajectory and its derived analysis remain local and are
not included in this repository.

## Starting reference investigation
WebXR anchors provide a tracked reference through anchorSpace, whose pose may
change as the runtime revises its understanding of the environment:
https://immersive-web.github.io/anchors/explainer.html
ARCore recommends keeping placed objects near an anchor and warns about
rotational effects farther than about 8 m:
https://developers.google.com/ar/develop/anchors

A follow-up experiment should request anchors as an optional feature, verify
actual device support/tracking, create a starting anchor, and log both raw local
poses and contemporaneous anchor-relative transforms. It must explicitly handle
anchor loss, reference-space resets and historical-frame consistency. Compare
repeated physical loops with the current mode before claiming an improvement.
An anchor cannot recover this uploaded route after the fact, guarantee loop
closure, or justify hiding its existing endpoint error. This change intentionally
implements quality reporting only; anchor tracking is not enabled.
