# Last Stand: After Dark — persistent development instructions

Robert Kenny owns the game and tests primarily on Samsung S21 Ultra / Brave.
Read README.md, DEVELOPMENT.md and docs/VALIDATION.md before changing the project.
This file applies throughout this repository. It cannot grant network, account or
filesystem permissions or make a cloud workspace permanent.

## Protect the working game

- Preserve Alpha 0.86 gameplay, art, audio, timing and saves. The owner has now
  requested automatic updates through the normal game link. This authorizes the
  hosted-only PWA update shell and its tests/docs, not gameplay redesign or an
  engine migration. Standalone/core game bytes and immutable legacy stay exact.
- Work on a dedicated branch and integrate verified changes through reviewed PRs.
  Keep gh-pages, the original root Alpha 0.82 HTML and legacy/alpha-0.86 protected.
  Never force-push or delete working builds. A source merge does not deploy a game.
- Current public game: https://crazy5150760.github.io/last-stand-after-dark/ .
  Public preview/source were approved. Preserve existing Pages path and CNAME.
- Original Site identity remains in .openai/hosting.json. Do not replace its
  project ID or publish to a different Site as a side effect of repository work.
- Preserve ls-record, ls-journal-v1, ls-preferences-v1 and
  ls-restore-recovery-v1, their validation/read-only protections and backup format.
  Never inspect, wipe or populate the owner's real storage during automated tests.
- Preserve worker waiting behavior: no skipWaiting, clients.claim, unregister or
  forced reload. Active runs do not survive closing the app.

## Source and build

- Edit the 50 ordered source files listed in src/modules.json, src/ui/game.css,
  the root index.html template, or actual assets. Do not edit generated dist or
  web-dist. The manifest order, shared lexical closure and startup order matter.
- These are build-time modules, NOT isolated ES modules. No runtime loader or
  global test API is added. Do not reorganize execution order casually.
- src/main.js schedules the original frame loop. State is in src/core/state.js.
- assets/images, assets/audio and assets/metadata hold unchanged original media.
  assets/catalog.json maps them to historical dist/assets paths for regression
  fixtures; assets/embedded.json supplies SHA-verified runtime inputs. Retain art
  metadata fields: their historical file names are not network fetch paths.
- Node 24.19.0 and bundled Acorn 8.17.0 are validated. Do not silently change the
  parser, compaction algorithm or runtime pin. There are no runtime dependencies.
- Run bash scripts/setup.sh; npm test; npm run build:check. Browser-capable hosts
  also run npm run setup:browser and npm run test:browser. See the real limits in
  docs/VALIDATION.md. Do not present mock Canvas tests as browser/device tests.
- Baseline tests still reject game/art changes. The authorized hosted update shell
  is checked as an exact, explicit wrapper around the preserved standalone; its
  PWA build ID is expected to change. Never refresh legacy hashes to hide changes.
  For a later authorized feature release, retain immutable legacy fixtures and
  replace the exact-current-byte gate with explicit tests of the approved change;
  do not casually refresh the baseline hashes to make failures disappear.

## Delivery and Git

- Prefer local Git edit/test/commit/push. Inspect status and expected branch before
  any publication. Never put credentials in remotes, source, logs or shell output.
- Source checkout currently: /workspace/sites/last-stand-restructure. The path can
  change in future sessions; repository config, not that path, is authoritative.
- Direct proxy access and Chromium sockets were blocked in the initial session;
  initial write requests stalled. A later branch/source transfer succeeded and
  PR #6 is merged into main; see docs/REMOTE_REVIEW.md. Do not repeatedly retry a stalled
  approval flow or transfer generated 12 MB HTML through it.
  Finish reviewable local work, report limits, and use a normal authorized checkout
  or the delivered Git bundle. Repository instructions cannot bypass permissions.
- Ordinary source CI never publishes. The Pages release workflow is driven by a
  reviewed deployment/pages-release.json update on main, with publish=false for
  rehearsal. It uses GitHub's built-in pages/id-token permissions, not a PAT.
  GitHub Pages must first be configured for GitHub Actions by a repository admin;
  this connection cannot change that account setting. Do not claim it is done.
  Pin the source/build/game hash and preserved gh-pages SHA; retain CNAME and all
  unrelated archived site content. Never delete the baseline or use --delete.
  The old PAT/branch publisher is preserved under deployment/history and inactive.
- Owner authorization, 2026-10-29: "yes you are allowed to merge automatically..
  i want you to be free to do what you need for this game without my constant input".
  Routine development, commits and automatic merges of verified changes are
  authorized. Do not ask again for each routine merge or repository operation.
  Review the actual diff, pass appropriate checks and inspect current heads before
  merging; use the expected source SHA and retain normal Git history. This does
  not bypass required platform permissions or failing checks. Bring the owner in
  for testing and major decisions that materially risk the working game.
- No live replacement until validation and applicable owner phone acceptance.
  Alpha 0.86 functional acceptance is recorded in docs/PHONE_ACCEPTANCE.md.
  Keep source integration separate from publication; do not invent credentials,
  change Site identity/domain, or treat authority as a measured performance result.
- Every playable delivery gets a short Android checklist with expected results,
  version, link, actual test results and untested items. Keep commentary regular;
  avoid asking Robert to approve routine work already authorized.
