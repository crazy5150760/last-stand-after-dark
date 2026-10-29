# Completed source integration and Pages rehearsal

PR #6 merged into main at 73071cf86a93a8ab85fa61a72681b59bf5729fb5 after owner
phone acceptance, passing source/main-targeted CI and explicit merge authorization.
Its tree ed41f7d72e92426f66fb08f8cf73c4585bf51e32 exactly equals the reviewed
candidate. The owner also authorizes future routine verified automatic merges;
AGENTS.md records the instruction. This does not create hosting credentials or
change the live game.

## Verified source ancestry

GitHub commit metadata confirms that each release below directly parents the
next release. The normal PR #6 merge retains this complete ancestry. Historical
release/baseline branches are retained. Superseded PR reviews can be closed after
confirming their heads are in main; no second historical source merge is needed.

| PR | Source branch | Exact head | Current base |
|---|---|---|---|
| #1 | alpha-0.82-source-backup | 64eac825e140e70227ff70add82d58fffdf65e61 | main |
| #2 | alpha-0.83-update-check | 5b5b67936cca43526f3dc835703b8d020622e676 | alpha-0.82-source-backup |
| #3 | alpha-0.84-update-status | 35cbcbcfad6e0e8d26a295e4470e49ef0db3b61d | alpha-0.83-update-check |
| #4 | alpha-0.85-upgrade-clarity | 7dbaf94e3823449e585e3b09bd9ac5abd86387ff | alpha-0.84-update-status |
| #5 | alpha-0.86-health-feedback | eedabcf9ac85951671e9e0c20f0b7794ce6fc4c9 | alpha-0.85-upgrade-clarity |
| #6 | refactor/modular-development | See the current PR head | main |

Before integration, main was 0478a42c73c1ff63b6b86d49b71b11cacd3c4ca1. Its two-file tree
was inspected: the original Alpha 0.82 HTML is retained at its original path;
the original README blob ca59b041f44eb054e975c0f2f6e79d7d9067ac34 is retained
unchanged as docs/history/README.md. The new README describes the actual project.
The preserved Alpha 0.86 source branch remains
baseline/alpha-0.86-preserved at eedabcf9ac85951671e9e0c20f0b7794ce6fc4c9.

## Completed integration checks

Owner S21 Ultra / Brave acceptance is recorded in PHONE_ACCEPTANCE.md. The focused
refactoring diff and broader main integration were reviewed. GitHub confirmed main
was the merge base, with no divergent main changes or removed original main files.
Runs 40951381229 and 40951392724 passed 1,410 core cases and real Chromium checks.
No unresolved review threads remained. Fresh source/main/live heads were checked,
and the merge used the expected source SHA and normal merge method. The returned
main merge tree exactly matches the tested candidate; no main history was rewritten.

The live head remains ac9580725c4b25bfe74c653f51b09603b1a519f5. No release/baseline
branch was deleted and no Site or domain change occurred. Future routine verified
merges use the owner's standing authority in AGENTS.md, without another routine
approval prompt. Inspect intervening changes and required checks each time.

## Current Pages release preparation

The former manual/PAT branch publisher is preserved under deployment/history,
not active in .github/workflows. The preferred publisher now uses official Pages
actions with GitHub's built-in identity and a reviewed pages-release.json request.
The initial request has publish=false and reproduces the accepted original
Alpha 0.86 package; neither the source merge nor the rehearsal replaces the game.

See DEPLOYMENT.md for exact current instructions. After the prepared rehearsal
passes, a repository administrator must change GitHub Settings -> Pages -> Source
to GitHub Actions. The existing URL and any custom domain must stay unchanged.
Connected source tools can then trigger reviewed releases through normal merges;
no manual workflow-dispatch API, personal token or extra player update link is
required. No account setting change or actual publication is claimed until
verified. The original gh-pages baseline stays protected for rollback.
