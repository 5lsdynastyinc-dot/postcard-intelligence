import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { onRequestPost as contentPost, onRequestGet as contentGet } from '../functions/api/content.js';
import { onRequestPost as distributionPost, onRequestGet as distributionGet } from '../functions/api/distribution-events.js';
import { onRequestPost as handoffPost, onRequestGet as handoffGet } from '../functions/api/intent-handoffs.js';

function adapter(path) {
  const sql = new DatabaseSync(path);
  sql.exec('PRAGMA foreign_keys=ON');
  for (const file of ['0001_postcard_content.sql','0002_exact_version_release.sql']) sql.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
  return {sql, prepare(query) {return {
    values: [], bind(...values) {this.values=values;return this;},
    async run() {const meta=sql.prepare(query).run(...this.values);return {success:true,meta};},
    async all() {return {success:true,results:sql.prepare(query).all(...this.values)};},
    async first() {return sql.prepare(query).get(...this.values);}
  };}, async batch(statements) {
    sql.exec('BEGIN');
    try {const results=[];for(const s of statements)results.push(await s.run());sql.exec('COMMIT');return results;}
    catch(error) {sql.exec('ROLLBACK');throw error;}
  }};
}
const stamp='2026-10-17T00:00:00Z';
const draft={id:'LOCAL-TEST',title:'Synthetic persistence test',state:'DRAFT',created_at:stamp,provenance:[]};
const event={event_id:'LOCAL-EVENT',content_id:draft.id,event_type:'REQUEST',channel:'LOCAL_TEST',occurred_at:stamp};
const handoff={handoff_id:'LOCAL-HANDOFF',content_id:draft.id,source_unit:'POSTCARD',target_unit:'TEST',intent_summary:'Synthetic only',state:'PROPOSED',created_at:stamp};
function context(DB,payload,token='local-only') {
  return {env:{DB,POSTCARD_API_TOKEN:'local-only'},request:new Request('https://example.invalid/api',{method:payload?'POST':'GET',headers:{authorization:'Bearer '+token,'content-type':'application/json'},...(payload?{body:JSON.stringify(payload)}:{})})};
}

test('real SQLite persists draft, audit and reported envelopes across connection restart',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'postcard-test-'));const path=join(dir,'test.db');let DB=adapter(path);
  try {
    assert.equal((await contentPost(context(DB,draft))).status,201);
    assert.equal((await distributionPost(context(DB,event))).status,201);
    assert.equal((await handoffPost(context(DB,handoff))).status,201);
    DB.sql.close(); DB=adapter(path);
    const rows=(await (await contentGet(context(DB))).json()).items;
    assert.equal(rows.length,1);assert.equal(rows[0].state,'DRAFT');
    assert.equal(DB.sql.prepare('SELECT count(*) AS n FROM postcard_content_events').get().n,1);
    const events=(await (await distributionGet(context(DB))).json()).items;
    assert.equal(JSON.parse(events[0].metadata_json).house_outcome.confidence,'REPORTED');
    const handoffs=(await (await handoffGet(context(DB))).json()).items;
    assert.equal(handoffs[0].state,'PROPOSED');
  } finally {DB.sql.close();rmSync(dir,{recursive:true,force:true});}
});
test('audit storage failure rolls back the content insert',async()=>{
  const DB=adapter(':memory:');
  try {
    DB.sql.exec("CREATE TRIGGER fail_audit BEFORE INSERT ON postcard_content_events BEGIN SELECT RAISE(ABORT,'private failure detail'); END");
    const response=await contentPost(context(DB,draft));
    assert.equal(response.status,500);
    assert.deepEqual(await response.json(),{ok:false,error:'STORAGE_OPERATION_FAILED'});
    assert.equal(DB.sql.prepare('SELECT count(*) AS n FROM postcard_content').get().n,0);
    assert.equal(DB.sql.prepare('SELECT count(*) AS n FROM postcard_content_events').get().n,0);
  } finally {DB.sql.close();}
});
test('duplicate intake returns conflict without overwriting content or multiplying audit',async()=>{
  const DB=adapter(':memory:');
  try {
    assert.equal((await contentPost(context(DB,draft))).status,201);
    const response=await contentPost(context(DB,{...draft,title:'Retry cannot overwrite'}));
    assert.equal(response.status,409);
    assert.equal((await response.json()).error,'RECORD_ALREADY_EXISTS');
    assert.equal(DB.sql.prepare('SELECT title FROM postcard_content').get().title,draft.title);
    assert.equal(DB.sql.prepare('SELECT count(*) AS n FROM postcard_content_events').get().n,1);
  } finally {DB.sql.close();}
});
test('foreign-key failure cannot create an orphan outcome or handoff',async()=>{
  const DB=adapter(':memory:');
  try {
    for(const [handler,payload] of [[distributionPost,event],[handoffPost,handoff]]) {
      assert.equal((await handler(context(DB,payload))).status,500);
    }
    for(const table of ['postcard_distribution_events','postcard_intent_handoffs']) assert.equal(DB.sql.prepare('SELECT count(*) AS n FROM '+table).get().n,0);
  } finally {DB.sql.close();}
});
test('forged authority, evidence and consent never reach storage',async()=>{
  const DB={prepare(){throw new Error('must not reach storage');},batch(){throw new Error('must not reach storage');}};
  const claims={authority_reference:'CLAIMED',evidence_reference:'CLAIMED',consent_reference:'CLAIMED',authority_verified:true,approved:true};
  const attempts=[
    ...['OBSERVED','VERIFIED','CONTESTED','SUPERSEDED'].map(evidence_state=>[contentPost,{...draft,evidence_state,...claims}]),
    ...['DISTRIBUTED','DELIVERED','HANDOFF_ACCEPTED'].map(event_type=>[distributionPost,{...event,event_type,target_unit:'TEST',...claims}]),
    ...['AUTHORIZED','ACCEPTED','COMPLETED'].map(state=>[handoffPost,{...handoff,state,...claims}]),
    [handoffPost,{...handoff,personal_data_included:true,...claims}],
    ...[distributionPost,handoffPost].flatMap(handler=>['OBSERVED','DIRECT','ASSISTED'].map(mode=>[handler,{...(handler===distributionPost?event:handoff),...claims,...(mode==='OBSERVED'?{confidence:mode}:{attribution_strength:mode})}]))
  ];
  for(const [handler,payload] of attempts) {
    const response=await handler(context(DB,payload));assert.equal(response.status,503,JSON.stringify(payload));
    assert.equal((await response.json()).status,'EVIDENCE_REQUIRED');
  }
});
test('all sensitive reads and writes reject the wrong transport credential',async()=>{
  const DB={prepare(){throw new Error('unauthorized storage access');}};
  for(const handler of [contentGet,distributionGet,handoffGet]) assert.equal((await handler(context(DB,null,'wrong'))).status,401);
  for(const [handler,payload] of [[contentPost,draft],[distributionPost,event],[handoffPost,handoff]]) assert.equal((await handler(context(DB,payload,'wrong'))).status,401);
});
