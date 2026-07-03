// netlify/functions/extract-expense-receipt.js
// Accepts a POST with { base64, mimeType, filename } where base64 is a
// base64-encoded receipt/invoice/customs-payment image or PDF. Proxies the
// request to the Anthropic Claude API and returns a best-effort structured
// guess of the expense fields (date, vendor, amount, currency, category,
// description). This is a convenience pre-fill only — the Finance UI keeps
// every field editable and never saves anything without a human reviewing
// it first.
// Requires env var on Netlify:
//   CLAUDE_API_KEY  - your Anthropic API key (starts with sk-ant-...), same
//                     key already used by extract-label.js

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

// Kept in sync with FINANCE_EXPENSE_CATEGORIES in index.html.
const CATEGORIES = [
  'Maaş',
  'Kirayə / Ofis',
  'Logistika / Çatdırılma',
  'Gömrük',
  'Reklam',
  'Vergi / Ödəniş',
  'Bank / Komissiya',
  'Digər',
];

const PROMPT = `You are reading a business expense document for an Azerbaijani agrochemical trading company: a receipt (çek), invoice/faktura, customs payment order (gömrük), utility bill, bank commission slip, or similar. The document may be in Azerbaijani, Russian, English or Turkish.

Respond with ONLY valid JSON, no markdown, no extra text, in exactly this shape:

{
  "date": "the document or payment date in YYYY-MM-DD format, or null if not legible",
  "vendor": "the supplier / counterparty / issuing authority name on the document, or null",
  "amount": total amount paid, as a plain number (dot decimal, no currency symbol, no thousands separators), or null,
  "currency": "AZN" or "USD" — whichever the amount is denominated in — or null if unclear,
  "category": "copy verbatim the single best-matching option from this list: ${JSON.stringify(CATEGORIES)}, or null if none fit",
  "description": "a short 3-6 word Azerbaijani summary of what the expense is for, e.g. \\"Gömrük rüsumu — idxal\\", or null",
  "confidence": "\\"high\\", \\"medium\\", or \\"low\\" — your confidence in the amount and category above"
}

If the image/PDF is unreadable, blank, or clearly not an expense document, set every field to null and confidence to "low". Never invent numbers or dates you cannot actually read.`;

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };
  if (event.httpMethod !== 'POST')    return reply(405, { error: 'Method not allowed' });

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return reply(500, { error: 'CLAUDE_API_KEY env var not configured on Netlify' });

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return reply(400, { error: 'Invalid JSON body' }); }

  const base64 = body.base64;
  const mimeType = String(body.mimeType || '');
  const filename = body.filename || 'receipt';
  if (!base64 || typeof base64 !== 'string') {
    return reply(400, { error: 'Missing or invalid base64 field' });
  }
  if (base64.length > 20 * 1024 * 1024) {
    return reply(413, { error: 'File too large' });
  }

  const isPdf = mimeType === 'application/pdf';
  const isImage = mimeType.indexOf('image/') === 0;
  if (!isPdf && !isImage) {
    return reply(400, { error: 'Unsupported file type — only images and PDF are supported' });
  }

  const fileBlock = isPdf
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
    : { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } };

  const emptyResult = {
    date: null, vendor: null, amount: null, currency: null,
    category: null, description: null, confidence: 'low',
  };

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
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [fileBlock, { type: 'text', text: PROMPT }],
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
      return reply(200, Object.assign({}, emptyResult, {
        _parseError: 'Model output was not valid JSON',
      }));
    }

    return reply(200, Object.assign({}, emptyResult, parsed));
  } catch (err) {
    return reply(500, { error: 'Unexpected server error', detail: String((err && err.message) || err) });
  }
};
