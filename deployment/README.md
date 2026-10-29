The old github-pages.yml template is retained for history. Do not activate it:
it assumes switching Pages to Actions. The current supported workflow is
.github/workflows/publish-pages.yml and keeps gh-pages/(root), CNAME and history.

Current release path: .github/workflows/publish-pages.yml uses official Pages
actions and GitHub’s built-in identity, driven by pages-release.json. The initial
request is an unchanged Alpha 0.86 rehearsal with publish=false. The former branch
publisher is preserved under history/publish-pages-branch.yml and is not active.
See ../docs/DEPLOYMENT.md before changing any hosting setting.
