// One-off / repeatable sanitizer: strips secret cost + markup from the public
// products.json and bakes in a precomputed public price (priceAznNet) so the
// storefront still shows identical prices without leaking cost/markup.
//
// Public price model (unchanged): priceAznNet = cost * (1 + markup/100) * FX
// where FX is the public default (1.70) — the same value anonymous visitors
// already use, so displayed prices do not move.
//
// Also prints the { id, cost, markup } seed rows for the authenticated-only
// Supabase product_pricing table.
//
//   node scripts/strip-pricing.js            # rewrite products.json + print seed
//   node scripts/strip-pricing.js --dry      # print seed only, do not write

const fs = require('fs');
const path = require('path');

const FX = 1.70; // must match PRICING_DEFAULTS.fx in index.html
const FILE = path.join(__dirname, '..', 'products.json');

const raw = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const products = Array.isArray(raw.products) ? raw.products : [];

const seed = [];
const sanitized = products.map(function (p) {
  const out = Object.assign({}, p);
  const cost = parseFloat(p.cost);
  const markup = (p.markup === undefined || p.markup === null || p.markup === '')
    ? 30 : parseFloat(p.markup);
  if (isFinite(cost) && cost > 0) {
    const net = cost * (1 + (isFinite(markup) ? markup : 30) / 100) * FX;
    out.priceAznNet = Math.round(net * 10000) / 10000;
    seed.push({ id: p.id, name: p.name, cost: cost, markup: isFinite(markup) ? markup : 30 });
  }
  delete out.cost;
  delete out.markup;
  return out;
});

const dry = process.argv.indexOf('--dry') >= 0;
if (!dry) {
  const next = Object.assign({}, raw, { products: sanitized });
  fs.writeFileSync(FILE, JSON.stringify(next, null, 2) + '\n', 'utf8');
  console.error('Wrote sanitized ' + FILE + ' (' + sanitized.length + ' products)');
}

// Emit SQL VALUES rows for the product_pricing seed.
const rows = seed.map(function (s) {
  return '  (' + s.id + ', ' + s.cost + ', ' + s.markup + ')';
}).join(',\n');
console.log('-- ' + seed.length + ' pricing rows');
console.log(rows);
