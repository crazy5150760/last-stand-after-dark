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

## Rehearse publication without publishing

The workflow is now on default main. On a supported authenticated client, run
**Publish verified game to existing Pages branch** with:

- source_ref: the exact reviewed 40-character source commit.
- expected_live_commit: the freshly read gh-pages commit.
- publish_verified_build: **false** (the default).

The preflight rejects malformed identifiers before checkout. Verification then
checks the exact checkout, builds, runs all native and real-browser suites and
saves verified-pages-output. The publish job is skipped; no publishing secret,
protected production environment or gh-pages checkout is used. The summary
explicitly distinguishes verification from publication. In this mode the live
SHA is only syntax-checked, not queried for equality. Dry run is not an Android
acceptance result, live deployment, or check of the publishing credential.

This manual path is prepared but has not been dispatched: the connected tools
do not expose workflow dispatch. Ordinary source CI exercises the same build
and regression commands. Do not claim an actual manual rehearsal passed until
its run is observed; default-branch integration alone does not establish that.

## One-time hosting configuration still required

Keep Pages on gh-pages/(root), the current URL and any CNAME. The publishing job
requires PAGES_PUBLISH_TOKEN with repository Contents write, or a separately
approved GitHub App identity. Existing secret configuration is unverified; no
token was created, read or requested in chat. Native branch-based Pages ignores
GITHUB_TOKEN pushes, so the workflow deliberately has no misleading fallback.
An administrator can configure required reviewers for pages-production.

Only after owner acceptance, source review, successful final CI and publishing
identity setup should publish_verified_build be true. The publisher then checks
the expected live SHA, copies the exact allowed files, preserves other content
and CNAME, and uses a normal Git push. A changed live branch aborts publication;
identical output causes no new commit. Verify the actual subsequent Pages build
and phone URL before calling a future deployment successful. No source/domain
setting change is part of this plan.

The current live head remains ac9580725c4b25bfe74c653f51b09603b1a519f5. All 11
production files remain Alpha 0.86, build 7cf8f34890269ad6. This infrastructure
work does not create an Alpha 0.87 update or a new playable preview.
