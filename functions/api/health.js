const probes = [
  'SELECT id,title,state,source_unit,evidence_state,created_at,updated_at,published_at,corrected_at,correction_of,provenance_json,content_json FROM postcard_content LIMIT 0',
  'SELECT event_id,content_id,event_type,from_state,to_state,actor,occurred_at,evidence_json,note FROM postcard_content_events LIMIT 0',
  'SELECT event_id,content_id,event_type,channel,occurred_at,audience_reference,outcome_type,target_unit,transaction_id,evidence_json,metadata_json FROM postcard_distribution_events LIMIT 0',
  'SELECT handoff_id,content_id,source_unit,target_unit,intent_summary,state,created_at,updated_at,personal_data_included,consent_reference,authority_reference,correlation_id,evidence_json,metadata_json FROM postcard_intent_handoffs LIMIT 0',
  'SELECT authorization_id,content_id,content_version,content_hash,approved_by,authority_reference,scope,decision,decided_at,expires_at,revoked_at,evidence_json,note FROM postcard_release_authorizations LIMIT 0'
];

// Operational adapter health is not publication authority or maturity certification.
export async function onRequestGet(context) {
  const env = context?.env || {};
  const checks = {
    database: 'unavailable',
    adapter_schema: 'unverified',
    transport_auth: env.POSTCARD_API_TOKEN ? 'configured' : 'unconfigured',
    publication: 'blocked'
  };
  try {
    if (env.DB) {
      await env.DB.prepare('SELECT 1 AS connected').first();
      checks.database = 'connected';
      const results = await env.DB.batch(probes.map(sql => env.DB.prepare(sql)));
      if (results.length !== probes.length || results.some(r => !r.success)) throw new Error('Schema probe failed');
      checks.adapter_schema = 'ready';
    }
  } catch {
    // Keep provider errors and institutional data out of this public endpoint.
  }
  const ok = checks.database === 'connected' && checks.adapter_schema === 'ready' && checks.transport_auth === 'configured';
  return new Response(JSON.stringify({
    ok, service: 'POSTCARD Intelligence', scope: 'publication-adapter',
    checks, release_ready: false,
    release_blocker: 'HOUSE_RELEASE_AUTHORITY_UNVERIFIED'
  }), {
    status: ok ? 200 : 503,
    headers: {'content-type': 'application/json; charset=UTF-8', 'cache-control': 'no-store'}
  });
}
