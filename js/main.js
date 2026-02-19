/**
 * MAIN CLIENT MODULE - Floristería Santa Bárbara
 * Corregido: Mapa, WhatsApp con fotos, validaciones
 */

// Estado global
let currentCategory = 'todos';
let map = null;
let marker = null;
let selectedCoords = null;
let mapInitialized = false;

// Configuración (se carga de DB)
let CONFIG = {
    shopLat: 9.86,
    shopLng: -83.92,
    costPerKm: 650,
    phoneNumber: '50686053613'
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Cargar configuración
    const settings = DB.getSettings();
    CONFIG = { ...CONFIG, ...settings };
    
    // Inicializar UI
    initDateInput();
    loadCategories();
    loadProducts();
    loadSlides();
    updateCartUI();
    
    // Event listeners globales
    setupGlobalEvents();
});

function setupGlobalEvents() {
    // Cerrar menú al hacer click fuera
    document.addEventListener('click', (e) => {
        const nav = document.getElementById('mainNav');
        const toggle = document.getElementById('menuToggle');
        if (!nav.contains(e.target) && !toggle.contains(e.target)) {
            nav.classList.remove('active');
        }
    });
}

function initDateInput() {
    const dateInput = document.getElementById('deliveryDate');
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    dateInput.min = today.toISOString().split('T')[0];
    
    // Máximo 30 días en el futuro
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    dateInput.max = maxDate.toISOString().split('T')[0];
}

// ==========================================
// CATEGORÍAS Y PRODUCTOS
// ==========================================

function loadCategories() {
    const categories = DB.getCategories();
    const container = document.getElementById('categoryFilters');
    
    // Mantener botón "Todos", limpiar el resto
    const existingButtons = Array.from(container.children);
    existingButtons.slice(1).forEach(btn => btn.remove());
    
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.textContent = cat.name;
        btn.dataset.category = cat.id;
        btn.onclick = () => filterProducts(cat.id);
        container.appendChild(btn);
    });
}

function loadProducts() {
    const products = DB.getProducts().filter(p => p.isActive);
    const container = document.getElementById('productGrid');
    container.innerHTML = '';
    
    const filtered = currentCategory === 'todos' 
        ? products 
        : products.filter(p => p.category === currentCategory);
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="icon">🌸</div>
                <p>No hay productos en esta categoría</p>
            </div>
        `;
        return;
    }
    
    filtered.forEach(product => {
        container.appendChild(createProductCard(product));
    });
}

function createProductCard(product) {
    const div = document.createElement('div');
    div.className = 'product-card';
    
    const isSeasonal = product.useSeasonalPrice && product.seasonalPrice > 0;
    const displayPrice = isSeasonal ? product.seasonalPrice : product.price;
    const originalPrice = isSeasonal ? product.price : null;
    
    div.innerHTML = `
        <img src="${product.image || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="250"><rect fill="%23f3e5f5" width="300" height="250"/><text fill="%239c27b0" font-family="sans-serif" font-size="20" x="50%" y="50%" text-anchor="middle" dy=".3em">🌸 Sin Imagen</text></svg>'}" 
             alt="${escapeHtml(product.name)}" 
             class="product-image"
             loading="lazy">
        <div class="product-info">
            <div class="product-category">${escapeHtml(getCategoryName(product.category))}</div>
            <h3 class="product-name">${escapeHtml(product.name)}</h3>
            <p class="product-description">${escapeHtml(product.description || '')}</p>
            <div class="product-price">
                <span class="current-price">₡${displayPrice.toLocaleString()}</span>
                ${originalPrice ? `<span class="original-price">₡${originalPrice.toLocaleString()}</span>` : ''}
                ${isSeasonal ? '<span class="seasonal-badge">Oferta</span>' : ''}
            </div>
            <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">
                🛒 Agregar al Carrito
            </button>
        </div>
    `;
    
    return div;
}

function getCategoryName(id) {
    const cat = DB.getCategories().find(c => c.id === id);
    return cat ? cat.name : id;
}

function filterProducts(category) {
    currentCategory = category;
    
    // Actualizar UI de botones
    document.querySelectorAll('.category-filters button').forEach(btn => {
        const isActive = btn.dataset.category === category || 
                        (category === 'todos' && !btn.dataset.category);
        btn.classList.toggle('active', isActive);
    });
    
    // Animación de transición
    const grid = document.getElementById('productGrid');
    grid.style.opacity = '0';
    setTimeout(() => {
        loadProducts();
        grid.style.opacity = '1';
    }, 200);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==========================================
// CARRUSEL
// ==========================================

function loadSlides() {
    const slides = DB.getSlides();
    const container = document.getElementById('carouselContainer');
    container.innerHTML = '';
    
    if (slides.length === 0) {
        container.innerHTML = `
            <div class="carousel-slide">
                <div style="width:100%;height:100%;background:linear-gradient(135deg,#e91e63,#9c27b0);display:flex;align-items:center;justify-content:center;color:white;font-size:24px;">
                    🌸 Bienvenidos a Floristería Santa Bárbara
                </div>
            </div>
        `;
        return;
    }
    
    slides.forEach(slide => {
        const div = document.createElement('div');
        div.className = 'carousel-slide';
        div.innerHTML = `
            <img src="${slide.image || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400"><rect fill="%23e91e63" width="1200" height="400"/><text fill="white" font-family="sans-serif" font-size="40" x="50%" y="50%" text-anchor="middle" dy=".3em">🌸 Floristería Santa Bárbara</text></svg>'}" 
                 alt="${escapeHtml(slide.title)}"
                 loading="eager">
            <div class="carousel-content">
                <h2>${escapeHtml(slide.title)}</h2>
                <p>${escapeHtml(slide.description)}</p>
            </div>
        `;
        container.appendChild(div);
    });
    
    initCarousel();
}

let currentSlide = 0;
let carouselInterval;

function initCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    if (slides.length <= 1) return;
    
    // Reset
    if (carouselInterval) clearInterval(carouselInterval);
    currentSlide = 0;
    updateCarousel();
    
    // Autoplay
    carouselInterval = setInterval(() => {
        moveCarousel(1);
    }, 5000);
    
    // Pausar en hover
    const container = document.getElementById('carouselContainer');
    container.parentElement.addEventListener('mouseenter', () => {
        clearInterval(carouselInterval);
    });
    container.parentElement.addEventListener('mouseleave', () => {
        carouselInterval = setInterval(() => moveCarousel(1), 5000);
    });
}

function moveCarousel(direction) {
    const slides = document.querySelectorAll('.carousel-slide');
    if (slides.length === 0) return;
    
    currentSlide = (currentSlide + direction + slides.length) % slides.length;
    updateCarousel();
}

function updateCarousel() {
    const container = document.getElementById('carouselContainer');
    container.style.transform = `translateX(-${currentSlide * 100}%)`;
}

// ==========================================
// NAVEGACIÓN
// ==========================================

function toggleMenu() {
    document.getElementById('mainNav').classList.toggle('active');
}

function closeMenu() {
    document.getElementById('mainNav').classList.remove('active');
}

function closeModalOnClickOutside(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}

// ==========================================
// MAPA Y UBICACIÓN
// ==========================================

function toggleMap() {
    const mapDiv = document.getElementById('map');
    const btn = document.querySelector('.location-btn');
    
    if (!mapDiv.classList.contains('active')) {
        mapDiv.classList.add('active');
        btn.classList.add('active');
        btn.innerHTML = '✕ Cerrar Mapa';
        
        if (!mapInitialized) {
            setTimeout(initMap, 100);
        } else {
            setTimeout(() => map.invalidateSize(), 100);
        }
    } else {
        mapDiv.classList.remove('active');
        btn.classList.remove('active');
        btn.innerHTML = '📍 Marcar ubicación exacta en el mapa';
    }
}

function initMap() {
    if (mapInitialized) return;
    
    try {
        map = L.map('map').setView([CONFIG.shopLat, CONFIG.shopLng], 14);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19
        }).addTo(map);
        
        // Marcador de la tienda
        const shopIcon = L.divIcon({
            html: '<div style="font-size:30px;">🌸</div>',
            className: 'shop-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
        
        L.marker([CONFIG.shopLat, CONFIG.shopLng], { icon: shopIcon })
            .addTo(map)
            .bindPopup('<b>Floristería Santa Bárbara</b><br>Tienda principal')
            .openPopup();
        
        // Click en el mapa
        map.on('click', function(e) {
            placeMarker(e.latlng);
        });
        
        mapInitialized = true;
    } catch (e) {
        console.error('Error inicializando mapa:', e);
        showToast('Error al cargar el mapa', 'error');
    }
}

function placeMarker(latlng) {
    if (marker) {
        map.removeLayer(marker);
    }
    
    selectedCoords = latlng;
    
    const pinIcon = L.divIcon({
        html: '<div style="font-size:25px;">📍</div>',
        className: 'pin-marker',
        iconSize: [25, 25],
        iconAnchor: [12, 25]
    });
    
    marker = L.marker(latlng, { 
        icon: pinIcon,
        draggable: true 
    }).addTo(map);
    
    marker.bindPopup('📍 Ubicación de entrega<br><small>Arrastra para ajustar</small>').openPopup();
    
    // Evento de arrastre
    marker.on('dragend', function(e) {
        selectedCoords = e.target.getLatLng();
        calculateDistance(selectedCoords.lat, selectedCoords.lng);
    });
    
    calculateDistance(latlng.lat, latlng.lng);
}

function calculateDistance(lat, lng) {
    // Fórmula de Haversine
    const R = 6371;
    const dLat = (lat - CONFIG.shopLat) * Math.PI / 180;
    const dLon = (lng - CONFIG.shopLng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(CONFIG.shopLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    const cost = Math.max(1000, Math.round(distance * CONFIG.costPerKm)); // Mínimo ₡1000
    
    // Actualizar UI
    document.getElementById('distanceInfo').classList.add('active');
    document.getElementById('distanceKm').textContent = distance.toFixed(2);
    document.getElementById('calculatedShipping').textContent = '₡' + cost.toLocaleString();
    
    updateCheckoutTotals();
}

// ==========================================
// CHECKOUT
// ==========================================

function toggleDeliveryOptions() {
    const type = document.getElementById('deliveryType').value;
    const options = document.getElementById('deliveryOptions');
    const address = document.getElementById('address');
    
    options.style.display = type === 'delivery' ? 'block' : 'none';
    address.required = type === 'delivery';
    
    if (type !== 'delivery') {
        document.getElementById('distanceInfo').classList.remove('active');
        document.getElementById('calculatedShipping').textContent = '₡0';
    }
    
    updateCheckoutTotals();
}

function validatePhone(input) {
    // Permitir solo números
    input.value = input.value.replace(/[^0-9]/g, '');
    
    // Validación visual
    const isValid = input.value.length === 8;
    input.style.borderColor = isValid ? '#4caf50' : input.value.length > 0 ? '#f44336' : '';
}

function updateCharCount(textarea) {
    const count = textarea.value.length;
    document.getElementById('charCount').textContent = `${count}/200 caracteres`;
}

function showPaymentInfo() {
    const method = document.getElementById('paymentMethod').value;
    document.getElementById('paymentInfoSinpe').style.display = method === 'sinpe' ? 'block' : 'none';
    document.getElementById('paymentInfoTransfer').style.display = method === 'transfer' ? 'block' : 'none';
}

function openCheckout() {
    if (cart.length === 0) {
        showToast('El carrito está vacío', 'error');
        return;
    }
    
    document.getElementById('cartModal').classList.remove('active');
    document.getElementById('checkoutModal').classList.add('active');
    
    // Mostrar items
    const container = document.getElementById('orderItemsPreview');
    container.innerHTML = cart.map(item => `
        <div class="order-preview-item">
            <span>${escapeHtml(item.name)} x${item.quantity}</span>
            <span>₡${(item.price * item.quantity).toLocaleString()}</span>
        </div>
    `).join('');
    
    updateCheckoutTotals();
}

function closeCheckout() {
    document.getElementById('checkoutModal').classList.remove('active');
}

function updateCheckoutTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryType = document.getElementById('deliveryType').value;
    let shipping = 0;
    
    if (deliveryType === 'delivery') {
        const shippingText = document.getElementById('calculatedShipping').textContent;
        shipping = parseInt(shippingText.replace(/[^0-9]/g, '')) || 0;
    }
    
    const total = subtotal + shipping;
    
    document.getElementById('checkoutSubtotal').textContent = '₡' + subtotal.toLocaleString();
    document.getElementById('checkoutShipping').textContent = deliveryType === 'pickup' ? 'Gratis' : '₡' + shipping.toLocaleString();
    document.getElementById('checkoutTotal').textContent = '₡' + total.toLocaleString();
}

// ==========================================
// PROCESAR ORDEN
// ==========================================

async function processOrder(e) {
    e.preventDefault();
    
    if (cart.length === 0) {
        showToast('El carrito está vacío', 'error');
        return;
    }
    
    // Validar campos requeridos
    const deliveryType = document.getElementById('deliveryType').value;
    if (deliveryType === 'delivery' && !selectedCoords) {
        showToast('Por favor marca la ubicación en el mapa', 'error');
        document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
        return;
    }
    
    // Recopilar datos
    const orderData = {
        receiver: {
            name: document.getElementById('receiverName').value.trim(),
            phone: document.getElementById('receiverPhone').value
        },
        sender: {
            name: document.getElementById('senderName').value.trim(),
            phone: document.getElementById('senderPhone').value
        },
        delivery: {
            type: deliveryType,
            address: document.getElementById('address').value.trim(),
            landmarks: document.getElementById('landmarks').value.trim(),
            coords: selectedCoords,
            date: document.getElementById('deliveryDate').value,
            time: document.getElementById('deliveryTime').value
        },
        message: document.getElementById('cardMessage').value.trim(),
        payment: document.getElementById('paymentMethod').value,
        items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            image: item.image // Para referencia
        })),
        totals: {
            subtotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            shipping: deliveryType === 'delivery' ? 
                parseInt(document.getElementById('calculatedShipping').textContent.replace(/[^0-9]/g, '')) || 0 : 0
        }
    };
    
    orderData.totals.total = orderData.totals.subtotal + orderData.totals.shipping;
    
    // Generar mensaje
    const message = generateWhatsAppMessage(orderData);
    
    // Abrir WhatsApp
    const whatsappUrl = `https://wa.me/${CONFIG.phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Feedback
    showToast('Redirigiendo a WhatsApp...', 'success');
    
    // Opcional: limpiar carrito después de un tiempo
    setTimeout(() => {
        if (confirm('¿El pedido fue enviado correctamente? ¿Limpiar el carrito?')) {
            cart = [];
            DB.clearCart();
            updateCartUI();
            closeCheckout();
            document.getElementById('orderForm').reset();
            document.getElementById('distanceInfo').classList.remove('active');
            if (marker && map) {
                map.removeLayer(marker);
                marker = null;
            }
            selectedCoords = null;
        }
    }, 2000);
}

function generateWhatsAppMessage(order) {
    const itemsList = order.items.map((item, i) => {
        const total = item.price * item.quantity;
        return `${i + 1}. ${item.name}\n   Cant: ${item.quantity} x ₡${item.price.toLocaleString()} = ₡${total.toLocaleString()}`;
    }).join('\n\n');
    
    // Crear lista de imágenes (URLs cortas o indicaciones)
    const imagesList = order.items
        .filter(item => item.image && item.image.length > 100)
        .map((item, i) => `Foto ${i + 1}: ${item.name}`)
        .join('\n');
    
    let msg = `🌸 *PEDIDO - FLORISTERÍA SANTA BÁRBARA* 🌸\n\n`;
    
    msg += `*📅 Fecha:* ${new Date().toLocaleString('es-CR')}\n\n`;
    
    msg += `*👤 RECIBE:*\n`;
    msg += `Nombre: ${order.receiver.name}\n`;
    msg += `Tel: ${order.receiver.phone}\n\n`;
    
    msg += `*💝 ENVÍA:*\n`;
    msg += `Nombre: ${order.sender.name}\n`;
    msg += `Tel: ${order.sender.phone}\n\n`;
    
    msg += `*📦 PRODUCTOS:*\n${itemsList}\n\n`;
    
    if (imagesList) {
        msg += `*📷 IMÁGENES:*\n${imagesList}\n`;
        msg += `(Adjuntar fotos de referencia manualmente)\n\n`;
    }
    
    msg += `*💰 TOTALES:*\n`;
    msg += `Subtotal: ₡${order.totals.subtotal.toLocaleString()}\n`;
    msg += `Envío: ₡${order.totals.shipping.toLocaleString()}\n`;
    msg += `*TOTAL: ₡${order.totals.total.toLocaleString()}*\n\n`;
    
    if (order.delivery.type === 'delivery') {
        msg += `*🚚 ENVÍO:*\n`;
        msg += `📍 ${order.delivery.address}\n`;
        if (order.delivery.landmarks) msg += `🏠 Señas: ${order.delivery.landmarks}\n`;
        if (order.delivery.coords) {
            msg += `🗺️ Maps: https://maps.google.com/?q=${order.delivery.coords.lat},${order.delivery.coords.lng}\n`;
        }
    } else {
        msg += `*🏪 RECOGER EN TIENDA*\n`;
    }
    
    msg += `\n*📆 ENTREGA:* ${order.delivery.date}\n`;
    msg += `*⏰ HORA:* ${getTimeLabel(order.delivery.time)}\n\n`;
    
    if (order.message) {
        msg += `*💌 MENSAJE TARJETA:*\n"${order.message}"\n\n`;
    }
    
    msg += `*💳 PAGO:* ${getPaymentLabel(order.payment)}\n\n`;
    msg += `✅ *Confirmar disponibilidad por favor* 🙏`;
    
    return msg;
}

function getTimeLabel(time) {
    const labels = {
        morning: 'Mañana (8am-12pm)',
        afternoon: 'Tarde (12pm-5pm)',
        evening: 'Noche (5pm-8pm)'
    };
    return labels[time] || time;
}

function getPaymentLabel(method) {
    const labels = {
        sinpe: 'SINPE Móvil',
        cash: 'Efectivo',
        transfer: 'Transferencia BAC'
    };
    return labels[method] || method;
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    
    // Icono según tipo
    const icons = {
        success: '✓ ',
        error: '✕ ',
        info: 'ℹ '
    };
    toast.textContent = (icons[type] || '') + message;
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
