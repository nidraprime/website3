const STANDARD_SIZES = [
  { label: 'Single',    width: 35, length: 72 },
  { label: 'Single XL', width: 47, length: 72 },
  { label: 'Queen',     width: 58, length: 72 },
  { label: 'King',      width: 70, length: 72 }
];

let currentProduct = null;
let selectedSizeIndex = 0;
let customWidth = null;
let customLength = null;

function formatPrice(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
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

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
}

function closestSizeIndex(product) {
  const baseArea = product.baseWidth * product.baseLength;
  let bestIndex = 0;
  let bestDiff = Infinity;
  STANDARD_SIZES.forEach((size, i) => {
    const diff = Math.abs(size.width * size.length - baseArea);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = i;
    }
  });
  return bestIndex;
}

function priceForSize(product, size) {
  const baseArea = product.baseWidth * product.baseLength;
  const sizeArea = size.width * size.length;
  const discountedPrice = Math.round(product.price * (sizeArea / baseArea));
  const originalPrice = product.discount > 0
    ? Math.round(discountedPrice / (1 - product.discount / 100))
    : discountedPrice;
  return { discountedPrice, originalPrice };
}

function getSelectedSize() {
  if (selectedSizeIndex === -1) {
    if (!customWidth || !customLength) return null;
    return { label: 'Custom', width: customWidth, length: customLength };
  }
  return STANDARD_SIZES[selectedSizeIndex];
}

function stockInfo(stock) {
  if (stock <= 0) return { text: 'Out of Stock', color: '#c33' };
  if (stock <= 5) return { text: `Only ${stock} left`, color: '#c9956b' };
  return { text: 'In Stock', color: '#2e7d32' };
}

async function loadProduct() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    window.location.href = '/products.html';
    return;
  }

  try {
    const res = await fetch(`/api/products/${id}`);
    const data = await res.json();
    if (!data.success) throw new Error();
    currentProduct = data.product;
    selectedSizeIndex = closestSizeIndex(currentProduct);
    renderProduct(currentProduct);
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

  const stock = stockInfo(p.stock);

  const html = `
    <div class="product-detail-grid">
      <div>
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" class="product-img-main">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem;margin-top:1rem;">
          <div style="background:var(--gold-light);border-radius:10px;padding:1rem;text-align:center;">
            <div style="font-size:1.4rem;">🛡️</div>
            <div style="font-size:0.72rem;font-weight:700;color:var(--gold-deep);margin-top:4px;letter-spacing:0.04em;">${p.warrantyYears}-Year Warranty</div>
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
        <div style="text-align:center;margin-top:0.75rem;">
          <a href="/warranty.html" style="font-size:0.78rem;color:var(--gold-deep);">Year 1 full warranty, then pro-rata — view terms →</a>
        </div>
      </div>

      <div>
        <span class="product-detail-badge">${escapeHtml(p.category)}</span>
        <h1 class="product-detail-name">${escapeHtml(p.name)}</h1>
        <p class="product-detail-tagline">${escapeHtml(p.tagline || '')}</p>

        <div class="product-rating" style="margin-bottom:1.5rem;">
          <span class="stars" style="font-size:1rem;">${renderStars(p.rating)}</span>
          <span class="rating-num">${p.rating}/5</span>
          <span class="rating-count">(${p.reviews} verified reviews)</span>
        </div>

        <div style="font-size:0.72rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-light);margin-bottom:0.75rem;">Select Size</div>
        <div class="size-selector" id="sizeSelector"></div>

        <div id="customSizeInputs" style="display:none;gap:0.75rem;margin-bottom:1.5rem;">
          <div class="form-group" style="flex:1;margin-bottom:0;">
            <label class="form-label" style="font-size:0.7rem;">Width (in)</label>
            <input type="number" id="customWidthInput" class="form-input" min="1" placeholder="e.g. 42" oninput="onCustomSizeInput()">
          </div>
          <div class="form-group" style="flex:1;margin-bottom:0;">
            <label class="form-label" style="font-size:0.7rem;">Length (in)</label>
            <input type="number" id="customLengthInput" class="form-input" min="1" placeholder="e.g. 75" oninput="onCustomSizeInput()">
          </div>
        </div>

        <div class="product-detail-price-wrap" id="priceWrap"></div>

        <div style="font-size:0.8rem;font-weight:700;color:${stock.color};margin-bottom:1.5rem;">● ${stock.text}</div>

        <div class="product-description">${escapeHtml(p.description || '')}</div>

        <div class="product-specs">
          <div class="spec-item">
            <div class="spec-label">Size</div>
            <div class="spec-value" id="specSize"></div>
          </div>
          <div class="spec-item">
            <div class="spec-label">Warranty</div>
            <div class="spec-value">${p.warrantyYears} Years</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">Category</div>
            <div class="spec-value">${escapeHtml(p.category)}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">Stock</div>
            <div class="spec-value">${stock.text}</div>
          </div>
        </div>

        ${p.layers && p.layers.length ? `
        <div class="layers-section">
          <div class="layers-title">Foam Layer Composition</div>
          ${p.layers.map((l, i) => `
            <div class="layer-item">
              <div class="layer-dot"></div>
              <span><strong>Layer ${i + 1}:</strong> ${escapeHtml(l)}</span>
            </div>`).join('')}
        </div>` : ''}

        ${p.features && p.features.length ? `
        <div style="margin-bottom:1.5rem;">
          <div style="font-size:0.72rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-light);margin-bottom:0.75rem;">Key Features</div>
          <div class="features-list">
            ${p.features.map(f => `<span class="feature-tag">${escapeHtml(f)}</span>`).join('')}
          </div>
        </div>` : ''}

        <div style="display:flex;gap:1rem;flex-wrap:wrap;">
          <button class="btn btn-primary" style="flex:1;justify-content:center;" onclick="goToEnquiry()">Enquire Now →</button>
          <a href="/products.html" class="btn btn-outline" style="flex:1;justify-content:center;color:var(--text-dark);border-color:var(--border);">← Back to Products</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('productContent').innerHTML = html;
  renderSizeSelector();
}

function renderSizeSelector() {
  const wrap = document.getElementById('sizeSelector');
  const standardChips = STANDARD_SIZES.map((size, i) => `
    <div class="size-chip ${i === selectedSizeIndex ? 'active' : ''}" onclick="selectSize(${i})">
      <div class="size-chip-label">${size.label}</div>
      <div class="size-chip-dim">${size.width}×${size.length} in</div>
    </div>
  `).join('');

  const customChip = `
    <div class="size-chip ${selectedSizeIndex === -1 ? 'active' : ''}" onclick="selectSize(-1)">
      <div class="size-chip-label">Custom Size</div>
      <div class="size-chip-dim">Enter your own</div>
    </div>
  `;

  wrap.innerHTML = standardChips + customChip;
  document.getElementById('customSizeInputs').style.display = selectedSizeIndex === -1 ? 'flex' : 'none';
  renderPrice();
}

function selectSize(index) {
  selectedSizeIndex = index;
  document.querySelectorAll('#sizeSelector .size-chip').forEach((el, i) => {
    const chipIndex = i < STANDARD_SIZES.length ? i : -1;
    el.classList.toggle('active', chipIndex === index);
  });
  document.getElementById('customSizeInputs').style.display = index === -1 ? 'flex' : 'none';
  renderPrice();
}

function onCustomSizeInput() {
  const w = parseFloat(document.getElementById('customWidthInput').value);
  const l = parseFloat(document.getElementById('customLengthInput').value);
  customWidth  = w > 0 ? w : null;
  customLength = l > 0 ? l : null;
  renderPrice();
}

function renderPrice() {
  const size       = getSelectedSize();
  const priceWrap  = document.getElementById('priceWrap');
  const specSize   = document.getElementById('specSize');

  if (!size) {
    priceWrap.innerHTML = `<div style="font-size:0.85rem;color:var(--text-light);">Enter a width and length above to see the price for your custom size.</div>`;
    specSize.textContent = 'Custom — enter dimensions';
    return;
  }

  const { discountedPrice, originalPrice } = priceForSize(currentProduct, size);

  priceWrap.innerHTML = `
    <div class="product-detail-price">${formatPrice(discountedPrice)}</div>
    ${currentProduct.discount > 0 ? `
      <div class="product-detail-original">${formatPrice(originalPrice)}</div>
      <span class="product-detail-saving">Save ${currentProduct.discount}% (${formatPrice(originalPrice - discountedPrice)})</span>
    ` : ''}
  `;

  specSize.textContent = `${size.label} (${size.width}×${size.length} in)`;
}

function goToEnquiry() {
  const size = getSelectedSize();

  if (selectedSizeIndex === -1 && !size) {
    alert('Please enter a width and length for your custom size first.');
    return;
  }

  const params = new URLSearchParams();
  if (size) {
    const { discountedPrice } = priceForSize(currentProduct, size);
    params.set('product', `${currentProduct.name} — ${size.label} (${size.width}x${size.length} in)`);
    params.set('message', `I'm interested in ${currentProduct.name} in size ${size.label} (${size.width}x${size.length} in) — estimated price ${formatPrice(discountedPrice)}. Please confirm availability and final pricing.`);
  } else {
    params.set('product', currentProduct.name);
  }

  window.location.href = `/contact.html?${params.toString()}`;
}

loadProduct();
