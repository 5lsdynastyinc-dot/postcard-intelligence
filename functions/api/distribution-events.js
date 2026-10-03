import { authorizeHouseApi } from "../lib/house-auth.js";
import { validateDistributionEvent } from "../lib/distribution-events.js";

const json=(body,status=200)=>new Response(JSON.stringify(body,null,2),{status,headers:{"content-type":"application/json; charset=UTF-8","cache-control":"no-store"}});

export async function onRequestGet(context){
  const auth=authorizeHouseApi(context);
  if(!auth.ok)return new Response(JSON.stringify({ok:false,error:auth.error}),{status:auth.status,headers:{"content-type":"application/json; charset=UTF-8","cache-control":"no-store"}});
  try{
    const contentId=new URL(context.request.url).searchParams.get("content_id");
    const stmt=contentId
      ? context.env.DB.prepare("SELECT * FROM postcard_distribution_events WHERE content_id=? ORDER BY occurred_at DESC LIMIT 100").bind(contentId)
      : context.env.DB.prepare("SELECT * FROM postcard_distribution_events ORDER BY occurred_at DESC LIMIT 100");
    const rows=await stmt.all();
    return json({ok:true,items:rows.results||[]});
  }catch(error){ return json({ok:false,message:error.message,migration_required:true},500); }
}

export async function onRequestPost(context){
  const auth=authorizeHouseApi(context);
  if(!auth.ok)return new Response(JSON.stringify({ok:false,error:auth.error}),{status:auth.status,headers:{"content-type":"application/json; charset=UTF-8","cache-control":"no-store"}});
  let event;
  try{ event=await context.request.json(); }catch{ return json({ok:false,errors:["invalid JSON"]},400); }
  const check=validateDistributionEvent(event);
  if(!check.ok) return json(check,400);
  try{
    await context.env.DB.prepare(
      `INSERT INTO postcard_distribution_events
      (event_id,content_id,event_type,channel,occurred_at,audience_reference,outcome_type,target_unit,transaction_id,evidence_json,metadata_json)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      event.event_id,event.content_id,event.event_type,event.channel,event.occurred_at,
      event.audience_reference||null,event.outcome_type||null,event.target_unit||null,
      event.transaction_id||null,JSON.stringify(event.evidence||[]),JSON.stringify(event.metadata||{})
    ).run();
    return json({ok:true,event_id:event.event_id},201);
  }catch(error){ return json({ok:false,message:error.message},500); }
}
