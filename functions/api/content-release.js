import { authorizeHouseApi } from "../lib/house-auth.js";
import { validateReleaseRequest } from "../lib/content-state.js";
import { contentHash } from "../lib/content-identity.js";

const json=(body,status=200)=>new Response(JSON.stringify(body,null,2),{status,headers:{"content-type":"application/json; charset=UTF-8","cache-control":"no-store"}});

export async function onRequestPost(context) {
  const auth=authorizeHouseApi(context);
  if(!auth.ok) return json({ok:false,error:auth.error},auth.status);
  let request;
  try { request=await context.request.json(); }
  catch { return json({ok:false,errors:["invalid JSON"]},400); }
  const check=validateReleaseRequest(request);
  if(!check.ok) return json(check,400);

  try {
    const current=await context.env.DB.prepare(
      "SELECT id,title,state,source_unit,evidence_state,created_at,updated_at,provenance_json,content_json FROM postcard_content WHERE id=?"
    ).bind(request.content_id).first();
    if(!current) return json({ok:false,error:"CONTENT_NOT_FOUND"},404);
    // Content intake is immutable; lifecycle timestamps do not create a new
    // editorial version. A revised edition is a new content record.
    const currentVersion=current.created_at;
    const currentHash=await contentHash({...current,provenance:JSON.parse(current.provenance_json||'[]'),content:JSON.parse(current.content_json||'{}')});
    if(currentVersion!==request.content_version || currentHash!==request.content_hash) {
      return json({ok:false,error:"CONTENT_VERSION_MISMATCH",current_version:currentVersion,current_hash:currentHash},409);
    }

    const eventId=`${request.content_id}:${request.decision.toLowerCase()}:${request.decided_at}`;
    if(request.decision==="PUBLISH") {
      const approval=await context.env.DB.prepare(
        `SELECT authorization_id FROM postcard_release_authorizations
         WHERE content_id=? AND content_version=? AND content_hash=? AND decision='APPROVED'
           AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at>?)
         ORDER BY decided_at DESC LIMIT 1`
      ).bind(request.content_id,request.content_version,request.content_hash,request.decided_at).first();
      if(!approval) return json({ok:false,error:"EXACT_VERSION_APPROVAL_REQUIRED"},409);
      if(current.state!=="APPROVED") return json({ok:false,error:"CONTENT_NOT_APPROVED",state:current.state},409);
      await context.env.DB.batch([
        context.env.DB.prepare("UPDATE postcard_content SET state='PUBLISHED',published_at=?,updated_at=? WHERE id=? AND state='APPROVED' AND created_at=?")
          .bind(request.decided_at,request.decided_at,request.content_id,request.content_version),
        context.env.DB.prepare(`INSERT INTO postcard_content_events
          (event_id,content_id,event_type,from_state,to_state,actor,occurred_at,evidence_json,note)
          VALUES (?,?,?,?,?,?,?,?,?)`).bind(eventId,request.content_id,"PUBLISHED","APPROVED","PUBLISHED",request.actor,request.decided_at,JSON.stringify(request.evidence||[]),request.note||null)
      ]);
      return json({ok:true,id:request.content_id,state:"PUBLISHED",content_version:request.content_version,content_hash:request.content_hash});
    }

    const decision={APPROVE:"APPROVED",DENY:"DENIED",REVOKE:"REVOKED"}[request.decision];
    const authorizationId=request.authorization_id || `${request.content_id}:${decision.toLowerCase()}:${request.decided_at}`;
    const statements=[context.env.DB.prepare(`INSERT INTO postcard_release_authorizations
      (authorization_id,content_id,content_version,content_hash,approved_by,authority_reference,scope,decision,decided_at,expires_at,revoked_at,evidence_json,note)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
        authorizationId,request.content_id,request.content_version,request.content_hash,request.actor,request.authority_reference,
        request.scope||"PUBLICATION",decision,request.decided_at,request.expires_at||null,decision==="REVOKED"?request.decided_at:null,
        JSON.stringify(request.evidence||[]),request.note||null)
    ];
    if(request.decision==="APPROVE") {
      if(!["DRAFT","REVIEW_REQUIRED"].includes(current.state)) return json({ok:false,error:"INVALID_APPROVAL_TRANSITION",state:current.state},409);
      statements.push(context.env.DB.prepare("UPDATE postcard_content SET state='APPROVED',updated_at=? WHERE id=? AND state IN ('DRAFT','REVIEW_REQUIRED') AND created_at=?")
        .bind(request.decided_at,request.content_id,request.content_version));
    } else if(request.decision==="REVOKE" && current.state==="APPROVED") {
      statements.push(context.env.DB.prepare("UPDATE postcard_content SET state='REVIEW_REQUIRED',updated_at=? WHERE id=? AND state='APPROVED' AND created_at=?")
        .bind(request.decided_at,request.content_id,request.content_version));
    }
    statements.push(context.env.DB.prepare(`INSERT INTO postcard_content_events
      (event_id,content_id,event_type,from_state,to_state,actor,occurred_at,evidence_json,note)
      VALUES (?,?,?,?,?,?,?,?,?)`).bind(eventId,request.content_id,decision,current.state,request.decision==="APPROVE"?"APPROVED":current.state,request.actor,request.decided_at,JSON.stringify(request.evidence||[]),request.note||null));
    await context.env.DB.batch(statements);
    return json({ok:true,id:request.content_id,decision,content_version:request.content_version,content_hash:request.content_hash});
  } catch(error) { return json({ok:false,message:error.message,migration_required:true},500); }
}

