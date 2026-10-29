# Remote restructuring review — 2026-10-29

Draft PR: https://github.com/crazy5150760/last-stand-after-dark/pull/6
Branch: refactor/modular-development
Base: alpha-0.86-health-feedback
Latest checks: https://github.com/crazy5150760/last-stand-after-dark/pull/6/checks

The development source is confirmed on GitHub. Its initial tree
464917745d405ce374af02e596f86149d63c3817 exactly matched the locally verified
2344d837bc3e71f9ece5409af22cd846ab0f10ec commit. The initial transfer reused 71
existing blobs and sent about 668 KB of changed text. Later transfers changed
only test/CI/documentation text. No complete game HTML or artwork was re-uploaded.

## Verified remote evidence

- Final source-head runs 40940466132 (push) and 40940480987 (PR) both completed
  successfully on 248547a100a3c6873fb5d40bde95de054b296348. Each passed all
  1,410 core cases and the real Chromium checks described below. Both conclusions
  were rechecked during continuation; the failed/cancelled experiments below are
  historical fixture evidence, not the final result.
- Run 40933415231 completed all 1,410 core tests with zero failures, as well as
  setup, syntax/assets, build and stale-output checks. Its first browser fixture
  failed during offline navigation; it is not reported as an entirely passed run.
- Run 40939796438 completed the real Chromium browser step successfully: mobile
  portrait/landscape startup, all 21 image decodes and the original stereo OGG,
  joystick with second-finger Pause, frozen clock, Settings return, offline reload
  and a fresh offline page. Browser evidence was observed before recording these
  notes; consult the PR's latest checks for the complete final pipeline result.
- Mobile layout/touch uses mobile-emulated Chromium. Worker/offline integration
  uses separate standard Chromium contexts at both viewport sizes. Neither is a
  physical S21 Ultra / Brave result or a device performance benchmark.

Core evidence:
https://github.com/crazy5150760/last-stand-after-dark/actions/runs/40933415231
Browser-step evidence:
https://github.com/crazy5150760/last-stand-after-dark/actions/runs/40939796438
Final complete push gate:
https://github.com/crazy5150760/last-stand-after-dark/actions/runs/40940466132
Final complete PR gate:
https://github.com/crazy5150760/last-stand-after-dark/actions/runs/40940480987

The offline fixture now waits for full worker activation/readiness and performs
an ordinary online reload if its new document is still uncontrolled, before
cutting network access. It does not call clients.claim, skipWaiting, unregister,
or change the worker. Early timing/setup experiments failed and remain visible
in CI history; those failures were not hidden or converted into skipped passes.
The final gate repeats browser and full core tests on the review head.

All production game/PWA files retain Alpha 0.86 bytes and build ID
7cf8f34890269ad6. Main, alpha-0.86-health-feedback, gh-pages, the existing domain,
original Site and protected releases are unchanged. No game update or replacement
preview was deployed. The PR remains draft for owner phone acceptance and review
of the older source PR chain before any main merge.

## Environment boundary

The local workspace still cannot reach its required shell Git proxy or launch
Chromium/localhost sockets. The connected GitHub app now supports source review
and small batched text transfers. GitHub Actions supplies the working ordinary
repository checkout, pinned setup, builds and browser runner. It does not make
this local machine permanent or grant it CLI credentials. Future repository tasks
can reuse AGENTS.md, .nvmrc, scripts/setup.sh, package commands and the optional
devcontainer. Container startup and future APK packaging remain untested.

Normal direct Git and the optional Pages publishing identity/default-branch
integration remain separate environment/hosting setup work. No new consent is
needed for the already-authorized source work or approved public game/source.

## Continuation preparation

The current remote PR discussion/reviews contained no owner phone acceptance.
The five earlier source PRs are still drafts; their commit parents were checked
and form the complete main-to-Alpha-0.86 chain. Main's original two blobs are
preserved in the source tree (the README under docs/history). See INTEGRATION.md
for the concrete default-branch review order and one-time publishing setup.

The manual publisher now supports a verification-only rehearsal when its publish
input is false, instead of skipping all work. It checks/builds/tests and saves
an artifact without entering the publish job or using a publishing identity.
This path remains undispatched until default-branch integration; local workflow
checks and normal source CI do not establish successful Pages publication.
