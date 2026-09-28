import { validateIntentHandoff } from "../lib/intent-handoff.js";
const json=(b,s=200)=>new Response(JSON.stringify(b,null,2),{status:s,headers:{"content-type":"application/json; charset=UTF-8","cache-control":"no-store"}});

export async function onRequestGet(context){
  try{
    const rows=await context.env.DB.prepare("SELECT * FROM postcard_intent_handoffs ORDER BY created_at DESC LIMIT 100").all();
    return json({ok:true,items:rows.results||[]});
  }catch(error){ return json({ok:false,message:error.message,migration_required:true},500); }
}

export async function onRequestPost(context){
  let h; try{h=await context.request.json();}catch{return json({ok:false,errors:["invalid JSON"]},400);}
  const check=validateIntentHandoff(h); if(!check.ok)return json(check,400);
  try{
    await context.env.DB.prepare(
      `INSERT INTO postcard_intent_handoffs
      (handoff_id,content_id,source_unit,target_unit,intent_summary,state,created_at,updated_at,personal_data_included,consent_reference,authority_reference,correlation_id,evidence_json,metadata_json)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(h.handoff_id,h.content_id||null,h.source_unit,h.target_unit,h.intent_summary,h.state,h.created_at,h.updated_at||null,h.personal_data_included?1:0,h.consent_reference||null,h.authority_reference||null,h.correlation_id||null,JSON.stringify(h.evidence||[]),JSON.stringify(h.metadata||{})).run();
    return json({ok:true,handoff_id:h.handoff_id,state:h.state},201);
  }catch(error){return json({ok:false,message:error.message},500);}
}
