/**
 * CART MODULE - Sistema de Carrito Mejorado
 */

let cart = [];

// Inicializar desde DB al cargar
document.addEventListener('DOMContentLoaded', () => {
    cart = DB.getCart();
    updateCartUI();
});

function addToCart(productId) {
    const product = DB.getProductById(productId);
    if (!product || !product.isActive) {
        showToast('Producto no disponible', 'error');
        return;
    }
    
    const price = product.useSeasonalPrice && product.seasonalPrice > 0 
        ? product.seasonalPrice 
        : product.price;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: price,
            image: product.image,
            quantity: 1
        });
    }
    
    DB.saveCart(cart);
    updateCartUI();
    showToast('¡Agregado al carrito!', 'success');
    
    // Animación en el botón del carrito
    animateCartButton();
}

function animateCartButton() {
    const btn = document.getElementById('cartBtn');
    btn.style.transform = 'scale(1.2)';
    setTimeout(() => {
        btn.style.transform = 'scale(1)';
    }, 200);
}

function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = count;
    
    const container = document.getElementById('cartItems');
    const summary = document.getElementById('cartSummary');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-cart-msg">Tu carrito está vacío<br><small>¡Agrega algunos productos!</small></p>';
        summary.style.display = 'none';
        checkoutBtn.disabled = true;
        return;
    }
    
    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect fill="%23f3e5f5" width="80" height="80"/><text fill="%239c27b0" font-family="sans-serif" font-size="30" x="50%" y="50%" text-anchor="middle" dy=".3em">🌸</text></svg>'}" 
                 alt="${escapeHtml(item.name)}">
            <div class="cart-item-details">
                <div class="cart-item-name">${escapeHtml(item.name)}</div>
                <div class="cart-item-price">₡${item.price.toLocaleString()}</div>
            </div>
            <div class="cart-item-quantity">
                <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">−</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
            </div>
            <button class="remove-item" onclick="removeFromCart('${item.id}')" title="Eliminar">🗑️</button>
        </div>
    `).join('');
    
    summary.style.display = 'block';
    checkoutBtn.disabled = false;
    
    // Calcular totales
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('subtotal').textContent = '₡' + subtotal.toLocaleString();
    document.getElementById('total').textContent = '₡' + subtotal.toLocaleString();
}

function updateQuantity(productId, change) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    DB.saveCart(cart);
    updateCartUI();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    DB.saveCart(cart);
    updateCartUI();
    showToast('Producto eliminado', 'info');
}

function toggleCart() {
    const modal = document.getElementById('cartModal');
    const isActive = modal.classList.toggle('active');
    
    // Prevenir scroll del body cuando el modal está abierto
    document.body.style.overflow = isActive ? 'hidden' : '';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
