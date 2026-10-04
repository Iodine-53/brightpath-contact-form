// POST /api/submit — public lead intake for the Day 1 demo.
// Validates, writes the lead to Airtable ("Lead Table", Status=New),
// and returns the auto-reply preview. n8n polls Airtable every 20s,
// composes the identical reply, and sends it for real.
//
// Env vars (set in the Vercel dashboard):
//   AIRTABLE_PAT      Personal access token (data.records:read+write)
//   AIRTABLE_BASE_ID  e.g. appRQTx61MV1MRRZx
const TABLE = "Lead Table";

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  const body = req.body || {};
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const service = String(body.service || "General").trim() || "General";
  const message = String(body.message || "").trim();
  const honeypot = String(body.company || "").trim();

  const valid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    !honeypot &&
    name.length > 0 &&
    message.length > 0;
  if (!valid) {
    return res.status(400).json({ ok: false, error: "Invalid submission" });
  }

  const pat = process.env.AIRTABLE_PAT;
  const base = process.env.AIRTABLE_BASE_ID;
  if (!pat || !base) {
    return res.status(500).json({ ok: false, error: "Server not configured" });
  }

  const first = name.split(" ")[0] || "there";
  const reply = {
    to: email,
    subject: "Thanks " + first + " \u2014 we got your message",
    body:
      "Hi " + first + ",\n\n" +
      "Thanks for reaching out about " + service.toLowerCase() + " services. " +
      "We've received your message and will get back to you within one business day.\n\n" +
      "\u2014 The Brightpath team",
  };

  let atRes;
  try {
    atRes = await fetch(
      "https://api.airtable.com/v0/" + base + "/" + encodeURIComponent(TABLE),
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + pat,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            Name: name,
            Email: email,
            Service: service,
            Message: message,
            Status: "New",
          },
          typecast: true,
        }),
      }
    );
  } catch (e) {
    return res.status(502).json({ ok: false, error: "Could not save lead" });
  }
  if (!atRes.ok) {
    return res.status(502).json({ ok: false, error: "Could not save lead" });
  }
  const rec = await atRes.json();
  return res
    .status(200)
    .json({ ok: true, id: rec.id, reply: Object.assign({ mode: "QUEUED" }, reply) });
};
