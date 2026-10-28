// OmniPrice SaaS Full Frontend Engine (Global Geist, Monochrome Black & White Palette, 100% Fully Functional)
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();

  // App State
  let currentUser = null;
  let authToken = localStorage.getItem('omniprice_token') || null;
  
  let currentQuery = '';

  // ==================== INTERACTIVE MONOCHROME CANVAS WALLPAPER ====================
  const canvas = document.getElementById('ambientCanvas');
  const ctx = canvas.getContext('2d');

  let width, height;
  let particles = [];
  const particleCount = 42;
  const connectionDistance = 130;

  let mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, isHovering: false };
  let ripples = [];

  function initParticles() {
    const dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 1.5 + 1,
        baseAlpha: Math.random() * 0.2 + 0.1,
      });
    }
  }

  window.addEventListener('resize', initParticles);
  initParticles();

  window.addEventListener('mousemove', (e) => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
    mouse.isHovering = true;
  });

  window.addEventListener('mouseleave', () => {
    mouse.isHovering = false;
  });

  window.addEventListener('click', (e) => {
    ripples.push({
      x: e.clientX,
      y: e.clientY,
      radius: 0,
      maxRadius: Math.max(width, height) * 0.4,
      alpha: 0.5,
      speed: 6,
    });
  });

  function renderCanvas() {
    mouse.x += (mouse.targetX - mouse.x) * 0.12;
    mouse.y += (mouse.targetY - mouse.y) * 0.12;

    ctx.clearRect(0, 0, width, height);

    // Shockwave ripples
    for (let r = ripples.length - 1; r >= 0; r--) {
      const rip = ripples[r];
      rip.radius += rip.speed;
      rip.alpha *= 0.96;

      ctx.beginPath();
      ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 0, 0, ${rip.alpha * 0.15})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      if (rip.radius > rip.maxRadius || rip.alpha < 0.02) {
        ripples.splice(r, 1);
      }
    }

    // Particles and connections
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 160 && mouse.isHovering) {
        const force = (1 - dist / 160) * 1.2;
        p.x -= (dx / dist) * force;
        p.y -= (dy / dist) * force;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 0, 0, ${dist < 160 ? 0.35 : p.baseAlpha})`;
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const pDist = Math.hypot(p.x - p2.x, p.y - p2.y);

        if (pDist < connectionDistance) {
          const alpha = (1 - pDist / connectionDistance) * 0.08;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(renderCanvas);
  }

  renderCanvas();

  // ==================== REAL RETAILER LOGO PROVIDER ====================
  function getStoreLogoSvg(storeName) {
    if (!storeName) return '';
    const s = storeName.toLowerCase();

    // Apple
    if (s.includes('apple')) {
      return `
        <svg class="h-3.5 w-3.5 fill-current text-black shrink-0" viewBox="0 0 170 170">
          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.07-7.74-7.92-12.13-14.54-5.99-9.13-10.74-19.78-14.25-31.95-3.51-12.17-5.27-23.75-5.27-34.73 0-14.54 3.69-26.68 11.06-36.43 7.37-9.75 16.7-14.75 27.99-15 4.9 0 10.4 1.34 16.5 4.02 6.1 2.68 10.02 4.02 11.76 4.02 1.52 0 5.61-1.42 12.26-4.27 6.66-2.84 12.43-4.14 17.33-3.89 13.24.65 23.83 5.46 31.78 14.44-11.54 6.97-17.19 16.55-16.96 28.73.23 9.68 4.03 17.72 11.39 24.12 7.36 6.4 16.05 10.01 26.06 10.84-2.28 7.07-5.01 14.05-8.2 20.93zM119.22 31.84c0-7.39 2.66-14.25 7.97-20.58 5.31-6.33 11.83-10.22 19.56-11.66.11 1.2.16 2.29.16 3.26 0 7.39-2.77 14.42-8.31 21.08-5.54 6.66-12.18 10.55-19.92 11.66-.43-1.3-.65-2.52-.65-3.76z"/>
        </svg>
      `;
    }

    // Amazon
    if (s.includes('amazon')) {
      return `
        <svg class="h-3.5 w-auto fill-current text-black shrink-0" viewBox="0 0 100 30">
          <path d="M14.5 18.2c-4.1 0-7.3-1.8-7.3-6.6 0-5.1 3.8-6.5 7.6-6.5 2.1 0 4.1.4 5.3 1.1v-.8c0-2.4-1.7-3.7-4.4-3.7-2.3 0-4.4.9-5.3 1.7L9 1.1C10.7 0 13.6-.6 16.6-.6c5.5 0 8.8 2.8 8.8 8.4v10.1h-4.8v-1.8c-1.3 1.3-3.4 2.1-6.1 2.1zm1.2-3.8c2.4 0 4.5-1.4 4.5-3.8v-.6c-1-.5-2.5-.8-4-.8-2.6 0-4.6.8-4.6 3.2 0 1.9 1.5 2 4.1 2zM32.4 5.4h4.7v2.1c1.5-1.6 3.4-2.4 5.4-2.4 2.5 0 4.2 1.1 5 2.8 1.6-1.8 3.7-2.8 6-2.8 3.8 0 6.4 2.5 6.4 7.6v10.2h-5V13.8c0-2.9-1-4.2-2.9-4.2-1.8 0-3.3 1.4-3.3 4v9.3h-5V13.8c0-2.9-1-4.2-2.9-4.2-1.8 0-3.4 1.4-3.4 4v9.3h-5V5.4zm39.1 0h5v17.5h-5V5.4zm23.8 8.6c0 5.4-3.9 9-9.5 9s-9.5-3.6-9.5-9 3.9-9 9.5-9c5.6 0 9.5 3.6 9.5 9zm-5 0c0-3.3-1.8-5-4.5-5s-4.5 1.7-4.5 5 1.8 5 4.5 5 4.5-1.7 4.5-5zM2.8 27.2c16.3 7.8 45.3 10.7 72.8 1.3 3.8-1.3 8.3-3.2 10.2-4.2.8-.4 1.3.1.8.8-2.8 3.8-13 8.2-19.8 10.2-18.4 5.4-44.7 4.2-64.8-5.3-.8-.4-.2-1.3.8-.8z"/>
        </svg>
      `;
    }

    // Target
    if (s.includes('target')) {
      return `
        <svg class="h-3.5 w-3.5 text-black shrink-0" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="16"/>
          <circle cx="50" cy="50" r="18" fill="currentColor"/>
        </svg>
      `;
    }

    // Walmart
    if (s.includes('walmart')) {
      return `
        <svg class="h-3.5 w-3.5 text-black shrink-0" viewBox="0 0 100 100" fill="currentColor">
          <path d="M50 0c-2.8 0-5 6.7-5 15v18c0 8.3 2.2 15 5 15s5-6.7 5-15V15c0-8.3-2.2-15-5-15z" transform="rotate(0 50 50)"/>
          <path d="M50 0c-2.8 0-5 6.7-5 15v18c0 8.3 2.2 15 5 15s5-6.7 5-15V15c0-8.3-2.2-15-5-15z" transform="rotate(60 50 50)"/>
          <path d="M50 0c-2.8 0-5 6.7-5 15v18c0 8.3 2.2 15 5 15s5-6.7 5-15V15c0-8.3-2.2-15-5-15z" transform="rotate(120 50 50)"/>
          <path d="M50 0c-2.8 0-5 6.7-5 15v18c0 8.3 2.2 15 5 15s5-6.7 5-15V15c0-8.3-2.2-15-5-15z" transform="rotate(180 50 50)"/>
          <path d="M50 0c-2.8 0-5 6.7-5 15v18c0 8.3 2.2 15 5 15s5-6.7 5-15V15c0-8.3-2.2-15-5-15z" transform="rotate(240 50 50)"/>
          <path d="M50 0c-2.8 0-5 6.7-5 15v18c0 8.3 2.2 15 5 15s5-6.7 5-15V15c0-8.3-2.2-15-5-15z" transform="rotate(300 50 50)"/>
        </svg>
      `;
    }

    // Best Buy
    if (s.includes('best buy') || s.includes('bestbuy')) {
      return `
        <span class="bg-black text-white text-[7px] font-bold uppercase px-1 py-0.5 rounded leading-none">BB</span>
      `;
    }

    // B&H Photo
    if (s.includes('b&h') || s.includes('bhphoto')) {
      return `
        <span class="border border-black text-black font-bold px-1 text-[8px] rounded leading-none">B&H</span>
      `;
    }

    return `<i data-lucide="store" class="w-3.5 h-3.5 text-black shrink-0"></i>`;
  }

  // ==================== DOM ELEMENTS ====================
  const topBanner = document.getElementById('topBanner');
  const dismissBannerBtn = document.getElementById('dismissBannerBtn');
  const brandLogoBtn = document.getElementById('brandLogoBtn');
  const navSearchLink = document.getElementById('navSearchLink');

  const unauthNav = document.getElementById('unauthNav');
  const authNav = document.getElementById('authNav');
  const openLoginBtn = document.getElementById('openLoginBtn');
  const openRegisterBtn = document.getElementById('openRegisterBtn');
      const logoutBtn = document.getElementById('logoutBtn');
  const navUserName = document.getElementById('navUserName');
    const quotaText = document.getElementById('quotaText');

  const loginModal = document.getElementById('loginModal');
  const registerModal = document.getElementById('registerModal');
      const statsModal = document.getElementById('statsModal');
  const statsBtn = document.getElementById('statsBtn');
  
  const loginForm = document.getElementById('loginForm');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const loginError = document.getElementById('loginError');

  const registerForm = document.getElementById('registerForm');
  const regName = document.getElementById('regName');
  const regEmail = document.getElementById('regEmail');
  const regPassword = document.getElementById('regPassword');
  const registerError = document.getElementById('registerError');

  const switchToRegister = document.getElementById('switchToRegister');
  const switchToLogin = document.getElementById('switchToLogin');

  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const trustedOnlyToggle = document.getElementById('trustedOnlyToggle');
  const sortSelect = document.getElementById('sortSelect');
  const pillBtns = document.querySelectorAll('.pill-btn');
  const retailerFilterBtns = document.querySelectorAll('.retailer-filter-btn');

  const loadingState = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');
  const productGrid = document.getElementById('productGrid');
  const perfBar = document.getElementById('perfBar');
  const bestDealBanner = document.getElementById('bestDealBanner');

  // ==================== DISMISS TOP BANNER ====================
  if (dismissBannerBtn && topBanner) {
    dismissBannerBtn.addEventListener('click', () => {
      topBanner.style.maxHeight = '0px';
      topBanner.style.opacity = '0';
      topBanner.style.paddingTop = '0px';
      topBanner.style.paddingBottom = '0px';
      topBanner.style.overflow = 'hidden';
      setTimeout(() => {
        topBanner.classList.add('hidden');
      }, 300);
    });
  }

  // Logo Click & Nav Search Link
  if (brandLogoBtn) {
    brandLogoBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      searchInput.focus();
    });
  }

  if (navSearchLink) {
    navSearchLink.addEventListener('click', () => {
      document.getElementById('searchSection').scrollIntoView({ behavior: 'smooth' });
      searchInput.focus();
    });
  }

  // ==================== AUTHENTICATION LOGIC ====================
  async function checkAuth() {
    if (!authToken) {
      currentUser = null;
      updateAuthUI();
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        currentUser = data.user;
        updateAuthUI();
      } else {
        localStorage.removeItem('omniprice_token');
        authToken = null;
        currentUser = null;
        updateAuthUI();
      }
    } catch (e) {
      console.warn('Failed to verify session:', e);
    }
  }

  function updateAuthUI() {
    if (currentUser) {
      unauthNav.classList.add('hidden');
      authNav.classList.remove('hidden');
      navUserName.innerText = currentUser.name;
      quotaText.innerText = `${currentUser.searchesLeft}/${currentUser.dailyLimit} left`;
    } else {
      unauthNav.classList.remove('hidden');
      authNav.classList.add('hidden');
    }
    lucide.createIcons();
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.value.trim(),
          password: loginPassword.value,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('omniprice_token', authToken);

      closeAllModals();
      updateAuthUI();
      loginForm.reset();
    } catch (err) {
      loginError.innerText = err.message;
      loginError.classList.remove('hidden');
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    registerError.classList.add('hidden');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.value.trim(),
          email: regEmail.value.trim(),
          password: regPassword.value,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('omniprice_token', authToken);

      closeAllModals();
      updateAuthUI();
      registerForm.reset();
    } catch (err) {
      registerError.innerText = err.message;
      registerError.classList.remove('hidden');
    }
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('omniprice_token');
    authToken = null;
    currentUser = null;
    updateAuthUI();
  });

  openLoginBtn.addEventListener('click', () => openModal(loginModal));
  openRegisterBtn.addEventListener('click', () => openModal(registerModal));
  switchToRegister.addEventListener('click', () => {
    closeAllModals();
    openModal(registerModal);
  });
  switchToLogin.addEventListener('click', () => {
    closeAllModals();
    openModal(loginModal);
  });

  document.querySelectorAll('.modal-close-btn').forEach((btn) => {
    btn.addEventListener('click', closeAllModals);
  });

  [loginModal, registerModal, quotaModal, statsModal].filter(Boolean).forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAllModals();
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
  });

  function openModal(modal) {
    if (!modal) return;
    closeAllModals();
    modal.classList.remove('hidden');
    lucide.createIcons();
  }

  function closeAllModals() {
    [loginModal, registerModal, quotaModal, statsModal].filter(Boolean).forEach((m) => m.classList.add('hidden'));
    if (loginError) loginError.classList.add('hidden');
    if (registerError) registerError.classList.add('hidden');
  }

  // ==================== SEARCH & COMPARISON LOGIC ====================
  // Trending Pills
  pillBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      searchInput.value = btn.innerText;
      performSearch();
    });
  });

  // Retailer logo buttons
  retailerFilterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const store = btn.getAttribute('data-store');
      searchInput.value = store + ' trending';
      performSearch();
    });
  });

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    performSearch();
  });

  trustedOnlyToggle.addEventListener('change', () => {
    if (currentQuery) performSearch();
  });

  sortSelect.addEventListener('change', () => {
    if (currentQuery) performSearch();
  });

  async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    currentQuery = query;
    const onlyTrusted = trustedOnlyToggle.checked;
    const sortBy = sortSelect.value;

    searchBtn.disabled = true;
    loadingState.classList.remove('hidden');
    emptyState.classList.add('hidden');
    productGrid.innerHTML = '';
    perfBar.classList.add('hidden');
    bestDealBanner.classList.add('hidden');

    try {
      const startTime = performance.now();
      const params = new URLSearchParams({
        q: query,
        onlyTrusted: String(onlyTrusted),
        sortBy: sortBy,
        limit: '25',
      });

      const headers = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`/api/search?${params.toString()}`, { headers });
      const clientDuration = Math.round(performance.now() - startTime);

      if (response.status === 403) {
        const errorData = await response.json();
        if (errorData.error === 'QUOTA_EXCEEDED') {
          openModal(quotaModal);
          return;
        }
      }

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to fetch search results');
      }

      const data = await response.json();

      if (data.meta.quota && currentUser) {
        currentUser.searchesLeft = data.meta.quota.searchesLeft;
        currentUser.searchesToday = data.meta.quota.searchesUsed;
        updateAuthUI();
      }

      renderResults(data, clientDuration);
    } catch (error) {
      emptyState.classList.remove('hidden');
      emptyState.innerHTML = `
        <div class="w-16 h-16 rounded-2xl bg-neutral-100 border border-neutral-300 flex items-center justify-center mx-auto mb-4 text-black shadow-sm">
          <i data-lucide="alert-circle" class="w-8 h-8"></i>
        </div>
        <h3 class="text-lg font-bold text-black mb-1">Search Interrupted</h3>
        <p class="text-sm text-neutral-500 max-w-md mx-auto">${error.message}</p>
      `;
      lucide.createIcons();
    } finally {
      searchBtn.disabled = false;
      loadingState.classList.add('hidden');
    }
  }

  function renderResults(data, clientDuration) {
    const { meta, comparison, products } = data;

    if (!products || products.length === 0) {
      emptyState.classList.remove('hidden');
      emptyState.innerHTML = `
        <div class="w-16 h-16 rounded-2xl bg-white border border-neutral-300 shadow-sm flex items-center justify-center mx-auto mb-4 text-neutral-400">
          <i data-lucide="package-search" class="w-8 h-8 text-black"></i>
        </div>
        <h3 class="text-lg font-bold text-black mb-1">No products found</h3>
        <p class="text-sm text-neutral-500 max-w-sm mx-auto">Try searching without the "Verified Stores Only" filter or with different keywords.</p>
      `;
      lucide.createIcons();
      return;
    }

    // 1. Performance HUD
    perfBar.classList.remove('hidden');
    const timingText = document.getElementById('timingText');
    const cacheBadge = document.getElementById('cacheBadge');
    const countText = document.getElementById('countText');
    const storesText = document.getElementById('storesText');

    timingText.innerText = `${meta.responseDurationMs}ms (server) • ${clientDuration}ms (roundtrip)`;
    if (meta.fromCache) {
      cacheBadge.innerText = '⚡ CACHE HIT (< 2ms)';
      cacheBadge.className = 'px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-100 text-black border border-neutral-300 font-sans';
    } else {
      cacheBadge.innerText = '🌐 LIVE PROVIDER SYNC';
      cacheBadge.className = 'px-2 py-0.5 rounded text-[11px] font-semibold bg-black text-white border border-black font-sans';
    }

    countText.innerText = `Found ${products.length} offers`;
    if (comparison && comparison.storesRepresented) {
      storesText.innerText = `across ${comparison.storesRepresented.slice(0, 4).join(', ')}${comparison.storesRepresented.length > 4 ? ' + more' : ''}`;
    }

    // 2. Best Deal Banner
    if (comparison && comparison.lowestPrice) {
      bestDealBanner.classList.remove('hidden');
      document.getElementById('lowestPriceText').innerText = `$${comparison.lowestPrice.toFixed(2)}`;
      
      const storeLogo = getStoreLogoSvg(comparison.bestDealStore);
      document.getElementById('bestDealStoreText').innerHTML = `
        <span class="inline-flex items-center gap-1.5 align-middle">
          ${storeLogo}
          <span>${comparison.bestDealStore || 'Verified Store'}</span>
        </span>
      `;

      document.getElementById('highestPriceText').innerText = `$${comparison.highestPrice.toFixed(2)}`;
      document.getElementById('avgPriceText').innerText = `$${comparison.averagePrice.toFixed(2)}`;

      const savingsBadge = document.getElementById('savingsBadge');
      if (comparison.potentialSavings > 0) {
        savingsBadge.innerText = `Save up to $${comparison.potentialSavings.toFixed(2)} (${comparison.savingsPercentage}% OFF)`;
        savingsBadge.classList.remove('hidden');
      } else {
        savingsBadge.classList.add('hidden');
      }

      document.getElementById('bestDealLink').href = comparison.bestDealUrl || '#';
    } else {
      bestDealBanner.classList.add('hidden');
    }

    // 3. Render Product Cards in Clean Monochrome
    productGrid.innerHTML = products.map((item, index) => {
      const isLowest = comparison && comparison.lowestPrice === item.numericPrice;
      const storeLogoHtml = getStoreLogoSvg(item.store);
      const delayMs = Math.min(index * 35, 350);

      return `
        <div class="card-enter mono-card ${
          isLowest ? 'border-2 border-black shadow-lg' : 'border border-neutral-200'
        } rounded-2xl p-4 flex flex-col justify-between group" style="animation-delay: ${delayMs}ms;">
          <div>
            <div class="relative w-full h-48 bg-neutral-50 rounded-xl overflow-hidden mb-4 flex items-center justify-center p-4 border border-neutral-200">
              ${
                item.imageUrl
                  ? `<img src="${item.imageUrl}" alt="${escapeHtml(item.title)}" class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" loading="lazy" />`
                  : `<i data-lucide="image" class="w-12 h-12 text-neutral-300"></i>`
              }
              
              <!-- Store Pill with Logo -->
              <div class="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-md border border-neutral-300 text-[11px] font-semibold text-black shadow-sm">
                ${storeLogoHtml}
                <span>${escapeHtml(item.store)}</span>
              </div>

              ${
                isLowest
                  ? `<div class="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-sm font-sans">
                      Best Price
                    </div>`
                  : item.discountPercentage > 0
                  ? `<div class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-neutral-100 border border-neutral-300 text-black text-[11px] font-bold font-sans">
                      -${item.discountPercentage}%
                    </div>`
                  : ''
              }
            </div>

            <!-- Title -->
            <h4 class="font-bold text-sm text-neutral-900 group-hover:underline line-clamp-2 mb-2 leading-snug" title="${escapeHtml(item.title)}">
              ${escapeHtml(item.title)}
            </h4>

            <!-- Rating & Shipping -->
            <div class="flex items-center gap-2 text-xs text-neutral-500 mb-4 font-sans">
              ${
                item.rating
                  ? `<div class="flex items-center text-black font-semibold gap-1">
                      <span>★</span>
                      <span>${item.rating}</span>
                      <span class="text-neutral-400 font-normal">(${item.reviewsCount})</span>
                    </div>`
                  : `<span class="text-neutral-400 text-[11px] font-sans">No reviews yet</span>`
              }
              ${item.shipping ? `<span class="text-neutral-300">•</span><span class="text-black font-medium text-[11px] font-sans">${escapeHtml(item.shipping)}</span>` : ''}
            </div>
          </div>

          <div class="pt-3 border-t border-neutral-200 flex items-center justify-between">
            <div>
              <div class="text-xl font-extrabold text-black font-sans">
                ${item.price}
              </div>
              ${
                item.originalPrice
                  ? `<div class="text-xs text-neutral-400 line-through font-sans">${escapeHtml(item.originalPrice)}</div>`
                  : ''
              }
            </div>

            <a 
              href="${item.url}" 
              target="_blank" 
              rel="noopener noreferrer"
              class="px-3.5 py-2 rounded-xl text-xs font-semibold ${
                isLowest
                  ? 'bg-black text-white hover:bg-neutral-800'
                  : 'bg-white border border-neutral-300 text-black hover:bg-black hover:text-white'
              } transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95 shadow-sm"
            >
              <span>View Deal</span>
              <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i>
            </a>
          </div>
        </div>
      `;
    }).join('');

    lucide.createIcons();
  }

  // Live Stats Modal
  statsBtn.addEventListener('click', async () => {
    openModal(statsModal);
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      const m = data.metrics;
      const b = data.business;
      document.getElementById('metricHitRatio').innerText = m.cacheHitRatio;
      document.getElementById('metricHits').innerText = m.cacheHits;
      document.getElementById('metricMisses').innerText = m.cacheMisses;
      document.getElementById('metricUsers').innerText = b?.totalUsers || 0;
      document.getElementById('metricPaidSubs').innerText = b?.paidSubscribers || 0;
      document.getElementById('metricKeys').innerText = m.cachedKeysCount;
      document.getElementById('metricUptime').innerText = `${data.uptimeSeconds}s`;
    } catch (e) {
      console.error(e);
    }
  });

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  checkAuth();
});

