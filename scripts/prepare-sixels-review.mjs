import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {contentHash} from '../functions/lib/content-identity.js';
import {validateContentIntake} from '../functions/lib/content-state.js';
import {intakeBlocker} from '../functions/lib/intake-boundary.js';

// Offline preparation only. No transport, credential, approval or release client.
const plain = x => x !== null && typeof x === 'object' && !Array.isArray(x);
function keys(x, allowed, label) {
  if (!plain(x) || Object.keys(x).some(k => !allowed.includes(k))) throw Error('Unsupported '+label+' fields');
}
function text(x, label, max=100000) {
  if (typeof x !== 'string' || !x.trim() || x.length>max) throw Error('Invalid '+label);
  return x.trim();
}
function https(x, label) {
  const u=new URL(text(x,label,4096));
  if(u.protocol!=='https:'||u.username||u.password) throw Error('Invalid '+label);
  return u.href;
}
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export async function prepareSixelsReview(input, now=new Date().toISOString()) {
  keys(input,['source_id','source_version','title','summary','body','caption','postcard_intro','images','sources'],'input');
  const source_id=text(input.source_id,'source_id',200);
  const source_version=text(input.source_version,'source_version',200);
  if(!Array.isArray(input.images)||input.images.length>8||!Array.isArray(input.sources)||!input.sources.length||input.sources.length>30) throw Error('Invalid images or sources');
  const images=input.images.map(v=>{
    keys(v,['url','alt','credit'],'image'); const url=https(v.url,'image URL');
    const u=new URL(url);
    if(u.origin!=='https://sixels-agro-allied.olastrator.chatgpt.site'||!u.pathname.startsWith('/assets/editorial/')||u.search||u.hash) throw Error('Use existing SIXELS editorial assets');
    return {url,alt:text(v.alt,'image description',1000),credit:text(v.credit,'image credit',2000)};
  });
  const sources=input.sources.map(v=>{
    keys(v,['title','url','scope'],'source');
    return {title:text(v.title,'source title',1000),url:https(v.url,'source URL'),scope:text(v.scope,'source scope',4000)};
  });
  const record={title:text(input.title,'title',500),source_unit:'SIXELS',state:'DRAFT',evidence_state:'REPORTED',provenance:sources,
    content:{summary:text(input.summary,'summary',4000),body:text(input.body,'body'),caption:text(input.caption,'caption',4000),postcard_intro:text(input.postcard_intro,'POSTCARD introduction',8000),images,
      source:{unit:'SIXELS',object_id:source_id,version:source_version},human_verification_required:true,publication_hold:true}};
  // Reuse POSTCARD's exact-content identity; timestamps are outside this identity.
  const hash=await contentHash(record);
  record.id='SIXELS-REVIEW-'+hash;
  record.created_at=now;
  record.actor='AI_REVIEW_PREPARATION';
  const check=validateContentIntake(record);
  if(!check.ok||intakeBlocker('content',record)) throw Error('POSTCARD draft contract rejected package');
  return {mode:'OFFLINE_REVIEW_ONLY',prepared_at:now,content_hash:hash,human_verification_required:true,publication_hold:true,
    gates:Object.fromEntries(['content','evidence','editorial','brand','render','release'].map(k=>[k,'PENDING_HUMAN_VERIFICATION'])),record};
}

export function renderReview(bundle) {
  const r=bundle.record,c=r.content;
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>PRIVATE REVIEW — '+esc(r.title)+'</title><style>body{max-width:780px;margin:32px auto;padding:0 20px;background:#faf8f0;color:#17232d;font:18px/1.65 Georgia,serif}h1{line-height:1.15}.hold{padding:16px;border:2px solid #975f16;font:16px/1.5 system-ui}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}img{max-width:100%;height:auto}small{overflow-wrap:anywhere}a{overflow-wrap:anywhere}</style><body><p class="hold"><b>PRIVATE REVIEW — PUBLICATION HELD</b><br>Human verification required. No approval or delivery is claimed. This local file is not a published article.</p><h1>'+esc(r.title)+'</h1><p>'+esc(c.summary)+'</p>'+c.images.map(v=>'<figure><img src="'+esc(v.url)+'" alt="'+esc(v.alt)+'"><figcaption>'+esc(v.credit)+'</figcaption></figure>').join('')+'<pre>'+esc(c.body)+'</pre><h2>Source review</h2><ol>'+r.provenance.map(v=>'<li><a href="'+esc(v.url)+'" rel="noreferrer">'+esc(v.title)+'</a><p>'+esc(v.scope)+'</p></li>').join('')+'</ol><h2>WhatsApp draft</h2><p>'+esc(c.caption)+'</p><h2>POSTCARD draft introduction</h2><p>'+esc(c.postcard_intro)+'</p><h2>Review identity</h2><small>'+esc(bundle.content_hash)+'</small><p>All six gates remain pending. A changed text, source, image, caption, introduction or source version requires a new review package.</p></body></html>';
}

async function main() {
  if(process.argv.length!==4) throw Error('Usage: node scripts/prepare-sixels-review.mjs INPUT.json NEW_OUTPUT_DIRECTORY');
  const bundle=await prepareSixelsReview(JSON.parse(await readFile(process.argv[2],'utf8')));
  // Refuse to overwrite an earlier review package.
  const out=resolve(process.argv[3]); await mkdir(out,{recursive:false});
  await writeFile(resolve(out,'review-bundle.json'),JSON.stringify(bundle,null,2)+'\n',{flag:'wx'});
  await writeFile(resolve(out,'review.html'),renderReview(bundle),{flag:'wx'});
  console.log('Prepared local review bundle. Human verification and publication remain held.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) main().catch(e=>{console.error(e.message);process.exitCode=1;});
