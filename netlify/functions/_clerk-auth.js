// Clerk JWT verification for Netlify functions.
// Set CLERK_SECRET_KEY on Netlify to enable token auth on protected endpoints.
// During migration, publish-site.js falls back to PUBLISH_PASSWORD when unset.

const { verifyToken } = require('@clerk/backend');

function getBearerToken(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7).trim();
}

function isClerkAdmin(claims) {
  const role = claims.org_role || (claims.o && claims.o.rol);
  if (role === 'org:admin' || role === 'admin') return true;

  const allowlist = (process.env.CLERK_ADMIN_USER_IDS || '')
    .split(',')
    .map(function (id) { return id.trim(); })
    .filter(Boolean);
  if (allowlist.length && allowlist.indexOf(claims.sub) >= 0) return true;

  return false;
}

async function verifyClerkAuth(event, options) {
  const opts = options || {};
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return { ok: false, status: 500, error: 'CLERK_SECRET_KEY env var not configured on Netlify' };
  }

  const token = getBearerToken(event);
  if (!token) {
    return { ok: false, status: 401, error: 'Missing Authorization: Bearer token' };
  }

  try {
    const claims = await verifyToken(token, { secretKey });

    if (opts.requireAdmin && !isClerkAdmin(claims)) {
      return { ok: false, status: 403, error: 'Insufficient role for this action' };
    }

    if (opts.requiredRole) {
      const role = claims.org_role || (claims.o && claims.o.rol);
      if (role !== opts.requiredRole) {
        return { ok: false, status: 403, error: 'Insufficient role for this action' };
      }
    }

    return {
      ok: true,
      userId: claims.sub,
      role: claims.org_role || (claims.o && claims.o.rol),
      claims: claims,
    };
  } catch (err) {
    return { ok: false, status: 401, error: 'Invalid or expired Clerk session token' };
  }
}

module.exports = { verifyClerkAuth, getBearerToken, isClerkAdmin };
