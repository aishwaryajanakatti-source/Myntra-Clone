// ── STATE ──
  let allProducts = [];
  let filteredProducts = [];
  let displayedProducts = [];
  let cart = JSON.parse(localStorage.getItem('mnCart') || '[]');
  let wishlist = new Set(JSON.parse(localStorage.getItem('mnWishlist') || '[]'));
  let pageSize = 20;
  let currentPage = 1;
  let activeDiscount = 'all';
  let activeSort = 'default';
  let activeCategory = '';

  const categories = [
    { label: 'All', value: '' },
    { label: 'Shirts', value: 'mens-shirts' },
    { label: 'Shoes', value: 'mens-shoes' },
    { label: 'Watches', value: 'mens-watches' },
    { label: 'Fragrances', value: 'fragrances' },
    { label: 'Skincare', value: 'skin-care' },
    { label: 'Beauty', value: 'beauty' },
    { label: 'Sunglasses', value: 'sunglasses' },
    { label: 'Jewellery', value: 'womens-jewellery' },
    { label: 'Tops', value: 'tops' },
    { label: 'Furniture', value: 'furniture' },
  ];

  // ── TIMER ──
  function updateTimer() {
    const now = new Date();
    const end = new Date();
    end.setHours(23, 59, 59, 0);
    let diff = Math.max(0, Math.floor((end - now) / 1000));
    const h = Math.floor(diff / 3600); diff %= 3600;
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    document.getElementById('th').textContent = String(h).padStart(2,'0');
    document.getElementById('tm').textContent = String(m).padStart(2,'0');
    document.getElementById('ts').textContent = String(s).padStart(2,'0');
  }
  setInterval(updateTimer, 1000);
  updateTimer();

  // ── CATEGORIES ──
  function renderCategories() {
    const el = document.getElementById('catList');
    el.innerHTML = categories.map(c => `
      <button class="cat-pill ${activeCategory === c.value ? 'active' : ''}"
        onclick="filterByCategory('${c.value}', '${c.label}')">${c.label}</button>
    `).join('');
  }

  // ── FETCH ──
  async function fetchProducts(category = '') {
    showSkeletons();
    try {
      let url = category
        ? `https://dummyjson.com/products/category/${category}?limit=100`
        : `https://dummyjson.com/products?limit=100`;
      const res = await fetch(url);
      const data = await res.json();
      allProducts = data.products || [];
      applyFilters();
    } catch (e) {
      document.getElementById('productGrid').innerHTML =
        `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--muted)">
          <div style="font-size:48px">😔</div>
          <p style="margin-top:12px;font-size:15px">Couldn't load products. Please try again.</p>
          <button class="btn-primary" onclick="loadAllProducts()" style="margin-top:16px">Retry</button>
        </div>`;
    }
  }

  function showSkeletons() {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = Array(8).fill(0).map(() => `
      <div class="skeleton">
        <div class="skel-img"></div>
        <div class="skel-line"></div>
        <div class="skel-line short"></div>
        <div class="skel-line short"></div>
      </div>
    `).join('');
  }

  function applyFilters() {
    let products = [...allProducts];

    // discount filter
    if (activeDiscount !== 'all') {
      const minDisc = parseFloat(activeDiscount);
      products = products.filter(p => p.discountPercentage >= minDisc);
    }

    // sort
    if (activeSort === 'price-asc') products.sort((a,b) => a.price - b.price);
    else if (activeSort === 'price-desc') products.sort((a,b) => b.price - a.price);
    else if (activeSort === 'rating') products.sort((a,b) => b.rating - a.rating);
    else if (activeSort === 'discount') products.sort((a,b) => b.discountPercentage - a.discountPercentage);

    filteredProducts = products;
    currentPage = 1;
    renderProducts();
  }

  function renderProducts() {
    const grid = document.getElementById('productGrid');
    const end = currentPage * pageSize;
    displayedProducts = filteredProducts.slice(0, end);

    if (displayedProducts.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--muted)">
        <div style="font-size:48px">🔍</div>
        <p style="margin-top:12px">No products found. Try a different filter.</p>
      </div>`;
      document.getElementById('loadMoreBtn').style.display = 'none';
      return;
    }

    grid.innerHTML = displayedProducts.map(p => renderCard(p)).join('');
    grid.querySelectorAll('.product-card').forEach(c => c.classList.add('fade-in'));

    const btn = document.getElementById('loadMoreBtn');
    btn.style.display = filteredProducts.length > end ? 'inline-block' : 'none';
  }

  function renderCard(p) {
    const origPrice = (p.price / (1 - p.discountPercentage/100)).toFixed(0);
    const stars = '★'.repeat(Math.round(p.rating)) + '☆'.repeat(5 - Math.round(p.rating));
    const isWished = wishlist.has(p.id);
    const brandName = (p.brand || p.category || 'Fashion').toUpperCase();
    const inrPrice = (p.price * 84).toFixed(0);
    const inrOrig = (origPrice * 84);
    const save = Math.round(p.discountPercentage);

    return `
      <div class="product-card" id="card-${p.id}">
        <div class="product-img-wrap" onclick="showProductDetail(${p.id})">
          <img src="${p.thumbnail}" alt="${p.title}" loading="lazy">
          <div class="discount-badge">${save}% OFF</div>
          <button class="wishlist-btn ${isWished ? 'active' : ''}" id="wish-${p.id}" onclick="toggleWishlist(event, ${p.id})" title="Add to Wishlist">
            <svg viewBox="0 0 24 24" fill="${isWished ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>
        <div class="product-info">
          <div class="product-brand">${brandName}</div>
          <div class="product-name">${p.title}</div>
          <div class="product-rating">
            <span class="stars">${stars}</span>
            <span class="rating-count">(${p.stock || Math.floor(Math.random()*2000+100)})</span>
          </div>
          <div class="product-price">
            <span class="price-now">₹${Number(inrPrice).toLocaleString('en-IN')}</span>
            <span class="price-was">₹${Number(inrOrig).toLocaleString('en-IN')}</span>
            <span class="price-save">(${save}% off)</span>
          </div>
        </div>
        <button class="add-to-cart-btn" onclick="addToCart(${p.id})">ADD TO BAG</button>
      </div>
    `;
  }

  // ── SEARCH ──
  function openSearchModal() {
    document.getElementById('searchModal').classList.add('open');
    setTimeout(() => document.getElementById('searchInput').focus(), 100);
  }
  function closeSearch(e) {
    if (e.target.id === 'searchModal') closeSearchModal();
  }
  function closeSearchModal() {
    document.getElementById('searchModal').classList.remove('open');
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').innerHTML = '';
  }

  async function handleSearch(q) {
    if (q.length < 2) { document.getElementById('searchResults').innerHTML = ''; return; }
    const res = await fetch(`https://dummyjson.com/products/search?q=${encodeURIComponent(q)}&limit=8`);
    const data = await res.json();
    const el = document.getElementById('searchResults');
    if (!data.products?.length) { el.innerHTML = `<p style="padding:16px;color:var(--muted);text-align:center">No results found</p>`; return; }
    el.innerHTML = data.products.map(p => `
      <div class="search-item" onclick="selectSearch(${p.id})">
        <img src="${p.thumbnail}" alt="${p.title}">
        <div class="search-item-info">
          <div class="si-name">${p.title}</div>
          <div class="si-price">₹${(p.price*84).toLocaleString('en-IN')}</div>
        </div>
      </div>
    `).join('');
  }

  function selectSearch(id) {
    closeSearchModal();
    const p = allProducts.find(x => x.id === id);
    if (p) {
      addToCart(id);
    }
  }

  // ── CART ──
  function addToCart(id) {
    const p = allProducts.find(x => x.id === id) || filteredProducts.find(x => x.id === id);
    if (!p) return;
    const idx = cart.findIndex(c => c.id === id);
    if (idx >= 0) cart[idx].qty++;
    else cart.push({ id: p.id, title: p.title, price: p.price, thumbnail: p.thumbnail, brand: p.brand || p.category, qty: 1 });
    saveCart();
    showToast('Added to Bag! 🛍️');
    updateCartBadge();
  }

  function removeFromCart(id) {
    cart = cart.filter(c => c.id !== id);
    saveCart();
    updateCartBadge();
    renderCart();
  }

  function saveCart() { localStorage.setItem('mnCart', JSON.stringify(cart)); }

  function updateCartBadge() {
    const count = cart.reduce((s, c) => s + c.qty, 0);
    document.getElementById('cartCount').textContent = count;
  }

  function openCart() {
    document.getElementById('cartDrawer').classList.add('open');
    document.getElementById('cartOverlay').classList.add('open');
    renderCart();
  }

  function closeCart() {
    document.getElementById('cartDrawer').classList.remove('open');
    document.getElementById('cartOverlay').classList.remove('open');
  }

  function renderCart() {
    const el = document.getElementById('cartItems');
    const footer = document.getElementById('cartFooter');
    if (!cart.length) {
      el.innerHTML = `<div class="empty-cart"><div class="icon">🛍️</div><p>Your bag is empty!</p><p style="font-size:12px;margin-top:8px;color:var(--muted)">Add items to get started</p></div>`;
      footer.innerHTML = '';
      return;
    }
    el.innerHTML = cart.map(c => `
      <div class="cart-item">
        <img src="${c.thumbnail}" alt="${c.title}">
        <div class="cart-item-info">
          <div class="cart-item-brand">${(c.brand || c.category || '').toUpperCase()}</div>
          <div class="cart-item-name">${c.title}</div>
          <div class="cart-item-price">₹${(c.price * 84 * c.qty).toLocaleString('en-IN')} <span style="font-size:11px;color:var(--muted);font-weight:400">× ${c.qty}</span></div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart(${c.id})">✕</button>
      </div>
    `).join('');
    const total = cart.reduce((s,c) => s + c.price * 84 * c.qty, 0);
    footer.innerHTML = `
      <div class="cart-total">
        <span>Total Amount</span>
        <span class="total-val">₹${total.toLocaleString('en-IN')}</span>
      </div>
      <button class="checkout-btn" onclick="showToast('Proceeding to checkout! 🎉')">PLACE ORDER</button>
    `;
  }

  // ── WISHLIST ──
  function toggleWishlist(e, id) {
    e.stopPropagation();
    if (wishlist.has(id)) {
      wishlist.delete(id);
      showToast('Removed from Wishlist');
      const btn = document.getElementById(`wish-${id}`);
      if (btn) { btn.classList.remove('active'); btn.querySelector('svg').setAttribute('fill','none'); }
    } else {
      wishlist.add(id);
      showToast('Added to Wishlist ❤️');
      const btn = document.getElementById(`wish-${id}`);
      if (btn) { btn.classList.add('active'); btn.querySelector('svg').setAttribute('fill','currentColor'); }
    }
    localStorage.setItem('mnWishlist', JSON.stringify([...wishlist]));
  }

  // ── FILTERS / SORT ──
  function setDiscount(val, btn) {
    activeDiscount = val;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilters();
  }

  function sortProducts(val) {
    activeSort = val;
    applyFilters();
  }

  function filterByCategory(cat, label) {
    activeCategory = cat;
    document.getElementById('sectionTitle').textContent = label || 'All Products';
    renderCategories();
    fetchProducts(cat);
    scrollToProducts();
  }

  function loadAllProducts() {
    activeCategory = '';
    document.getElementById('sectionTitle').textContent = 'All Products';
    renderCategories();
    fetchProducts('');
  }

  function loadMore() {
    currentPage++;
    renderProducts();
    window.scrollBy({ top: 400, behavior: 'smooth' });
  }

  function scrollToProducts() {
    document.getElementById('productsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── TOAST ──
  function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2400);
  }

  // ── INIT ──
  renderCategories();
  updateCartBadge();
  fetchProducts();
