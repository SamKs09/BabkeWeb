/* ==========================================================================
   BABKE KEBAB & PLATES — ADMIN DASHBOARD CONTROLLER
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof BabkeDB !== 'undefined') {
    try {
      await BabkeDB.init();
    } catch (e) {
      console.error("Failed to initialize database cache:", e);
    }
  }
  
  // 0. Image source path resolver helper for relative URLs in admin subdirectory
  const getAdminImageSrc = (src) => {
    if (!src) return '';
    if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('../')) {
      return src;
    }
    if (src.startsWith('/assets/')) {
      return '..' + src;
    }
    if (src.startsWith('assets/')) {
      return '../' + src;
    }
    return src;
  };

  // 1. Unified Activity Logger
  const getActivityLogs = () => {
    const logs = localStorage.getItem('babke_activity_logs');
    return logs ? JSON.parse(logs) : [
      { id: "log-0", text: "Database initialized with seed data", time: new Date(Date.now() - 3600000).toISOString() },
      { id: "log-1", text: "Admin portal accessed successfully", time: new Date().toISOString() }
    ];
  };

  const addActivityLog = (text) => {
    const logs = getActivityLogs();
    logs.unshift({
      id: "log-" + Date.now(),
      text: text,
      time: new Date().toISOString()
    });
    localStorage.setItem('babke_activity_logs', JSON.stringify(logs.slice(0, 20))); // Keep last 20 logs
    
    // If we are currently on the overview panel, reload it to show the new log
    if (currentActivePanel === 'overview') {
      renderOverviewPanel();
    }
  };

  // 2. Immersive Theme Switcher Controls
  const themeToggleBtn = document.getElementById('admin-theme-toggle');
  
  const setTheme = (theme) => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      localStorage.setItem('babke_theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('babke_theme', 'dark');
    }
  };

  // Sync theme on load
  const savedTheme = localStorage.getItem('babke_theme') || 'dark';
  setTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isLight = document.body.classList.contains('light-theme');
      setTheme(isLight ? 'dark' : 'light');
      addActivityLog(`Theme toggled to ${isLight ? 'Dark' : 'Light'} Mode`);
    });
  }

  // 3. SECURE AUTHENTICATION STATE
  const loginWrapper = document.getElementById('login-screen-wrapper');
  const adminShell = document.getElementById('admin-shell');
  const loginForm = document.getElementById('admin-login-form');
  const loginErrorMsg = document.getElementById('login-error-msg');
  const logoutBtn = document.getElementById('btn-admin-logout');

  const checkAuth = () => {
    if (typeof BABKE_CONFIG === 'undefined') {
      console.error("BABKE_CONFIG settings not loaded.");
      return;
    }

    const sessionActive = sessionStorage.getItem(BABKE_CONFIG.SESSION_KEY) === 'true';
    if (sessionActive) {
      if (loginWrapper) loginWrapper.style.display = 'none';
      if (adminShell) adminShell.style.display = 'flex';
      switchPanel(currentActivePanel);
    } else {
      if (loginWrapper) loginWrapper.style.display = 'flex';
      if (adminShell) adminShell.style.display = 'none';
    }
  };

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const usernameInput = document.getElementById('login-username').value.trim();
      const passwordInput = document.getElementById('login-password').value.trim();

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: usernameInput, password: passwordInput })
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            sessionStorage.setItem(BABKE_CONFIG.SESSION_KEY, 'true');
            if (loginErrorMsg) loginErrorMsg.style.display = 'none';
            loginForm.reset();
            checkAuth();
            addActivityLog("Administrator logged in successfully");
          } else {
            if (loginErrorMsg) loginErrorMsg.style.display = 'block';
          }
        } else {
          if (loginErrorMsg) loginErrorMsg.style.display = 'block';
        }
      } catch (err) {
        console.error("Login API request failed:", err);
        if (loginErrorMsg) loginErrorMsg.style.display = 'block';
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem(BABKE_CONFIG.SESSION_KEY);
      addActivityLog("Administrator logged out");
      checkAuth();
    });
  }

  // 4. ROUTING BETWEEN DASHBOARD PANELS
  let currentActivePanel = 'overview'; // Default

  const switchPanel = async (panelName) => {
    currentActivePanel = panelName;
    
    // Refresh the local cache from backend
    if (typeof BabkeDB !== 'undefined') {
      try {
        await BabkeDB.init(true);
      } catch (e) {
        console.error("Failed to refresh database cache:", e);
      }
    }
    
    // Update active nav button
    document.querySelectorAll('.nav-item-btn').forEach(btn => {
      if (btn.dataset.panel === panelName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update panel title header
    const titleHeader = document.getElementById('admin-panel-title');
    if (titleHeader) {
      const titles = {
        'overview': 'Dashboard Overview',
        'menu': 'Menu Management',
        'content': 'Website Content Management',
        'gallery': 'Gallery Management',
        'reviews': 'Customer Reviews Management',
        'events': 'Events Management',
        'orders-reservations': 'Orders & Reservations Logs'
      };
      titleHeader.textContent = titles[panelName] || 'Dashboard';
    }

    // Render selected panel view
    switch (panelName) {
      case 'overview':
        renderOverviewPanel();
        break;
      case 'menu':
        renderMenuPanel();
        break;
      case 'content':
        renderContentPanel();
        break;
      case 'gallery':
        renderGalleryPanel();
        break;
      case 'reviews':
        renderReviewsPanel();
        break;
      case 'events':
        renderEventsPanel();
        break;
      case 'orders-reservations':
        renderOrdersReservationsPanel();
        break;
    }
  };

  // Wire sidebar clicks
  document.querySelectorAll('.nav-item-btn[data-panel]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetPanel = e.currentTarget.dataset.panel;
      switchPanel(targetPanel);
    });
  });


  // 5. PANEL RENDERING CONTROLLERS

  // A. OVERVIEW PANEL
  function renderOverviewPanel() {
    const contentArea = document.getElementById('admin-body-content');
    if (!contentArea || typeof BabkeDB === 'undefined') return;

    const orders = BabkeDB.getOrders();
    const reservations = BabkeDB.getReservations();
    const menuItems = BabkeDB.getMenu();

    // Compute stats
    const totalOrders = orders.length;
    const totalReservations = reservations.length;
    
    const activeRevenue = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.subtotal, 0);

    const activeDishNames = menuItems.map(item => item.title.en);

    // Compute most popular dishes count based on order logs
    const dishCounts = {};
    orders.forEach(o => {
      if (o.status !== 'cancelled') {
        o.items.forEach(item => {
          dishCounts[item.name] = (dishCounts[item.name] || 0) + item.qty;
        });
      }
    });

    const popularDishes = Object.keys(dishCounts)
      .map(name => ({ name, qty: dishCounts[name] }))
      .sort((a, b) => b.qty - a.qty);

    const logs = getActivityLogs();
    
    let popularDishesHtml = '';
    if (popularDishes.length > 0) {
      popularDishesHtml = popularDishes.slice(0, 4).map(d => `
        <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border-admin);">
          <span style="font-weight:700;">${d.name}</span>
          <span style="color:var(--accent-admin); font-weight:800;">${d.qty} ordered</span>
        </div>
      `).join('');
    } else {
      popularDishesHtml = `<p style="color:var(--text-admin-muted); font-size:0.85rem; padding:10px 0;">No active orders recorded yet.</p>`;
    }

    let logsHtml = logs.slice(0, 6).map(log => `
      <div class="activity-item">
        <div class="activity-icon">ℹ️</div>
        <div class="activity-details">
          <p>${log.text}</p>
          <span>${formatRelativeTime(new Date(log.time))}</span>
        </div>
      </div>
    `).join('');

    contentArea.innerHTML = `
      <!-- Stats cards grid -->
      <div class="dashboard-grid-stats">
        <div class="stat-card">
          <div class="stat-card-details">
            <span>Total Revenue</span>
            <h3>${activeRevenue.toFixed(1)} TND</h3>
          </div>
          <div class="stat-card-icon success">💰</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-details">
            <span>Total Orders</span>
            <h3>${totalOrders}</h3>
          </div>
          <div class="stat-card-icon info">📦</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-details">
            <span>Reservations</span>
            <h3>${totalReservations}</h3>
          </div>
          <div class="stat-card-icon warning">📅</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-details">
            <span>Active Events</span>
            <h3>${BabkeDB.getEvents().filter(e => e.status === 'published').length}</h3>
          </div>
          <div class="stat-card-icon">🎉</div>
        </div>
      </div>

      <!-- Split layout columns -->
      <div class="dashboard-split-layout">
        <!-- Popular Dishes list -->
        <div class="admin-card">
          <div class="admin-card-header">
            <h3>Most Popular Charcoal Dishes</h3>
          </div>
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${popularDishesHtml}
          </div>
        </div>

        <!-- Activity logs -->
        <div class="admin-card">
          <div class="admin-card-header">
            <h3>Recent Admin Activity</h3>
          </div>
          <div class="activity-logs-list">
            ${logsHtml}
          </div>
        </div>
      </div>
    `;
  }

  // B. MENU MANAGEMENT PANEL
  function renderMenuPanel() {
    const contentArea = document.getElementById('admin-body-content');
    if (!contentArea) return;

    const menuItems = BabkeDB.getMenu();

    let rowsHtml = menuItems.map(item => {
      const titleEn = item.title.en || 'No title';
      const catLabel = item.category.toUpperCase();
      const tagsList = item.tags.en || [];
      const tagsBadgeHtml = tagsList.map(tag => `<span class="status-badge" style="background:rgba(255,255,255,0.04); border:1px solid var(--border-admin); font-size:0.65rem; margin-right:4px;">${tag}</span>`).join('');

      return `
        <tr>
          <td>
            <img class="table-img" src="${getAdminImageSrc(item.image)}" onerror="this.onerror=null; this.src='${getAdminImageSrc(item.fallbackImage)}';" alt="${titleEn}">
          </td>
          <td>
            <strong style="display:block; font-size:0.95rem; color:var(--text-admin-primary);">${titleEn}</strong>
            <span style="color:var(--text-admin-muted); font-size:0.75rem;">${item.id}</span>
          </td>
          <td><span class="status-badge info">${catLabel}</span></td>
          <td><strong style="color:var(--accent-admin); font-weight:800;">${item.price.toFixed(1)} TND</strong></td>
          <td>${tagsBadgeHtml}</td>
          <td>
            <div class="btn-action-row">
              <button class="btn-admin-action btn-edit-menu-item" data-id="${item.id}" title="Edit Item">✏️</button>
              <button class="btn-admin-action delete btn-delete-menu-item" data-id="${item.id}" title="Delete Item">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    contentArea.innerHTML = `
      <div class="admin-card">
        <div class="admin-card-header">
          <h3>Menu Items Registry (${menuItems.length} items)</h3>
          <button class="btn-admin-primary" id="btn-add-new-menu-item">
            <span>+ Add New Item</span>
          </button>
        </div>
        
        <div class="table-responsive-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name / ID</th>
                <th>Category</th>
                <th>Price</th>
                <th>Tags</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml ? rowsHtml : `<tr><td colspan="6" style="text-align:center; color:var(--text-admin-muted);">No menu items found. Click add new to create one!</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Bind item button actions
    document.getElementById('btn-add-new-menu-item').addEventListener('click', () => openMenuModal());
    
    document.querySelectorAll('.btn-edit-menu-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        openMenuModal(id);
      });
    });

    document.querySelectorAll('.btn-delete-menu-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        if (confirm("Are you sure you want to delete this menu item? This cannot be undone.")) {
          deleteMenuItem(id);
        }
      });
    });
  }

  // Menu Modal controls
  const menuModal = document.getElementById('menu-editor-modal');
  const closeMenuModalBtn = document.getElementById('btn-close-menu-modal');
  const cancelMenuModalBtn = document.getElementById('btn-cancel-menu-editor');
  const menuItemForm = document.getElementById('menu-item-form');
  const fileInput = document.getElementById('menu-form-file-input');
  const base64Input = document.getElementById('menu-form-image-base64');
  const previewBox = document.getElementById('menu-form-image-preview');

  const openMenuModal = (itemId = null) => {
    menuItemForm.reset();
    base64Input.value = '';
    previewBox.innerHTML = '<span class="placeholder-icon">📸</span>';
    
    const modalTitle = document.getElementById('menu-modal-title');

    if (itemId) {
      modalTitle.textContent = "Edit Menu Item";
      const item = BabkeDB.getMenu().find(m => m.id === itemId);
      if (item) {
        document.getElementById('menu-form-item-id').value = item.id;
        document.getElementById('menu-form-category').value = item.category;
        document.getElementById('menu-form-price').value = item.price;
        
        // base64/image preview
        base64Input.value = item.image;
        previewBox.innerHTML = `<img src="${getAdminImageSrc(item.image)}" onerror="this.onerror=null; this.src='${getAdminImageSrc(item.fallbackImage)}';">`;

        // Localized fields
        document.getElementById('menu-form-title-en').value = item.title.en || '';
        document.getElementById('menu-form-desc-en').value = item.description.en || '';
        document.getElementById('menu-form-tags-en').value = (item.tags.en || []).join(', ');

        document.getElementById('menu-form-title-fr').value = item.title.fr || '';
        document.getElementById('menu-form-desc-fr').value = item.description.fr || '';
        document.getElementById('menu-form-tags-fr').value = (item.tags.fr || []).join(', ');

        document.getElementById('menu-form-title-tn').value = item.title.tn || '';
        document.getElementById('menu-form-desc-tn').value = item.description.tn || '';
        document.getElementById('menu-form-tags-tn').value = (item.tags.tn || []).join(', ');
      }
    } else {
      modalTitle.textContent = "Add Menu Item";
      document.getElementById('menu-form-item-id').value = '';
    }

    menuModal.classList.add('open');
  };

  const closeMenuModal = () => {
    menuModal.classList.remove('open');
  };

  if (closeMenuModalBtn) closeMenuModalBtn.addEventListener('click', closeMenuModal);
  if (cancelMenuModalBtn) cancelMenuModalBtn.addEventListener('click', closeMenuModal);

  // File Upload to base64 converter
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target.result;
        base64Input.value = base64String;
        previewBox.innerHTML = `<img src="${base64String}">`;
      };
      reader.readAsDataURL(file);
    });
  }

  // Menu Form Submit
  if (menuItemForm) {
    menuItemForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('menu-form-item-id').value;
      const category = document.getElementById('menu-form-category').value;
      const price = parseFloat(document.getElementById('menu-form-price').value);
      const base64Image = base64Input.value.trim();

      const titleEn = document.getElementById('menu-form-title-en').value.trim();
      const descEn = document.getElementById('menu-form-desc-en').value.trim();
      const tagsEn = document.getElementById('menu-form-tags-en').value.split(',').map(t => t.trim()).filter(t => t);

      const titleFr = document.getElementById('menu-form-title-fr').value.trim();
      const descFr = document.getElementById('menu-form-desc-fr').value.trim();
      const tagsFr = document.getElementById('menu-form-tags-fr').value.split(',').map(t => t.trim()).filter(t => t);

      const titleTn = document.getElementById('menu-form-title-tn').value.trim();
      const descTn = document.getElementById('menu-form-desc-tn').value.trim();
      const tagsTn = document.getElementById('menu-form-tags-tn').value.split(',').map(t => t.trim()).filter(t => t);

      const itemData = {
        id: id || "item-" + Date.now(),
        category: category,
        price: price,
        image: base64Image || "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
        fallbackImage: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
        title: { en: titleEn, fr: titleFr, tn: titleTn },
        description: { en: descEn, fr: descFr, tn: descTn },
        tags: { en: tagsEn, fr: tagsFr, tn: tagsTn }
      };

      const submitBtn = menuItemForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Saving...";

      try {
        await BabkeDB.saveMenuItem(itemData);
        if (id) {
          addActivityLog(`Menu item '${titleEn}' updated`);
        } else {
          addActivityLog(`New menu item '${titleEn}' created`);
        }
        closeMenuModal();
        renderMenuPanel();
      } catch (err) {
        console.error("Error saving menu item:", err);
        alert("Failed to save menu item!");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  const deleteMenuItem = async (id) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;
    const menu = BabkeDB.getMenu();
    const item = menu.find(m => m.id === id);
    const title = item ? item.title.en : id;
    
    try {
      await BabkeDB.deleteMenuItem(id);
      addActivityLog(`Menu item '${title}' deleted`);
      renderMenuPanel();
    } catch (err) {
      console.error("Error deleting menu item:", err);
      alert("Failed to delete menu item!");
    }
  };


  // C. WEBSITE CONTENT MANAGEMENT PANEL
  function renderContentPanel() {
    const contentArea = document.getElementById('admin-body-content');
    if (!contentArea) return;

    const content = BabkeDB.getContent();

    contentArea.innerHTML = `
      <form id="website-content-form">
        <div class="admin-card">
          <div class="admin-card-header">
            <h3>Hero Section Parameters</h3>
          </div>
          <div class="lang-edit-section">
            <div class="lang-section-header">Hero Details - English (EN)</div>
            <div class="form-group-admin" style="margin-bottom:12px;">
              <label for="hero-award-en">Award Badge</label>
              <input type="text" id="hero-award-en" value="${content.hero.award.en || ''}">
            </div>
            <div class="form-group-admin" style="margin-bottom:12px;">
              <label for="hero-badge-en">Location Badge</label>
              <input type="text" id="hero-badge-en" value="${content.hero.badge.en || ''}">
            </div>
            <div class="form-group-admin" style="margin-bottom:12px;">
              <label for="hero-title-en">Hero Title (HTML Tags Allowed)</label>
              <input type="text" id="hero-title-en" value="${content.hero.title.en || ''}">
            </div>
            <div class="form-group-admin">
              <label for="hero-desc-en">Hero Description</label>
              <textarea id="hero-desc-en" rows="2">${content.hero.desc.en || ''}</textarea>
            </div>
          </div>

          <div class="lang-edit-section">
            <div class="lang-section-header">Hero Details - Français (FR)</div>
            <div class="form-group-admin" style="margin-bottom:12px;">
              <label for="hero-award-fr">Award Badge (FR)</label>
              <input type="text" id="hero-award-fr" value="${content.hero.award.fr || ''}">
            </div>
            <div class="form-group-admin" style="margin-bottom:12px;">
              <label for="hero-badge-fr">Location Badge (FR)</label>
              <input type="text" id="hero-badge-fr" value="${content.hero.badge.fr || ''}">
            </div>
            <div class="form-group-admin" style="margin-bottom:12px;">
              <label for="hero-title-fr">Hero Title (FR)</label>
              <input type="text" id="hero-title-fr" value="${content.hero.title.fr || ''}">
            </div>
            <div class="form-group-admin">
              <label for="hero-desc-fr">Hero Description (FR)</label>
              <textarea id="hero-desc-fr" rows="2">${content.hero.desc.fr || ''}</textarea>
            </div>
          </div>

          <div class="lang-edit-section">
            <div class="lang-section-header">Hero Details - تـونسي (TN)</div>
            <div class="form-group-admin" style="margin-bottom:12px; text-align:right;">
              <label for="hero-award-tn" style="display:block; text-align:right;">Award Badge (TN)</label>
              <input type="text" id="hero-award-tn" value="${content.hero.award.tn || ''}" dir="rtl">
            </div>
            <div class="form-group-admin" style="margin-bottom:12px; text-align:right;">
              <label for="hero-badge-tn" style="display:block; text-align:right;">Location Badge (TN)</label>
              <input type="text" id="hero-badge-tn" value="${content.hero.badge.tn || ''}" dir="rtl">
            </div>
            <div class="form-group-admin" style="margin-bottom:12px; text-align:right;">
              <label for="hero-title-tn" style="display:block; text-align:right;">Hero Title (TN)</label>
              <input type="text" id="hero-title-tn" value="${content.hero.title.tn || ''}" dir="rtl">
            </div>
            <div class="form-group-admin" style="text-align:right;">
              <label for="hero-desc-tn" style="display:block; text-align:right;">Hero Description (TN)</label>
              <textarea id="hero-desc-tn" rows="2" dir="rtl">${content.hero.desc.tn || ''}</textarea>
            </div>
          </div>
        </div>

        <div class="admin-card">
          <div class="admin-card-header">
            <h3>Restaurant Heritage Story (Our Story)</h3>
          </div>
          <div class="lang-edit-section">
            <div class="lang-section-header">Story Details - English (EN)</div>
            <div class="form-group-admin" style="margin-bottom:12px;">
              <label for="story-heritage-en">Badge</label>
              <input type="text" id="story-heritage-en" value="${content.story.heritage.en || ''}">
            </div>
            <div class="form-group-admin" style="margin-bottom:12px;">
              <label for="story-title-en">Section Title</label>
              <input type="text" id="story-title-en" value="${content.story.title.en || ''}">
            </div>
            <div class="form-group-admin" style="margin-bottom:12px;">
              <label for="story-p1-en">Paragraph 1 (HTML tags allowed)</label>
              <textarea id="story-p1-en" rows="2">${content.story.p1.en || ''}</textarea>
            </div>
            <div class="form-group-admin" style="margin-bottom:12px;">
              <label for="story-p2-en">Paragraph 2</label>
              <textarea id="story-p2-en" rows="3">${content.story.p2.en || ''}</textarea>
            </div>
            <div class="form-group-admin">
              <label for="story-p3-en">Paragraph 3</label>
              <textarea id="story-p3-en" rows="2">${content.story.p3.en || ''}</textarea>
            </div>
          </div>
          
          <!-- Tunisian translation -->
          <div class="lang-edit-section">
            <div class="lang-section-header">Story Details - تـونسي (TN)</div>
            <div class="form-group-admin" style="margin-bottom:12px; text-align:right;">
              <label for="story-heritage-tn" style="display:block; text-align:right;">Badge (TN)</label>
              <input type="text" id="story-heritage-tn" value="${content.story.heritage.tn || ''}" dir="rtl">
            </div>
            <div class="form-group-admin" style="margin-bottom:12px; text-align:right;">
              <label for="story-title-tn" style="display:block; text-align:right;">Section Title (TN)</label>
              <input type="text" id="story-title-tn" value="${content.story.title.tn || ''}" dir="rtl">
            </div>
            <div class="form-group-admin" style="margin-bottom:12px; text-align:right;">
              <label for="story-p1-tn" style="display:block; text-align:right;">Paragraph 1 (TN)</label>
              <textarea id="story-p1-tn" rows="2" dir="rtl">${content.story.p1.tn || ''}</textarea>
            </div>
            <div class="form-group-admin" style="margin-bottom:12px; text-align:right;">
              <label for="story-p2-tn" style="display:block; text-align:right;">Paragraph 2 (TN)</label>
              <textarea id="story-p2-tn" rows="3" dir="rtl">${content.story.p2.tn || ''}</textarea>
            </div>
            <div class="form-group-admin" style="text-align:right;">
              <label for="story-p3-tn" style="display:block; text-align:right;">Paragraph 3 (TN)</label>
              <textarea id="story-p3-tn" rows="2" dir="rtl">${content.story.p3.tn || ''}</textarea>
            </div>
          </div>
        </div>

        <div class="admin-card">
          <div class="admin-card-header">
            <h3>Contact Details & Hours</h3>
          </div>
          <div class="form-grid-admin" style="margin-bottom:16px;">
            <div class="form-group-admin">
              <label for="contact-phone">Phone Number</label>
              <input type="text" id="contact-phone" value="${content.contact.phone || ''}">
            </div>
            <div class="form-group-admin">
              <label for="contact-address-en">Address (EN)</label>
              <input type="text" id="contact-address-en" value="${content.contact.address.en || ''}">
            </div>
            <div class="form-group-admin">
              <label for="contact-address-tn">Address (TN)</label>
              <input type="text" id="contact-address-tn" value="${content.contact.address.tn || ''}" dir="rtl">
            </div>
          </div>
          
          <div class="lang-edit-section">
            <div class="lang-section-header">Operating Hours</div>
            <div class="form-grid-admin">
              <div class="form-group-admin">
                <label for="hours-weekday-en">Weekday hours (EN)</label>
                <input type="text" id="hours-weekday-en" value="${content.contact.hours.weekday.en || ''}">
              </div>
              <div class="form-group-admin">
                <label for="hours-weekend-en">Weekend hours (EN)</label>
                <input type="text" id="hours-weekend-en" value="${content.contact.hours.weekend.en || ''}">
              </div>
              <div class="form-group-admin">
                <label for="hours-weekday-tn">Weekday hours (TN)</label>
                <input type="text" id="hours-weekday-tn" value="${content.contact.hours.weekday.tn || ''}" dir="rtl">
              </div>
              <div class="form-group-admin">
                <label for="hours-weekend-tn">Weekend hours (TN)</label>
                <input type="text" id="hours-weekend-tn" value="${content.contact.hours.weekend.tn || ''}" dir="rtl">
              </div>
            </div>
          </div>
        </div>

        <div class="admin-card">
          <div class="admin-card-header">
            <h3>Social & Delivery Platform Links</h3>
          </div>
          <div class="form-grid-admin" style="margin-bottom:16px;">
            <div class="form-group-admin">
              <label for="social-instagram">Instagram Profile</label>
              <input type="text" id="social-instagram" value="${content.socials.instagram || ''}">
            </div>
            <div class="form-group-admin">
              <label for="social-tiktok">TikTok Profile</label>
              <input type="text" id="social-tiktok" value="${content.socials.tiktok || ''}">
            </div>
          </div>
          
          <div class="form-grid-admin">
            <div class="form-group-admin">
              <label for="delivery-yassir">Yassir Express URL</label>
              <input type="text" id="delivery-yassir" value="${content.delivery.yassir || ''}">
            </div>
            <div class="form-group-admin">
              <label for="delivery-glovo">Glovo Sousse URL</label>
              <input type="text" id="delivery-glovo" value="${content.delivery.glovo || ''}">
            </div>
            <div class="form-group-admin">
              <label for="delivery-zigzag">Zigzag Delivery URL</label>
              <input type="text" id="delivery-zigzag" value="${content.delivery.zigzag || ''}">
            </div>
            <div class="form-group-admin">
              <label for="delivery-menutium">Menutium URL</label>
              <input type="text" id="delivery-menutium" value="${content.delivery.menutium || ''}">
            </div>
          </div>
        </div>

        <div style="display:flex; gap:16px; margin-bottom:40px;">
          <button type="submit" class="btn-admin-primary" style="padding:14px 28px;">Save Website Content</button>
          <div id="content-feedback" style="display:none; align-items:center; color:var(--accent-success); font-weight:700; font-size:0.9rem;">✅ Website content saved successfully!</div>
        </div>
      </form>
    `;

    document.getElementById('website-content-form').addEventListener('submit', (e) => {
      e.preventDefault();
      saveWebsiteContent();
    });
  }

  const saveWebsiteContent = () => {
    if (typeof BabkeDB === 'undefined') return;

    const content = BabkeDB.getContent();

    // Gather values
    // Hero
    content.hero.award.en = document.getElementById('hero-award-en').value.trim();
    content.hero.badge.en = document.getElementById('hero-badge-en').value.trim();
    content.hero.title.en = document.getElementById('hero-title-en').value.trim();
    content.hero.desc.en = document.getElementById('hero-desc-en').value.trim();

    content.hero.award.fr = document.getElementById('hero-award-fr').value.trim();
    content.hero.badge.fr = document.getElementById('hero-badge-fr').value.trim();
    content.hero.title.fr = document.getElementById('hero-title-fr').value.trim();
    content.hero.desc.fr = document.getElementById('hero-desc-fr').value.trim();

    content.hero.award.tn = document.getElementById('hero-award-tn').value.trim();
    content.hero.badge.tn = document.getElementById('hero-badge-tn').value.trim();
    content.hero.title.tn = document.getElementById('hero-title-tn').value.trim();
    content.hero.desc.tn = document.getElementById('hero-desc-tn').value.trim();

    // Story
    content.story.heritage.en = document.getElementById('story-heritage-en').value.trim();
    content.story.title.en = document.getElementById('story-title-en').value.trim();
    content.story.p1.en = document.getElementById('story-p1-en').value.trim();
    content.story.p2.en = document.getElementById('story-p2-en').value.trim();
    content.story.p3.en = document.getElementById('story-p3-en').value.trim();

    content.story.heritage.tn = document.getElementById('story-heritage-tn').value.trim();
    content.story.title.tn = document.getElementById('story-title-tn').value.trim();
    content.story.p1.tn = document.getElementById('story-p1-tn').value.trim();
    content.story.p2.tn = document.getElementById('story-p2-tn').value.trim();
    content.story.p3.tn = document.getElementById('story-p3-tn').value.trim();

    // French fallback copy
    content.story.heritage.fr = content.story.heritage.en;
    content.story.title.fr = content.story.title.en;
    content.story.p1.fr = content.story.p1.en;
    content.story.p2.fr = content.story.p2.en;
    content.story.p3.fr = content.story.p3.en;

    // Contact
    content.contact.phone = document.getElementById('contact-phone').value.trim();
    content.contact.address.en = document.getElementById('contact-address-en').value.trim();
    content.contact.address.tn = document.getElementById('contact-address-tn').value.trim();
    content.contact.address.fr = content.contact.address.en;

    // Hours
    content.contact.hours.weekday.en = document.getElementById('hours-weekday-en').value.trim();
    content.contact.hours.weekend.en = document.getElementById('hours-weekend-en').value.trim();
    content.contact.hours.weekday.tn = document.getElementById('hours-weekday-tn').value.trim();
    content.contact.hours.weekend.tn = document.getElementById('hours-weekend-tn').value.trim();
    content.contact.hours.weekday.fr = content.contact.hours.weekday.en;
    content.contact.hours.weekend.fr = content.contact.hours.weekend.en;

    // Socials
    content.socials.instagram = document.getElementById('social-instagram').value.trim();
    content.socials.tiktok = document.getElementById('social-tiktok').value.trim();

    // Delivery
    content.delivery.yassir = document.getElementById('delivery-yassir').value.trim();
    content.delivery.glovo = document.getElementById('delivery-glovo').value.trim();
    content.delivery.zigzag = document.getElementById('delivery-zigzag').value.trim();
    content.delivery.menutium = document.getElementById('delivery-menutium').value.trim();

    BabkeDB.saveContent(content);
    addActivityLog("Website Content updated");

    const feedback = document.getElementById('content-feedback');
    if (feedback) {
      feedback.style.display = 'flex';
      setTimeout(() => {
        feedback.style.display = 'none';
      }, 4000);
    }
  };


  // D. GALLERY MANAGEMENT PANEL
  function renderGalleryPanel() {
    const contentArea = document.getElementById('admin-body-content');
    if (!contentArea) return;

    const gallery = BabkeDB.getGallery();

    let cardsHtml = gallery.map((item, index) => {
      return `
        <div class="admin-gallery-card">
          <img src="${getAdminImageSrc(item.image)}" alt="${item.alt}">
          <div class="admin-gallery-overlay">
            <button class="btn-admin-action shift-left" data-index="${index}" title="Move Left" ${index === 0 ? 'disabled style="opacity:0.3;pointer-events:none;"' : ''}>◀️</button>
            <button class="btn-admin-action delete btn-delete-gallery-item" data-id="${item.id}" data-index="${index}" title="Delete Photo">🗑️</button>
            <button class="btn-admin-action shift-right" data-index="${index}" title="Move Right" ${index === gallery.length - 1 ? 'disabled style="opacity:0.3;pointer-events:none;"' : ''}>▶️</button>
          </div>
          <div class="admin-gallery-order-badge">#${index + 1}</div>
        </div>
      `;
    }).join('');

    contentArea.innerHTML = `
      <div class="admin-card">
        <div class="admin-card-header">
          <h3>Visual Gallery Registry (${gallery.length} photos)</h3>
          
          <div style="display:flex; align-items:center; gap:12px;">
            <input type="file" id="gallery-image-uploader" accept="image/*" style="display:none;">
            <button class="btn-admin-primary" onclick="document.getElementById('gallery-image-uploader').click();">
              <span>+ Upload Photo</span>
            </button>
          </div>
        </div>
        
        <div class="admin-gallery-list">
          ${cardsHtml ? cardsHtml : '<p style="grid-column: span 4; text-align:center; padding:40px; color:var(--text-admin-muted);">No images uploaded in gallery. Add photo above!</p>'}
        </div>
      </div>
    `;

    // Bind Uploader
    const uploaderInput = document.getElementById('gallery-image-uploader');
    if (uploaderInput) {
      uploaderInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64Str = event.target.result;
          
          const newPhoto = {
            id: "gal-" + Date.now(),
            image: base64Str,
            alt: "Uploaded Babke food shot",
            likes: Math.floor(Math.random() * 800 + 200) + ""
          };

          try {
            await BabkeDB.addGalleryPhoto(newPhoto);
            addActivityLog("New photo uploaded to gallery");
            renderGalleryPanel();
          } catch (err) {
            console.error("Error uploading gallery photo:", err);
            alert("Failed to upload photo!");
          }
        };
        reader.readAsDataURL(file);
      });
    }

    // Bind shift actions
    document.querySelectorAll('.btn-admin-action.shift-left').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index);
        swapGalleryIndices(idx, idx - 1);
      });
    });

    document.querySelectorAll('.btn-admin-action.shift-right').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index);
        swapGalleryIndices(idx, idx + 1);
      });
    });

    // Bind delete
    document.querySelectorAll('.btn-delete-gallery-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const idx = parseInt(e.currentTarget.dataset.index);
        if (confirm(`Are you sure you want to delete gallery photo #${idx + 1}?`)) {
          deleteGalleryItem(id, idx);
        }
      });
    });
  }

  const swapGalleryIndices = async (idxA, idxB) => {
    const gallery = BabkeDB.getGallery();
    if (idxA < 0 || idxA >= gallery.length || idxB < 0 || idxB >= gallery.length) return;

    // Swap elements
    const temp = gallery[idxA];
    gallery[idxA] = gallery[idxB];
    gallery[idxB] = temp;

    await BabkeDB.saveGallery(gallery);
    addActivityLog(`Gallery photos reordered (#${idxA + 1} swapped with #${idxB + 1})`);
    renderGalleryPanel();
  };

  const deleteGalleryItem = async (id, index) => {
    try {
      await BabkeDB.deleteGalleryPhoto(id);
      addActivityLog(`Gallery photo #${index + 1} deleted`);
      renderGalleryPanel();
    } catch (err) {
      console.error("Error deleting gallery photo:", err);
      alert("Failed to delete gallery photo!");
    }
  };


  // E. REVIEWS PANEL
  function renderReviewsPanel() {
    const contentArea = document.getElementById('admin-body-content');
    if (!contentArea) return;

    const reviews = BabkeDB.getReviews();

    let rowsHtml = reviews.map(item => {
      const starsStr = '★'.repeat(item.stars) + '☆'.repeat(5 - item.stars);
      return `
        <tr style="${item.hidden ? 'opacity: 0.5;' : ''}">
          <td><strong style="font-size:0.95rem; color:var(--text-admin-primary);">${item.author}</strong><span style="font-size:0.75rem; color:var(--text-admin-muted); display:block;">${item.role}</span></td>
          <td><span style="color:var(--accent-warning); font-size:1rem;">${starsStr}</span></td>
          <td style="max-width:320px; font-style:italic;">"${item.text}"</td>
          <td>
            <button class="btn-admin-secondary btn-toggle-review-feature" data-id="${item.id}" style="padding:4px 10px; font-size:0.75rem;">
              ${item.featured ? '⭐ Featured' : '☆ Standard'}
            </button>
          </td>
          <td>
            <button class="btn-admin-secondary btn-toggle-review-hide" data-id="${item.id}" style="padding:4px 10px; font-size:0.75rem;">
              ${item.hidden ? '👁️ Hidden' : '🟢 Visible'}
            </button>
          </td>
          <td>
            <div class="btn-action-row">
              <button class="btn-admin-action btn-edit-review" data-id="${item.id}" title="Edit Review">✏️</button>
              <button class="btn-admin-action delete btn-delete-review" data-id="${item.id}" title="Delete Review">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    contentArea.innerHTML = `
      <div class="admin-card">
        <div class="admin-card-header">
          <h3>Customer Reviews Testimonials (${reviews.length} reviews)</h3>
          <button class="btn-admin-primary" id="btn-add-new-review">
            <span>+ Add Review</span>
          </button>
        </div>
        
        <div class="table-responsive-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Author</th>
                <th>Stars</th>
                <th>Content</th>
                <th>Highlight</th>
                <th>Visibility</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml ? rowsHtml : '<tr><td colspan="6" style="text-align:center; color:var(--text-admin-muted);">No reviews found. Click add review to write one!</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Bind buttons
    document.getElementById('btn-add-new-review').addEventListener('click', () => openReviewModal());

    document.querySelectorAll('.btn-toggle-review-feature').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        toggleReviewFeature(id);
      });
    });

    document.querySelectorAll('.btn-toggle-review-hide').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        toggleReviewVisibility(id);
      });
    });

    document.querySelectorAll('.btn-edit-review').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        openReviewModal(id);
      });
    });

    document.querySelectorAll('.btn-delete-review').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        if (confirm("Are you sure you want to delete this review?")) {
          deleteReview(id);
        }
      });
    });
  }

  // Review Modal controls
  const reviewModal = document.getElementById('review-editor-modal');
  const closeReviewModalBtn = document.getElementById('btn-close-review-modal');
  const cancelReviewModalBtn = document.getElementById('btn-cancel-review-editor');
  const reviewForm = document.getElementById('review-item-form');

  const openReviewModal = (reviewId = null) => {
    reviewForm.reset();
    const modalTitle = document.getElementById('review-modal-title');

    if (reviewId) {
      modalTitle.textContent = "Edit Review";
      const review = BabkeDB.getReviews().find(r => r.id === reviewId);
      if (review) {
        document.getElementById('review-form-id').value = review.id;
        document.getElementById('review-form-author').value = review.author;
        document.getElementById('review-form-role').value = review.role;
        document.getElementById('review-form-stars').value = review.stars;
        document.getElementById('review-form-text').value = review.text;
        document.getElementById('review-form-date').value = review.date;
      }
    } else {
      modalTitle.textContent = "Add Review";
      document.getElementById('review-form-id').value = '';
      document.getElementById('review-form-date').value = 'Google Review';
    }

    reviewModal.classList.add('open');
  };

  const closeReviewModal = () => {
    reviewModal.classList.remove('open');
  };

  if (closeReviewModalBtn) closeReviewModalBtn.addEventListener('click', closeReviewModal);
  if (cancelReviewModalBtn) cancelReviewModalBtn.addEventListener('click', closeReviewModal);

  // Review Form Submit
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('review-form-id').value;
      const author = document.getElementById('review-form-author').value.trim();
      const role = document.getElementById('review-form-role').value.trim();
      const stars = parseInt(document.getElementById('review-form-stars').value);
      const text = document.getElementById('review-form-text').value.trim();
      const date = document.getElementById('review-form-date').value.trim();

      const reviews = BabkeDB.getReviews();

      const reviewData = {
        id: id || "rev-" + Date.now(),
        stars: stars,
        date: date,
        text: text,
        author: author,
        role: role,
        avatar: author.charAt(0).toUpperCase(),
        featured: id ? (reviews.find(r => r.id === id)?.featured || false) : false,
        hidden: id ? (reviews.find(r => r.id === id)?.hidden || false) : false
      };

      const submitBtn = reviewForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Saving...";

      try {
        await BabkeDB.saveReviewItem(reviewData);
        if (id) {
          addActivityLog(`Review by '${author}' updated`);
        } else {
          addActivityLog(`New review by '${author}' added`);
        }
        closeReviewModal();
        renderReviewsPanel();
      } catch (err) {
        console.error("Error saving review:", err);
        alert("Failed to save review!");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  const toggleReviewFeature = async (id) => {
    const reviews = BabkeDB.getReviews();
    const idx = reviews.findIndex(r => r.id === id);
    if (idx > -1) {
      const review = { ...reviews[idx], featured: !reviews[idx].featured };
      try {
        await BabkeDB.saveReviewItem(review);
        addActivityLog(`Review by '${review.author}' featured set to ${review.featured}`);
        renderReviewsPanel();
      } catch (err) {
        console.error("Error toggling review feature:", err);
      }
    }
  };

  const toggleReviewVisibility = async (id) => {
    const reviews = BabkeDB.getReviews();
    const idx = reviews.findIndex(r => r.id === id);
    if (idx > -1) {
      const review = { ...reviews[idx], hidden: !reviews[idx].hidden };
      try {
        await BabkeDB.saveReviewItem(review);
        addActivityLog(`Review by '${review.author}' visibility toggled (${review.hidden ? 'Hidden' : 'Visible'})`);
        renderReviewsPanel();
      } catch (err) {
        console.error("Error toggling review visibility:", err);
      }
    }
  };

  const deleteReview = async (id) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    const reviews = BabkeDB.getReviews();
    const item = reviews.find(r => r.id === id);
    const author = item ? item.author : id;

    try {
      await BabkeDB.deleteReviewItem(id);
      addActivityLog(`Review by '${author}' deleted`);
      renderReviewsPanel();
    } catch (err) {
      console.error("Error deleting review:", err);
      alert("Failed to delete review!");
    }
  };

  // G. EVENTS MANAGEMENT PANEL
  function renderEventsPanel() {
    const contentArea = document.getElementById('admin-body-content');
    if (!contentArea) return;

    const events = BabkeDB.getEvents();

    let rowsHtml = events.map(event => {
      const titleEn = event.title.en || 'No title';
      const durationEn = event.duration.en || '';
      const locationEn = event.location.en || '';
      let badgeClass = 'draft';
      if (event.status === 'published') badgeClass = 'published';
      else if (event.status === 'cancelled') badgeClass = 'cancelled';
      else if (event.status === 'archived') badgeClass = 'archived';

      const statusText = event.status === 'archived' ? 'PAST / ARCHIVED' : event.status.toUpperCase();

      return `
        <tr>
          <td>
            <img class="table-img" src="${getAdminImageSrc(event.image)}" onerror="this.onerror=null; this.src='${getAdminImageSrc(event.fallbackImage)}';" alt="${titleEn}">
          </td>
          <td>
            <strong style="display:block; font-size:0.95rem; color:var(--text-admin-primary);">${titleEn}</strong>
            <span style="color:var(--text-admin-muted); font-size:0.75rem;">ID: ${event.id}</span>
          </td>
          <td>
            <strong style="display:block; font-size:0.88rem;">${event.date}</strong>
            <span style="color:var(--text-admin-secondary); font-size:0.75rem;">${durationEn}</span>
          </td>
          <td>${locationEn}</td>
          <td><span class="status-badge ${badgeClass}">${statusText}</span></td>
          <td>
            <div class="btn-action-row">
              <button class="btn-admin-action btn-edit-event" data-id="${event.id}" title="Edit Event">✏️</button>
              <button class="btn-admin-action delete btn-delete-event" data-id="${event.id}" title="Delete Event">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    contentArea.innerHTML = `
      <div class="admin-card">
        <div class="admin-card-header">
          <h3>Upcoming Events Registry (${events.length} events)</h3>
          <button class="btn-admin-primary" id="btn-add-new-event">
            <span>+ Add New Event</span>
          </button>
        </div>
        
        <div class="table-responsive-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Cover</th>
                <th>Event Title / ID</th>
                <th>Date / Duration</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml ? rowsHtml : `<tr><td colspan="6" style="text-align:center; color:var(--text-admin-muted);">No events found. Click add new to create one!</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Bind event buttons
    document.getElementById('btn-add-new-event').addEventListener('click', () => openEventModal());
    
    document.querySelectorAll('.btn-edit-event').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        openEventModal(id);
      });
    });

    document.querySelectorAll('.btn-delete-event').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        if (confirm("Are you sure you want to delete this event?")) {
          deleteEvent(id);
        }
      });
    });
  }

  // Event Modal controls
  const eventModal = document.getElementById('event-editor-modal');
  const closeEventModalBtn = document.getElementById('btn-close-event-modal');
  const cancelEventModalBtn = document.getElementById('btn-cancel-event-editor');
  const eventForm = document.getElementById('event-item-form');
  const eventFileInput = document.getElementById('event-form-file-input');
  const eventBase64Input = document.getElementById('event-form-image-base64');
  const eventPreviewBox = document.getElementById('event-form-image-preview');

  const openEventModal = (eventId = null) => {
    eventForm.reset();
    eventBase64Input.value = '';
    eventPreviewBox.innerHTML = '<span class="placeholder-icon">📸</span>';
    
    const modalTitle = document.getElementById('event-modal-title');

    if (eventId) {
      modalTitle.textContent = "Edit Event";
      const event = BabkeDB.getEvents().find(e => e.id === eventId);
      if (event) {
        document.getElementById('event-form-id').value = event.id;
        document.getElementById('event-form-date').value = event.date || '';
        document.getElementById('event-form-status').value = event.status || 'published';
        
        // base64/image preview
        eventBase64Input.value = event.image;
        eventPreviewBox.innerHTML = `<img src="${getAdminImageSrc(event.image)}" onerror="this.onerror=null; this.src='${getAdminImageSrc(event.fallbackImage)}';">`;

        // Localized fields
        document.getElementById('event-form-title-en').value = event.title.en || '';
        document.getElementById('event-form-duration-en').value = event.duration.en || '';
        document.getElementById('event-form-location-en').value = event.location.en || '';
        document.getElementById('event-form-desc-en').value = event.description.en || '';

        document.getElementById('event-form-title-fr').value = event.title.fr || '';
        document.getElementById('event-form-duration-fr').value = event.duration.fr || '';
        document.getElementById('event-form-location-fr').value = event.location.fr || '';
        document.getElementById('event-form-desc-fr').value = event.description.fr || '';

        document.getElementById('event-form-title-tn').value = event.title.tn || '';
        document.getElementById('event-form-duration-tn').value = event.duration.tn || '';
        document.getElementById('event-form-location-tn').value = event.location.tn || '';
        document.getElementById('event-form-desc-tn').value = event.description.tn || '';
      }
    } else {
      modalTitle.textContent = "Add Event";
      document.getElementById('event-form-id').value = '';
      document.getElementById('event-form-status').value = 'published';
    }

    eventModal.classList.add('open');
  };

  const closeEventModal = () => {
    eventModal.classList.remove('open');
  };

  if (closeEventModalBtn) closeEventModalBtn.addEventListener('click', closeEventModal);
  if (cancelEventModalBtn) cancelEventModalBtn.addEventListener('click', closeEventModal);

  // File Upload to base64 converter for events
  if (eventFileInput) {
    eventFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target.result;
        eventBase64Input.value = base64String;
        eventPreviewBox.innerHTML = `<img src="${base64String}">`;
      };
      reader.readAsDataURL(file);
    });
  }

  // Event Form Submit
  if (eventForm) {
    eventForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('event-form-id').value;
      const date = document.getElementById('event-form-date').value;
      const status = document.getElementById('event-form-status').value;
      const base64Image = eventBase64Input.value.trim();

      const titleEn = document.getElementById('event-form-title-en').value.trim();
      const durationEn = document.getElementById('event-form-duration-en').value.trim();
      const locationEn = document.getElementById('event-form-location-en').value.trim();
      const descEn = document.getElementById('event-form-desc-en').value.trim();

      const titleFr = document.getElementById('event-form-title-fr').value.trim() || titleEn;
      const durationFr = document.getElementById('event-form-duration-fr').value.trim() || durationEn;
      const locationFr = document.getElementById('event-form-location-fr').value.trim() || locationEn;
      const descFr = document.getElementById('event-form-desc-fr').value.trim() || descEn;

      const titleTn = document.getElementById('event-form-title-tn').value.trim() || titleEn;
      const durationTn = document.getElementById('event-form-duration-tn').value.trim() || durationEn;
      const locationTn = document.getElementById('event-form-location-tn').value.trim() || locationEn;
      const descTn = document.getElementById('event-form-desc-tn').value.trim() || descEn;

      const eventData = {
        id: id || "evt-" + Date.now(),
        image: base64Image || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80",
        fallbackImage: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80",
        date: date,
        status: status,
        title: { en: titleEn, fr: titleFr, tn: titleTn },
        duration: { en: durationEn, fr: durationFr, tn: durationTn },
        location: { en: locationEn, fr: locationFr, tn: locationTn },
        description: { en: descEn, fr: descFr, tn: descTn }
      };

      const submitBtn = eventForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Saving...";

      try {
        await BabkeDB.saveEventItem(eventData);
        if (id) {
          addActivityLog(`Event '${titleEn}' updated`);
        } else {
          addActivityLog(`New event '${titleEn}' created`);
        }
        closeEventModal();
        renderEventsPanel();
      } catch (err) {
        console.error("Error saving event:", err);
        alert("Failed to save event!");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  const deleteEvent = async (id) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    const events = BabkeDB.getEvents();
    const item = events.find(e => e.id === id);
    const title = item ? item.title.en : id;

    try {
      await BabkeDB.deleteEventItem(id);
      addActivityLog(`Event '${title}' deleted`);
      renderEventsPanel();
    } catch (err) {
      console.error("Error deleting event:", err);
      alert("Failed to delete event!");
    }
  };

  // F. ORDERS & RESERVATIONS LOGS PANEL
  let activeLogSubTab = 'orders'; // orders or reservations

  function renderOrdersReservationsPanel() {
    const contentArea = document.getElementById('admin-body-content');
    if (!contentArea) return;

    const orders = BabkeDB.getOrders();
    const reservations = BabkeDB.getReservations();

    let tableHeader = '';
    let tableRows = '';

    if (activeLogSubTab === 'orders') {
      tableHeader = `
        <tr>
          <th>Order ID</th>
          <th>Customer Information</th>
          <th>Ordered Feast Items</th>
          <th>Subtotal</th>
          <th>Status</th>
          <th>Date Created</th>
        </tr>
      `;

      tableRows = orders.map(o => {
        const itemsHtml = o.items.map(item => {
          const addonsStr = (item.addons && item.addons.length > 0) ? `<br><small style="color:var(--text-admin-muted);">+ ${item.addons.join(', ')}</small>` : '';
          return `• <strong>${item.qty}x ${item.name}</strong> (${item.spice})${addonsStr}`;
        }).join('<br>');

        return `
          <tr>
            <td><strong style="color:var(--accent-admin); font-family:'Outfit';">${o.id}</strong></td>
            <td>
              <strong>${o.customer.name}</strong><br>
              <span style="font-size:0.75rem; color:var(--text-admin-muted);">${o.customer.phone}</span><br>
              <span style="font-size:0.72rem; color:var(--text-admin-secondary);">${o.customer.address}</span>
            </td>
            <td style="font-size:0.8rem; line-height:1.4;">${itemsHtml}</td>
            <td><strong>${o.subtotal.toFixed(1)} TND</strong></td>
            <td>
              <select class="table-status-select order-status-updater" data-id="${o.id}">
                <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending ⏳</option>
                <option value="preparing" ${o.status === 'preparing' ? 'selected' : ''}>Preparing 🔥</option>
                <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Delivered 🟢</option>
                <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled 🗑️</option>
              </select>
            </td>
            <td><span style="font-size:0.75rem; color:var(--text-admin-muted);">${new Date(o.createdAt).toLocaleString()}</span></td>
          </tr>
        `;
      }).join('');
    } else {
      // Reservations
      tableHeader = `
        <tr>
          <th>Booking ID</th>
          <th>Customer Details</th>
          <th>Schedule Date & Time</th>
          <th>Guests</th>
          <th>Notes</th>
          <th>Status</th>
          <th>Date Created</th>
        </tr>
      `;

      tableRows = reservations.map(r => {
        return `
          <tr>
            <td><strong style="color:var(--accent-info); font-family:'Outfit';">${r.id}</strong></td>
            <td>
              <strong>${r.name}</strong><br>
              <span style="font-size:0.75rem; color:var(--text-admin-muted);">${r.phone}</span>
            </td>
            <td>
              <strong>📅 ${r.date}</strong><br>
              <span style="color:var(--accent-info); font-weight:700;">🕒 ${r.time}</span>
            </td>
            <td><span class="status-badge info" style="font-size:0.75rem; font-weight:800;">${r.guests} Guests</span></td>
            <td style="max-width:180px; font-size:0.76rem; font-style:italic;">${r.notes ? `"${r.notes}"` : '-'}</td>
            <td>
              <select class="table-status-select reservation-status-updater" data-id="${r.id}">
                <option value="pending" ${r.status === 'pending' ? 'selected' : ''}>Pending ⏳</option>
                <option value="confirmed" ${r.status === 'confirmed' ? 'selected' : ''}>Confirmed ✅</option>
                <option value="cancelled" ${r.status === 'cancelled' ? 'selected' : ''}>Cancelled 🗑️</option>
              </select>
            </td>
            <td><span style="font-size:0.75rem; color:var(--text-admin-muted);">${new Date(r.createdAt).toLocaleString()}</span></td>
          </tr>
        `;
      }).join('');
    }

    contentArea.innerHTML = `
      <!-- Sub tabs selectors -->
      <div style="display:flex; gap:12px; margin-bottom:20px; border-bottom:1px solid var(--border-admin); padding-bottom:12px;">
        <button class="btn-admin-secondary ${activeLogSubTab === 'orders' ? 'btn-admin-primary' : ''}" id="btn-tab-select-orders" style="padding:8px 16px;">
          📦 Incoming Orders (${orders.length})
        </button>
        <button class="btn-admin-secondary ${activeLogSubTab === 'reservations' ? 'btn-admin-primary' : ''}" id="btn-tab-select-reservations" style="padding:8px 16px;">
          📅 Table Reservations (${reservations.length})
        </button>
      </div>

      <div class="admin-card">
        <div class="admin-card-header">
          <h3>${activeLogSubTab === 'orders' ? 'WhatsApp captured orders' : 'Customer online bookings'}</h3>
        </div>
        
        <div class="table-responsive-wrapper">
          <table class="admin-table">
            <thead>
              ${tableHeader}
            </thead>
            <tbody>
              ${tableRows ? tableRows : `<tr><td colspan="7" style="text-align:center; color:var(--text-admin-muted);">No entries found under this section.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Bind sub tabs clicks
    document.getElementById('btn-tab-select-orders').addEventListener('click', () => {
      activeLogSubTab = 'orders';
      renderOrdersReservationsPanel();
    });

    document.getElementById('btn-tab-select-reservations').addEventListener('click', () => {
      activeLogSubTab = 'reservations';
      renderOrdersReservationsPanel();
    });

    // Bind Status selectors change listeners
    document.querySelectorAll('.order-status-updater').forEach(select => {
      select.addEventListener('change', async (e) => {
        const id = e.currentTarget.dataset.id;
        const status = e.currentTarget.value;
        const selectEl = e.currentTarget;
        selectEl.disabled = true;
        try {
          const success = await BabkeDB.updateOrderStatus(id, status);
          if (success) {
            addActivityLog(`Order '${id}' status updated to '${status}'`);
          } else {
            alert("Failed to update status on server!");
          }
        } catch (err) {
          console.error("Order status update failed:", err);
        } finally {
          selectEl.disabled = false;
          renderOrdersReservationsPanel();
        }
      });
    });

    document.querySelectorAll('.reservation-status-updater').forEach(select => {
      select.addEventListener('change', async (e) => {
        const id = e.currentTarget.dataset.id;
        const status = e.currentTarget.value;
        const selectEl = e.currentTarget;
        selectEl.disabled = true;
        try {
          const success = await BabkeDB.updateReservationStatus(id, status);
          if (success) {
            addActivityLog(`Reservation '${id}' status updated to '${status}'`);
          } else {
            alert("Failed to update status on server!");
          }
        } catch (err) {
          console.error("Reservation status update failed:", err);
        } finally {
          selectEl.disabled = false;
          renderOrdersReservationsPanel();
        }
      });
    });
  }


  // Helper time relative formatter
  function formatRelativeTime(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = Math.floor(seconds / 31536000);

    if (interval >= 1) return interval + " years ago";
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + " months ago";
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + " days ago";
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + " hours ago";
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + " minutes ago";
    return "just now";
  }

  // 7. CROSS-TAB REAL-TIME SYNCHRONIZATION
  window.addEventListener('babkeOrdersChanged', () => {
    addActivityLog("Orders log synced in real-time");
    if (currentActivePanel === 'overview') {
      renderOverviewPanel();
    } else if (currentActivePanel === 'orders-reservations') {
      renderOrdersReservationsPanel();
    }
  });

  window.addEventListener('babkeReservationsChanged', () => {
    addActivityLog("Reservations logs synced in real-time");
    if (currentActivePanel === 'overview') {
      renderOverviewPanel();
    } else if (currentActivePanel === 'orders-reservations') {
      renderOrdersReservationsPanel();
    }
  });

  // Background polling every 30 seconds
  setInterval(async () => {
    if (typeof BabkeDB !== 'undefined') {
      try {
        await BabkeDB.init(true);
        // Dispatch local events to update dashboard tabs
        window.dispatchEvent(new Event('babkeMenuChanged'));
        window.dispatchEvent(new Event('babkeReviewsChanged'));
        window.dispatchEvent(new Event('babkeEventsChanged'));
        window.dispatchEvent(new Event('babkeGalleryChanged'));
        window.dispatchEvent(new Event('babkeOrdersChanged'));
        window.dispatchEvent(new Event('babkeReservationsChanged'));
      } catch (err) {
        console.error("Polling sync failed:", err);
      }
    }
  }, 30000);

  // Check auth state on script start
  checkAuth();
});
