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
        warehouseList. innerHTML = '<p class="empty-message">Tu almacén está vacío.  Haz click en los recursos de las ubicaciones para añadirlos.</p>';
        return;
    }
    
    // Ordenar alfabéticamente
    const sortedWarehouse = [...warehouse]. sort();
    
    warehouseList.innerHTML = sortedWarehouse. map(resource => {
        const resourceElement = document.querySelector(`.resource[data-resource="${resource}"]`);
        const iconSrc = resourceElement ?  resourceElement.querySelector('.resource-icon').src : '';
        
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
    if (! warehouse.includes(resourceName)) {
        warehouse.push(resourceName);
        saveWarehouse();
        console.log(`✅ ${resourceName} añadido al almacén`);
    }
}

// Quitar del warehouse
function removeFromWarehouse(resourceName) {
    warehouse = warehouse.filter(r => r !== resourceName);
    saveWarehouse();
    console.log(`❌ ${resourceName} eliminado del almacén`);
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
            resource. classList.add('in-warehouse');
        } else {
            resource.classList.add('not-in-warehouse');
        }
    });
}

// ========================================
// PANEL WAREHOUSE
// ========================================

const warehouseToggle = document.getElementById('warehouseToggle');
const warehousePanel = document. getElementById('warehousePanel');
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
    if (confirm('¿Estás seguro de que quieres vaciar todo el almacén?')) {
        warehouse = [];
        saveWarehouse();
        console.log('🗑️ Almacén vaciado');
    }
});

// Exportar warehouse
exportWarehouse.addEventListener('click', () => {
    const data = JSON.stringify(warehouse, null, 2);
    const blob = new Blob([data], { type:  'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'atlas-warehouse.json';
    a.click();
    console.log('📥 Warehouse exportado');
});

// Búsqueda en warehouse
const warehouseSearch = document.getElementById('warehouseSearch');
warehouseSearch.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const items = document.querySelectorAll('. warehouse-item');
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
});

// ========================================
// BÚSQUEDA EN MAPA
// ========================================

const searchBox = document.getElementById('searchBox');
const locationCards = document.querySelectorAll('.location-card');

searchBox.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    
    locationCards.forEach(card => {
        const text = card. textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            card.style. display = '';
        } else {
            card.style.display = 'none';
        }
    });
});

// ========================================
// FILTROS
// ========================================

const filterBtns = document.querySelectorAll('.filter-btn');
const allResources = document.querySelectorAll('.resource');

filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
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
                if (! warehouse.includes(resourceName)) {
                    resource.classList.remove('hidden');
                } else {
                    resource.classList.add('hidden');
                }
            } else if (filter === 'owned') {
                if (warehouse. includes(resourceName)) {
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
                card. style.display = 'none';
            } else {
                card.style. display = '';
            }
        });
    });
});

// ========================================
// CLICK EN RECURSOS
// ========================================

allResources.forEach(resource => {
    resource.addEventListener('click', function() {
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

console.log('%c✅ Atlas Blackwood Resource Map', 'color: #f39c12; font-size: 20px; font-weight: bold;');
console.log(`📍 ${locationCards.length} ubicaciones cargadas`);
console.log(`📦 ${allResources.length} recursos totales`);
console.log(`🏪 ${warehouse.length} recursos en almacén`);

// Detectar iconos que no cargan
window.addEventListener('load', function() {
    const icons = document.querySelectorAll('. resource-icon');
    const missing = [];
    
    icons.forEach(img => {
        if (!img.complete || img.naturalHeight === 0) {
            missing.push(img.src. split('/').pop());
        }
    });
    
    if (missing.length > 0) {
        console.warn('⚠️ Iconos que no cargaron: ');
        console.table([...new Set(missing)].sort());
    } else {
        console.log('✅ Todos los iconos cargaron correctamente');
    }
});