function formatPrice(n) {
  return '₹' + n.toLocaleString('en-IN');
}

function calcDiscount(orig, price) {
  return Math.round((1 - price / orig) * 100);
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
}

async function loadProduct() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    window.location.href = '/products.html';
    return;
  }

  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    if (!data.success) throw new Error();
    const product = data.products.find(p => p.id === parseInt(id));
    if (!product) throw new Error('Not found');
    renderProduct(product);
  } catch {
    document.getElementById('productContent').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🛏️</div>
        <h3>Product Not Found</h3>
        <p>This product may no longer be available. <a href="/products.html" style="color:var(--gold-deep);">Browse all products →</a></p>
      </div>`;
  }
}

function renderProduct(p) {
  document.title = `${p.name} — NidraPrime`;
  document.getElementById('breadcrumbName').textContent = p.name;

  const discount = Math.round((1 - p.price / p.originalPrice) * 100);
  const saving = p.originalPrice - p.price;

  const html = `
    <div class="product-detail-grid">
      <div>
        <img src="${p.image}" alt="${p.name}" class="product-img-main">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem;margin-top:1rem;">
          <div style="background:var(--gold-light);border-radius:10px;padding:1rem;text-align:center;">
            <div style="font-size:1.4rem;">🛡️</div>
            <div style="font-size:0.72rem;font-weight:700;color:var(--gold-deep);margin-top:4px;letter-spacing:0.04em;">${p.warranty} Warranty</div>
          </div>
          <div style="background:var(--gold-light);border-radius:10px;padding:1rem;text-align:center;">
            <div style="font-size:1.4rem;">🚚</div>
            <div style="font-size:0.72rem;font-weight:700;color:var(--gold-deep);margin-top:4px;letter-spacing:0.04em;">Free Delivery</div>
          </div>
          <div style="background:var(--gold-light);border-radius:10px;padding:1rem;text-align:center;">
            <div style="font-size:1.4rem;">✅</div>
            <div style="font-size:0.72rem;font-weight:700;color:var(--gold-deep);margin-top:4px;letter-spacing:0.04em;">CertiPUR Cert.</div>
          </div>
        </div>
      </div>

      <div>
        <span class="product-detail-badge">${p.category}</span>
        <h1 class="product-detail-name">${p.name}</h1>
        <p class="product-detail-tagline">${p.tagline}</p>

        <div class="product-rating" style="margin-bottom:1.5rem;">
          <span class="stars" style="font-size:1rem;">${renderStars(p.rating)}</span>
          <span class="rating-num">${p.rating}/5</span>
          <span class="rating-count">(${p.reviews} verified reviews)</span>
        </div>

        <div class="product-detail-price-wrap">
          <div class="product-detail-price">${formatPrice(p.price)}</div>
          <div class="product-detail-original">${formatPrice(p.originalPrice)}</div>
          <span class="product-detail-saving">Save ${discount}% (${formatPrice(saving)})</span>
        </div>

        <div class="product-description">${p.description}</div>

        <div class="product-specs">
          <div class="spec-item">
            <div class="spec-label">Size</div>
            <div class="spec-value">${p.size}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">Thickness</div>
            <div class="spec-value">${p.thickness}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">Warranty</div>
            <div class="spec-value">${p.warranty}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">Category</div>
            <div class="spec-value">${p.category}</div>
          </div>
        </div>

        <div class="layers-section">
          <div class="layers-title">Foam Layer Composition</div>
          ${p.layers.map((l, i) => `
            <div class="layer-item">
              <div class="layer-dot"></div>
              <span><strong>Layer ${i + 1}:</strong> ${l}</span>
            </div>`).join('')}
        </div>

        <div style="margin-bottom:1.5rem;">
          <div style="font-size:0.72rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-light);margin-bottom:0.75rem;">Key Features</div>
          <div class="features-list">
            ${p.features.map(f => `<span class="feature-tag">${f}</span>`).join('')}
          </div>
        </div>

        <div style="display:flex;gap:1rem;flex-wrap:wrap;">
          <a href="/contact.html" class="btn btn-primary" style="flex:1;justify-content:center;">Enquire Now →</a>
          <a href="/products.html" class="btn btn-outline" style="flex:1;justify-content:center;color:var(--text-dark);border-color:var(--border);">← Back to Products</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('productContent').innerHTML = html;
}

loadProduct();
