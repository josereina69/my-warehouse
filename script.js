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
    const val = i18n[lang]?.[key] ?? i18n.es[key] ?? key;
    return typeof val === 'function' ? val(...args) : val;
}

function applyI18n() {
    // Text nodes
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });

    // Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.setAttribute('placeholder', t(key));
    });

    // Botones ES/EN active
    document.querySelectorAll('.lang-btn').forEach(btn => {
        const isActive = btn.getAttribute('data-lang') === getLang();
        btn.classList.toggle('active', isActive);
    });

    // Re-render UI que depende de strings (mensaje empty)
    updateWarehouseUI();
}

// Bind idioma
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang')));
    });
    applyI18n();
});

// ========================================
// WAREHOUSE SYSTEM
// ========================================

let warehouse = JSON.parse(localStorage.getItem('atlasWarehouse')) || [];

// Guardar warehouse en localStorage
function saveWarehouse() {
    localStorage.setItem('atlasWarehouse', JSON.stringify(warehouse));
    updateWarehouseUI();
    updateResourceColors();
}

// Actualizar UI del warehouse
function updateWarehouseUI() {
    const warehouseList = document.getElementById('warehouseList');
    const warehouseCount = document.getElementById('warehouseCount');

    warehouseCount.textContent = warehouse.length;

    if (warehouse.length === 0) {
        warehouseList.innerHTML = `<p class="empty-message">${t('emptyWarehouse')}</p>`;
        return;
    }

    // Ordenar alfabéticamente
    const sortedWarehouse = [...warehouse].sort();

    warehouseList.innerHTML = sortedWarehouse.map(resource => {
        const resourceElement = document.querySelector(`.resource[data-resource="${resource}"]`);
        const iconSrc = resourceElement ? resourceElement.querySelector('.resource-icon').src : '';

        return `
            <div class="warehouse-item" data-resource="${resource}">
                <div class="warehouse-item-content">
                    ${iconSrc ? `<img src="${iconSrc}" class="resource-icon">` : ''}
                    <span class="warehouse-item-name">${resource}</span>
                </div>
                <button class="remove-btn" onclick="removeFromWarehouse('${resource}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }).join('');
}

// Añadir al warehouse
function addToWarehouse(resourceName) {
    if (!warehouse.includes(resourceName)) {
        warehouse.push(resourceName);
        saveWarehouse();
        console.log(t('consoleAdded', resourceName));
    }
}

// Quitar del warehouse
function removeFromWarehouse(resourceName) {
    warehouse = warehouse.filter(r => r !== resourceName);
    saveWarehouse();
    console.log(t('consoleRemoved', resourceName));
}

// Toggle recurso en warehouse
function toggleWarehouse(resourceName) {
    if (warehouse.includes(resourceName)) {
        removeFromWarehouse(resourceName);
    } else {
        addToWarehouse(resourceName);
    }
}

// Actualizar colores de recursos
function updateResourceColors() {
    const allResources = document.querySelectorAll('.resource[data-resource]');

    allResources.forEach(resource => {
        const resourceName = resource.getAttribute('data-resource');

        // Quitar clases previas
        resource.classList.remove('in-warehouse', 'not-in-warehouse');

        // Añadir clase según estado
        if (warehouse.includes(resourceName)) {
            resource.classList.add('in-warehouse');
        } else {
            resource.classList.add('not-in-warehouse');
        }
    });
}

// ========================================
// PANEL WAREHOUSE
// ========================================

const warehouseToggle = document.getElementById('warehouseToggle');
const warehousePanel = document.getElementById('warehousePanel');
const closeWarehouse = document.getElementById('closeWarehouse');
const overlay = document.getElementById('overlay');
const clearWarehouse = document.getElementById('clearWarehouse');
const exportWarehouse = document.getElementById('exportWarehouse');

warehouseToggle.addEventListener('click', () => {
    warehousePanel.classList.add('active');
    overlay.classList.add('active');
});

closeWarehouse.addEventListener('click', () => {
    warehousePanel.classList.remove('active');
    overlay.classList.remove('active');
});

overlay.addEventListener('click', () => {
    warehousePanel.classList.remove('active');
    overlay.classList.remove('active');
});

// Vaciar warehouse
clearWarehouse.addEventListener('click', () => {
    if (confirm(t('confirmClear'))) {
        warehouse = [];
        saveWarehouse();
        console.log(t('consoleCleared'));
    }
});

// Exportar warehouse
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

// Búsqueda en warehouse
const warehouseSearch = document.getElementById('warehouseSearch');
warehouseSearch.addEventListener('input', function () {
    const searchTerm = this.value.toLowerCase();
    const items = document.querySelectorAll('.warehouse-item');

    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? '' : 'none';
    });
});

// ========================================
// NORMALIZACIÓN + ALIASES ES/EN PARA BÚSQUEDA
// ========================================

/**
 * Normaliza para búsqueda:
 * - minúsculas
 * - quita tildes/diacríticos (áéíóúüñ -> aeiouun)
 * - elimina puntuación y dobles espacios
 */
function normalizeText(s) {
    return (s || '')
        .toString()
        .trim()
        .toLowerCase()
        .normalize('NFD')                 // separa letra + diacrítico
        .replace(/[\u0300-\u036f]/g, '')  // elimina diacríticos
        .replace(/[^a-z0-9\s]/g, ' ')     // reemplaza puntuación por espacios
        .replace(/\s+/g, ' ')             // colapsa espacios
        .trim();
}

/**
 * Aliases ES -> nombre canónico (tal como está en data-resource).
 * Esto NO puede ser "todos" automáticamente si no defines las traducciones,
 * pero aquí tienes una base grande que puedes ampliar.
 *
 * CLAVE: en español (sin importar tildes; se normaliza)
 * VALOR: recurso canónico (lo de data-resource)
 */
const resourceAliases = (() => {
    const map = {
        // Metales y minerales
        "cobre": "Copper",
        "hierro": "Iron",
        "estaño": "Tin",
        "azufre": "Sulfur",
        "plata": "Silver",
        "iridio": "Iridium",
        "rubí": "Ruby",
        "rubi": "Ruby",
        "esmeralda": "Emerald",
        "amatista": "Amethyst",
        "calcedonia": "Chalcedony",
        "granito": "Granite",
        "marmol": "Marble",
        "mármol": "Marble",
        "pizarra": "Slate",
        "piedra caliza": "Limestone",
        "caliza": "Limestone",
        "arenisca": "Sandstone",
        "basalto": "Basalt",

        // Gemas / nombres propios (a veces se usan igual)
        "herkimer": "Herkimer",
        "radiolarita": "Radiolarite",

        // Maderas
        "madera vieja": "Agedwood",
        "madera envejecida": "Agedwood",
        "madera fuerte": "Strongwood",
        "madera resistente": "Strongwood",
        "madera ligera": "Lightwood",
        "madera humeda": "Wetwood",
        "madera húmeda": "Wetwood",
        "madera mojada": "Wetwood",
        "madera oscura": "Darkwood",
        "madera blanda": "Softwood",
        "ramas": "Twigs",

        // Fibras / plantas
        "yute": "Jute",
        "algodon": "Cotton",
        "algodón": "Cotton",
        "caña de azucar": "Sugar Cane",
        "cana de azucar": "Sugar Cane",
        "paja": "Straw",
        "junco": "Reeds",
        "juncos": "Reeds",
        "raices": "Roots",
        "raíces": "Roots",
        "frondas": "Fronds",
        "bambu": "Bamboo",
        "bambú": "Bamboo",
        "cáñamo": "Hemp",
        "canamo": "Hemp",

        // Animales (si los usas en ES)
        "hueso": "Bone",
        "piel": "Skin",
        "cuero": "Leather",
        "pelaje": "Fur",
        "lana": "Fleece",
        "caparazon": "Carapace",
        "caparazón": "Carapace",
        "escama": "Scale",
        "concha": "Shell",

        // Comida / consumibles
        "miel": "Honey",
        "oregano": "Oregano",
        "orégano": "Oregano",
        "jarabe": "Syrup",
        "arroz": "Rice",
        "maiz": "Maize",
        "maíz": "Maize",
        "patata": "Potato",
        "papa": "Potato",
        "zanahoria": "Wild Carrot",
        "zanahoria silvestre": "Wild Carrot",
        "tomillo": "Thyme",
        "fresa": "Strawberry",

        // Otros (si aparecen)
        "yodo": "Iodine",
        "algas": "Seaweed",
        "savia": "Sap",
        "corteza": "Bark",
        "coral de fuego": "Fire Coral",

        // Aceites
        "petroleo crudo": "Crude Oil",
        "petróleo crudo": "Crude Oil",
        "aceite mineral": "Mineral Oil",
        "crudo": "Crude Oil",

        // Chert / Chert suele traducirse como sílex/pedernal (según contexto)
        "pedernal": "Chert",
        "silex": "Chert",
        "sílex": "Chert",

        // Lignite
        "lignito": "Lignite",
    };

    // Normalizamos las claves al construir el mapa para que "Á" y "A" sean iguales
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

    // Si hay alias ES -> canónico EN, añadimos también el canónico como variante
    const aliasTo = resourceAliases[termNorm];
    if (aliasTo) {
        variants.add(normalizeText(aliasTo));
    }

    return Array.from(variants);
}

// ========================================
// BÚSQUEDA EN MAPA (filtra recursos dentro de cada isla, reconoce ES)
// ========================================

const searchBox = document.getElementById('searchBox');
const locationCards = document.querySelectorAll('.location-card');

function applyMapSearchFilter(termRaw) {
    const variants = getSearchVariants(termRaw);

    // Si no hay búsqueda: restaurar todo
    if (variants.length === 0) {
        locationCards.forEach(card => {
            card.style.display = '';
            card.querySelectorAll('.resource').forEach(r => r.classList.remove('hidden'));
        });
        return;
    }

    locationCards.forEach(card => {
        const locationNameEl = card.querySelector('.location-header h3');
        const locationName = normalizeText(locationNameEl?.textContent);

        const resources = Array.from(card.querySelectorAll('.resource'));
        const matchingResources = resources.filter(r => {
            const resourceAttr = normalizeText(r.getAttribute('data-resource'));
            const resourceText = normalizeText(r.textContent);
            return variants.some(v => resourceAttr.includes(v) || resourceText.includes(v));
        });

        // Si el término coincide con la ubicación: mostramos la tarjeta y todos los recursos
        if (variants.some(v => locationName.includes(v))) {
            card.style.display = '';
            resources.forEach(r => r.classList.remove('hidden'));
            return;
        }

        // Si coincide con recursos: mostramos la tarjeta y SOLO esos recursos
        if (matchingResources.length > 0) {
            card.style.display = '';
            resources.forEach(r => r.classList.add('hidden'));
            matchingResources.forEach(r => r.classList.remove('hidden'));
            return;
        }

        // No coincide: ocultar tarjeta
        card.style.display = 'none';
    });
}

searchBox.addEventListener('input', function () {
    applyMapSearchFilter(this.value);
});

// ========================================
// FILTROS
// ========================================

const filterBtns = document.querySelectorAll('.filter-btn');
const allResources = document.querySelectorAll('.resource');

filterBtns.forEach(btn => {
    btn.addEventListener('click', function () {
        // Remover active de todos
        filterBtns.forEach(b => b.classList.remove('active'));
        // Añadir active al clickeado
        this.classList.add('active');

        const filter = this.getAttribute('data-filter');

        // Mostrar/ocultar recursos
        allResources.forEach(resource => {
            const resourceName = resource.getAttribute('data-resource');

            if (filter === 'all') {
                resource.classList.remove('hidden');
            } else if (filter === 'important') {
                if (resource.classList.contains('important')) {
                    resource.classList.remove('hidden');
                } else {
                    resource.classList.add('hidden');
                }
            } else if (filter === 'consumable') {
                if (resource.classList.contains('consumable')) {
                    resource.classList.remove('hidden');
                } else {
                    resource.classList.add('hidden');
                }
            } else if (filter === 'missing') {
                if (!warehouse.includes(resourceName)) {
                    resource.classList.remove('hidden');
                } else {
                    resource.classList.add('hidden');
                }
            } else if (filter === 'owned') {
                if (warehouse.includes(resourceName)) {
                    resource.classList.remove('hidden');
                } else {
                    resource.classList.add('hidden');
                }
            }
        });

        // Ocultar tarjetas sin recursos visibles
        locationCards.forEach(card => {
            const visibleResources = card.querySelectorAll('.resource:not(.hidden)');
            if (visibleResources.length === 0) {
                card.style.display = 'none';
            } else {
                card.style.display = '';
            }
        });
    });
});

// ========================================
// CLICK EN RECURSOS
// ========================================

allResources.forEach(resource => {
    resource.addEventListener('click', function () {
        const resourceName = this.getAttribute('data-resource');
        toggleWarehouse(resourceName);
    });
});

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    updateWarehouseUI();
    updateResourceColors();
});

// ========================================
// CONSOLA
// ========================================

console.log(`%c${t('consoleTitle')}`, 'color: #f39c12; font-size: 20px; font-weight: bold;');
console.log(t('consoleLocationsLoaded', locationCards.length));
console.log(t('consoleResourcesTotal', allResources.length));
console.log(t('consoleWarehouseCount', warehouse.length));

// Detectar iconos que no cargan
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