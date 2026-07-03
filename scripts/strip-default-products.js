// One-off: strip secret cost/markup out of the embedded DEFAULT_PRODUCTS array
// in index.html (a view-source leak) and replace them with the same public
// priceAznNet baked into products.json. DEFAULT_PRODUCTS is only a deep offline
// fallback, but it must not leak cost/margin either.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'products.json'), 'utf8')).products;
const priceById = {};
products.forEach(function (p) { if (p.priceAznNet != null) priceById[p.id] = p.priceAznNet; });

const file = path.join(ROOT, 'index.html');
let html = fs.readFileSync(file, 'utf8');

const startMarker = 'const DEFAULT_PRODUCTS = [';
const start = html.indexOf(startMarker);
if (start < 0) { console.error('DEFAULT_PRODUCTS not found'); process.exit(1); }
const end = html.indexOf('\n];', start);
if (end < 0) { console.error('DEFAULT_PRODUCTS end not found'); process.exit(1); }

const before = html.slice(0, start);
const block = html.slice(start, end);
const after = html.slice(end);

let replaced = 0;
const newBlock = block.replace(/^(\s*\{.*?"id":\s*(\d+).*)$/gm, function (line, _full, idStr) {
  const id = parseInt(idStr, 10);
  const price = priceById[id];
  const priceStr = price != null ? ('"priceAznNet": ' + price + ', ') : '';
  const out = line.replace(/"cost":\s*[\d.]+,\s*"markup":\s*[\d.]+,\s*/, priceStr);
  if (out !== line) replaced++;
  return out;
});

if (replaced === 0) { console.error('No DEFAULT_PRODUCTS lines changed — aborting'); process.exit(1); }

fs.writeFileSync(file, before + newBlock + after, 'utf8');
console.log('Rewrote ' + replaced + ' DEFAULT_PRODUCTS entries');
