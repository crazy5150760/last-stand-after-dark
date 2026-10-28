# Alpha 0.83 — Installed Update Check

Target: S21 Ultra / Brave, installed Alpha 0.82 at https://crazy5150760.github.io/last-stand-after-dark/. This build changes only six native build labels and the PWA version label. All game logic, art, sound, inputs and save data remain byte-identical after label normalization. The CI branch filter now covers future alpha source branches. No new mechanic is part of this update test.

## Before publication

Keep a real exported JSON backup. Start a run in the installed Alpha 0.82, note its elapsed time/HP, Pause, and leave that game window open. The owner has confirmed readiness. Wait for confirmation that GitHub Pages published Alpha 0.83 before checking for the update.

## Phone checklist after publication

- [ ] With the old paused game still open, open https://crazy5150760.github.io/last-stand-after-dark/install/ in Brave and choose CHECK FOR UPDATES. Keep the existing app installed.
- [ ] Wait for Update ready: Alpha 0.83. Return to the old game: the same run should still be paused, with its time/HP/level intact. It must not reload, reset or silently resume.
- [ ] Finish that run when ready. Closing does not preserve a live run. Close every Last Stand game/app window and its setup tab, then reopen the home-screen icon. Check the title says Alpha 0.83.
- [ ] Check best time, Run Log and settings against the earlier state/backup. A normal update at the same address should keep them without an import, reinstall or storage clear.
- [ ] Finish/close again, enable airplane mode and reopen the icon. Alpha 0.83, art/audio and a short run should work. Reconnect afterward.

If setup still shows 0.82 or an incomplete download, keep the old run intact and report the exact message. We will distinguish CDN propagation, an old open client and a genuine update problem rather than claim success from unit tests. No forced activation, cache wipe, record import or reinstall is part of the update procedure.

## Verification and limits

Readable JS and the entire standalone compare exactly to Alpha 0.82 after the six label substitutions. The existing 27 offline-package cases exercise integrity rejection, prior-cache retention and the waiting lifecycle; generated caches and build IDs are distinct between the actual 0.82 and 0.83 payloads. GitHub CI runs the full existing game suite for the new alpha branch. Final counts and archive/hash verification accompany the artifacts. These checks do not establish real Android lifecycle behavior: the checklist above is the remaining device gate.
