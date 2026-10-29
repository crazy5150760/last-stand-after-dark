# Device performance observations

## Alpha 0.73 — Overtime portrait, observation 01

Received from the owner on 2026-10-25; capture date/time is not recorded in the report. The two attachments are byte-identical, so this is **one observation**, not two independent runs. No Crowded report has been received in this pair.

[Original report, preserved byte-for-byte](benchmarks/alpha-0.73/overtime-portrait-01.txt)

SHA-256: `68d7d7246c147dd6557e82358c395efe05003bd5d37fd9c1b80ca6e86edddaf9` (2,433 bytes).

| Capture field | Observed value |
| --- | --- |
| Device/browser and subjective notes | Not supplied |
| Scene | Overtime, controlled/unscored, safe HP |
| Viewport | 411×837 CSS pixels, portrait, canvas DPR 1.75 |
| Presentation | Field actors, Street scenery, composed HUD, Reduced OFF |
| Loadout | Gun ×5, all four evolved weapon paths |
| Active native test age | 01:04; initial fixture clock 10:00 |
| Measured intervals / sample time | 2,526 / 34.56 seconds |
| Whole-capture average | 73.09 FPS |
| Latest 300 intervals | 60.17 FPS, about 4.99 seconds |
| Latest-window p95 | 16.70 ms |
| Whole-capture maximum interval | 24.90 ms |
| Whole-capture intervals over 50 ms | 0 |

Current/peak workload: 206/220 enemies, 600/600 XP gems, 30/45 gun shots, 460/595 particles, 99/100 floating texts, 8/8 lightning objects, 0/2 bottles, 0/2 fires. All listed Field actor modules were ready at capture. Hostile-shot counts were 0/0; this means no live hostile shots were observed at sampling boundaries, not proof none were fired/intercepted between samples. It does not establish projectile-heavy performance.

### Interpretation

This supports approximately 60 FPS in the recent window of this portrait pressure fixture, with no recorded severe (>50 ms) frame intervals across the 34.56-second sample. It is encouraging evidence for the current Field/Street/effects setup under dense enemies/XP. It does not point to an immediate frame-stall regression requiring a renderer or gameplay change.

The 73.09 overall average and 60.17 recent average describe different windows. Refresh-rate changes, workload evolution or other scheduling can affect that difference; this capture cannot identify its cause or establish spare rendering capacity. The 16.70 ms p95 applies to the latest 300 intervals only. Do not apply it to the entire capture.

Device/browser identity, refresh/power settings, phone temperature, warm-up/reset procedure, subjective smoothness and landscape behavior remain unconfirmed. Actor readiness is known at capture, not throughout the whole sample. This is a short controlled fixture; training/safe-HP/refill differences, normal-run performance, memory/thermal comfort and startup behavior remain the existing limits in PERFORMANCE_TESTS.md. Do not close the entire phone-reliability/performance milestone from one capture.

### Next evidence

This was the next request after the first capture. The distinct Crowded report is now recorded below. Device/browser notes, landscape and sustained warm Overtime observations remain open. Keep the current game/graphics/tuning while completing the baseline, and select optimization work from an observed hitch, sustained slowdown or reproducible fault. Ordinary scored-run measurements remain the final validation after any fix.


## Alpha 0.73 — Crowded portrait, observation 01

Received from the owner on 2026-10-25; capture date/time is absent. This is a distinct Crowded capture, bringing the baseline to **two independent observations**: one Crowded and one Overtime. Device/browser and subjective/thermal notes remain Not supplied.

[Original report, preserved byte-for-byte](benchmarks/alpha-0.73/crowded-portrait-01.txt)

SHA-256: `e58d963f14e25c459478bf073d6c6e77b5bb686b559c30511d195e54b9784cd7` (2,328 bytes).

| Capture field | Observed value |
| --- | --- |
| Scene / fixture clock / native age | Crowded / 02:30 / 00:41 |
| Presentation | Field actors, Street, composed HUD, Reduced OFF |
| Viewport | 411×837 CSS pixels, portrait, DPR 1.75 |
| Loadout | Gun ×3, Pierce I, Lightning III, Blades II |
| Measured intervals / sample time | 3,287 / 36.48 seconds |
| Whole-capture average | 90.11 FPS |
| Latest 300 intervals | 75.81 FPS, about 3.96 seconds |
| Latest-window p95 | 16.70 ms |
| Whole-capture maximum interval | 58.20 ms |
| Whole-capture intervals over 50 ms | 1 (about 0.0304% of sampled intervals) |

Current/peak load: 93/100 enemies, 158/160 XP, 0/18 gun shots, 1/1 hostile shots, 55/260 particles, 39/100 floating texts, 0/5 lightning objects, no bottles/fires. Breaker, Riot and Spitter art were ready at capture alongside the common actors. The report observes some live hostile-projectile load, but not the native maximum.

### Paired portrait summary

| Metric | Crowded | Overtime |
| --- | --- | --- |
| Whole-capture average FPS | 90.11 | 73.09 |
| Recent-window FPS | 75.81 | 60.17 |
| Recent-window p95 ms | 16.70 | 16.70 |
| Whole-capture maximum ms | 58.20 | 24.90 |
| Intervals over 50 ms | 1 / 3,287 | 0 / 2,526 |
| Sample seconds | 36.48 | 34.56 |
| Enemy / XP peaks | 100 / 160 | 220 / 600 |

Both use the same reported viewport and presentation settings. The device/browser, refresh/power state, temperature and subjective experience are not confirmed, so do not treat the pair as a tightly controlled hardware comparison. Each recent p95/FPS row describes its own latest 300 intervals, not the whole capture. Overall FPS differences can reflect workload evolution or refresh/scheduling changes.

### Assessment and next milestone

The initial portrait pressure-test target is supported in both samples: recent performance is above or approximately 60 FPS, without evidence of sustained slowdown. Crowded contains one brief hitch; aggregate data cannot locate it or identify CPU, GPU, garbage collection, asset loading or browser/OS scheduling as its cause. Keep it on the watch list and investigate if it repeats or the owner reports noticeable stutter. It is not a demonstrated renderer bottleneck.

Preserve current gameplay/graphics while proceeding with Android reliability, save/update protection and first-release validation. Include landscape, sustained warm play, device/browser identity and natural scored-run observations in that checklist. These results do not close those gaps or validate the higher-fidelity Street Prototype presentation. No game-code change or new alpha build is required to record this evidence.


## Alpha 0.79 — hot-phone Overtime portrait, observation 01

Received 2026-10-26. Robert describes a **hot phone left on the dashboard running the game for a bit**. He previously confirmed **Samsung Galaxy S21 Ultra / Brave** for this check. Those details come from chat: the report's device/browser and observation fields still say Not supplied and are preserved unchanged. Browser version, actual temperature, exposure/idle duration, charging/sunlight/refresh/power conditions and exact inputs are unrecorded. Do not label this a controlled thermal test or assume a sensor temperature.

[Original report, preserved byte-for-byte](benchmarks/alpha-0.79/overtime-portrait-hot-01.txt) · [Structured reading with provenance and limits](benchmarks/alpha-0.79/overtime-portrait-hot-01.json)

SHA-256: `a0fa631c7bcdbae9a05186c609fa4e689f9b2dbe99ffc2f0c8d992e0f3cd6c04` (2435 bytes).

| Capture field | Observed value |
| --- | --- |
| Scene | Overtime, controlled/unscored, safe HP |
| Initial fixture clock / active test age | 10:00 / 02:20 |
| Viewport | 411×781 CSS pixels, portrait, DPR 1.75 |
| Presentation | Field actors ready, Street, composed HUD, Reduced OFF |
| Loadout | Gun ×5, all four evolved weapon paths |
| Measured intervals / sample time | 6,243 / 103.93 seconds |
| Whole-capture average | 60.07 FPS |
| Latest 300 intervals | 59.87 FPS, about 5.01 seconds |
| Latest-window p95 | 16.70 ms |
| Whole-capture maximum interval | 49.70 ms |
| Whole-capture intervals over 50 ms | 0 |

Current/peak counts: 176/220 enemies, 600/600 XP gems, 27/30 gun shots, 0/1 hostile shots, 581/593 particles, 98/100 floating texts, 8/8 lightning objects, 0/2 bottles, 2/2 fires, 9/25 blade cooldowns and 51/80 burn cooldowns. These are observed object counts, not memory or heat measurements. Safe HP, controlled replenishment/loadout and largely unattended running differ from natural scored play and moving/Dashing.

### Assessment

This is useful hot-condition portrait evidence: approximately 60 FPS over the measured 103.93 seconds and in the latest ~5 seconds, with no interval over 50 ms. It contains about three times the sampled duration of the original Alpha 0.73 Overtime report. The 49.70 ms maximum still allows a brief hitch; zero intervals above 50 ms does not mean every frame was even. The 16.70 ms p95 is only the recent 300-interval window. Active test age 02:20 does not mean 140 seconds were measured; resets and raw/capped timing differ, and their history is unknown.

| Overtime metric | Alpha 0.73 portrait | Alpha 0.79 hot portrait |
| --- | --- | --- |
| Whole-capture average FPS | 73.09 | 60.07 |
| Recent-window FPS | 60.17 | 59.87 |
| Recent-window p95 ms | 16.70 | 16.70 |
| Maximum interval ms | 24.90 | 49.70 |
| Intervals over 50 ms | 0 | 0 |
| Sample seconds | 34.56 | 103.93 |

Both recent windows are close to 60 FPS. Different builds, viewport heights, sample durations, workloads and unrecorded thermal/refresh/power conditions prevent a controlled regression or thermal-throttling conclusion from the overall-average difference. No renderer bottleneck or specific heat-related failure is established, so no game/tuning/graphics change follows this evidence alone.

Record **hot portrait pressure sample received**; keep warm landscape, active natural-run measurements, controls/lifecycle and actual backup/reopen checks open. Next useful capture: moving/Dashing in Overtime landscape after ordinary indoor play, allowing the game to warm the phone naturally rather than using dashboard heat. Keep the existing measurement procedure and supply notes in the report. This does not yet close the entire performance milestone or establish prolonged thermal stability, supported minimum FPS, battery use or memory bounds.


## Alpha 0.79 — Overtime portrait without added dashboard heat, observation 01

Received 2026-10-26. Robert identifies this report as **portrait without added dashboard heat**, with landscape to follow. S21 Ultra / Brave was confirmed earlier in chat. The raw device/browser and notes fields say Not supplied; leave those bytes untouched. This is a distinct report, not a duplicate of the dashboard-heated sample. No actual temperature, browser version, refresh/power/charging state or exact input sequence was supplied; do not call it a measured cold-phone baseline.

[Original report](benchmarks/alpha-0.79/overtime-portrait-no-added-heat-01.txt) · [Structured reading and comparison](benchmarks/alpha-0.79/overtime-portrait-no-added-heat-01.json)

SHA-256: `fe7ecb7bbe64d89ff92a87b839aba9cc69d5b5389b91b2695671fcc98551f6f0` (2438 bytes).

| Metric | Dashboard-heated portrait | Portrait without added heat |
| --- | --- | --- |
| Active test age | 02:20 | 05:00 |
| Measured intervals | 6,243 | 20,007 |
| Sampled seconds | 103.93 | 295.15 |
| Whole-capture average FPS | 60.07 | 67.79 |
| Latest 300-interval FPS | 59.87 | 71.28 |
| Latest-window p95 ms | 16.70 | 24.90 |
| Maximum interval ms | 49.70 | 58.40 |
| Intervals over 50 ms | 0 | 2 (about 0.01%) |

Both are Alpha 0.79 Overtime safe-HP fixtures, 411×781 portrait / DPR 1.75, Field actors ready, Street, composed HUD, Reduced OFF / mirrored OFF, Gun ×5 and all four evolved paths. In the newer capture, current/peak counts are 164/220 enemies, 600/600 XP gems, 19/45 gun shots, 0/2 hostile shots, 570/599 particles, 97/100 floating texts, 0/8 lightning objects, 0/2 bottles, 2/2 fires, 5/25 blade cooldowns and 43/145 burn cooldowns. Peak counters do not establish memory use or a growth trend.

The newer run averages more frames per second but is **less even in its recent window**: p95 is 24.90 rather than 16.70 ms. Latest 300 intervals span about 4.21 seconds; this p95 is not the entire five-minute distribution. Two intervals over 50 ms in 20,007 samples are brief timing outliers; aggregate data cannot locate them or establish whether the owner noticed a hitch. The 58.40 ms maximum is not a persistent slowdown.

This extends portrait pressure evidence to nearly five measured minutes. It does not show an aggregate sustained-performance problem requiring a renderer change. Same-build/settings/viewport improve comparability, but different sample lengths, evolving object counts and unknown inputs/refresh/thermal conditions prevent concluding that removing dashboard heat caused the FPS change. No thermal-throttling claim, natural-run performance guarantee or new game build follows.

There are now **four distinct received captures**: Alpha 0.73 Crowded/Overtime portrait and Alpha 0.79 Overtime portrait with/without added dashboard heat. Both Alpha 0.79 captures are controlled training, not ordinary scored-run reports. Next receive the planned landscape capture with the same scene/settings and fresh measurements; active natural runs and actual update/lifecycle checks remain open.


## Alpha 0.79 — owner-labelled landscape, reported viewport portrait

Received 2026-10-26 with Robert's description **“Lamdscape”**. The raw report instead says **411×781 CSS px · portrait · DPR 1.75**, matching the two earlier Alpha 0.79 portrait viewports. Record the discrepancy; do not reclassify the raw report, dismiss the owner's observation or close the landscape gate. Robert subsequently clarified: **“It became wide, but I rotated back before capturing.”** The game did enter landscape; the portrait dimensions are consistent with the later capture context. Exact orientation/reset timing for all sampled intervals remains unrecorded.

[Original report](benchmarks/alpha-0.79/overtime-orientation-unconfirmed-01.txt) · [Structured provenance/discrepancy](benchmarks/alpha-0.79/overtime-orientation-unconfirmed-01.json) · [Local capture-behavior checks](benchmarks/alpha-0.79/orientation-capture-checks.json)

SHA-256: `9aed570a4ff2681db875ec717c31c2ebf0b5377d0cf7ee7a23aec1b2d09eb520` (2438 bytes). This is distinct from earlier captures. Device/browser is S21 Ultra / Brave from earlier chat, with raw device/notes still Not supplied. Actual thermal/refresh/power conditions and input/capture sequence are unknown.

| Field | Observed value |
| --- | --- |
| Scene | Overtime, controlled/unscored, safe HP |
| Active test age | 05:00 |
| Measured intervals / sampled seconds | 19,847 / 295.23 |
| Capture average FPS | 67.22 |
| Latest 300-interval FPS / p95 | 62.21 / 16.70 ms |
| Recent window duration | About 4.82 seconds |
| Intervals over 50 ms / maximum | 0 / 49.70 ms |
| Owner orientation / raw viewport | Landscape / 411×781 portrait |

Same build/loadout/Field/Street/composed/Reduced OFF as the prior current-build samples. Current/peak: 182/220 enemies, 600/600 XP gems, 20/45 gun shots, 0/1 hostile shots, 583/598 particles, 99/100 floating texts, 0/8 lightning, 0/2 bottles, 2/2 fires, 9/24 blade cooldowns and 40/123 burn cooldowns. These are object counts, not memory or temperatures.

Timing is consistent with an approximately 60-or-higher aggregate frame rate in this sample, with no recorded interval >50 ms. Its average is close to the preceding no-added-heat portrait report (67.79); recent FPS/p95 differ and describe only their own short windows. With the owner’s clarification this is evidence that the game became wide during play, captured after returning to portrait. The report lacks per-interval orientation history, so it is **not an isolated portrait-versus-landscape comparison**. There are five distinct reports total; the latest has owner-confirmed landscape play with a portrait capture.

### Captured orientation investigation

Source inspection shows resize reads browser innerWidth/innerHeight; a new live report freezes current game dimensions. An already captured report stays frozen after rotation, and a report opened from completed performance-fixture results uses the viewport held at completion. Three targeted VM observations pass: fresh capture after a wide resize says landscape; rotate an already captured portrait report and it remains portrait; finish a portrait fixture then rotate its results and its report remains portrait. These are expected snapshot paths, not a diagnosis of the owner's device. No physical auto-rotate lock, browser event failure, user sequence or reporting defect is established.

The owner’s wide-game/rotation-back clarification resolves the apparent contradiction; it does not establish a viewport bug. For a short isolated landscape measurement, confirm the game itself becomes wide, reset measurements after rotating, Resume and move/Dash about 30 seconds, then Pause and create a **fresh** report while still wide. Inspect the viewport line before download. If the game is visibly wide yet a fresh live report still says portrait, investigate that concrete mismatch; if it stays tall, check Android auto-rotate/rotation behavior. No gameplay/code change is justified from this report alone. Landscape, natural-run and actual update/lifecycle gates remain open.


Clarification outcome: owner confirms wide play, then portrait before capture. Preserve raw TXT and historical filename; update companion JSON provenance rather than altering the original viewport field. Existing aggregate metrics remain valid, but neither the full 295.23 seconds nor the latest 300 intervals can be assigned exclusively to landscape from the available timing history. No repeat five-minute run or game change is needed for this clarification; one fresh ~30-second wide capture after resetting provides the isolated comparison.


## Alpha 0.79 — landscape recapture of the same measurement

Robert then supplied another file, explaining **“I just switched it to landscape and captured the same report.”** Its viewport now reads **838×331 CSS px · landscape · DPR 1.75**. Comparison verifies the viewport line is the **only changed line**: every frame count, timing value, active age, presentation field and object count matches overtime-orientation-unconfirmed-01.txt. Treat these as two exports of **one performance observation**, not two runs. There remain five distinct observations across six raw files.

[Original landscape re-export](benchmarks/alpha-0.79/overtime-landscape-reexport-01.txt) · [Relationship and verification](benchmarks/alpha-0.79/overtime-landscape-reexport-01.json)

SHA-256: `d6d8ea6b415646dadf8a6da9a0a4f95b864e826ae9651d435bfdf4f002c1476f` (2439 bytes).

Unchanged measurements: 19,847 intervals / 295.23 sampled seconds, 67.22 FPS average, 62.21 recent FPS, recent p95 16.70 ms, zero >50 ms and maximum 49.70 ms. The actual phone report now verifies wide capture dimensions. Together with the owner's prior clarification, this resolves the apparent orientation contradiction and provides no evidence of a stuck viewport detector. Capture context does not reconstruct an orientation timeline for existing samples; the export is not an independent landscape-only benchmark. Keep the original report bytes and link the pair in metadata rather than overwriting either.

No need to resubmit this accumulated run or repeat the five-minute test. If an isolated orientation comparison is needed, collect a fresh short sample after resetting while wide and keep that orientation through capture. Natural scored-run, warm Crowded landscape and owner update/lifecycle gates are not closed by recapturing an existing report. No game change or new build follows this evidence.
