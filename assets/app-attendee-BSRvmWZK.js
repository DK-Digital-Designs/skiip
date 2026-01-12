import{S as d}from"./storage-DkYz1-e1.js";document.addEventListener("DOMContentLoaded",()=>{d.init(),E()});function E(){const t=window.location.pathname;t.endsWith("app/index.html")||t.endsWith("app/")?I():t.endsWith("menu.html")?k():t.endsWith("queue.html")?x():t.endsWith("orders.html")&&C()}function I(){const t=document.getElementById("event-selector"),o=document.getElementById("active-event"),e=d.get("EVENTS"),n=localStorage.getItem("skiip_selected_event");e.forEach(s=>{const c=document.createElement("option");c.value=s.id,c.textContent=s.name,s.id===n&&(c.selected=!0),t.appendChild(c)});const i=()=>{const s=e.find(c=>c.id===t.value);o.textContent=s?s.name:"Select Event",localStorage.setItem("skiip_selected_event",t.value),$()};t.addEventListener("change",i),i()}function $(){const t=localStorage.getItem("skiip_selected_event"),o=d.get("VENDORS").filter(n=>n.eventId===t),e=d.get("QUEUE_STATE");if(o.length>0){const n=o[0],i=e[n.id]||{nowServing:0};document.getElementById("serving-highlight-vendor").textContent=n.name,document.getElementById("serving-highlight-token").textContent=`A-${i.nowServing}`}}let a=[];function k(){var f;const t=localStorage.getItem("skiip_selected_event"),o=d.get("VENDORS").filter(l=>l.eventId===t),e=d.get("MENU"),n=(f=d.get("EVENTS").find(l=>l.id===t))==null?void 0:f.name;document.getElementById("current-festival-name").textContent=n||"Unknown Festival";const i=document.getElementById("vendor-list"),s=document.getElementById("menu-container");o.forEach((l,y)=>{const r=document.createElement("div");r.className=`filter-chip ${y===0?"active":""}`,r.textContent=l.name,r.onclick=()=>{document.querySelectorAll(".filter-chip").forEach(m=>m.classList.remove("active")),r.classList.add("active"),c(l.id)},i.appendChild(r)}),o.length>0&&c(o[0].id);function c(l){const y=e.find(r=>r.vendorId===l);if(s.innerHTML="",!y){s.innerHTML='<p class="text-center text-muted">No items available for this vendor.</p>';return}y.items.forEach(r=>{const m=document.createElement("div");m.className="menu-item",m.innerHTML=`
        <div style="flex: 1;">
          <h4 style="margin-bottom: 4px;">${r.name}</h4>
          <p class="text-muted" style="font-size: 14px;">$${r.price.toFixed(2)}</p>
        </div>
        <button class="btn btn-primary add-to-cart" style="padding: 8px 16px; font-size: 14px; border-radius: 8px;">Add</button>
      `,m.querySelector(".add-to-cart").onclick=()=>b(r,l),s.appendChild(m)})}const g=document.getElementById("cart-summary"),p=document.getElementById("cart-drawer"),u=document.getElementById("cart-backdrop");g.onclick=()=>{p.classList.add("open"),u.style.display="block",h()},[document.getElementById("close-cart"),u].forEach(l=>{l.onclick=()=>{p.classList.remove("open"),u.style.display="none"}}),document.getElementById("checkout-btn").onclick=w}function b(t,o){if(a.length>0&&a[0].vendorId!==o){if(!confirm("This will clear your current cart from another vendor. Continue?"))return;a=[]}const e=a.find(n=>n.id===t.id);e?e.qty++:a.push({...t,vendorId:o,qty:1}),v()}function v(){const t=document.getElementById("cart-summary"),o=document.getElementById("cart-count"),e=document.getElementById("cart-total");if(a.length===0){t.style.display="none";return}t.style.display="flex";const n=a.reduce((s,c)=>s+c.qty,0),i=a.reduce((s,c)=>s+c.price*c.qty,0);o.textContent=`${n} Item${n>1?"s":""}`,e.textContent=i.toFixed(2)}function h(){const t=document.getElementById("cart-items");t.innerHTML="",a.forEach(e=>{const n=document.createElement("div");n.className="flex justify-between items-center mb-16",n.innerHTML=`
      <div>
        <h4 style="font-size: 15px;">${e.name}</h4>
        <p class="text-muted" style="font-size: 13px;">$${e.price.toFixed(2)} x ${e.qty}</p>
      </div>
      <div class="flex items-center gap-16">
        <button class="text-accent" style="background: none; font-size: 20px;" onclick="changeQty('${e.id}', -1)">−</button>
        <span>${e.qty}</span>
        <button class="text-accent" style="background: none; font-size: 20px;" onclick="changeQty('${e.id}', 1)">+</button>
      </div>
    `,t.appendChild(n)});const o=a.reduce((e,n)=>e+n.price*n.qty,0);document.getElementById("drawer-subtotal").textContent=`$${o.toFixed(2)}`,document.getElementById("drawer-total").textContent=`$${(o+.5).toFixed(2)}`}window.changeQty=(t,o)=>{const e=a.find(n=>n.id===t);e&&(e.qty+=o,e.qty<=0&&(a=a.filter(n=>n.id!==t))),h(),v(),a.length===0&&(document.getElementById("cart-drawer").classList.remove("open"),document.getElementById("cart-backdrop").style.display="none")};function w(){var g,p;const t=localStorage.getItem("skiip_selected_event"),o=a[0].vendorId,e=a.reduce((u,f)=>u+f.price*f.qty,0)+.5,n=d.advanceQueue(o,"token"),s=`${((g=d.get("VENDORS").find(u=>u.id===o))==null?void 0:g.name.charAt(0).toUpperCase())||"A"}-${n.lastToken}`,c={eventId:t,vendorId:o,vendorName:(p=d.get("VENDORS").find(u=>u.id===o))==null?void 0:p.name,items:[...a],total:e,status:"Placed",token:s};d.saveOrder(c),a=[],v(),window.location.href="queue.html"}function x(){const t=document.getElementById("queue-container"),o=d.getOrders().filter(e=>e.status!=="Collected"&&e.status!=="Refunded");o.length!==0&&(t.innerHTML="",o.forEach(e=>{const n=d.getQueueState(e.vendorId),i=parseInt(e.token.split("-")[1])-n.nowServing,s=e.status==="Ready",c=document.createElement("div");c.className=`queue-status-card mb-40 ${s?"ready":""}`,c.innerHTML=`
      <div class="text-accent" style="font-weight: 700; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">${e.vendorName}</div>
      <h2 style="font-size: 20px;">${s?"Ready for Pickup!":"In the Queue"}</h2>
      <div class="queue-number">${e.token}</div>
      <p class="text-muted" style="margin-bottom: 24px;">
        ${s?"Head to the Skiip Lane now.":`Order ${e.status.toLowerCase()} • <strong>${i>0?i:0}</strong> orders ahead`}
      </p>
      <div class="now-serving-banner">
        <span style="font-size: 14px; font-weight: 500;">Current Serving</span>
        <span class="text-accent" style="font-weight: 800;">#${e.token.split("-")[0]}-${n.nowServing}</span>
      </div>
      ${s?`<button class="btn btn-primary" onclick="markCollected('${e.id}')" style="width: 100%;">I've Collected My Order</button>`:""}
    `,t.appendChild(c)}))}window.markCollected=t=>{d.updateOrderStatus(t,"Collected"),x()};function C(){const t=document.getElementById("history-container"),o=d.getOrders().reverse();if(o.length===0){t.innerHTML='<p class="text-center text-muted" style="padding-top: 40px;">No orders found.</p>';return}o.forEach(e=>{const n=new Date(e.createdAt).toLocaleDateString(),i=document.createElement("div");i.className="card mb-12",i.style.padding="16px",i.innerHTML=`
      <div class="flex justify-between items-start mb-8">
        <div>
          <h4 style="font-size: 14px;">${e.vendorName}</h4>
          <p class="text-muted" style="font-size: 12px;">${n} • ${e.items.length} item(s)</p>
        </div>
        <div style="font-size: 12px; padding: 4px 8px; border-radius: 4px; background: var(--stroke); color: ${e.status==="Collected"?"#22c55e":"var(--muted)"}; font-weight: 600;">
          ${e.status}
        </div>
      </div>
      <div class="flex justify-between items-center" style="font-weight: 700; font-size: 14px;">
        <span>Token: ${e.token}</span>
        <span class="text-accent">$${e.total.toFixed(2)}</span>
      </div>
    `,t.appendChild(i)})}
