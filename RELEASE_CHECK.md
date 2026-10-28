# Last Stand: After Dark — Android/browser release check

Use **Alpha 0.79**. Robert accepted its results-screen changes. This checkpoint changes no game code, art, music, balance or save format. The release-check HTML is byte-identical to the accepted Alpha 0.79; its separate filename helps test opening another downloaded file. It is not Alpha 0.80 or an installable app.

Allow about **15 minutes**. Keep the browser and your usual presentation/refresh/power settings consistent. Robert confirmed **Samsung Galaxy S21 Ultra / Brave** for this round; put that in each report, adding the Brave version if known. No report is uploaded automatically.

## 1. Back up and open the test copy

- In the file that currently has your real records, use **Settings → Record Backups → Save / Restore Backup → Download Backup JSON**. Keep that JSON and the old game file. Note best time, completed-run count and a recognizable Run Log entry/preset/Bestiary count.
- Open **Last_Stand_After_Dark_Alpha_0_79_Release_Check.html** in your usual browser before starting any new runs. Different file/content URLs may share storage or have separate storage; do not assume either.
- If records are blank, review your known backup, compare its best time/count, then confirm replacement. If this copy already has matching records, review the backup and cancel; report **shared storage / full transfer not exercised**. Do not clear storage or replace newer records merely to force a test. A separate already-installed browser can provide an isolated context if you choose to test full transfer there.
- Reopen the same test file/browser. Confirm the best, count and recognizable entry/preset/Bestiary data. Active-run weapons and presentation settings are not part of a records backup. Continue using the test copy for this session; new records do not automatically flow back into another file/browser. Export a fresh backup after the session if you keep its results.

## 2. Play a normal run in both orientations

Use **Survivor / Downtown / Standard / no contract** for a comparable baseline. Start at the title and review the deployment screen. From Pause, open **Settings → Phone Performance**, start measuring and reset measurements, then return to Pause and Resume.

- Play normally in portrait. Read upgrade choices, use joystick + second-finger Dash/Pause, and reach the real three-minute exit after a boss defeat when encounters are clear. Choose **Stay** once if practical. No developer shortcuts or safe-HP fixtures for this normal-run check.
- After roughly 3–5 minutes of ordinary play, Pause → Settings → Phone Performance → open the report. Enter phone/browser and notes such as **normal portrait; 4 minutes total play; cool/warm; smooth or hitch description**. Download/copy the TXT. Name it separately so later reports do not overwrite it in Downloads. A short/failed run is useful too; record its actual duration.
- Return to Pause, rotate to landscape, reset Phone Performance measurements in Settings, then Resume with a fresh joystick drag. Play another 3–5 minutes if practical. Capture a second report labelled **normal landscape**. Reset between orientations so a report's totals describe one condition. Verify the game itself becomes wide; before downloading, check that a fresh report says landscape with width greater than height. Rotating an already open report or completed fixture results retains the original captured viewport. Several runs are fine if you die early; note when a new run started.
- During play, press phone Back once, then briefly background/return. Both should leave the run paused until explicit Resume. Rotation also pauses active play. There should be no delayed Dash, movement or upgrade selection on return. Reading an upgrade or exit choice must not advance time. At the main title, Back may exit normally.
- Extract when ready. If you die or end manually instead, record that outcome without calling it an extraction pass. Inspect held results and details. Open a report/guide/settings and return to the same result. Try One More Run: time and powers must start fresh and the finished run must be logged only once. Run Log and Main Menu deliberately leave the results view.

Keep approximately **ten minutes of active play total** before the next section, across runs if necessary. This is a repeatable warm-session condition, not a measured temperature. Record if the phone felt cool, warm or unusually hot; do not infer a temperature from the game's counters.

## 3. Capture warm landscape pressure reports

Use **Main Menu → Development Previews → Main Game Performance Test**. Use your usual Field actors / Street scenery / composed HUD unless you normally play differently; note the actual settings. These fixtures have safe HP and do not award real records, so their results are performance observations rather than normal-run balance evidence.

1. Enter **Crowded** in landscape. Wait at least five active seconds and for actor art to finish loading. Pause → **Reset Measurements** → Resume. Move/Dash and fight for about **30 active seconds**.
2. Pause → **Capture Phone Report**. Enter phone/browser and notes: **Crowded; landscape; warm after approximately __ minutes; settings; smooth/hitch location**. Download/copy the TXT. End the test when ready.
3. Repeat with **Overtime** for another 30 active seconds, labelled separately. Verify ending/restarting practice does not add scored runs or change your normal deployment/presentation choices.

If something hitches, describe what was happening: an explosion, dense crowd, boss warning, rotation, startup or background return. Keep the original report rather than reporting only average FPS. Reports contain recent-window FPS/p95 and whole-capture totals/peaks; those are different windows. Counts are not RAM, GPU memory, battery or temperature measurements.

## What to send back

Use **RELEASE_CHECK_REPORT.txt** for a short reply. Attach or paste the four benchmark reports if possible:

1. Normal portrait.
2. Normal landscape.
3. Warm Crowded landscape.
4. Warm Overtime landscape.

The reports are the useful evidence; you do not need to calculate FPS yourself. Include the filename/browser, actual time played, whether records transferred or storage was shared, and any stuck control, missing record or persistent slowdown. Do not send your personal backup JSON unless you specifically want its contents inspected.

## Developer verification and remaining gates

| Check | Local evidence | Device acceptance |
| --- | --- | --- |
| Accepted game and original Site identity | Same Alpha 0.79 HTML hash and hosting manifest; offline build current | New filename/storage context still needs phone check |
| Title → deploy → upgrade → boss → Stay → extract → held tools → fresh replay | Two accelerated VM journeys, 412×915 and 915×412 | Natural run, physical controls/layout, OS Back/background pending |
| Alpha 0.78 → 0.79 JSON transfer | Real packet generated from isolated old-build session; upgrade, boss discovery, preset/history preserved; no active powers imported | Owner's actual backup, picker/download, file URL and reopening pending |
| Review cancellation / verified replacement / previous-records recovery | Dedicated isolated mock-storage workflow passed | Actual browser persistence still pending |
| Early / Crowded / Overtime fixtures | Six orientation/isolation cases passed; zero FPS intervals simulated | Two Alpha 0.79 Overtime portrait reports received; landscape/natural-run checks pending |
| Full existing regression | Accepted game previously passed 1,326 checks plus 230 focused; game bytes unchanged | General owner acceptance received; quantitative release gates still open |

**Ten additional local workflow checks passed.** These use the actual inline game in the existing Node VM/mock DOM/history/Canvas/storage/clock harness. They accelerate clocks/encounters and use controlled native hits; they are not natural gameplay, physical Android, screenshots, browser layout, storage-durability or device performance proof. No browser capability is available in this environment. The full regression was not repeated for this documentation/check-tool-only checkpoint.

The two older Alpha 0.73 Crowded/Overtime portrait captures are now joined by one Alpha 0.79 hot-dashboard Overtime portrait capture: 103.93 sampled seconds, 60.07 FPS overall / 59.87 recent, recent p95 16.70 ms, maximum 49.70 ms, zero intervals >50 ms. This is useful hot-portrait evidence, with thermal conditions described by the owner rather than measured. A second Alpha 0.79 Overtime portrait capture without added dashboard heat measures 295.15 seconds / 20,007 intervals, 67.79 FPS overall / 71.28 recent, recent p95 24.90 ms and two >50 ms intervals (maximum 58.40 ms). Its average is higher but its recent pacing is more variable. These four distinct captures do not close active warm-landscape or natural-run checks. Aim for smooth ordinary play around 60 FPS; pressure fixtures do not yet have an agreed minimum supported floor. Select fixes from reproducible behavior and frame reports, not a single average or assumptions about spare capacity. Installation/distribution is a later owner decision; nothing has been published or synchronized.

## Reproduce the local workflow check

```
node tools/release_check.cjs /absolute/path/Last_Stand_After_Dark_Alpha_0_78.html /absolute/path/local-verification.json
node tools/build_game.cjs --check
```

The checker reuses tests/game.test.cjs only as a VM harness and does not expose a test API in the delivered game. Its old-build session records are synthetic fixtures, never the owner's backup.


Latest report status: Robert labelled a new five-minute Overtime capture landscape, but its raw viewport says 411×781 portrait. Robert clarified that the game became wide, then he rotated back before capturing. Timing (67.22 FPS overall / 62.21 recent; zero intervals >50 ms) remains valid aggregate data, and landscape play is owner-confirmed. The report has no sample-by-sample orientation history, so do not treat it as an isolated landscape comparison. A fresh ~30-second sample reset/captured while wide is sufficient; no repeat five-minute run is required. Three local snapshot/rotation observations pass and do not establish a device fault.


Orientation follow-up resolved: the owner recaptured the same report while wide; it now says **838×331 landscape**. All frame/timing/count values remain unchanged and only capture dimensions differ. Wide capture is verified and the report pair counts as one observation. Existing frame samples have no per-frame orientation history, so a re-export does not create an isolated landscape measurement. No need to resend the existing five-minute run.
