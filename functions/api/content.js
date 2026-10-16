import { authorizeHouseApi } from "../lib/house-auth.js";
import { validateContentIntake } from "../lib/content-state.js";

const json = (body, status = 200) => new Response(JSON.stringify(body, null, 2), {
  status,
  headers: { "content-type": "application/json; charset=UTF-8", "cache-control": "no-store" }
});

export async function onRequestGet(context) {
  const auth=authorizeHouseApi(context);
  if(!auth.ok)return new Response(JSON.stringify({ok:false,error:auth.error}),{status:auth.status,headers:{"content-type":"application/json; charset=UTF-8","cache-control":"no-store"}});
  try {
    const rows = await context.env.DB.prepare(
      "SELECT id,title,state,source_unit,evidence_state,created_at,updated_at,published_at,corrected_at,correction_of,provenance_json FROM postcard_content ORDER BY created_at DESC LIMIT 50"
    ).all();
    return json({ ok: true, items: rows.results || [] });
  } catch (error) {
    return json({ ok: false, message: error.message, migration_required: true }, 500);
  }
}

export async function onRequestPost(context) {
  const auth=authorizeHouseApi(context);
  if(!auth.ok)return new Response(JSON.stringify({ok:false,error:auth.error}),{status:auth.status,headers:{"content-type":"application/json; charset=UTF-8","cache-control":"no-store"}});
  let record;
  try { record = await context.request.json(); }
  catch { return json({ ok: false, errors: ["invalid JSON"] }, 400); }

  const check = validateContentIntake(record);
  if (!check.ok) return json(check, 400);

  try {
    const insertContent = context.env.DB.prepare(
      `INSERT INTO postcard_content
      (id,title,state,source_unit,evidence_state,created_at,updated_at,published_at,corrected_at,correction_of,provenance_json,content_json)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      record.id, record.title, record.state, record.source_unit || "POSTCARD",
      record.evidence_state || "REPORTED", record.created_at, record.updated_at || null,
      record.published_at || null, record.corrected_at || null, record.correction_of || null,
      JSON.stringify(record.provenance || []), JSON.stringify(record.content || {})
    );

    const eventId = `${record.id}:created:${record.created_at}`;
    const insertEvent = context.env.DB.prepare(
      `INSERT INTO postcard_content_events
      (event_id,content_id,event_type,from_state,to_state,actor,occurred_at,evidence_json,note)
      VALUES (?,?,?,?,?,?,?,?,?)`
    ).bind(eventId, record.id, "CREATED", null, record.state, record.actor || "UNKNOWN",
      record.created_at, JSON.stringify(record.provenance || []), null);

    // D1 batch is transactional: record and audit event succeed or roll back together.
    await context.env.DB.batch([insertContent, insertEvent]);

    return json({ ok: true, id: record.id, state: record.state }, 201);
  } catch (error) {
    return json({ ok: false, message: error.message }, 500);
  }
}


