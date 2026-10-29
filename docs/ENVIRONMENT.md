# Reusable development environment and access status

## What works here

The working checkout is /workspace/sites/last-stand-restructure on the dedicated
refactor/modular-development branch. Local filesystem editing, ordinary local Git
objects/branches/commits, Node/npm, the full VM suites and production builds work.
Node 24.19.0, npm 11.9.0, Python 3 and Chromium are present. No game runtime npm
packages are needed. npm ci --ignore-scripts --offline succeeds for the core lock.

The cloud environment was running and connected, but this does not establish
usable sockets, proxy reachability or Git authentication. It reported no configured
runtime identities/secrets. Secret values, token stores and environment dumps were
not read. The required proxy configuration was preserved; no direct-route or TLS
bypass was attempted.

## Verified limitations

- Direct git ls-remote failed connecting to the required proxy on port 8080. An
  additional-network-permission attempt stalled and was aborted without success.
- A GitHub connector create-branch request also stalled and was aborted; whether
  the remote branch was created is unconfirmed. No commit upload, merge or live
  publication was confirmed. Do not repeatedly retry invisible approvals.
- System Chromium launch and the optional Playwright launch both failed at
  crashpad socket.cc setsockopt: Operation not permitted. No real browser page,
  local HTTP socket, GPU, touch device, FPS or service-worker lifecycle was tested.
- GitHub connector access does not supply a normal Git CLI credential. This
  session cannot change the account's repository permissions or the Codex
  workspace attachment/persistence settings using available tools.

## Checkout provenance

The complete local Alpha 0.86 tree equals GitHub tree
e2c72ad1bb0adf1fefa88f7632f43bf89df99dfb. The isolated checkout was copied locally
without another network download. Public GitHub commit metadata was used to
recover the exact baseline commit object, including its encoding header; its
calculated Git SHA was verified as eedabcf9ac85951671e9e0c20f0b7794ce6fc4c9 before
use. No author, content or hash was guessed into a Git ref. That commit is the
shallow boundary in this isolated repository; older local working repositories
and their full history remain untouched. The restructuring commit is directly
parented to the actual GitHub baseline, so a future normal push need not upload
the unrelated historical local development branches/builds.

The unchanged latest release is also protected by a local baseline branch, the
original Alpha 0.86 source checkout, and committed legacy HTML/source/provenance.
All original art/metadata is hash-preserved at its new paths. No old source file
is lost by making dist a generated directory.

## Future Codex sessions

Prefer starting a repository-attached task against crazy5150760/last-stand-after-dark,
selecting the development branch after it is uploaded. Configure the environment's
setup command to run `bash scripts/setup.sh` and provide Node 24.19.0. Reuse/cache
packages or Playwright browsers only through supported environment controls.
AGENTS.md and the setup scripts travel with Git; they do not guarantee the same
machine, /workspace path or OS permissions will persist.

An ordinary authorized machine can use:

```sh
git clone https://github.com/crazy5150760/last-stand-after-dark.git
cd last-stand-after-dark
git switch refactor/modular-development
bash scripts/setup.sh
npm test
```

Until the branch is uploaded, import the delivered incremental Git bundle in
a normal clone rather than downloading/uploading a generated HTML through a
connector. Its only prerequisite is the actual Alpha 0.86 GitHub source commit, which a normal full repository clone already has. Its dev branch starts from that commit.
Use `git fetch /path/to/Last_Stand_Restructure.bundle refs/heads/refactor/modular-development:refs/heads/refactor/modular-development`,
then switch to that branch. If it already exists locally, inspect first rather
than overwriting it. The source ZIP is another full editable fallback.

The optional devcontainer config describes a standard Node container and port
8000. Container image pulling/building and real-browser setup were not tested in
this restricted workspace. It is portable configuration, not a claim that Codex
has already adopted it or that Docker is available on an Android phone.

## Remaining permissions

No new consent is needed for the owner's already-authorized repository work or
public game/source. Actual platform network/Git credential permissions remain
mandatory. Use supported Git authentication in a working repository environment;
never put a PAT in chat, Git remotes or project files. The optional branch-based
Pages publisher needs a repository secret PAGES_PUBLISH_TOKEN with Contents write,
or an approved GitHub App identity with equivalent capability. A GITHUB_TOKEN push
does not trigger the native Pages build. Configuring that credential or switching
to official Actions Pages hosting is a one-time hosting setup decision, not a
reason to resume huge connector uploads. No such secret was created/read here.
