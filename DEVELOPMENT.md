# Development

## Runtime and setup

Node 24.19.0 / npm 11.9.0 were used in this workspace. `.nvmrc` and the optional
`.devcontainer/devcontainer.json` keep the runtime selection with the repository.
The builder uses Node's bundled Acorn 8.17.0, retaining the existing compactor and
AST comparison. This is an internal Node API: the doctor command checks it and
fails clearly if it changes. Do not silently upgrade the pin or parser.

```sh
nvm install       # on a network-capable machine using nvm; one-time installation
nvm use
bash scripts/setup.sh
```

The setup script does not install packages, contact GitHub, alter authentication,
start a server or publish. It checks the runtime and builds/checks local files.
`npm ci --ignore-scripts` is also supported; the production/test core has no npm
dependencies. Python 3 is needed only for the existing archive packager. Optional
art regeneration uses Pillow/numpy/ffmpeg and is not part of a normal build.

## Commands

| Command | Purpose |
|---|---|
| `npm run doctor` | Check pinned Node/parser and report required tools honestly |
| `npm run check` | Parse JS, resolve local requires, validate ordered modules and asset paths/hashes |
| `npm run build` | Rebuild standalone, compatibility reference media and installable website |
| `npm run build:check` | Fail on stale/missing generated output |
| `npm test` | Full gameplay, PWA, URL/MIME and frozen baseline tests |
| `npm run test:game` | 1,368 native gameplay checks, GC between fixtures, 512 MiB heap |
| `npm run test:pwa` | 32 worker/setup/update cases |
| `npm run test:baseline` | Seven exact preservation checks for this restructuring |
| `npm run test:server` | Three actual HTTP-handler checks without binding sockets |
| `npm run validate` | Syntax, build, all core tests and stale-output checks |
| `npm run setup:browser` | Download pinned Playwright 1.62.1 and Chromium, optional |
| `npm run test:browser` | Real Chromium mobile/touch/menu/offline tests; unavailable browser fails |
| `npm run serve` | Serve web-dist at /last-stand-after-dark/ on localhost:8000 |
| `npm run package` | Create verified web ZIP, Sites archive and SHA256SUMS under artifacts/release |

Run build before tests after a fresh checkout. `npm run validate` does that in the
correct order. The long game suite takes about six minutes here. A focused runner
check is `node --expose-gc --max-old-space-size=512 --test-name-pattern='Alpha 0.86'
scripts/test-game.cjs`. Focused checks do not replace the full suite for release.

The optional browser package is pinned and installed with --no-save and
--package-lock=false; it never enters the runtime bundle or changes the core
lockfile. Browser CI installs Chromium's system libraries using Playwright's
install-deps command. Local hosts may need administrator help for those libraries.
`LS_CHROMIUM=/path/to/chromium npm run test:browser` selects an existing browser.
Do not weaken sandbox/network restrictions to hide a launch failure.

## Edit and build

Use src/modules.json to find each file's position. The source pieces are complete
original top-level statements, concatenated with the preserved private wrapper.
No import/export runtime, changed initialization order, new game API, framework,
asset-fetch timing or bundler dependency is introduced.

Edit source files rather than generated scripts. Edit src/ui/game.css for CSS
and index.html for page structure/embedded metadata. Binary media is in assets/;
embedded.json supplies each exact MIME/hash/file, catalog.json maps all 63 moved
original files to their historical dist/assets locations. Build re-embeds the 22
runtime payloads and recreates reference files for the unchanged native tests.
Only web-dist is published; it does not contain those reference PNG originals.

The standalone remains self-contained because the game validates data: URIs and
has lazy art/audio initialization tied to that contract. Extracting runtime URLs
would change startup, caching and fallback behavior. Source media has been
extracted without changing that runtime contract; external runtime loading is a
separate future proposal, not part of this preservation task.

The initial frozen tests require exact Alpha 0.86 source, HTML, art and PWA build
identity. After this restructuring is reviewed, an authorized feature release
must deliberately replace the exact-current-byte gate with focused approved-change
regressions and retain immutable legacy bytes/hashes. Never overwrite the legacy
release or automatically refresh hashes when a preservation test fails.

## Local and phone preview

`npm run serve` binds only 127.0.0.1 by default. To test from another device on a
trusted LAN, use `HOST=0.0.0.0 npm run serve` and open the host's LAN address with
`:8000/last-stand-after-dark/`. A public Codex port-forward URL depends on the
host's actual supported forwarding, not on this repository. Plain LAN HTTP can
play the game but is not a secure context for service workers; installed/offline
phone tests need the existing HTTPS Pages address or another approved HTTPS host.
Do not switch origins without a JSON backup. Same-origin previews share the
production localStorage keys; use a disposable browser profile for automation.

## Git and review

Use ordinary local `git status`, `git diff`, `git add` and `git commit`. Do not
edit/push main or gh-pages as part of feature work. Once normal network and Git
authentication are available, the intended push is:

```sh
git push -u origin HEAD
```

PR #6 is merged into main at 73071cf86a93a8ab85fa61a72681b59bf5729fb5. The
complete historical source chain is retained, and the merged tree exactly equals
the verified integration candidate. Owner phone acceptance is recorded in
docs/PHONE_ACCEPTANCE.md. Future tasks should start from current main and use a
new branch, for example `git switch -c feature/short-description`; push the current
branch with `git push -u origin HEAD` once normal network/authentication works.
The earlier refactor branch and baseline remain preserved.

The owner has authorized automatic merging of routine verified changes. Follow
AGENTS.md: review the actual diff, require appropriate checks, inspect current
heads and use the expected source SHA. Do not request repeated routine approval.
Publication still requires its actual hosting identity and release validation;
source integration does not change gh-pages or the original Site.

This workspace's local tracking refs were aligned to SHA-verified public commit
metadata because the required proxy prevents normal fetch. Ordinary Git network
and CLI authentication remain unverified. GitHub's signed merge commit was
reconstructed from its public verified payload/signature and accepted only after
its exact Git SHA matched; no guessed metadata was written into a ref. The isolated
checkout retains shallow boundaries at the preserved Alpha 0.86 baseline and the
original main commit. Full remote history is preserved; use a normal clone on a
supported repository host for complete local ancestry.

See docs/REMOTE_REVIEW.md and docs/REVIEW.md for evidence; docs/INTEGRATION.md for
completed source integration and the separate Pages rehearsal; docs/ENVIRONMENT.md
for actual access limits. Earlier development notes remain in docs/history/.

Pages release preparation: `npm run test:release` verifies the real package
composer, preserved content/CNAME and rejected inputs. The active release workflow
is driven by deployment/pages-release.json, initially publish=false. It can run
through normal reviewed source merges without a workflow-dispatch API or PAT;
GitHub’s one-time Pages Source setting remains an administrator action.
