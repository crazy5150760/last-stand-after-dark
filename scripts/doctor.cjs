'use strict';
const fs=require('node:fs');
const {acorn,json,root}=require('./lib/project.cjs');
const version=fs.readFileSync(root+'/.nvmrc','utf8').trim();
if(process.versions.node!==version)throw Error('Use Node '+version+' (nvm use). Current: '+process.versions.node);
const parser=acorn();
if(parser.version!=='8.17.0')throw Error('Unexpected bundled parser '+parser.version+'; review compaction before changing runtime');
json('src/modules.json');json('assets/catalog.json');
console.log(JSON.stringify({node:process.version,parser:parser.version,project:root,buildDependencies:'Node built-ins only',browserTests:'Playwright 1.62.1 + installed Chromium; npm run setup:browser',git:'Run git status and git remote -v locally; do not publish credential-bearing URLs',permissions:'This command does not test network access, Git authentication or browser launch'}));
