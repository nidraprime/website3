let allProducts = [];

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
    const discount = calcDiscount(p.originalPrice, p.price);
    return `
      <a href="/product.html?id=${p.id}" class="product-card">
        <div class="product-card-img-wrap">
          <img src="${p.image}" alt="${p.name}" class="product-card-img" loading="lazy">
          <span class="product-badge">${p.category}</span>
          <span class="product-discount-badge">-${discount}%</span>
        </div>
        <div class="product-card-body">
          <div class="product-card-name">${p.name}</div>
          <div class="product-card-tagline">${p.tagline}</div>
          <div class="product-rating">
            <span class="stars">${renderStars(p.rating)}</span>
            <span class="rating-num">${p.rating}</span>
            <span class="rating-count">(${p.reviews} reviews)</span>
          </div>
          <div class="product-meta">
            <span class="product-meta-item">📐 ${p.size}</span>
            <span class="product-meta-item">📏 ${p.thickness}</span>
            <span class="product-meta-item">🛡️ ${p.warranty}</span>
          </div>
          <div class="product-card-footer">
            <div>
              <div class="product-price">${formatPrice(p.price)}</div>
              <div class="product-price-original">${formatPrice(p.originalPrice)}</div>
            </div>
            <button class="btn btn-dark btn-sm" onclick="event.preventDefault();window.location='/product.html?id=${p.id}'">View Details</button>
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
