// ── Vita Terra · Main Site JS ────────────────────────────────────────────────

let currentLang = localStorage.getItem('vt_lang') || 'en';
let currentFilter = 'All';

// ── Language ──────────────────────────────────────────────────────────────────
function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem('vt_lang', lang);
  document.querySelectorAll('[data-en]').forEach(el => {
    const key = lang === 'az' ? 'az' : 'en';
    const val = el.getAttribute('data-' + key);
    if (val) el.innerHTML = val;
  });
  document.getElementById('langToggle').textContent = lang === 'az' ? 'EN / AZ' : 'AZ / EN';
  renderProducts();
}

document.getElementById('langToggle').addEventListener('click', () => {
  applyLang(currentLang === 'en' ? 'az' : 'en');
});

// ── Nav scroll ─────────────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 40);
});

// ── Products ───────────────────────────────────────────────────────────────
function renderFilters() {
  const row = document.getElementById('filterRow');
  const cats = ['All', ...new Set(VT.getProducts().map(p => p.category))];
  row.innerHTML = cats.map(c =>
    `<button class="filter-btn${c === currentFilter ? ' active' : ''}" data-cat="${c}">${c}</button>`
  ).join('');
  row.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.cat;
      renderFilters();
      renderProducts();
    });
  });
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  let prods = VT.getProducts();
  if (currentFilter !== 'All') prods = prods.filter(p => p.category === currentFilter);
  if (!prods.length) {
    grid.innerHTML = '<p style="color:var(--text-light);grid-column:1/-1">No products found.</p>';
    return;
  }
  grid.innerHTML = prods.map(p => {
    const name = currentLang === 'az' && p.nameAz ? p.nameAz : p.name;
    const desc = currentLang === 'az' && p.descriptionAz ? p.descriptionAz : p.description;
    const stockLabel = currentLang === 'az' ? 'Stok' : 'Stock';
    const moreLabel  = currentLang === 'az' ? 'Ətraflı →' : 'Details →';
    return `
      <div class="product-card" data-id="${p.id}">
        <span class="pc-emoji">${p.image || '🌿'}</span>
        <div class="pc-cat">${p.category}</div>
        <div class="pc-name">${name}</div>
        <div class="pc-desc">${desc.slice(0, 120)}…</div>
        <div class="pc-footer">
          <span class="pc-stock${p.stock < 20 ? ' low' : ''}">${stockLabel}: ${p.stock}</span>
          <span class="pc-more">${moreLabel}</span>
        </div>
      </div>`;
  }).join('');
  grid.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', () => openModal(card.dataset.id));
  });
}

function openModal(id) {
  const p = VT.getProducts().find(x => x.id === id);
  if (!p) return;
  const az = currentLang === 'az';
  const name = az && p.nameAz ? p.nameAz : p.name;
  const desc = az && p.descriptionAz ? p.descriptionAz : p.description;
  const usage= az && p.usageAz ? p.usageAz : p.usage;
  const lblActive = az ? 'Aktiv maddə'   : 'Active Ingredient';
  const lblTarget = az ? 'Hədəf zərərverici' : 'Target Pest';
  const lblCrop   = az ? 'Bitki'          : 'Crop';
  const lblForm   = az ? 'Forma'          : 'Formulation';
  const lblSize   = az ? 'Ölçü'           : 'Unit Size';
  const lblSku    = az ? 'SKU'            : 'SKU';
  const lblUsage  = az ? 'İstifadə qaydası' : 'How to Use';

  document.getElementById('modalBody').innerHTML = `
    <div class="modal-emoji">${p.image || '🌿'}</div>
    <div class="modal-cat">${p.category}</div>
    <div class="modal-name">${name}</div>
    <div class="modal-desc">${desc}</div>
    <table class="modal-table">
      <tr><td>${lblSku}</td><td>${p.sku || '—'}</td></tr>
      <tr><td>${lblActive}</td><td>${p.activeIngredient || '—'}</td></tr>
      <tr><td>${lblTarget}</td><td>${p.targetPest || '—'}</td></tr>
      <tr><td>${lblCrop}</td><td>${p.crop || '—'}</td></tr>
      <tr><td>${lblForm}</td><td>${p.formulation || '—'}</td></tr>
      <tr><td>${lblSize}</td><td>${(az && p.unitSizeAz ? p.unitSizeAz : p.unitSize) || '—'}</td></tr>
    </table>
    <div class="modal-usage-title">${lblUsage}</div>
    <div class="modal-usage">${usage || '—'}</div>
  `;
  document.getElementById('modalOverlay').classList.add('open');
}

document.getElementById('modalClose').addEventListener('click', () => {
  document.getElementById('modalOverlay').classList.remove('open');
});
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modalOverlay'))
    document.getElementById('modalOverlay').classList.remove('open');
});

// ── Contact form ──────────────────────────────────────────────────────────
document.getElementById('contactForm').addEventListener('submit', e => {
  e.preventDefault();
  showToast(currentLang === 'az' ? 'Mesajınız göndərildi!' : 'Message sent!', 'success');
  e.target.reset();
});

// ── Toast ──────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = `toast ${type}`;
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); }, 3000);
}

// ── Init ──────────────────────────────────────────────────────────────────
renderFilters();
renderProducts();
applyLang(currentLang);
