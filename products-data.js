// Vita Terra – Cerrado Sol Product Database
// This file is loaded by all pages. Prices are ADMIN ONLY.

const PRODUCTS_DATA = [
  { id: 1,  tradeName: "Paclobutrazol 250 SC",  activeIngredient: "Paclobutrazol 250 g/l SC",                              packaging: "1 l",                          quantity: 1000,  costUsd: 6.74  },
  { id: 2,  tradeName: "Ramon SL",               activeIngredient: "1-Naphthylacetic acid (NAA) 10 g/l SL",                 packaging: "1 l",                          quantity: 1000,  costUsd: 3.92  },
  { id: 3,  tradeName: "Lancet SL",              activeIngredient: "6-benzylaminopurine (6-BA) 19 g/l SL",                  packaging: "1 l",                          quantity: 3000,  costUsd: 6.14  },
  { id: 4,  tradeName: "Odysseus 480 SC",        activeIngredient: "Thiacloprid 480 g/l SC",                                packaging: "1 l",                          quantity: 1000,  costUsd: 34.06 },
  { id: 5,  tradeName: "Razor 280 SC",           activeIngredient: "Imidacloprid 200 g/l + Lambda-Cyhalothrin 80 g/l SC",   packaging: "1 l",                          quantity: 1000,  costUsd: 9.34  },
  { id: 6,  tradeName: "Inclinar 100 WG",        activeIngredient: "Emamectin benzoate 100 g/kg WDG",                       packaging: "500 g, alu bag ×20, pallets",  quantity: 1000,  costUsd: 23.00 },
  { id: 7,  tradeName: "Baiar 550 SC",           activeIngredient: "Difenoconazole 200 g/l + Thiamethoxam 350 g/l SC",      packaging: "1 l",                          quantity: 1000,  costUsd: 21.00 },
  { id: 8,  tradeName: "Tocar 247 SC",           activeIngredient: "Thiamethoxam 141 g/l + Lambda Cyhalothrin 106 g/l SC",  packaging: "1 l",                          quantity: 1000,  costUsd: 9.54  },
  { id: 9,  tradeName: "Predador 220 EC",        activeIngredient: "Tebuconazole 125 g/l + Triadiminol 100 g/l SC",         packaging: "1 l",                          quantity: 2000,  costUsd: 12.56 },
  { id: 10, tradeName: "Divisar 750 WG",         activeIngredient: "Cyprodinil 750 g/kg WDG",                               packaging: "500 g, alu bag ×20, pallets",  quantity: 500,   costUsd: 38.08 },
  { id: 11, tradeName: "Coger 100 EC",           activeIngredient: "Pyriproxyfen 10% EC",                                   packaging: "1 l",                          quantity: 500,   costUsd: 6.25  },
  { id: 12, tradeName: "Pyrat 800 WG",           activeIngredient: "Captan 800 g/kg WG",                                    packaging: "10 kg",                        quantity: 10000, costUsd: 7.50  },
  { id: 13, tradeName: "Atrapar 50 WG",          activeIngredient: "Abamectin 50 g/kg WDG",                                 packaging: "500 g bottle, 5 kg",           quantity: 700,   costUsd: 18.65 },
  { id: 14, tradeName: "Copiar 800 WP",          activeIngredient: "Mancozeb 800 g/kg WP",                                  packaging: "5 kg",                         quantity: 10000, costUsd: 6.00  },
  { id: 15, tradeName: "Guarura 800 WG",         activeIngredient: "Thiram 80% WG",                                         packaging: "1 kg",                         quantity: 6000,  costUsd: 7.38  },
  { id: 16, tradeName: "Afrontar 250 ME",        activeIngredient: "Bupirimate 250 g/l ME",                                 packaging: "1 l",                          quantity: 1000,  costUsd: 30.00 },
  { id: 17, tradeName: "Curar 250 EC",           activeIngredient: "Cypermethrin 250 g/l EC",                               packaging: "1 l",                          quantity: 500,   costUsd: 6.82  },
  { id: 18, tradeName: "Tratar 700 WG",          activeIngredient: "Dithianon 700 g/kg WDG",                                packaging: "1 kg, alu bag ×20, pallets",   quantity: 3000,  costUsd: 43.50 },
  { id: 19, tradeName: "Mandriguera 100 CS",     activeIngredient: "Lambda-cyhalothrin 100 g/l CS",                         packaging: "1 l",                          quantity: 500,   costUsd: 11.91 },
  { id: 20, tradeName: "Silex 500 WG",           activeIngredient: "Kresoxim-methyl 500 g/kg WG",                           packaging: "500 g, bottle ×10, pallets",   quantity: 700,   costUsd: 26.00 },
  { id: 21, tradeName: "Ajustar 200 WP",         activeIngredient: "Pyridaben 200 g/kg WP",                                 packaging: "1 kg",                         quantity: 500,   costUsd: 8.64  },
  { id: 22, tradeName: "Estrellar 100 EC",       activeIngredient: "Penconazole 100 g/L EC",                                packaging: "1 l",                          quantity: 700,   costUsd: 13.08 },
  { id: 23, tradeName: "Curador 200 SC",         activeIngredient: "Chlorantraniliprole 200 g/l SC",                        packaging: "1 l",                          quantity: 500,   costUsd: 28.00 },
  { id: 24, tradeName: "Lamar 500 WG",           activeIngredient: "Pirimicarb 500 g/kg WG",                                packaging: "500 g, alu bag ×20, pallets",  quantity: 1000,  costUsd: 29.38 },
  { id: 25, tradeName: "Lamada 700 WP",          activeIngredient: "Thiophanate methyl 700 g/kg WP",                        packaging: "1 kg",                         quantity: 3000,  costUsd: 8.87  },
  { id: 26, tradeName: "Tono 400 SC",            activeIngredient: "Dodine 400 g/l SC",                                     packaging: "1 l",                          quantity: 4000,  costUsd: 12.06 },
  { id: 27, tradeName: "Coronilla 800 WG",       activeIngredient: "Fosetyl aluminium 800 g/kg WG",                         packaging: "5 kg",                         quantity: 4000,  costUsd: 9.85  },
  { id: 28, tradeName: "Argola 250 EC",          activeIngredient: "Deltamethrin 25 g/l EC",                                packaging: "1 l",                          quantity: 500,   costUsd: 6.71  },
  { id: 29, tradeName: "Alianza 760 WG",         activeIngredient: "Ziram 76% WG",                                          packaging: "1 kg",                         quantity: 4000,  costUsd: 8.38  },
  { id: 30, tradeName: "Hornillo 500 WG",        activeIngredient: "Trifloxystrobin 500 g/kg WG",                           packaging: "1 kg",                         quantity: 500,   costUsd: 28.00 },
  { id: 31, tradeName: "Anillito 200 SP",        activeIngredient: "Acetamiprid 200 g/kg SP",                               packaging: "500 g, alu bag ×20, pallets",  quantity: 500,   costUsd: 7.54  },
  { id: 32, tradeName: "Corro 240 SC",           activeIngredient: "Spirodiclofen 240 g/L SC",                              packaging: "1 l",                          quantity: 1000,  costUsd: 14.62 },
  { id: 33, tradeName: "Zumbar 100 SC",          activeIngredient: "Spirotetramat 100 g/l SC",                              packaging: "1 l",                          quantity: 1500,  costUsd: 22.00 },
  { id: 34, tradeName: "Camarilla 380 WG",       activeIngredient: "Boscalid 252 g/kg + Pyraclostrobin 128 g/kg WG",       packaging: "1 kg",                         quantity: 500,   costUsd: 34.09 },
  { id: 35, tradeName: "Cercado 625 WG",         activeIngredient: "Cyprodinil 375 g/kg + Fludioxonil 250 g/kg WG",        packaging: "500 g, alu bag ×20, pallets",  quantity: 1000,  costUsd: 59.89 },
  { id: 36, tradeName: "Lumbre 250 EC",          activeIngredient: "Difenoconazole 250 g/l EC",                            packaging: "1 l",                          quantity: 700,   costUsd: 10.93 },
  { id: 37, tradeName: "Sonos 300 SC",           activeIngredient: "Pyrimethanil 300 g/l SC",                              packaging: "1 l",                          quantity: 700,   costUsd: 8.10  },
  { id: 38, tradeName: "Arco 250 EC",            activeIngredient: "Tebuconazole 250 g/l EC",                              packaging: "1 l",                          quantity: 700,   costUsd: 9.02  },
  { id: 39, tradeName: "Acarus 240 SC",          activeIngredient: "Bifenazate 240 g/l SC",                                packaging: "1 l",                          quantity: 1000,  costUsd: 16.92 },
  { id: 40, tradeName: "Detectar 200 EC",        activeIngredient: "Bifenthrin 20% EC",                                    packaging: "1 l",                          quantity: 500,   costUsd: 16.71 },
  { id: 41, tradeName: "Cosido 480 SC",          activeIngredient: "Diflubenzuron 480 g/l SC",                             packaging: "1 l",                          quantity: 700,   costUsd: 17.03 },
  { id: 42, tradeName: "Tapiar EC",              activeIngredient: "Hexythiazox 50 g/l EC",                                packaging: "1 l",                          quantity: 1000,  costUsd: 13.91 },
  { id: 43, tradeName: "Amurallar 110 SC",       activeIngredient: "Etoxazole 110 g/l SC",                                 packaging: "1 l",                          quantity: 1000,  costUsd: 13.63 },
  { id: 44, tradeName: "Corriente 480 SC",       activeIngredient: "Spinosad 480 g/l SC",                                  packaging: "0.5 L bottle",                 quantity: 700,   costUsd: 195.00},
  { id: 45, tradeName: "Parador 240 SC",         activeIngredient: "Spirodiclofen 222 g/l + Abamectin 18 g/l SC",          packaging: "1 l",                          quantity: 1000,  costUsd: 16.51 },
  { id: 46, tradeName: "Zilar 250 SC",           activeIngredient: "Paclobutrazol 250 g/l SC",                             packaging: "1 l",                          quantity: 1000,  costUsd: 6.74  },
  { id: 47, tradeName: "Clorpirifos 550 EC",     activeIngredient: "Chlorpyrifos 500 g/l + Cypermethrin 50 g/l EC",        packaging: "1 l",                          quantity: 1000,  costUsd: 12.31 },
];

// Product categories for filtering
const PRODUCT_CATEGORIES = {
  insecticide: [4, 5, 6, 8, 11, 17, 19, 31, 40, 44, 47],
  fungicide:   [3, 9, 10, 12, 14, 15, 16, 18, 20, 22, 25, 26, 27, 29, 30, 34, 35, 36, 37, 38, 42, 43],
  acaricide:   [13, 21, 32, 39, 41, 45],
  herbicide:   [],
  growthReg:   [1, 2, 46],
  combo:       [7, 24, 33],
};

// Usage guides per product type
const USAGE_GUIDES = {
  insecticide: { rate: "0.5–1.5 L/ha", interval: "7–14 days", ppe: "Full PPE required", phi: "7–21 days" },
  fungicide:   { rate: "0.5–2 kg or L/ha", interval: "10–21 days", ppe: "Gloves & mask", phi: "7–14 days" },
  acaricide:   { rate: "0.5–1 L/ha", interval: "14–21 days", ppe: "Gloves & mask", phi: "7–14 days" },
  growthReg:   { rate: "0.25–1 L/ha", interval: "As needed", ppe: "Gloves", phi: "3–7 days" },
  combo:       { rate: "0.5–1.5 L/ha", interval: "10–14 days", ppe: "Full PPE required", phi: "14–21 days" },
};

if (typeof module !== 'undefined') module.exports = { PRODUCTS_DATA, PRODUCT_CATEGORIES, USAGE_GUIDES };
