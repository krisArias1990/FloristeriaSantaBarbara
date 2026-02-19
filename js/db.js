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
            { id: '
