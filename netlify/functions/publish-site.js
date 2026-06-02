// netlify/functions/publish-site.js
// Accepts a POST with { password, content, products? } and commits
//   site-content.json   (always — header / tagline / hero text etc.)
//   products.json       (optional — the full product catalog)
// to GitHub.
// Requires env vars set on Netlify:
//   GITHUB_TOKEN     - fine-grained PAT with Contents: read+write on this repo
//   PUBLISH_PASSWORD - legacy admin password (used when CLERK_SECRET_KEY is unset)
//   CLERK_SECRET_KEY - optional; when set, requires Authorization: Bearer <session>
//                      from an allowed Clerk admin (org:admin or CLERK_ADMIN_USER_IDS)

const { verifyClerkAuth } = require('./_clerk-auth');

const OWNER  = 'OrkhanBa';
const REPO   = 'vitaterra';
const BRANCH = 'main';

const SITE_CONTENT_PATH  = 'site-content.json';
const PRODUCTS_PATH      = 'products.json';
const SALES_USERS_PATH   = 'sales-users.json';

// Per-file payload limit. Product catalog (with base64 images + AZ translations)
// can grow well past the old 500KB cap, so we allow up to 5MB.
const MAX_BYTES = 5 * 1024 * 1024;

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

async function putFile(ghHeaders, path, payload, message) {
  const buf = Buffer.isBuffer(payload) ? payload : Buffer.from(String(payload), 'utf8');
  if (buf.length > MAX_BYTES) {
    throw new Error(`Payload for ${path} too large (${buf.length} bytes, limit ${MAX_BYTES})`);
  }

  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;

  let sha = undefined;
  const headRes = await fetch(`${url}?ref=${BRANCH}`, { headers: ghHeaders });
  if (headRes.status === 200) {
    const data = await headRes.json();
    sha = data.sha;
  } else if (headRes.status !== 404) {
    const t = await headRes.text();
    throw new Error(`GitHub HEAD for ${path} failed (${headRes.status}): ${t.slice(0, 300)}`);
  }

  const putBody = {
    message,
    content: buf.toString('base64'),
    branch: BRANCH,
    committer: { name: 'Vita Terra Editor', email: 'editor@vitaterra.az' },
  };
  if (sha) putBody.sha = sha;

  const putRes = await fetch(url, {
    method: 'PUT',
    headers: { ...ghHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(putBody),
  });

  if (!putRes.ok) {
    const t = await putRes.text();
    throw new Error(`GitHub PUT for ${path} failed (${putRes.status}): ${t.slice(0, 300)}`);
  }
  return putRes.json();
}

function parseDataImage(dataUrl) {
  if (typeof dataUrl !== 'string' || dataUrl.indexOf('data:image/') !== 0) return null;
  const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp|gif));base64,(.+)$/i);
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const ext = mime.indexOf('png') >= 0 ? 'png'
    : mime.indexOf('webp') >= 0 ? 'webp'
    : mime.indexOf('gif') >= 0 ? 'gif'
    : 'jpg';
  return { buffer: Buffer.from(match[2], 'base64'), ext };
}

async function resolveProductImages(ghHeaders, products, stamp) {
  const imagePaths = [];
  const resolved = [];

  for (const product of products) {
    const copy = Object.assign({}, product);
    const parsed = parseDataImage(copy.image);
    if (parsed) {
      const path = `assets/products/product-${product.id}.${parsed.ext}`;
      await putFile(
        ghHeaders,
        path,
        parsed.buffer,
        `Publish product image: ${product.name || product.id} (${stamp})`
      );
      copy.image = '/' + path;
      imagePaths.push(copy.image);
    } else if (copy.image && String(copy.image).indexOf('/assets/products/') === 0) {
      imagePaths.push(copy.image);
    }
    if (Array.isArray(copy.images)) {
      copy.images.forEach(function(img) {
        if (img && String(img).indexOf('/assets/products/') === 0 && imagePaths.indexOf(img) < 0) {
          imagePaths.push(img);
        }
      });
    }
    resolved.push(copy);
  }

  return { products: resolved, imagePaths };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };
  if (event.httpMethod !== 'POST')    return reply(405, { error: 'Method not allowed' });

  const githubToken     = process.env.GITHUB_TOKEN;
  const publishPassword = process.env.PUBLISH_PASSWORD;
  const clerkSecretKey  = process.env.CLERK_SECRET_KEY;
  if (!githubToken) return reply(500, { error: 'GITHUB_TOKEN env var not configured on Netlify' });
  if (!clerkSecretKey && !publishPassword) {
    return reply(500, { error: 'Configure CLERK_SECRET_KEY or PUBLISH_PASSWORD on Netlify' });
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return reply(400, { error: 'Invalid JSON body' }); }

  if (clerkSecretKey) {
    const auth = await verifyClerkAuth(event, { requireAdmin: true });
    if (!auth.ok) return reply(auth.status, { error: auth.error });
  } else if (body.password !== publishPassword) {
    return reply(401, { error: 'Incorrect publish password' });
  }
  if (!body.content || typeof body.content !== 'object') {
    return reply(400, { error: 'Missing or invalid content object' });
  }

  const ghHeaders = {
    'Authorization': `Bearer ${githubToken}`,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'VitaTerra-Publisher',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const stamp = new Date().toISOString();
  const results = {};

  try {
    // 1. Site content — always written.
    const sitePayload = JSON.stringify(body.content, null, 2);
    const siteRes = await putFile(
      ghHeaders,
      SITE_CONTENT_PATH,
      sitePayload,
      `Publish site content via editor (${stamp})`
    );
    results.siteCommit    = siteRes.commit && siteRes.commit.sha;
    results.siteCommitUrl = siteRes.commit && siteRes.commit.html_url;

    // 2. Product catalog — written only if an array was provided.
    if (Array.isArray(body.products)) {
      const imageResult = await resolveProductImages(ghHeaders, body.products, stamp);
      const productsObj = {
        _meta: { publishedAt: stamp },
        products: imageResult.products,
      };
      const productsPayload = JSON.stringify(productsObj, null, 2);
      const prodRes = await putFile(
        ghHeaders,
        PRODUCTS_PATH,
        productsPayload,
        `Publish product catalog via editor (${stamp})`
      );
      results.productsCommit    = prodRes.commit && prodRes.commit.sha;
      results.productsCommitUrl = prodRes.commit && prodRes.commit.html_url;
      results.productImages     = imageResult.imagePaths.length;
    }

    // 3. Sales portal logins — written when an array was provided.
    if (Array.isArray(body.salesUsers)) {
      const salesUsersObj = {
        _meta: { publishedAt: stamp },
        users: body.salesUsers,
      };
      const salesUsersPayload = JSON.stringify(salesUsersObj, null, 2);
      const salesRes = await putFile(
        ghHeaders,
        SALES_USERS_PATH,
        salesUsersPayload,
        `Publish sales users via editor (${stamp})`
      );
      results.salesUsersCommit    = salesRes.commit && salesRes.commit.sha;
      results.salesUsersCommitUrl = salesRes.commit && salesRes.commit.html_url;
    }

    return reply(200, {
      ok: true,
      ...results,
      message: 'Published. Site will rebuild in ~30 seconds.',
    });
  } catch (err) {
    return reply(502, { error: 'Publish failed', detail: String(err && err.message || err) });
  }
};
