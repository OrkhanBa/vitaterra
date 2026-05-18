// netlify/functions/publish-site.js
// Accepts a POST with { password, content } and commits site-content.json to GitHub.
// Requires two env vars set on Netlify:
//   GITHUB_TOKEN     - fine-grained PAT with Contents: read+write on this repo
//   PUBLISH_PASSWORD - the password an admin types in the editor before publishing

const OWNER  = 'OrkhanBa';
const REPO   = 'vitaterra';
const BRANCH = 'main';
const PATH   = 'site-content.json';

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

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };
  if (event.httpMethod !== 'POST')    return reply(405, { error: 'Method not allowed' });

  const githubToken    = process.env.GITHUB_TOKEN;
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

  // Reject suspiciously large payloads (>500KB)
  const payload = JSON.stringify(body.content, null, 2);
  if (payload.length > 500 * 1024) return reply(413, { error: 'Content too large (>500KB)' });

  const ghHeaders = {
    'Authorization': `Bearer ${githubToken}`,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'VitaTerra-Publisher',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const contentsUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;

  try {
    // Look up current SHA (if file exists). 404 means it's a new file.
    let sha = undefined;
    const headRes = await fetch(`${contentsUrl}?ref=${BRANCH}`, { headers: ghHeaders });
    if (headRes.status === 200) {
      const data = await headRes.json();
      sha = data.sha;
    } else if (headRes.status !== 404) {
      const t = await headRes.text();
      return reply(502, { error: 'GitHub HEAD failed', status: headRes.status, detail: t.slice(0, 500) });
    }

    const putBody = {
      message: `Publish site content via editor (${new Date().toISOString()})`,
      content: Buffer.from(payload, 'utf8').toString('base64'),
      branch: BRANCH,
      committer: { name: 'Vita Terra Editor', email: 'editor@vitaterra.az' },
    };
    if (sha) putBody.sha = sha;

    const putRes = await fetch(contentsUrl, {
      method: 'PUT',
      headers: { ...ghHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(putBody),
    });

    if (!putRes.ok) {
      const t = await putRes.text();
      return reply(502, { error: 'GitHub PUT failed', status: putRes.status, detail: t.slice(0, 500) });
    }
    const data = await putRes.json();
    return reply(200, {
      ok: true,
      commit: data.commit && data.commit.sha,
      commitUrl: data.commit && data.commit.html_url,
      message: 'Published. Site will rebuild in ~30 seconds.',
    });
  } catch (err) {
    return reply(500, { error: 'Unexpected server error', detail: String(err && err.message || err) });
  }
};
