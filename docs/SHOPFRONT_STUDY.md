# Optional Downtown Shopfront Study

This is an unpublished source candidate. Open **Development Previews → Downtown
Shopfront Study**. It is a separate overhead Early fixture; the earlier Downtown
Visual Pilot and Street Prototype remain available.

The study uses all four `STREET_BLOCKS` rectangles at their exact coordinates as
solid player and infected collision. Both Plain and Dressed keep those boundaries.
The Dressed view uses existing Field survivor, Shambler, and Runner sheets plus
the already embedded environment atlas for asphalt, roofs, brick, metal, and
window panels. The detailed shop edge, warm window glow, wet-looking panels, and
small decorative fire are clipped to the solid shop footprint. The camera remains
overhead. If the atlas fails to decode or Reduced Effects is selected, the solid
plain blocks remain visible and playable. This is a study of one edge, not a
complete street art replacement.

The fixture keeps twelve replenished targets, safe HP, practice-only results,
and temporary preferences. Pause and use **Show Plain Street / Show Dressed
Street**. The comparison keeps the same positions, clock, and collision. Reset
measurements after art is ready and after each presentation change. End Run to
restore prior preferences. Normal runs and other preview fixtures do not request
the atlas through this study path.

The five common Field sheets and environment atlas total 35,522,632 decoded RGBA
bytes, below 44 MiB before browser/GPU overhead. No original media, immutable
legacy, save format, worker lifecycle, or public site is changed. The standalone
HTML is **12,588,145 bytes** and the hosted HTML is **12,589,931 bytes**, each
below the strict **12 MiB + 16 KiB** code-only allowance (12,599,296 bytes).
Generated output is rebuilt for local tests and remains untracked.

## Android review

Version: Alpha 0.86 Downtown Shopfront Study candidate. There is no public or
private HTTPS preview link for this candidate yet; the public game link is the
previous release. The owner reported the earlier Downtown Visual Pilot looked
and played fine on S21 Ultra / Brave. This new shopfront study is untested on a
phone.

1. Enter the study in portrait and landscape. Expect the overhead camera, a
   detailed shop edge near the lower-right of the starting view, and twelve
   Shambler/Runner targets.
2. Move and Dash into each shop edge. Expect the survivor to stop at its solid
   boundary; infected should also stay out. The dark facade must not look like
   an open escape route.
3. Pause and compare Plain/Dressed. Expect unchanged positions, clock, practice
   credit, safe HP, and saved records. Check touch Pause/Dash with the joystick
   held, and ensure warnings and actors remain readable.
4. Turn Reduced Effects on. Expect a simpler, solid and playable street. End Run
   and expect prior preferences to return. Compare frame timing only after art
   readiness, five active warm-up seconds, and a measurement reset in each view.

Native VM tests cover entry, exact geometry, collision, replenishment, art count,
failure/late callbacks, comparison, exit state, and unchanged ordinary Early
layout. The browser test enters and compares the study in mobile portrait and
landscape. These checks are not a measured Android FPS, heat, or battery result.
