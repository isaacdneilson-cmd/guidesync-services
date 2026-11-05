// Cloudflare Worker entry: routes /api/lead to the lead handler, everything else to static assets.
import { onRequestPost } from '../functions/api/lead.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/lead' || url.pathname === '/api/lead/') {
      if (request.method === 'POST') return onRequestPost({ request, env, ctx });
      return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', Allow: 'POST', 'Cache-Control': 'no-store' },
      });
    }
    if (url.pathname.startsWith('/api/')) return new Response('Not found', { status: 404 });
    return env.ASSETS.fetch(request);
  },
};
