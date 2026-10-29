# Remote restructuring delivery — 2026-10-29

Merged PR: https://github.com/crazy5150760/last-stand-after-dark/pull/6
Main integration commit: 73071cf86a93a8ab85fa61a72681b59bf5729fb5
Reviewed source: 82b41b8bcd9001f99c91cded5ac79cc7e3c1e17e
Exact merged/source tree: ed41f7d72e92426f66fb08f8cf73c4585bf51e32

## Completed evidence

- Source run 40951381229 and main-targeted PR run 40951392724 both passed
  1,368 gameplay cases, 32 PWA cases, three URL/MIME cases and seven preservation
  cases: 1,410 total each, zero failures/skips. Builds and packaging also passed.
- Real Chromium passed at 412x915 and 915x412: mobile-emulated launch/layout,
  touch joystick plus second-finger Pause, frozen clock and Settings return;
  all 21 images and the original 48-second stereo OGG decoded. Separate standard
  contexts passed offline reload and fresh-page launch. No loading errors.
- PHONE_ACCEPTANCE.md records the owner's passing S21 Ultra / Brave functional
  report. No instrumented FPS, heat, storage-durability or APK claim is made.
- The owner explicitly authorized the merge and future routine verified merges.
  PR #6 merged normally, retaining both parents; the resulting tree exactly equals
  the tested candidate. Main's original files and the full release ancestry remain.
- All 11 production files remain Alpha 0.86 / build 7cf8f34890269ad6. The preserved
  baseline remains eedabcf9ac85951671e9e0c20f0b7794ce6fc4c9. Live gh-pages remains
  ac9580725c4b25bfe74c653f51b09603b1a519f5. No game update or Site publication occurred.

Source CI: https://github.com/crazy5150760/last-stand-after-dark/actions/runs/40951381229
Integration CI: https://github.com/crazy5150760/last-stand-after-dark/actions/runs/40951392724
Post-merge CI: https://github.com/crazy5150760/last-stand-after-dark/actions/runs/40953273986
The post-merge run was started automatically; consult its actual conclusion rather
than inferring completion from the merge. It checks the identical source tree.

The initial source transfer reused 71 existing blobs and sent about 668 KB of
changed text. Subsequent transfers changed small test/CI/documentation files.
No complete game HTML/artwork was re-uploaded. Earlier failed/cancelled browser
fixture runs remain visible in CI history; they were not hidden or skipped.
The passing offline fixture uses an ordinary online reload if needed to obtain
control before disconnecting, without changing the worker or claiming clients.

## Environment and hosting boundary

Local edits, builds, tests and native Git commits work. Direct shell Git still
cannot reach its required proxy, and local Chromium/localhost sockets are blocked.
Neither failure was repeatedly retried. Connected GitHub source operations and
Actions checkout/setup/build/Chromium work. AGENTS.md, .nvmrc, scripts/setup.sh,
package commands and the optional devcontainer are reusable on future hosts;
they do not make the interactive machine permanent or supply CLI credentials.
Container startup and APK packaging remain untested.

The verification/manual publishing workflows are now on the default branch.
No manual Pages rehearsal or publishing run was dispatched in this session;
the connected tools do not expose workflow dispatch. The existing Pages source,
URL and custom domain remain unchanged. The publishing identity is unverified;
no credential was created/read. See DEPLOYMENT.md for the concrete remaining setup.

## Current publication preparation

PR #8 merged automatic game-link checks after run 40958278633 passed 1,429 tests
and real Chromium migration. The later main run 40959559006 failed in the migration
fixture while re-reading a worker slot. The release preparation branch now retains
the observed waiting-worker object and verifies its installed state throughout
the paused run, instead of re-reading a changing registration proxy. Do not claim
that correction passed until its actual CI gate is observed. Production code and
worker activation rules are unchanged by this test correction.

The preferred release path is now official Pages actions driven by a reviewed
release request; the old token-based branch workflow is archived. The first
rehearsal is non-publishing and uses the accepted original game. No personal token
is needed. The remaining account operation is Pages Source -> GitHub Actions; no
connected tool exposes that setting. See DEPLOYMENT.md before any switch/release.
