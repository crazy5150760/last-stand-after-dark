> Current status: the public Alpha 0.82 Pages preview is deployed at https://crazy5150760.github.io/last-stand-after-dark/, and Robert reports the installed flow works. Alpha 0.83 is a label-only same-address waiting-update test. Keep the installed old paused run open until publication is confirmed, then follow PLAYTEST.md. Public GitHub source is accepted for now; the original Site remains unchanged. The historical Alpha 0.80 design below remains the implementation policy.

# Alpha 0.80 — installable web preview for review

This package adds a home-screen installation/offline setup flow around the accepted game. Combat, controls, menus, art, soundtrack, records and save format retain Alpha 0.79 behavior. The standalone game only changes its six build labels to Alpha 0.80. The home-screen icon opens the native game title directly; setup is a separate one-time page.

**Not published yet.** Android installation needs HTTPS hosting. Opening the downloadable HTML or extracting the hosted ZIP on a phone does not install a PWA. The standalone HTML still plays from Downloads. Existing hosted Alpha 0.1 has not been updated by this local work.

## Proposed phone flow

1. In your current game file, export a JSON backup and note best time/run count. Keep that file.
2. After private hosting is approved, open the existing Site's **/install/** address in Brave on the S21 Ultra. The exact installation link will be provided after hosting succeeds.
3. Choose **Prepare Offline Play** while connected. The first download is about 13 MB. Wait for **Offline play is ready on this device**. Partial, redirected, wrong-type or hash-mismatched content cannot count as a ready offline copy.
4. Choose **Add to Home Screen** when offered. If no button appears, use Brave's menu → Add to Home screen / Install app. A browser's install prompt is optional and its labels vary. Confirm the operating-system prompt.
5. Open the Last Stand home-screen icon. It should launch directly into the game's existing title, in a standalone window. Both portrait and landscape remain supported.
6. If this web address has no records, open Settings → Record Backups → Save / Restore Backup, review your known JSON and confirm replacement. If matching records already appear, do not overwrite them unnecessarily. The website/file/browser may have a different storage context. No automatic cross-context transfer is added.
7. Close the game after finishing a run. Enable airplane mode and reopen the icon. Game, guides, art and soundtrack should load from the prepared copy. Complete a short run, check held results, then reopen to check records. Browser/OS storage cleanup can still remove offline data; keep an external JSON backup. Reconnect and use Prepare Offline Play again to repair removed game files through the existing worker; this does not restore browser-deleted records.

The page shows installation requested after prompt acceptance; it only reports completed installation when the browser sends appinstalled. Unsupported/file contexts display instructions without registering a worker. The browser's native install behavior remains a device acceptance check.

## Updates and live-run protection

- Updates use the same Site address, manifest ID/start URL and browser-local save keys. The JSON format is unchanged. Cache cleanup never reads/deletes journal, best-time, preferences or recovery keys.
- Finish your run, then return to **/install/** and choose **Check for Updates**. On supported Android launchers, long-press the Last Stand icon → **Setup & Updates**; the direct installation link remains the fallback. A new copy must pass all offline-file checks before the worker can finish installation. A failed update leaves the existing complete copy in place.
- An update waits while any old game/setup window remains open. **Close this setup page and every game tab/app window, then reopen the icon.** The new worker activates through the browser's ordinary lifecycle. It never calls skipWaiting, claims an existing page, sends a reload command or reloads an active run.
- Closing the game ends that live session. Active-run resume is not added. Do not close a run merely to apply an update unless you intend to leave it.
- The setup page reports active versus waiting versions. An old setup page can announce a waiting new version; its footer belongs to the current page, not necessarily the waiting copy.
- Offline navigation is cache-first for this package's exact files. Unknown paths, third-party requests, uploads and record-backup files are not cached. Old cache removal is restricted to this app's registration scope. No unrelated cache or browser records are cleared.

This is the proposed update policy for owner review: no forced mid-run activation or restart. Browsers can check/download worker updates on navigation as well as a manual check, but activation still waits for old clients to close. Background installation can consume resources; use the setup page after finishing a run.

## Package contents and existing Site

- **Standalone HTML:** same game, file-play compatible; no worker registration or installation UI is inserted into its runtime.
- **Hosted ZIP:** eleven files at ZIP root: index.html, manifest.webmanifest, sw.js, install/index.html, install.js, install.css, three PNG icons, _headers, build-info.json. Extract to the static hosting root, keeping paths together.
- **Full source ZIP:** original game/media plus readable source, PWA templates/icons, builders and tests. No repository download, framework, npm dependency, account or cloud save is added.
- Existing Site ID remains **appgprj_6ad44e1d8fa48191b59d8c10b22c7a86**. The local hosting manifest now points to generated **web-dist**. Site audience and deployed content have not changed. Source synchronization/publication remain the next review step.
- The worker URL and manifest ID/scope stay stable relative to the hosting root; build-specific cache IDs include all cached content and worker-template bytes. Eight static responses are hash/MIME checked. Auth redirects or transformed HTML cause setup to fail safely instead of caching a login or mismatched game.
- The _headers file requests revalidation for worker/manifest/entry/setup files. Host support, real response MIME/redirect rules, private-host authentication, worker scope and byte preservation must be confirmed on the approved HTTPS deployment.

## Build and local checks

```
node tools/build_game.cjs
node tools/build_pwa.cjs
node tools/build_game.cjs --check
node tools/build_pwa.cjs --check
node tests/pwa.test.cjs
LS_TEST_GC=1 LS_TEST_PROGRESS=1 node --expose-gc --max-old-space-size=512 tests/game.test.cjs
```

web-dist is generated/ignored and can be rebuilt from source. PNG icons are committed; normal builds need no Python/image library. tools/make_app_icons.py reproduces the original monogram icons with Pillow/DejaVu Sans if deliberately regenerating them. Existing world/actor/title/music assets are unchanged.

The standalone remains below 12 MiB. The hosted game adds only manifest/icon metadata in its head; its main script is byte-identical to the standalone. The approximately 13 MB hosted package has separate small setup/icons/worker files. Keeping an old and a new offline copy temporarily takes additional storage. No game renderer, actor image set or runtime subsystem was added.

## Owner acceptance after HTTPS hosting

- [ ] Prepare offline copy; verify no ready message on a deliberately interrupted first download in a disposable test context.
- [ ] Install from Brave; home icon opens the game directly and both orientations work.
- [ ] Airplane-mode reopening loads game/art/audio/guides and allows a full short run. Return online afterward.
- [ ] Import/review your known backup only if needed; best, Run Log and preset/Bestiary data match. Reopen the same installed app to confirm persistence.
- [ ] Joystick + second-finger Pause/Dash, Back, rotation/background, frozen choices/results and fresh replay retain accepted behavior.
- [ ] With a second **distinct build** privately staged, keep a run open while setup finds the update. Run stays intact, update waits; finish/close all windows/reopen applies it and records remain. The first package alone cannot prove a two-version update on Android.

Automated checks use Node VM mocks for worker cache/network/lifecycle/UI and the actual generated payloads, plus the native game suite. They do not establish browser install eligibility, private-host compatibility, actual Android service-worker timing, launch/offline UX, storage durability or updated-build behavior. No managed browser is available; no preview server/browser installation was used. The next concrete step is owner-approved private hosting on the existing Site, followed by the checklist above.
