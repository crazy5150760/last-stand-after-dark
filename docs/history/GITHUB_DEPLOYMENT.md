> Current release: Alpha 0.86 · Health Awareness. Back up source, run full CI, then publish verified static output to existing gh-pages at the same approved public game address. Public source is accepted. Main/conversion history and original Site remain unchanged. Earlier 0.82 backup hashes are historical; current release manifests/Git trees record this build.

# Alpha 0.82 source backup and web deployment preparation

The complete editable Alpha 0.82 project is backed up on `alpha-0.82-source-backup`.
The existing `main` and `threejs-conversion` branches and their README/baseline HTML are preserved.
The original Site ID remains `appgprj_6ad44e1d8fa48191b59d8c10b22c7a86`.
This preparation does not change the game, publish a new website or change access to the existing private Site/repository.

## Source and provenance

`SOURCE_BACKUP_MANIFEST.json` lists all 111 original project files, their byte sizes, Git blob IDs and SHA-256 hashes from local source commit `5ddcf7b185bedd2e590a44c4cc08b53522ec6f8b`.
Those files retain their original paths and bytes, including readable `src/game.js`, `dist/index.html`, all original media, builders, tests, PWA files and the hosting manifest.
The original root `Last_Stand_After_Dark_Alpha_0_82.html` is also retained and matches `dist/index.html`.
The GitHub backup commit is parented to the existing GitHub history. The full earlier local development history remains in the original workspace; this is a complete current-source snapshot, not an import of every historical local commit.
No Three.js conversion or APK packaging is performed by this backup.

## Build and private artifacts

GitHub Actions workflow **Verify and package web preview** runs on pushes to the backup branch or main, and on pull requests targeting main. It verifies the standalone builder, generates the hosted output, runs the full native game suite and offline-package suite, then packages private workflow artifacts. No website is published by that workflow.

Use Node **24.19.0** and Python 3 locally:

```sh
node tools/build_game.cjs --check
node tools/build_pwa.cjs
LS_TEST_GC=1 node --expose-gc --max-old-space-size=512 tests/game.test.cjs
node tests/pwa.test.cjs
python3 tools/package_web_preview.py --output /tmp/last-stand-release
```

The output contains:

- A ZIP with the eleven static website files at its root, ready for a compatible HTTPS host.
- A Sites deployment tar containing `.openai/hosting.json` and `web-dist/`. Publishing that tar still requires the identical source commit to be pushed to the existing Site's configured source repository. GitHub backup alone does not meet that requirement or repair the workspace's blocked terminal network access.
- SHA256SUMS.txt. The packager checks every cached asset hash, both archive contents and the ZIP CRC before reporting success.

Artifacts can be downloaded from a successful Actions run by an authorized repository user. They expire after 14 days; the committed source remains backed up. A manual workflow trigger is available after the workflow is present on the repository's default branch.
If GitHub Actions is disabled or the connected GitHub app cannot write workflow files, the source and preparation files can still be backed up. Their presence does not prove a workflow has run successfully.

## Publication decision still required

The existing Site remains private. A GitHub Pages website is normally publicly accessible even when its source repository is private; private-repository Pages availability also depends on the GitHub account plan and repository policy. Repository privacy alone does not protect the game's published URL.

`deployment/github-pages.yml` is a **dormant template**, outside GitHub's active workflow directory. It cannot run or publish as placed. It uses a manual public-preview approval input defaulting to false. Do not activate it until Robert chooses that audience/new address and the repository's Pages eligibility is confirmed. There is no secret, token or existing Site credential embedded in these files.

For an approved public Pages preview:

1. Review/merge the source backup into the desired default branch while preserving the existing conversion branch.
2. Confirm GitHub Pages is available for this private repository. If it is unavailable, keep the repository private and choose another host; changing repository visibility requires the owner's explicit instruction.
3. Copy the reviewed template to `.github/workflows/deploy-pages.yml` and commit it to the default branch.
4. In the repository's Pages settings, select GitHub Actions as the deployment source.
5. Run the manual workflow and explicitly approve public preview. Use the actual successful deployment's returned URL; a guessed address is not evidence of publication.

If private access is required, retain the prepared package and use an HTTPS host with verified access controls, or restore the existing Site's source-upload connection. No public Pages deployment is a substitute for that requirement.

## Android acceptance after a successful HTTPS deployment

1. Export a real JSON backup from the current downloaded game before opening a different address.
2. Open the new deployment's `/install/` page in Brave on the S21 Ultra. Choose Prepare Offline Play; wait for verified readiness, then Add to Home Screen / Install app when offered.
3. Open the icon, check direct game launch, movement/Pause/Dash, sound, both orientations and frozen choices/results.
4. If the new address has no records, review/import the known JSON and confirm the expected records. Do not replace records already matching the backup.
5. Finish and close the game, enable airplane mode, reopen the icon and play a short run. Return online afterward.
6. Verify waiting updates with a second distinct build before claiming Android update acceptance. Live runs are not saved on closing and updates must not force a running session to reload.

Actual Android installation, offline launch, host MIME/authentication compatibility and two-build updates remain unverified until those tests are performed. Current local game and VM checks do not establish them.
