import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareSixelsReview,reviewInputFromSixelsReceipt} from '../scripts/prepare-sixels-review.mjs';
const receipt=()=>({contract:'SIXELS_PUBLICATION_REVIEW_RECEIPT_V1',source:{unit:'SIXELS',post_id:'00000000-0000-4000-8000-000000000001',revision:4,status:'published'},snapshot:{title:'Synthetic receipt',summary:'Synthetic summary',body:'Synthetic body, not a released article.',caption:'Synthetic caption',images:[{url:'https://sixels-agro-allied.olastrator.chatgpt.site/assets/editorial/produce-inspection.png',alt:'Synthetic image',credit:'Illustration only',role:'opening',after_heading:'Test'}],sources:[{url:'https://example.invalid/source',label:'Synthetic source'}]},snapshot_hash:'a'.repeat(64),hash_format:'POSTGRES_JSONB_TEXT_SHA256',human_verification_required:true,publication_hold:true,postcard_release_authorized:false,receipt_is_bearer_authority:false,source_review:{current:true},distribution_history:[{provider_confirmation_complete:true}]});
test('source approval and delivery never become destination approval or observed evidence',async()=>{
 const b=await prepareSixelsReview(reviewInputFromSixelsReceipt(receipt()));assert.equal(b.record.state,'DRAFT');assert.equal(b.record.evidence_state,'REPORTED');assert.equal(b.publication_hold,true);assert.equal(b.record.content.postcard_intro,'Synthetic summary');assert.equal(b.record.content.distribution_history,undefined);
});
test('forged authority and removed human hold are rejected',()=>{
 for(const [key,value] of [['postcard_release_authorized',true],['receipt_is_bearer_authority',true],['publication_hold',false],['human_verification_required',false]])assert.throws(()=>reviewInputFromSixelsReceipt({...receipt(),[key]:value}));
});
test('private snapshot/asset fields and wrong source room are rejected',()=>{
 let r=receipt();r.snapshot.buyer_contact='private';assert.throws(()=>reviewInputFromSixelsReceipt(r));r=receipt();r.snapshot.images[0].staff_contact='private';assert.throws(()=>reviewInputFromSixelsReceipt(r));r=receipt();r.source.unit='ANOTHER_ROOM';assert.throws(()=>reviewInputFromSixelsReceipt(r));
});
test('changed snapshot is rehashed, independent of a copied reported source hash',async()=>{
 const r=receipt();const a=await prepareSixelsReview(reviewInputFromSixelsReceipt(r));r.snapshot.body+=' changed';const b=await prepareSixelsReview(reviewInputFromSixelsReceipt(r));assert.notEqual(a.content_hash,b.content_hash);
});
test('withdrawn source is retained only as a held draft for review',async()=>{
 const r=receipt();r.source.status='draft';r.source_review.current=false;const b=await prepareSixelsReview(reviewInputFromSixelsReceipt(r));assert.equal(b.record.state,'DRAFT');assert.equal(b.publication_hold,true);
});
