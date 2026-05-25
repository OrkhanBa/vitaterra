// netlify/functions/extract-label.js
// Accepts a POST with { base64, filename } where base64 is a base64-encoded PDF.
// Proxies the request to the Anthropic Claude API and returns the parsed label data.
// Requires env var on Netlify:
//   CLAUDE_API_KEY  - your Anthropic API key (starts with sk-ant-...)

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

const PROMPT = `You are analyzing a pesticide/agrochemical product label PDF (may be in Russian or English).
CRITICAL: You MUST fill ALL fields below, especially the *_az fields which must be in AZERBAIJANI language (not English, not Russian). Translate the label content into Azerbaijani.
Respond ONLY with valid JSON, no markdown, no extra text. All 12 fields are required.

{
  "name": "trade name / product name from label",
  "activeIngredient": "active ingredient(s) with concentration",
  "category": "one of: Herbicide, Insecticide, Fungicide, Growth Regulator, Fertilizer, Specialty",
  "formulation": "formulation type e.g. SC, EC, WG, SL",
  "desc": "2-3 sentence product description in English based on the label",
  "usage": "key usage instructions in English in 2-3 sentences",
  "target": "target pests or crops mentioned (English)",
  "safetyInterval": "pre-harvest interval if mentioned, otherwise empty string",
  "desc_az": "REQUIRED — 2-3 cümlə Azərbaycan dilində: məhsulun təsviri, nə üçün nəzərdə tutulduğu və necə işlədiyi",
  "usage_az": "REQUIRED — Azərbaycan dilində istifadə qaydası: doza, vaxt, metod — 2-3 cümlə",
  "target_az": "REQUIRED — Azərbaycan dilində: hansı bitkilər üçün nəzərdə tutulub və hansı zərərvericiləri/xəstəlikləri məhv edir",
  "rawText": "first 200 chars of extracted text for reference"
}`;

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };
  if (event.httpMethod !== 'POST')    return reply(405, { error: 'Method not allowed' });

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return reply(500, { error: 'CLAUDE_API_KEY env var not configured on Netlify' });

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return reply(400, { error: 'Invalid JSON body' }); }

  const base64 = body.base64;
  const filename = body.filename || 'label.pdf';
  if (!base64 || typeof base64 !== 'string') {
    return reply(400, { error: 'Missing or invalid base64 field' });
  }
  if (base64.length > 12 * 1024 * 1024) {
    return reply(413, { error: 'PDF too large (max ~9MB)' });
  }

  try {
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
            { type: 'text', text: PROMPT },
          ],
        }],
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return reply(502, {
        error: 'Claude API request failed',
        status: apiRes.status,
        detail: errText.slice(0, 800),
      });
    }

    const data = await apiRes.json();
    const text = (data.content || []).map((b) => b.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();

    let parsed;
    try { parsed = JSON.parse(clean); }
    catch (e) {
      // Fallback: return name from filename so matching still works
      const name = filename.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ');
      return reply(200, {
        name, activeIngredient: '', category: 'Other', formulation: '',
        desc: '', usage: '', target: '', safetyInterval: '',
        desc_az: '', usage_az: '', target_az: '',
        rawText: clean.slice(0, 200),
        _parseError: 'Model output was not valid JSON',
      });
    }

    return reply(200, parsed);
  } catch (err) {
    return reply(500, { error: 'Unexpected server error', detail: String((err && err.message) || err) });
  }
};
