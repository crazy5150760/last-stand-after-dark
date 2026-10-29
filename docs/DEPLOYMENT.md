# Browser deployment and stable release protection

The current approved public URL is
https://crazy5150760.github.io/last-stand-after-dark/ . Pages uses gh-pages/(root).
Main is an older imported snapshot; do not deploy it merely because it is main.
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

Native branch-based Pages does not rebuild for commits pushed by GITHUB_TOKEN.
Therefore the publisher deliberately requires PAGES_PUBLISH_TOKEN, stored in
GitHub repository secrets, with repository Contents write permission. It stops
before publication if missing; no fallback silently claims success. An approved
GitHub App credential can be used instead by updating the checkout identity.
Do not paste tokens into a chat or repository. The pages-production environment
may additionally be configured for required reviewers using GitHub settings.

Manual workflows become dispatchable once present on the repository's default
branch. Since this work remains isolated and main is unchanged, no new publish
button or active default-branch workflow is claimed today. An alternative future
setup is official upload-pages-artifact/deploy-pages with Pages source switched
to GitHub Actions; the old deployment/github-pages.yml is only a historical
template, not the active configuration. Do not switch sources/custom domains
casually or activate two publishing paths.

## What has and has not changed

No new deployment was performed. Existing source/main/live branches and domain
settings were not overwritten. The remote dev branch/source and draft PR #6 are confirmed; direct shell Git remains unavailable.
The local production build is byte-identical to the current Alpha 0.86 and has
the same PWA build ID. This is intentionally not Alpha 0.87 or a waiting update.

For this preservation release, the existing HTTPS game is the same playable
payload; it is not a newly deployed preview proving this new CI configuration.
Until browser-capable CI and phone acceptance pass, keep the draft unmerged and
use the downloadable validated package or normal local server for review.

## Review and publication checklist

1. The dev source and draft PR #6 are uploaded. Future pushes should use normal
   authorized Git when the workspace proxy/authentication is working; never force.
2. Review PR #6 against alpha-0.86-health-feedback and its new full CI,
   including Chromium. Resolve every failure before promotion.
3. Export the owner's JSON backup, then complete docs/MANUAL_TEST.md on S21 Ultra /
   Brave. Automated browser contexts must remain disposable.
4. Reconcile the existing source PR chain and review the default-branch workflow
   changes without replacing main with the old game. Configure the publishing
   identity/environment once. Leave CNAME untouched.
5. Dispatch the guarded workflow using the exact tested source/live commit SHAs.
   Verify the actual Pages build/deployment result and returned normal HTTPS URL.
6. Check the deployed version, records/settings, both orientations and offline
   setup/update behavior. With unchanged Alpha 0.86 bytes, no new update is expected.

A Git push, workflow file, passing VM suite or generated archive alone does not
establish successful public hosting, browser launch or Android acceptance.
