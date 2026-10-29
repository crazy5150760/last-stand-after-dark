# Automatic updates from the normal game link

Owner request: updates should happen automatically without opening a second link.
The approved scope is the hosted update shell. The Alpha 0.86 standalone, all
50 gameplay source modules, original art, saves and worker lifecycle are unchanged.

## Behavior

The hosted game embeds pwa/game-updates.js after the unchanged game script.
Opening the ordinary HTTPS game registers its own worker if needed, or checks
the existing owned registration. Visible returns, page restore and reconnect
events also check, with a 15-minute success cooldown, a 30-second failure cooldown
and one request at a time. Hidden/offline pages do not start downloads. File/unsafe
origins and unrelated or inherited registrations are left alone.

The unchanged worker downloads and SHA-verifies the complete release. It waits
while old game/setup windows remain open. After finishing the run, closing all
windows and reopening normally activates a ready release through the browser's
normal lifecycle. There is no separate update-page visit, update button, forced
reload, skipWaiting, clients.claim, storage rewrite or automatic app installation.
An app kept open indefinitely continues its current version. A new update cannot
replace a failed/incomplete offline download. An offline launch keeps the current
ready version; it cannot download a new version without a connection.

The optional setup page remains for first home-screen installation, readiness
diagnostics and explicit offline repair. It is no longer required for routine
updates once this shell is published and received. The first migration from an
older app still follows that old app/browser's update lifecycle; this code cannot
run inside a copy that has not received it yet. Opening the normal game online and
then closing/reopening after a verified download is the intended transition.

## Preservation and identity

The game version remains Alpha 0.86 because no gameplay changes are made; the PWA
build hash changes to identify the new hosted shell. Do not claim all production
bytes still match the old infrastructure baseline. The original release hashes
and legacy fixtures remain immutable. The new preservation test instead compares
the complete hosted output against the unchanged standalone plus the exact
authorized manifest links and update helper. There are still 11 production files
and eight verified cached assets; no extra runtime script URL or CDN is added.

## Verification and publication

Nineteen focused tests cover origin/scope ownership, registration, reconnect,
visibility/load timing, throttling, concurrency, failure and waiting protection.
The existing native/PWA suites remain unchanged. Real Chromium integration also
tests two actual generated worker versions using the game URL only, a preserved
paused run/records while the new worker waits, natural activation after all clients
close, and offline reopen. Consult the PR's actual CI result before claiming that
browser scenario passed. Local browser sockets are still blocked.

This is source preparation until deployment is separately verified. No generated
HTML was uploaded through the connector. Main/live/Site protection and the real
publishing identity requirements remain in DEPLOYMENT.md. A passing source test
is not evidence that the owner's currently installed game already auto-updates.

## Phone checklist for a deployed candidate

- Use the existing game address or its home-screen icon; leave the setup page
  closed. Verify the normal game, touch/Pause and saved records still work.
- With two test releases available, keep a run paused and reconnect. A new release
  may download, but the run, clock and settings must not reset or change version.
- Finish the run, close every game window and reopen normally. The downloaded
  release should be active without visiting another link or pressing Update.
- Reopen offline afterward. The ready game must load, with records/settings intact.
- If a download fails or the device is offline, the older ready game must remain
  usable. Report the app/browser window situation if an update keeps waiting.

Do not close a valuable live run to test migration: there is no active-run save.
