'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(resolve(file));
const json = file => JSON.parse(read(file));
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
function resolve(file) {
  const target = path.resolve(root, file);
  if (!target.startsWith(root + path.sep)) throw Error('Path escapes project: ' + file);
  return target;
}
let parser;
function acorn() {
  if (parser) return parser;
  const bundled = process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'];
  if (!bundled) throw Error('Bundled Acorn unavailable. Use Node 24.19.0; see DEVELOPMENT.md.');
  const mod = {exports: {}};
  new Function('exports', 'module', bundled)(mod.exports, mod);
  return parser = mod.exports;
}
function assemble() {
  const manifest = json('src/modules.json');
  if (manifest.format !== 1 || new Set(manifest.files).size !== manifest.files.length) throw Error('Invalid module manifest');
  return manifest.prefix + manifest.files.map(file => {
    if (!file.startsWith('src/') || !file.endsWith('.js')) throw Error('Invalid module: ' + file);
    return read(file).toString() + (manifest.gaps?.[file] || '');
  }).join('') + manifest.suffix;
}
function compact(source) {
  const options = {ecmaVersion: 'latest', sourceType: 'script'};
  const scanner = acorn().tokenizer(source, options);
  let result = '', previous = 0, label = '';
  for (;;) {
    const token = scanner.getToken();
    if (token.type.label === 'eof') break;
    const gap = source.slice(previous, token.start);
    if (result && gap && ![';', '{', ','].includes(label)) result += /[\r\n]/.test(gap) ? '\n' : ' ';
    result += source.slice(token.start, token.end);
    previous = token.end; label = token.type.label;
  }
  const normalize = tree => JSON.stringify(tree, (key, value) => ['start', 'end', 'loc', 'range'].includes(key) ? undefined : value);
  if (normalize(acorn().parse(result, options)) !== normalize(acorn().parse(source, options))) throw Error('Compaction changed the AST');
  if (/<\/script/i.test(result)) throw Error('Closing script token in JavaScript');
  return result;
}
function replaceOnce(text, marker, value) {
  if (text.split(marker).length !== 2) throw Error('Expected exactly one template marker: ' + marker);
  return text.replace(marker, () => value);
}
function render() {
  let html = read('index.html').toString();
  html = replaceOnce(html, '@@LSAD_CSS@@', read('src/ui/game.css').toString());
  html = replaceOnce(html, '@@LSAD_GAME@@', compact(assemble()));
  for (const entry of json('assets/embedded.json').assets) {
    const data = read(entry.file);
    if (hash(data) !== entry.sha256) throw Error('Asset hash mismatch: ' + entry.file);
    html = replaceOnce(html, entry.marker, 'data:' + entry.mime + ';base64,' + data.toString('base64'));
  }
  if (/@@LSAD_/.test(html)) throw Error('Unresolved build marker');
  return Buffer.from(html);
}
module.exports = {root, resolve, read, json, hash, acorn, assemble, compact, render};
