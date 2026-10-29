'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {waitForAsyncState}=require('./lib/browser-state.cjs');
test('async false/null results cannot be mistaken for readiness',async()=>{
 const answers=[false,null,{ready:true}];let evaluations=0,waits=0;
 const page={async evaluate(fn,arg){evaluations++;return await fn(arg)},async waitForTimeout(){waits++}};
 const result=await waitForAsyncState(page,async arg=>{await Promise.resolve();assert.equal(arg,'scope');return answers.shift()},'scope');
 assert.deepEqual(result,{ready:true});assert.equal(evaluations,3);assert.equal(waits,2);
});
test('an async condition that never becomes ready fails instead of passing',async()=>{
 const page={async evaluate(){return false},async waitForTimeout(ms){await new Promise(ok=>setTimeout(ok,ms))}};
 await assert.rejects(waitForAsyncState(page,()=>false,undefined,{timeout:10,poll:2}),/did not become ready/);
});
test('browser evaluation errors are preserved, not retried into a pass',async()=>{
 let calls=0;const page={async evaluate(){calls++;throw Error('worker failed')},async waitForTimeout(){throw Error('unexpected retry')}};
 await assert.rejects(waitForAsyncState(page,()=>true),/worker failed/);assert.equal(calls,1);
});
