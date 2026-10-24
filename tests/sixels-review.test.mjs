import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareSixelsReview,renderReview} from '../scripts/prepare-sixels-review.mjs';
const fixture=()=>({source_id:'TEST-ONLY-P01',source_version:'local-fixture-v1',title:'Test-only <headline>',summary:'Synthetic review fixture',body:'No actual article or market observation.',caption:'Test-only caption',postcard_intro:'Test-only introduction',images:[{url:'https://sixels-agro-allied.olastrator.chatgpt.site/assets/editorial/produce-inspection.png',alt:'Illustration',credit:'Synthetic test reference; illustrative.'}],sources:[{title:'Test source',url:'https://example.invalid/reference',scope:'Test only; unverified.'}]});
test('offline package remains a draft with all six gates held',async()=>{
 const b=await prepareSixelsReview(fixture(),'2026-10-24T00:00:00Z');
 assert.equal(b.record.state,'DRAFT');assert.equal(b.record.evidence_state,'REPORTED');assert.equal(b.publication_hold,true);assert.equal(b.human_verification_required,true);
 assert.equal(Object.values(b.gates).every(x=>x==='PENDING_HUMAN_VERIFICATION'),true);assert.equal(Object.keys(b.gates).length,6);
 assert.equal(b.record.published_at,undefined);assert.equal(b.record.authority_reference,undefined);
});
test('identity survives a retry timestamp but changes with every reviewable part',async()=>{
 const f=fixture(),a=await prepareSixelsReview(f,'2026-10-24T00:00:00Z'),retry=await prepareSixelsReview(f,'2026-10-24T01:00:00Z');assert.equal(a.record.id,retry.record.id);
 for(const key of ['title','summary','body','caption','postcard_intro','source_version']){const v=fixture();v[key]+=' changed';assert.notEqual((await prepareSixelsReview(v)).content_hash,a.content_hash);}
 for(const key of ['sources','images']){const v=fixture();v[key][0][key==='sources'?'scope':'credit']+=' changed';assert.notEqual((await prepareSixelsReview(v)).content_hash,a.content_hash);}
});
test('private operating fields and caller approval claims are rejected',async()=>{
 for(const key of ['buyer','commercial_terms','staff_email','approved','state','published_at','authority_reference']) await assert.rejects(()=>prepareSixelsReview({...fixture(),[key]:'not permitted'}));
 for(const key of ['images','sources']){const v=fixture();v[key][0].private_contact='not permitted';await assert.rejects(()=>prepareSixelsReview(v));}
});
test('credential URLs, unsafe links and off-origin image trackers are refused',async()=>{
 for(const url of ['javascript:alert(1)','https://user:secret@example.invalid/a']){const v=fixture();v.sources[0].url=url;await assert.rejects(()=>prepareSixelsReview(v));}
 const v=fixture();v.images[0].url='https://example.invalid/tracker.png';await assert.rejects(()=>prepareSixelsReview(v));
});
test('review HTML escapes supplied markup and labels pending verification',async()=>{
 const v=fixture();v.body='<script>alert(1)</script>';const html=renderReview(await prepareSixelsReview(v));assert.equal(html.includes('<script>'),false);assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('PUBLICATION HELD'));assert.ok(html.includes('noindex,nofollow'));
});
