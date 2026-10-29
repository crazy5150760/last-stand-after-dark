# One game address, verified Pages releases

Game: https://crazy5150760.github.io/last-stand-after-dark/
Settings: https://github.com/crazy5150760/last-stand-after-dark/settings/pages
The existing custom domain/Site identity must not change. gh-pages remains the
preserved original deployment at ac9580725c4b25bfe74c653f51b09603b1a519f5.

## Prepared route without a personal token

.github/workflows/publish-pages.yml uses official upload-pages-artifact and
deploy-pages actions with GitHub's built-in token/OIDC permissions. No PAT,
PAGES_PUBLISH_TOKEN or account credential is created/read. The old branch-based
publisher is preserved outside .github/workflows under deployment/history.
Do not activate both publishing paths.

A reviewed change to deployment/pages-release.json on main starts the release
workflow. It validates immutable source/archive SHAs, expected PWA build and game
hash, checks out that exact source, runs its complete native/browser validation,
then composes the generated eleven production files with all existing unrelated
site content and CNAME from the preserved branch. Symlinks, unexpected payloads,
wrong hashes, stale archive SHAs and destructive output overlap are rejected.
The baseline is never overwritten or deleted.

With publish=false, it uploads a verified Pages artifact and skips deployment.
With publish=true, the separate github-pages environment job rechecks the archive
SHA and deploys using pages:write/id-token:write. Existing required reviewers and
platform permissions still apply. An actual deployment result is needed before
claiming the public address changed. Source CI itself never publishes a game.

The initial request deliberately targets accepted source a415ecc891c366efcec05476399145c99f7cb4e3,
PWA build 7cf8f34890269ad6, with publish=false. This rehearses the original live
Alpha 0.86 bytes. It does not publish the newer automatic-update shell or assert
new-flow phone acceptance. Consult the release workflow's actual result.

## One-time account setting after the rehearsal passes

This is a setting in GitHub itself, not a Codex approval prompt. Open the settings
link above. Under Build and deployment, change Source from Deploy from a branch
to GitHub Actions. Keep the custom domain and other settings unchanged.

The connected tools can edit/merge release requests and inspect/re-run jobs, but
cannot change Pages settings, manage repository secrets or dispatch a manual
workflow. They also do not supply local shell Git credentials. Do not repeat
stalled permission prompts or ask for tokens in chat. The account setting needs
a repository administrator using a normal authenticated GitHub client.

Prepare and verify the workflow before asking for that one setting change. No
source setting change or actual successful Pages deployment is claimed merely
because the workflow file exists. Preserve the last working branch so that the
existing hosting source can be restored if needed. Do not switch a domain.

## Routine release after setup

1. Choose the exact source commit after its actual tests/review and applicable
   owner phone checks. Never label an untested phone flow accepted.
2. Review/update the manifest's source_ref, expected_live_commit, expected_build
   and expected_game_sha256. Use publish=false for a rehearsal if needed.
3. After the one-time account setting, merge a reviewed publish=true release
   request using the owner's standing authority. That source event triggers the
   workflow, so no manual dispatch control or repeated owner action is required.
4. Verify the deploy-pages result and the public build-info.json, required assets
   and game link. Give the owner a short S21 Ultra / Brave checklist.
5. Roll out the newer automatic-check shell only through its verified release;
   do not mistake the initial old-build rehearsal for that update.

Once the new shell is actually received, the same game link/home-screen icon
checks/downloads updates automatically. A ready version takes effect after all
old game/setup windows close and the game reopens normally. It never reloads a
run or changes saved records. See AUTOMATIC_UPDATES.md for first-migration limits
and the new-flow phone checklist. No second player-facing update link is required.
