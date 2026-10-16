import { authorizeHouseApi } from "../lib/house-auth.js";
import { validateReleaseRequest } from "../lib/content-state.js";

const json=(body,status=200)=>new Response(JSON.stringify(body,null,2),{status,headers:{"content-type":"application/json; charset=UTF-8","cache-control":"no-store"}});

// Transport authentication does not establish House publication authority.
// Keep this route closed until the existing House resolver and six release gates
// are connected and verified. No payload flag or environment toggle can open it.
export async function onRequestPost(context) {
  const auth=authorizeHouseApi(context);
  if(!auth.ok) return json({ok:false,error:auth.error},auth.status);
  let request;
  try { request=await context.request.json(); }
  catch { return json({ok:false,errors:["invalid JSON"]},400); }
  const check=validateReleaseRequest(request);
  if(!check.ok) return json(check,400);
  return json({ok:false,error:"HOUSE_RELEASE_AUTHORITY_UNVERIFIED",status:"EVIDENCE_REQUIRED"},503);
}
