// ── Vita Terra · Sales Portal JS ─────────────────────────────────────────────

let currentRep = '';

// ── AUTH ──────────────────────────────────────────────────────────────────────
function gateLogin() {
  const name = document.getElementById('repName').value.trim();
  const pass  = document.getElementById('gatePass').value;
  if (!name) { document.getElementById('gateError').textContent = 'Please enter your name.'; return; }
  if (pass !== VT.getSalesPass()) { document.getElementById('gateError').textContent = 'Incorrect password.'; return; }
  currentRep = name;
  document.getElementById('repLabel').textContent = name;
  document.getElementById('gate').style.display = 'none';
  document.getElementById('dash').style.display  = 'flex';
  initSalesDash();
}
document.getElementById('gatePass').addEventListener('keydown', e => { if (e.key === 'Enter') gateLogin(); });

function logout() {
  document.getElementById('gate').style.display = 'flex';
  document.getElementById('dash').style.display  = 'none';
  document.getElementById('gatePass').value = '';
  document.getElementById('repName').value = '';
  currentRep = '';
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
  if (tab === 'catalog')  renderCatalog();
  if (tab === 'sell')     renderSellForm();
  if (tab === 'my-sales') renderMySales();
}

// ── INIT ──────────────────────────────────────────────────────────────────────
function initSalesDash() {
  renderCatalog();
  renderSellForm();
  renderMySales();
  initCatalogSearch();
}

// ── CATALOG ───────────────────────────────────────────────────────────────────
function renderCatalog(filter = '', cat = 'All') {
  let prods = VT.getProducts();
  if (filter) prods = prods.filter(p =>
    p.name.toLowerCase().includes(filter.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(filter.toLowerCase())
  );
  if (cat && cat !== 'All') prods = prods.filter(p => p.category === cat);

  const tbody = document.querySelector('#catalogTable tbody');
  if (!prods.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-light);padding:24px">No products found.</td></tr>';
    return;
  }
  tbody.innerHTML = prods.map(p => {
    const sp = VT.salePrice(p.costPrice);
    const stockBadge = p.stock < 10 ? 'red' : p.stock < 25 ? 'gold' : 'green';
    return `<tr>
      <td><code style="font-size:.78rem;background:var(--cream-dark);padding:2px 6px;border-radius:3px">${p.sku || '—'}</code></td>
      <td>
        <strong>${p.name}</strong>
        <div style="font-size:.75rem;color:var(--text-light);margin-top:2px">${p.formulation || ''} ${p.unitSize ? '· ' + p.unitSize : ''}</div>
      </td>
      <td>${p.category}</td>
      <td>${p.unitSize || '—'}</td>
      <td><strong style="color:var(--green-rich)">₼${sp.toFixed(2)}</strong></td>
      <td><span class="badge ${stockBadge}">${p.stock} units</span></td>
      <td>
        <button class="btn-edit" onclick="quickSell('${p.id}')">Sell</button>
      </td>
    </tr>`;
  }).join('');

  // Category filter
  const catSel = document.getElementById('catalogCat');
  if (catSel && !catSel.dataset.filled) {
    const cats = ['All', ...new Set(VT.getProducts().map(p => p.category))];
    catSel.innerHTML = cats.map(c => `<option>${c}</option>`).join('');
    catSel.dataset.filled = '1';
    catSel.addEventListener('change', () => renderCatalog(document.getElementById('catalogSearch').value, catSel.value));
  }
}

function initCatalogSearch() {
  document.getElementById('catalogSearch').addEventListener('input', e => {
    renderCatalog(e.target.value, document.getElementById('catalogCat').value);
  });
}

function quickSell(productId) {
  switchTab('sell');
  document.getElementById('saleProduct').value = productId;
  onSaleProductChange();
}

// ── SELL FORM ─────────────────────────────────────────────────────────────────
function renderSellForm() {
  const sel = document.getElementById('saleProduct');
  const prods = VT.getProducts().filter(p => p.stock > 0);
  sel.innerHTML = prods.map(p =>
    `<option value="${p.id}">${p.name} (Stock: ${p.stock})</option>`
  ).join('');
  if (prods.length) onSaleProductChange();
}

function onSaleProductChange() {
  updateSaleSummary();
}

function updateSaleSummary() {
  const id  = document.getElementById('saleProduct').value;
  const qty = +document.getElementById('saleQty').value || 1;
  const p   = VT.getProducts().find(x => x.id === id);
  if (!p) return;
  const sp = VT.salePrice(p.costPrice);
  document.getElementById('saleSummaryBox').style.display = 'block';
  document.getElementById('ss-price').textContent = `₼${sp.toFixed(2)}`;
  document.getElementById('ss-qty').textContent   = qty;
  document.getElementById('ss-total').textContent = `₼${(sp * qty).toFixed(2)}`;
  document.getElementById('ss-stock').textContent = `${p.stock} available`;
  if (qty > p.stock) {
    document.getElementById('ss-stock').style.color = '#e74c3c';
    document.getElementById('ss-stock').textContent += ' ⚠ Insufficient!';
  } else {
    document.getElementById('ss-stock').style.color = '';
  }
}

function recordSale() {
  const id    = document.getElementById('saleProduct').value;
  const qty   = +document.getElementById('saleQty').value;
  const notes = document.getElementById('saleNotes').value;
  const customer = document.getElementById('saleCustomer').value;
  const p     = VT.getProducts().find(x => x.id === id);
  if (!p) { showToast('Select a product.', 'error'); return; }
  if (!qty || qty < 1) { showToast('Enter a valid quantity.', 'error'); return; }
  if (qty > p.stock) { showToast(`Only ${p.stock} units available.`, 'error'); return; }

  VT.recordSale({
    productId: id,
    productName: p.name,
    qty,
    costPrice: p.costPrice,
    salePrice: VT.salePrice(p.costPrice),
    rep: currentRep,
    notes: customer ? `Customer: ${customer}${notes ? ' | ' + notes : ''}` : notes,
  });

  showToast(`Sale recorded: ${qty}× ${p.name}`, 'success');
  document.getElementById('saleQty').value = 1;
  document.getElementById('saleNotes').value = '';
  document.getElementById('saleCustomer').value = '';
  renderSellForm();
  renderCatalog();
  renderMySales();
}

// ── MY SALES ─────────────────────────────────────────────────────────────────
function renderMySales() {
  const mySales = VT.getSales().filter(s => s.rep === currentRep);
  const revenue = mySales.reduce((t, s) => t + s.salePrice * s.qty, 0);
  const units   = mySales.reduce((t, s) => t + s.qty, 0);

  document.getElementById('myKpis').innerHTML = `
    <div class="kpi-card"><div class="kpi-label">My Sales</div><div class="kpi-value">${mySales.length}</div><div class="kpi-sub">Transactions</div></div>
    <div class="kpi-card gold"><div class="kpi-label">My Revenue</div><div class="kpi-value">₼${revenue.toFixed(2)}</div><div class="kpi-sub">Total sold</div></div>
    <div class="kpi-card blue"><div class="kpi-label">Units Sold</div><div class="kpi-value">${units}</div><div class="kpi-sub">All time</div></div>
  `;

  const tbody = document.querySelector('#mySalesTable tbody');
  if (!mySales.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-light);padding:24px">No sales recorded yet.</td></tr>';
    return;
  }
  tbody.innerHTML = mySales.map(s => {
    const p = VT.getProducts().find(x => x.id === s.productId);
    return `<tr>
      <td>${new Date(s.date).toLocaleString()}</td>
      <td>${p ? p.name : s.productName}</td>
      <td>${s.qty}</td>
      <td>₼${(+s.salePrice).toFixed(2)}</td>
      <td><strong>₼${(s.qty * s.salePrice).toFixed(2)}</strong></td>
      <td style="font-size:.82rem;color:var(--text-light)">${s.notes || '—'}</td>
    </tr>`;
  }).join('');
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = `toast ${type}`;
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); }, 3200);
}
