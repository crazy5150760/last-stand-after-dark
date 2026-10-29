# Last Stand: After Dark — keeping records between builds

Alpha 0.80 adds a separately hosted installable/offline web package around the accepted game. Keep Alpha 0.79 and an external JSON backup. The standalone HTML still plays from Downloads; the website/installed app may use a separate storage context.

## Before changing files or browsers

1. Open the game file/browser that currently shows your real records.
2. From Main Menu, open **Settings → Record Backups → Save / Restore Backup**. On held results, open **Reports, Backup & Guides → Save Backup**. If a scored save fails, Save Backup remains near the top beside the warning.
3. Choose **Download Backup JSON**. Verify a nonempty JSON file is in Downloads, and keep it separately from the game HTML. If downloading fails, copy **Your Backup Text** into a plain-text file without changing it.
4. Note the best time and recorded-run count. Keep the old HTML too. A downloaded backup contains saved presets, survivor selection, Bestiary data, totals, bounded Run Log and best time. It does not include an active run, earned in-run powers, audio/presentation settings or diagnostic captures.

## Open the new build

Open **Last_Stand_After_Dark_Alpha_0_80.html** in your usual Android browser. A different HTML/content URL or browser can use different storage; blank records do not by themselves mean the old file lost its data. Reopen the old file if needed. Downloaded builds do not automatically synchronize storage or cloud saves.

If your records already appear, no import is needed. If they do not, go to **Settings → Record Backups → Save / Restore Backup**, select your saved JSON with **Open a Local Backup File**, or paste it and choose **Review Restore**. Compare the run count and best time before pressing **Replace Records With Reviewed Backup**. Restoring replaces records; it does not merge. Cancel/Edit or phone Back cancels the review without replacing records.

Confirmed restoration first validates, writes and reads back one previous-records copy. Only then does it write and read back both the journal and best-time keys. Success returns to Main Menu with a read-back-verified toast. The old format-one backups remain supported; no preference or active-run migration was added.

## Undo the most recent restore

In the **same storage context**, open **Settings → Record Backups → Save / Restore Backup → Previous Records Copy → Review Previous Records**. Review the counts/time, then either cancel or confirm replacement. The same confirmation protections apply. After a successful undo, the records it replaced become the next previous-records copy. This is one slot, not an archive. The expandable section appears only if a readable supported copy exists.

Changing files/browsers, clearing site data, private browsing or the OS reclaiming storage can make that copy unavailable. It is in the same browser storage as the records. An external JSON is the portable backup. Recovery is manual; no startup dialog automatically replaces records.

## If storage fails

The game refuses replacement if it cannot verify the safety copy. If either active write fails or reads back incorrectly, it attempts to restore and verify both original raw values, including originally absent keys. The current session keeps its old record/journal data when restoration fails.

If storage also rejects rollback, the screen says so explicitly. **Export the current session's backup before closing** and keep any earlier external backup. A local previous-records copy may still be reviewable. Do not assume a failed restore completed or keep repeatedly replacing data while storage is unavailable. Ordinary saves also verify their read-back in Alpha 0.75; this build adds no background synchronization or multi-tab transaction support.

Multiple localStorage keys are not an atomic transaction. Closing/killing the browser between writes can leave a mixed pair; the prior snapshot enables manual recovery if it survived. Read-back verifies what the browser currently returns, not guaranteed persistence after power loss or storage eviction. A newer-format journal remains protected from replacement by this build.

## An ordinary run or settings change could not save

Best time, journal and preference writes read back the exact value before claiming success. If a scored run's best time or journal cannot be verified, results show **Records Not Fully Saved** above the stats, with **Save Backup** and **Try Saving Again**. Export the complete current-session JSON before closing. The retry writes the current best and existing journal; it keeps the held stats and does not log or reward the run again. If storage is still unavailable, the warning stays. Returning from Backup does not silently retry.

Every finished scored run attempts to save the current best, including a shorter run after an earlier failure. Preferences retain your current choices in memory but show a visit-only message when storage cannot verify a change; a later settings change retries their normal save. There is no automatic timed retry or background loop. Future-version logs/preferences remain protected; a newer log gets a temporary-run notice rather than an unavailable export instruction or retry action. Training and developer tests never save scored results.

Ordinary saving/retry does not overwrite the Previous Records Copy. It is reserved for confirmed restores. Read-back does not add crash atomicity, power-loss durability or protection against a different tab overwriting storage. Keep an external JSON and avoid simultaneous play in multiple tabs during an update.

## Short owner acceptance check

Export your real records first. Import that known backup into 0.80, review/cancel once, then confirm. Reopen the same file and check best time, Run Log, survivor and Bestiary. Review the previous-records copy and cancel without replacing it. If you deliberately test undo, export the current state first and reimport the known real backup afterward. Avoid using an unrelated test JSON on your real records.

Finish one ordinary short run and check held results, records, Retry, joystick with second-finger Pause, phone Back, background/resume and audio sliders. Gameplay, difficulty, art and music should feel unchanged. Report any missing records, mismatched counts/time, unexpected restore or failed download; include the old/new filename and browser.

## Rotation and browser interruptions

Alpha 0.76 pauses active play when the viewport switches between portrait and landscape; Resume and a fresh joystick drag are required. Other frozen menus/choices/results stay in place. An upgrade or restore gesture, or results touch, begun before an interruption cannot act on its delayed release afterward. Use a fresh activation. Same-orientation resizing still clears input without forcing Pause. Browser freeze notifications use the same suspend path as leaving the game. This protects the live session; it does not save an active run or recover one after reload/OS termination. External record backups and save verification work as before.

## Deliberate ending and browser controls

In Alpha 0.77, End Run in scored play opens a review; Cancel/Back leaves Pause and fresh confirmation records the native abandoned result. Extract/Stay also require a fresh activation after a short opening guard. Neither review nor cancellation saves a completed run. Results reject scrolling/held-key/interrupted gestures; a fresh activation works without an opening delay. Escape follows Back, while P deliberately toggles Play/Pause. These controls do not change the backup format, scoring or recovery copy.

## Exit practice does not create a real victory

Alpha 0.78 adds Play → Practice & How to Play → Training → Exit & Overtime Practice. Its immediate beacon and ten-second return are practice-only. Extract holds unscored training stats; Stay uses normal landing safety. Neither choice writes your personal best, Run Log, Bestiary, totals or a saved victory. Training medal display is suppressed. Real runs still require the normal boss/three-minute unlock and normal overtime wait. Your JSON backup remains the same format.


## Consolidated results in Alpha 0.79

The results summary and next-run actions are above expandable All Run Stats, Build & Run Analysis, Records & Medals, and Reports, Backup & Guides. Opening these groups does not write records or resume combat. Existing backup/retry controls stay prominent when a scored save fails. Returning from a tool rebuilds the same held result with groups closed; opening them again does not log a duplicate run. Backup format and previous-records recovery are unchanged.


## First web installation and routine updates in Alpha 0.80

First export from the file/browser that holds your records. After the private HTTPS installation link is provided, prepare offline play and install/open the web game. If records are missing, use the existing reviewed JSON restore; do not assume file-to-web data moves automatically. Matching existing records need no overwrite. Active powers/runs and presentation preferences are not carried in the records backup.

Later updates at the same Site URL/browser keep the same localStorage keys and version-one JSON. The offline worker caches only verified static game/setup files and removes only its own obsolete scoped caches; it never changes records or the Previous Records Copy. A new complete cache waits for all old game/setup windows to close. Finish a run first, then close all windows/reopen the icon; closing is not active-run resume. Failed setup/update cannot count as a new ready copy. OS/browser storage cleanup can still remove data; keep an external JSON. See INSTALL_UPDATE_GUIDE.md.
