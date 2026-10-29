# Draft review prepared locally

Branch: refactor/modular-development
Suggested PR base: alpha-0.86-health-feedback
Remote baseline: eedabcf9ac85951671e9e0c20f0b7794ce6fc4c9

The remote branch request was unconfirmed; no PR URL is claimed. Main and the
current gh-pages game must remain stable. Upload the branch using normal Git when
the environment's actual network/authentication is working. Do not retry large
HTML connector uploads. Reconcile the older source PR chain separately before
merging to main, which still contains the original imported project.

## Suggested title

Organize Alpha 0.86 into reproducible modular browser development

## Suggested PR body

The current game is delivered as a large HTML artifact with one shared JavaScript
closure, making repeatable source changes and reviews difficult. Separate it into
50 ordered source files, a page/CSS template and hash-verified original media;
rebuild the exact Alpha 0.86 standalone and PWA output without changing runtime
initialization, loading, saves, combat, art or performance-related game code.

Preserve the published release/source/inventory under legacy/alpha-0.86, the
original Alpha 0.82 HTML, all artwork and historical docs. Add pinned Node setup,
package commands, Codex instructions, optional devcontainer, local server, expanded
CI, real-browser smoke tests and a manual guarded publisher for existing Pages.
No automatic deployment, main replacement, engine conversion or APK is included.

Validation: 1,368 game tests, 32 PWA tests, seven exact preservation tests and
three URL/MIME tests pass locally. Builds, AST check, complete asset hashes and
archive verification pass; production SHA/build ID match the protected baseline.
Deterministic probe comparison and final evidence are in docs/VALIDATION.md.

Keep this draft: Chromium launch is blocked by workspace socket permissions;
remote CI, real browser/Android checks, publishing credentials and normal Git push
still need a working environment. The CI and publishing workflows are prepared,
not claimed to have run. Ordered fragments preserve the original shared scope;
this is not a full migration to independent ES modules.
