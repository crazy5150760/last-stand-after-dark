// Compatibility entry point. Preserve the original private closure.
'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const {resolve, read, json, render, hash} = require('../scripts/lib/project.cjs');
const result = render(), check = process.argv.includes('--check');
// Visual pilot adds code only; unchanged embedded media retain the original hashes.
assert.ok(result.length < 12 * 1024 * 1024 + 4 * 1024, 'Standalone exceeds 12 MiB plus 4 KiB pilot code allowance');
if (check) assert.deepEqual(read('dist/index.html'), result, 'Build is stale: npm run build');
else { fs.mkdirSync(resolve('dist'), {recursive:true}); fs.writeFileSync(resolve('dist/index.html'), result); }
// Recreate original reference paths for unchanged tests and optional art tools.
// These reference files are NOT shipped in production web-dist.
for (const asset of json('assets/catalog.json').files) {
  const bytes = read(asset.file); assert.equal(hash(bytes), asset.sha256, asset.file);
  if (check) assert.deepEqual(read(asset.legacy), bytes, asset.legacy + ' is stale');
  else { fs.mkdirSync(path.dirname(resolve(asset.legacy)), {recursive:true}); fs.writeFileSync(resolve(asset.legacy), bytes); }
}
console.log(JSON.stringify({standaloneBytes:result.length,sha256:hash(result),checkOnly:check}));
