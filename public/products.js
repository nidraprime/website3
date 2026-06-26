let allProducts = [];

function formatPrice(n) {
  return '₹' + n.toLocaleString('en-IN');
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function calcDiscount(orig, price) {
  return Math.round((1 - price / orig) * 100);
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
}

function renderProducts(products) {
  const grid = document.getElementById('productsGrid');
  const count = document.getElementById('productCount');
  if (!products.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state-icon">🛏️</div>
        <h3>No Products Found</h3>
        <p>Try a different category filter.</p>
      </div>`;
    count.textContent = '';
    return;
  }

  count.textContent = `Showing ${products.length} mattress${products.length !== 1 ? 'es' : ''}`;

  grid.innerHTML = products.map(p => {
    const discount = p.discount || 0;
    return `
      <a href="/product.html?id=${encodeURIComponent(p._id)}" class="product-card">
        <div class="product-card-img-wrap">
          <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" class="product-card-img" loading="lazy">
          <span class="product-badge">${escapeHtml(p.category)}</span>
          <span class="product-discount-badge">-${discount}%</span>
        </div>
        <div class="product-card-body">
          <div class="product-card-name">${escapeHtml(p.name)}</div>
          <div class="product-card-tagline">${escapeHtml(p.tagline || 'Luxury Sleep Comfort')}</div>
          <div class="product-rating">
            <span class="stars">${renderStars(p.rating)}</span>
            <span class="rating-num">${p.rating}</span>
            <span class="rating-count">(${p.reviews} reviews)</span>
          </div>
          <div class="product-meta">
            <span class="product-meta-item">📐 ${p.size || 'Standard'}</span>
            <span class="product-meta-item">📏 ${p.thickness || 'Premium'}</span>
            <span class="product-meta-item">🛡️ ${p.warrantyYears}</span>
          </div>
          <div class="product-card-footer">
            <div>
              <div class="product-price">${formatPrice(p.price)}</div>
             ${
                p.discount > 0
                ? `
                <div class="product-price-original">
                ${formatPrice(
                Math.round(
                            p.price /
                           (1 - p.discount / 100)
                          )
                            )}
    </div>
  `
  : ''
}
            </div>
            <button class="btn btn-dark btn-sm" onclick="event.preventDefault();window.location='/product.html?id=${encodeURIComponent(p._id)}'">View Details</button>
          </div>
        </div>
      </a>`;
  }).join('');
}

async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    if (!data.success) throw new Error('Failed to load');
    allProducts = data.products;
    renderProducts(allProducts);
  } catch (e) {
    document.getElementById('productsGrid').innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state-icon">⚠️</div>
        <h3>Could Not Load Products</h3>
        <p>Please ensure the server is running.</p>
      </div>`;
  }
}

// Filter
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const cat = btn.dataset.cat;
    const filtered = cat === 'all' ? allProducts : allProducts.filter(p => p.category === cat);
    renderProducts(filtered);
  });
});

loadProducts();
