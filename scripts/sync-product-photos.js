#!/usr/bin/env node
/**
 * Match Product photos/ folders to products.json entries,
 * dedupe identical images (by hash), copy PNGs to assets/products/,
 * and update products.json with image paths.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PHOTOS_ROOT = path.join(ROOT, 'Product photos');
const ASSETS_DIR = path.join(ROOT, 'assets', 'products');
const PRODUCTS_PATH = path.join(ROOT, 'products.json');

const EXT_PRIORITY = ['.png', '.webp', '.jpg', '.jpeg', '.gif', '.tif', '.tiff'];

const ALIASES = {
  coriente480sc: 'corriente480sc',
  predator225sc: 'predador220ec',
  predador225sc: 'predador220ec',
};

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function extractFolderProductName(folder) {
  return folder.replace(/^\d+(kg|g|l|ml)_/i, '').trim();
}

function fileHash(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function collectPhotoFolders() {
  const out = [];
  if (!fs.existsSync(PHOTOS_ROOT)) return out;
  for (const order of fs.readdirSync(PHOTOS_ROOT)) {
    const orderPath = path.join(PHOTOS_ROOT, order);
    if (!fs.statSync(orderPath).isDirectory()) continue;
    for (const folder of fs.readdirSync(orderPath)) {
      const folderPath = path.join(orderPath, folder);
      if (!fs.statSync(folderPath).isDirectory()) continue;
      const files = fs
        .readdirSync(folderPath)
        .filter((f) => /\.(png|jpe?g|webp|gif|tiff?)$/i.test(f))
        .map((f) => path.join(folderPath, f));
      if (files.length) out.push({ folder, folderPath, files });
    }
  }
  return out;
}

function pickPreferredFile(files) {
  return files.slice().sort((a, b) => {
    const pa = EXT_PRIORITY.indexOf(path.extname(a).toLowerCase());
    const pb = EXT_PRIORITY.indexOf(path.extname(b).toLowerCase());
    return (pa < 0 ? 99 : pa) - (pb < 0 ? 99 : pb);
  })[0];
}

function dedupeFiles(files) {
  // Same basename in different formats (e.g. .png + .tif) = one image
  const byBasename = new Map();
  for (const file of files) {
    const base = file.slice(0, -path.extname(file).length).toLowerCase();
    if (!byBasename.has(base)) byBasename.set(base, []);
    byBasename.get(base).push(file);
  }
  const onePerBasename = [...byBasename.values()].map(pickPreferredFile);

  // Drop byte-identical copies (rare, but safe)
  const byHash = new Map();
  for (const file of onePerBasename) {
    const hash = fileHash(file);
    if (!byHash.has(hash)) byHash.set(hash, file);
  }
  return [...byHash.values()].sort((a, b) => a.localeCompare(b));
}

function matchFolderToProduct(folderName, products) {
  let key = norm(extractFolderProductName(folderName));
  if (ALIASES[key]) key = ALIASES[key];

  let product = products.find((p) => norm(p.name) === key);
  if (product) return product;

  if (/predator/i.test(folderName)) {
    product = products.find((p) => /predad/i.test(p.name));
    if (product) return product;
  }

  const prefix = key.slice(0, 6);
  product = products.find((p) => {
    const pk = norm(p.name);
    return pk.startsWith(prefix) || key.startsWith(pk.slice(0, 6));
  });
  return product || null;
}

function copyAsWebAsset(src, productId, index) {
  const ext = path.extname(src).toLowerCase();
  const useExt = ['.png', '.webp', '.jpg', '.jpeg', '.gif'].includes(ext) ? ext : '.png';
  const suffix = index === 0 ? '' : `-${index + 1}`;
  const destName = `product-${productId}${suffix}${useExt === '.jpeg' ? '.jpg' : useExt}`;
  const destPath = path.join(ASSETS_DIR, destName);
  fs.copyFileSync(src, destPath);
  return `/assets/products/${destName}`;
}

function main() {
  const data = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));
  const products = data.products;
  const folders = collectPhotoFolders();

  if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

  const usedIds = new Set();
  const report = { matched: 0, skipped: 0, unmatched: [] };

  for (const entry of folders) {
    const product = matchFolderToProduct(entry.folder, products);
    if (!product) {
      report.unmatched.push(entry.folder);
      continue;
    }
    if (usedIds.has(product.id)) {
      console.warn(`Warning: duplicate folder for product #${product.id} (${product.name}): ${entry.folder}`);
      continue;
    }
    usedIds.add(product.id);

    const uniqueFiles = dedupeFiles(entry.files);
    const webPaths = uniqueFiles.map((file, i) => copyAsWebAsset(file, product.id, i));

    product.image = webPaths[0] || '';
    if (webPaths.length > 1) product.images = webPaths;
    else delete product.images;

    report.matched++;
    console.log(`✓ #${product.id} ${product.name} ← ${entry.folder} (${uniqueFiles.length} image${uniqueFiles.length === 1 ? '' : 's'})`);
  }

  for (const p of products) {
    if (!usedIds.has(p.id) && !p.image) report.skipped++;
  }

  fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');

  console.log('\n--- Summary ---');
  console.log(`Matched: ${report.matched}/${folders.length} folders`);
  console.log(`Products without photo: ${products.filter((p) => !p.image).length}`);
  if (report.unmatched.length) console.log('Unmatched folders:', report.unmatched.join(', '));
}

main();
