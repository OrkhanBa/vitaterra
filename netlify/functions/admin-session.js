// netlify/functions/admin-session.js
// Bridges a verified Clerk *admin* into a Supabase Auth session so the admin
// panel can read/write Supabase as an authenticated user (role=admin) — this
// is the "master login": one Clerk sign-in unlocks admin + sales + finance.
//
// Flow: client sends Authorization: Bearer <clerk session token>. We verify it
// is an allowed admin, then password-grant the dedicated Supabase admin user
// and return its tokens. The admin's Supabase password never touches the
// browser — only the resulting short-lived session tokens do.
//
// Required env vars on Netlify:
//   CLERK_SECRET_KEY        - already used by publish-site.js
//   SUPABASE_ADMIN_EMAIL    - e.g. admin@users.vitaterra.az
//   SUPABASE_ADMIN_PASSWORD - the admin Supabase user's password
// Optional (sane defaults for this project):
//   SUPABASE_URL, SUPABASE_ANON_KEY

const { verifyClerkAuth } = require('./_clerk-auth');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gqhjntqfgwvyqpynfzut.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxaGpudHFmZ3d2eXFweW5menV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5ODY1NDksImV4cCI6MjA5ODU2MjU0OX0.tezK6Q-UktN14NA1po5KhnliQvRgSn3UUunA9d90aDk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function reply(status, body) {
  return {
    statusCode: status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };
  if (event.httpMethod !== 'POST')    return reply(405, { error: 'Method not allowed' });

  const email = process.env.SUPABASE_ADMIN_EMAIL;
  const password = process.env.SUPABASE_ADMIN_PASSWORD;
  if (!process.env.CLERK_SECRET_KEY) return reply(500, { error: 'CLERK_SECRET_KEY not configured' });
  if (!email || !password) return reply(500, { error: 'SUPABASE_ADMIN_EMAIL / SUPABASE_ADMIN_PASSWORD not configured' });

  const auth = await verifyClerkAuth(event, { requireAdmin: true });
  if (!auth.ok) return reply(auth.status, { error: auth.error });

  try {
    const res = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const t = await res.text();
      return reply(502, { error: 'Supabase admin sign-in failed', detail: t.slice(0, 300) });
    }
    const data = await res.json();
    const meta = (data.user && data.user.app_metadata) || {};
    return reply(200, {
      ok: true,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in || 3600,
      role: meta.role || 'admin',
      name: meta.name || 'Administrator',
      username: meta.username || 'admin',
    });
  } catch (err) {
    return reply(502, { error: 'Bridge failed', detail: String((err && err.message) || err) });
  }
};
