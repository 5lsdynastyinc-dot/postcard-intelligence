const drafts = [
  {
    id: "LEYE-PC-001",
    theme: "Business Reality",
    title: "Automated Does Not Mean Automatic Income",
    hook: "A system can support your business, but a system is not the same thing as income.",
    body: "Automation can help with follow-up, information, training and the customer journey. But revenue still comes from real business activity and an exchange of value. The goal is not to sit back and hope money appears. The goal is to use a system that helps you work smarter, stay consistent and serve people better.",
    why: "Clear expectations build trust. People should understand the difference between an automated business system and automatic income before they make a decision.",
    cta: "Learn how the system works before deciding whether it fits you.",
    provenance: "LEYE Digital recurring lead question: If I don't have customers, will I still make money?"
  },
  {
    id: "LEYE-PC-002",
    theme: "Entrepreneurship",
    title: "The Rose Has Thorns",
    hook: "Owning a business can be rewarding, but pretending it is always easy helps nobody.",
    body: "There are learning curves, disappointments, uncomfortable conversations, technology to learn, days when results are slow and moments when you question yourself. Those are real parts of building something. The reason many people still choose business ownership is not because the thorns disappear, but because they are building skills, options and an asset that can grow with them.",
    why: "Honest business education is more useful than presenting entrepreneurship as a perfect success story.",
    cta: "Look at the opportunity with both eyes open: the possibilities and the work required.",
    provenance: "LEYE Digital video idea: The Rose Has Thorns — challenges and downsides of the business."
  },
  {
    id: "LEYE-PC-003",
    theme: "Income Resilience",
    title: "Your Salary Is Good — But Is One Income Enough?",
    hook: "A good salary can solve today's bills. The bigger question is how much resilience one income gives you.",
    body: "One income can feel secure until life changes: hours are reduced, expenses rise, family responsibilities increase or retirement gets closer. A side business is not a guarantee of wealth, but it can be a deliberate way to build an additional income stream, learn new skills and create more options over time.",
    why: "The question is not whether employment is bad. It is whether your financial life depends too heavily on one source.",
    cta: "Explore a second-income path with facts, training and realistic expectations.",
    provenance: "LEYE Digital recurring content theme: Your salary is good, but is one income enough?"
  },
  {
    id: "LEYE-PC-004",
    theme: "Expectation Setting",
    title: "This Is Not a Get-Rich-Quick Scheme",
    hook: "If the promise is instant money with no learning, no effort and no consistency, that is not the business lesson we teach.",
    body: "Building a business takes time. You learn the system, understand the offer, develop communication skills, follow up, improve and stay consistent. Some people progress faster than others, but there is no honest way to promise a specific result or timeline. The opportunity should be judged by what it actually requires and what it can realistically help you build.",
    why: "Removing unrealistic expectations protects both the prospective business owner and the credibility of the business.",
    cta: "Get the information first. Understand the work, the system and the expectations before you decide.",
    provenance: "LEYE Digital positioning principle: the business is not a get-rich-quick scheme."
  }
];

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);

  if (url.searchParams.get("format") === "json") {
    return new Response(JSON.stringify({
      ok: true,
      service: "POSTCARD Intelligence",
      room: "LEYE Digital",
      mode: "automatic-draft-batch-v1",
      human_approval_required: true,
      publish_authority: "withheld",
      count: drafts.length,
      generated_at: new Date().toISOString(),
      drafts
    }, null, 2), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=UTF-8",
        "cache-control": "no-store"
      }
    });
  }

  let dbStatus = "not checked";
  try {
    await context.env.DB.prepare("SELECT 1 AS ok").first();
    dbStatus = "connected";
  } catch (_) {
    dbStatus = "unavailable";
  }

  const cards = drafts.map((d, i) => `
    <article class="card">
      <div class="meta">
        <span>${escapeHtml(d.id)}</span>
        <span>${escapeHtml(d.theme)}</span>
        <span>DRAFT ${i + 1}/4</span>
      </div>
      <h2>${escapeHtml(d.title)}</h2>
      <p class="hook">${escapeHtml(d.hook)}</p>
      <p>${escapeHtml(d.body)}</p>
      <div class="why"><strong>Why this matters</strong><br>${escapeHtml(d.why)}</div>
      <p class="cta"><strong>CTA:</strong> ${escapeHtml(d.cta)}</p>
      <details>
        <summary>Source / provenance</summary>
        <p>${escapeHtml(d.provenance)}</p>
      </details>
      <button data-copy="${escapeHtml(`${d.title}\n\n${d.hook}\n\n${d.body}\n\n${d.cta}`)}">Copy draft</button>
    </article>
  `).join("");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>LEYE Digital — POSTCARD Draft Batch</title>
<style>
  :root{color-scheme:light;--ink:#152033;--paper:#f5f0e6;--line:#d8d0c1;--accent:#a16c2b;--soft:#fffaf1}
  *{box-sizing:border-box}
  body{margin:0;background:var(--paper);color:var(--ink);font-family:Georgia,"Times New Roman",serif}
  .wrap{max-width:920px;margin:auto;padding:28px 18px 60px}
  header{border-bottom:1px solid var(--line);padding-bottom:22px;margin-bottom:24px}
  .eyebrow{font:700 12px/1.2 Arial,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:var(--accent)}
  h1{font-size:clamp(36px,8vw,72px);line-height:.92;margin:10px 0 12px}
  .sub{font:15px/1.5 Arial,sans-serif;max-width:680px}
  .status{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;font:12px Arial,sans-serif}
  .pill{border:1px solid var(--line);border-radius:999px;padding:7px 10px;background:var(--soft)}
  .grid{display:grid;grid-template-columns:1fr;gap:18px}
  .card{background:var(--soft);border:1px solid var(--line);border-radius:18px;padding:22px;box-shadow:0 4px 18px rgba(0,0,0,.035)}
  .meta{display:flex;gap:10px;flex-wrap:wrap;font:700 11px Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}
  h2{font-size:clamp(28px,6vw,46px);line-height:1;margin:14px 0}
  p{font-size:18px;line-height:1.55}
  .hook{font-size:21px;line-height:1.38;font-weight:700}
  .why{border-left:3px solid var(--accent);padding:10px 14px;margin:18px 0;font:16px/1.5 Arial,sans-serif;background:#fbf4e7}
  .cta{font-family:Arial,sans-serif;font-size:15px}
  details{font:14px/1.45 Arial,sans-serif;margin-top:14px}
  button{margin-top:18px;border:0;border-radius:999px;background:var(--ink);color:white;padding:12px 18px;font:700 14px Arial,sans-serif}
  footer{margin-top:28px;font:12px/1.5 Arial,sans-serif;color:#5d6470}
  @media(min-width:760px){.grid{grid-template-columns:1fr 1fr}}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="eyebrow">POSTCARD Intelligence · LEYE Digital</div>
    <h1>Automatic Draft Batch</h1>
    <div class="sub">Four House-prepared postcards. Human approval is required before anything is published.</div>
    <div class="status">
      <span class="pill">D1: ${escapeHtml(dbStatus)}</span>
      <span class="pill">4 drafts</span>
      <span class="pill">Publish authority: withheld</span>
    </div>
  </header>
  <main class="grid">${cards}</main>
  <footer>Generated by POSTCARD’s LEYE Digital draft lane. This first version is deliberately controlled: generation is automatic; publication is not.</footer>
</div>
<script>
document.querySelectorAll("button[data-copy]").forEach(btn => {
  btn.addEventListener("click", async () => {
    await navigator.clipboard.writeText(btn.dataset.copy);
    const old = btn.textContent;
    btn.textContent = "Copied";
    setTimeout(() => btn.textContent = old, 1200);
  });
});
</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=UTF-8",
      "cache-control": "no-store"
    }
  });
}
