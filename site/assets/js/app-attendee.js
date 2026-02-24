import { Storage } from './storage.js';

document.addEventListener('DOMContentLoaded', () => {
    Storage.init();
    initAppRouter();
});

function initAppRouter() {
    const path = window.location.pathname;

    if (path.endsWith('app/index.html') || path.endsWith('app/')) {
        initHome();
    } else if (path.endsWith('menu.html')) {
        initMenu();
    } else if (path.endsWith('queue.html')) {
        initQueue();
    } else if (path.endsWith('orders.html')) {
        initHistory();
    }
}

// --- Home Logic ---
function initHome() {
    const selector = document.getElementById('event-selector');
    const activeEventDisplay = document.getElementById('active-event');
    const events = Storage.get('EVENTS');

    const currentEventId = localStorage.getItem('skiip_selected_event');

    events.forEach(ev => {
        const opt = document.createElement('option');
        opt.value = ev.id;
        opt.textContent = ev.name;
        if (ev.id === currentEventId) opt.selected = true;
        selector.appendChild(opt);
    });

    const updateDisplay = () => {
        const selected = events.find(e => e.id === selector.value);
        activeEventDisplay.textContent = selected ? selected.name : 'Select Event';
        localStorage.setItem('skiip_selected_event', selector.value);

        // Update highlight
        updateLiveHighlight();
    };

    selector.addEventListener('change', updateDisplay);
    updateDisplay();
}

function updateLiveHighlight() {
    const eventId = localStorage.getItem('skiip_selected_event');
    const vendors = Storage.get('VENDORS').filter(v => v.eventId === eventId);
    const states = Storage.get('QUEUE_STATE');

    if (vendors.length > 0) {
        const v = vendors[0];
        const state = states[v.id] || { nowServing: 0 };
        document.getElementById('serving-highlight-vendor').textContent = v.name;
        document.getElementById('serving-highlight-token').textContent = `A-${state.nowServing}`;
    }
}

// --- Menu & Cart Logic ---
let cart = [];

function initMenu() {
    const eventId = localStorage.getItem('skiip_selected_event');
    const vendors = Storage.get('VENDORS').filter(v => v.eventId === eventId);
    const menuData = Storage.get('MENU');

    const festivalName = Storage.get('EVENTS').find(e => e.id === eventId)?.name;
    document.getElementById('current-festival-name').textContent = festivalName || 'Unknown Festival';

    const vendorList = document.getElementById('vendor-list');
    const menuContainer = document.getElementById('menu-container');

    vendors.forEach((v, index) => {
        const chip = document.createElement('div');
        chip.className = `filter-chip ${index === 0 ? 'active' : ''}`;
        chip.textContent = v.name;
        chip.onclick = () => {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            renderMenu(v.id);
        };
        vendorList.appendChild(chip);
    });

    if (vendors.length > 0) renderMenu(vendors[0].id);

    function renderMenu(vendorId) {
        const vendorMenu = menuData.find(m => m.vendorId === vendorId);
        menuContainer.innerHTML = '';

        if (!vendorMenu) {
            menuContainer.innerHTML = '<p class="text-center text-muted">No items available for this vendor.</p>';
            return;
        }

        vendorMenu.items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'menu-item';
            el.innerHTML = `
        <div style="flex: 1;">
          <h4 style="margin-bottom: 4px;">${item.name}</h4>
          <p class="text-muted" style="font-size: 14px;">$${item.price.toFixed(2)}</p>
        </div>
        <button class="btn btn-primary add-to-cart" style="padding: 8px 16px; font-size: 14px; border-radius: 8px;">Add</button>
      `;
            el.querySelector('.add-to-cart').onclick = () => addToCart(item, vendorId);
            menuContainer.appendChild(el);
        });
    }

    // Cart Handlers
    const cartSummary = document.getElementById('cart-summary');
    const cartDrawer = document.getElementById('cart-drawer');
    const cartBackdrop = document.getElementById('cart-backdrop');

    cartSummary.onclick = () => {
        cartDrawer.classList.add('open');
        cartBackdrop.style.display = 'block';
        renderCart();
    };

    [document.getElementById('close-cart'), cartBackdrop].forEach(el => {
        el.onclick = () => {
            cartDrawer.classList.remove('open');
            cartBackdrop.style.display = 'none';
        };
    });

    document.getElementById('checkout-btn').onclick = placeOrder;
}

function addToCart(item, vendorId) {
    // Simple prototype: one vendor per order for simplicity
    if (cart.length > 0 && cart[0].vendorId !== vendorId) {
        if (!confirm('This will clear your current cart from another vendor. Continue?')) return;
        cart = [];
    }

    const existing = cart.find(i => i.id === item.id);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...item, vendorId, qty: 1 });
    }
    updateCartUI();
}

function updateCartUI() {
    const summary = document.getElementById('cart-summary');
    const countSpan = document.getElementById('cart-count');
    const totalSpan = document.getElementById('cart-total');

    if (cart.length === 0) {
        summary.style.display = 'none';
        return;
    }

    summary.style.display = 'flex';
    const count = cart.reduce((sum, i) => sum + i.qty, 0);
    const total = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

    countSpan.textContent = `${count} Item${count > 1 ? 's' : ''}`;
    totalSpan.textContent = total.toFixed(2);
}

function renderCart() {
    const container = document.getElementById('cart-items');
    container.innerHTML = '';

    cart.forEach(item => {
        const el = document.createElement('div');
        el.className = 'flex justify-between items-center mb-16';
        el.innerHTML = `
      <div>
        <h4 style="font-size: 15px;">${item.name}</h4>
        <p class="text-muted" style="font-size: 13px;">$${item.price.toFixed(2)} x ${item.qty}</p>
      </div>
      <div class="flex items-center gap-16">
        <button class="text-accent" style="background: none; font-size: 20px;" onclick="changeQty('${item.id}', -1)">−</button>
        <span>${item.qty}</span>
        <button class="text-accent" style="background: none; font-size: 20px;" onclick="changeQty('${item.id}', 1)">+</button>
      </div>
    `;
        container.appendChild(el);
    });

    const subtotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    document.getElementById('drawer-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('drawer-total').textContent = `$${(subtotal + 0.5).toFixed(2)}`;
}

window.changeQty = (id, delta) => {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
    }
    renderCart();
    updateCartUI();
    if (cart.length === 0) {
        document.getElementById('cart-drawer').classList.remove('open');
        document.getElementById('cart-backdrop').style.display = 'none';
    }
};

function placeOrder() {
    const eventId = localStorage.getItem('skiip_selected_event');
    const vendorId = cart[0].vendorId;
    const total = cart.reduce((sum, i) => sum + (i.price * i.qty), 0) + 0.5;

    // Get next token
    const state = Storage.advanceQueue(vendorId, 'token');
    const tokenPrefix = Storage.get('VENDORS').find(v => v.id === vendorId)?.name.charAt(0).toUpperCase() || 'A';
    const token = `${tokenPrefix}-${state.lastToken}`;

    const order = {
        eventId,
        vendorId,
        vendorName: Storage.get('VENDORS').find(v => v.id === vendorId)?.name,
        items: [...cart],
        total,
        status: 'Placed',
        token
    };

    Storage.saveOrder(order);
    cart = [];
    updateCartUI();
    window.location.href = 'queue.html';
}

// --- Queue Logic ---
function initQueue() {
    const container = document.getElementById('queue-container');
    const orders = Storage.getOrders().filter(o => o.status !== 'Collected' && o.status !== 'Refunded');

    if (orders.length === 0) return;

    container.innerHTML = '';
    orders.forEach(order => {
        const queueState = Storage.getQueueState(order.vendorId);
        const pos = parseInt(order.token.split('-')[1]) - queueState.nowServing;
        const isReady = order.status === 'Ready';

        const el = document.createElement('div');
        el.className = `queue-status-card mb-40 ${isReady ? 'ready' : ''}`;
        el.innerHTML = `
      <div class="text-accent" style="font-weight: 700; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">${order.vendorName}</div>
      <h2 style="font-size: 20px;">${isReady ? 'Ready for Pickup!' : 'In the Queue'}</h2>
      <div class="queue-number">${order.token}</div>
      <p class="text-muted" style="margin-bottom: 24px;">
        ${isReady ? 'Head to the Skiip Lane now.' : `Order ${order.status.toLowerCase()} • <strong>${pos > 0 ? pos : 0}</strong> orders ahead`}
      </p>
      <div class="now-serving-banner">
        <span style="font-size: 14px; font-weight: 500;">Current Serving</span>
        <span class="text-accent" style="font-weight: 800;">#${order.token.split('-')[0]}-${queueState.nowServing}</span>
      </div>
      ${isReady ? `<button class="btn btn-primary" onclick="markCollected('${order.id}')" style="width: 100%;">I've Collected My Order</button>` : ''}
    `;
        container.appendChild(el);
    });
}

window.markCollected = (id) => {
    Storage.updateOrderStatus(id, 'Collected');
    initQueue();
};

// --- History Logic ---
function initHistory() {
    const container = document.getElementById('history-container');
    const orders = Storage.getOrders().reverse();

    if (orders.length === 0) {
        container.innerHTML = '<p class="text-center text-muted" style="padding-top: 40px;">No orders found.</p>';
        return;
    }

    orders.forEach(order => {
        const date = new Date(order.createdAt).toLocaleDateString();
        const el = document.createElement('div');
        el.className = 'card mb-12';
        el.style.padding = '16px';
        el.innerHTML = `
      <div class="flex justify-between items-start mb-8">
        <div>
          <h4 style="font-size: 14px;">${order.vendorName}</h4>
          <p class="text-muted" style="font-size: 12px;">${date} • ${order.items.length} item(s)</p>
        </div>
        <div style="font-size: 12px; padding: 4px 8px; border-radius: 4px; background: var(--stroke); color: ${order.status === 'Collected' ? '#22c55e' : 'var(--muted)'}; font-weight: 600;">
          ${order.status}
        </div>
      </div>
      <div class="flex justify-between items-center" style="font-weight: 700; font-size: 14px;">
        <span>Token: ${order.token}</span>
        <span class="text-accent">$${order.total.toFixed(2)}</span>
      </div>
    `;
        container.appendChild(el);
    });
}
