// Offline standalone builder. Uses the JavaScript parser shipped inside Node.
// Keeps token text and every inter-token newline; removes comments/indentation.
// The readable source stays in src/game.js. No asset conversion or network work.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),input=path.join(root,'src/game.js'),output=path.join(root,'dist/index.html');
const bundled=process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'];
if(!bundled)throw Error('This offline builder needs a Node release with bundled Acorn. See BUILDING.md.');
const parserModule={exports:{}};new Function('exports','module',bundled)(parserModule.exports,parserModule);const parser=parserModule.exports;
const source=fs.readFileSync(input,'utf8'),options={ecmaVersion:'latest',sourceType:'script'};
let compact='',previous=0;
const scanner=parser.tokenizer(source,options);
for(;;){
 const token=scanner.getToken();
 if(token.type.label==='eof')break;
 const gap=source.slice(previous,token.start);
 if(compact&&gap)compact+=/[\r\n]/.test(gap)?'\n':' ';
 compact+=source.slice(token.start,token.end);previous=token.end;
}
const normalize=tree=>JSON.stringify(tree,(key,value)=>['start','end','loc','range'].includes(key)?undefined:value);
assert.equal(normalize(parser.parse(compact,options)),normalize(parser.parse(source,options)),'Compaction changed JavaScript syntax/semantics.');
new vm.Script(compact,{filename:'standalone-game.js'});
assert.ok(!/<\/script/i.test(compact),'Inline script must not contain an HTML closing-script token.');
const html=fs.readFileSync(output,'utf8'),match=html.match(/<script>([\s\S]*?)<\/script>/);assert.ok(match,'Expected one main inline script.');
const result=html.slice(0,match.index)+'<script>'+compact+'</script>'+html.slice(match.index+match[0].length);
assert.ok(Buffer.byteLength(result)<12*1024*1024,'Standalone exceeds 12 MiB.');
if(process.argv.includes('--check'))assert.equal(html,result,'dist/index.html is stale: run node tools/build_game.cjs');else fs.writeFileSync(output,result);
console.log(JSON.stringify({node:process.version,parser:parser.version,sourceBytes:Buffer.byteLength(source),compactBytes:Buffer.byteLength(compact),standaloneBytes:Buffer.byteLength(result),headroomBytes:12*1024*1024-Buffer.byteLength(result),astEquivalent:true,checkOnly:process.argv.includes('--check')}));
