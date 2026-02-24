/**
 * Skiip Storage Helper
 * Handles all localStorage operations and initial seed data
 */

const STORAGE_KEYS = {
    EVENTS: 'skiip_events',
    VENDORS: 'skiip_vendors',
    MENU: 'skiip_menu',
    ORDERS: 'skiip_orders',
    CONTACT: 'skiip_contact_messages',
    WAITLIST: 'skiip_waitlist',
    QUEUE_STATE: 'skiip_queue_state'
};

const DEFAULT_DATA = {
    EVENTS: [
        { id: 'ev1', name: 'Summer Beats 2026', location: 'Brighton Beach', date: '2026-07-15' },
        { id: 'ev2', name: 'Neon Nights', location: 'London Docklands', date: '2026-08-20' }
    ],
    VENDORS: [
        { id: 'v1', eventId: 'ev1', name: 'The Burger Joint', category: 'Food' },
        { id: 'v2', eventId: 'ev1', name: 'Liquid Gold', category: 'Drinks' },
        { id: 'v3', eventId: 'ev2', name: 'Taco Island', category: 'Food' }
    ],
    MENU: [
        {
            vendorId: 'v1', items: [
                { id: 'm1', name: 'Classic Cheeseburger', price: 9.50, category: 'Mains' },
                { id: 'm2', name: 'Veggie Burger', price: 10.00, category: 'Mains' },
                { id: 'm3', name: 'Fries', price: 4.50, category: 'Sides' }
            ]
        },
        {
            vendorId: 'v2', items: [
                { id: 'm4', name: 'Craft Lager', price: 6.50, category: 'Beer' },
                { id: 'm5', name: 'Pale Ale', price: 7.00, category: 'Beer' },
                { id: 'm6', name: 'Soft Drink', price: 3.50, category: 'Soft' }
            ]
        }
    ],
    QUEUE_STATE: {
        'v1': { nowServing: 100, lastToken: 104 },
        'v2': { nowServing: 50, lastToken: 52 },
        'v3': { nowServing: 20, lastToken: 20 }
    }
};

export const Storage = {
    init() {
        if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
            localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(DEFAULT_DATA.EVENTS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.VENDORS)) {
            localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(DEFAULT_DATA.VENDORS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.MENU)) {
            localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(DEFAULT_DATA.MENU));
        }
        if (!localStorage.getItem(STORAGE_KEYS.QUEUE_STATE)) {
            localStorage.setItem(STORAGE_KEYS.QUEUE_STATE, JSON.stringify(DEFAULT_DATA.QUEUE_STATE));
        }
        if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
            localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
        }
    },

    get(key) {
        const data = localStorage.getItem(STORAGE_KEYS[key]);
        return data ? JSON.parse(data) : null;
    },

    save(key, data) {
        localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
    },

    // Specialized helpers
    getOrders() { return this.get('ORDERS') || []; },
    saveOrder(order) {
        const orders = this.getOrders();
        orders.push({
            ...order,
            id: 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            createdAt: new Date().toISOString()
        });
        this.save('ORDERS', orders);
        return orders[orders.length - 1];
    },

    updateOrderStatus(orderId, status) {
        const orders = this.getOrders();
        const index = orders.findIndex(o => o.id === orderId);
        if (index !== -1) {
            orders[index].status = status;
            this.save('ORDERS', orders);
        }
    },

    getQueueState(vendorId) {
        const states = this.get('QUEUE_STATE');
        return states[vendorId] || { nowServing: 1, lastToken: 1 };
    },

    advanceQueue(vendorId, type = 'serving') {
        const states = this.get('QUEUE_STATE');
        if (type === 'serving') {
            states[vendorId].nowServing++;
        } else {
            states[vendorId].lastToken++;
        }
        this.save('QUEUE_STATE', states);
        return states[vendorId];
    },

    addToWaitlist(entry) {
        const list = this.get('WAITLIST') || [];
        list.push({ ...entry, id: Date.now(), createdAt: new Date().toISOString() });
        this.save('WAITLIST', list);
    },

    saveContactMessage(msg) {
        const list = this.get('CONTACT') || [];
        list.push({ ...msg, id: Date.now(), createdAt: new Date().toISOString() });
        this.save('CONTACT', list);
    },

    clearAll() {
        Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
        this.init();
    }
};
