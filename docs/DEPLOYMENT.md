# Browser deployment and stable release protection

The current approved public URL is
https://crazy5150760.github.io/last-stand-after-dark/ . Pages uses gh-pages/(root).
Main now contains the verified modular source through merged PR #6; merging source
does not publish the game. The live branch remains separate.
The original ChatGPT Site and its hosting project ID are unchanged.

## Prepared automation

prepare-web-preview.yml runs on main, alpha-* and refactor/** pushes, all pull
requests, and manual dispatch. It checks the pinned toolchain, builds, runs the
native/PWA/preservation/URL suites, runs real Chromium mobile/offline tests, then
packages output. Its artifacts include web-dist and browser evidence. Uploads
marked always() can contain partial output after failure: only a fully successful
run is a release candidate. The revised workflow now runs on the development branch. Core and real-browser step evidence has passed; see docs/REMOTE_REVIEW.md and the latest PR checks for full-gate results.

publish-pages.yml is manual only, not a push trigger. After the reviewed source
has passed the Android checklist, it takes a 40-character immutable source commit,
the expected live gh-pages commit, and an explicit publish_verified_build input
(default false). It builds/tests that source again, publishes only the resulting
artifact, rejects a changed live baseline, and makes a normal fast-forward Git
commit on gh-pages. It retains existing files, custom-domain CNAME and history.
An identical production output causes no publication commit. It never uploads
source HTML through connector blob/tree requests.

With publish_verified_build false, the workflow performs verification and saves
the candidate artifact but skips the entire publish job. It does not use the
publishing secret or check the live branch for equality in this mode. This is a
prepared rehearsal path, not a deployed preview. Immutable identifiers are
validated before source checkout. See INTEGRATION.md for the verified source
ancestry and the required default-branch/phone/identity gates.

Native branch-based Pages does not rebuild for commits pushed by GITHUB_TOKEN.
Therefore the publisher deliberately requires PAGES_PUBLISH_TOKEN, stored in
GitHub repository secrets, with repository Contents write permission. It stops
before publication if missing; no fallback silently claims success. An approved
GitHub App credential can be used instead by updating the checkout identity.
Do not paste tokens into a chat or repository. The pages-production environment
may additionally be configured for required reviewers using GitHub settings.

The manual workflow is now committed on default main through PR #6. GitHub Actions
workflow metadata can be checked without changing Pages. No manual dispatch was
performed: the connected tool set does not expose workflow dispatch. A repository
operator can use Run workflow in GitHub Actions on a supported authenticated client. An alternative future
setup is official upload-pages-artifact/deploy-pages with Pages source switched
to GitHub Actions; the old deployment/github-pages.yml is only a historical
template, not the active configuration. Do not switch sources/custom domains
casually or activate two publishing paths.

## What has and has not changed

No new deployment was performed. PR #6 was merged into main with owner authorization;
the actual merge tree exactly matches the tested candidate. The live branch, domain
and original Site remain unchanged. Direct shell Git remains unavailable.
The local production build is byte-identical to the current Alpha 0.86 and has
the same PWA build ID. This is intentionally not Alpha 0.87 or a waiting update.

For this preservation release, the existing HTTPS game is the same playable
payload; it is not a newly deployed preview proving this new CI configuration.
Browser CI has passed and owner phone acceptance is recorded in PHONE_ACCEPTANCE.md.
The source and main-targeted checks passed and source integration is complete.
No publishing identity or live deployment is established by those gates.

## Publication checklist after completed integration

1. Start from the exact reviewed main source commit; inspect the current source
   and gh-pages heads. Never force-push historical output over newer live content.
2. Owner functional acceptance and all 1,410 core/Chromium checks passed for the
   unchanged Alpha 0.86 payload. A later changed playable candidate needs its
   appropriate verification and phone checklist, not a recycled acceptance claim.
3. On a supported authenticated GitHub client, dispatch a rehearsal with
   publish_verified_build false. Verify the actual result/artifact. This connection
   cannot dispatch it and no successful rehearsal is claimed here.
4. Configure/verify PAGES_PUBLISH_TOKEN or an approved publishing identity once.
   Keep it in repository/environment secrets, never chat/source/remotes. Required
   reviewer settings depend on actual repository administration access.
5. When publication is needed, dispatch the guarded workflow with the reviewed
   source SHA, freshly read expected live SHA and publish_verified_build true.
   Verify the actual subsequent Pages deployment and normal HTTPS URL.
6. Check the deployed version, records/settings, orientations and offline behavior.
   Identical Alpha 0.86 output causes no publication commit or new waiting update.

The owner permits routine verified source merges without repeated approval.
Required platform permissions, hosting credentials and game verification still
apply. A merge or artifact alone is not evidence of a successful deployment.
