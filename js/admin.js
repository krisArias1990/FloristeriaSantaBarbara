/**
 * ADMIN PANEL MODULE - Floristería Santa Bárbara
 * Completo con autenticación, gestión de imágenes y datos
 */

// Estado
let editingProductId = null;
let isAuthenticated = false;
const ADMIN_PASSWORD = 'flor2024'; // En producción, usar hash

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

function checkAuth() {
    isAuthenticated = sessionStorage.getItem('adminAuth') === 'true';
    
    if (isAuthenticated) {
        showAdminPanel();
    } else {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('adminPanel').style.display = 'none';
    }
}

function login() {
    const input = document.getElementById('adminPassword');
    if (input.value === ADMIN_PASSWORD) {
        isAuthenticated = true;
        sessionStorage.setItem('adminAuth', 'true');
        showAdminPanel();
        showToast('¡Bienvenida!', 'success');
    } else {
        showToast('Contraseña incorrecta', 'error');
        input.value = '';
        input.focus();
    }
}

function logout() {
    isAuthenticated = false;
    sessionStorage.removeItem('adminAuth');
    location.reload();
}

function showAdminPanel() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    
    // Cargar datos
    loadStats();
    loadCategories();
    loadProducts();
    loadSlides();
    
    // Actualizar fecha de último backup
    const lastBackup = localStorage.getItem('flor_sb_last_backup');
    if (lastBackup) {
        document.getElementById('lastBackup').textContent = 
            'Último respaldo: ' + new Date(lastBackup).toLocaleString('es-CR');
    }
}

// ==========================================
// ESTADÍSTICAS
// ==========================================

function loadStats() {
    const stats = DB.getStats();
    document.getElementById('statProducts').textContent = stats.activeProducts;
    document.getElementById('statCategories').textContent = stats.totalCategories;
    document.getElementById('statSlides').textContent = stats.totalSlides;
    document.getElementById('statStorage').textContent = stats.storageUsed;
}

// ==========================================
// CATEGORÍAS
// ==========================================

function loadCategories() {
    const categories = DB.getCategories();
    const container = document.getElementById('categoryList');
    const select = document.getElementById('productCategory');
    
    // Lista visual
    container.innerHTML = categories.map(cat => `
        <div class="category-tag">
            ${escapeHtml(cat.name)}
            <button onclick="deleteCategory('${cat.id}')" title="Eliminar categoría">×</button>
        </div>
    `).join('');
    
    // Select de productos
    select.innerHTML = '<option value="">Selecciona categoría</option>' +
        categories.map(cat => `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`).join('');
}

function addCategory() {
    const input = document.getElementById('newCategoryName');
    const name = input.value.trim();
    
    if (!name) {
        showToast('Ingresa un nombre', 'error');
        return;
    }
    
    const result = DB.addCategory(name);
    if (result.success) {
        input.value = '';
        loadCategories();
        showToast('Categoría agregada', 'success');
    } else {
        showToast(result.error, 'error');
    }
}

function deleteCategory(id) {
    if (!confirm('¿Eliminar esta categoría?')) return;
    
    const result = DB.deleteCategory(id);
    if (result.success) {
        loadCategories();
        showToast('Categoría eliminada', 'success');
    } else {
        showToast(result.error, 'error');
    }
}

// ==========================================
// PRODUCTOS
// ==========================================

function loadProducts() {
    const products = DB.getProducts();
    const tbody = document.getElementById('productsTableBody');
    const emptyState = document.getElementById('emptyProducts');
    
    if (products.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    tbody.innerHTML = products.map(product => {
        const category = DB.getCategories().find(c => c.id === product.category);
        const showingPrice = product.useSeasonalPrice && product.seasonalPrice > 0 
            ? product.seasonalPrice 
            : product.price;
        const altPrice = product.useSeasonalPrice && product.seasonalPrice > 0 
            ? product.price 
            : (product.seasonalPrice > 0 ? product.seasonalPrice : '-');
        
        return `
            <tr>
                <td>
                    <img src="${product.image || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect fill="%23f3e5f5" width="60" height="60"/><text fill="%239c27b0" font-family="sans-serif" font-size="20" x="50%" y="50%" text-anchor="middle" dy=".3em">🌸</text></svg>'}" 
                         class="product-img-thumb" alt="">
                </td>
                <td>${escapeHtml(product.name)}</td>
                <td>${escapeHtml(category ? category.name : product.category)}</td>
                <td>₡${showingPrice.toLocaleString()}</td>
                <td>${altPrice !== '-' ? '₡' + altPrice.toLocaleString() : '-'}</td>
                <td>
                    <span class="status-badge ${product.isActive ? 'status-active' : 'status-inactive'}">
                        ${product.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon btn-edit" onclick="editProduct('${product.id}')" title="Editar">✏️</button>
                        <button class="btn-icon btn-toggle" onclick="toggleProductStatus('${product.id}')" title="${product.isActive ? 'Desactivar' : 'Activar'}">
                            ${product.isActive ? '🚫' : '👁️'}
                        </button>
                        <button class="btn-icon btn-delete" onclick="deleteProduct('${product.id}')" title="Eliminar">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Previsualización de imagen
function previewImage(input) {
    const file = input.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('Imagen muy grande. Máx 5MB', 'error');
        input.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('imagePreview').src = e.target.result;
        document.getElementById('imagePreview').style.display = 'block';
        document.getElementById('uploadPlaceholder').style.display = 'none';
        document.getElementById('imageUploadArea').classList.add('has-image');
        document.getElementById('removeImageBtn').style.display = 'flex';
    };
    reader.readAsDataURL(file);
}

function removeImage(e) {
    e.stopPropagation();
    document.getElementById('productImage').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('uploadPlaceholder').style.display = 'block';
    document.getElementById('imageUploadArea').classList.remove('has-image');
    document.getElementById('removeImageBtn').style.display = 'none';
}

// Toggle de precio de temporada
function toggleSeasonalDefault() {
    const checkbox = document.getElementById('seasonalToggle');
    document.getElementById('seasonalLabel').textContent = checkbox.checked ? 'Sí' : 'No';
}

// Guardar producto
async function saveProduct(e) {
    e.preventDefault();
    showLoading(true);
    
    try {
        const name = document.getElementById('productName').value.trim();
        const category = document.getElementById('productCategory').value;
        const description = document.getElementById('productDescription').value.trim();
        const price = parseInt(document.getElementById('productPrice').value);
        const seasonalPrice = parseInt(document.getElementById('productSeasonalPrice').value) || 0;
        const useSeasonal = document.getElementById('seasonalToggle').checked;
        
        // Procesar imagen
        const fileInput = document.getElementById('productImage');
        let imageData = null;
        
        if (fileInput.files && fileInput.files[0]) {
            imageData = await DB.compressImage(fileInput.files[0], 800, 800, 0.85);
        } else if (editingProductId) {
            const existing = DB.getProductById(editingProductId);
            imageData = existing ? existing.image : null;
        }
        
        const productData = {
            name,
            category,
            description,
            price,
            seasonalPrice,
            useSeasonalPrice: useSeasonal,
            image: imageData,
            isActive: true
        };
        
        if (editingProductId) {
            DB.updateProduct(editingProductId, productData);
            showToast('Producto actualizado', 'success');
        } else {
            DB.addProduct(productData);
            showToast('Producto agregado', 'success');
        }
        
        resetProductForm();
        loadProducts();
        loadStats();
        
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function editProduct(id) {
    const product = DB.getProductById(id);
    if (!product) return;
    
    editingProductId = id;
    document.getElementById('productFormTitle').textContent = '✏️ Editar Producto';
    document.getElementById('saveProductBtn').textContent = 'Actualizar Producto';
    
    // Llenar campos
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productSeasonalPrice').value = product.seasonalPrice || '';
    document.getElementById('seasonalToggle').checked = product.useSeasonalPrice;
    document.getElementById('seasonalLabel').textContent = product.useSeasonalPrice ? 'Sí' : 'No';
    
    // Mostrar imagen
    if (product.image) {
        document.getElementById('imagePreview').src = product.image;
        document.getElementById('imagePreview').style.display = 'block';
        document.getElementById('uploadPlaceholder').style.display = 'none';
        document.getElementById('imageUploadArea').classList.add('has-image');
        document.getElementById('removeImageBtn').style.display = 'flex';
    }
    
    document.getElementById('productForm').scrollIntoView({ behavior: 'smooth' });
}

function toggleProductStatus(id) {
    DB.toggleProductStatus(id);
    loadProducts();
    loadStats();
}

function deleteProduct(id) {
    if (!confirm('¿Eliminar permanentemente este producto?')) return;
    
    DB.deleteProduct(id);
    loadProducts();
    loadStats();
    showToast('Producto eliminado', 'success');
}

function resetProductForm() {
    editingProductId = null;
    document.getElementById('productForm').reset();
    document.getElementById('productFormTitle').textContent = '➕ Nuevo Producto';
    document.getElementById('saveProductBtn').textContent = '💾 Guardar Producto';
    
    // Resetear imagen
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('uploadPlaceholder').style.display = 'block';
    document.getElementById('imageUploadArea').classList.remove('has-image');
    document.getElementById('removeImageBtn').style.display = 'none';
    document.getElementById('seasonalLabel').textContent = 'No';
}

// ==========================================
// SLIDES
// ==========================================

function loadSlides() {
    const slides = DB.getSlides();
    document.getElementById('slidesTableBody').innerHTML = slides.map(slide => `
        <tr>
            <td>
                <img src="${slide.image || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><rect fill="%23e91e63" width="100" height="50"/></svg>'}" 
                     style="width: 100px; height: 50px; object-fit: cover; border-radius: 4px;" alt="">
            </td>
            <td>
                <strong>${escapeHtml(slide.title)}</strong><br>
                <small>${escapeHtml(slide.description)}</small>
            </td>
            <td>
                <button class="btn-icon btn-delete" onclick="deleteSlide('${slide.id}')">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function previewSlideImage(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('slideImagePreview').src = e.target.result;
        document.getElementById('slideImagePreview').style.display = 'block';
        document.getElementById('slideUploadPlaceholder').style.display = 'none';
        document.getElementById('slideUploadArea').classList.add('has-image');
    };
    reader.readAsDataURL(file);
}

async function addSlide(e) {
    e.preventDefault();
    showLoading(true);
    
    try {
        const title = document.getElementById('slideTitle').value.trim();
        const description = document.getElementById('slideDescription').value.trim();
        const fileInput = document.getElementById('slideImage');
        
        if (!fileInput.files || !fileInput.files[0]) {
            showToast('Selecciona una imagen', 'error');
            return;
        }
        
        const imageData = await DB.compressImage(fileInput.files[0], 1200, 600, 0.9);
        
        DB.addSlide({
            title,
            description,
            image: imageData
        });
        
        showToast('Slide agregado', 'success');
        
        // Reset
        document.getElementById('slideForm').reset();
        document.getElementById('slideImagePreview').style.display = 'none';
        document.getElementById('slideUploadPlaceholder').style.display = 'block';
        document.getElementById('slideUploadArea').classList.remove('has-image');
        
        loadSlides();
        loadStats();
        
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function deleteSlide(id) {
    if (!confirm('¿Eliminar este slide?')) return;
    DB.deleteSlide(id);
    loadSlides();
    loadStats();
}

// ==========================================
// GESTIÓN DE DATOS
// ==========================================

function exportData() {
    const data = DB.exportAll();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `floristeria_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    localStorage.setItem('flor_sb_last_backup', new Date().toISOString());
    document.getElementById('lastBackup').textContent = 
        'Último respaldo: ' + new Date().toLocaleString('es-CR');
    
    showToast('Datos exportados', 'success');
}

function importData(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const result = DB.importAll(e.target.result);
        if (result.success) {
            showToast(`Importados: ${result.stats.products} productos`, 'success');
            loadCategories();
            loadProducts();
            loadSlides();
            loadStats();
        } else if (!result.cancelled) {
            showToast(result.error, 'error');
        }
    };
    reader.readAsText(file);
    input.value = '';
}

function clearImagesOnly() {
    if (!confirm('¿Eliminar todas las imágenes? Los productos permanecerán.')) return;
    
    DB.clearImagesOnly();
    loadProducts();
    loadSlides();
    showToast('Imágenes eliminadas', 'success');
}

function clearAllData() {
    if (!confirm('⚠️ ¿BORRAR ABSOLUTAMENTE TODO? Esta acción no se puede deshacer.')) return;
    if (!prompt('Escribe BORRAR para confirmar:') === 'BORRAR') return;
    
    DB.clearAll();
    location.reload();
}

// ==========================================
// UTILIDADES
// ==========================================

function showLoading(show) {
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

function showToast(message, type) {
    const container = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    container.appendChild(alert);
    
    setTimeout(() => alert.remove(), 4000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
