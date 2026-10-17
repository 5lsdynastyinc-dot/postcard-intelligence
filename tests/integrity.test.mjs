import test from 'node:test';
import assert from 'node:assert/strict';
import {validateContentIntake,validateContentRecord} from '../functions/lib/content-state.js';
import {runContentStateContractTests} from '../functions/lib/content-state.test.js';
import {validateDistributionEvent,toHouseOutcomeEnvelope} from '../functions/lib/distribution-events.js';
import {validateIntentHandoff,toHouseHandoffEnvelope} from '../functions/lib/intent-handoff.js';
import {onRequestPost as contentPost} from '../functions/api/content.js';
import {onRequestPost as distributionPost} from '../functions/api/distribution-events.js';
import {onRequestPost as handoffPost} from '../functions/api/intent-handoffs.js';
import {onRequestPost as releasePost} from '../functions/api/content-release.js';
import {contentHash} from '../functions/lib/content-identity.js';
const stamp='2026-10-16T10:00:00Z';
const draft=()=>({id:'TEST-ONLY',title:'Local fixture',state:'DRAFT',created_at:stamp,provenance:[]});
const event=()=>({event_id:'TEST-ONLY',content_id:'TEST-CONTENT',event_type:'VIEWED',channel:'WEB',occurred_at:stamp});
const handoff=()=>({handoff_id:'TEST-ONLY',source_unit:'POSTCARD',target_unit:'TEST-ROOM',intent_summary:'Local fixture',state:'PROPOSED',created_at:stamp});
function context(payload, db, token='local-test-token') {
  return {env:{POSTCARD_API_TOKEN:'local-test-token',DB:db},request:new Request('https://example.invalid/api',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(payload)})};
}
function spyDB(failBatch=false) {
  const statements=[]; const batches=[]; const runs=[];
  return {statements,batches,runs,prepare(sql){const s={sql,values:[],bind(...v){this.values=v;return this;},async run(){runs.push(this);return {success:true};}};statements.push(s);return s;},async batch(s){batches.push(s);if(failBatch)throw new Error('controlled local batch failure');return s.map(()=>({success:true}));}};
}

test('original contract cases remain intact',()=>assert.equal(runContentStateContractTests().ok,true));
test('incomplete draft remains valid intake',()=>assert.equal(validateContentIntake(draft()).ok,true));
for(const state of ['APPROVED','PUBLISHED','CORRECTED','RETRACTED','ARCHIVED']) {
  test('intake cannot create '+state,()=>assert.equal(validateContentIntake({...draft(),state}).ok,false));
}
test('invalid evidence enum/date/types cannot pass validation',()=>{
  for(const change of [{evidence_state:'MADE_UP'},{created_at:'yesterday'},{created_at:'2026-02-30T10:00:00Z'},{provenance:'url'},{content:[]},{title:42}]) assert.equal(validateContentRecord({...draft(),...change}).ok,false);
});
test('null and array payloads fail without throwing',()=>{
  for(const f of [validateContentIntake,validateDistributionEvent,validateIntentHandoff]) for(const v of [null,[],7]) assert.equal(f(v).ok,false);
});
test('observation and attribution require referenced evidence',()=>{
  assert.equal(validateDistributionEvent({...event(),confidence:'OBSERVED'}).ok,false);
  assert.equal(validateDistributionEvent({...event(),confidence:'OBSERVED',evidence_reference:'TEST-RECEIPT'}).ok,true);
  assert.equal(validateDistributionEvent({...event(),attribution_strength:'DIRECT'}).ok,false);
  assert.equal(toHouseOutcomeEnvelope(event()).confidence,'REPORTED');
});
test('distribution cannot claim release with only a bearer credential',()=>assert.equal(validateDistributionEvent({...event(),event_type:'DISTRIBUTED'}).ok,false));
test('no cash fields enter the distribution contract',()=>assert.equal(validateDistributionEvent({...event(),cash_received:1}).ok,false));
test('handoff consent and authority cannot be bypassed through payload type or later state',()=>{
  for(const value of ['false',1,{}])assert.equal(validateIntentHandoff({...handoff(),personal_data_included:value}).ok,false);
  assert.equal(validateIntentHandoff({...handoff(),personal_data_included:true}).ok,false);
  for(const state of ['AUTHORIZED','ACCEPTED','COMPLETED'])assert.equal(validateIntentHandoff({...handoff(),state}).ok,false);
});
test('handoff terminal states preserve semantics in existing OTHER envelope',()=>{
  for(const state of ['CANCELLED','DECLINED','COMPLETED','CONSENT_REQUIRED']) {
    const x=toHouseHandoffEnvelope({...handoff(),state});
    assert.equal(x.event_type,'OTHER');assert.equal(x.metadata.handoff_state,state);assert.equal(x.confidence,'REPORTED');
  }
  assert.equal(toHouseHandoffEnvelope({...handoff(),state:'ACCEPTED'}).event_type,'HANDOFF_ACCEPTED');
});
test('content and audit insert are passed to one transaction batch',async()=>{
  const db=spyDB();const r=await contentPost(context(draft(),db));
  assert.equal(r.status,201);assert.equal(db.batches.length,1);assert.equal(db.batches[0].length,2);assert.equal(db.runs.length,0);
});
test('failed batch does not return success',async()=>assert.equal((await contentPost(context(draft(),spyDB(true)))).status,500));
test('unauthorized requests never reach storage',async()=>{
  for(const handler of [contentPost,distributionPost,handoffPost]){const db=spyDB();assert.equal((await handler(context(draft(),db,'wrong'))).status,401);assert.equal(db.statements.length,0);}
});
test('public intake refuses publication before writing',async()=>{
  const db=spyDB();assert.equal((await contentPost(context({...draft(),state:'PUBLISHED'},db))).status,400);assert.equal(db.statements.length,0);
});
test('distribution envelope survives persistence and metadata cannot override it',async()=>{
  const db=spyDB();const e={...event(),correlation_id:'TEST-CORRELATION',distribution_id:'TEST-DISTRIBUTION',evidence_reference:'TEST-RECEIPT',confidence:'REPORTED',metadata:{house_outcome:{confidence:'FAKE'}}};
  assert.equal((await distributionPost(context(e,db))).status,201);
  const stored=JSON.parse(db.runs[0].values[10]).house_outcome;
  assert.equal(stored.correlation_id,e.correlation_id);assert.equal(stored.evidence_reference,e.evidence_reference);assert.equal(stored.confidence,'REPORTED');
});
test('handoff persisted envelope preserves terminal state',async()=>{
  const db=spyDB();const h={...handoff(),state:'CANCELLED',correlation_id:'TEST-CORRELATION'};
  assert.equal((await handoffPost(context(h,db))).status,201);
  const stored=JSON.parse(db.runs[0].values[13]).house_handoff;
  assert.equal(stored.event_type,'OTHER');assert.equal(stored.metadata.handoff_state,'CANCELLED');assert.equal(stored.correlation_id,h.correlation_id);
});
test('content identity is stable across object key ordering and changes with material content',async()=>{
  const a={...draft(),content:{b:2,a:1}};const b={...draft(),content:{a:1,b:2}};
  assert.equal(await contentHash(a),await contentHash(b));
  assert.notEqual(await contentHash(a),await contentHash({...a,title:'Changed'}));
});
for (const decision of ['APPROVE','PUBLISH','DENY','REVOKE']) {
  test(decision+' cannot trust caller authority or persisted approval',async()=>{
    const db=spyDB();
    db.prepare=()=>{throw new Error('unverified authority must never reach storage');};
    const request={decision,content_id:'C1',content_version:'1',content_hash:'a'.repeat(64),actor:'HOUSE_ADMIN',authority_reference:'CLAIMED-AUTHORITY',decided_at:stamp,authority_verified:true,approved:true,evidence:['CLAIMED-PROOF']};
    const ctx=context(request,db);
    ctx.env.HOUSE_RELEASE_ENABLED='true';
    const response=await releasePost(ctx);
    assert.equal(response.status,503);
    assert.equal((await response.json()).error,'HOUSE_RELEASE_AUTHORITY_UNVERIFIED');
    assert.equal(db.batches.length,0);assert.equal(db.runs.length,0);
  });
}
test('release rejects missing and wrong transport credentials before storage',async()=>{
  const db=spyDB();
  assert.equal((await releasePost(context({},db,'wrong'))).status,401);
  const ctx=context({},db);delete ctx.env.POSTCARD_API_TOKEN;
  assert.equal((await releasePost(ctx)).status,503);
  assert.equal(db.statements.length,0);
});
test('release malformed payload remains a validation error',async()=>{
  assert.equal((await releasePost(context(null,spyDB()))).status,400);
});
