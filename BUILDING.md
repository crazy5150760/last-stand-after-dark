> Current release: Alpha 0.85 · Clear Upgrade Choices. Local targeted checks and the source AST comparison cover a read-only preview helper and upgrade presentation; all native choice effects/odds/guards remain unchanged. See PLAYTEST.md and release artifacts for current counts and publication status. Older validation sections below describe their named snapshots.

# Building the standalone game

Alpha 0.84 keeps the existing offline HTML/Canvas game and Site identity. There is no npm install, framework, server, new engine, repository synchronization or publication step.

The readable main JavaScript is now **src/game.js**. **dist/index.html** remains the HTML/CSS/embedded-media template and ready-to-play standalone file; its main inline script is generated from that source. The original media source files and asset tools remain under dist/assets and tools.

## Local commands

Use Node with bundled Acorn, tested with **Node v24.19.0 / Acorn 8.17.0**:

```
node tools/build_game.cjs
node tools/build_game.cjs --check
LS_TEST_GC=1 LS_TEST_PROGRESS=1 node --expose-gc --max-old-space-size=512 tests/game.test.cjs
```

For a focused batch check:

```
node --test-name-pattern='[Ss]etting|[Aa]udio|[Vv]olume|[Pp]reference|[Ff]ocus|[Bb]ack|[Bb]enchmark|Alpha 0\.81|original Site|loadout identity' tests/game.test.cjs
```

Do not add `--test` to the established VM runner invocation. Tests inject their API in memory; the delivered game exposes none.

Edit JavaScript in src/game.js, then rebuild. Edit layout/CSS/embedded-media sections in dist/index.html as before, then rebuild/check. Do not edit only the generated main inline JavaScript: the next build replaces it. Keep the existing hosting manifest untouched for local development.

## What the builder does

The offline helper uses the JavaScript parser already shipped within Node. It retains every token's original text and inter-token line breaks, removes comments, and compresses indentation/extra whitespace. It compares the full original and compact syntax trees while ignoring source positions, compiles the result with Node, rejects a raw closing-script token, and enforces the existing 12 MiB standalone limit before writing. No string/data literal, artwork, metadata, audio, CSS or gameplay value is reencoded. `--check` verifies the artifact is current without writing it; repeated builds are byte-identical.

Node's bundled-parser path is an internal API. If a Node release does not provide it, the helper stops with a clear error instead of silently producing a file. Use the tested runtime or deliberately review a future builder update. No parser code is vendored or fetched, and no external package is installed. The exported HTML itself needs no Node or builder to play.

Browser/Android behavior is still checked through PLAYTEST.md. VM tests and AST equivalence do not establish real touch/layout/FPS, operating-system interruption ordering or storage durability.


## Alpha 0.80 — installable web package

Build the standalone first, then the separate static HTTPS output:

```
node tools/build_game.cjs
node tools/build_pwa.cjs
node tools/build_pwa.cjs --check
node tests/pwa.test.cjs
```

pwa/ holds the manifest, setup HTML/CSS/JS, worker template and committed PNG icons. tools/build_pwa.cjs generates ignored web-dist with eleven deployment files. The local hosting manifest points at web-dist with the original project ID. Normal builds need only the tested Node runtime; icons are already committed. tools/make_app_icons.py is an optional Pillow/DejaVu source for icon regeneration. No npm install or new engine.

The standalone receives no installer/runtime module; only its six version labels change. Hosted index adds relative manifest/icon/application metadata, with identical game script. The home-screen start URL is the game, while /install/ performs explicit caching/install/update checks. A launcher shortcut may expose Setup & Updates. A 16-character build ID covers all eight cached payloads plus the worker template; MIME/SHA checks reject partial, redirected or transformed files. Default waiting lifecycle protects open game clients; no skipWaiting/claim/reload or record access is present.

See INSTALL_UPDATE_GUIDE.md for deployment/root/HTTPS/private-auth expectations. Local preparation does not publish or sync the Site. Generating or unzipping the hosted package is not an Android install test; native browser/worker behavior still requires approved HTTPS hosting and the owner checklist.


## Current local development status — Alpha 0.81

The owner accepted Alpha 0.80. The source-upload network approval did not appear in the workspace, so private publication/install testing is parked. No new network operation is needed for local builds. Rebuild both outputs so the prepared hosted package stays consistent, but do not claim it is live. Alpha 0.81 changes only Pause presentation and current build labels. Use the current PLAYTEST.md for the short S21 Ultra / Brave checklist.


## Alpha 0.82 validation scope

Only Settings presentation and six native version labels change. Preserve the full passing Alpha 0.81 regression log as baseline evidence; run the focused menu/control/audio/record-navigation cases above plus node tests/pwa.test.cjs and both builder checks. Current-build counts and the AST/template comparison accompany the release. The full 1,333-case suite remains available when gameplay, save behavior, runtime state or a new concern justifies it. Publication is still parked; these commands need no network or dependency installation.


## Alpha 0.84 update-status validation

The current main JavaScript and standalone must normalize exactly to Alpha 0.83 after replacing six 0.84/0_84 build labels. PWA setup changes active/downloaded labels, restart help and read-only refresh events. The worker template and manifest identity/scope stay the same. Run both builder checks and the 32-case PWA suite; the existing alpha-* CI runs the full native suite and archive checks before publication. The original SOURCE_BACKUP_MANIFEST.json describes the immutable Alpha 0.82 import, not later releases; use release SOURCE_CHECKS.json/BUILD_INFO.json and Git commit/tree for current provenance. Follow PLAYTEST.md on the phone. Keep an existing installed app and records; no reinstall or storage clear is part of this update.
