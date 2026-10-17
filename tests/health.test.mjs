import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { onRequestGet } from '../functions/api/health.js';

function database(migrated = true) {
  const sql = new DatabaseSync(':memory:');
  if (migrated) for (const file of ['0001_postcard_content.sql','0002_exact_version_release.sql']) {
    sql.exec(readFileSync(new URL('../migrations/' + file, import.meta.url), 'utf8'));
  }
  return {sql, prepare(query) {return {query, async first() {return sql.prepare(query).get();}};}, async batch(statements) {
    return statements.map(s => ({success: true, results: sql.prepare(s.query).all()}));
  }};
}

test('migrated adapter health does not claim release readiness or expose House data', async () => {
  const DB = database();
  try {
    const response = await onRequestGet({env:{DB,POSTCARD_API_TOKEN:'test-only'}});
    assert.equal(response.status,200);
    const body = await response.json();
    assert.equal(body.checks.adapter_schema,'ready');
    assert.equal(body.release_ready,false);
    assert.equal(body.checks.publication,'blocked');
    assert.equal(body.house,undefined);
    assert.equal(response.headers.get('cache-control'),'no-store');
  } finally {DB.sql.close();}
});
test('legacy overview alone cannot produce a healthy adapter', async () => {
  const DB = database(false);
  DB.sql.exec('CREATE VIEW v_house_overview AS SELECT 1 AS total_signals');
  try {
    const response = await onRequestGet({env:{DB,POSTCARD_API_TOKEN:'test-only'}});
    assert.equal(response.status,503);
    assert.equal((await response.json()).checks.adapter_schema,'unverified');
  } finally {DB.sql.close();}
});
test('schema drift fails health even when all tables exist', async () => {
  const DB = database();
  DB.sql.exec('ALTER TABLE postcard_content RENAME COLUMN title TO old_title');
  try {assert.equal((await onRequestGet({env:{DB,POSTCARD_API_TOKEN:'test-only'}})).status,503);}
  finally {DB.sql.close();}
});
test('missing transport credential fails operational readiness', async () => {
  const DB = database();
  try {
    const response = await onRequestGet({env:{DB}});
    assert.equal(response.status,503);
    assert.equal((await response.json()).checks.transport_auth,'unconfigured');
  } finally {DB.sql.close();}
});
test('missing binding and provider failure return sanitized unavailable responses', async () => {
  for (const env of [{}, {DB:{prepare(){throw new Error('private provider details');}}}]) {
    const response = await onRequestGet({env});
    assert.equal(response.status,503);
    assert.equal((await response.text()).includes('private provider details'),false);
  }
});
