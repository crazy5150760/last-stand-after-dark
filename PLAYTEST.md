# Last Stand: After Dark — Alpha 0.82 · Phone Settings Cleanup

Phone target: Samsung Galaxy S21 Ultra / Brave. Keep Alpha 0.81 and an external JSON record backup. Open **Last_Stand_After_Dark_Alpha_0_82.html** from Downloads. If Brave gives the new file separate storage, use your existing reviewed JSON import only when records are missing. Installation/publication remains parked; this build makes no network retry.

## Owner checklist

- [ ] **Find your settings.** Open Settings from the title. Find four collapsed groups: AUDIO & VOLUME, CONTROLS & WARNINGS, VISUALS & EFFECTS, and UPGRADE HIGHLIGHT. Phone Performance and Record Backups stay available. Main Menu / Back is now near the top.
- [ ] **Stay in place.** Open Visuals & Effects, scroll down and toggle Screen Shake, Damage Numbers or Reduced Effects. The group should stay open, your scroll position should remain steady, and the changed button should retain keyboard focus. Change a HUD/actor/scenery selector: the same section should remain open. These section/scroll choices reset on leaving and reopening Settings.
- [ ] **Sound and controls.** Open Audio & Volume; try a slider, mute and a short sound test. Open Controls & Warnings; try Left-handed controls, then set your preferred layout back. Existing values should save as before. Upgrade Highlight still changes card highlighting only, not upgrade probabilities.
- [ ] **Return safely.** Enter Settings from Pause and return with the top button or phone Back. The run must stay paused until Resume. Enter Settings from held results and return: the run/stats should remain finished and frozen. Paused Settings still cannot start a record restore.
- [ ] **Phone comfort.** Repeat opening/scrolling/changing settings in portrait and landscape. Check normal movement, second-finger Pause/Dash, upgrades, extraction, results/replay and records. You do not need to repeat a long benchmark capture for this menu update.

Report jumping scroll, a group closing after a change, missing controls, accidental navigation/resume, lost settings, cramped labels or Back problems. Set any test preferences back to your preferred values afterward.

## Verification scope

Existing settings/audio/preferences/Back/focus/benchmark/pause cases are selected from the native suite. The existing focus-redraw check is extended for an open section and retained scroll; no new tests mirror the section labels. The full Alpha 0.81 baseline has 1,333 passing game checks. A source comparison verifies all game code outside Settings/diagnostics presentation and six build labels is exact; listeners and save/selection behavior are also compared. The optional prepared offline package is rebuilt and its 27 checks are run, without publication.

Final current-build results: 185/185 selected native checks and 27/27 prepared-package checks passed. Source comparisons and ZIP verification are recorded in BUILD_INFO.json and the included logs. This is Node VM/mock verification, not real Android rendering. Phone layout, native details expansion, touch scrolling and physical lifecycle behavior remain owner checks. Core gameplay, artwork, music, saves, Pause briefing and original Site identity remain unchanged.
