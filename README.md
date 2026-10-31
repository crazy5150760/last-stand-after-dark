# Last Stand: After Dark

A Canvas 2D survival game for Android browsers and desktop browsers. The source
preserves Alpha 0.86 gameplay and adds an optional Downtown visual pilot for
review. The original game and Site identity are retained; no engine or gameplay
redesign is included.

Live game: https://crazy5150760.github.io/last-stand-after-dark/

## Develop

Use Node **24.19.0**. Builds and the existing VM regression suites have no package
download requirement:

```sh
bash scripts/setup.sh
npm test
npm run serve
```

Open http://127.0.0.1:8000/last-stand-after-dark/ . The root index.html is a build
template, not the playable output. `web-dist/` is the production website;
`dist/index.html` is the generated standalone. Both retain the existing game bytes.
Optional real-browser checks: `npm run setup:browser`, then `npm run test:browser`.
Browser installation needs network access and a host that permits Chromium.

## Project structure

```text
index.html                    Page and embedded-asset metadata template
src/main.js                   Original frame loop and startup
src/modules.json              Explicit assembly order and private-scope wrapper
src/core/                     State, update loop, training and developer tools
src/player/                   Deployment, native player defaults and health cues
src/enemies/                  Horde, specialists and three bosses
src/weapons/                  Projectiles, lightning, blades, fire and rendering
src/combat/                   Damage, hostile shots, barricades, shock, fuel, decoys
src/progression/              Survivors, routes, contracts, upgrades, saves, goals
src/rendering/                Actors, environment, animation, street preview
src/input/                    Keyboard, touch, choice guards and lifecycle
src/audio/                    Mix, music, effects and art-preview cues
src/ui/                       Menus, navigation, HUD, results and unchanged CSS
assets/images/                Original PNG and runtime WebP artwork
assets/audio/                 Original OGG track
assets/metadata/              Original artwork/audio metadata
assets/catalog.json           Hash-verified original-path mapping
assets/embedded.json          Runtime media embedding inputs
pwa/                          Unchanged installation, icons and worker sources
scripts/                      Setup, checks, local server and build helpers
tools/                        Compatible builders and optional art utilities
tests/                        Existing regressions plus preservation/browser tests
legacy/alpha-0.86/             Immutable playable release, source and provenance
Last_Stand_...Alpha_0_82.html   Original imported game, unchanged
.devcontainer/                Reusable optional container configuration
.github/workflows/            Verification and manual guarded publication
benchmarks/                   Existing phone observations, unchanged
```

Source files are **ordered build-time modules sharing the original private
closure**, not independent ES modules. This is a deliberate preservation boundary:
the immutable Alpha 0.86 source remains under `legacy/alpha-0.86`; the optional
Downtown visual pilot is described in docs/VISUAL_PILOT.md. Future state
encapsulation can be tested separately. No empty multiplayer/controller/engine
folders are created for features that are not implemented.

See DEVELOPMENT.md for commands, docs/ARCHITECTURE.md for systems and saves,
docs/VALIDATION.md for evidence/limits, docs/DEPLOYMENT.md for Pages, and
docs/ANDROID.md for future APK preparation. AGENTS.md carries persistent Codex
instructions. Prior documentation is preserved under docs/history/.

The restructuring is merged into main through [PR #6](https://github.com/crazy5150760/last-stand-after-dark/pull/6),
commit `73071cf86a93a8ab85fa61a72681b59bf5729fb5`. Its tree exactly matches the
reviewed candidate. Both source and main-targeted PR CI passed 1,410 core tests
plus real Chromium checks. The owner reported passing S21 Ultra / Brave testing;
see docs/PHONE_ACCEPTANCE.md. The live game and original Site are unchanged.

Start future work from current main on a dedicated branch. The owner authorizes
routine verified merges without repeated confirmation; AGENTS.md records that
standing instruction. See docs/REMOTE_REVIEW.md for evidence and remaining
hosting/environment limits. Direct shell Git still cannot reach this workspace's
required proxy; small source transfers through the connected GitHub app and
Actions checkout/build/browser verification work. No complete game HTML/artwork
was re-uploaded for the restructuring.

Automatic game-link updates are implemented in the hosted-only PWA shell; see
docs/AUTOMATIC_UPDATES.md for behavior, validation and publication status. This
changes the web build identity while preserving the Alpha 0.86 standalone and all
gameplay. It does not imply the new shell has been deployed to the public game.

The credential-free Pages release workflow uses a reviewed release request and
GitHub’s built-in deployment identity. It starts with a non-publishing rehearsal;
GitHub Pages still needs its one-time Source setting changed by an account admin.
See docs/DEPLOYMENT.md. No personal token or separate player update link is needed.
