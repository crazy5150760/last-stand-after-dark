'use strict';
const {createRequire}=require('node:module');
const fs = require('node:fs'),path = require('node:path'),vm = require('node:vm'),assert = require('node:assert/strict');
const {root,read,json,hash,acorn,assemble,render} = require('./lib/project.cjs');
const manifest = json('src/modules.json');
const walk = dir => fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name):[dir+'/'+e.name]);
const sourceFiles = walk('src').filter(file=>file.endsWith('.js'));
assert.deepEqual(sourceFiles.sort(),[...manifest.files].sort(),'Every source module must be in the ordered manifest');
for(const file of [...sourceFiles,...walk('scripts').filter(f=>f.endsWith('.cjs')),...walk('tools').filter(f=>f.endsWith('.cjs')),...walk('tests').filter(f=>f.endsWith('.cjs')),'pwa/install.js']){
 const text=read(file).toString();new vm.Script(text,{filename:file});
 const tree=acorn().parse(text,{ecmaVersion:'latest',sourceType:'script'}),localRequire=createRequire(path.join(root,file));
 function visit(node){
  if(!node||typeof node!=='object')return;
  if(node.type==='CallExpression'&&node.callee?.name==='require'&&typeof node.arguments[0]?.value==='string'&&node.arguments[0].value.startsWith('.'))localRequire.resolve(node.arguments[0].value);
  for(const value of Object.values(node))if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);
 }
 visit(tree);
}
acorn().parse(assemble(),{ecmaVersion:'latest',sourceType:'script'});
for(const asset of json('assets/catalog.json').files)assert.equal(hash(read(asset.file)),asset.sha256,asset.file);
for(const file of ['pwa/manifest.webmanifest','assets/embedded.json','.openai/hosting.json','legacy/alpha-0.86/source-inventory.json'])json(file);
const html=render().toString(); assert.match(html,/name="viewport"/);
for(const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){
 if(/application\/json/.test(m[1]))JSON.parse(m[2]);else new vm.Script(m[2]);
}
const icons=json('pwa/manifest.webmanifest');for(const icon of icons.icons)read('pwa/'+icon.src);
assert.equal(icons.scope,'./');assert.equal(icons.start_url,'./');assert.equal(icons.id,'./');
console.log(JSON.stringify({sourceModules:sourceFiles.length,assetFiles:json('assets/catalog.json').files.length,syntax:'passed',manifestPaths:'passed'}));
