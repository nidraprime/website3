// ─── Auth Guard ────────────────────────────────────────────────────────────
const token      = localStorage.getItem('customerToken');
const custName   = localStorage.getItem('customerName') || 'Customer';
const custId     = localStorage.getItem('customerId')   || '';

if (!token) {
  window.location.href = '/customer_login.html';
}

// ─── Globals ────────────────────────────────────────────────────────────────
let purchasesData    = [];
let serviceRequests  = []; // track submitted in this session

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatPrice(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysToText(days) {
  if (days <= 0)    return 'Expired';
  if (days < 365)   return `${days} days left`;
  const yrs = Math.floor(days / 365);
  const rem = days % 365;
  return `${yrs}yr ${rem}d left`;
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = `toast ${type} show`;
  setTimeout(() => { t.className = 'toast'; }, 3500);
}

// ─── Init ────────────────────────────────────────────────────────────────────
function init() {
  // Fill sidebar & greeting
  document.getElementById('sidebarName').textContent    = custName;
  document.getElementById('sidebarId').textContent      = `ID: ${custId}`;
  document.getElementById('dashGreeting').textContent   =
    `Welcome back, ${custName}! Here's your sleep portfolio.`;

  loadPurchases();
}

// ─── Load Purchases ──────────────────────────────────────────────────────────
async function loadPurchases() {
  try {
    const res  = await fetch('/customer-purchases', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (res.status === 401 || !data.success) {
      logout();
      return;
    }

    purchasesData = data.purchases || [];
    renderStats();
    renderPurchasesTable();
    renderWarrantyCards();
    populateServiceDropdown();

  } catch {
    document.getElementById('purchasesBody').innerHTML = `
      <tr><td colspan="7">
        <div class="empty-state" style="padding:2rem;">
          <div class="empty-state-icon">⚠️</div>
          <h3>Could Not Load Data</h3>
          <p>Please ensure the server is running.</p>
        </div>
      </td></tr>`;
  }
}

// ─── Stats ───────────────────────────────────────────────────────────────────
function renderStats() {
  const total   = purchasesData.length;
  const active  = purchasesData.filter(p => p.warrantyStatus === 'Valid').length;
  const amount  = purchasesData.reduce((sum, p) => sum + Number(p.price), 0);

  document.getElementById('statTotal').textContent  = total;
  document.getElementById('statActive').textContent = active;
  document.getElementById('statAmount').textContent = formatPrice(amount);
}

// ─── Purchases Table ─────────────────────────────────────────────────────────
function renderPurchasesTable() {
  const tbody = document.getElementById('purchasesBody');

  if (!purchasesData.length) {
    tbody.innerHTML = `
      <tr><td colspan="7">
        <div class="empty-state" style="padding:2.5rem;">
          <div class="empty-state-icon">🛏️</div>
          <h3>No Purchases Found</h3>
          <p>You have no recorded purchases yet. <a href="/products.html" style="color:var(--gold-deep);">Browse products →</a></p>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = purchasesData.map(p => {
    const warrantyBadge = p.warrantyStatus === 'Valid'
      ? `<span class="badge badge-green">✓ Valid</span>`
      : `<span class="badge badge-red">✗ Expired</span>`;

    const daysText = daysToText(p.daysRemaining);

    return `
      <tr>
        <td><span style="font-weight:600;color:var(--teal-dark);">${p.id}</span></td>
        <td>
          <div style="font-weight:600;color:var(--text-dark);font-size:0.88rem;">${p.productName}</div>
          <div style="font-size:0.75rem;color:var(--text-light);">Purchased: ${formatDate(p.purchaseDate)}</div>
        </td>
        <td style="font-weight:600;">${formatPrice(p.price)}</td>
        <td>${formatDate(p.purchaseDate)}</td>
        <td>
          <div style="font-size:0.82rem;font-weight:600;">${p.warrantyYears}-Year</div>
          <div style="font-size:0.75rem;color:var(--text-light);">Expires: ${formatDate(p.warrantyExpiry)}</div>
          <div style="font-size:0.73rem;color:${p.daysRemaining > 180 ? '#2e7d32' : '#c62828'};font-weight:600;">${daysText}</div>
        </td>
        <td>${warrantyBadge}</td>
        <td>
          <button
            class="btn btn-dark btn-sm"
            onclick="openServiceRequest('${p.id}')"
            ${p.warrantyStatus !== 'Valid' ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}
          >
            🔧 Service
          </button>
        </td>
      </tr>`;
  }).join('');
}

// ─── Warranty Cards ──────────────────────────────────────────────────────────
function renderWarrantyCards() {
  const container = document.getElementById('warrantyContent');

  if (!purchasesData.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🛡️</div>
        <h3>No Warranties Found</h3>
        <p>Purchase a NidraPrime mattress to activate your warranty.</p>
      </div>`;
    return;
  }

  container.innerHTML = purchasesData.map(p => {
    const isValid   = p.warrantyStatus === 'Valid';
    const pct       = isValid
      ? Math.min(100, Math.round((p.daysRemaining / (p.warrantyYears * 365)) * 100))
      : 0;
    const barColor  = pct > 50 ? '#2e7d32' : pct > 20 ? '#f57f17' : '#c62828';

    return `
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:1.5rem;margin-bottom:1rem;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1rem;margin-bottom:1rem;">
          <div>
            <div style="font-family:'Playfair Display',serif;font-weight:600;font-size:1.05rem;color:var(--text-dark);">${p.productName}</div>
            <div style="font-size:0.78rem;color:var(--text-light);margin-top:2px;">Order: ${p.id} · Purchased: ${formatDate(p.purchaseDate)}</div>
          </div>
          <div style="text-align:right;">
            ${isValid
              ? `<span class="badge badge-green" style="font-size:0.78rem;">✓ Warranty Active</span>`
              : `<span class="badge badge-red" style="font-size:0.78rem;">✗ Warranty Expired</span>`
            }
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1rem;margin-bottom:1rem;">
          <div>
            <div style="font-size:0.68rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-light);margin-bottom:2px;">Coverage</div>
            <div style="font-weight:600;font-size:0.9rem;">${p.warrantyYears}-Year Warranty</div>
          </div>
          <div>
            <div style="font-size:0.68rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-light);margin-bottom:2px;">Expiry Date</div>
            <div style="font-weight:600;font-size:0.9rem;">${formatDate(p.warrantyExpiry)}</div>
          </div>
          <div>
            <div style="font-size:0.68rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-light);margin-bottom:2px;">Remaining</div>
            <div style="font-weight:600;font-size:0.9rem;color:${barColor};">${daysToText(p.daysRemaining)}</div>
          </div>
        </div>
        <!-- Progress Bar -->
        <div style="background:var(--border);border-radius:50px;height:8px;overflow:hidden;">
          <div style="height:100%;background:${barColor};width:${pct}%;border-radius:50px;transition:width 0.8s ease;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.7rem;color:var(--text-light);margin-top:4px;">
          <span>Purchased ${formatDate(p.purchaseDate)}</span>
          <span>${pct}% remaining</span>
        </div>
      </div>`;
  }).join('');
}

// ─── Service Request ─────────────────────────────────────────────────────────
function populateServiceDropdown() {
  const sel   = document.getElementById('servicePurchaseSelect');
  const valid = purchasesData.filter(p => p.warrantyStatus === 'Valid');

  sel.innerHTML = '<option value="">-- Select your mattress purchase --</option>' +
    valid.map(p => `<option value="${p.id}">${p.id} — ${p.productName}</option>`).join('');
}

function openServiceRequest(purchaseId) {
  showSection('service', null);
  // Highlight the relevant sidebar link
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  const serviceLink = document.querySelector('.sidebar-nav a[onclick*="service"]');
  if (serviceLink) serviceLink.classList.add('active');

  setTimeout(() => {
    const sel = document.getElementById('servicePurchaseSelect');
    if (sel) sel.value = purchaseId;
  }, 50);
}

async function submitServiceRequest() {
  const purchaseId = document.getElementById('servicePurchaseSelect').value;
  const issue      = document.getElementById('serviceIssue').value.trim();
  const errBox     = document.getElementById('serviceError');
  const sucBox     = document.getElementById('serviceSuccess');

  errBox.style.display = 'none';
  sucBox.style.display = 'none';

  if (!purchaseId) {
    errBox.textContent    = '⚠️ Please select a purchase.';
    errBox.style.display  = 'block';
    return;
  }
  if (!issue) {
    errBox.textContent    = '⚠️ Please describe the issue.';
    errBox.style.display  = 'block';
    return;
  }

  const btn = document.querySelector('#section-service .btn-primary');
  const origText = btn.textContent;
  btn.textContent = 'Submitting...';
  btn.disabled    = true;

  try {
    const res  = await fetch('/request-service', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ purchaseId, issue })
    });
    const data = await res.json();

    if (data.success) {
      sucBox.textContent   = `✅ Service request submitted! Your request ID is: ${data.requestId}`;
      sucBox.style.display = 'block';
      document.getElementById('servicePurchaseSelect').value = '';
      document.getElementById('serviceIssue').value          = '';
      showToast(`Request ${data.requestId} submitted successfully!`, 'success');

      // Add to local service history
      serviceRequests.push({
        id:          data.requestId,
        purchaseId,
        issue,
        status:      'Pending',
        createdAt:   new Date().toISOString().split('T')[0]
      });
      renderServiceHistory();
    } else {
      errBox.textContent   = '⚠️ ' + (data.message || 'Could not submit request.');
      errBox.style.display = 'block';
    }
  } catch {
    errBox.textContent   = '⚠️ Server error. Please try again.';
    errBox.style.display = 'block';
  } finally {
    btn.textContent = origText;
    btn.disabled    = false;
  }
}

function renderServiceHistory() {
  const cont = document.getElementById('serviceHistoryContent');
  if (!serviceRequests.length) {
    cont.innerHTML = `
      <div class="empty-state" style="padding:2rem;">
        <div class="empty-state-icon">🔧</div>
        <h3>No Service Requests</h3>
        <p>Requests you raise in this session will appear here.</p>
      </div>`;
    return;
  }

  cont.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Request ID</th>
            <th>Purchase ID</th>
            <th>Issue</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${serviceRequests.map(r => `
            <tr>
              <td style="font-weight:700;color:var(--teal-dark);">${r.id}</td>
              <td>${r.purchaseId}</td>
              <td style="max-width:240px;font-size:0.83rem;">${r.issue}</td>
              <td>${r.createdAt}</td>
              <td><span class="badge badge-orange">⏳ Pending</span></td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

// ─── Tab Navigation ──────────────────────────────────────────────────────────
function showSection(name, linkEl) {
  document.querySelectorAll('.tab-section').forEach(s => s.style.display = 'none');
  const sec = document.getElementById(`section-${name}`);
  if (sec) sec.style.display = 'block';

  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  if (linkEl) linkEl.classList.add('active');
}

// ─── Logout ──────────────────────────────────────────────────────────────────
function logout() {
  localStorage.removeItem('customerToken');
  localStorage.removeItem('customerName');
  localStorage.removeItem('customerId');
  window.location.href = '/customer_login.html';
}

// ─── Boot ────────────────────────────────────────────────────────────────────
init();
