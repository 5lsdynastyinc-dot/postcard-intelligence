import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const check=process.argv.includes('--check');
const config=JSON.parse(readFileSync(resolve(root,'editions/social-previews.json'),'utf8'));
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const errors=[];
for(const file of readdirSync(resolve(root,'editions')).filter(f=>f.endsWith('.html'))){
 const e=config[file];
 if(!e){errors.push(file+': missing social preview record');continue;}
 try {
  for(const key of ['title','description','url','image','imageAlt','imageType','section']) if(typeof e[key]!=='string'||!e[key].trim()) throw Error('missing '+key);
  const u=new URL(e.url),i=new URL(e.image);
  if(u.protocol!=='https:'||i.protocol!=='https:'||u.origin!==i.origin||u.hostname!=='postcard-intelligence.pages.dev') throw Error('use canonical HTTPS URLs on POSTCARD');
  if(!Number.isInteger(e.imageWidth)||e.imageWidth<300||!Number.isInteger(e.imageHeight)||e.imageHeight<157) throw Error('invalid image dimensions');
  if(!/\.(jpg|jpeg|png)$/.test(i.pathname)||!existsSync(resolve(root,'.'+i.pathname))) throw Error('public JPEG/PNG asset missing');
  let source=readFileSync(resolve(root,'editions',file),'utf8');
  if(!source.includes('<h1>'+esc(e.title)+'</h1>')) throw Error('preview headline differs from article');
  if(!source.includes('rel="canonical" href="'+esc(e.url)+'"')) throw Error('canonical URL mismatch');
  const tags={'og:site_name':'POSTCARD Intelligence','og:type':'article','og:title':e.title,'og:description':e.description,'og:url':e.url,'og:image':e.image,'og:image:secure_url':e.image,'og:image:type':e.imageType,'og:image:width':e.imageWidth,'og:image:height':e.imageHeight,'og:image:alt':e.imageAlt,'article:section':e.section,'twitter:card':'summary_large_image','twitter:title':e.title,'twitter:description':e.description,'twitter:image':e.image,'twitter:image:alt':e.imageAlt};
  const block='<!-- POSTCARD SOCIAL START -->\n'+Object.entries(tags).map(([k,v])=>'<meta '+(k.startsWith('twitter:')?'name':'property')+'="'+k+'" content="'+esc(v)+'">').join('\n')+'\n<!-- POSTCARD SOCIAL END -->';
  const pattern=/<!-- POSTCARD SOCIAL START -->[\s\S]*?<!-- POSTCARD SOCIAL END -->/g;
  const matches=source.match(pattern)||[];
  if(matches.length>1) throw Error('duplicate metadata blocks');
  const outside=source.replace(pattern,'');
  if(/<meta\s+(?:property|name)=["'](?:og:|twitter:)/i.test(outside)) throw Error('social tags outside managed block');
  const expected=source.replace(/<meta name="description" content="[^"]*">/,'<meta name="description" content="'+esc(e.description)+'">');
  const output=matches.length?expected.replace(pattern,block):expected.replace('</head>',block+'\n</head>');
  if(check){if(output!==source) throw Error('metadata stale: run node scripts/social-previews.mjs');}
  else writeFileSync(resolve(root,'editions',file),output);
 }catch(err){errors.push(file+': '+err.message);}
}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
else console.log('POSTCARD edition social previews '+(check?'validated':'generated'));
