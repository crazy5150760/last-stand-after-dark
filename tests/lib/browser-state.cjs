'use strict';
// Playwright's predicate poller treats a returned Promise as truthy. Await each
// browser evaluation explicitly before deciding that an async condition is ready.
async function waitForAsyncState(page,predicate,arg,{timeout=90000,poll=100}={}){
 const deadline=Date.now()+timeout;
 do{
  const result=await page.evaluate(predicate,arg);
  if(result)return result;
  if(Date.now()>=deadline)break;
  await page.waitForTimeout(poll);
 }while(Date.now()<=deadline);
 throw Error('Asynchronous browser state did not become ready within '+timeout+'ms');
}
module.exports={waitForAsyncState};
