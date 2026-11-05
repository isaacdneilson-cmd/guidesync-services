// Cloudflare Pages Function: POST /api/lead
// 1) Blocks bots (honeypot, timing, Cloudflare Turnstile verified server-side)
// 2) Validates and sanitizes input
// 3) Appends the lead to Google Sheets via a private Apps Script webhook
//
// Required environment variables (Cloudflare Pages > Settings > Variables and Secrets):
//   TURNSTILE_SECRET_KEY   - Turnstile secret key (encrypt)
//   SHEETS_WEBHOOK_URL     - Google Apps Script web app URL (encrypt)
//   SHEETS_SHARED_SECRET   - Random string, must match SHARED_SECRET in Code.gs (encrypt)
// Optional:
//   ALLOWED_HOSTS          - Comma-separated hostnames allowed to post (e.g. "guidesync.net,www.guidesync.net")

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LIMITS = { first_name: 60, last_name: 60, email: 120, phone: 25, industry: 80, monthly_volume: 40, services: 1500, page: 200, utm: 1200 };

// Prevent spreadsheet formula injection and strip control characters.
function clean(v, max) {
  let s = String(v || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return s;
}

export async function onRequestPost({ request, env }) {
  try {
    // Same-origin check
    const origin = request.headers.get('Origin') || '';
    const host = new URL(request.url).hostname;
    const allowed = (env.ALLOWED_HOSTS || host).split(',').map((h) => h.trim().toLowerCase());
    let originHost = '';
    try { originHost = new URL(origin).hostname.toLowerCase(); } catch (_) {}
    const isPreview = originHost.endsWith('.pages.dev') || originHost.endsWith('.workers.dev');
    if (!originHost || (!allowed.includes(originHost) && !isPreview && originHost !== host)) {
      return json({ ok: false, error: 'Request blocked.' }, 403);
    }

    const len = Number(request.headers.get('Content-Length') || 0);
    if (len > 20000) return json({ ok: false, error: 'Submission too large.' }, 413);

    const form = await request.formData();

    // Honeypot and timing traps: pretend success so bots learn nothing.
    if ((form.get('company_website') || '').toString().trim()) return json({ ok: true });
    const started = Number(form.get('started') || 0);
    if (!started || Date.now() - started < 3000) return json({ ok: true });

    // Turnstile verification
    const token = (form.get('cf-turnstile-response') || '').toString();
    if (!token) return json({ ok: false, error: 'Please complete the security check.' }, 400);
    if (!env.TURNSTILE_SECRET_KEY) return json({ ok: false, error: 'Form is not configured yet. Please email contact@guidesync.net.' }, 500);
    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token, remoteip: request.headers.get('CF-Connecting-IP') || '' }),
    }).then((r) => r.json());
    if (!verify.success) return json({ ok: false, error: 'Security check failed. Please try again.' }, 400);

    // Validate
    const d = {};
    for (const [k, max] of Object.entries(LIMITS)) d[k] = clean(form.get(k), max);
    const missing = ['first_name', 'last_name', 'email', 'phone', 'industry', 'services'].filter((k) => !d[k]);
    if (missing.length) return json({ ok: false, error: 'Please complete all required fields.' }, 400);
    if (!EMAIL.test(d.email.replace(/^'/, ''))) return json({ ok: false, error: 'Please enter a valid email address.' }, 400);
    if (d.phone.replace(/\D/g, '').length < 10) return json({ ok: false, error: 'Please enter a valid phone number.' }, 400);
    if (form.get('consent') !== 'yes') return json({ ok: false, error: 'Please agree to be contacted.' }, 400);
    // Reject obvious link spam in the description
    if ((d.services.match(/https?:\/\//g) || []).length > 2) return json({ ok: true });

    let utm = {};
    try { utm = JSON.parse(d.utm.replace(/^'/, '') || '{}'); } catch (_) {}

    const payload = {
      secret: env.SHEETS_SHARED_SECRET,
      lead: {
        submitted_at: new Date().toISOString(),
        first_name: d.first_name,
        last_name: d.last_name,
        email: d.email,
        phone: d.phone,
        industry: d.industry,
        monthly_volume: d.monthly_volume,
        services: d.services,
        page: d.page,
        utm_source: clean(utm.utm_source, 150),
        utm_medium: clean(utm.utm_medium, 150),
        utm_campaign: clean(utm.utm_campaign, 150),
        utm_term: clean(utm.utm_term, 150),
        gclid: clean(utm.gclid || utm.gbraid || utm.wbraid, 200),
        landing_page: clean(utm.landing, 200),
        referrer: clean(utm.referrer, 200),
        country: (request.cf && request.cf.country) || '',
        region: (request.cf && request.cf.region) || '',
        consent: 'yes',
      },
    };

    if (!env.SHEETS_WEBHOOK_URL) return json({ ok: false, error: 'Form is not configured yet. Please email contact@guidesync.net.' }, 500);
    const res = await fetch(env.SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });
    const text = await res.text();
    let out = {};
    try { out = JSON.parse(text); } catch (_) {}
    if (!res.ok || !out.ok) {
      console.error('Sheets webhook error', res.status, text.slice(0, 300));
      return json({ ok: false, error: 'We could not save your request. Please email contact@guidesync.net.' }, 502);
    }
    return json({ ok: true });
  } catch (err) {
    console.error('lead error', err && err.stack);
    return json({ ok: false, error: 'Unexpected error. Please email contact@guidesync.net.' }, 500);
  }
}

// Any non-POST method (POST is handled by onRequestPost above).
export async function onRequest() {
  return json({ ok: false, error: 'Method not allowed' }, 405);
}
