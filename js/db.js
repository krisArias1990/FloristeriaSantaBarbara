/**
 * DATABASE MODULE - Floristería Santa Bárbara
 * Sistema de persistencia local con manejo de errores
 */

const DB = (function() {
    'use strict';
    
    // Constantes
    const KEYS = {
        PRODUCTS: 'flor_sb_products_v2',
        CATEGORIES: 'flor_sb_categories_v2',
        SLIDES: 'flor_sb_slides_v2',
        CART: 'flor_sb_cart_v2',
        SETTINGS: 'flor_sb_settings_v2',
        LAST_BACKUP: 'flor_sb_last_backup'
    };

    const DEFAULT_COORDS = { lat: 9.86, lng: -83.92 }; // Santa Bárbara, Heredia

    // Datos iniciales
    const initialData = {
        categories: [
            { id: 'rosas', name: 'Rosas', createdAt: Date.now() },
            { id: 'girasoles', name: 'Girasoles', createdAt: Date.now() },
            { id: 'arreglos', name: 'Arreglos', createdAt: Date.now() },
            { id: 'funerales', name: 'Funerales', createdAt: Date.now() },
            { id: 'peluches', name: 'Peluches y Detalles', createdAt: Date.now() }
        ],
        products: [
            {
                id: 'prod_' + Date.now(),
                name: 'Ramo de 12 Rosas Rojas',
                category: 'rosas',
                description: 'Elegante ramo con 12 rosas rojas importadas, follaje premium y moño satinado',
                price: 25000,
                seasonalPrice: 22000,
                useSeasonalPrice: false,
                image: null,
                isActive: true,
                createdAt: Date.now()
            },
            {
                id: 'prod_' + (Date.now() + 1),
                name: 'Arreglo de 5 Girasoles',
                category: 'girasoles',
                description: 'Alegre arreglo en base de madera rústica con girasoles frescos',
                price: 18000,
                seasonalPrice: 15000,
                useSeasonalPrice: true,
                image: null,
                isActive: true,
                createdAt: Date.now() + 1
            },
            {
                id: 'prod_' + (Date.now() + 2),
                name: 'Centro de Mesa Premium',
                category: 'arreglos',
                description: 'Sofisticado centro de mesa con variedad de flores en base de cristal',
                price: 35000,
                seasonalPrice: 0,
                useSeasonalPrice: false,
                image: null,
                isActive: true,
                createdAt: Date.now() + 2
            }
        ],
        slides: [
            {
                id: 'slide_' + Date.now(),
                title: 'Flores Frescas para Cada Ocasión',
                description: 'Encuentra el arreglo perfecto para celebrar la vida',
                image: null,
                createdAt: Date.now()
            },
            {
                id: 'slide_' + (Date.now() + 1),
                title: 'Envío a Domicilio en Santa Bárbara',
                description: 'Llevamos felicidad hasta tu puerta el mismo día',
                image: null,
                createdAt: Date.now() + 1
            }
        ]
    };

    // Utilidades privadas
    function safeJSONParse(str, defaultVal) {
        try {
            return JSON.parse(str);
        } catch (e) {
            console.warn('Error parsing JSON:', e);
            return defaultVal;
        }
    }

    function generateId(prefix) {
        return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // API Pública
    return {
        // Inicialización
        init() {
            try {
                // Verificar si es primera vez o migración necesaria
                const currentVersion = localStorage.getItem('flor_sb_version');
                if (!currentVersion) {
                    // Primera instalación
                    this.saveCategories(initialData.categories);
                    this.saveProducts(initialData.products);
                    this.saveSlides(initialData.slides);
                    localStorage.setItem('flor_sb_version', '2.0');
                    console.log('✅ DB inicializada con datos por defecto');
                }
                return true;
            } catch (e) {
                console.error('Error inicializando DB:', e);
                return false;
            }
        },

        // Productos
        getProducts() {
            return safeJSONParse(localStorage.getItem(KEYS.PRODUCTS), []);
        },

        saveProducts(products) {
            try {
                localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
                return true;
            } catch (e) {
                if (e.name === 'QuotaExceededError') {
                    throw new Error('Almacenamiento lleno. Exporte datos y limpie imágenes.');
                }
                throw e;
            }
        },

        getProductById(id) {
            return this.getProducts().find(p => p.id === id);
        },

        addProduct(product) {
            const products = this.getProducts();
            product.id = generateId('prod');
            product.createdAt = Date.now();
            product.isActive = true;
            products.push(product);
            this.saveProducts(products);
            return product;
        },

        updateProduct(id, updates) {
            const products = this.getProducts();
            const idx = products.findIndex(p => p.id === id);
            if (idx === -1) return null;
            
            products[idx] = { ...products[idx], ...updates, updatedAt: Date.now() };
            this.saveProducts(products);
            return products[idx];
        },

        deleteProduct(id) {
            const products = this.getProducts().filter(p => p.id !== id);
            return this.saveProducts(products);
        },

        toggleProductStatus(id) {
            const product = this.getProductById(id);
            if (!product) return null;
            return this.updateProduct(id, { isActive: !product.isActive });
        },

        // Categorías
        getCategories() {
            return safeJSONParse(localStorage.getItem(KEYS.CATEGORIES), []);
        },

        saveCategories(categories) {
            localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
            return true;
        },

        addCategory(name) {
            const categories = this.getCategories();
            const id = name.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '');
            
            if (categories.find(c => c.id === id)) {
                return { success: false, error: 'La categoría ya existe' };
            }
            
            const category = { id, name, createdAt: Date.now() };
            categories.push(category);
            this.saveCategories(categories);
            return { success: true, category };
        },

        deleteCategory(id) {
            const products = this.getProducts();
            if (products.some(p => p.category === id)) {
                return { success: false, error: 'Hay productos usando esta categoría' };
            }
            const categories = this.getCategories().filter(c => c.id !== id);
            this.saveCategories(categories);
            return { success: true };
        },

        // Slides
        getSlides() {
            return safeJSONParse(localStorage.getItem(KEYS.SLIDES), []);
        },

        saveSlides(slides) {
            localStorage.setItem(KEYS.SLIDES, JSON.stringify(slides));
            return true;
        },

        addSlide(slide) {
            const slides = this.getSlides();
            slide.id = generateId('slide');
            slide.createdAt = Date.now();
            slides.push(slide);
            this.saveSlides(slides);
            return slide;
        },

        deleteSlide(id) {
            const slides = this.getSlides().filter(s => s.id !== id);
            return this.saveSlides(slides);
        },

        // Carrito
        getCart() {
            return safeJSONParse(localStorage.getItem(KEYS.CART), []);
        },

        saveCart(cart) {
            localStorage.setItem(KEYS.CART, JSON.stringify(cart));
            return true;
        },

        clearCart() {
            localStorage.removeItem(KEYS.CART);
        },

        // Configuración
        getSettings() {
            return safeJSONParse(localStorage.getItem(KEYS.SETTINGS), {
                shopCoords: DEFAULT_COORDS,
                shippingCostPerKm: 650,
                phoneNumber: '50686053613'
            });
        },

        saveSettings(settings) {
            localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
        },

        // Compresión de imágenes
        async compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
            return new Promise((resolve, reject) => {
                if (!file.type.match(/image\/(jpeg|png|jpg)/)) {
                    reject(new Error('Formato no válido. Use JPG o PNG.'));
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        let { width, height } = img;
                        
                        // Calcular nuevas dimensiones manteniendo aspecto
                        if (width > maxWidth) {
                            height = Math.round(height * maxWidth / width);
                            width = maxWidth;
                        }
                        if (height > maxHeight) {
                            width = Math.round(width * maxHeight / height);
                            height = maxHeight;
                        }

                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        
                        // Fondo blanco para PNG con transparencia
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, width, height);
                        ctx.drawImage(img, 0, 0, width, height);

                        const compressed = canvas.toDataURL('image/jpeg', quality);
                        resolve(compressed);
                    };
                    img.onerror = () => reject(new Error('Error al cargar imagen'));
                    img.src = e.target.result;
                };
                reader.onerror = () => reject(new Error('Error al leer archivo'));
                reader.readAsDataURL(file);
            });
        },

        // Exportar/Importar
        exportAll() {
            const data = {
                version: '2.0',
                exportedAt: new Date().toISOString(),
                products: this.getProducts(),
                categories: this.getCategories(),
                slides: this.getSlides(),
                settings: this.getSettings()
            };
            return JSON.stringify(data, null, 2);
        },

        importAll(jsonString) {
            try {
                const data = JSON.parse(jsonString);
                if (!data.products || !Array.isArray(data.products)) {
                    throw new Error('Formato inválido: faltan productos');
                }

                // Confirmar si hay datos existentes
                const existing = this.getProducts().length;
                if (existing > 0 && !confirm(
                    `⚠️ ATENCIÓN\n\nExisten ${existing} productos actuales.\n\n` +
                    `Se reemplazarán por:\n` +
                    `• ${data.products.length} productos\n` +
                    `• ${(data.categories || []).length} categorías\n` +
                    `• ${(data.slides || []).length} slides\n\n` +
                    `¿Continuar?`
                )) {
                    return { success: false, cancelled: true };
                }

                this.saveProducts(data.products);
                if (data.categories) this.saveCategories(data.categories);
                if (data.slides) this.saveSlides(data.slides);
                if (data.settings) this.saveSettings(data.settings);

                localStorage.setItem(KEYS.LAST_BACKUP, new Date().toISOString());

                return {
                    success: true,
                    stats: {
                        products: data.products.length,
                        categories: (data.categories || []).length,
                        slides: (data.slides || []).length
                    }
                };
            } catch (e) {
                return { success: false, error: e.message };
            }
        },

        // Limpieza
        clearAll() {
            Object.values(KEYS).forEach(key => localStorage.removeItem(key));
            localStorage.removeItem('flor_sb_version');
        },

        clearImagesOnly() {
            const products = this.getProducts().map(p => ({ ...p, image: null }));
            const slides = this.getSlides().map(s => ({ ...s, image: null }));
            this.saveProducts(products);
            this.saveSlides(slides);
            return true;
        },

        // Estadísticas
        getStats() {
            const products = this.getProducts();
            return {
                totalProducts: products.length,
                activeProducts: products.filter(p => p.isActive).length,
                totalCategories: this.getCategories().length,
                totalSlides: this.getSlides().length,
                storageUsed: this.getStorageSize()
            };
        },

        getStorageSize() {
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key) && key.startsWith('flor_sb')) {
                    total += localStorage[key].length * 2;
                }
            }
            return (total / 1024).toFixed(2);
        }
    };
})();

// Auto-inicializar
if (typeof window !== 'undefined') {
    window.DB = DB;
    document.addEventListener('DOMContentLoaded', () => DB.init());
}
