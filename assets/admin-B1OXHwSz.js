import{S as d}from"./storage-DkYz1-e1.js";document.addEventListener("DOMContentLoaded",()=>{d.init(),c()});function c(){document.getElementById("admin-content");const a=document.querySelectorAll(".admin-menu button");a.forEach(t=>{t.onclick=()=>{a.forEach(e=>e.classList.remove("active")),t.classList.add("active"),s(t.getAttribute("data-view"))}}),document.getElementById("clear-demo-data").onclick=()=>{confirm("Are you sure you want to clear all demo data? This resets the prototype.")&&(d.clearAll(),window.location.reload())},s("events")}function s(a){const t=document.getElementById("admin-content");switch(t.innerHTML="",a){case"events":l(t);break;case"vendors":h(t);break;case"orders":m(t);break;case"leads":b(t);break;case"export":u(t);break}}function l(a){const t=d.get("EVENTS");a.innerHTML=`
    <h2 class="mb-40">Festivals & Events</h2>
    <table>
      <thead><tr><th>ID</th><th>Name</th><th>Location</th><th>Date</th></tr></thead>
      <tbody>
        ${t.map(e=>`<tr><td>${e.id}</td><td>${e.name}</td><td>${e.location}</td><td>${e.date}</td></tr>`).join("")}
      </tbody>
    </table>
  `}function h(a){const t=d.get("VENDORS"),e=d.get("EVENTS");a.innerHTML=`
    <h2 class="mb-40">Registered Vendors</h2>
    <table>
      <thead><tr><th>ID</th><th>Vendor Name</th><th>Event</th><th>Category</th></tr></thead>
      <tbody>
        ${t.map(n=>{const o=e.find(r=>r.id===n.eventId);return`<tr><td>${n.id}</td><td>${n.name}</td><td>${o?o.name:"Unknown"}</td><td>${n.category}</td></tr>`}).join("")}
      </tbody>
    </table>
  `}function m(a){const t=d.getOrders().reverse();a.innerHTML=`
    <h2 class="mb-40">System-wide Orders</h2>
    <table>
      <thead><tr><th>ID</th><th>Token</th><th>Vendor</th><th>Total</th><th>Status</th></tr></thead>
      <tbody>
        ${t.map(e=>`<tr><td>${e.id}</td><td>${e.token}</td><td>${e.vendorName}</td><td>$${e.total.toFixed(2)}</td><td><span class="status-badge" style="background: var(--stroke);">${e.status}</span></td></tr>`).join("")}
      </tbody>
    </table>
  `}function b(a){const t=d.get("CONTACT")||[],e=d.get("WAITLIST")||[];a.innerHTML=`
    <h2 class="mb-40">Contact Inquiries</h2>
    <table class="mb-40">
      <thead><tr><th>Name</th><th>Email</th><th>Subject</th><th>Date</th></tr></thead>
      <tbody>
        ${t.map(n=>`<tr><td>${n.firstName} ${n.lastName}</td><td>${n.email}</td><td>${n.subject}</td><td>${new Date(n.createdAt).toLocaleDateString()}</td></tr>`).join("")}
      </tbody>
    </table>
    <h2 class="mb-40">Waitlist Signups</h2>
    <table>
      <thead><tr><th>Name</th><th>Email</th><th>Date</th></tr></thead>
      <tbody>
        ${e.map(n=>`<tr><td>${n.name}</td><td>${n.email}</td><td>${new Date(n.createdAt).toLocaleDateString()}</td></tr>`).join("")}
      </tbody>
    </table>
  `}function u(a){a.innerHTML=`
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
  `}window.exportData=a=>{let t,e;if(a==="ORDERS")t=JSON.stringify(d.getOrders(),null,2),e="skiip_orders_export.json";else{const i=[...d.get("CONTACT")||[],...d.get("WAITLIST")||[]];t=JSON.stringify(i,null,2),e="skiip_leads_export.json"}const n=new Blob([t],{type:"application/json"}),o=URL.createObjectURL(n),r=document.createElement("a");r.href=o,r.download=e,r.click(),URL.revokeObjectURL(o)};
