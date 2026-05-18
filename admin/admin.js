// ── Vita Terra · Admin Dashboard JS ─────────────────────────────────────────

let isLoggedIn = false;

// ── AUTH ──────────────────────────────────────────────────────────────────────
function gateLogin() {
  const val = document.getElementById('gatePass').value;
  if (val === VT.getAdminPass()) {
    isLoggedIn = true;
    document.getElementById('gate').style.display = 'none';
    document.getElementById('dash').style.display  = 'flex';
    initDash();
  } else {
    document.getElementById('gateError').textContent = 'Incorrect password.';
  }
}
document.getElementById('gatePass').addEventListener('keydown', e => {
  if (e.key === 'Enter') gateLogin();
});

function logout() {
  document.getElementById('gate').style.display = 'flex';
  document.getElementById('dash').style.display  = 'none';
  document.getElementById('gatePass').value = '';
  isLoggedIn = false;
}

// ── TAB ROUTING ───────────────────────────────────────────────────────────────
document.querySelectorAll('.snav[data-tab]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    switchTab(link.dataset.tab);
  });
});

function switchTab(tab) {
  document.querySelectorAll('.snav').forEach(l => l.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  const link = document.querySelector(`.snav[data-tab="${tab}"]`);
  if (link) link.classList.add('active');
  const panel = document.getElementById(`tab-${tab}`);
  if (panel) panel.classList.add('active');
  if (tab === 'overview')    renderOverview();
  if (tab === 'products')    renderProductTable();
  if (tab === 'sales-log')   renderSalesLog();
  if (tab === 'settings')    renderSettings();
  if (tab === 'add-product') resetProductForm();
}

// ── INIT ──────────────────────────────────────────────────────────────────────
function initDash() {
  renderOverview();
  renderProductTable();
  renderSalesLog();
  renderSettings();
  initImport();
  initSearch();
}

// ── OVERVIEW ──────────────────────────────────────────────────────────────────
function renderOverview() {
  const prods = VT.getProducts();
  const sales = VT.getSales();
  const revenue = sales.reduce((s, x) => s + (x.salePrice * x.qty), 0);
  const margin  = sales.reduce((s, x) => s + ((x.salePrice - x.costPrice) * x.qty), 0);
  const lowStock= prods.filter(p => p.stock < 20).length;

  document.getElementById('kpiGrid').innerHTML = `
    <div class="kpi-card"><div class="kpi-label">Total Products</div><div class="kpi-value">${prods.length}</div><div class="kpi-sub">In catalog</div></div>
    <div class="kpi-card gold"><div class="kpi-label">Total Revenue</div><div class="kpi-value">₼${revenue.toFixed(2)}</div><div class="kpi-sub">All sales</div></div>
    <div class="kpi-card blue"><div class="kpi-label">Total Margin</div><div class="kpi-value">₼${margin.toFixed(2)}</div><div class="kpi-sub">After cost</div></div>
    <div class="kpi-card red"><div class="kpi-label">Low Stock</div><div class="kpi-value">${lowStock}</div><div class="kpi-sub">Below 20 units</div></div>
  `;

  const tbody = document.querySelector('#recentSalesTable tbody');
  const recent = sales.slice(0, 20);
  if (!recent.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-light);padding:24px">No sales recorded yet.</td></tr>'; return; }
  tbody.innerHTML = recent.map(s => {
    const p = VT.getProducts().find(x => x.id === s.productId);
    return `<tr>
      <td>${new Date(s.date).toLocaleDateString()}</td>
      <td>${p ? p.name : s.productId}</td>
      <td>${s.qty}</td>
      <td>₼${(+s.salePrice).toFixed(2)}</td>
      <td>₼${(s.qty * s.salePrice).toFixed(2)}</td>
      <td>${s.rep || '—'}</td>
    </tr>`;
  }).join('');
}

// ── PRODUCTS TABLE ────────────────────────────────────────────────────────────
function renderProductTable(filter = '', cat = 'All') {
  let prods = VT.getProducts();
  if (filter) prods = prods.filter(p =>
    p.name.toLowerCase().includes(filter.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(filter.toLowerCase())
  );
  if (cat && cat !== 'All') prods = prods.filter(p => p.category === cat);

  const markup = VT.getMarkup();
  const tbody = document.querySelector('#productTable tbody');
  if (!prods.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-light);padding:24px">No products found.</td></tr>'; return; }
  tbody.innerHTML = prods.map(p => {
    const sp = VT.salePrice(p.costPrice);
    const stockBadge = p.stock < 10 ? 'red' : p.stock < 25 ? 'gold' : 'green';
    return `<tr>
      <td><code style="font-size:.78rem;background:var(--cream-dark);padding:2px 6px;border-radius:3px">${p.sku || '—'}</code></td>
      <td><strong>${p.name}</strong><br/><span style="font-size:.75rem;color:var(--text-light)">${p.category}</span></td>
      <td>${p.category}</td>
      <td><strong>₼${(+p.costPrice).toFixed(2)}</strong></td>
      <td>₼${sp.toFixed(2)} <span style="font-size:.72rem;color:var(--green-light)">(+${markup}%)</span></td>
      <td><span class="badge ${stockBadge}">${p.stock} units</span></td>
      <td>
        <button class="btn-stock" onclick="openStockModal('${p.id}','${p.name.replace(/'/g,"\\'")}',${p.stock})">Stock</button>
        <button class="btn-edit" onclick="editProduct('${p.id}')">Edit</button>
        <button class="btn-delete" onclick="deleteProduct('${p.id}')">Delete</button>
      </td>
    </tr>`;
  }).join('');

  // Fill category filter
  const catSel = document.getElementById('filterCat');
  if (catSel && !catSel.dataset.filled) {
    const cats = ['All', ...new Set(VT.getProducts().map(p => p.category))];
    catSel.innerHTML = cats.map(c => `<option>${c}</option>`).join('');
    catSel.dataset.filled = '1';
    catSel.addEventListener('change', () => renderProductTable(document.getElementById('searchProducts').value, catSel.value));
  }
}

function initSearch() {
  document.getElementById('searchProducts').addEventListener('input', e => {
    renderProductTable(e.target.value, document.getElementById('filterCat').value);
  });
}

// ── STOCK MODAL ───────────────────────────────────────────────────────────────
function openStockModal(id, name, current) {
  document.getElementById('stockProductId').value = id;
  document.getElementById('stockModalTitle').textContent = `Stock: ${name}`;
  document.getElementById('stockQty').value = current;
  document.getElementById('stockModal').classList.add('open');
}
function closeStockModal() { document.getElementById('stockModal').classList.remove('open'); }
function saveStock() {
  const id  = document.getElementById('stockProductId').value;
  const qty = +document.getElementById('stockQty').value;
  VT.updateProduct(id, { stock: qty });
  closeStockModal();
  renderProductTable();
  renderOverview();
  showToast('Stock updated!', 'success');
}

// ── PRODUCT FORM ──────────────────────────────────────────────────────────────
const PF_FIELDS = ['id','name','nameAz','sku','category','description','descriptionAz','usage','usageAz','activeIngredient','targetPest','crop','formulation','unitSize','image','costPrice','stock'];

document.getElementById('productForm').addEventListener('submit', e => {
  e.preventDefault();
  const id = document.getElementById('pf-id').value;
  const data = {};
  PF_FIELDS.filter(f => f !== 'id').forEach(f => {
    const el = document.getElementById('pf-' + f);
    data[f] = el ? el.value : '';
  });
  data.costPrice = +data.costPrice;
  data.stock     = +data.stock;
  data.tags      = [data.category.toLowerCase()];

  if (id) {
    VT.updateProduct(id, data);
    showToast('Product updated!', 'success');
  } else {
    data.id = 'p-' + Date.now();
    VT.addProduct(data);
    showToast('Product added!', 'success');
  }
  resetProductForm();
  renderProductTable();
});

function resetProductForm() {
  document.getElementById('pf-id').value = '';
  document.getElementById('pfSubmitBtn').textContent = 'Save Product';
  PF_FIELDS.filter(f => f !== 'id').forEach(f => {
    const el = document.getElementById('pf-' + f);
    if (el) el.value = f === 'category' ? 'Herbicide' : '';
  });
}

function editProduct(id) {
  const p = VT.getProducts().find(x => x.id === id);
  if (!p) return;
  switchTab('add-product');
  document.getElementById('pf-id').value = id;
  document.getElementById('pfSubmitBtn').textContent = 'Update Product';
  PF_FIELDS.filter(f => f !== 'id').forEach(f => {
    const el = document.getElementById('pf-' + f);
    if (el && p[f] !== undefined) el.value = p[f];
  });
}

function deleteProduct(id) {
  if (!confirm('Delete this product? This cannot be undone.')) return;
  VT.deleteProduct(id);
  renderProductTable();
  renderOverview();
  showToast('Product deleted.', 'error');
}

// ── EXCEL IMPORT ──────────────────────────────────────────────────────────────
function initImport() {
  document.getElementById('xlsxFile').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    const data = await file.arrayBuffer();
    const wb   = XLSX.read(data);
    const ws   = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    if (!rows.length) { showToast('No data found in file.', 'error'); return; }

    // Preview
    const preview = document.getElementById('importPreview');
    const cols = Object.keys(rows[0]);
    preview.innerHTML = `
      <p style="margin-bottom:12px;color:var(--text-mid)">Found <strong>${rows.length} rows</strong>. Preview (first 5):</p>
      <div class="table-wrap" style="margin-bottom:20px">
        <table class="dash-table">
          <thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
          <tbody>${rows.slice(0,5).map(r => `<tr>${cols.map(c => `<td>${r[c]}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      </div>
      <button class="btn-primary" onclick="confirmImport(${JSON.stringify(rows).split('"').join('&quot;')})">Import ${rows.length} Products</button>
    `;
    // Store rows for import
    window._importRows = rows;
    preview.querySelector('button').onclick = () => confirmImport(window._importRows);
  });
}

function confirmImport(rows) {
  VT.importFromExcel(rows);
  document.getElementById('importResult').innerHTML = `<div style="margin-top:20px;padding:16px 20px;background:rgba(61,107,31,.1);border-radius:var(--radius);color:var(--green-rich)">✓ Imported ${rows.length} products successfully.</div>`;
  document.getElementById('importPreview').innerHTML = '';
  renderProductTable();
  renderOverview();
  showToast(`${rows.length} products imported!`, 'success');
}

// ── SALES LOG ─────────────────────────────────────────────────────────────────
function renderSalesLog(filter = '') {
  let sales = VT.getSales();
  if (filter) sales = sales.filter(s =>
    (s.productName || '').toLowerCase().includes(filter.toLowerCase()) ||
    (s.rep || '').toLowerCase().includes(filter.toLowerCase())
  );
  const tbody = document.querySelector('#salesLogTable tbody');
  if (!sales.length) { tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-light);padding:24px">No sales recorded yet.</td></tr>'; return; }
  tbody.innerHTML = sales.map(s => {
    const p = VT.getProducts().find(x => x.id === s.productId);
    const margin = ((s.salePrice - s.costPrice) * s.qty).toFixed(2);
    return `<tr>
      <td>${new Date(s.date).toLocaleString()}</td>
      <td>${p ? p.name : s.productName || '—'}</td>
      <td><code style="font-size:.75rem;background:var(--cream-dark);padding:2px 6px;border-radius:3px">${p ? p.sku : '—'}</code></td>
      <td>${s.qty}</td>
      <td>₼${(+s.costPrice).toFixed(2)}</td>
      <td>₼${(+s.salePrice).toFixed(2)}</td>
      <td style="color:var(--green-rich);font-weight:500">₼${margin}</td>
      <td>${s.rep || '—'}</td>
      <td style="font-size:.8rem;color:var(--text-light)">${s.notes || ''}</td>
    </tr>`;
  }).join('');
  document.getElementById('salesSearch').addEventListener('input', e => renderSalesLog(e.target.value));
}

function exportSalesCSV() {
  const sales = VT.getSales();
  if (!sales.length) { showToast('No sales to export.', 'error'); return; }
  const prods = VT.getProducts();
  const header = 'Date,Product,SKU,Qty,CostPrice,SalePrice,Margin,Rep,Notes';
  const rows = sales.map(s => {
    const p = prods.find(x => x.id === s.productId);
    const margin = ((s.salePrice - s.costPrice) * s.qty).toFixed(2);
    return [new Date(s.date).toLocaleString(), p ? p.name : s.productId, p ? p.sku : '', s.qty, s.costPrice, s.salePrice, margin, s.rep || '', s.notes || ''].map(v => `"${v}"`).join(',');
  });
  const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vitaterra_sales_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
function renderSettings() {
  document.getElementById('markupInput').value = VT.getMarkup();
  updateMarkupHint();
}

function updateMarkupHint() {
  const m = +document.getElementById('markupInput').value || 0;
  document.getElementById('markupHint').textContent = `Example: ₼42.00 cost → ₼${(42 * (1 + m/100)).toFixed(2)} sale price`;
}
document.getElementById('markupInput').addEventListener('input', updateMarkupHint);

function saveMarkup() {
  const m = +document.getElementById('markupInput').value;
  VT.saveMarkup(m);
  showToast('Markup saved!', 'success');
  updateMarkupHint();
  renderProductTable();
}

function changeAdminPass() {
  const p = document.getElementById('newAdminPass').value.trim();
  if (!p) { showToast('Password cannot be empty.', 'error'); return; }
  VT.saveAdminPass(p);
  document.getElementById('newAdminPass').value = '';
  showToast('Admin password updated!', 'success');
}

function changeSalesPass() {
  const p = document.getElementById('newSalesPass').value.trim();
  if (!p) { showToast('Password cannot be empty.', 'error'); return; }
  VT.saveSalesPass(p);
  document.getElementById('newSalesPass').value = '';
  showToast('Sales password updated!', 'success');
}

// ── TOAST ──────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = `toast ${type}`;
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); }, 3200);
}
