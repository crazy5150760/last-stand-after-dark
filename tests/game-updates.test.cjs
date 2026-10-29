'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../pwa/game-updates.js'),'utf8');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function fixture({url='https://example.test/game/index.html?from=icon',secure=true,support=true,hidden=false,online=true,loading=false,existing=true,scope,foreign,waiting=false,installing=false,fail=false,hold=false}={}){
 const location=new URL(url),root=new URL('./',location).href,events={},documentEvents={},calls={register:[],get:[],update:0,reload:0,forbidden:0};let now=1000,release;
 const worker=()=>({scriptURL:new URL('sw.js',root).href});
 const reg={scope:scope||root,active:worker(),waiting:waiting?worker():null,installing:installing?worker():null,async update(){calls.update++;if(hold)await new Promise(ok=>release=ok);if(fail)throw Error('offline')},unregister(){calls.forbidden++;throw Error('must not unregister')}};
 if(foreign)reg[foreign]={scriptURL:'https://example.test/unrelated-worker.js'};
 const document={hidden,readyState:loading?'loading':'complete',addEventListener:(n,f)=>documentEvents[n]=f};
 const navigator={onLine:online,serviceWorker:support?{async getRegistration(url){calls.get.push(url);return existing?reg:null},async register(...args){calls.register.push(args);if(fail)throw Error('offline');return reg}}:undefined};
 const window={addEventListener:(n,f)=>events[n]=f};
 location.reload=()=>calls.reload++;
 const context={location,document,navigator,window,isSecureContext:secure,URL,Date:{now:()=>now}};
 for(const key of ['localStorage','sessionStorage'])Object.defineProperty(context,key,{get(){calls.forbidden++;throw Error('records must not be read')}});
 vm.runInNewContext(source,context);
 return{calls,document,navigator,reg,events,documentEvents,advance:ms=>now+=ms,release:()=>release?.()};
}
test('normal HTTPS game link registers its own verified offline worker automatically',async()=>{
 const f=fixture({existing:false});await flush();assert.equal(f.calls.register.length,1);assert.equal(f.calls.register[0][0],'https://example.test/game/sw.js');
 assert.equal(f.calls.register[0][1].scope,'https://example.test/game/');assert.equal(f.calls.register[0][1].updateViaCache,'none');assert.equal(f.calls.update,0);
});
test('root game URL and index URL use the same repository subdirectory scope',async()=>{
 for(const url of ['https://example.test/game/','https://example.test/game/index.html?x=1']){const f=fixture({url});await flush();assert.deepEqual(f.calls.get,['https://example.test/game/']);assert.equal(f.calls.update,1)}
});
for(const opts of [{url:'file:///tmp/game.html'},{url:'http://example.test/game/'},{secure:false},{support:false}])test('unsupported origin/context never installs or checks '+JSON.stringify(opts),async()=>{
 const f=fixture(opts);await flush();assert.equal(f.calls.get.length,0);assert.equal(f.calls.register.length,0);
});
test('secure localhost supports a same-scope automatic check',async()=>{const f=fixture({url:'http://localhost/game/'});await flush();assert.equal(f.calls.update,1)});
for(const foreign of ['active','waiting','installing'])test('foreign '+foreign+' worker is never replaced',async()=>{const f=fixture({foreign});await flush();assert.equal(f.calls.update,0);assert.equal(f.calls.register.length,0)});
test('inherited parent-scope registration is never replaced',async()=>{const f=fixture({scope:'https://example.test/'});await flush();assert.equal(f.calls.update,0);assert.equal(f.calls.register.length,0)});
test('hidden game waits for visibility before any download',async()=>{const f=fixture({hidden:true});await flush();assert.equal(f.calls.get.length,0);f.document.hidden=false;f.documentEvents.visibilitychange();await flush();assert.equal(f.calls.update,1)});
test('offline game keeps playing and checks when connection returns',async()=>{const f=fixture({online:false});await flush();assert.equal(f.calls.get.length,0);f.navigator.onLine=true;f.events.online();await flush();assert.equal(f.calls.update,1)});
test('background return/event bursts are throttled; later return checks again',async()=>{
 const f=fixture();await flush();for(let i=0;i<5;i++){f.events.online();f.events.pageshow();f.documentEvents.visibilitychange()}await flush();assert.equal(f.calls.update,1);
 f.advance(15*60*1000);f.events.pageshow();await flush();assert.equal(f.calls.update,2);
});
test('concurrent events do not duplicate a pending update',async()=>{const f=fixture({hold:true});await flush();f.events.online();f.advance(16*60*1000);f.documentEvents.visibilitychange();await flush();assert.equal(f.calls.update,1);f.release();await flush()});
test('network failure is contained and a later return retries without deleting records',async()=>{
 const f=fixture({fail:true});await flush();f.events.online();await flush();assert.equal(f.calls.update,1);f.advance(30000);f.events.pageshow();await flush();assert.equal(f.calls.update,2);assert.equal(f.calls.forbidden,0);assert.equal(f.calls.reload,0);
});
for(const key of ['waiting','installing'])test(key+' update never forces activation or reloads a run',async()=>{
 const f=fixture({[key]:true});await flush();assert.equal(f.calls.update,0);assert.equal(f.calls.register.length,0);assert.equal(f.calls.forbidden,0);assert.equal(f.calls.reload,0);
});
test('initial check waits until window load and never changes game/storage state',async()=>{const f=fixture({loading:true});await flush();assert.equal(f.calls.get.length,0);f.events.load();await flush();assert.equal(f.calls.update,1);assert.equal(f.calls.forbidden,0);assert.equal(f.calls.reload,0)});
