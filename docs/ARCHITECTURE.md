# Architecture and preservation baseline

## Repository inspected

Latest published source: branch alpha-0.86-health-feedback, GitHub commit
`eedabcf9ac85951671e9e0c20f0b7794ce6fc4c9`, tree
`e2c72ad1bb0adf1fefa88f7632f43bf89df99dfb`. The complete, nontruncated remote tree
contained 118 tracked files and matched the local source tree exactly. Main is
still the old imported project, not the latest game. The latest source CI run
40906145549 and Pages run 40907778173 succeeded before this task. The live Pages
branch was recorded at ac9580725c4b25bfe74c653f51b09603b1a519f5.

The owner explicitly accepted Alpha 0.85 on phone. Alpha 0.86 was published and
CI-verified; separate owner phone acceptance of 0.86 was not recorded. Do not
silently equate those two forms of evidence.

The untouched Alpha 0.86 standalone and readable script are in legacy/alpha-0.86.
source-inventory.json records all original paths, sizes, Git blob IDs and SHA256s.
preservation.json records the release hash and offline build identity. Original
Alpha 0.82 root HTML is retained unchanged. All 63 original art/metadata files are
preserved under assets with a verified path map; long historical docs are retained.

## Runtime

The game is vanilla JavaScript in one strict private closure, Canvas 2D rendering,
and DOM menus/HUD. No engine, runtime npm dependency, asset CDN, server backend,
multiplayer transport or gamepad polling was found. Implemented inputs are native
keyboard and pointer/touch. Future controller/multiplayer support remains work;
nothing is removed or claimed as already present.

The source originally occupied src/game.js (480,762 bytes). It is now 50 complete
statement-range modules plus an ordered manifest. Source concatenation retains
every original byte, shared binding, declaration hoisting and execution order.
This improves navigation/build ownership but does not yet eliminate shared state
or establish independent import/export contracts. That larger refactor would
require explicit state interfaces and additional behavioral comparisons.

Core state initializes DOM/Canvas, viewport dimensions/DPR, player/enemy/world
collections, records, preferences and journal. Existing startup binds input and
history/lifecycle handlers, sizes the canvas, applies the touch layout, opens the
menu and schedules requestAnimationFrame. The native loop caps update dt at .035,
keeps its existing active elapsed clock and freezes simulation in modal modes.
Player defaults, movement, gun targeting, Dash, collisions, damage and protection
continue through those same shared functions. No boot fetch or added game loop
changes scheduling.

Content includes eight survivors, five routes, four weapon paths and evolutions,
three bosses, four specialist enemies, horde/Hunters, contracts, upgrades, patrol,
Blackout, salvage, medical supplies, fuel/shock/barricades, lockers, convoy/drop,
rescue, the three-minute first extraction and overtime. Existing art/street/developer
training previews remain available. All tuning, offer probabilities and schedules
are original source bytes.

## Artwork and audio

The original standalone includes three JSON data blocks (sampleAssets, musicAsset,
titleAsset), 21 WebP image payloads and one OGG audio payload, plus metadata. All
22 decoded payloads matched existing repository media exactly. They now come from
assets/images and assets/audio at build time; the page template keeps the exact
JSON shape with replacement markers. The builder reconstructs the original data:
URIs, not a new external runtime loading system. Asset hashes, dimensions/crops,
lazy loading, image readiness/fallbacks, Canvas draw order and decode behavior are
unchanged. Original PNG source art, manifests and crop metadata are preserved.

CSS is independently editable in src/ui/game.css and is put back into the same
inline style location. No CSS rule or relative runtime path has changed. The Web
Audio mixer, procedural effects and OGG music decode still unlock from the same
user gestures and observe existing pause/focus/settings behavior.

## Saves and lifecycle

Browser-local keys are ls-record, ls-journal-v1, ls-preferences-v1 and
ls-restore-recovery-v1. Journal/preferences use schema version 1; JSON backup
format remains 1. Existing validation, caps, future-version read-only behavior,
verified writes, rollback and recovery copy semantics are unchanged. No owner
storage was read or modified. There is no run-continuation save or cloud account.

Saves are origin-local: moving to another host/browser does not transfer them.
A same-origin preview shares these keys. Automation uses disposable storage and
must never use an owner's actual browser profile.

Phone Back uses the existing History API guard; joystick pointer capture,
second-finger Pause/Dash, rotation, visibility/focus/freeze handling, modal choice
guards and held results retain their original behavior.

## Build, offline and deployment

Node's existing token-preserving compactor retains raw literals/tokens and required
whitespace; full normalized AST equality is checked. The new assembler and media
renderer produce an exact standalone copy of Alpha 0.86. The unchanged PWA builder
then emits 11 production files under web-dist, all paths relative to repository
scope. The eight offline payloads retain exact hashes/MIME checks. Manifest id,
start_url and scope remain ./; orientations stay available. The worker keeps the
default waiting lifecycle and does not force activation or reload open runs.

The production index, worker config and build ID 7cf8f34890269ad6 remain unchanged,
so this refactor is deliberately not a new update release. Pages remains served
from gh-pages/(root). CI now prepares the build from source; a separate guarded
manual publisher can commit generated output using normal Git in Actions after
credential setup and phone acceptance. No main/live/domain setting was changed.
