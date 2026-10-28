# Alpha 0.84 — Clear Update Status

Target: S21 Ultra / Brave. This batch separates active and downloaded versions, removes fixed Alpha 0.80 setup labels, and adds restart help while an update waits. Status also refreshes on visible return, page-history restoration and controller changes. These events only query status; they do not check the network, download, activate, read records or reload a game.

Robert confirmed Alpha 0.83 activated after Android Settings → Apps → Brave → Force stop. He then confirmed retained records/settings and offline play worked. This is a tested fallback on his phone, not a universal browser requirement.

## Install this build

1. Keep a real JSON backup. At https://crazy5150760.github.io/last-stand-after-dark/install/ choose Check for Updates. The active 0.83 setup page stays old until this update activates; do not expect the new layout immediately after download.
2. When Alpha 0.84 is ready, finish your run, close every Last Stand game/setup tab and the installed window, then reopen the home-screen icon. If it still says 0.83, use the tested Brave Force stop fallback after finishing the run. Leave storage/app data untouched. Confirm the game main menu says ALPHA 0.84.

## Build checklist

- [ ] Reopen setup at the same address. It says SETUP & UPDATES, has no fixed Alpha 0.80 labels, and reports Active offline copy: Alpha 0.84. No downloaded-update row or restart-help panel appears when no update waits.
- [ ] Switch away and return; use browser Back/Forward to return to setup. The active version stays correct. Returning does not reload a game or start a new download by itself.
- [ ] How updates work remains available. A future waiting update will have its own Downloaded update label, say it is not active, and reveal Update still waiting in Brave? with the tested Force stop steps. This state is tested in automated fixtures; 0.84 is the newest release, so a second newer live update is not claimed as phone-tested yet.
- [ ] Best time, Journal and settings still match. Play briefly: hold the joystick while tapping Pause, resume, and check normal results/retry. Combat and balance should feel identical to 0.83; report any difference.
- [ ] Finish/close, enable airplane mode and reopen the icon. Play briefly and open setup offline to confirm Active offline copy: Alpha 0.84. Reconnect afterward.

## Verification limits

The worker template, manifest identity/scope, game save keys, media, combat and input code are unchanged. The readable main script and entire standalone normalize exactly to Alpha 0.83 after six native label replacements. No forced activation, reload, claim, unregister, cache wipe or import is added.

Five new UI cases cover active/waiting labels, controller/visibility/history refresh without downloads, and delayed-response ordering. The 32-case offline suite retains cache-integrity and previous-copy protection checks. GitHub CI also runs the existing full native suite and packaging checks. Device UI and browser lifecycle still require the owner checklist. Release artifacts record hashes, tests and publication provenance.
