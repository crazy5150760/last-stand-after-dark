'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),template=fs.readFileSync(path.join(root,'pwa/sw.template.js'),'utf8'),installer=fs.readFileSync(path.join(root,'pwa/install.js'),'utf8');
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
function worker({scope='https://example.test/game/',build='1111111111111111',stores=new Map(),fault=null}={}){
 const events={},deleted=[],requests=[];let forced=0,claimed=0,puts=0;
 const assets=[{key:'index.html',url:'./',body:'<html>GAME '+build+'</html>',type:'text/html'},{key:'install/',url:'install/',body:'<html>SETUP</html>',type:'text/html'},{key:'install.js',url:'install.js',body:'/* setup */',type:'text/javascript'}];
 const config={version:'Alpha 0.80',build,assets:assets.map(a=>({key:a.key,url:a.url,sha256:hash(a.body),types:[a.type]}))};
 const caches={keys:async()=>[...stores.keys()],open:async name=>{if(!stores.has(name))stores.set(name,new Map());const data=stores.get(name);return{match:async key=>data.get(String(key))?.clone(),put:async(key,response)=>{if(fault==='quota'&&++puts===2)throw Error('quota');data.set(String(key),new Response(await response.arrayBuffer(),{headers:response.headers}))}}},delete:async name=>{deleted.push(name);return stores.delete(name)}};
 const fetch=async request=>{requests.push(request);if(fault==='network')throw Error('network');const a=assets.find(a=>new URL(a.url,scope).href===request.url);assert.ok(a,request.url);const response=new Response(fault==='html-login'?'<html>LOGIN</html>':a.body,{headers:{'content-type':fault==='mime'?'text/plain':a.type}});if(fault==='redirect')Object.defineProperty(response,'redirected',{value:true});return response};
 const self={registration:{scope},addEventListener:(name,fn)=>events[name]=fn,skipWaiting(){forced++},clients:{claim(){claimed++}}};
 vm.runInNewContext(template.replace('__LSAD_CONFIG__',JSON.stringify(config)),{self,caches,fetch,Request,Response,URL,crypto:crypto.webcrypto});
 async function emit(name,extra={}){const pending=[];let response;events[name]?.({...extra,waitUntil:p=>pending.push(p),respondWith:p=>response=p});await Promise.all(pending);return response?await response:undefined}
 return{scope,build,stores,deleted,requests,assets,emit,forced:()=>forced,claimed:()=>claimed,cacheName:'lsad-pwa-v1:'+encodeURIComponent(scope)+':'+build};
}
for(const fault of ['network','redirect','html-login','mime','quota'])test('offline install rejects '+fault+' and preserves older copy',async()=>{
 const old=worker();await old.emit('install');const before=[...old.stores.get(old.cacheName).keys()];const next=worker({build:'2222222222222222',stores:old.stores,fault});await assert.rejects(next.emit('install'));assert.ok(old.stores.has(old.cacheName));assert.deepEqual([...old.stores.get(old.cacheName).keys()],before);assert.ok(!old.stores.has(next.cacheName));
});
test('installation verifies all payloads and ready status before offline play',async()=>{
 const w=worker();let status;await w.emit('message',{data:{type:'LSAD_STATUS'},ports:[{postMessage:v=>status=v}]});assert.equal(status.ready,false);await w.emit('install');await w.emit('message',{data:{type:'LSAD_STATUS'},ports:[{postMessage:v=>status=v}]});assert.equal(status.ready,true);assert.equal(w.requests.length,3);for(const r of w.requests){assert.equal(r.cache,'reload');assert.equal(r.redirect,'error');assert.equal(r.credentials,'same-origin')}
});
test('already complete same-build cache survives retry even if network fails',async()=>{
 const first=worker();await first.emit('install');const repeat=worker({stores:first.stores,fault:'network'});await repeat.emit('install');assert.equal(repeat.requests.length,0);assert.ok(repeat.stores.has(repeat.cacheName));
});
test('evicted static files can be repaired concurrently without unregistering or forcing activation',async()=>{
 const w=worker();await w.emit('install');w.stores.get(w.cacheName).delete(w.scope+'install.js');const replies=[];
 await Promise.all([1,2].map(()=>w.emit('message',{data:{type:'LSAD_PREPARE'},ports:[{postMessage:v=>replies.push(v)}]})));
 assert.equal(replies.length,2);assert.ok(replies.every(v=>v.ready));assert.equal(w.requests.length,6);assert.equal(w.forced(),0);assert.equal(w.claimed(),0);
});
test('offline canonical/root/query and install aliases return the verified payload',async()=>{
 const w=worker();await w.emit('install');const n=w.requests.length;for(const url of ['', 'index.html','?from=icon']){const response=await w.emit('fetch',{request:new Request(new URL(url,w.scope))});assert.match(await response.text(),/GAME/)}for(const url of ['install/','install/index.html']){const response=await w.emit('fetch',{request:new Request(new URL(url,w.scope))});assert.match(await response.text(),/SETUP/)}const redirect=await w.emit('fetch',{request:new Request(w.scope+'install')});assert.equal(redirect.status,302);assert.equal(redirect.headers.get('location'),w.scope+'install/');assert.equal(w.requests.length,n);
});
test('worker ignores foreign URLs, unknown paths, backup requests and non-GET writes',async()=>{
 const w=worker();await w.emit('install');for(const request of [new Request('https://another.test/'),new Request(w.scope+'backup.json'),new Request(w.scope+'unrelated'),new Request(w.scope,{method:'POST',body:'records'})])assert.equal(await w.emit('fetch',{request}),undefined);
});
test('activation removes only obsolete app caches for this exact scope',async()=>{
 const old=worker();await old.emit('install');const other=worker({scope:'https://example.test/other/',stores:old.stores});await other.emit('install');old.stores.set('unrelated-cache',new Map());const next=worker({build:'2222222222222222',stores:old.stores});await next.emit('install');assert.ok(old.stores.has(old.cacheName));await next.emit('activate');assert.ok(!old.stores.has(old.cacheName));assert.ok(old.stores.has(next.cacheName));assert.ok(old.stores.has(other.cacheName));assert.ok(old.stores.has('unrelated-cache'));
});
test('no update command forces activation, claims clients or reloads an active game',async()=>{
 const w=worker();await w.emit('install');await w.emit('activate');for(const type of ['SKIP_WAITING','ACTIVATE_NOW','DELETE_CACHES','RELOAD'])await w.emit('message',{data:{type},ports:[]});assert.equal(w.forced(),0);assert.equal(w.claimed(),0);assert.equal(w.deleted.length,0);
});

const flush=async()=>{for(let n=0;n<12;n++)await new Promise(resolve=>setImmediate(resolve))};
function installUI({url='https://example.test/game/install/',initial=null,registration=null,failRegister=false,failUpdate=false,secure=true}={}){
 const elements=Object.fromEntries(['prepare','install','play','status','version','installHint'].map(id=>[id,{textContent:'',hidden:id==='install',disabled:id==='prepare',events:{},addEventListener(name,fn){this.events[name]=fn}}]));const events={},documentEvents={},calls={register:0,update:0,messages:[],prompt:0},timers=new Map();let nextTimer=0;
 const location=new URL(url),scope=new URL('../',location).href;
 function fakeWorker({version='Alpha 0.80',build='1111111111111111',ready=true,scriptURL=new URL('sw.js',scope).href}={}){return{scriptURL,state:'activated',events:{},addEventListener(name,fn){this.events[name]=fn},postMessage(data,ports){calls.messages.push(data);if(data.type==='LSAD_PREPARE')ready=true;ports[0].postMessage({type:'LSAD_STATUS',version,build,ready})}}}
 function fakeReg({active=fakeWorker(),waiting=null,installing=null,regScope=scope}={}){return{scope:regScope,active,waiting,installing,events:{},addEventListener(name,fn){this.events[name]=fn},async update(){calls.update++;if(failUpdate)throw Error('offline');return this}}}
 const reg=registration===null?fakeReg():registration;const available=initial==='ready'?reg:initial;
 const sw={async getRegistration(){return available},async register(){calls.register++;if(failRegister)throw Error('network');return reg}};
 class Channel{constructor(){const port1={onmessage:null,close(){}},port2={close(){},postMessage:data=>queueMicrotask(()=>port1.onmessage?.({data}))};this.port1=port1;this.port2=port2}}
 const document={hidden:false,getElementById:id=>elements[id],addEventListener:(name,fn)=>documentEvents[name]=fn};const window={matchMedia:()=>({matches:false}),addEventListener:(name,fn)=>events[name]=fn};
 const context={location,navigator:{serviceWorker:sw},window,document,URL,MessageChannel:Channel,isSecureContext:secure,setTimeout:fn=>{timers.set(++nextTimer,fn);return nextTimer},clearTimeout:id=>timers.delete(id)};
 vm.runInNewContext(installer,context);
 return{elements,events,document,calls,reg,scope,timers,fakeWorker,fakeReg,async click(id){elements[id].events.click?.();await flush()},async prompt(){const event={preventDefault(){},async prompt(){calls.prompt++},userChoice:Promise.resolve({outcome:'accepted'})};events.beforeinstallprompt(event);await flush();return event}};
}
for(const url of ['file:///tmp/game/install/index.html','http://public.example/game/install/'])test('setup cannot register or install from '+url,async()=>{const u=installUI({url});await flush();assert.equal(u.elements.prepare.disabled,true);await u.click('prepare');assert.equal(u.calls.register,0);assert.match(u.elements.status.textContent,/secure web address/)});
test('setup does not register or download the game automatically',async()=>{const u=installUI();await flush();assert.equal(u.calls.register,0);assert.equal(u.calls.update,0);assert.equal(u.elements.prepare.disabled,false)});
test('explicit setup verifies readiness then offers browser installation',async()=>{const u=installUI();await flush();await u.prompt();assert.equal(u.elements.install.hidden,true);await u.click('prepare');assert.equal(u.calls.register,1);assert.equal(u.calls.update,0);assert.match(u.elements.status.textContent,/Offline play is ready/);assert.equal(u.elements.install.hidden,false);assert.ok(u.calls.messages.every(m=>m.type==='LSAD_STATUS'));assert.equal(u.timers.size,0)});
test('accepted prompt is not called completed until appinstalled fires',async()=>{const u=installUI({initial:'ready'});await flush();await u.prompt();await u.click('install');assert.equal(u.calls.prompt,1);assert.match(u.elements.status.textContent,/Installation requested/);assert.doesNotMatch(u.elements.status.textContent,/installation completed/);u.events.appinstalled();assert.match(u.elements.status.textContent,/installation completed/);assert.equal(u.elements.install.hidden,true)});
test('hidden page cannot open the native installation prompt',async()=>{const u=installUI({initial:'ready'});await flush();await u.prompt();u.document.hidden=true;await u.click('install');assert.equal(u.calls.prompt,0)});
test('setup failure does not claim offline readiness',async()=>{const u=installUI({failRegister:true});await flush();await u.click('prepare');assert.match(u.elements.status.textContent,/did not finish/);assert.equal(u.elements.install.hidden,true);assert.equal(u.elements.prepare.disabled,false)});
test('existing installation checks once without replacing its registration',async()=>{const u=installUI({initial:'ready'});await flush();await u.click('prepare');assert.equal(u.calls.register,0);assert.equal(u.calls.update,1);assert.match(u.elements.status.textContent,/Offline play is ready/)});
test('update failure retains old ready copy and offers retry',async()=>{const u=installUI({initial:'ready',failUpdate:true});await flush();await u.prompt();await u.click('prepare');assert.match(u.elements.status.textContent,/did not finish/);assert.match(u.elements.version.textContent,/Offline copy/);assert.equal(u.elements.install.hidden,false)});
test('setup explicitly repairs missing offline files through the existing worker',async()=>{const u=installUI({initial:'ready'});u.reg.active=u.fakeWorker({ready:false});await flush();await u.click('prepare');assert.equal(u.calls.register,0);assert.equal(u.calls.update,1);assert.equal(u.calls.messages.filter(m=>m.type==='LSAD_PREPARE').length,1);assert.match(u.elements.status.textContent,/Offline play is ready/)});
test('waiting update instructs closing all windows and never activates itself',async()=>{const u=installUI({initial:'ready'});u.reg.waiting=u.fakeWorker({version:'Alpha 0.81',build:'2222222222222222'});await u.click('prepare');assert.match(u.elements.status.textContent,/Update ready: Alpha 0.81/);assert.match(u.elements.status.textContent,/close this page and every game window/);assert.ok(u.calls.messages.every(m=>m.type==='LSAD_STATUS'))});
test('unrelated worker registration is never replaced',async()=>{const reg={scope:'https://example.test/game/',active:{scriptURL:'https://example.test/another-sw.js'}};const u=installUI({initial:reg});await flush();assert.equal(u.elements.prepare.disabled,true);await u.click('prepare');assert.equal(u.calls.register,0)});
test('localhost setup is allowed when browser marks context secure',async()=>{const u=installUI({url:'http://localhost/game/install/'});await flush();await u.click('prepare');assert.equal(u.calls.register,1)});
test('generated package hashes every cached file and keeps all game logic identical',()=>{
 const info=JSON.parse(fs.readFileSync(path.join(root,'web-dist/build-info.json'))),standalone=fs.readFileSync(path.join(root,'dist/index.html'),'utf8'),hosted=fs.readFileSync(path.join(root,'web-dist/index.html'),'utf8');assert.equal(info.standaloneSha256,hash(standalone));assert.equal(info.hostedGameSha256,hash(hosted));assert.equal(standalone.match(/<script>([\s\S]*?)<\/script>/)[1],hosted.match(/<script>([\s\S]*?)<\/script>/)[1]);for(const a of info.cacheAssets){const name=a.key==='install/'?'install/index.html':a.key;assert.equal(hash(fs.readFileSync(path.join(root,'web-dist',name))),a.sha256)}const manifest=JSON.parse(fs.readFileSync(path.join(root,'web-dist/manifest.webmanifest')));assert.equal(manifest.id,'./');assert.equal(manifest.display,'standalone');assert.equal(manifest.orientation,undefined);assert.ok(manifest.icons.some(i=>i.purpose==='maskable'));
});
test('actual generated worker installs all real files and serves the complete game offline',async()=>{
 const info=JSON.parse(fs.readFileSync(path.join(root,'web-dist/build-info.json'))),scope='https://example.test/review/',events={},stores=new Map();let online=true,requests=0;
 const caches={keys:async()=>[...stores.keys()],delete:async name=>stores.delete(name),open:async name=>{if(!stores.has(name))stores.set(name,new Map());const data=stores.get(name);return{match:async key=>data.get(key)?.clone(),put:async(key,response)=>data.set(key,new Response(await response.arrayBuffer(),{headers:response.headers}))}}};
 const fetch=async request=>{requests++;if(!online)throw Error('airplane-mode fixture');const entry=info.cacheAssets.find(a=>new URL(a.url,scope).href===request.url);assert.ok(entry);const name=entry.key==='install/'?'install/index.html':entry.key;return new Response(fs.readFileSync(path.join(root,'web-dist',name)),{headers:{'content-type':entry.types[0]}})};
 const self={registration:{scope},addEventListener:(name,fn)=>events[name]=fn};vm.runInNewContext(fs.readFileSync(path.join(root,'web-dist/sw.js'),'utf8'),{self,caches,fetch,Request,Response,URL,crypto:crypto.webcrypto});
 let work;events.install({waitUntil:p=>work=p});await work;assert.equal(requests,8);online=false;events.activate({waitUntil:p=>work=p});await work;
 let result;events.fetch({request:new Request(scope),respondWith:p=>result=p});const game=await result;assert.equal(hash(Buffer.from(await game.arrayBuffer())),info.hostedGameSha256);assert.equal(requests,8);
 events.fetch({request:new Request(scope+'install/'),respondWith:p=>result=p});assert.match(await (await result).text(),/PREPARE OFFLINE PLAY/);assert.equal(requests,8);
});
