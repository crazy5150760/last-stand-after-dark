# Optional Downtown visual pilot

This is a source candidate for review, not the public game. It keeps Alpha 0.86
combat, timing, controls, records, and the overhead camera. The preserved release
under `legacy/alpha-0.86` and every original media file remain byte-identical.

## What to compare

Open **Development Previews → Downtown Visual Pilot**. The pilot uses the existing
Early main-game performance fixture: twelve replenished Shambler/Runner targets,
safe player HP, no scores, and temporary settings. Pause and use **Show Current
Street / Show Pilot Street** to compare the same world while its clock is frozen.
Reset measurements after each presentation change. End Run or leave the fixture
to restore the prior settings.

The first pass adds a world-anchored asphalt/concrete layer from the already
embedded `environment-materials` atlas and a restrained warm light pool. It uses
the existing Field survivor and enemies. It does **not** yet reproduce the concept
image's detailed shop fronts or change collision geometry. Original procedural
ground stays playable if the material fails to decode or Reduced Effects is on.
Normal runs and the Crowded/Overtime fixtures never request this pilot image.

## Resource and preservation limits

The five common Field images total 29,231,176 decoded RGBA bytes. The existing
1536 × 1024 material atlas adds 6,291,456 bytes, totaling 35,522,632 bytes for
this Early-only fixture, below 44 MiB before browser/GPU overhead. The atlas is
released on exit or comparison off; a later image callback cannot revive it.
Crowded scenes are excluded because their extra actor sheets need a separate
combined-pixel review.

The standalone and hosted wrapper exceed the original 12 MiB cap by 69 and
1,855 bytes respectively, so both builders and VM HTML-size assertions use an
explicit **4 KiB code-only allowance**. They still enforce a strict upper bound;
the original embedded art/audio hashes and immutable legacy bytes are verified.
No parser, compactor, worker lifecycle, save format, or media input changed.

The branch also fixes a pre-existing wet-ripple Canvas error found in real
Chromium. Negative pre-start elapsed time could produce a negative radius and
abort rendering; the ripple phase now wraps into `[0,1)`. The immutable Alpha
0.86 copy remains unchanged. This is a separate rendering bug fix, not a pilot
feature or gameplay change.

## Android review when a private HTTPS preview is available

Version: Alpha 0.86 visual-pilot candidate. The public game link is not this
candidate; no preview URL has been assigned yet.

1. On S21 Ultra / Brave, enter the pilot in portrait and landscape. Expect the
   same overhead movement and clearly distinct survivor, Shambler, and Runner.
2. Pause and compare Current/Pilot Street. Expect no change in enemy positions,
   practice credit, clock, HP safety, or saved records. Check that loot, warnings,
   and touch controls remain readable against the textured ground.
3. Hold the joystick with one finger and Pause/Dash with another. Expect both
   controls to work as before. Turn Reduced Effects on; expect a playable simpler
   ground. End Run; expect held practice results and prior preferences on exit.
4. After artwork is ready, warm up for five active seconds, reset measurements,
   then capture at least 30 seconds each for Current and Pilot Street under the
   same orientation and conditions. Repeat when the phone is warm. Report loading,
   responsiveness, p95 frame interval, and slow intervals; these are comparisons,
   not an automatic pass threshold.

The local Windows Chromium smoke passed portrait/landscape launch, touch Pause,
offline launch, media decode, and waiting-worker updates. A disposable 412 × 915
Chromium session entered the pilot and captured its textured ground. This is a
visual sanity check, not a phone frame-rate or heat result. Physical phone
appearance/performance remains untested. Publication requires separate release
review and phone acceptance.
