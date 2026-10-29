# Restructuring validation — 2026-10-29

The locally restructured project is validated for review, not declared a completed
browser/Android release. No gameplay change, new version or live replacement was
performed. Machine-readable evidence is in validation/results.json; full raw logs
and probe outputs are retained in the separate validation artifact bundle.

| Check | Baseline | Restructured result |
|---|---:|---:|
| Native game VM regression suite | 1,368 passed | 1,368 passed, 0 failures |
| PWA/setup/update cases | 32 passed | 32 passed, 0 failures |
| Exact source/HTML/art/provenance preservation | n/a | 7 passed |
| Actual URL handler, MIME and path checks | n/a | 3 passed |
| Syntax/local requires/module manifest/assets | Existing builder passed | Passed; 50 modules, 63 original assets |
| Standalone + production build/stale checks | Passed | Passed |
| Complete production file comparison | Reference | All 11 files byte-identical |
| Seeded intersection, progression, offer-draw probes | Reference | All 20 output rows exactly equal |
| New npm gameplay runner, focused smoke | n/a | 14 Alpha 0.86 cases passed |
| Archive creation, CRC/member/hash verification | Existing packager | Passed |
| Workflow YAML parsing | n/a | Both workflow files parsed |
| Publisher file-copy fixture | n/a | 11 files copied; CNAME/prior content retained |
| npm offline core lock/setup | n/a | npm ci --ignore-scripts --offline passed |
| Clean source archive extraction | n/a | CRC, setup, build, 42 fast tests and stale checks passed |
| Local Git object connectivity | n/a | Passed |
| Chromium / real browser / phone | Not available here | Blocked, not passed |
| Local HTTP socket listen | Not available here | EPERM, not passed |
| New remote CI / normal Git push / deployment | Existing Alpha 0.86 CI/deploy succeeded | Not performed/confirmed |

There are **1,410 passing tests** in the four full restructured suites, plus the
separate focused runner smoke. Three independent deterministic probes emitted six
intersection rows, 12 progression rows and two upgrade-draw rows; all matched the
protected baseline byte-for-byte. These are native simulated observations, not
natural runs or device performance results. The full game suite took about 368
seconds versus 354 seconds for the baseline VM run; this is test-runner wall time,
not game FPS, and is not interpreted as a performance change.

## Exact preservation evidence

- Source assembly equals the unchanged readable private-closure script.
- Standalone SHA256:
  e7f98eefc50112f0a975f8ce869524d6223e291d9f67336f5ad08f1ad1bda92f
- Standalone size: 12,579,524 bytes. Hosted game: 12,579,734 bytes.
- All 22 decoded embedded image/audio payloads match their original files.
- All 63 original art/metadata files match the pre-restructure inventory.
- Production package: 11 files, 12,639,427 bytes, PWA build 7cf8f34890269ad6.
- Every production file, including worker, build info, icons and installer, matches
  the pre-restructure generated package exactly. The original .openai hosting
  manifest, root Alpha 0.82 HTML and native/PWA test files also match their hashes.
- The token compactor still checks full normalized AST equality before embedding.
  Exact output preserves existing load/decode/simulation/rendering code and timing
  paths; no added runtime work or new external-media fetch is introduced.

## What the automated suites cover

The unchanged native suite executes the actual shipped inline script through its
existing DOM/Canvas/audio/history/storage/clock boundary. It exercises movement,
Dash/input guards, upgrades and evolutions, native damage/armor/protection, enemy
and boss behavior, timing/spawning, objectives/extraction/overtime, menus, saved
records/backup/recovery, settings and existing artwork/state lifecycles. No test
API is added to the delivered game. The PWA suite checks exact cached payloads,
partial failures, offline responses and waiting/update UI through its established
worker/cache mocks. This is behavior coverage, not a real browser.

The new handler tests invoke the actual server request callback with streamed
responses without opening a socket. They verify the repository subdirectory,
all eight offline URLs, real file bytes/MIME and invalid path behavior. They do
not establish that this environment can serve a reachable address.

## Explicit browser/device limits

Chromium failed before opening a page at crashpad socket.cc setsockopt: Operation
not permitted. Playwright using the installed Chromium reproduced that failure.
The local server also failed to bind 127.0.0.1:8000 with listen EPERM. No network
permission workaround or sandbox bypass was used to make those checks appear to
pass. No browser screenshot, physical touch, Android frame rate, GPU/memory/heat,
audio perception, OS lifecycle, persistent storage durability or APK was verified.

The optional real-browser test is prepared to check initialization/loading errors,
portrait/landscape width, multi-touch joystick with second-finger Pause, frozen
clock, Settings return and real service-worker offline launch in disposable
Chromium contexts. It fails if unavailable; it is not skipped as a success. Its
functional paths and the revised GitHub Actions jobs still need their first run
on a browser-capable host. Do not merge based on syntax/VM checks alone.

## Remaining gates

1. Push the local development branch through an authorized normal Git connection;
   a prior connector branch-creation request is unconfirmed. No remote PR exists
   that this task can verify.
2. Run the new CI and Chromium checks; fix any real-browser fixture or runtime
   failures before treating the new workflow as verified.
3. Complete docs/MANUAL_TEST.md on S21 Ultra / Brave against the candidate bytes.
4. Review the source PR chain/default-branch setup and publishing identity. Only
   then publish a changed candidate, retaining the current live game and domain.

The owner previously phone-accepted Alpha 0.85. Alpha 0.86 is the latest published
and previously CI-verified release, not a separately recorded phone acceptance.
No pending checklist item is silently promoted to a passed result.
