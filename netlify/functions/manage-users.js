// netlify/functions/manage-users.js
// Admin-only CRUD for sales/finance login accounts, backed by Supabase Auth.
// The admin panel calls this with the Clerk admin session token; we verify the
// caller is an allowed admin, then use the Supabase service_role key (server
// side only) to list/create/update/deactivate users. Passwords are hashed by
// Supabase and never stored or returned.
//
// Required env vars on Netlify:
//   CLERK_SECRET_KEY           - verifies the calling admin (already used elsewhere)
//   SUPABASE_SERVICE_ROLE_KEY  - secret service key (NEVER expose to the browser)
// Optional (defaults for this project):
//   SUPABASE_URL

const { verifyClerkAuth } = require('./_clerk-auth');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gqhjntqfgwvyqpynfzut.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL_DOMAIN = 'users.vitaterra.az';
const VALID_ROLES = ['sales', 'finance'];

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

function adminHeaders() {
  return {
    'apikey': SERVICE_KEY,
    'Authorization': 'Bearer ' + SERVICE_KEY,
    'Content-Type': 'application/json',
  };
}

function usernameToEmail(username) {
  return String(username || '').trim().toLowerCase() + '@' + EMAIL_DOMAIN;
}

function toPublicUser(u) {
  const meta = u.app_metadata || {};
  return {
    id: u.id,
    username: meta.username || (u.email || '').split('@')[0],
    name: meta.name || '',
    role: meta.role || '',
    active: !(u.banned_until && new Date(u.banned_until) > new Date()),
  };
}

async function listAppUsers() {
  const out = [];
  let page = 1;
  // GoTrue paginates admin user listing; walk pages until short/empty.
  for (;;) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=200`, { headers: adminHeaders() });
    if (!res.ok) throw new Error('list failed (' + res.status + '): ' + (await res.text()).slice(0, 200));
    const data = await res.json();
    const users = data.users || [];
    users.forEach((u) => {
      const role = (u.app_metadata || {}).role;
      if (VALID_ROLES.indexOf(role) >= 0) out.push(toPublicUser(u));
    });
    if (users.length < 200) break;
    page += 1;
    if (page > 25) break;
  }
  return out;
}

async function findByUsername(username) {
  const email = usernameToEmail(username);
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=200`, { headers: adminHeaders() });
  if (!res.ok) return null;
  const data = await res.json();
  return (data.users || []).find((u) => (u.email || '').toLowerCase() === email) || null;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };
  if (event.httpMethod !== 'POST')    return reply(405, { error: 'Method not allowed' });

  if (!process.env.CLERK_SECRET_KEY) return reply(500, { error: 'CLERK_SECRET_KEY not configured' });
  if (!SERVICE_KEY) return reply(500, { error: 'SUPABASE_SERVICE_ROLE_KEY not configured' });

  const auth = await verifyClerkAuth(event, { requireAdmin: true });
  if (!auth.ok) return reply(auth.status, { error: auth.error });

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return reply(400, { error: 'Invalid JSON body' }); }

  const action = body.action;

  try {
    if (action === 'list') {
      return reply(200, { ok: true, users: await listAppUsers() });
    }

    if (action === 'create') {
      const username = String(body.username || '').trim();
      const password = String(body.password || '');
      const role = String(body.role || '').trim();
      const name = String(body.name || username).trim();
      if (!username) return reply(400, { error: 'Username required' });
      if (password.length < 6) return reply(400, { error: 'Password must be at least 6 characters' });
      if (VALID_ROLES.indexOf(role) < 0) return reply(400, { error: 'Role must be sales or finance' });
      if (await findByUsername(username)) return reply(409, { error: 'Username already exists' });

      const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({
          email: usernameToEmail(username),
          password,
          email_confirm: true,
          app_metadata: { role, name, username, provider: 'email', providers: ['email'] },
          user_metadata: { role, name, username },
        }),
      });
      if (!res.ok) return reply(502, { error: 'Create failed', detail: (await res.text()).slice(0, 300) });
      return reply(200, { ok: true, user: toPublicUser(await res.json()) });
    }

    if (action === 'update') {
      const id = String(body.id || '').trim();
      if (!id) return reply(400, { error: 'User id required' });
      const patch = {};
      const appMeta = {};
      if (body.name !== undefined) appMeta.name = String(body.name).trim();
      if (body.role !== undefined) {
        if (VALID_ROLES.indexOf(body.role) < 0) return reply(400, { error: 'Role must be sales or finance' });
        appMeta.role = body.role;
      }
      if (Object.keys(appMeta).length) patch.app_metadata = appMeta;
      if (body.password) {
        if (String(body.password).length < 6) return reply(400, { error: 'Password must be at least 6 characters' });
        patch.password = String(body.password);
      }
      if (body.active === true) patch.ban_duration = 'none';
      if (body.active === false) patch.ban_duration = '876000h'; // ~100 years

      const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify(patch),
      });
      if (!res.ok) return reply(502, { error: 'Update failed', detail: (await res.text()).slice(0, 300) });
      return reply(200, { ok: true, user: toPublicUser(await res.json()) });
    }

    return reply(400, { error: 'Unknown action' });
  } catch (err) {
    return reply(502, { error: 'Request failed', detail: String((err && err.message) || err) });
  }
};
