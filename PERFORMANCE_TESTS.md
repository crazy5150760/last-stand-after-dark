# Main Game Performance Test — Alpha 0.73

Use **Main menu → Development Previews → Main Game Performance Test**. Choose Early, Crowded or Overtime. These scenes use the main overhead renderer, native weapons/AI, current actor art, scenery, HUD and touch controls. Player HP is safe, target deaths count only as practice, and settings are temporary. No report is sent automatically.

## Scene definitions

| Scene | Initial fixture clock | Target population | Replenished XP gems | Fixed loadout |
| --- | --- | --- | --- | --- |
| Early | 00:00 | 12 Shambler/Runner targets | 0 | Starting gun, 18 damage, 0.33s volley, one bullet |
| Crowded | 02:30 | 100 total, including Breaker, Spitter and Guard | 160 | Gun ×3, 54 damage, 0.2s volley, Pierce I, Lightning III, Blades II |
| Overtime | 10:00 | 220 total, including two Spitters/two Guards/Howler/Lobber/16 Hunters | 600 | Gun ×5, 120 damage, 0.14s volley, all four evolved weapon paths |

All scenes use Survivor/Downtown/Standard/no contract privately. Your selected normal survivor, route, rules and contract remain intact. Initial scenery is fixed: four decorative service pads, two fuel barrels, one wood barricade and one shock drum. Initial enemy positions and loadouts repeat on Restart; native combat randomness and your inputs are not replayed deterministically. Target/gem counts can dip between 0.2-second refills. Crowded's Breaker clears immediately on death and returns after a short gap. Overtime's Hunters are a controlled mixture, not an actual timed Blackout reward event.

## Repeatable phone capture

1. Enter **Crowded** with your usual settings. Wait at least five active seconds and let all actor art finish loading.
2. **Pause → Reset measurements → Resume.** Move/Dash and fight for approximately 30 seconds of active test time.
3. **Pause → Capture phone report.** Enter device/browser and a short observation, such as “S21 Ultra, Brave, portrait, cool phone, steady” or “warm, hitch during fuel blast.” Download the TXT or copy its text.
4. Repeat **Overtime**. Those two reports are the most useful first measurements. Early provides a lighter baseline.
5. Repeat in landscape, or after comfortable sustained play, when assessing orientation/warm-phone differences. Keep browser, refresh/power settings and test actions reasonably consistent; note differences manually.

For comparisons, use **Pause → Run HUD & Field Status** for actors/scenery/HUD and **Settings** for Reduced Effects. Changes clear timing samples but preserve the current scene. **Restart Scene** afterward to reset layout/loadout and practice counters, wait for art/warm-up, then reset measurements again. Restart and scene selection stay paused. Use the same diagnostic setting in each capture.

Pause, Back, backgrounding and reading reports freeze simulation. Resume explicitly. Back from the report returns to Pause. End Run holds test stats and restores normal settings; the result's Test Report and Settings benchmark retain the completed test's frozen measurements. Restart Test repeats its captured preset and presentation privately. Main menu or a fresh normal deployment clears fixture powers and clocks.

## What the numbers mean

- FPS, p95, slow intervals and sampled seconds use raw browser requestAnimationFrame intervals. The first five native active seconds are excluded. A missing sample remains **Unavailable**, not an assumed frame rate. Native capped simulation time drives test age; on slow frames it can differ from raw sampled seconds.
- Recent FPS/p95 covers at most 300 intervals; totals/peaks cover samples since entry, reset or presentation change. Modal/background gaps are excluded. Art decoding after warm-up can still affect measurements; wait and reset again when comparing steady play.
- Counts are current/peak object counts, **not RAM/GPU memory, temperature or battery readings**. The native counter list is unchanged.
- The fixture adds refill work and training-target feedback/HP bars, while safe HP suppresses normal damage/death feedback and real rewards. Synthetic loadouts, fixed counts and disabled timed goals also differ from scored play. Treat results as repeatable pressure observations, not balance evidence or a guarantee of natural-run FPS.

The development environment can check timing logic and native state but cannot measure your Android GPU/browser. No real phone FPS has been established by the automated tests. Please share the **Crowded and Overtime TXT reports** to guide the next performance fixes. Ordinary scored-run captures remain useful validation afterward.


## Received owner observations

The [recorded baseline](PERFORMANCE_RESULTS.md) now contains distinct Alpha 0.73 portrait captures:

- Crowded: 90.11 FPS overall, 75.81 FPS recent; latest-window p95 16.70 ms; one interval over 50 ms (maximum 58.20 ms) across 36.48 sampled seconds.
- Overtime: 73.09 FPS overall, 60.17 FPS recent; latest-window p95 16.70 ms; no intervals over 50 ms (maximum 24.90 ms) across 34.56 sampled seconds. The first two uploads were duplicates of this one observation.

These support the initial portrait pressure-test target, with one brief Crowded hitch on the watch list. They are owner-supplied timings, separate from VM tests. Device/browser and thermal notes, landscape, sustained warm play and ordinary scored-run performance remain open. Continue Android reliability/save-update validation with those device checks included; choose renderer fixes from a reproducible problem rather than inferred headroom from average FPS.


## Alpha 0.79 hot-portrait evidence received

Robert supplied a hot-dashboard Overtime report on 2026-10-26, with S21 Ultra / Brave confirmed in chat. The original raw fields remain unchanged. It measures 6,243 intervals / 103.93 seconds at 60.07 FPS overall, 59.87 FPS recent, recent p95 16.70 ms, maximum 49.70 ms and zero intervals >50 ms. This is longer hot-condition portrait evidence; it does not establish landscape, active-input/natural-run performance or a measured thermal threshold. See PERFORMANCE_RESULTS.md for provenance/comparison/limits. Continue ordinary indoor play for repeatable warm testing; no deliberate dashboard heating is needed. Keep renderer/tuning unchanged unless further captures locate a reproducible problem.


## Alpha 0.79 portrait comparison without added dashboard heat

A second distinct current-build Overtime portrait report measures 20,007 intervals / 295.15 seconds: 67.79 FPS overall, 71.28 recent, recent p95 24.90 ms, maximum 58.40 ms, two intervals >50 ms (about 0.01%). Same viewport/build/presentation as the hot-dashboard capture; owner describes no added dashboard heat, not a sensor-verified cold condition. The average is higher but recent pacing is more variable, so do not call every aspect an improvement or infer thermal causation. Preserve this longer portrait observation without changing the game. Landscape and natural scored-run measurements remain pending. See PERFORMANCE_RESULTS.md for the comparison.


## Orientation mismatch in the next owner report

The owner-labelled landscape report measures 295.23 seconds / 19,847 intervals, 67.22 FPS average / 62.21 recent, latest p95 16.70 ms, zero >50 ms, maximum 49.70 ms. It reports **411×781 portrait**; Robert then confirmed the game became wide but he rotated back before capturing. Wide play is owner-confirmed and the capture dimensions are explained; isolated landscape measurement still needs an orientation-consistent reset/capture. Existing/finished reports retain captured viewport; rotating after capture does not relabel them. For a fresh landscape sample, verify the game itself becomes wide, reset measurements after rotating, move/Dash ~30 seconds, and open a new live report while still wide. Read the viewport line before downloading. Source review plus three VM capture/rotation checks pass but cannot identify the physical device sequence. See PERFORMANCE_RESULTS.md for raw evidence and investigation.


Landscape recapture follow-up: a new export of the same accumulated run reports **838×331 landscape**. Only the viewport line changed; 19,847 intervals / 295.23 seconds and every timing/object value are exact matches. This verifies wide capture on the phone and resolves the mismatch. Link it as a re-export of one measurement, not a new landscape-only sample. No need to resend this run; any isolated comparison uses a short fresh reset/sample while wide.
