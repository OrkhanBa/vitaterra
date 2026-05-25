// netlify/functions/publish-site.js
// Accepts a POST with { password, content, products? } and commits
//   site-content.json   (always — header / tagline / hero text etc.)
//   products.json       (optional — the full product catalog)
// to GitHub.
// Requires two env vars set on Netlify:
//   GITHUB_TOKEN     - fine-grained PAT with Contents: read+write on this repo
//   PUBLISH_PASSWORD - the password an admin types in the editor before publishing

const OWNER  = 'OrkhanBa';
const REPO   = 'vitaterra';
const BRANCH = 'main';

const SITE_CONTENT_PATH = 'site-content.json';
const PRODUCTS_PATH     = 'products.json';

// Per-file payload limit. Product catalog (with base64 images + AZ translations)
// can grow well past the old 500KB cap, so we allow up to 5MB.
const MAX_BYTES = 5 * 1024 * 1024;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function reply(status, body) {
  return {
    statusCode: status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

async function putFile(ghHeaders, path, payload, message) {
  if (payload.length > MAX_BYTES) {
    throw new Error(`Payload for ${path} too large (${payload.length} bytes, limit ${MAX_BYTES})`);
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
    content: Buffer.from(payload, 'utf8').toString('base64'),
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

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };
  if (event.httpMethod !== 'POST')    return reply(405, { error: 'Method not allowed' });

  const githubToken     = process.env.GITHUB_TOKEN;
  const publishPassword = process.env.PUBLISH_PASSWORD;
  if (!githubToken)     return reply(500, { error: 'GITHUB_TOKEN env var not configured on Netlify' });
  if (!publishPassword) return reply(500, { error: 'PUBLISH_PASSWORD env var not configured on Netlify' });

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return reply(400, { error: 'Invalid JSON body' }); }

  if (body.password !== publishPassword) return reply(401, { error: 'Incorrect publish password' });
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
      const productsObj = {
        _meta: { publishedAt: stamp },
        products: body.products,
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
