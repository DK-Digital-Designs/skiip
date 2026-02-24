import { Storage } from './storage.js';

document.addEventListener('DOMContentLoaded', () => {
    Storage.init();
    initAdmin();
});

function initAdmin() {
    const content = document.getElementById('admin-content');
    const buttons = document.querySelectorAll('.admin-menu button');

    buttons.forEach(btn => {
        btn.onclick = () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderView(btn.getAttribute('data-view'));
        };
    });

    document.getElementById('clear-demo-data').onclick = () => {
        if (confirm('Are you sure you want to clear all demo data? This resets the prototype.')) {
            Storage.clearAll();
            window.location.reload();
        }
    };

    renderView('events');
}

function renderView(view) {
    const content = document.getElementById('admin-content');
    content.innerHTML = '';

    switch (view) {
        case 'events':
            renderEvents(content);
            break;
        case 'vendors':
            renderVendors(content);
            break;
        case 'orders':
            renderOrders(content);
            break;
        case 'leads':
            renderLeads(content);
            break;
        case 'export':
            renderExport(content);
            break;
    }
}

function renderEvents(container) {
    const events = Storage.get('EVENTS');
    container.innerHTML = `
    <h2 class="mb-40">Festivals & Events</h2>
    <table>
      <thead><tr><th>ID</th><th>Name</th><th>Location</th><th>Date</th></tr></thead>
      <tbody>
        ${events.map(ev => `<tr><td>${ev.id}</td><td>${ev.name}</td><td>${ev.location}</td><td>${ev.date}</td></tr>`).join('')}
      </tbody>
    </table>
  `;
}

function renderVendors(container) {
    const vendors = Storage.get('VENDORS');
    const events = Storage.get('EVENTS');
    container.innerHTML = `
    <h2 class="mb-40">Registered Vendors</h2>
    <table>
      <thead><tr><th>ID</th><th>Vendor Name</th><th>Event</th><th>Category</th></tr></thead>
      <tbody>
        ${vendors.map(v => {
        const ev = events.find(e => e.id === v.eventId);
        return `<tr><td>${v.id}</td><td>${v.name}</td><td>${ev ? ev.name : 'Unknown'}</td><td>${v.category}</td></tr>`;
    }).join('')}
      </tbody>
    </table>
  `;
}

function renderOrders(container) {
    const orders = Storage.getOrders().reverse();
    container.innerHTML = `
    <h2 class="mb-40">System-wide Orders</h2>
    <table>
      <thead><tr><th>ID</th><th>Token</th><th>Vendor</th><th>Total</th><th>Status</th></tr></thead>
      <tbody>
        ${orders.map(o => `<tr><td>${o.id}</td><td>${o.token}</td><td>${o.vendorName}</td><td>$${o.total.toFixed(2)}</td><td><span class="status-badge" style="background: var(--stroke);">${o.status}</span></td></tr>`).join('')}
      </tbody>
    </table>
  `;
}

function renderLeads(container) {
    const contact = Storage.get('CONTACT') || [];
    const waitlist = Storage.get('WAITLIST') || [];
    container.innerHTML = `
    <h2 class="mb-40">Contact Inquiries</h2>
    <table class="mb-40">
      <thead><tr><th>Name</th><th>Email</th><th>Subject</th><th>Date</th></tr></thead>
      <tbody>
        ${contact.map(c => `<tr><td>${c.firstName} ${c.lastName}</td><td>${c.email}</td><td>${c.subject}</td><td>${new Date(c.createdAt).toLocaleDateString()}</td></tr>`).join('')}
      </tbody>
    </table>
    <h2 class="mb-40">Waitlist Signups</h2>
    <table>
      <thead><tr><th>Name</th><th>Email</th><th>Date</th></tr></thead>
      <tbody>
        ${waitlist.map(w => `<tr><td>${w.name}</td><td>${w.email}</td><td>${new Date(w.createdAt).toLocaleDateString()}</td></tr>`).join('')}
      </tbody>
    </table>
  `;
}

function renderExport(container) {
    container.innerHTML = `
    <h2 class="mb-40">Data Management</h2>
    <div class="card mb-40">
       <h4>Export Orders</h4>
       <p class="text-muted mb-40">Download all order data for accounting and reporting.</p>
       <button class="btn btn-primary" onclick="window.exportData('ORDERS')">Download JSON</button>
    </div>
    <div class="card">
       <h4>Export Leads</h4>
       <p class="text-muted mb-40">Download contact messages and waitlist entries.</p>
       <button class="btn btn-ghost" onclick="window.exportData('LEADS')">Download CSV</button>
    </div>
  `;
}

window.exportData = (type) => {
    let data;
    let filename;

    if (type === 'ORDERS') {
        data = JSON.stringify(Storage.getOrders(), null, 2);
        filename = 'skiip_orders_export.json';
    } else {
        const leads = [...(Storage.get('CONTACT') || []), ...(Storage.get('WAITLIST') || [])];
        data = JSON.stringify(leads, null, 2); // Prototype: just using JSON for both for simplicity
        filename = 'skiip_leads_export.json';
    }

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};
