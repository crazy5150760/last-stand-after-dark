#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/doctor.cjs
node tools/build_game.cjs
node tools/build_pwa.cjs
node scripts/check.cjs
printf '%s\n' 'Ready. Run npm test, then npm run serve. Browser setup is optional: npm run setup:browser (network required).'
