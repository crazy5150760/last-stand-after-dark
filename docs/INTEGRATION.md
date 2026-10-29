# Default-branch integration and Pages rehearsal

This is an integration review plan, not authorization to merge automatically or
publish. The owner has now reported passing the phone checks; PHONE_ACCEPTANCE.md
records the exact statement. PR #6 was retargeted from Alpha 0.86 to main. Its
previous source-head push and PR runs both passed; the final main-targeted checks
and review remain required before merging.

## Verified source ancestry

GitHub commit metadata confirms that each release below directly parents the
next release. The five historical PRs remain open drafts; no source merge was
performed. PR #6's current review state/checks are authoritative on GitHub.

| PR | Source branch | Exact head | Current base |
|---|---|---|---|
| #1 | alpha-0.82-source-backup | 64eac825e140e70227ff70add82d58fffdf65e61 | main |
| #2 | alpha-0.83-update-check | 5b5b67936cca43526f3dc835703b8d020622e676 | alpha-0.82-source-backup |
| #3 | alpha-0.84-update-status | 35cbcbcfad6e0e8d26a295e4470e49ef0db3b61d | alpha-0.83-update-check |
| #4 | alpha-0.85-upgrade-clarity | 7dbaf94e3823449e585e3b09bd9ac5abd86387ff | alpha-0.84-update-status |
| #5 | alpha-0.86-health-feedback | eedabcf9ac85951671e9e0c20f0b7794ce6fc4c9 | alpha-0.85-upgrade-clarity |
| #6 | refactor/modular-development | See the current PR head | main |

Main is still 0478a42c73c1ff63b6b86d49b71b11cacd3c4ca1. Its complete two-file tree
was inspected: the original Alpha 0.82 HTML is retained at its original path;
the original README blob ca59b041f44eb054e975c0f2f6e79d7d9067ac34 is retained
unchanged as docs/history/README.md. The new README describes the actual project.
The preserved Alpha 0.86 source branch remains
baseline/alpha-0.86-preserved at eedabcf9ac85951671e9e0c20f0b7794ce6fc4c9.

## Proposed integration after the gates pass

The release branches form one ancestry chain. A single reviewed integration of
the restructuring head into main can therefore include the complete source
history; merging each historical draft separately is unnecessary. Before doing
so:

1. Owner Alpha 0.86 S21 Ultra / Brave acceptance is recorded in PHONE_ACCEPTANCE.md.
   It followed the checklist and is not inferred from an unspecified continuation.
2. Review PR #6's focused restructuring diff and the historical PR descriptions.
   Confirm no unexpected source changes, failed checks or unresolved review.
3. Re-read main, development, baseline and gh-pages heads. If any moved, compare
   the intervening changes before proceeding; never force a branch back.
4. PR #6 now provides the main-targeted integration review. GitHub's comparison
   confirmed main is the merge base, zero commits behind, and no removed original
   main files. Review the broader diff, original files and Site identity, then
   require CI on this actual main merge candidate. Re-read all heads at merge time.
5. Merge only after the required acceptance and review gates are met. Prefer a
   normal merge retaining source ancestry. Do not delete release/baseline
   branches. Close superseded historical PRs only after confirming their work
   and history are present in main.

Retargeting only changed the PR base. No main merge, branch deletion or automatic
closure was performed. A completed main merge is not claimed; consult PR checks
for the final integration candidate's actual test results.

## Rehearse publication without publishing

Once the workflow is available on the default branch, run
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

This manual path is prepared but has not been dispatched: the workflow is not
yet integrated into main. Ordinary source CI already exercises the same build
and regression commands. Do not claim a new Actions button exists today.

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
