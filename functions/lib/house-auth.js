// POSTCARD server-side House API authorization gate.
// Canonical secret: POSTCARD_API_TOKEN. Preserve the existing encrypted admin
// binding during migration, including its historical trailing-space name.
// No token is ever stored in the repository.
function transportCredential(env) {
  if (env?.POSTCARD_API_TOKEN !== undefined) return env.POSTCARD_API_TOKEN;
  return env?.['POSTCARD_ADMIN_KEY '];
}

export function houseApiConfigured(env) {
  const value = transportCredential(env);
  return typeof value === 'string' && value.trim().length > 0;
}

export function authorizeHouseApi(context) {
  const expected = transportCredential(context?.env);
  if (!houseApiConfigured(context?.env)) return { ok:false, status:503, error:"HOUSE_API_NOT_CONFIGURED" };
  const header = context?.request?.headers?.get("authorization") || "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!supplied || supplied !== expected) return { ok:false, status:401, error:"UNAUTHORIZED" };
  return { ok:true };
}

