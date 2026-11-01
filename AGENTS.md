# Last Stand: After Dark — development instructions

Robert Kenny owns the game and tests primarily on Samsung S21 Ultra / Brave.
Read README.md, DEVELOPMENT.md and docs/VALIDATION.md before game changes.
This file applies throughout the repository; it grants no account, network or
filesystem permission.

## Development workflow

- Use one repository and one reasonably bounded milestone at a time. Codex is
  lead developer: recommend the next logical improvement, report actual checks
  and limits, and wait for Robert's playtest and progress decision before
  starting the next milestone.
- Use separate conversations in Last Stand Master for gameplay; small bugs/UI;
  major architecture; and testing/docs/maintenance. Follow
  docs/CODEX_WORKFLOW.md for milestone handoffs. Codex recommends each next
  chat's model and reasoning level; Robert selects them manually.
- Do not spawn subagents unless Robert explicitly authorizes them for a specific
  task. The four specialist TOMLs are retained for possible future use, while
  .codex/config.toml disables multi-agent tools by default. See
  docs/CODEX_WORKFLOW.md for the explicit opt-in process.
- Use the existing ChatGPT sign-in and included allowance only. No separately
  billed API, API key, purchased credits, paid top-up or subscription change.
- Mechanics and game systems are the current priority: combat feel, progression,
  balance and clear choices. Art and graphics remain important. Scope each
  gameplay change explicitly before implementation.

## Protect the working game

- Preserve accepted Alpha 0.86 gameplay, art, audio, timing and saves except for
  a specifically approved and verified feature. Keep immutable
  legacy/alpha-0.86, the original root Alpha 0.82 HTML, and gh-pages protected.
- Preserve ls-record, ls-journal-v1, ls-preferences-v1 and
  ls-restore-recovery-v1, their validation and read-only protections, and backup
  format. Never inspect, wipe or populate Robert's real storage in automated tests.
- Preserve worker waiting behavior: no skipWaiting, clients.claim, unregister or
  forced reload. Active runs do not survive closing the app.
- Edit the ordered files in src/modules.json, src/ui/game.css, the root index.html
  template, or source assets. Do not edit generated dist or web-dist. These are
  build-time modules in a shared lexical closure; retain order and startup rules.
  Keep original media bytes and metadata unless a feature explicitly approves
  their change. Do not casually refresh legacy hashes to hide regressions.
- Keep the validated Node 24.19.0 and bundled Acorn 8.17.0 pins unless a
  separately reviewed change requires them.

## Checks, review and release

- Use focused tests during development. Before a gameplay PR, run npm run check,
  relevant tests, npm test and npm run build:check; run real browser checks when
  the change affects browser behavior. New environments also run
  bash scripts/setup.sh when available. Documentation-only changes do not need
  a game rebuild. Distinguish VM/Canvas mocks from browser and phone results.
- Document public game behavior or developer utility changes in docs/. Every
  playable delivery includes a short Android checklist with version, link,
  expected results, actual checks and untested items.
- Work on a dedicated branch and integrate verified source through a reviewed PR.
  Inspect status, diff and current heads; preserve normal Git history. Never
  force-push or delete working builds. Never put credentials in remotes, source
  or logs. A source merge does not deploy the game.
- Current public game: https://crazy5150760.github.io/last-stand-after-dark/ .
  Preserve its Pages path, CNAME and original Site identity in
  .openai/hosting.json. Do not replace the live game until validation and
  applicable owner phone acceptance. Keep publication separate from source work.
- The Pages release workflow uses a reviewed deployment/pages-release.json
  request, with publish=false for rehearsal and GitHub's built-in identity.
  Preserve the expected source/build/game hashes, gh-pages baseline and archived
  site content. Do not assume the repository's GitHub Pages Source setting is
  configured for Actions; verify it before claiming a release.
- Robert's 2026-10-29 authorization permits routine verified commits and source
  merges without repeated approval. It does not authorize a new milestone,
  public release, major redesign or bypass of failing checks. Bring Robert in
  for phone testing and decisions that materially affect the working game.
