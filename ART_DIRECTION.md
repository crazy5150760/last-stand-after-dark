# Last Stand: After Dark — grounded realism study

Historical Alpha 0.41 proposal, 2026-10-22. Owner: Robert Kenny. Current status: Robert chose overhead Field actors and accepted incremental survivor/enemy/boss/guide/street/prop artwork and combat cues through Alpha 0.71. Final presentation approval and measured phone performance remain open.

Robert found the Alpha 0.40 survivor looked like a walking cannon and asked for AAA-tier graphic design. The earlier geometric comic-noir sample did not meet that visual goal. This revision changes the target to detailed, grounded realism and makes a concrete asset study playable before a broad replacement.

## What this build demonstrates

- A detailed human survivor in worn teal clothing, with visible head, shoulders, hands, backpack and boots. A compact firearm is held in both hands as part of the artwork. The old rectangular gun is not drawn over it.
- Three survivor poses: ready, left step and right step. They share a consistent crop size/pivot so movement does not rescale the body every step. Rotation follows the actual gun target; no target defaults to the current gun's rightward orientation.
- Matching olive Shambler, orange Runner, purple Brute and burgundy-armored Breaker imagery. Enemy facing is corrected separately from the survivor because their source poses face the opposite image direction.
- A detailed overhead street plate: wet asphalt, cracked concrete, drains, brick/metal roofs and warm practical lighting. It repeats in 640-world-unit tiles and remains decorative.
- The board, enlarged Survivor Detail View, live survivor and supported enemy portraits use the same embedded assets. The detail view is labelled as enlarged; it is not a promise of that pixel size during combat.
- The Classic/normal gun illustration is also corrected from a 23×10 rectangle to a 12×4 barrel. This directly addresses the oversized weapon without changing any gun statistics or hit rules.

The sample remains explicit, unscored practice. Normal runs retain the existing scene/character art plus the requested compact-gun correction. No rewards, difficulty, hit radii, movement speed, damage, XP or warning timing are changed.

## Quality target and remaining work

The goal is premium realistic presentation that reads clearly on Android. This is a higher-fidelity **2D asset study**, not a finished AAA renderer or animation pipeline. Lighting/material detail is baked into the images; the game does not acquire dynamic 3D lighting, normal maps, skeletal animation or complete directional attack/death cycles by loading these assets. The survivor uses three poses rotated in 2D. Enemies currently use a single pose; the exact native warnings and attack motion remain, but the earlier procedural raised-hand pose is not represented as a new raster attack animation yet.

Future work, after owner direction review, should develop consistent movement/aim/attack animations, distinct specialist/boss assets, effects, depth/occlusion rules, environment collision readability and a measured phone asset budget. The remaining specialists and other survivors keep their existing art. Training's Riot target is retained; its final realistic asset is still pending. No automatic engine migration is implied by the quality request.

Street buildings remain traversable decorative scenery. Repeating plate seams, lighting consistency when sprites rotate and silhouette contrast at actual phone scale still need review. These are draft assets, not final production-ready animation sheets.

## Asset source and integration

Three original image-generation outputs are preserved byte-for-byte in `dist/assets/`:

| Asset | Pixels | Role |
| --- | --- | --- |
| survivor.png | 2172 × 724, RGBA | Three survivor poses with transparency |
| enemies.png | 2048 × 768, RGBA | Four common/boss enemy poses with transparency |
| street.png | 1254 × 1254, RGB | Overhead street plate |

`dist/assets/manifest.json` records SHA-256, dimensions, image-facing direction and runtime crop rectangles. The generated enemy figures do not occupy perfectly equal cells, so original opaque-body bounds are analyzed to select individual sprites. Crop rectangles are metadata; no original PNG pixels were retouched or resized. The survivor crops share a common size for stable animation.

The same files are embedded as PNG data URLs in an inert JSON block in the standalone HTML, which needs no network or separate asset folder when opened on the phone. Images decode only when entering the art review. Practice buttons wait for all images; failed loads show a message and leave Classic play accessible. One set is cached while comparing, and application references/event handlers are released on Main or a non-preview deployment. Browser reclamation and internal texture caches are implementation-dependent.

Original PNGs total about 6.2 MiB; raw RGBA pixel storage for three decoded images is about 18 MiB before browser copies, texture allocation, DOM/data strings or other game state. The standalone is about 8.6 MiB. These are storage calculations, not measured heap/GPU usage. Actual loading time, frame pacing and thermal behavior require phone tests. No unrequested resampling/compression is concealed as an optimization.

## Review and benchmark

Main → Art & Audio Sample → wait for Artwork Ready. Expand Survivor Detail View, then Walk the Street or Try the Breaker Drill. Pause compares Classic/Proposed without resetting the simulation. End/retry keeps practice isolated; normal deployment returns to the existing game. Existing sample audio sketches are retained.

Use the phone benchmark in both looks with the same drill, weapon, orientation and effects. Reset between comparisons. TXT reports now label the captured presentation so a richer scene's results are not confused with Classic.

Robert should judge: does the body dominate the gun now, is this realism direction closer to the requested quality, are the figures readable in motion, and does the street stay clear enough for attacks? Direction approval is still pending before full-game asset replacement. No numeric device report or AAA-quality certification is implied.


## Owner reference and Alpha 0.42 follow-up

Robert says the detailed study looks much better and is going in the right direction. He supplied 8792.jpg as the eventual target: angled street camera, animated figures, stronger lighting/materials and cinematic combat effects. VISUAL_TARGET.md now defines the next small animated intersection and the review/performance decisions needed before broad replacement or renderer migration. Alpha 0.42 retains these image assets and fixes quiet sound with shared Pause/Settings levels; it does not implement the new reference camera yet.


## Alpha 0.43 — original background score

Robert accepted the audio controls and requested background music. Night Watch is an original, locally synthesized 80 BPM, 16-bar D-minor loop, with low pulse, sustained harmony, restrained percussion and sparse melodic responses. Source score/synthesis is in tools/compose_music.py; the Ogg and provenance/checksum manifest are in dist/assets. No third-party samples or external music service are used.

The soundtrack plays in active normal/practice play, including the art study. Pause/choices/results/backgrounding stop it. A separate Music preference defaults to 35%, with explicit six-second Pause/Settings preview. This supplies atmosphere while preserving warning headroom. Phone listening, loop fatigue and the final production mix remain owner review points. The reference-led animated-intersection milestone is unchanged.


## Alpha 0.44 — upright intersection key poses

Added an original 1448 × 1086 transparent generated atlas, preserved byte-for-byte as dist/assets/intersection.png. Twelve isolated figures supply survivor ready/step/aim/fire, Shambler, Runner, Brute and five Breaker states. Connected opaque body bounds inform runtime crops; per-frame foot pivots stabilize ground anchors without editing pixels. Source/provenance, crop/pivot coordinates, pose names, size and SHA-256 are in intersection.json.

These elevated-camera figures stay upright in the new unscored intersection and mirror for leftward targets. Breaker windup/charge/recovery key poses follow its actual native phase. This fixes the overhead silhouette rotating on a sloped ground plane, but it remains a two-facing generated pose study. Complete directional art, consistent stride/aim transitions and attacks/deaths require further authored sets/rigging.

The first raised-building geometry and baked/decorative lighting establish camera depth and visibility, not final AAA materials/reflections/shadows. Previous PNGs are preserved. New raw atlas pixels add about 6 MiB; all four decoded image pixel buffers total about 24 MiB before browser overhead. Review on the phone and measure before widening the scene. Night Watch's design is left unchanged despite Robert's current dislike; a replacement direction is still open.


## Alpha 0.45 — eight-direction survivor locomotion

Robert identified sliding/sideways/backwards walking as his main issue. Added a dedicated original directional survivor atlas with five views (east, northeast rear, north rear, southeast front, south front), mirrored for eight directions, and four gait phases per view. Preserve the 1122 × 1402 PNG bytes and record source/crops/foot pivots/reference heights/SHA in survivor-walk.json. A prior experimental four-character walk sheet had insufficient phase differences and was not integrated.

Actual displacement now drives facing and bounded gait phase during movement. Front/rear artwork replaces the old sideways mirror for vertical travel. Firing no longer substitutes a mismatched whole-body pose; standing/blocked movement settles into a contact pose. Short two-image transitions soften changes, and Reduced Effects disables them. Boss poses use the existing original atlas, with transitions tied to real phases.

This is a four-frame generated sprite pass, not a rigged animation pipeline. Motion consistency and foot contact still need phone review. Enemy cycles, full hit/death motion and independent upper-body aiming remain unfinished; while moving, automatic shots can target a different direction from the travel-facing body. No body rotation is used to fake front/rear views. The new image adds about 6 MiB raw pixels, for roughly 30 MiB across five loaded images, before browser overhead.


### Lossless runtime format and retained size budget

The first full regression caught the standalone exceeding its existing 12 MiB budget. Retain that limit. Encode the new directional sheet and previous intersection as lossless WebP runtime copies, preserving both original PNGs. Local Pillow decoding verifies identical RGBA bytes, including transparent RGB; runtime-formats.json records source/runtime/pixel hashes. This changes encoding, not painted pixels. Other three original PNG runtime entries remain untouched. Final standalone is 11,997,093 bytes. Pixel-buffer memory is unchanged by compressed format and native browser decoding/performance remains a phone check.


## Alpha 0.46 — enemy locomotion

Robert approves the survivor for now and reports sliding enemies. Added original directional gait sheets for olive Shambler, orange Runner and purple Brute (five views × four phases, mirrored for eight directions), plus a four-phase burgundy Breaker approach walk. Preserve generated PNGs byte-for-byte. Runtime crops/foot pivots/reference heights/provenance are in each asset JSON. Brute source has one touching pair; explicit read-only cell/row bounds separate them. No source pixel painting/editing.

Distance-driven stride profiles and stable foot anchors replace static locomotion photos. Crowd phases are offset deterministically. Breaker attack keys retain existing art/native timings; its new approach still has two mirrored facings. Survivor art/controller branch remain accepted and unchanged. These are generated four-phase sprites, not a rigged locomotion or full attack/hit/death pipeline.

New enemy runtime WebPs use quality 90, retaining exact alpha; recorded visible-RGB PSNR exceeds 34 dB. Original PNGs remain included. To retain the 12 MiB standalone cap, the first three old images also receive lossless WebP runtime copies with exact decoded RGBA equality. Prior survivor directional and intersection runtime bytes remain unchanged. Nine decoded images total roughly 54 MiB raw pixels before overhead; phone frame pacing/memory must be reviewed before broader replacement.


## Alpha 0.47 — independent aiming and combat response

Robert accepted Alpha 0.46 movement and authorized the next combat-feedback group. Preserve all previous source/runtime sheets. Add one original upper-body atlas (five source views, mirrored to eight aim directions), with waist pivots/muzzle markers, over the accepted lower-body gait. Select a clear-gutter third layout; keep its generated PNG untouched. Runtime quality-94 WebP has exact alpha and visible-RGB PSNR 37.76 dB. Earlier rejected overlapping layout studies remain outside the shipped project.

Aim follows the actual automatic target and briefly locks to the volley direction. Bounded 60 ms torso blends, brief recoil and small muzzle flash accompany firing without replacing the walking legs. No target falls back to the accepted full-body walking sprite after a short hold. A waist overlap avoids a cut gap; native phone review must judge belt joins, body scale, generated view consistency and extreme opposite-direction travel. A static eight-view composition was inspected, not browser animation. This is layered sprite animation, not a rig or complete anatomical torso twist.

Hit lean and short collapse/fade transforms use existing enemy poses. Heavier silhouettes react less; no physical knockback or stun is added. Up to twelve defeat snapshots last under one second and release on expiry/reset; they carry no live enemy/image references. Actual death removal and practice credit remain immediate. Breaker anticipation/charge/recovery transforms and a brief brown dust ring follow native phases; locked attack facing cannot chase the player after telegraphing. Full directional boss art and authored death sequences remain unfinished.

All new effects are confined to the angled unscored prototype. Reduced Effects removes extra motion, flash and dust while retaining aiming and short fades. Pause uses frozen active game time. Ten decoded prototype atlases now total about 60 MiB raw RGBA before renderer/DOM overhead, with music potentially adding 16–18 MiB PCM. Offline HTML remains under 12 MiB. Repeat phone contrast, warning, frame-pacing and warm-device tests before replacing main-game presentation. Music remains unchanged at Robert's request.


## Alpha 0.48 — upgrade-only adjustment

Robert requests less predictable weapon progress. Remove reserved ranks/evolutions from later random offers while preserving all Alpha 0.47 art, aim/motion/combat feedback and source/runtime assets. No new visual or music work. Continue phone combat-art review separately; environment/material/lighting work follows that review.


## Alpha 0.49 — environment surface and dressing pass

Robert authorizes the next development part. One original 3×2 material atlas adds asphalt, concrete, brick, roof, shop glass and worn metal. Preserve the generated 1536×1024 PNG; inset each 512-cell by two pixels to avoid atlas neighbors. Quality-82 WebP is 426,138 bytes with exact alpha and 35.92 dB RGB PSNR. All earlier source/runtime art, animation and music bytes remain intact.

Map surface crops to fixed ground tiles and facade/roof planes with the shared projection. Add window/shutter/door treatments, wall fittings, rooftop ventilation, flat drains/manhole/litter/puddles and six restrained floor-light pools. Detail stays on existing facades/roofs or as ground decals; no new gameplay obstacles. Foreground details fade with their parent building. Draw all decorative ground work before native warnings and effects. Reduced Effects keeps materials and removes extra glows/highlights.

Pause compares Simple/Textured in the same frozen camera/scene, with benchmark labels. This is a diffuse-like color atlas plus decorative light, not PBR, physical reflections, dynamic shadows or finished AAA scene production. Texture repetition, roof scale, facade consistency, contrast and warm-device drawing costs need owner review. Eleven image sheets total about 66 MiB raw pixels before overhead; the offline file retains its 12 MiB cap.

Static Canvas-command illustrations with decoded runtime art were inspected in portrait and landscape. Export needed explicit eight-digit-color alpha handling; it is not browser/Android QA. Normal scored art remains intact. After the owner reviews the representative intersection, refine scene/HUD and measure performance before wider use. No art-direction acceptance, engine migration or publication is inferred from authorization to continue.


## Alpha 0.50 — illustrated title and grouped menus

Robert authorizes a polished startup/menu pass. Generate one original title illustration matching the survivor, using dark negative space on the left and a center-right survivor/night city for responsive cropping. Preserve the PNG and metadata. Runtime WebP q74 is 98,302 bytes, alpha exact and RGB PSNR 36.12 dB; standalone stays under 12 MiB. This is key art, not a promise of live gameplay fidelity.

Three primary actions use restrained cream/gold/cyan typography and native accessible buttons. Secondary destinations move into Play/Journal/Settings and a Development Previews footer. Gentle CSS fog and a faint distant light avoid video; Reduced Effects/system reduced-motion produce a static image. Focus/visibility pauses motion, and references are released off home. No background soundtrack or new sound is added.

Static portrait/landscape layout studies with decoded runtime art guide composition; they are not actual CSS/browser captures. Owner should judge crop, contrast, legibility, touch targets, animation comfort and warm-device transitions. Title pixels add 6 MiB RGBA-equivalent; browser cache collection is not guaranteed on navigation. Existing prototype art and gameplay remain unchanged.


## Alpha 0.52 — field instruments and touch controls

Extend the title's restrained dark-city identity into the optional intersection: translucent ink-blue panels, warm thin borders, muted cyan secondary data, red health and phase-aware gold/teal attack cues. Use the actual survivor's atlas crop for identity. Separate vitals, session timer and Breaker HP; show one actionable practice cue rather than the older dense training sentence. Clearly mark HP safe, XP off and unscored context.

Style the existing joystick, Dash and Pause without changing movement math, capture or cooldowns. Scoped mirrored/safe-area rules and compact portrait omission of the weapon strip/hint retain gameplay space. Keep a paused Classic/Composed comparison and actual benchmark labels. Assets, scene materials/lighting, actor animation and music remain unchanged. The new 96×96 portrait canvas reuses decoded art (36 KiB raw pixels); no new image atlas or decoded asset. Four labelled SVG-derived layout studies are composition aids, not browser/gameplay captures. Native readability and performance still require owner review before broad adoption.


## Alpha 0.53 — directional Breaker attack keys

Preserve the bald infected brute's red harness, bracers, dark trousers and boots. Generate five perspective views for brace, loaded windup, two driving charge strides and recovering crouch. Mirror eastward views to cover eight screen headings, including distinct front and rear. Keep foot anchors and a shared standing-height reference so crouching changes silhouette rather than scale. Each blend layer retains its own facing. Pose selection follows native charge-vector/phase progress; late recovery settles toward brace. Approach locomotion and collapse retain their procedural implementation.

The first generated sheet had tight gutters; a second image-generation spacing pass supplies the shipped source. Preserve both generated originals outside the checkout; the source ZIP contains the exact shipped spaced PNG, runtime WebP and crop/pivot metadata. Directional contact study inspection checks the views and boundaries; it is not a browser or animation capture. Runtime boss quality 100 retains alpha, with visible RGB PSNR 37.19 dB for alpha above 8/255; near-transparent RGB metrics are separate. Existing street source is unchanged and its quality-100 runtime (38.83 dB, alpha exact) frees download space. No other actor/title/music/material asset changes. Native device appearance and the approximately 72 MiB prototype raw image budget need owner review.


## Alpha 0.54 — whole-scene review without new assets

Use the accepted representative components together under Standard, Crowd and Evolved Effects practice setups. Keep all source/runtime/embedded art, material, animation, warning and music bytes unchanged. Add no new visual effect, canvas or decoder; heavier trials reuse native actor/weapon systems. Review silhouette/grounding, boss facing/transitions, cue/HUD contrast and control comfort with actual dense action, not isolated atlas studies.

The optional native frame report identifies actual trial, build, view/environment/HUD, orientation and measured data; it does not certify art quality or phone readiness. Prototype raw image pixels remain about 72 MiB before overhead. Owner feedback and warm-device performance inform broader presentation integration; maximum scored-horde performance and unimplemented directional locomotion/turn/death coverage remain open.


## Alpha 0.55 — field presentation in the scored game

Apply the reviewed restrained ink-blue/cream/gold/cyan instrument styling to real health/XP/level/time, threat and extraction information. Keep native boss cue text and ground warnings; Warden, Harvester and Blackout use distinct existing palette families. Use the actual survivor's colored role badge to avoid loading prototype portraits in ordinary play. Retain the existing world/camera/actor art while this interface pass is reviewed. Classic is a frozen comparison and saved preference.

Compact layouts prioritize vitals, threat and extraction; full field status and exact values remain in Pause. Shared existing touch targets keep the reviewed control look and mirrored behavior. Five labelled static layout studies illustrate scripted HUD data, not actual browser screenshots or a completed AAA renderer. No artwork, sound, image/canvas/decoder or new animation loop is added. The main art/camera migration and coverage of every procedural-world actor remain separate work after owner review.


## Alpha 0.56 — animated people in the overhead scored world

Robert chooses the accepted survivor and common-infected artwork before a camera change. Reuse directional four-phase survivor/Shambler/Runner/Brute sheets with reference-height/foot pivots and actual movement. Separate survivor gait and weapon aiming so retreating/strafe movement remains legible. Retain the overhead camera and native environment/layering; the player ring uses the selected role's actual color. This pass shares one survivor outfit across eight roles. Bosses/specialists/rush hunters retain their own current appearances pending coverage.

No new/re-encoded asset, canvas, sound or environment work. Five existing sheets are about 30 MiB raw pixels under a 32 MiB actor budget, loaded separately from the optional 72 MiB prototype. Classic pending/error fallback and paused style comparison support phone review. Six static native-command illustrations show controlled Field/Classic silhouettes at three viewport sizes; they omit DOM HUD and are not browser/animation captures. Owner should judge foot contact, scale, upper/lower seam, turns, crowded warning readability and warm-device response. Resolve these findings before remaining boss/specialist artwork and broader scenery polish.


## Alpha 0.57 — Breaker joins the scored Field cast

Preserve the accepted large bald infected brute, red harness/bracers and dark trousers/boots. Reuse its existing four-step approach profile and five-view/five-pose attack atlas in normal overhead play. Attack facing comes from the actual world-space warning vector through recovery; retain foot/standing-height anchors and each blend layer's facing. Native collision ring/name/HP remain clear with the taller silhouette. The approach's complete front/rear locomotion coverage remains open; this is finite sprites/blending, not a finished skeletal animation set.

No new/re-encoded image, sound, canvas or environment. Lazy independent boss decoding is about 12 MiB raw; base+boss about 42 MiB under a 44 MiB combined budget before overhead. Keep safe Classic boss fallback, shared actor comparison and real readiness reporting. Four labelled command illustrations cover portrait/landscape and forty directional attack keys; DOM HUD is omitted and these are not browser/animation captures. Review real-phone transitions, grounding, body/warning overlap and warm-device comfort before distinct remaining boss/specialist art.


## Alpha 0.58 — armored Warden identity

Use an original towering infected former riot commander: dark blue-gray worn segmented armor, damaged helmet/ashen face, hexagonal chest/shoulder plates and modest cyan forearm emitters. Distinguish it from the red-harness bare-chested Breaker and small golden-shield Riot Guard. Armor does not grant a new block mechanic. Four walking keys in five source views plus windup/open-palm release/recovery, mirrored for eight headings; preserve native five-lane fan and locked world aim. Retain foot/standing scale, actual movement, per-layer facing and Reduced Effects.

Original PNG preserved; alpha-exact quality-90 WebP is 448,976 bytes and 37.85 dB visible RGB PSNR above alpha 8. Alpha>16 separator analysis avoids faint gutter specks; no source pixel editing. New raw pixels 6 MiB. Exclusive optional boss cache keeps common+Warden around 36 MiB before overhead. All earlier media are unchanged. Static native-command studies guide scale/contrast but omit DOM HUD and do not prove phone motion/performance. Review silhouette, footing, cyan attack readability and transitions before remaining boss/specialist art. The finite generated keys do not constitute complete skeletal/turn/death coverage.


## Alpha 0.59 — organic Harvester identity

Complete the main trio's contrast: red-harness muscular Breaker, blue-armored ranged Warden and gray/green organic Harvester with long ivory claws, green rib sac and three back spines. Reuse the native omnidirectional pulse cue; plant the body for windup, spread arms on release and settle into recovery. Four gait keys/five views, mirrored to eight headings; actual-distance movement, fixed foot/reference scale and per-facing blends/Reduced Effects. Native ring/spokes/HP/name stay legible. Finite generated keys do not imply complete skeletal/turn/death animation.

Generation required pose-layout and spacing repair. Preserve exact shipped PNG and metadata; source has five view rows/seven pose columns. Quality-100 runtime is alpha exact, 35.39 dB visible RGB PSNR; source/runtime crop comparison inspected. Original PNG remains authoritative. To retain the download cap, optimize only legacy preview enemy runtime (quality 100, alpha exact, 39.05 dB), preserving its source and crops. All accepted Field sheets/title/audio stay unchanged. New raw pixels 6 MiB and common+Harvester about 36 MiB, exclusive with other boss images. Static studies support grounding/contrast; native phone motion/performance remain owner tests before specialist/Journal/world-art work.


## Alpha 0.60 — boss presentation review without survival wait

Development Previews gives immediate Field-art Breaker/Warden/Harvester access. Player HP is safe and player attacks default OFF so Robert can study all walking, turning and native attack/recovery phases without killing the subject. Pause switches/restarts bosses and temporarily compares Classic/Field; normal art preference is preserved. Real rank-III weapons/evolutions can be enabled for attack-interaction review. Existing native training HUD makes the developer/unscored/safe state explicit.

No artwork, animation keys, audio, camera or boss attack rules changed. All media remain byte-identical to Alpha 0.59. These solo base-HP tests support silhouette, feet, timing/alignment, warning contrast and phone-loading review; they do not replace crowded scored-run performance/balance checks. Continue specialist/Journal/world priorities after concrete owner findings.


## Alpha 0.61 — readable Riot Guard shield identity

Create an infected former police guard with gaunt face/broken visor, compact navy tactical equipment and amber shoulder stripes. A worn rectangular dark shield with a gold rim distinguishes it from the taller cyan/blue Warden boss. Five source views mirror to eight headings; four walking keys, planted bash windup, bash and clearly side-lowered recovery. Render at 60 CSS pixels standing height, with fixed per-view feet/scale. Read native facing and native shield-up state; avoid blending a raised shield into an open recovery. Native gold arc remains the real projectile-blocking boundary, with existing green/side-lowered cues and warning lane unchanged. Finite generated keys remain distinct from skeletal/full-turn/death coverage.

Preserve the exact 1024×1536 source. Encode a 480×720 Lanczos derivative as lossless WebP (338,226 bytes), RGBA exact to that resampled reference; do not claim original-resolution equality. Compact cells retain around 100 source pixels in standing height for a 60px game actor. All earlier source/runtime/title/audio assets remain exact. Raw image 1.32 MiB can coexist with common+Breaker under 44 MiB before overhead; standalone has only about 27.5 KiB headroom. A budget review precedes additional atlases.

Use immediate Riot Guard Art Drill for owner silhouette/feet/turn/shield-opening/alignment review; native solo safe training does not replace scored crowd/performance checks. Four labelled static native-command studies support scale/pose/contrast inspection but omit DOM HUD and cannot establish motion/device performance. Journal portraits and remaining specialists/world dressing remain future coherent passes.


## Alpha 0.62 — Spitter silhouette and real-shot presentation

Use a thin hunched infected civilian with pallid bald head, long arms, ragged dark-purple clothing and a swollen pink throat sac. Distinguish from navy/gold Riot, ordinary infected and all bosses. Four stalking keys/five views plus planted throat inflation, forward spit and settle; actual rear-quarter source is northwest and mirrored for northeast. Render at 52 CSS-pixel standing height, fixed feet/per-view scale, actual travel and native locked aim. Native successful shot alone notifies the weak visual cache, so release still shows after immediate projectile collision without inventing shots from cancellation/cooldown. Preserve native aim line, pink projectile/markers, damage and collision. Generated keys/blending do not imply skeletal/full-turn/death coverage.

Preserve exact final original PNG after spacing repair, with clear isolated crops and true directional metadata. Compact 480×720 lossless derivative equals its resampled reference. All twenty survivor walking frame crops are losslessly repacked without resampling or changed pixels/feet/scale; original PNG/metadata retained. Preview-only intersection quality-100 optimization is alpha exact at 40.24 dB RGB, with original/source retained. Other accepted runtime/source art, title/audio untouched. These budget changes permit both specialists and largest boss module under 44 MiB and restore standalone headroom.

Use direct Spitter Art Drill for owner motion/aim/shot/contrast review and scored crowds for balance/performance. Four labelled static native-command studies support geometry/direction/scale but omit DOM HUD and cannot prove actual phone animation/decoding/touch/frame pacing. Continue remaining specialist/Journal/world priorities after concrete findings and budget review.


## Alpha 0.63 — yellow-hooded Howler identity

Use an emaciated infected in a torn ochre/mustard hooded storm jacket, dark trousers/boots and pale sunken face; no pink throat sac, shield, gun or boss proportions. Warm hood silhouette distinguishes the support enemy from Spitter/Riot/common horde. Four walks/five source views plus planted breath intake, arms-spread rally and settle; actual northwest rear view mirrors northeast. Fixed 56px standing scale/feet, actual travel and stable howl/pulse-facing; native gold warning and paired markers remain the gameplay cues. Finite key poses/blending remain distinct from skeletal/full-turn/death coverage.

Final original retained after cell-spacing repair; a transposed directional attempt was not shipped. Compact lossless derivative equals its resampled reference. Accepted Field and packed survivor runtimes remain exact. Legacy optional preview survivor alone gets quality-100 encoding, exact alpha/42.33 dB, original preserved. New all-specialist/largest-boss combination fits 44 MiB with little raw headroom; new art requires budget work.

Immediate safe/unscored Howler drill includes three native helpers for successful rally/cancellation review. Owner checks motion, clear windup/release/settle, helper haste, label/ring contrast and phone comfort; normal scored crowds remain a separate gameplay/performance check. Static native-command studies omit DOM HUD and cannot establish actual device animation/decoding/frame pacing. Continue remaining coverage after findings and budget review.


## Alpha 0.64 — hand-throwing Lobber identity

Create a human-sized stocky infected industrial worker, faded slate-blue vest, dark trousers/boots and small rust-orange canisters. No cannon/launcher, armor or boss mass. Four walks/five views plus elbow-back canister windup, empty-hand forward release and recovery; actual northwest view mirrors northeast. Fixed 58px standing scale/feet and real travel. Body tracks current bearing during windup and latches actual native cast direction during short recoil. Native orange ground warning alone determines blast location/time; visuals add no attack. Move the old white Field chevron out of the torso to beside HP, preserve Classic/native warning geometry.

Preserve final PNG after spacing repair, 480×720 reference and compact 480×472 lossless export. Repack existing Riot/Spitter/Howler without changing any of 105 complete drawn RGBA crops or pivots/scale; original PNGs/reference coordinates retained. Reusable deterministic packing tool reproduces all four runtime sheets. Keep new art lossless instead of accepting 34.04 dB q100 candidate. Optional older street preview q96 remains alpha exact and 38.44 dB above the retained >38 threshold; other accepted art/audio unchanged. Existing decoded/download caps retained.

Owner uses immediate Lobber drill for eight-direction feet/turn, planted hand windup/throw/recovery, fixed orange warning, interruption and controls; checks old specialist appearance and normal scored overtime crowds. Static/mocked evidence supports but cannot replace Android motion/contrast/decoding/frame review. Specialist quartet complete; remaining hunter/Journal/world presentation follows findings and budget review.


## Alpha 0.65 — matching reference portraits

Bring the Field Bestiary into line with accepted live identities using ten actual front-facing runtime crops. Preserve all combat/source pixels and supply one small, lossless packed thumbnail derivative, with honest resampling provenance and reproducible export. Match notes to clothing, shield, pink throat, yellow hood, hand canister and boss silhouettes. Keep native Classic comparison and Hunter's current violet look. Portrait scale is fitted to cards, not a promise of full world-size ratios or a new animation set.

Review actual phone clarity before increasing thumbnail size. Static native-position contact sheet supports crop/fit inspection but does not establish browser layout/decoding/frame pacing. Standalone now has only 7,493 bytes below the retained 12 MiB cap: consolidate budgets before remaining Hunter/world art. Normal Field and prototype art, title/music and native warning geometry are unchanged.


## Alpha 0.66 — last enemy Field identity: Blackout Hunter

A lean, unarmored infected in a torn plum jacket, charcoal trousers/boots and pale face distinguishes the fast Blackout horde from brown-orange Runner/yellow-hooded Howler. Four actual-travel run keys/five views, mirrored to eight headings with correct northwest rear-quarter handling, fixed 46px feet/scale, restrained blends and a thin violet foot cue. No hood, shield, weapon, projectile, extra attack or aura. Original PNG preserved; small lossless runtime equals its resampled reference. These are finite generated keys, not a full skeletal/turn/death set.

Matching guide crop completes all eleven enemy references; earlier ten drawn thumbnails stay pixel-exact. All previous live art remains exact; only the optional older enemy preview encoding changes within its established alpha/>38 dB guard. Native Blackout waves, HP/speed/damage and rewards remain. Direct safe Hunter drill supports immediate owner motion/contrast review and existing private controls. Native-command illustrations inspect crops/feet/facings and real Blackout edge markers, not device motion/layout/frame pacing.

All enemy identities now have coherent Field/Classic guide coverage. Next presentation gate: consistent street/materials/props/lighting on the chosen overhead camera, coupled to actual S21 Ultra ordinary/crowded/warm performance observations and asset budget consolidation. The combined raw budget now has only 2,152 bytes before its retained cap; this is not an actual-device memory bound. Final visual approval and broader distribution remain owner decisions.


## Alpha 0.67 — first normal world-material pass

On the approved overhead camera, make ordinary ground read as worn streets: asphalt/curbs/crossings, muted road paint, low-contrast cracks/grain, puddle/drain/litter marks, route-specific paving/rails/planting/awning detail and restrained fixed warm/cool light. Rework existing decorative footprints as passable flat service pads/containers/stalls/planters/fountain surfaces without adding walls. Keep actors and native warnings above decoration.

Use deterministic vector drawing and a bounded numeric visible plan, avoiding another raster/image budget at this stage. All accepted actor/preview/title/music assets remain exact. Independent normal-run Street/Classic setting and Reduced Effects make direction/performance comparisons practical; training/prototypes stay intact. This is a surface/dressing foundation, not photorealistic textures, PBR, a complete city rebuild or AAA completion.

Owner reviews route identity, dark-scene actors/attack cues, clutter and ordinary/crowded/warm-phone cost before richer production textures/props/light. Captured VM command illustrations inspect appearance/order only, not Android performance. Keep content freeze and consolidate asset budgets for further world art.


## Alpha 0.68 — make normal Field combat read clearly

Reuse exact survivor gun-tip metadata for small actual-volley muzzle flash and upper-body recoil, preserving accepted leg motion and tracked aim. Actual damage gives fixed-foot restrained body shear and short source-colored impact rays. Defeats borrow a frame for a brief collapse/fade beneath native warnings/live actors; physical death/XP/credit remains immediate. No knockback/stun, corpse collider, extra projectile/screen shake/audio, new imagery or pixel edits.

Classic/missing art/original previews keep their prior feedback; Reduced Effects suppresses new motion/cues. Weak/bounded visual state, no RNG, guarded short optional retention and no overlapping boss sheets preserve budget/lifecycle guarantees. Four static native-command studies inspect attachment/scale/order; actual motion/readability and crowded warm-phone cost require owner. This is feedback polish, not authored full death/turn/skeletal/ragdoll coverage or AAA completion. Continue richer world/production art and measured performance after findings.

## Alpha 0.69 — existing interactive prop materials

The current normal Street world now gives orange fuel and teal shock drums matching cap/rim/band/bung treatment; wooden barriers get boards, braces, native yellow tags and HP-driven splits. Blue medical, purple XP, gold salvage and mint locker cases share bevel/corner/shadow conventions with distinct cross/chevron/diamond/door identities. Gold's diamond avoids implying medical healing. Native anchors/labels/rings/progress retain priority; no new cover/collision is implied. Classic preserves prior drawings, and Reduced drops gradients/fine wear. These are lightweight vector materials, not new baked texture atlases or final photorealistic assets. No actor/source/runtime/title/music re-encoding. Phone contrast, warning clarity and warm pacing remain the acceptance gate.

## Alpha 0.70 — readable action above visual detail

Thin native-colored windup/bomb/goal edges gain dark contrast above bodies/effects while native filled ground zones remain below. Keep the three boss and four specialist warning geometries/colors/timing intact; do not add bloom, flashes or new danger-area fills. Salvage hold and extraction borders retain their original progress. Street XP gets exact diamond outlines and one shared paint batch, removing per-gem bloom. Original imagery remains exact. Reduced keeps critical cues, Classic normal scenes retain previous drawings, and Field developer drills allow immediate review. Static command studies show composition only; real phone clutter/readability/frame pacing remains the acceptance gate. This is readability work, not completion of the realistic art target.

## Alpha 0.71 — wet street atmosphere

Street/non-Reduced puddles gain irregular curved edges, restrained water gradients and one small elliptical ripple. Five broken bands extend existing warm/cool light reflections without new light origins or radius. Faint short ground-level rain traces use one batch beneath structures/actors/warnings. Coordinate hashing and native simulation time keep the effect anchored/frozen appropriately. No imagery/encoding/audio changes, no physical water or slippery movement. Classic/Reduced restore the exact prior drawings. This is a restrained procedural material pass; final texture/prop production and actual Android motion/performance remain owner-review gates.

## Alpha 0.72 — matte route floor details

Add slotted utility covers/road paint Downtown, numbered loading marks Freight, mossy repair joints Riverside, leaf/twig litter Park and worn mats/paper Market, with sparse dark scuffs. Keep colors muted, shapes flat and nonglowing, without collectible/goal symbols or false solid cover. Coordinates/variants are deterministic; only normal Street/non-Reduced gains them. Draw under wet surfaces and all action. Existing imagery/lighting/audio remain exact. Quiet/Classic restore prior drawings; actual phone item distinction, contrast and warm pacing remain owner gates. This does not complete the AAA environment target.

## Alpha 0.73 — graphics parked by owner

Robert says current graphics will do for now but are nothing like Street Prototype. Treat the recent procedural main-world passes as temporary; do not mark the visual-quality milestone complete or continue polishing floor details as a substitute for that target. Future graphics work should show one main-game scene using the prototype's richer asset quality/atmosphere, retaining the chosen overhead camera, before expansion. Current work is performance/reliability; all art/encodings/CSS/audio remain exact.
