// ========================================
// FIX: Prevent "Invalid or unexpected token" issues
// ========================================

// Polyfill CSS.escape (para navegadores que no lo soportan)
if (typeof window.CSS === 'undefined') window.CSS = {};
if (typeof window.CSS.escape !== 'function') {
    window.CSS.escape = function (value) {
        return String(value).replace(/[^a-zA-Z0-9_\u00A0-\uFFFF-]/g, '\\$&');
    };
}

// ========================================
// i18n (ES/EN)
// ========================================

const i18n = {
    es: {
        appTitle: 'Blackwood Resource Map',
        appSubtitle: 'Guía interactiva de materiales y ubicaciones',
        myWarehouseButton: 'WAREHOUSE',
        myWarehouseTitle: 'WAREHOUSE',
        clearAll: 'Vaciar Todo',
        export: 'Exportar',
        warehouseSearch: '🔍 Buscar en almacén...',
        emptyWarehouse: 'Tu almacén está vacío.  Haz click en los recursos de las ubicaciones para añadirlos.',
        mapSearch: '🔍 Buscar recurso o ubicación...',
        mapTitle: 'Mapa de Blackwood',
        filterAll: 'Todos',
        filterRare: 'Raros',
        filterConsumables: 'Consumibles',
        filterMissing: 'Faltantes',
        filterOwned: 'En Almacén',
        confirmClear: '¿Estás seguro de que quieres vaciar todo el almacén?',
        consoleTitle: '✅ Atlas Blackwood Resource Map',
        consoleLocationsLoaded: (n) => `📍 ${n} ubicaciones cargadas`,
        consoleResourcesTotal: (n) => `📦 ${n} recursos totales`,
        consoleWarehouseCount: (n) => `🏪 ${n} recursos en almacén`,
        consoleAdded: (name) => `✅ ${name} añadido al almacén`,
        consoleRemoved: (name) => `❌ ${name} eliminado del almacén`,
        consoleCleared: '🗑️ Almacén vaciado',
        consoleExported: '📥 Warehouse exportado',
        iconsMissing: '⚠️ Iconos que no cargaron: ',
        iconsOk: '✅ Todos los iconos cargaron correctamente'
    },
    en: {
        appTitle: 'Blackwood Resource Map',
        appSubtitle: 'Interactive guide to materials and locations',
        myWarehouseButton: 'WAREHOUSE',
        myWarehouseTitle: 'WAREHOUSE',
        clearAll: 'Clear All',
        export: 'Export',
        warehouseSearch: '🔍 Search in warehouse...',
        emptyWarehouse: 'Your warehouse is empty. Click resources in locations to add them.',
        mapSearch: '🔍 Search resource or location...',
        mapTitle: 'Blackwood Map',
        filterAll: 'All',
        filterRare: 'Rare',
        filterConsumables: 'Consumables',
        filterMissing: 'Missing',
        filterOwned: 'In Warehouse',
        confirmClear: 'Are you sure you want to clear the entire warehouse?',
        consoleTitle: '✅ Atlas Blackwood Resource Map',
        consoleLocationsLoaded: (n) => `📍 ${n} locations loaded`,
        consoleResourcesTotal: (n) => `📦 ${n} total resources`,
        consoleWarehouseCount: (n) => `🏪 ${n} resources in warehouse`,
        consoleAdded: (name) => `✅ ${name} added to warehouse`,
        consoleRemoved: (name) => `❌ ${name} removed from warehouse`,
        consoleCleared: '🗑️ Warehouse cleared',
        consoleExported: '📥 Warehouse exported',
        iconsMissing: '⚠️ Icons that failed to load: ',
        iconsOk: '✅ All icons loaded correctly'
    }
};

function getLang() {
    return localStorage.getItem('atlasLang') || 'es';
}

function setLang(lang) {
    localStorage.setItem('atlasLang', lang);
    applyI18n();
}

function t(key, ...args) {
    const lang = getLang();
    const val = (i18n[lang] && i18n[lang][key]) ?? i18n.es[key] ?? key;
    return typeof val === 'function' ? val(...args) : val;
}

function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.setAttribute('placeholder', t(key));
    });

    document.querySelectorAll('.lang-btn').forEach(btn => {
        const isActive = btn.getAttribute('data-lang') === getLang();
        btn.classList.toggle('active', isActive);
    });

    updateWarehouseUI();
}

// ========================================
// Normalization (search)
// ========================================

function normalizeText(s) {
    return (s || '')
        .toString()
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// ========================================
// Aliases ES -> canonical (data-resource OR location titles)
// ========================================

const resourceAliases = (() => {
    const map = {
        // Metals
        "cobre": "Copper",
        "hierro": "Iron",
        "estaño": "Tin",
        "plata": "Silver",
        "cobalto": "Cobalt",
        "iridio": "Iridium",

        // Gems / crystals
        "rubi": "Ruby",
        "rubí": "Ruby",
        "amatista": "Amethyst",
        "esmeralda": "Emerald",
        "diamante": "Diamond",
        "cristal": "Crystal",
        "cuarzo": "Quartz",

        // Stone / terrain
        "piedra caliza": "Limestone",
        "caliza": "Limestone",
        "pizarra": "Slate",
        "granito": "Granite",
        "arenisca": "Sandstone",
        "basalto": "Basalt",
        "obsidiana": "Obsidian",
        "arena": "Sand",
        "sal": "Salt",

        // Pedernal / carbón / hielo
        "pedernal": "Flint",
        "silex": "Flint",
        "sílex": "Flint",
        "carbon": "Coal",
        "carbón": "Coal",
        "hielo": "Ice",
        "lodo": "Mud",
        "barro": "Mud",

        // Chemicals / fluids
        "azufre": "Sulfur",
        "nitrato": "Nitrate",
        "petroleo": "Oil",
        "petróleo": "Oil",
        "aceite": "Oil",

        // Woods
        "madera envejecida": "Agedwood",
        "madera vieja": "Agedwood",
        "madera blanda": "Softwood",
        "madera fresca": "Freshwood",
        "pino": "Pine",
        "abeto": "Fir",
        "cedro": "Cedar",
        "madera de palma": "Palm Wood",
        "palma": "Palm Wood",
        "mangle": "Mangrove",
        "alamo": "Poplar",
        "álamo": "Poplar",
        "bambu": "Bamboo",
        "bambú": "Bamboo",
        "madera oscura": "Darkwood",
        "roble": "Oak",
        "fresno": "Ash",
        "madera dura": "Hardwood",
        "hierromadera": "Ironwood",

        // Thatch / fibers
        "raices": "Roots",
        "raíces": "Roots",
        "juncos": "Reeds",
        "junco": "Reeds",
        "paja": "Straw",
        "frondas": "Fronds",
        "yute": "Jute",
        "cáñamo": "Hemp",
        "canamo": "Hemp",
        "algodon": "Cotton",
        "algodón": "Cotton",
        "lino": "Flax",
        "seda": "Silk",
        "liana": "Liana",
        "paja de bambu": "Bamboo Thatch",
        "paja de bambú": "Bamboo Thatch",
        "fibra de bambu": "Bamboo Fiber",
        "fibra de bambú": "Bamboo Fiber",

        // Food / consumables
        "miel": "Honey",
        "trigo": "Wheat",
        "frijoles": "Beans",
        "judias": "Beans",
        "judías": "Beans",
        "maiz": "Maize",
        "maíz": "Maize",
        "arroz": "Rice",
        "arroz silvestre": "Wild Rice",
        "verduras": "Vegetables",
        "vegetales": "Vegetables",
        "bayas": "Berries",
        "cana de azucar": "Sugar Cane",
        "caña de azucar": "Sugar Cane",
        "te": "Tea",
        "té": "Tea",
        "aloe": "Aloe",
        "chile": "Chili",
        "aji": "Chili",
        "ají": "Chili",
        "bananas": "Bananas",
        "bananos": "Bananas",
        "banana": "Bananas",
        "cocos": "Coconuts",
        "coco": "Coconuts",

        // Organic / animals / sea
        "piel fuerte": "Strong Skin",
        "piel resistente": "Strong Skin",
        "cuero": "Leather",
        "queratina": "Keratin",
        "pasta organica": "Organic Paste",
        "pasta orgánica": "Organic Paste",
        "sangre vil": "Vile Blood",
        "savia de cactus": "Cactus Sap",
        "algas": "Seaweed",
        "sargazo": "Seaweed",
        "perlas": "Pearls",
        "perlas negras": "Black Pearls",
        "coral": "Coral",
        "conchas": "Shells",
        "caparazon de tortuga": "Tortoise Shell",
        "caparazón de tortuga": "Tortoise Shell",
        "piel pesada": "Heavy Hide",

        // Location aliases (match your H3 text)
        "freeport": "Blackwood Island (Freeport)",
        "blackwood island": "Blackwood Island (Freeport)",
        "maidwick": "Maidwick Island",
        "maidwick island": "Maidwick Island",
        "stafcook": "Stafcook Gully",
        "stafcook gully": "Stafcook Gully",
        "irriling": "Irriling Holm",
        "irriling holm": "Irriling Holm",
        "skullclap": "Skullclap Island",
        "skullclap island": "Skullclap Island",
        "kings arena": "King's Arena",
        "king's arena": "King's Arena",
        "boss island": "King's Arena",
        "leery": "Leery Island",
        "leery island": "Leery Island",
        "farnquet": "Farnquet Peninsula",
        "farnquet peninsula": "Farnquet Peninsula",
        "golnora": "Golnora Refuge",
        "golnora refuge": "Golnora Refuge",
        "forbidden reach": "The Forbidden Reach",
        "the forbidden reach": "The Forbidden Reach",
        "powerstone": "The Forbidden Reach",
        "powerstone island": "The Forbidden Reach",
        "shrewberry": "Shrewberry Isle",
        "shrewberry isle": "Shrewberry Isle",
        "mermaid city": "Mermaid City",
        "sirenas": "Mermaid City",
        "underworld": "The Underworld",
        "cueva": "The Underworld"
    };

    const normalized = {};
    Object.keys(map).forEach(k => {
        normalized[normalizeText(k)] = map[k];
    });
    return normalized;
})();

function getSearchVariants(termRaw) {
    const termNorm = normalizeText(termRaw);
    if (!termNorm) return [];

    const variants = new Set([termNorm]);
    const aliasTo = resourceAliases[termNorm];
    if (aliasTo) variants.add(normalizeText(aliasTo));
    return Array.from(variants);
}

// ========================================
// Warehouse
// ========================================

let warehouse = JSON.parse(localStorage.getItem('atlasWarehouse')) || [];

function saveWarehouse() {
    localStorage.setItem('atlasWarehouse', JSON.stringify(warehouse));
    updateWarehouseUI();
    updateResourceColors();
}

function updateWarehouseUI() {
    const warehouseList = document.getElementById('warehouseList');
    const warehouseCount = document.getElementById('warehouseCount');
    if (!warehouseList || !warehouseCount) return;

    warehouseCount.textContent = warehouse.length;

    if (warehouse.length === 0) {
        warehouseList.innerHTML = `<p class="empty-message">${t('emptyWarehouse')}</p>`;
        return;
    }

    const sortedWarehouse = [...warehouse].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    warehouseList.innerHTML = sortedWarehouse.map(resource => {
        const resourceElement = document.querySelector(`.resource[data-resource="${CSS.escape(resource)}"]`);
        const iconSrc = resourceElement ? resourceElement.querySelector('.resource-icon')?.src : '';

        const safeResourceJs = String(resource).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
        return `
            <div class="warehouse-item" data-resource="${resource}">
                <div class="warehouse-item-content">
                    ${iconSrc ? `<img src="${iconSrc}" class="resource-icon">` : ''}
                    <span class="warehouse-item-name">${resource}</span>
                </div>
                <button class="remove-btn" onclick="removeFromWarehouse('${safeResourceJs}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }).join('');
}

function addToWarehouse(resourceName) {
    if (!warehouse.includes(resourceName)) {
        warehouse.push(resourceName);
        saveWarehouse();
        console.log(t('consoleAdded', resourceName));
    }
}

function removeFromWarehouse(resourceName) {
    warehouse = warehouse.filter(r => r !== resourceName);
    saveWarehouse();
    console.log(t('consoleRemoved', resourceName));
}

function toggleWarehouse(resourceName) {
    if (warehouse.includes(resourceName)) removeFromWarehouse(resourceName);
    else addToWarehouse(resourceName);
}

function updateResourceColors() {
    document.querySelectorAll('.resource[data-resource]').forEach(resource => {
        const resourceName = resource.getAttribute('data-resource');
        resource.classList.remove('in-warehouse', 'not-in-warehouse');
        resource.classList.add(warehouse.includes(resourceName) ? 'in-warehouse' : 'not-in-warehouse');
    });
}

// ========================================
// UI bindings (safe)
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang')));
    });

    // Warehouse panel buttons
    const warehouseToggle = document.getElementById('warehouseToggle');
    const warehousePanel = document.getElementById('warehousePanel');
    const closeWarehouse = document.getElementById('closeWarehouse');
    const overlay = document.getElementById('overlay');
    const clearWarehouse = document.getElementById('clearWarehouse');
    const exportWarehouse = document.getElementById('exportWarehouse');
    const warehouseSearch = document.getElementById('warehouseSearch');

    if (warehouseToggle && warehousePanel && overlay) {
        warehouseToggle.addEventListener('click', () => {
            warehousePanel.classList.add('active');
            overlay.classList.add('active');
        });

        overlay.addEventListener('click', () => {
            warehousePanel.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    if (closeWarehouse && warehousePanel && overlay) {
        closeWarehouse.addEventListener('click', () => {
            warehousePanel.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    if (clearWarehouse) {
        clearWarehouse.addEventListener('click', () => {
            if (confirm(t('confirmClear'))) {
                warehouse = [];
                saveWarehouse();
                console.log(t('consoleCleared'));
            }
        });
    }

    if (exportWarehouse) {
        exportWarehouse.addEventListener('click', () => {
            const data = JSON.stringify(warehouse, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'atlas-warehouse.json';
            a.click();
            console.log(t('consoleExported'));
        });
    }

    if (warehouseSearch) {
        warehouseSearch.addEventListener('input', function () {
            const searchTerm = normalizeText(this.value);
            document.querySelectorAll('.warehouse-item').forEach(item => {
                const text = normalizeText(item.textContent);
                item.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }

    // Map search
    const searchBox = document.getElementById('searchBox');
    if (searchBox) {
        searchBox.addEventListener('input', function () {
            applyMapSearchFilter(this.value);
        });
    }

    // Delegated click for resources (works always)
    document.addEventListener('click', (e) => {
        const resourceEl = e.target.closest('.resource[data-resource]');
        if (!resourceEl) return;
        toggleWarehouse(resourceEl.getAttribute('data-resource'));
    });

    // Initial render
    applyI18n();
    updateWarehouseUI();
    updateResourceColors();

    // Console
    const locationCardsCount = document.querySelectorAll('.location-card').length;
    const resourcesCount = document.querySelectorAll('.resource[data-resource]').length;

    console.log(`%c${t('consoleTitle')}`, 'color: #f39c12; font-size: 20px; font-weight: bold;');
    console.log(t('consoleLocationsLoaded', locationCardsCount));
    console.log(t('consoleResourcesTotal', resourcesCount));
    console.log(t('consoleWarehouseCount', warehouse.length));
});

// ========================================
// Map search filter
// ========================================

function applyMapSearchFilter(termRaw) {
    const variants = getSearchVariants(termRaw);
    const cards = Array.from(document.querySelectorAll('.location-card'));

    if (variants.length === 0) {
        cards.forEach(card => {
            card.style.display = '';
            card.querySelectorAll('.resource').forEach(r => r.classList.remove('hidden'));
        });
        return;
    }

    cards.forEach(card => {
        const locationNameEl = card.querySelector('.location-header h3');
        const locationName = normalizeText(locationNameEl ? locationNameEl.textContent : '');

        const resources = Array.from(card.querySelectorAll('.resource'));
        const matchingResources = resources.filter(r => {
            const resourceAttr = normalizeText(r.getAttribute('data-resource'));
            const resourceText = normalizeText(r.textContent);
            return variants.some(v => resourceAttr.includes(v) || resourceText.includes(v));
        });

        if (variants.some(v => locationName.includes(v))) {
            card.style.display = '';
            resources.forEach(r => r.classList.remove('hidden'));
            return;
        }

        if (matchingResources.length > 0) {
            card.style.display = '';
            resources.forEach(r => r.classList.add('hidden'));
            matchingResources.forEach(r => r.classList.remove('hidden'));
            return;
        }

        card.style.display = 'none';
    });
}

// ========================================
// Icon check
// ========================================

window.addEventListener('load', function () {
    const icons = document.querySelectorAll('.resource-icon');
    const missing = [];

    icons.forEach(img => {
        if (!img.complete || img.naturalHeight === 0) {
            missing.push(img.src.split('/').pop());
        }
    });

    if (missing.length > 0) {
        console.warn(t('iconsMissing'));
        console.table([...new Set(missing)].sort());
    } else {
        console.log(t('iconsOk'));
    }
});