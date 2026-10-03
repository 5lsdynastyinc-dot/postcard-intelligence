// POSTCARD server-side House API authorization gate.
// The token must be configured as a Cloudflare Pages secret: POSTCARD_API_TOKEN.
// No token is ever stored in the repository.
export function authorizeHouseApi(context) {
  const expected = context?.env?.POSTCARD_API_TOKEN;
  if (!expected) return { ok:false, status:503, error:"HOUSE_API_NOT_CONFIGURED" };
  const header = context?.request?.headers?.get("authorization") || "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!supplied || supplied !== expected) return { ok:false, status:401, error:"UNAUTHORIZED" };
  return { ok:true };
}
