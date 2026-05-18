// ── Vita Terra · Shared Data Layer ──────────────────────────────────────────
// All data is stored in localStorage so it persists across pages.
// Keys:
//   vt_products   → array of product objects
//   vt_sales      → array of sale records
//   vt_markup     → number (default markup %)
//   vt_admin_pass → string
//   vt_sales_pass → string

const VT = (() => {
  const KEYS = {
    products : 'vt_products',
    sales    : 'vt_sales',
    markup   : 'vt_markup',
    adminPass: 'vt_admin_pass',
    salesPass: 'vt_sales_pass',
  };

  const SAMPLE_PRODUCTS = [
    {
      id: 'cs-001', sku: 'CS-HRB-01',
      name: 'CerradoMax Herbicide', nameAz: 'CerradoMax Herbisid',
      category: 'Herbicide',
      description: 'Broad-spectrum herbicide for pre- and post-emergent weed control in cereals, corn, and soybeans. Selective systemic action.',
      descriptionAz: 'Taxıllar, qarğıdalı və soyada alaq otlarına qarşı geniş spektrli herbisid. Seçici sistemik təsir.',
      usage: 'Apply 2–3 L/ha diluted 1:200 in water. Best applied in the morning when temperature is below 25°C. Do not apply before rain.',
      usageAz: 'Suda 1:200 nisbətində durulaşdırılmış 2–3 L/ha tətbiq edin. 25°C-dən aşağı temperaturda, səhər tətbiq edin.',
      activeIngredient: 'Glyphosate 36% + Fluroxypyr 8%',
      targetPest: 'Annual & perennial weeds',
      crop: 'Cereals, Corn, Soybean',
      formulation: 'EC – Emulsifiable Concentrate',
      unitSize: '5 L', unitSizeAz: '5 L',
      costPrice: 42.00,
      stock: 120,
      image: '🌿',
      tags: ['herbicide','cereal','corn','soybean'],
    },
    {
      id: 'cs-002', sku: 'CS-FNG-01',
      name: 'TerraShield Fungicide', nameAz: 'TerraShield Fungisid',
      category: 'Fungicide',
      description: 'Systemic fungicide offering curative and preventive action against a wide range of fungal diseases in grapes, vegetables and fruit trees.',
      descriptionAz: 'Üzüm, tərəvəz və meyvə ağaclarda geniş çeşidli göbələk xəstəliklərinə qarşı sistemik fungisid.',
      usage: 'Mix 100–150 mL per 100 L water. Apply every 10–14 days during high disease pressure. Max 4 applications per season.',
      usageAz: '100 L suya 100–150 mL qarışdırın. Yüksək xəstəlik təzyiqi zamanı 10–14 gündən bir tətbiq edin.',
      activeIngredient: 'Tebuconazole 25% + Trifloxystrobin 10%',
      targetPest: 'Mildew, Botrytis, Rust, Scab',
      crop: 'Grapes, Tomato, Apple, Cucumber',
      formulation: 'WG – Water Dispersible Granule',
      unitSize: '1 kg', unitSizeAz: '1 kq',
      costPrice: 38.50,
      stock: 85,
      image: '🍇',
      tags: ['fungicide','grape','vegetable','fruit'],
    },
    {
      id: 'cs-003', sku: 'CS-INS-01',
      name: 'SolGuard Insecticide', nameAz: 'SolGuard İnsektisid',
      category: 'Insecticide',
      description: 'Contact and ingestion insecticide with rapid knock-down effect against sucking and chewing insects on cotton, vegetables and orchards.',
      descriptionAz: 'Pambıq, tərəvəz və bağlarda sorub-çeynəyən həşəratlara qarşı sürətli təsirli kontakt insektisid.',
      usage: 'Apply 0.5–1 L/ha. Mix with water at 1:500 ratio. Spray thoroughly on both leaf surfaces. PHI: 7 days.',
      usageAz: '0.5–1 L/ha tətbiq edin. 1:500 nisbətində su ilə qarışdırın. Hər iki yarpaq səthinə çiləyin.',
      activeIngredient: 'Lambda-cyhalothrin 5% + Acetamiprid 20%',
      targetPest: 'Aphids, Whitefly, Thrips, Spider mite',
      crop: 'Cotton, Pepper, Eggplant, Peach',
      formulation: 'SC – Suspension Concentrate',
      unitSize: '1 L', unitSizeAz: '1 L',
      costPrice: 28.00,
      stock: 200,
      image: '🌾',
      tags: ['insecticide','cotton','vegetable','orchard'],
    },
    {
      id: 'cs-004', sku: 'CS-HRB-02',
      name: 'VitaSelekt Herbicide', nameAz: 'VitaSelekt Herbisid',
      category: 'Herbicide',
      description: 'Selective post-emergent herbicide for grass weed control in broadleaf crops. Low toxicity, rainfast within 1 hour.',
      descriptionAz: 'Genişyarpaqlı bitkilərdə otların post-emergent nəzarəti üçün seçici herbisid. 1 saatda yağışa davamlı.',
      usage: 'Apply 1–1.5 L/ha. Use when weeds are at 2–4 leaf stage. Do not mix with other herbicides.',
      usageAz: '1–1.5 L/ha tətbiq edin. Alaq otları 2–4 yarpaqlı mərhələdə olduqda istifadə edin.',
      activeIngredient: 'Quizalofop-P-ethyl 10%',
      targetPest: 'Annual and perennial grasses',
      crop: 'Sunflower, Sugar beet, Vegetables',
      formulation: 'EC – Emulsifiable Concentrate',
      unitSize: '5 L', unitSizeAz: '5 L',
      costPrice: 35.00,
      stock: 60,
      image: '🌻',
      tags: ['herbicide','sunflower','beet','vegetable'],
    },
    {
      id: 'cs-005', sku: 'CS-FNG-02',
      name: 'CerraCop Copper Fungicide', nameAz: 'CerraCop Mis Fungisid',
      category: 'Fungicide',
      description: 'Copper-based preventive fungicide and bactericide. Suitable for organic farming. Long-lasting protective film on plant surface.',
      descriptionAz: 'Misli profilaktik fungisid və bakterisid. Üzvi əkinçilik üçün uyğundur. Uzunmüddətli qoruyucu film.',
      usage: 'Mix 300–500 g per 100 L water. Apply before infection period or after rain. Max 6 applications.',
      usageAz: '100 L suya 300–500 q qarışdırın. İnfeksiya dövründən əvvəl və ya yağışdan sonra tətbiq edin.',
      activeIngredient: 'Copper hydroxide 77%',
      targetPest: 'Bacterial diseases, Downy mildew, Late blight',
      crop: 'Potato, Tomato, Grape, Citrus',
      formulation: 'WP – Wettable Powder',
      unitSize: '1 kg', unitSizeAz: '1 kq',
      costPrice: 18.00,
      stock: 150,
      image: '🥔',
      tags: ['fungicide','potato','tomato','grape'],
    },
    {
      id: 'cs-006', sku: 'CS-INS-02',
      name: 'TerraForce Soil Insecticide', nameAz: 'TerraForce Torpaq İnsektisidi',
      category: 'Insecticide',
      description: 'Granular soil insecticide for control of soil-dwelling pests. Long-lasting protection applied at planting time.',
      descriptionAz: 'Torpaqda yaşayan zərərvericilərin nəzarəti üçün qranullu torpaq insektisidi. Əkin zamanı tətbiq edilir.',
      usage: 'Apply 10–15 kg/ha incorporated into soil before or during planting. Do not apply to waterways.',
      usageAz: 'Əkindən əvvəl və ya zamanı torpağa 10–15 kq/ha tətbiq edin.',
      activeIngredient: 'Chlorpyrifos 5%',
      targetPest: 'Wireworm, Cutworm, Root maggot',
      crop: 'Corn, Potato, Sugarbeet',
      formulation: 'GR – Granule',
      unitSize: '10 kg', unitSizeAz: '10 kq',
      costPrice: 24.00,
      stock: 75,
      image: '🌱',
      tags: ['insecticide','soil','corn','potato'],
    },
    {
      id: 'cs-007', sku: 'CS-BGF-01',
      name: 'VitaGrow Biofungicide', nameAz: 'VitaGrow Biofungisid',
      category: 'Biofungicide',
      description: 'Biological fungicide based on Bacillus subtilis. Zero pre-harvest interval. Safe for bees and beneficial insects.',
      descriptionAz: 'Bacillus subtilis əsaslı bioloji fungisid. Sıfır məhsul yığım fasiləsi. Arılar üçün təhlükəsiz.',
      usage: 'Dilute 2–3 L/ha in sufficient water. Apply preventively every 7 days or after rain events.',
      usageAz: '2–3 L/ha lazımi suda durulaşdırın. Hər 7 gündən bir profilaktik tətbiq edin.',
      activeIngredient: 'Bacillus subtilis QST 713 – 1.34%',
      targetPest: 'Powdery mildew, Botrytis, Pythium',
      crop: 'Strawberry, Vegetables, Herbs',
      formulation: 'SC – Suspension Concentrate',
      unitSize: '5 L', unitSizeAz: '5 L',
      costPrice: 55.00,
      stock: 40,
      image: '🍓',
      tags: ['biofungicide','strawberry','vegetable','organic'],
    },
    {
      id: 'cs-008', sku: 'CS-NPK-01',
      name: 'CerradoFol Foliar Fertilizer', nameAz: 'CerradoFol Yarpaq Gübrəsi',
      category: 'Fertilizer',
      description: 'Complete NPK foliar fertilizer enriched with micronutrients Zn, B, Mn. Boosts growth during critical crop stages.',
      descriptionAz: 'Zn, B, Mn mikroelementləri ilə zənginləşdirilmiş tam NPK yarpaq gübrəsi.',
      usage: 'Apply 3–5 L/ha. Can be mixed with most pesticides. Apply during vegetative and flowering stages.',
      usageAz: '3–5 L/ha tətbiq edin. Çoxu pestisidlərlə qarışdırıla bilər. Vegetasiya və çiçəklənmə mərhələsində tətbiq edin.',
      activeIngredient: 'NPK 8-6-6 + Zn 0.5% + B 0.2% + Mn 0.3%',
      targetPest: 'Nutrient deficiency',
      crop: 'All crops',
      formulation: 'SL – Soluble Liquid',
      unitSize: '10 L', unitSizeAz: '10 L',
      costPrice: 32.00,
      stock: 180,
      image: '🌿',
      tags: ['fertilizer','allcrops','nutrition'],
    },
  ];

  function load(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  }

  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function init() {
    if (!load(KEYS.products, null)) save(KEYS.products, SAMPLE_PRODUCTS);
    if (!load(KEYS.sales, null))    save(KEYS.sales, []);
    if (!load(KEYS.markup, null))   save(KEYS.markup, 30);
    if (!load(KEYS.adminPass, null)) save(KEYS.adminPass, 'admin2025');
    if (!load(KEYS.salesPass, null)) save(KEYS.salesPass, 'sales2025');
  }

  function getProducts()              { return load(KEYS.products, []); }
  function saveProducts(arr)          { save(KEYS.products, arr); }
  function getSales()                 { return load(KEYS.sales, []); }
  function saveSales(arr)             { save(KEYS.sales, arr); }
  function getMarkup()                { return load(KEYS.markup, 30); }
  function saveMarkup(n)              { save(KEYS.markup, n); }
  function getAdminPass()             { return load(KEYS.adminPass, 'admin2025'); }
  function getSalesPass()             { return load(KEYS.salesPass, 'sales2025'); }
  function saveAdminPass(p)           { save(KEYS.adminPass, p); }
  function saveSalesPass(p)           { save(KEYS.salesPass, p); }

  function salePrice(costPrice) {
    return +(costPrice * (1 + getMarkup() / 100)).toFixed(2);
  }

  function addProduct(p) {
    const prods = getProducts();
    prods.push(p);
    saveProducts(prods);
  }

  function updateProduct(id, updates) {
    const prods = getProducts().map(p => p.id === id ? { ...p, ...updates } : p);
    saveProducts(prods);
  }

  function deleteProduct(id) {
    saveProducts(getProducts().filter(p => p.id !== id));
  }

  function recordSale(saleObj) {
    const sales = getSales();
    sales.unshift({ ...saleObj, id: 'sale-' + Date.now(), date: new Date().toISOString() });
    saveSales(sales);
    // deduct stock
    updateProduct(saleObj.productId, {
      stock: Math.max(0, (getProducts().find(p => p.id === saleObj.productId)?.stock || 0) - saleObj.qty)
    });
  }

  function importFromExcel(rows) {
    // rows: [{name, sku, category, costPrice, stock, unitSize}]
    const existing = getProducts();
    rows.forEach(r => {
      const match = existing.find(p => p.sku === r.sku || p.name === r.name);
      if (match) {
        Object.assign(match, r);
      } else {
        existing.push({
          id: 'imp-' + Date.now() + '-' + Math.random().toString(36).slice(2),
          name: r.name || 'Unnamed',
          nameAz: r.nameAz || r.name || '',
          sku: r.sku || '',
          category: r.category || 'Other',
          description: r.description || '',
          descriptionAz: r.descriptionAz || '',
          usage: r.usage || '',
          usageAz: r.usageAz || '',
          activeIngredient: r.activeIngredient || '',
          targetPest: r.targetPest || '',
          crop: r.crop || '',
          formulation: r.formulation || '',
          unitSize: r.unitSize || '',
          unitSizeAz: r.unitSizeAz || r.unitSize || '',
          costPrice: +r.costPrice || 0,
          stock: +r.stock || 0,
          image: r.image || '🌿',
          tags: r.tags || [],
        });
      }
    });
    saveProducts(existing);
  }

  init();

  return {
    getProducts, saveProducts, getSales, saveSales,
    getMarkup, saveMarkup, getAdminPass, getSalesPass,
    saveAdminPass, saveSalesPass,
    salePrice, addProduct, updateProduct, deleteProduct,
    recordSale, importFromExcel, CATEGORIES: ['All','Herbicide','Fungicide','Insecticide','Biofungicide','Fertilizer','Other']
  };
})();
