# Last Stand: After Dark — reference-led graphics target

Owner reference: **8792.jpg**, supplied by Robert Kenny on 2026-10-22. Robert says Alpha 0.41 looks considerably better and is moving in the right direction, but wants to work toward the supplied scene. The reference is a target for presentation, not evidence of a running frame rate or an instruction to change the game's rules.

## What makes the reference work

| Reference feature | Development requirement |
| --- | --- |
| Angled view with visible building sides and character bodies | A consistent camera/projection, ground anchors, depth ordering and foreground occlusion rules |
| Characters aiming and moving in distinct poses | Directional walk/aim/attack/hit/death animation, consistent scale and readable silhouettes |
| Wet street, cool shop lights and warm fire | Coherent materials, reflections/highlights, shadow treatment and bounded local lighting effects |
| Large boss, red attack zone, bright weapon flashes | Boss animation tied to real attack states, clear ground telegraphs and budgeted combat effects |
| Street clutter, shop fronts and props | A hand-authored intersection with understandable walkable ground/solid cover and foreground fading |
| Compact cinematic HUD and thumb controls | Our existing health/XP/boss/objective information and Last Stand identity, adapted to both phone orientations |

The screenshot's exact assets, boss name, HUD text and composition are not our product specification. Retain Last Stand: After Dark, current enemies/goals, the three-minute extraction loop, accepted controls and rules. Use the reference to guide depth, atmosphere, material quality and readable action.

## Next graphics deliverable: one animated intersection

Build a small unscored presentation prototype before a full replacement:

1. Establish an angled camera and a real ground plane/coordinate mapping. Test joystick direction, gun aim and attack-zone alignment. Keep the current game available for comparison.
2. Place one survivor, a small ordinary crowd and the existing Breaker in one intersection. Implement consistent directional locomotion/aim and one real boss windup/attack/recovery sequence.
3. Add a shop frontage, a few props and one foreground obstruction. Prove ground anchors, depth sorting, collision readability and player visibility behind scenery.
4. Layer restrained cool/warm lighting, wet-surface detail, muzzle flashes, hit feedback and one explosion effect. Preserve the distinction between decoration and damage warnings.
5. Compose the HUD and touch controls around actual play, with portrait and landscape checks. The reference is landscape; our previous portrait phone use remains a requirement unless Robert chooses otherwise.
6. Measure the result on the S21 Ultra in browser with a repeatable crowd/effect scene. Choose a supported asset/effect budget from measurements. A static scene or VM test does not establish the supported frame rate.

This prototype should answer whether our current renderer can deliver a convincing 2.5D approach or whether a different rendering pipeline is justified. Do not migrate the full game or commit to an engine from this screenshot alone. Present a concrete comparison, performance evidence and a migration scope before that major decision.

## What Codex handles

Game/rendering prototypes, scene and asset integration, input/projection mapping, animation systems, effect budgets, HUD, browser/Android checks, local packaging and regression protection. Generated visual assets can establish direction and provide some textures/sprites. Consistent production animation requires authored directional sets or suitable rigged models; more isolated still images do not complete that work.

## What Robert's help is needed for

The reference already provides useful direction; no coding or asset creation is needed from Robert to begin. At review points, judge the camera angle, character scale/readability, darkness/contrast, effects intensity and portrait/landscape feel on the phone. Test frame pacing and controls and identify which parts feel closest to the target. Major camera, presentation and rendering/distribution decisions stay with the owner after a reviewable prototype.

If later work needs an external asset pack, rigged model or specialist animation work, define the concrete deliverable and scope first. No purchases, contractor contact, account service or publishing is part of the current task.

## Alpha 0.44 — first intersection prototype

Robert accepted the audio functionality and requested the next development part; he does not yet like the music and wants to leave it alone. The soundtrack remains unchanged. Main → STREET PROTOTYPE → Enter Intersection opens the first unscored graphics prototype while ordinary Play and previous art drills remain available.

Implemented: a shared dimetric camera/ground projection and inverse mapping; screen-relative joystick/keyboard/Dash; foot-anchored upright sprites; original generated survivor and Breaker key poses selected from native attack states; an actual crowd and real Breaker with safe practice HP; authored solid buildings with sides/roofs/windows/signs; ground-depth sorting; foreground fading; decorative ground texture/markings/lighting; actual weapon, warning and fuel-blast effects on the same ground; paused Overhead/Angled comparison; and a labelled phone benchmark context.

This answers the first geometry/input/state-integration questions. It uses two mirrored facings and generated key poses rather than full directional locomotion or skeletal animation. The buildings establish volume and solidity but still need convincing production facades/materials and prop dressing. Lighting is baked/decorative, with no dynamic shadows, physically based reflections or complete weather system. It is not the completed reference scene or proof of a phone frame-rate budget.

Review next: camera readability and portrait/landscape movement feel, character scale/grounding, foreground visibility, boss attack clarity and measured S21 Ultra performance. After that feedback, develop complete directional movement/aim/attack/hit/death animation and richer consistent environment materials, then repeat device measurements. A broad replacement or engine migration remains a reviewable major decision. No purchases, outside contact or publishing are included.


## Alpha 0.45 — review movement facing first

Robert reports the camera prototype works for now but flags sideways/backwards sliding. The next focused build adds front/rear/diagonal survivor artwork and maps eight screen travel directions to it. Gait follows measured distance, stops when blocked, and no longer alternates walking with an aiming pose. Pose blending is bounded/frozen while paused; Breaker transitions use native state timing.

Review the survivor in all eight directions and both orientations, at partial/full joystick deflection, against a wall and during firing/Dash. Keep the camera/depth scene available; do not broadly replace the scored game's presentation yet. Generated four-frame motion remains a prototype. Next animation work includes enemy cycles, upper/lower-body aiming integration and complete hits/deaths; environment materials and phone measurements remain on the graphics roadmap.


## Alpha 0.46 — crowd movement review

Robert says the survivor looks pretty good and everything else works, while enemies slide with little animation. Preserve the survivor and extend distance-driven locomotion to the ordinary crowd in eight directions, with distinct shuffle/run/heavy-walk cadences. Give Breaker approach a walk while retaining its established warnings/charge/recovery.

Review foot contact, direction changes around buildings, matching speed/cadence, same-type crowd variety, stationary stopping and warm-phone performance. Keep normal scored play unchanged. Once movement is accepted, continue hit/death/attack/upper-body animation and environment/material/lighting polish. The boss's full directional attacks and complete production animation remain unfinished.


## Alpha 0.47 — combat-response review

Movement was accepted in Alpha 0.46. Add a separately aimed survivor upper body while retaining the accepted walking legs, brief recoil/muzzle response, short hit lean and bounded collapse/fade visuals, plus Breaker anticipation/charge/recovery feedback driven by native phases. Keep damage timing, warnings, collisions and immediate kill credit intact. These are layered generated sprites and procedural transforms; full authored directional attacks/deaths remain unfinished.

Review target-facing while moving away/across, torso/leg joins, hit/defeat weight, warning visibility and both phone orientations. Compare warm-phone performance with Alpha 0.46; the added atlas brings prototype raw image pixels to about 60 MiB before overhead. After combat review, proceed to cohesive facade materials, street dressing and wet-street lighting, then reassess the whole intersection before wider use.


## Alpha 0.48 — upgrade-only adjustment

Robert requests less predictable weapon progress. Remove reserved ranks/evolutions from later random offers while preserving all Alpha 0.47 art, aim/motion/combat feedback and source/runtime assets. No new visual or music work. Continue phone combat-art review separately; environment/material/lighting work follows that review.


## Alpha 0.49 — material and lighting review

Build the next environment layer in the same optional intersection: shared realistic asphalt/concrete/brick/roof/glass/metal surfaces, facade detail, rooftop units, flat street decals and restrained warm/cool wet-light suggestions. Preserve world footprints, warnings, actor animation and random upgrade rules. Add a paused same-camera Simple/Textured comparison and identify the style in benchmark captures.

Review portrait/landscape contrast, material repetition, surface grounding, foreground fade, unobstructed native attack lanes and S21 Ultra warm-phone responsiveness. This is an initial materials/dressing pass; full prop variety, authored attack/death art, physical lighting/reflections and final HUD composition remain ahead. The extra atlas adds 6 MiB raw pixels, totaling about 66 MiB prototype images before overhead. Keep the main game available and review the representative scene before any broad replacement.


## Alpha 0.50 — first impression before broader scene work

Robert asks to prioritize the crowded startup menus and explicitly approves an illustrated title with subtle motion. Create a focused home with Play/Journal/Settings and grouped retained features. Title illustration should match the established survivor/night-city direction, remain readable in portrait/landscape and offer static motion preferences. Real initialization/loading only; never force a fake loading interval.

Review menu clarity, responsive image crop and motion/device comfort before continuing the representative scene/HUD pass. Static artwork is not a gameplay screenshot or proof of AAA rendering. Existing camera, combat, material prototype and random upgrades stay intact. No engine/distribution change is implied.


## Alpha 0.52 — review interface composition in the representative scene

Robert authorizes the in-game HUD/touch pass after title/navigation work. Compose the optional intersection with readable actual vitals, practice timer/target count, separate boss HP/phase and one short cue. Add coherent joystick/Dash/Pause styling and an actual-art survivor portrait. Preserve safe/unscored practice semantics and show XP disabled rather than inventing progression.

Review Composed versus Classic from Pause, in portrait/landscape and mirrored controls. The prototype retains its camera/environment comparisons, native warnings, controls and combat. Compact portrait drops the extra hint/weapon strip to leave more action space. Static layout studies use illustrative placement rather than native browser CSS or game-camera captures. Owner approval and phone responsiveness remain the next acceptance checks before discussing wider main-game integration.


## Alpha 0.53 — directional attack/transition review

Robert approves finishing the representative Breaker attack presentation. Add real front/rear/profile/diagonal views for brace, loaded windup, alternating charge strides and recovery. Tie facing to the native warning lane through recovery, retain the accepted approach walk, and blend key poses with stable foot/height references. This remains finite generated sprites plus procedural blending, not skeletal or fully authored turning/death animation.

Review all headings, approach-to-windup, stride changes, wall stops, recovery-to-walk, defeat credit, warnings and warm-phone responsiveness in both orientations. Native timing and damage remain intact. A source-preserving runtime compression of the street fits the new atlas beneath the existing standalone limit; decoded prototype art grows to about 72 MiB before overhead. After this owner review, evaluate the composed scene and discuss main-game integration rather than assuming prototype approval establishes full coverage or native performance.


## Alpha 0.54 — representative scene review before integration

Combine the current art/animation/HUD with fixed Standard, Crowd and four-evolution Effects trial setups in the optional intersection. This makes crowd/effect readability and controls reviewable with existing native combat. Add optional real frame measurement and a held report shortcut; no new art/audio, graphics pipeline, automatic quality choice or fake performance rating. Trial and measuring choices are session-only and safe/unscored.

Review both phone orientations and warm-device behavior, record concrete hitches/overlaps, and compare one presentation switch at a time. After owner feedback, resolve observed problems and decide how to bring the reviewed presentation into ordinary play. This build is the whole-scene acceptance step, not approval of broad scored-game renderer/camera changes or proof of full-horde performance.


## Alpha 0.55 — normal-run interface acceptance

Move the field HUD/controls into the ordinary scored game using actual progression, native encounter labels and extraction state. Provide a live primary goal, relevant/selected optional hint, true contract/medal progress and complete frozen Pause status. Preserve current combat and main world rendering. Use a survivor-role badge with zero practice-art decoding; keep Classic in Pause/Settings for same-scene comparison.

Review both orientations, damage/healing/XP, all reachable bosses, three-minute extraction/Stay, optional goals, control/marker clearance, second-finger Pause/Dash, phone Back and held results. Mocked checks and SVG layout studies support this pass but do not certify Android CSS or performance. After feedback, resolve interface issues and discuss the main-game camera/art integration scope rather than assuming all prototype rendering is already ready for the full scored world.


## Alpha 0.56 — owner-approved overhead actor pass

Keep the overhead camera. Move the accepted survivor walk/aim and three common-infected directional sheets into normal gameplay, retaining distance-driven motion, per-view foot/scale anchors, independent strafe aim and Reduced Effects. Preserve native mechanics, world geometry, controls and original boss/specialist identities. Give the owner an independent saved Classic/Field actor comparison in existing Pause/Settings groups, with safe loading/error fallback and truthful held report context.

Acceptance is real-phone movement/turn/idle/strafe quality, readable common-enemy silhouettes and warnings, player visibility, responsive crowded play and held results. Existing role colors/badges distinguish a shared outfit; this does not claim eight bespoke costumes or final AAA graphics. Six static command studies and mocked checks guide the pass but do not establish native performance. After review, fix actor issues and cover remaining boss/specialist artwork; retain the chosen overhead camera.


## Alpha 0.57 — first boss in the approved overhead presentation

Bring the reviewed Breaker into normal Field play using native phase time and locked world charge direction. Preserve approach steps, brace/load/charge/recovery keys, fixed anchors/scale, independent blend-layer facing and Reduced Effects. Keep camera, hit geometry, warning lane, AI, timing and rewards exact. Lazy two-sheet readiness/failure stays separate from common actors; no new menu option, media or gameplay system is added.

Acceptance: readable first-boss size/grounding and attack orientation, smooth transitions, responsive two-finger controls and truthful immediate defeat/extraction/held results. Profile approach walking remains limited; other bosses/specialists keep their distinct current art pending coverage. Static studies and mocked tests do not establish native animation or performance quality. Resolve owner findings, then continue Warden/Harvester/specialist coverage while keeping the overhead camera.


## Alpha 0.58 — second-boss Field integration

Give Warden distinct blue-gray armor/cyan gauntlets with five source views and four walking/three attack keys. Keep the overhead camera, native five-lane volley/aimAngle/visibility/timing/damage and original collision hexagon. Add no shield mechanic, new content or setting. Use exclusive lazy boss decoding with native fallback and actual report readiness; preserve older artwork/audio and save/control behavior.

Acceptance: owner reaches Warden after Breaker (Stay if extraction opens first), reads its distinct silhouette/lanes, sees feet stop at range, correct windup/release/recovery facing and comfortable phone performance. Check paused Classic/Field, Reduced Effects, two-finger controls, held results and Retry. Static studies/mocked checks support this pass; native phone review remains essential. Download headroom is about 119 KiB, so plan the budget before Harvester/specialist atlases. Retain the approved overhead view and leave music alone.


## Alpha 0.59 — main boss trio presentation gate

Give Harvester an organic green/chitin/claw identity, with four-step approach and planted pulse windup/release/recovery. Preserve approved overhead camera and native circle center, radius, time, damage, controls and rewards. Use exclusive lazy boss decoding, native fallback and truthful readiness through the existing actor choice. Preserve original artwork sources; measured alpha-exact preview-only runtime optimization fits the new atlas below 12 MiB.

Owner reviews the third boss (Stay after earlier exits), natural feet/turn/stop, clear safe circle, grounded transitions, two-finger controls, held results and warm-phone response. All three main bosses now have Field art; specialist/Journal/world dressing remain. Static studies and source metrics support the pass without replacing native phone review. Keep the content freeze, camera and soundtrack, and review budgets before more atlases.


## Alpha 0.60 — direct boss review gate

Main → Development Previews → Test Breaker/Warden/Harvester opens a nearby native boss with Field artwork, safe HP and player attacks OFF. Pause provides Next, Restart, boss/loadout/evolution controls, attacks ON, temporary Classic/Field and held phone report. No survival wait, normal record changes or media changes. Test mode uses the native training HUD with an explicit developer/unscored/safe label.

Owner can now review all three main silhouettes, grounding, walk/stop/turn, attack facing and warning/pose alignment in portrait/landscape. Report actual browser/touch/loading/warm-device issues. Native AI, base HP and combat rules stay real; solo safe practice does not represent late-run difficulty. Keep current content, overhead view and soundtrack while resolving findings before additional specialist art/world dressing.


## Alpha 0.61 — Riot Guard presentation gate

Continue specialist coverage with a smaller navy-armored infected police guard and gold-rimmed shield. Preserve native frontal blocking arc, flank/recovery openings, bash distance/timing, slow facing, damage and rewards. Directional body animation reads actual shield-facing, uses real travel and changes immediately to lowered recovery. No camera, music, balance or save-schema change.

Owner shortcut: Main → Development Previews → Riot Guard Art Drill. Safe HP, unscored, attacks OFF/private Field; Pause enables weapons, target/restart, temporary style and held report. Normal 300 HP specialist-training target; original three boss shortcuts/cycle retained. Review portrait/landscape feet/size/contrast, eight directions, readable bash and opening, native gun/Railstorm blocking, controls/results/loading and warm-phone comfort; also check ordinary scored guard coexistence.

Preserve original art; compact lossless derivative keeps current decoded/download caps, with only 28,143 standalone bytes remaining. Other media remain exact. Static/mocked checks support this pass without replacing owner phone animation/touch/performance review. Review budgets before remaining specialist/Journal/world coverage.


## Alpha 0.62 — Spitter presentation gate

Add a distinct hunched/pink-throat Spitter with real-distance walking, native locked aim and shot-notified release/recovery. Keep exact warning/shot/cover/interception/damage/schedule/reward rules, overhead view, music and records. Immediate Main → Development Previews → Spitter Art Drill uses safe/unscored 300 HP target, private Field/attacks OFF and existing Pause controls/held results; Riot/boss shortcuts remain.

Owner checks front/rear/eight directions, feet/stop, planted one-second aim, shot/pose alignment even near cover, no duplicate attacks, small-art contrast, paused comparisons/reports/results and native Android loading/touch/scroll/warm performance. Check familiar survivor walking after lossless frame packing and optional preview background quality after measured compression. Every survivor drawn crop remains exact; originals stay retained. Compact Spitter derivative plus both specialists/largest boss fit retained budgets. Static/mocked checks support but do not replace phone motion/performance review. Remaining specialists/Journal/world art follows findings and budget review.


## Alpha 0.63 — Howler presentation gate

Add a human-sized yellow-hooded infected with grounded walking and planted, steady-facing howl/rally/recovery. Native support rules, timing, radius/count/haste, cancellation, rings and rewards stay exact; no AI hooks or extra buffs. Main → Development Previews → Howler Art Drill supplies safe HP, private Field/attacks OFF, three native helpers and existing Pause/held-result/report controls. Earlier targets/Next behavior remain.

Owner checks eight directions, feet/stop, native rally/pose alignment, successful helper haste versus cancelled windup, portrait/landscape contrast, two-finger/Back/background controls, results/records and Android warm comfort. Current normal Field art and all originals remain exact; compact Howler and measured preview-only survivor encoding preserve existing caps. Static/mocked evidence supports but does not replace phone review. Next Lobber/hunter/Journal/world priorities require another budget review and resolution of findings.


## Alpha 0.64 — Lobber presentation gate

Add blue-vest infected hand-thrower with grounded directional gait and native-placement windup/release/recovery. Preserve full native throw/ground warning/blast/damage/visibility/overtime/cancel/reward rules; no extra projectile or homing. Decorative Field chevron sits beside HP; Classic and hit geometry retained. Main → Development Previews → Lobber Art Drill provides safe HP/private Field/attacks OFF and shared Pause/results/report controls. Previous targets/Next behavior stay intact.

Owner reviews all views, feet/stop/throw clarity, marker placement, fixed 1.4-second warning/escape, interruption versus already-placed bomb, phone controls/held records and warm response. Earlier specialist crops are pixel-identical after lossless packing; all originals retained. New art lossless, optional street preview retains alpha and >38 dB floor. Packing tool/metrics preserve reproducibility and caps. Static studies omit DOM HUD and cannot prove actual Android animation/performance. Next hunter/Journal/world presentation priorities follow findings and budget review.


## Alpha 0.65 — Journal visual consistency

Field Bestiary portraits now use small front crops from all ten accepted detailed enemy bodies, rather than the old shapes. Temporary Field/Classic comparison does not change gameplay preferences; Hunter remains native violet pending remaining coverage. Correct appearance notes and the three-boss filter label make the guide consistent with live play. One compact lossless derivative and isolated loader avoid decoding every animation sheet while browsing. No prior artwork/encoding changes.

The source/runtime caps remain in place, with only 7,493 standalone bytes left. Budget consolidation precedes another art sheet. Continue actual Android clarity, crowd readability and warm-phone measurements toward first-release polish; this reference pass is not an engine/camera migration or AAA completion claim.


## Alpha 0.66 — Blackout Hunter coverage and next presentation gate

Replace the remaining native-only Hunter body with grounded plum-jacket run art and matching guide portrait, preserving native wave/combat rules. Actual-distance gait, eight headings, stable feet, bounded blends and a violet ground identifier keep fast movement readable. Safe direct drill permits immediate review. Previous live Field/common/boss/specialist/hero and prototype art stay unchanged; an older optional preview alone receives measured q95 encoding above its retained floor.

Enemy identity coverage is complete; it does not close full animation/world polish or native phone performance. Continue coherent street surfaces, props and restrained lighting on the approved overhead camera, keeping warnings readable and controls responsive. Asset consolidation and measured S21 Ultra performance gate further art expansion; no camera/engine migration, new content family or AAA-completion claim.


## Alpha 0.67 — world surfaces under accepted Field actors

Normal runs gain a first procedural street/material pass: Downtown road/crossing composition, Freight rail/corrugated detail, Riverside paving, Park paths/planting/fountain and Market lane/awning detail. Ground weathering, drains/puddles and restrained fixed light are decorative and remain below native warnings/actors. No camera, collision, balance, music or existing raster asset changes.

A separate Street/Classic preference and Reduced Effects support actual phone comparisons. No new decoded image budget; numeric planning is bounded. This first vector dressing does not meet the entire reference by itself. Richer production texture/prop/lighting work, asset consolidation and measured native-phone frame pacing remain next gates, guided by owner feedback rather than assumed from VM tests.


## Alpha 0.68 — normal combat feedback on current assets

Add correctly anchored tiny gun flash/recoil, restrained actual-hit leaning/rays and quick defeat collapse/fade, preserving native warning priority, immediate credit and current actor feet/aim/camera. Keep images/world/CSS/audio exact, bounded read-only visual state and no extra raster/decode; optional boss/specialist cache holding is limited to the short fade. Quiet/Classic comparisons remain practical through existing controls.

Owner assesses real phone motion/contrast/clutter and warm-frame pacing. Borrowed pose fading is not a full death/turn art pipeline. World/production material/prop quality, asset consolidation, actual device measurements and first-release review remain ahead within the content freeze.

## Alpha 0.69 — coherent existing field objects

Carry accepted Street surface/actor treatment into the seven native interactive object bodies with material shading, wood/metal detail, consistent ground shadows and distinct familiar role colors/symbols. Keep warnings, collection/progress and walkability truthful. Reuse existing Street/Classic and Reduced controls, with normal-play-only gating; no engine/camera/content/balance change. No new images/cache state, all previous assets exact. This is a coherence pass; final prop production, richer environment assets and measured Android pacing remain open. Owner checks actual small-scale recognition and crowded warning readability before further detail.

## Alpha 0.70 — foreground combat information

Keep detailed bodies and accepted Street props, but preserve actionable native warning edges above them. Dark under-strokes follow the original attack/goal geometry and time rather than inventing new zones; ground fills stay native. Batch outlined mint XP diamonds for contrast on bright surfaces and fewer paint/glow operations. No image/encoding/cache/gameplay/camera changes. Compare real-phone Street/Classic/Reduced and safe Field drill views for excessive line clutter, missing warnings and crowded/warm comfort. Production environment art and measured device performance remain open; mock/static results do not prove those gates.

## Alpha 0.71 — restrained wet-ground motion

Support the reference's wet night atmosphere with irregular water shading, flat rain ripples, broken existing-light reflections and subtle ground rain traces, while retaining the accepted overhead camera and warning priority. Native-time/world anchoring and existing Reduced/Classic controls support pause and comfort comparisons. No new raster assets, cache state, sounds or gameplay. Static command studies establish composition only; actual Android motion/clutter/warm pacing and final production texture quality remain open.

## Alpha 0.72 — route-specific floor wear

Use sparse matte utility/loading/repair/leaf/paper detail to distinguish the five existing routes while retaining accepted wet atmosphere and actionable foreground cues. Preserve map geometry, passability and truth about interactions; painted SLOW words do not change speed. Existing Street/Reduced/Classic controls support comparison. No new raster asset/cache/gameplay/audio. Static detail studies are labelled enlarged; actual Android recognition, warning clarity and crowded/warm performance remain open acceptance checks.

## Alpha 0.73 — preserve the prototype quality target

Owner explicitly identifies the gap between current main-game scenery and Street Prototype. Leave current art in place while testing performance/reliability. A later focused scene rebuild must demonstrate richer production assets/depth/atmosphere in the actual overhead main game, with a side-by-side owner review and Android performance check. The new pressure fixtures use current imagery unchanged and do not claim prototype fidelity or AAA completion.
