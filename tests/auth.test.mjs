import test from 'node:test';
import assert from 'node:assert/strict';
import {authorizeHouseApi,houseApiConfigured} from '../functions/lib/house-auth.js';
const auth=(env,token)=>authorizeHouseApi({env,request:new Request('https://example.invalid',{headers:token?{authorization:'Bearer '+token}:{}})});
test('existing encrypted admin binding supports authenticated transport only',()=>{
  const env={'POSTCARD_ADMIN_KEY ':'legacy-test-only'};
  assert.equal(houseApiConfigured(env),true);
  assert.equal(auth(env,'legacy-test-only').ok,true);
  assert.equal(auth(env,'wrong').status,401);
  assert.equal(auth(env).status,401);
});
test('canonical token overrides legacy token, including deliberate disablement',()=>{
  const env={POSTCARD_API_TOKEN:'canonical-test-only','POSTCARD_ADMIN_KEY ':'legacy-test-only'};
  assert.equal(auth(env,'canonical-test-only').ok,true);
  assert.equal(auth(env,'legacy-test-only').status,401);
  for(const value of ['',null,42,'   ']) {
    const disabled={...env,POSTCARD_API_TOKEN:value};
    assert.equal(houseApiConfigured(disabled),false);
    assert.equal(auth(disabled,'legacy-test-only').status,503);
  }
});
test('unconfigured auth does not accept payload flags or unrelated environment keys',()=>{
  for(const env of [{},{POSTCARD_ADMIN_KEY:'wrong-name'},{HOUSE_RELEASE_ENABLED:'true'}]) {
    assert.equal(houseApiConfigured(env),false);
    assert.equal(auth(env,'anything').status,503);
  }
});
