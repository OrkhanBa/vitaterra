// Smoke test: editing one product must not reset other products' markups.
const DEFAULT_PRODUCTS = [
  { id: 1, name: 'A', cost: 10, markup: 30 },
  { id: 2, name: 'B', cost: 20, markup: 30 },
];

function productMarkup(p) {
  if (p == null || p.markup === undefined || p.markup === null || p.markup === '') return 30;
  var n = parseFloat(p.markup);
  return isNaN(n) ? 30 : n;
}

function sanitizeProduct(p, idx) {
  return {
    id: parseInt(p.id) || idx + 1,
    name: p.name || 'Unnamed',
    cost: parseFloat(p.cost) || 0,
    markup: productMarkup(p),
  };
}

var store = null;
var PUBLISHED_PRODUCTS = DEFAULT_PRODUCTS.map(function(p) { return Object.assign({}, p); });
var currentView = 'admin';

function usesLocalProductDraft() {
  return currentView === 'admin' || currentView === 'sales';
}

function mergePublishedLabelFields(products) { return products; }

function loadRawProducts() {
  if (store) return store.map(function(p) { return Object.assign({}, p); });
  if (PUBLISHED_PRODUCTS && PUBLISHED_PRODUCTS.length) {
    return PUBLISHED_PRODUCTS.map(function(p) { return Object.assign({}, p); });
  }
  return DEFAULT_PRODUCTS.map(function(p) { return Object.assign({}, p); });
}

function getProductsOld() {
  if (usesLocalProductDraft() && store) return store.map(function(p, i) { return sanitizeProduct(p, i); });
  if (PUBLISHED_PRODUCTS && PUBLISHED_PRODUCTS.length) return PUBLISHED_PRODUCTS.map(function(p, i) { return sanitizeProduct(p, i); });
  if (store) return store.map(function(p, i) { return sanitizeProduct(p, i); });
  return DEFAULT_PRODUCTS.map(function(p, i) { return sanitizeProduct(p, i); });
}

function getProductsNew() {
  var arr;
  if (usesLocalProductDraft()) arr = loadRawProducts();
  else if (PUBLISHED_PRODUCTS && PUBLISHED_PRODUCTS.length) arr = PUBLISHED_PRODUCTS;
  else arr = loadRawProducts();
  return arr.map(function(p, i) { return sanitizeProduct(p, i); });
}

function saveProducts(arr) { store = arr.map(function(p) { return Object.assign({}, p); }); }

function saveProductOld(editingId, fields) {
  var products = getProductsOld();
  var idx = products.findIndex(function(p) { return p.id === editingId; });
  if (idx >= 0) products[idx] = Object.assign({}, products[idx], fields);
  saveProducts(products);
}

function saveProductNew(editingId, fields) {
  var products = loadRawProducts();
  var idx = products.findIndex(function(p) { return p.id === editingId; });
  if (idx >= 0) products[idx] = Object.assign({}, products[idx], fields);
  saveProducts(products);
}

function pricingImportNew() {
  var products = loadRawProducts();
  products[0].markup = 45;
  products[1].markup = 52;
  saveProducts(products);
}

// Scenario: import custom markups, then edit product 1 name only
pricingImportNew();
saveProductNew(1, { name: 'A renamed', cost: 10, markup: 45 });
var afterNew = loadRawProducts();
if (afterNew[1].markup !== 52) {
  console.error('FAIL new: product 2 markup became', afterNew[1].markup);
  process.exit(1);
}

// Old bug: if store exists but getProductsOld fell through to published during edge cases
store = [{ id: 1, name: 'A', cost: 10, markup: 45 }, { id: 2, name: 'B', cost: 20, markup: 52 }];
currentView = 'admin';
saveProductOld(1, { name: 'A renamed', cost: 10, markup: 45 });
var afterOld = loadRawProducts();
if (afterOld[1].markup === 52) {
  console.log('old path ok when localStorage present');
} else {
  console.log('old path would clobber (expected in some edge cases):', afterOld[1].markup);
}

// Worst case old bug: empty store pointer but user thought they had draft — simulate published overwrite
store = null;
currentView = 'admin';
pricingImportNew();
currentView = 'public';
saveProductOld(1, { name: 'A renamed', cost: 10, markup: 45 });
var afterPublicEdit = loadRawProducts();
if (afterPublicEdit[1].markup === 30) {
  console.log('repro: old saveProduct on public view overwrote draft with published 30%');
}

store = null;
currentView = 'admin';
pricingImportNew();
currentView = 'public';
saveProductNew(1, { name: 'A renamed', cost: 10, markup: 45 });
var afterPublicEditNew = loadRawProducts();
if (afterPublicEditNew[1].markup !== 52) {
  console.error('FAIL new public-view edit clobbered markup:', afterPublicEditNew[1].markup);
  process.exit(1);
}

console.log('PASS: markup persistence smoke tests');
