import { Storage } from './storage.js';

document.addEventListener('DOMContentLoaded', () => {
    Storage.init();
    initVendorDashboard();
});

let currentVendorId = null;

function initVendorDashboard() {
    const login = document.getElementById('vendor-login');
    const vendors = Storage.get('VENDORS');

    vendors.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = v.name;
        login.appendChild(opt);
    });

    login.addEventListener('change', () => {
        currentVendorId = login.value;
        localStorage.setItem('skiip_vendor_id', currentVendorId);
        renderDashboard();
    });

    const savedId = localStorage.getItem('skiip_vendor_id');
    if (savedId) {
        login.value = savedId;
    }
    currentVendorId = login.value;

    document.getElementById('refresh-btn').onclick = renderDashboard;

    renderDashboard();

    // Auto-refresh every 10 seconds for prototype feel
    setInterval(renderDashboard, 10000);
}

function renderDashboard() {
    if (!currentVendorId) return;

    const orders = Storage.getOrders().filter(o => o.vendorId === currentVendorId);
    const queueState = Storage.getQueueState(currentVendorId);

    document.getElementById('now-serving-count').textContent = `#${currentVendorId.charAt(0).toUpperCase()}-${queueState.nowServing}`;

    // Update stats
    document.getElementById('count-new').textContent = orders.filter(o => o.status === 'Placed').length;
    document.getElementById('count-preparing').textContent = orders.filter(o => o.status === 'Preparing').length;
    document.getElementById('count-ready').textContent = orders.filter(o => o.status === 'Ready').length;

    const container = document.getElementById('orders-list');
    container.innerHTML = '';

    const activeOrders = orders.filter(o => o.status !== 'Collected' && o.status !== 'Refunded')
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    if (activeOrders.length === 0) {
        container.innerHTML = '<p class="text-center text-muted" style="padding: 40px;">No active orders.</p>';
        return;
    }

    activeOrders.forEach(order => {
        const el = document.createElement('div');
        el.className = 'order-row';

        const itemsList = order.items.map(i => `${i.qty}x ${i.name}`).join(', ');

        el.innerHTML = `
      <div style="font-weight: 800; font-size: 18px; color: var(--accent);">${order.token}</div>
      <div style="font-size: 14px;">${itemsList}</div>
      <div>
        <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
      </div>
      <div class="flex gap-8">
        ${getNextActionButton(order)}
      </div>
    `;
        container.appendChild(el);
    });
}

function getNextActionButton(order) {
    if (order.status === 'Placed') {
        return `<button class="btn btn-primary" style="padding: 8px 12px; font-size: 12px; border-radius: 6px;" onclick="updateStatus('${order.id}', 'Preparing')">Start Prep</button>`;
    }
    if (order.status === 'Preparing') {
        return `<button class="btn btn-primary" style="padding: 8px 12px; font-size: 12px; border-radius: 6px; background: #10b981;" onclick="updateStatus('${order.id}', 'Ready')">Mark Ready</button>`;
    }
    if (order.status === 'Ready') {
        return `<button class="btn btn-ghost" style="padding: 8px 12px; font-size: 12px; border-radius: 6px;" onclick="updateStatus('${order.id}', 'Collected')">Fulfill</button>`;
    }
    return '';
}

window.updateStatus = (orderId, status) => {
    Storage.updateOrderStatus(orderId, status);

    if (status === 'Ready') {
        // When marking an order as ready, we increment "now serving" for the vendor
        Storage.advanceQueue(currentVendorId, 'serving');
    }

    renderDashboard();
};
