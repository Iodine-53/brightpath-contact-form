# Brightpath Contact Form (Day 1)

Day 1 of the build-in-public series: a contact form that actually does something.

- `index.html` — the form (Brightpath Home Services demo)
- `api/submit.js` — Vercel serverless function: validates the submission, writes the lead to Airtable, and returns the auto-reply preview. n8n picks up new leads and sends the real auto-reply email.

Env vars (set in Vercel): `AIRTABLE_PAT`, `AIRTABLE_BASE_ID`.
