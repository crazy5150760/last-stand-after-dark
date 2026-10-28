# Last Stand: After Dark — first-release plan

Owner and lead tester: Robert Kenny. Development/design lead: Codex.
Updated: 2026-10-28. Current build: **Alpha 0.82 · Phone Settings Cleanup**, developed locally. Robert asks to start the next step after delivery of Alpha 0.81; no new device benchmark or detailed Alpha 0.81 playtest is inferred. Finish the current phone-menu usability group: organize Settings, bring its existing Back action near the heading and retain open sections/scroll while changing an option. No gameplay, tuning, artwork, music, save schema or Site identity change. Private installation remains parked after Robert confirmed no workspace network approval prompt appears; do not repeat that upload command.

## Product goal

A readable, responsive survival game for Android and browsers. A new player can move, use Dash, build a weapon and work toward the first extraction. Experienced players can combine builds and risk optional overtime. The main run has a three-minute extraction goal after a boss defeat and once active encounters are clear; extraction remains a player choice.

The first release succeeds through combat feel, clear choices and replayability. All current starting loadouts remain available. Records, medals and practice do not grant permanent combat power or raise a new run's difficulty.

## Scope baseline and content freeze

Keep the existing working content while validating its purpose:

- Eight survivors, five routes, four weapon paths with four evolutions, existing support upgrades, three bosses and four specialist enemies.
- Movement, automatic gunfire, Dash, XP/upgrade choices, fuel, wood, shock drums, decoys, one field locker, medical supplies, Blackout, salvage, convoy/drop/rescue/patrol goals, extraction and overtime.
- Optional contracts and challenge rules; training; pause/map/guides/settings; local records, pace charts, saved-run review, presets and backup.

Pause additions of enemies, routes, survivors, weapon families, reward currencies and progression systems while the following milestones are completed. Improve or consolidate existing systems when playtests identify confusion, redundancy or unfairness. Bring substantial removals, progression changes and major presentation/distribution decisions to Robert before applying them.

No engine migration, multiplayer, monetization, accounts, cloud saves or external service is part of this first-release effort. Installation and distribution decisions remain a later milestone. Continue local downloadable builds under the existing Site identity.

## Milestone 1 — clear first run

Completed in Alpha 0.37, First Release Foundation. Robert confirmed all checks worked on his phone.

- Replace the accumulated main-menu feature announcements with a clear Play action, short objective and grouped references.
- Put the deployment action and full selected setup near the top. Keep survivor/route choices and optional rules/contracts/presets available in native expandable sections.
- Offer an explicit recommended setup: Survivor, Downtown, Standard, no contract. It does not start a run or delete records/presets.
- Provide a short optional guide for movement, automatic fire, XP choices, the first boss and extraction. It does not add a tutorial gate, stop combat automatically or change rewards.
- Make the selected rules/contract visible even when their controls are collapsed.

Acceptance: Robert can find Play/Deploy without navigating a wall of announcements, knows the three-minute goal, can distinguish the recommended setup from his saved choices, and can reach every retained feature. Touch scrolling, fresh choices, pause/backgrounding and held results still behave correctly. Actual phone layout and understanding require owner testing.

## Milestone 2 — combat and build progression

Alpha 0.38, Build Progression, was accepted by Robert. Add bounded, read-only progression measurements to Pause inspection, finished results, saved review and TXT reports. Compare native baseline runs before changing XP or combat tuning. First-upgrade and weapon-rank times describe chosen upgrades; XP recovery and XP/bonus choice counts make actual phone runs easier to assess. No tuning changes in this build.

Continue assessing these balance goals alongside phone tests; functional acceptance alone does not establish every new-player balance claim:

- Compare several fresh Standard runs using Survivor/Downtown before judging optional profiles or perks.
- Review first-upgrade timing, XP recovery, weapon rank/evolution availability by extraction, and useful choices across all four paths.
- Preserve the gradual crowd ramp and readable enemy warnings. Check boss/Blackout/optional-goal overlap and crowded salvage.
- Review whether survivors, routes, supports and optional objectives create useful choices. Resolve the most confusing or redundant cases before expanding content.
- Use saved pace charts, reports and Robert's notes together; kills and HP lost are outcome data, not spawn counts or a substitute for player testing.

Acceptance: early difficulty builds steadily; builds have room to develop; optional systems are helpful without becoming required; all four paths and basic survivors have a practical route to extraction. Overtime stays interesting and fair. A few successful scripted runs do not establish these balance claims.

## Milestone 3 — phone reliability and performance

Alpha 0.39, Phone Performance, was reported working by Robert. No numeric device benchmark reports were attached; supported FPS/thermal limits remain open. Add opt-in, bounded raw-frame timing and observed object counts, with held local TXT captures and a repeatable S21 Ultra benchmark. Exclude modal/background gaps and leave combat tuning intact. Skip drawing offscreen XP gems while preserving their positions/values and recovery. XP objects and collection scans remain uncapped; use phone measurements to decide further work. Continue phone validation as art is introduced.

- Measure real S21 Ultra sessions in the browser, including portrait/landscape, busy overtime, background/resume and thermal load during a longer session.
- Check frame pacing and memory/effect growth, warning readability, simultaneous joystick/actions and native save/report downloads.
- Establish a repeatable device benchmark with build, browser, orientation, approximate run time/build and observed hitches. Add diagnostics only where they answer a concrete performance question.
- Keep browser-local records understandable across file/browser contexts, with safe backup/restore and legacy-save behavior.

Acceptance: reliable controls and saves, bounded runtime state, no game-breaking transition, and a comfortable measured phone frame rate in ordinary and crowded play. Aim for 60 fps in ordinary play; record actual stress results before setting a final supported performance floor. Current VM checks do not measure real device frame pacing.

## Milestone 4 — agreed art and audio direction

Historical prototype milestone: Alpha 0.46 added eight-direction, four-phase Shambler/Runner/Brute locomotion and a four-phase Breaker approach walk to the optional intersection. Enemy gait follows actual displacement, stops when blocked/stunned, uses stable foot pivots and staggered crowd phases, and preserves native AI/combat/attack warnings. The survivor's accepted assets and locomotion are unchanged and protected by an Alpha 0.45 trajectory fingerprint. Full hit/death motion, complete boss attack facings, independent moving upper-body aim and environment/material/lighting polish remain on the roadmap. Keep the standalone under 12 MiB and measure the increased prototype image budget on the phone.

Alpha 0.40 proposed an explicit unscored ART & AUDIO SAMPLE with a proposed weathered comic-noir survivor, three ordinary enemies, Breaker body/warning pose and decorative street. Shared board/live drawing, Classic/Proposed Pause comparison and bounded synthesized cues make the proposal reviewable. Normal scored runs retain their accepted presentation. Robert found the simple look insufficient, reported an oversized cannon-like weapon and requested AAA-tier graphic design. Current work: Alpha 0.41, a grounded-realism asset study with detailed survivor/enemy PNGs, an overhead street plate, proportionate held weapon and direct comparison. Normal/Classic gun illustration is also reduced. This is not a complete AAA rendering/animation pipeline. ART_DIRECTION.md records the revised proposal, asset budget and remaining work; broad replacement still requires Robert's direction review.

- Prepare a small representative visual sample: one survivor, ordinary enemies, Breaker warning, one street scene and key HUD/menu elements.
- Robert reviews the direction before a broad replacement of artwork.
- Apply a consistent dark-city identity, readable silhouettes, animation, effects and audio across the retained content.
- Preserve enemy tells, hit rules and accessible warning clarity while replacing placeholders and reducing visual clutter.

Acceptance: consistent presentation that remains readable on the phone during dense play, portraits match live enemies, and animation/effects communicate attacks and hits. Assets must be suitable for distribution. Robert has chosen the overhead camera and accepted the incremental Field actor/guide builds through Alpha 0.65. Final visual quality and measured device performance still need review; mechanical acceptance alone does not close those gates.

## Milestone 5 — release candidate and distribution

- Resolve the remaining owner bugs and repeat the agreed Android/browser regression matrix.
- Finalize onboarding, defaults, navigation, settings, save compatibility and release notes.
- Decide cosmetic/achievement progression with Robert; do not use permanent power to compensate for an unfair baseline.
- Recommend an installable web version first. Review offline/install/update behavior and existing Site/source synchronization before choosing native Android packaging.
- Agree release format and audience, then complete the corresponding publishing/distribution work within the owner's instructions.

Acceptance: the full first-run-to-extraction loop and overtime are consistently enjoyable; key device checks pass; known issues and supported environments are documented; backups and update behavior are proven. A local alpha is not a published release candidate.

## Working agreement

Each focused build includes a standalone HTML, full source ZIP, a short owner checklist and the full PLAYTEST.md. Automated checks, actual device observations and unresolved limits are reported separately. Future batches are measured against these milestones. Routine implementation stays with the developer; Robert guides playtest priorities and major product/art/progression/distribution decisions. Default cadence: 3–5 related improvements per normal build; one major change at a time for combat, controls, saving or performance; larger low-risk batches for explicitly requested overnight work. Keep each batch tied to a release milestone and one clear phone checklist.


## Alpha 0.47 — combat feedback review

Keep the accepted intersection locomotion and add separately aimed upper-body views, actual-shot recoil/muzzle feedback, brief non-stunning hit reactions, bounded transient collapse/fade visuals and Breaker anticipation/charge/recovery motion. Read native phase/time and resolve all damage/removal/credit immediately; presentation never delays gameplay. Keep normal scored presentation and music intact.

Acceptance: Robert can aim across travel without the walking pose alternating or reversing; belt join and gun direction remain convincing at phone scale; hit reactions and defeats communicate impact without suggesting extra stun or hiding warnings. Breaker still follows its locked warning lane and familiar timing. Pause/backgrounding freeze all visual time; reduced effects, respawns, reset/retry and records remain correct. Ten prototype images total about 60 MiB raw pixels before overhead; obtain warm-phone measurements before broad integration.

Next after combat feedback review: improve coherent building facades/materials, street props and restrained warm/cool wet-street lighting within the same small prototype. Then review camera, combat readability and S21 Ultra performance together before deciding on wider presentation changes. Generated layered aiming and procedural collapse remain provisional; full directional boss attacks and authored death sets are still production work. No engine migration or full-game art replacement is implied.


## Alpha 0.48 — random upgrade draws

Remove the guaranteed owned-rank/ready-evolution slot from later choices and refreshes. Keep four opening paths; later offers draw three unique eligible cards uniformly, with caps/availability/banish exclusions. Rerolls prioritize unseen cards and never consume a charge when no different offer exists. Ready evolutions remain eligible rather than guaranteed. Favored Path remains display-only. No pity timer, hidden persistent odds, XP curve or combat tuning change.

Acceptance: picking Lightning does not make it appear on every later screen; genuine repeats/gaps are allowed. Other weapons and support choices stay useful. Three-minute Standard runs should feel rewarding rather than starved of useful options; ask Robert to judge rarity across several runs. Frozen-pool sampling now gives the expected approximately 15.8% inclusion for each card in a 19-card pool. Native twelve-run probes still all reached 180 seconds; primary rank-three/evolution attainment falls substantially as expected. These small scripted observations are not player balance evidence. Revisit frequency from owner feedback before adding further progression rules.


## Alpha 0.49 — night street materials

Add one shared original six-material atlas, projected wall/ground surfaces, shop glass/shutters/doors/signage, wall fittings, rooftop units, fixed ground decals and restrained warm/cool floor lights. Keep the original four solid blocks, depth/fade rules and native combat/controls/random upgrades. The paused Simple/Textured toggle compares scenery in the same camera without resetting the scene. Label benchmark captures and reset measurements between styles.

Acceptance: surfaces feel more grounded, actor silhouettes and native warning lanes remain clear, facade/roof details share projection and foreground fade, roads retain their existing movement/collision behavior, and the phone stays responsive in both orientations. Eleven images are about 66 MiB raw pixels before overhead; use real warm-phone measurements before wider integration. The first materials pass uses color textures and decorative light, not physical wet reflections/dynamic shadows.

Next review: Robert judges contrast/detail/footing and supplies an S21 Ultra Simple/Textured performance comparison if possible. Resolve observed visual/performance issues, then compose the prototype HUD/touch presentation and refine the representative scene before a broader art replacement. Full directional boss/death art and coherent production prop/lighting work remain unfinished. Any full-game camera/renderer migration remains a separate owner decision.


## Alpha 0.50 — title and startup navigation

Replace the accumulated home options with Play, Journal and Settings, plus a quiet Development Previews footer. Play retains deployment first and groups practice/help; Journal groups references/medal goals and filters; Settings houses out-of-run backups. Guides return to their originating Journal/results context; indirect finished-results Settings→Backup also stays frozen. Preserve every existing feature rather than burying unavailable controls in the root DOM.

Use original survivor/night-city title art, CSS mist/distant-light motion and static Reduced Effects/system-motion fallback. Startup status covers real initialization only; art loads independently with no fake progress or forced delay. Leave gameplay available on art failure, guard late callbacks, release title references outside home and skip old Canvas drawing behind home. Keep music unchanged.

Acceptance: Robert can find the three primary actions immediately, reach every retained tool through its parent, preserve setup/history/held results and read/tap menus in both phone orientations. Review the artwork crop and whether quiet motion is welcome. Title raw pixels are 6 MiB; browser caching plus prototype art can overlap, so measure device startup/transition behavior rather than assuming instant collection. After review, address observed menu issues and return to the representative scene/HUD/readability/performance milestone before broad art integration.

## Alpha 0.51 — phone Back navigation

Owner reports Android Back exits the page instead of navigating game menus. Connect same-URL browser history to existing screen Back actions, retaining setup, filters and held results. Active play opens Pause; repeated Back stays paused until explicit Resume. Upgrade/extraction choices remain deliberate. Back cancels a reviewed restore rather than confirming replacement. Main title remains a normal browser exit point.

Keep one bounded history guard, release it at home, handle asynchronous on-screen Back cleanup and fresh navigation, preserve unrelated history fields, and tolerate unavailable or denied History APIs. Do not serialize run state or replay old screens through Forward/reload. All art, music, combat and accounting retain Alpha 0.50 behavior. Acceptance requires owner testing of the actual Samsung/Android button and gesture in the downloaded-file browser.

## Alpha 0.52 — representative scene HUD and touch composition

Compose the Street Prototype status around real survivor/boss health, practice time/targets, one native-phase action cue and active practice weapon. Use the existing survivor artwork for a small portrait; explicitly label safe HP and inactive XP. Scope the visual replacement to this unscored scene. Reuse joystick/Dash/Pause actions and preserve Back behavior. Provide a paused Classic/Composed comparison, mirrored/safe-area/compact layouts and benchmark context.

Acceptance: Robert finds health, boss state and Pause quickly, reads native ground warnings, moves/Dashes/pauses with two fingers and prefers the composed HUD in both phone orientations. Review warm-phone responsiveness before broader integration. Static layout illustrations and mocked tests do not establish native CSS layout or device performance. No new content, currencies, music, engine migration or full-game rendering change. After this review, resolve observed readability/performance issues and assess the representative scene as a whole before an owner decision on broader presentation integration.

## Alpha 0.53 — directional Breaker attack review

Replace the prototype's three mirrored attack images with five view columns and five pose rows, mirrored to eight screen directions. Read the native locked charge vector through warning, charge and recovery; retain the accepted approach walk. Add a brace/load progression, two charge strides, late-recovery blend and per-layer facing/foot anchors. Keep gameplay timing, warnings, damage, collisions and credit immediate. Preserve Reduced Effects, Pause/Back, reset and data isolation.

Use a clean original transparent atlas with preserved source, decode-gated entry and a quality-100 runtime copy. Re-encode the existing street runtime at quality 100 to retain the 12 MiB download cap; preserve its source PNG and verify alpha, hashes, quality and native outcomes. Prototype decoded images now total about 72 MiB before overhead. Acceptance requires Robert's directional/transition/scale/readability review and native phone responsiveness, not only VM checks or image metrics. After feedback, assess the scene as a whole, resolve observed issues and discuss broader presentation integration. Full directional locomotion/turn/death sets and native performance limits remain open.

## Alpha 0.54 — representative-scene review gate

Provide Standard (existing six infected), Crowd (24 slots) and Evolved Effects (24 slots/all four evolved paths) in the existing unscored prototype. Preserve native AI/stats, boss timing/warnings, collision and all art/audio. Fixed starting positions/builds and explicit restart make comparisons useful without adding scored progression/content. Entry offers an optional session-only frame-measure checkbox. Add direct held phone report capture from Pause with truthful trial/build/style/measurement context and Back directly to Pause; existing Settings reports retain Settings return.

Acceptance: owner assesses camera, actor/boss motion, scenery, HUD/warnings, controls and warm-phone response together in both orientations. Compare one style at a time with reset measurements; gather notes/report if practical. These are representative 24-target trials, not the scored game's maximum horde or a device performance guarantee. Keep normal runs unchanged. After this review, resolve concrete issues and make the owner-guided main-game integration decision; do not add another open-ended sequence of prototype systems or assume a full camera/engine migration is approved.


## Alpha 0.55 — first normal-run presentation integration

Bring the accepted field HUD and touch styling into real scored play, with actual health/XP/level/time/eliminations, three-boss status, native warnings and extraction/overtime. Prioritize the primary extraction goal, one selected/relevant optional hint and compact contract/medal progress; retain complete native status in Pause. Use the actual survivor's role badge without loading practice art. Reuse existing control targets/handlers and retain second-finger/Back behavior. Compact/mirrored marker placement avoids the new control docks. Provide a frozen Classic comparison in Pause and validated persistent Run HUD settings.

Acceptance: Robert can read real progression, immediate threats and the exit goal while fighting, find optional status, move/Dash/pause comfortably and switch styles without advancing the scene. Check both phone orientations, held results and fresh retries. Native game logic/balance, upgrade odds, original records and media remain unchanged. This integrates interface presentation only; it does not apply the prototype camera or actor/environment renderer to the scored world.

After feedback, fix concrete HUD/control issues, then agree the scope of main-game art/camera integration. The remaining work includes mapping accepted visual assets onto the full procedural world, all enemy/boss silhouettes and locomotion, warning/effect contrast, dense-horde performance and scalable device settings. Discuss the camera/rendering approach with Robert before applying a broad migration. Continue the content freeze; avoid another sequence of unrelated features.


## Alpha 0.56 — approved overhead actor-art integration

Reuse existing survivor walk/aim and common infected directional sheets in normal runs. Keep actual distance-driven gaits, eight headings, separate movement/aim, native role colors and Reduced Effects. Preserve the overhead camera, native world/input/collision/warnings/combat/accounting and existing player-visible layering. Move only the animated Brute health bar above its taller silhouette. Bosses/specialists/rush hunters remain distinct with existing art until their coverage pass. One shared survivor outfit is the current baseline, not eight new costumes.

Load the five sheets only for Field normal deployment, with atomic readiness, Classic pending/error fallback, guarded callbacks and release on finish/new run/style change/Main. Keep this actor budget under 32 MiB raw pixels and the standalone under 12 MiB; the optional prototype's larger cache remains separate. Add an independent saved Actor Art choice in existing Settings/Pause grouping and capture the real style/readiness in held phone reports.

Acceptance: Robert prefers Field animation/scale/readability in both orientations and can strafe/retreat without the earlier sliding/cannon impression. Check stopped/stunned enemies, busy crowds, startup decode hitches, controls, warnings, held results and training isolation. After feedback, resolve concrete actor issues, then plan the remaining boss/specialist art coverage before broad world dressing. Retain the approved overhead camera unless Robert later chooses otherwise. Keep the content freeze and leave music alone.


## Alpha 0.57 — first scored-boss art coverage

Reuse the accepted Breaker walk/combat atlases in normal Field runs. Read native world-space charge direction through warning/charge/recovery and phase time for brace/load/two charge strides/recovery. Retain fixed per-column standing scale/foot pivots, previous-layer facing, bounded blends, Reduced Effects and native collision ring. Raise boss name/HP above its taller body. The accepted four-step profile walk remains limited in front/rear coverage; do not claim a complete directional walking set.

Lazy-load the two existing sheets during Breaker warning/presence, separately from the five common actors. Keep independent atomic readiness/Classic fallback, guarded callbacks and defeat/cancel/style/end/Main/new-run release. The boss module remains under 12 MiB raw pixels; common+boss remain under 44 MiB before overhead; standalone stays under 12 MiB. No new image asset, setting, sound, content or engine change.

Acceptance: Robert reviews first-boss scale/grounding, approach/attack transitions, eight attack headings aligned with the true warning lane, responsive phone play and immediate defeat/reward/extraction behavior. After concrete fixes, continue distinct Warden/Harvester and specialist art coverage with budget/readability checks. Keep the chosen overhead camera, current balance/content freeze and music. Broader world dressing remains after actor/boss coverage.


## Alpha 0.58 — distinct Warden coverage

Create one original transparent armored infected Warden sheet with five views and four gait/three attack keys. Keep actual-distance motion, fixed foot/reference scale, native locked aimAngle, phase-driven attack/reset, per-layer facing and Reduced Effects. Preserve original five-shot volley/visibility/tuning/warnings and native collision hexagon. Use existing Actor Art selection; no new setting or combat system.

Lazy single-sheet module is exclusive with Breaker imagery and independent of common actors, with native fallback, protected callbacks and complete lifecycle release. New raw image pixels are 6 MiB; common+Warden about 36 MiB beneath the retained 44 MiB maximum. Preserve older media/source and the new original PNG, record alpha-exact quality-90 runtime metrics, and keep the 12 MiB standalone cap. Only about 119 KiB download headroom remains; review asset encoding/bundling budgets before the next new atlas.

Acceptance: Robert reaches the second boss, judges distinct silhouette/contrast, walking/stopping, windup/five-lane facing/recovery, paused comparison and warm-phone comfort. After concrete fixes, continue distinct Harvester/specialist coverage with budget/readability checks. Retain the chosen overhead camera, content freeze, balance, startup grouping and soundtrack.


## Alpha 0.59 — complete main-boss Field coverage

Create organic Harvester artwork with three ivory back spines, hooked claws and green ribs. Four walking keys plus planted windup/arm-spread pulse/recovery in five views, mirrored to eight headings. Keep actual movement, fixed feet/scale, steady pulse-facing, bounded blends and Reduced Effects. Native circle center/radius/timing/damage, contact, rewards and camera remain exact; no new attack or setting.

Retain one lazy optional boss module at a time, independent common art and safe native fallback, completed-handler cleanup/generation guards and complete lifecycle release. New raw image pixels are 6 MiB, common+Harvester about 36 MiB under the retained maximum 44 MiB. Preserve the shipped original PNG and existing sources. Quality-100 alpha-exact Harvester runtime fits by re-encoding the older optional preview-enemy sheet at quality 100, preserving its original and checking quality/alpha. No other accepted Field/runtime/title/music change. Standalone retains 12 MiB with about 482 KiB headroom.

Acceptance: Robert reaches the third boss (Stay as needed), reads distinct silhouette/pulse cue, sees natural movement/stop and grounded transitions, and confirms controls/held results/performance. After concrete fixes, review remaining specialist/Journal portrait coverage and world dressing priorities within the content freeze. Keep the overhead camera, balance, startup grouping and soundtrack. Continue explicit asset-budget checks before further atlases.


## Alpha 0.60 — immediate boss testing access

Owner requests skipping the wait for later bosses. Development Previews now offers one-tap Breaker/Warden/Harvester sessions at base HP, safe player HP, unscored, Field art and attacks OFF by default. Pause switches/restarts bosses, selects native weapons/evolution, enables attacks and compares actor styles without altering normal preferences. Real native attacks remain active; no hordes/side events interrupt. Bosses respawn, held practice results/reports identify test context, and Retry preserves the test setup. Normal records/medals/discoveries/deployment remain isolated.

Acceptance: owner can reach and inspect all three bosses immediately on the phone, switch/restart while remaining paused, fight with chosen weapons and return to ordinary scored play. Use this access to review current boss art/attack alignment before remaining specialist/Journal/world-art priorities. Keep the content freeze, chosen overhead camera, current balance and soundtrack. No new assets or save schema; retain standalone budget and original Site identity.


## Alpha 0.61 — first specialist Field coverage: Riot Guard

Owner accepts developer boss access and authorizes the next task. Add distinct human-sized police/infected guard artwork with gold-rimmed shield, directional walking and planted windup/bash/lowered recovery. Read real facing/shield phase, switch shield-state poses immediately and retain native gold arc/warnings/geometry, turn/bash/recovery/damage/rewards. No balance, camera, music or save change. Add a separate immediate Riot Guard Art Drill with existing safe/unscored developer controls; retain all accepted boss shortcuts/Next cycle and ordinary training/prototype.

Compact lossless runtime derivative coexists with boss/common art below the retained 44 MiB raw maximum. Preserve full original and all older assets; standalone is below 12 MiB with only 28,143 bytes headroom. Further specialist atlases must first address download/decoded budgets.

Acceptance: owner uses the direct drill to judge distinct silhouette, eight-direction shield-facing, walking/stop, immediate shield-down recovery, real front/flank/Railstorm behavior, held controls/reports/results and phone comfort; then checks a scored guard at native schedule with crowds. Follow concrete findings before the next specialist/Journal/world pass. Retain the content freeze and overhead direction.


## Alpha 0.62 — ranged specialist readability: Spitter

Owner accepts Riot Guard; continue specialist Field coverage with a hunched civilian/pink throat, directional stalking, planted aim and real-shot release/recovery. Retain native one-second warning, projectile/cover/interception/damage/cooldown/spawn/reward rules and overhead camera/music. Immediate Spitter Art Drill uses existing safe/unscored 300 HP developer training and controls; Riot/boss entries/Next behavior remain.

Address budget before art: losslessly repack twenty existing survivor walking crops with every drawn pixel/pivot/scale unchanged, and optimize only the optional preview intersection at quality 100 with exact alpha/40.24 dB RGB. Preserve all originals and other accepted media. Compact lossless Spitter derivative and both specialists coexist with common/Breaker under retained 44 MiB; standalone remains below 12 MiB with about 348 KiB headroom. Continue budget reviews before further atlases.

Acceptance: owner uses direct drill to judge eight-direction motion, planted/locked aim, visible pink throat/release/recovery, native warning/shot alignment, no false/duplicate attacks, paused controls/results/records and phone comfort. Also check native scored crowd, familiar survivor motion and optional preview background. Resolve findings before Howler/Lobber, remaining Journal/hunter/world-art priorities within the content freeze.


## Alpha 0.63 — support specialist readability: Howler

Owner accepts Spitter. Add a distinct yellow-hooded Howler, directional walking, planted windup, arms-spread native rally and recovery. Read native phase/pulse timestamp with stable facing; retain exact native support eligibility, 1.2-second windup, 170 radius/eight-target cap, 20% haste for three seconds and cancellation/rewards. No camera/music/balance/save change. Direct Howler Art Drill includes three live native helpers with existing safe/unscored controls; earlier targets and Next behavior stay intact.

Preserve all accepted Field runtime art and every original. Compact lossless Howler derivative fits current 44 MiB combined raw cap, with an actual combined-catalog budget guard. Only 178,792 raw bytes remain at largest-boss/all-specialist combination: revise budgets before Lobber. Quality-100 optimization of legacy preview survivor, alpha exact/42.33 dB, retains its original and keeps standalone below 12 MiB with about 245 KiB headroom.

Acceptance: owner uses direct drill to see distinct silhouette, planted/stable howl, successful native helper haste, clear cancellation, walking/feet, paused controls/results/records and phone comfort; then checks normal scored crowds at native 03:30 opportunity. Resolve findings before Lobber, remaining hunter/Journal/world-art work and first-release presentation/performance gate.


## Alpha 0.64 — Lobber completes specialist Field coverage

Owner accepts Howler. Give Lobber a distinct stocky blue-vest/hand-canister silhouette, directional walking, planted windup, actual-placement release and recovery. Preserve native targeting/warning/damage/overtime/cancellation/rewards. Move the decorative Field chevron beside HP to leave the body visible; Classic and ground warning remain. Direct safe/unscored Lobber drill reuses native specialist training and shared controls; all earlier entries/Next behavior remain.

Losslessly repack all 105 prior specialist drawn crops, preserving their pixels/scale/pivots and originals; keep new Lobber lossless. Reproducible packing tool and reference/export metadata accompany source. Optional street preview q96 retains exact alpha and existing >38 dB floor; source PNG retained. Largest boss/all four specialists stay within 44 MiB and standalone within 12 MiB; next art still needs budget review.

Acceptance: owner checks native one-second windup, target sampled at release, full 1.4-second fixed warning, once-only blast, cancellation and already-placed warning behavior, readable hand throw, earlier specialist appearance and phone comfort. All four specialists now have Field coverage. Resolve findings, then finish Blackout Hunter/Journal visual consistency and world/startup/performance presentation gates within the content freeze.


## Alpha 0.65 — coherent Field reference guide

Replace ten old Bestiary silhouettes with small static front crops from accepted live Field artwork. Keep all native Classic portraits available and Hunter's native violet identity; temporary guide comparison follows saved actor style on entry without writing preferences. Align appearance notes and clarify the existing Lobber hand throw/windup. Correct Bosses filter label to three. Defeat counts, tactics, navigation, frozen results and normal progression stay intact.

One shared lossless 320×168 reference sheet uses capped 80px thumbnails; original/runtime combat sheets remain exact. Reproducible provenance and export tool, guarded lazy loading, current-canvas redraw, no retry loop, native fallback and release on exit keep guide art isolated from gameplay caches. Standalone fits 12 MiB with only 7,493 bytes left; scored combined raw image budget remains 45,791,128 bytes under 44 MiB. These figures exclude browser/cache overhead and do not establish actual phone memory/frame pacing.

Acceptance: Robert recognizes each enemy, can read and scroll/filter/compare the guide in both orientations, and can return to held results without changes. Review thumbnail clarity on the actual phone. Next: consolidate asset/download budgets before Blackout Hunter artwork, then continue coherent environment/readability and measured Android performance gates. Keep the existing content freeze and original local-only Site identity.


## Alpha 0.66 — Blackout Hunter completes Field identities

Robert accepts the Field guide. Add a small lean infected in a torn plum jacket, four running keys/five views, eight headings, actual-distance gait, fixed 46px foot scale and a thin decorative violet ground identifier. Preserve native five-second warning, twelve-second event, sixteen-Hunter cap, 0.75-second spacing, spawn/RNG/HP/speed/contact/reward rules. All main native wave and combat functions remain exact. A guarded lazy shared sheet preloads at warning, survives live Hunters and drill respawns, falls back natively and releases safely.

Direct Blackout Hunter Art Drill reuses safe/unscored developer testing, private Field/attacks OFF, 300 HP training target, real native movement/contact, shared paused controls and held results/report/retry. The training-only native factory call restores its wave counter; no timed wave or reward is granted. Earlier target shortcuts and original three-boss Next cycle remain. Include matching guide art for Hunter, preserving every drawn pixel of ten prior thumbnails through repacking.

Budget gate: exact original PNG, compact 368×295 reference and 384×224 lossless runtime (84,384 encoded / 344,064 raw bytes). Keep all accepted live Field and prototype art exact. Only older optional enemy preview changes to q95, exact alpha / 38.65 dB above its retained >38 floor; original retained. Standalone 12,534,799 bytes leaves 48,113 below 12 MiB. Combined common/largest-boss/four-specialist/Hunter raw pixels 46,135,192 leave 2,152 under 44 MiB, before overhead; actual phone memory/frame pacing remains a separate gate. Both export tools reproduce outputs.

Acceptance: owner reviews distinctive running/turns/feet and dark-scene readability, private drill controls/records, updated Field/Classic guide, and ordinary scored Blackout difficulty/performance. Then move from identity coverage to coherent street/world presentation on the same camera, paired with actual S21 Ultra measurements and budget consolidation. Full turn/death animation and final visual quality remain open; this is not AAA completion or a release/distribution decision.


## Alpha 0.67 — first normal-run street material pass

Replace the normal square-grid presentation with procedural road/curb/crossing/paint detail, low-contrast grain/cracks/puddles/drains, existing-footprint weathering and restrained fixed warm/cool floor light. Preserve distinct Freight/Riverside/Park/Market motifs and decorative passability. Draw all native warnings/effects/actors afterwards. This is a first vector material/dressing pass, not photorealistic textures, PBR, a full city rebuild or a camera migration.

Street/Classic is independent of actors/HUD, available through Pause's Run HUD & Field Status group and Settings. Older saves default to Street; validated scenery uses the existing version-1 preference shape, with safe temporary future/blocked storage behavior. Training/developer/camera studies keep their own scenery. Scenery changes stay paused and reset only active normal-run diagnostic samples; captured reports freeze the actual or next-run context, and results remain held.

No image/raster allocation or asset encoding changes: all twenty asset entries/source/runtime/title/music/CSS and export tools remain exact. At most 256 numeric visible cells, coordinate hashing without RNG, bounded drawing and old culling. Actor raw cap remains 46,135,192 bytes under 44 MiB before overhead; standalone 12,547,662 bytes leaves 35,250 below 12 MiB. Proxy command counts show extra drawing, not phone FPS. Owner must compare ordinary/crowded/warm Street/Classic/Reduced performance and warning contrast.

Acceptance: owner prefers clearer streets, recognizes route motifs and reads every active warning/actor/goal without losing comfort, controls, escape paths or held stats. Resolve direction/performance findings before richer production material/prop/lighting assets. Keep first-release content freeze; actual device limits and full animation/world/release gates remain open.


## Alpha 0.68 — normal Field combat feedback

Read actual successful native volleys and valid hits; add existing-metadata gun-tip flash/tiny upper-body recoil, non-stunning body shear, restrained source-colored impact rays and short borrowed-pose collapse/fade. Damage, kill/drop/practice/boss credit and native attacks still resolve immediately. Draw defeat pictures under warnings/live actors and prevent duplicate live/dead images. Classic/missing art/original previews stay intact; Reduced Effects gives the quiet prior Field presentation. No new menu/preference/audio.

Use weak reactions/dead membership and bounded numeric/pose queues (24 hits, 12 defeats, one shot), time-based cleanup and existing whole-art resets. Hold already loaded optional sheets only through 0.42/0.5-second defeat feedback, guarding exclusive boss groups. No retained actor/image references in arrays or new raster/decode. Keep all prior assets/world/CSS/music/save shape exact, existing 44 MiB raw-image cap and 12 MiB download limit. Native AI/projectile/HP/credit/upgrade/history/record rules normalize after two read-only notifications.

Acceptance: owner sees correctly placed small firing feedback, useful hits without apparent stun, immediate kills/rewards and brief clearly dead pictures, readable native warnings and reliable controls/results/records. Review ordinary/crowded/warm phone cost and quiet-mode comparison. Borrowed pose collapse is not authored full death/turn/ragdoll animation. Then continue richer world/production art and performance consolidation; no new content or engine/distribution decision.

## Alpha 0.69 — interactive object coherence

Give existing fuel/shock drums, barricades and four supply/reward cases matching procedural material depth in normal Street scenery. Preserve native color roles, symbols, interaction areas/timing, warnings/progress/labels and Classic fallbacks. Reduced Effects keeps information with less detail. Actor choices stay independent; drills/prototypes keep their scenery. No new content, balance, assets, preferences or draw-order changes.

Acceptance: owner recognizes every object at actual phone size, sees damage and collection cues without lost warnings, and prefers the added detail in both orientations with comfortable ordinary/crowded/warm pacing. Review Street/Classic/Reduced comparisons and existing controls/results. Retain 12 MiB standalone/44 MiB raw actor caps; this vector coherence step is not final AAA production art. Next work should follow real-phone readability/performance findings before adding richer environment art.

## Alpha 0.70 — foreground warning and goal readability

Preserve native ground telegraphs and gameplay. Add a thin dark-edged late outline pass for actual boss/specialist windups, released bomb warnings and salvage/extraction borders above effects/actors, before damage numbers. Preserve exact native geometry, colors, progress and phase predicates. Native Howler after-pulse stays decorative; no new fill/flash/text/duration. Normal Street scenery and safe private Field drills support comparison; Classic normal scenes and original training/previews stay exact, Reduced retains critical edges. Batch existing Street XP diamonds with clear outlines instead of individual glow, without altering pickup rules or adding state/assets/preferences.

Acceptance: owner can follow attacks/goals through crowds without distracting line clutter, recognizes XP on bright ground, and retains comfortable ordinary/crowded/warm phone pacing and controls in both orientations. Review matching Classic/Reduced conditions and direct safe boss/specialist shortcuts. Source/mocked paint counts cannot establish Android FPS. Resolve owner contrast/performance findings before richer production world assets; keep content/balance/camera/engine/distribution freeze.

## Alpha 0.71 — wet ground atmosphere under combat

Add irregular shaded puddles, small native-time ripples, broken reflections at existing light sources and one faint world-anchored rain batch in normal Street/non-Reduced scenes. Reuse the existing bounded numeric plan and controls; all decoration stays below gameplay. Classic/Reduced preserve prior complete drawings, and original drills/prototypes retain their scenery. No new imagery, state/cache, audio, collision, balance, content or camera change.

Acceptance: owner prefers the wet atmosphere, sees it stay attached to the world and freeze with gameplay, reads all existing warnings/goals and retains comfortable phone movement/controls/frame pacing in both orientations. Compare Reduced and Classic using matching conditions. Resolve visibility/distraction/performance findings before production environment assets; this procedural step does not close the AAA art or measured Android gates.

## Alpha 0.72 — route floor identity

Add low-contrast floor wear and route-specific utility/loading/paving/leaf/paper motifs to existing normal Street/non-Reduced scenes. Preserve layouts, passability, rules, wet effects and native warning priority. Reuse the unchanged bounded numeric plan; cap sparse marks/road words, cull offscreen and consume no RNG or persistent art state. Classic/Reduced and original training/previews remain exact. No new content, imagery, controls, sounds or save format.

Acceptance: owner recognizes the route details, sees them stay world anchored and clearly decorative, reads native actors/rewards/warnings and retains phone control/ordinary-crowded-warm comfort in both orientations. Floor paint must not imply a new speed effect, and paper/leaves must not look like loot. Resolve owner readability/performance findings before production environment asset expansion; content/balance/engine/distribution freeze remains.

## Alpha 0.73 — reproducible main-game pressure tests

Graphics are parked. Current procedural main-world quality has not reached the richer Street Prototype; retain that as the future visual bar and present one actual-game scene comparison before broader art work. Next milestone is phone performance and reliability, using the existing diagnostics rather than assuming VM tests establish frame pacing.

Add three private unscored main-renderer fixtures through Development Previews: Early 12 targets/no XP, Crowded 100/160 XP with Breaker, Overtime 220/600 XP with evolved paths and specialists/Hunters. Native safe training credit and cloned temporary settings protect scores/setup; reset/preset controls retain pause and clear measurements, and reports freeze actual fixture conditions. Five active seconds warm up, then owner resets after art readiness and records 30 active seconds. Held results/reports and private replay support comparison. No production graphics, balance, content-family, save format or distribution change.

Acceptance: controls/restore/score isolation hold on phone, owner supplies Crowded/Overtime reports with browser/orientation/conditions, and measured bottlenecks guide the next change. Fixed pressure tests differ from natural scored play; validate real runs after fixes. Final visual quality, actual phone FPS/thermal comfort and install/update/release format decisions remain open. No automatic publication.


## Device baseline received after Alpha 0.73

One owner Overtime portrait capture (two duplicate attachments) supports recent 60.17 FPS/p95 16.70 ms and zero >50 ms intervals over 34.56 sampled seconds with full Field/Street/effects. Record it in PERFORMANCE_RESULTS.md; keep device/browser, warm/landscape, Crowded and natural scored-run coverage open. Complete those observations before closing the performance gate or selecting a renderer change. No gameplay or graphics build follows from this capture alone.


## Crowded baseline completes the initial portrait pair

Distinct Crowded capture received: 75.81 recent/90.11 overall FPS, latest-window p95 16.70 ms, one 58.20 ms interval across 36.48 seconds. Paired Overtime remains 60.17 recent/73.09 overall, no >50 ms interval across 34.56 seconds. Matched reported viewport/presentation; hardware/browser/thermal details still unknown. The initial portrait pressure target is supported. Track the isolated hitch and require repeatability before choosing a performance fix. Continue Android reliability and backup/update behavior checks, with landscape/warm/natural-run validation still part of the release gate. Graphics stay parked. Evidence/docs update only; delivered game unchanged.


## Alpha 0.74 — verified restore and previous-records recovery

Add one browser-local previous-records snapshot to the existing Save Backup screen. Before a reviewed replacement, validate/store/read back that snapshot, then write and read back both journal and best time. On failure restore and verify both prior raw values independently, including absent keys. Keep old session data and state the failure honestly if rollback itself fails. A supported previous copy gets an expandable manual review entry and the same existing fresh-touch confirmation/Back cancellation; no automatic startup replacement or new root-menu action.

Existing format-one JSON exports/imports remain compatible. Downloads gain a build-labelled filename; save schemas, normal save behavior, preferences, scored play, graphics, audio and pressure fixtures remain exact. No synchronization, active-run resume, multi-tab transaction or atomic/power-loss durability promise. The recovery copy shares browser storage; an external JSON remains necessary across file/browser contexts. SAVE_UPDATE_GUIDE.md describes update, undo and failure handling.

Acceptance: owner first exports real records from the old file, cancels a reviewed import without writes, confirms a known backup, verifies saved records after reopening the same new file, and reviews/cancels the previous copy. Optional actual undo only with a retained real backup. Android file-picker/download/Back/background behavior and a normal short run remain device checks. Landscape/warm/natural-run performance coverage stays open; no performance fix is justified by the two initial portrait samples alone. Resolve reliability findings before installation/distribution decisions or further production-art work.


## Alpha 0.75 — ordinary save verification and explicit retry

Read back ordinary best-time/journal/preferences values before reporting success. Finish every scored run by saving the current personal best, even when the new run is shorter; this recovers a previous session-only best after storage becomes available. Put failed-save guidance, external backup and explicit retry before the held results stats. Retry writes existing session record/journal only, preserving result identity, totals, history, credit and stopped combat. No background loop, periodic writes, extra root menu or save format change. Future logs/preferences stay protected and unscored modes never retry scored saves.

Acceptance: healthy normal results need no failure action; same-file reopen retains the completed row/best and chosen settings. If storage fails naturally, owner can export current session data before leaving and retry without duplicate runs, changed stats or false success. Previous-records recovery and legacy JSON transfer remain intact. Validate actual Android controls/Back/background/picker/download/persistence. Do not induce failures by deleting real records. Read-back cannot guarantee atomic multi-key/power-loss durability or cross-tab arbitration. Keep graphics/content/camera/audio frozen while resolving reliability findings, then complete landscape/warm/natural-run measurements and review installation/distribution with Robert.


## Alpha 0.76 — safe rotation and interrupted gestures

When the viewport crosses portrait/landscape, pause active play through native Pause and require explicit Resume. Same-orientation resize keeps the previous input clear without forcing Pause. Preserve existing frozen choices, settings, held results and captured reports. Route optional browser freeze notifications through native suspend; no automatic resume.

Invalidate gesture arms when input is cleared, so an upgrade/reroll/banish/restore or results touch begun before rotation/backgrounding cannot act on a delayed release afterward. Fresh pointer/key/accessibility actions remain usable, including when a stale pointer never ends. Hidden results actions are rejected. Keep native 450 ms choice guard, scroll cancellation, navigation and second-finger actions. No renderer/simulation/tuning/art/audio/save changes beyond two session-only input/layout scalars and guarded event paths.

Acceptance: owner rotates in both directions during combat and sees stopped time/damage and no stuck movement; fresh Resume/drag works. Interrupted card/results/restore releases do nothing; fresh activation works, with no lost charges, duplicate rows or unintended restore. Existing frozen screens stay intact, same-orientation browser chrome does not force Pause and real phone Back/background/touch controls remain comfortable. Mock lifecycle tests do not close actual Android event-ordering/persistence or landscape/warm/natural-run performance gates. Keep local delivery/content freeze; review major art/distribution decisions with Robert later.


## Alpha 0.77 — ten-task overnight reliability and menu pass

Complete the ten concrete tasks in OVERNIGHT_10_STEPS.md without expanding content or making a major distribution/art decision. Offline helper retains readable JavaScript, verifies compact AST equivalence and budgets, and leaves all media exact. Put Resume first, group retained Pause inspection controls, confirm scored End Run with native credit only after deliberate activation, and apply existing fresh/scroll/lifecycle guards to extraction and zero-delay results keyboard activation. Escape follows native Back; settings/game/container focus and keyboard outlines improve browser use. Cancel old capped effect/alert voices before suspend; generic hidden actions reject activation.

Acceptance: owner sees clearer Pause navigation and no missing retained option, can cancel End without resuming, confirms once for one native result, chooses Extract/Stay deliberately, scrolls/uses keyboard without unwanted Retry, and retains reliable Back/rotation/joystick/audio/backup persistence. No new scoring path, image/audio asset, per-frame subsystem or cloud/install/engine/camera change. Actual Android/browser visual focus and event-ordering/audio/persistence remain owner review. Complete the remaining warm/landscape/natural-run reports and reliability findings before release-format or production-art decisions with Robert.


## Alpha 0.78 — quick exit and overtime practice

Add one existing-mechanic drill to Training and its paused scenario selector. Start with real beacon geometry/arrival, four stationary safe targets, rank-three practice weapon and zero synthetic boss defeats. Use native Extract for frozen unscored results and native Stay for landing clear/protection/utility practice credit. Only this drill schedules a return exit after ten active seconds and suppresses the normal post-Stay encounter/rescue scheduling. Coach the difference from scored 03:00/boss-clear unlock and at least 60-second normal overtime. Reset Exit Here, weapon change, scenario switch, replay and normal deployment clear the fixture through native training/start paths. Explicitly exclude earned medal display for all training.

Acceptance: owner can test green/Extract/Stay/results without surviving a full run, sees time freeze and clear unscored labels, can repeat/reset/switch with no lingering beacon/counter/encounter, and retains actual records/setup/powers in a subsequent normal run. Normal extraction/outcome/credit mechanics and all art/audio/balance are unchanged. No new enemy/weapon/reward/progression family. Verify actual Android controls/visibility and storage alongside the existing release gates. The two portrait benchmarks remain the only quantitative owner measurements; no new performance result follows from general functional acceptance.


## Alpha 0.79 — four-part run-results consolidation

Robert accepts Alpha 0.78 and the new batching cadence. Make finished-run review easier without adding content or changing accounting: (1) keep four primary cards and survivor/route/rules near the top, plus a scored best-time cue; (2) move native replay/change-survivor/main-menu actions directly below the summary; (3) group retained detailed stats, build analysis and records/medals in native expandable sections; (4) consolidate the existing Run Log/report/backup/reference/settings destinations in a tools section. Retain every original statistic and binding. Keep practice/performance measurements and save warnings visible outside folded panels, with backup/retry above the summary on failure.

Acceptance: Robert can read the summary, deliberately start a fresh run, open all retained details/tools and return to the same held result in both phone orientations. Touch release/swipes cannot choose actions, practice remains unscored and save failures stay prominent. Sections reset closed on a fresh results render; no expansion preference or new history screen is added. Node VM/source checks support data equivalence, not actual phone layout/touch/storage/FPS proof. Resolve concrete findings before the next batch; original performance/art/distribution gates remain open.


Final automated verification: **1,326/1,326 existing regression checks passed**, zero failures; **230 focused checks passed** on the same final gameplay file. No new unit tests were added for this reversible presentation change; five existing version assertions were updated. Nine native result cases preserve complete result/records/report/stat/action data, and static parsing verifies balanced markup, unique IDs, all 32/34 cards, four initially collapsed sections and prominent failed-save controls. Source audit protects 641 readable function regions plus all nineteen tunings; only the result template, six labels and four CSS rules differ. Offline AST/reproducible build, syntax and whitespace checks pass. Standalone: 12,576,210 bytes, 6,702 below 12 MiB; media/decode budgets unchanged. Actual phone layout, input and storage acceptance remain owner checks. No production changes followed the full suite.


## Android/browser release check — accepted Alpha 0.79 unchanged

Use RELEASE_CHECK.md and RELEASE_CHECK_REPORT.txt. Native source/HTML/media/hosting are exact to the accepted build. tools/release_check.cjs adds ten bounded local workflow observations using the existing VM harness: accelerated scored journeys in both orientations; an actual format-one packet generated by isolated Alpha 0.78 code, reviewed/restored/reloaded in Alpha 0.79 with records/preset/discovery intact and fresh combat powers; cancel/replacement/previous-records recovery; and all three pressure presets in both orientations with no record/preference leakage. These are additional integration observations, not device FPS or natural-run balance proof. The accepted game already passed 1,326 full and 230 focused checks; no production inputs changed, so that suite is retained rather than repeated.

Owner gates: preserve/export records before opening the test copy; distinguish isolated transfer from shared storage; collect ordinary portrait/landscape reports and warm Crowded/Overtime landscape reports; check actual Back/background/rotation/two-finger controls, extraction/held results/fresh replay and reopening the same file/browser. General acceptance of prior builds and Alpha 0.73 portrait reports remain useful evidence but do not close those quantitative gates. Review reproducible findings before choosing another focused fix batch. No renderer optimization, publication, repository synchronization or installable-app work is implied by this test checkpoint.

Current checkpoint device/browser confirmed by Robert: **Samsung Galaxy S21 Ultra / Brave**. Browser version and measured thermal/refresh/power conditions remain unreported. Current portrait reports are recorded below; device identity alone is not a thermal measurement.


Hot-portrait evidence received 2026-10-26: Alpha 0.79 Overtime on the owner-confirmed S21 Ultra / Brave, described as a hot phone left on the dashboard. Preserve the raw report and separate chat provenance under benchmarks/alpha-0.79. Measurements: 103.93 sampled seconds / 6,243 intervals, 60.07 FPS overall / 59.87 recent, recent p95 16.70 ms, maximum 49.70 ms, zero intervals >50 ms. This supports approximately 60 FPS in that sample; actual temperature, long thermal stability and cause of any refresh/average difference are unknown. No demonstrated bottleneck or new build. Mark this specific portrait evidence received; warm moving/Dashing landscape, natural runs, backup/reopen and physical lifecycle gates remain open.


Portrait comparison received 2026-10-26 without added dashboard heat: Alpha 0.79 Overtime, same 411×781 / DPR 1.75 / Field / Street / composed / Reduced OFF. Nearly five measured minutes (295.15 seconds, 20,007 intervals), 67.79 FPS overall / 71.28 recent, latest p95 24.90 ms, maximum 58.40 ms, two >50 ms intervals (~0.01%). Higher average than hot sample but less even latest-window pacing; no controlled thermal-cause or persistent-slowdown conclusion. Preserve raw/structured evidence and retain current game. Landscape capture is the owner's stated next test; ordinary scored-run and owner update/lifecycle gates remain open.


Next report received as “Lamdscape”: Alpha 0.79 Overtime, 295.23 sampled seconds / 19,847 intervals, 67.22 FPS overall / 62.21 recent, recent p95 16.70 ms, maximum 49.70 ms, zero >50 ms. Raw viewport remains 411×781 portrait. Preserve as overtime-orientation-unconfirmed-01, with owner claim and report context separately recorded. Ask whether the game stayed tall, rotated back before capture, or remained wide at capture. Existing/finished report snapshots retain original orientation; three local source-driven rotation cases pass. No confirmed Android/reporting bug and no landscape gate closure. Resolve this mismatch before interpreting orientation performance; no new game build.


Orientation clarification received: Robert confirms “It became wide, but I rotated back before capturing.” Owner-confirmed landscape play and portrait capture explain the mismatch; no viewport defect established. Companion JSON now records the clarified sequence while raw bytes/filename remain unchanged. Timing remains valid aggregate evidence; exact orientation of each measured interval/latest window is unknown. One short fresh wide-view reset/play/capture can provide the isolated comparison; do not demand another five-minute run. No game/build change.


Landscape recapture received: owner explicitly re-exported the same accumulated report after switching wide. Actual report viewport is 838×331 landscape / DPR 1.75; only that line differs from the previous portrait-context export. Same 19,847 frames / 295.23 seconds / 67.22 FPS average. Record linked raw/JSON under overtime-landscape-reexport-01 and annotate original metadata. One measurement, not a second performance run; five distinct observations across six raw exports. Actual wide capture detection is verified and the contradiction resolved. Isolated orientation-window, natural-play and remaining reliability gates remain open; no game build or repeated existing-run submission.


## Alpha 0.80 — installable web foundation for review

Robert reports the normal-run/records checklist works. Record functional acceptance without inventing a missing natural-run benchmark or detailed isolated-transfer history. He then says “Lets do it” to the proposed installable web version. Prepare one major distribution feature: separate /install/ setup with explicit ~13 MB offline download and optional native install prompt/menu fallback; stable manifest ID/start/scope, normal/maskable monogram icons, direct game launch and launcher Setup & Updates shortcut where supported; verified exact static caching; waiting updates until all old clients close. No active-run serialization, cloud save, engine, art or combat change.

Every core response is checked for success/no redirect, MIME and SHA. Failures remove only the incomplete new cache, retaining the old complete release. Default worker lifecycle protects open pages: no skipWaiting, claim or reload. Offline routes are limited to package files; cleanup is scoped to this app, records untouched. Authentication/response transformation compatibility must be verified on the private host. Keep a standalone fallback and original source/media; existing Site identity/audience remain. Local hosting directory changes from dist to generated web-dist for the reviewable package.

1,326 native checks and 27 final PWA cases pass, including actual generated payloads served through the mock worker with network disabled. Main game is byte-identical except six version labels; all nineteen tunings/assets/controls/records exact. Hosted JS equals standalone. Final setup shortcut/manifest changes were followed by the PWA suite; no game JS changed after the full native suite. No managed browser available: real HTTPS/Brave install/standalone/offline/OS storage and two-build update tests remain pending. Delivery includes standalone, hosted ZIP, full source, icon preview, guide and phone checklist. Private publication is the next owner decision after reviewing this package; no repository download/sync/deploy was performed.

Final recovery review adds explicit verified static-cache repair when a browser keeps the installed worker but evicts cached files. Reuse that registration, download/hash-check missing-copy payloads, coalesce concurrent preparation, retain all records and default waiting/activation policy. Worker and UI recovery cases pass in the final 27-case PWA suite. No game source changed; full 1,326 game checks remain applicable.


## Alpha 0.81 — Pause & Return Briefing

Owner confirms Alpha 0.80 works and asks to progress. Three source-upload attempts ended aborted before execution; Robert explicitly reports no network approval prompt. Park HTTPS installation and retain prepared PWA source/output without claiming deployment. Do not keep retrying the blocked network command. Resume local standalone development under the original Site identity and downloadable-build cadence.

Make Pause useful on returning from an interruption: four current vitals cards with survivor/route/rules, a plain extraction checklist based only on native elapsed/exit/boss/Blackout state, and an expandable audio section retaining every slider/test/mute/reset control. An open beacon shows its bearing and Extract/Stay choices; overtime reads the native next wait. Ordinary hordes and optional objectives do not block the exit. Practice omits the scored checklist, and pressure fixtures show actual test elapsed time rather than synthetic survival time. Resume remains at the top; no new button, timer, saved setting or game mechanic.

Acceptance: Robert reads correct current vitals/exit requirements, sees all clocks frozen, reaches existing sound controls easily and keeps comfortable scrolling/Back/rotation/Resume in portrait and landscape. Compare the normal three-minute loop, an optional Stay and unscored exit practice. Do not demand another long benchmark for this low-cost presentation step. Address concrete phone findings before selecting the next related release polish batch; installation remains parked until the workspace publishing connection is usable.


## Alpha 0.82 — Phone Settings Cleanup

Group the existing Settings controls into four native expandable sections: Audio & Volume, Controls & Warnings, Visuals & Effects, and Upgrade Highlight. Keep diagnostics and menu/results-only backups. Move the single existing Back action near the heading. Capture section openness and scroll from the current Settings DOM only, render the same open attributes before native focus restoration, then restore scroll. No persistent or global section state; reopening Settings starts compact. Existing option IDs, handlers, validation and persistence remain intact.

Acceptance: Robert finds existing controls quickly, opens a group, changes several options without it collapsing or jumping, returns safely to Pause/held results and retains comfortable portrait/landscape navigation. Defaults, combat balance, assets and save behavior stay unchanged. Use existing focused menu/audio/control/storage/Back cases plus source-equivalence and prepared-package checks; do not demand another long benchmark for a presentation-only change. Broad production art and installation remain separate decisions/gates.
