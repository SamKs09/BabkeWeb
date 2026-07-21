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

  // Immersive Glassmorphic Toast Notification utility
  const showToast = (message) => {
    let container = document.querySelector('.babke-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'babke-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'babke-toast';
    toast.innerHTML = `
      <div class="babke-toast-accent"></div>
      <span style="font-weight: 500;">${message}</span>
    `;

    container.appendChild(toast);
    // Trigger entry transition
    setTimeout(() => toast.classList.add('show'), 50);

    // Auto remove
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  };

  // Live Notifications Indicators & Auditory Alerts (UX Upgrade)
  let unreadNotificationCount = 0;

  const updatePageTitle = () => {
    if (unreadNotificationCount > 0) {
      document.title = `(${unreadNotificationCount}) Babke Admin Dashboard`;
    } else {
      document.title = `Babke Admin Dashboard`;
    }
  };

  const playNotificationAlert = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      // Dual-tone high chime (G5 & C6)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(783.99, ctx.currentTime);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.50, ctx.currentTime);

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.12, ctx.currentTime);

      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      masterGain.connect(ctx.destination);

      gain1.gain.setValueAtTime(0.5, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      gain2.gain.setValueAtTime(0.3, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.8);
      osc2.stop(ctx.currentTime + 0.8);

      // Gentle charcoal sizzle sound (high-frequency bandpassed noise)
      const bufferSize = ctx.sampleRate * 0.4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 3000;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.08, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(ctx.currentTime);
      noise.stop(ctx.currentTime + 0.4);
    } catch (err) {
      console.warn("Web Audio chime failed (requires user interaction first):", err);
    }
  };

  // Real-time server notifications connection stream
  let eventSource = null;
  const startSseStream = () => {
    if (eventSource) eventSource.close();
    
    eventSource = new EventSource('/api/admin/events-stream');

    eventSource.addEventListener('newOrder', (e) => {
      try {
        const order = JSON.parse(e.data);
        addActivityLog(`New Order received: ${order.id}`);
        showToast(`New Order from ${order.customer.name}!`);
        
        // Trigger live alert indicator & audio chime (UX Upgrade)
        unreadNotificationCount++;
        updatePageTitle();
        playNotificationAlert();

        // Refresh overview/orders page if currently looking at it
        if (currentActivePanel === 'orders-reservations' || currentActivePanel === 'overview') {
          switchPanel(currentActivePanel);
        }
      } catch (err) {
        console.error("Error processing newOrder SSE event:", err);
      }
    });

    eventSource.addEventListener('newReservation', (e) => {
      try {
        const reservation = JSON.parse(e.data);
        addActivityLog(`New Reservation booked: ${reservation.id}`);
        showToast(`New Reservation for ${reservation.guests} guests!`);
        
        // Trigger live alert indicator & audio chime (UX Upgrade)
        unreadNotificationCount++;
        updatePageTitle();
        playNotificationAlert();

        if (currentActivePanel === 'orders-reservations' || currentActivePanel === 'overview') {
          switchPanel(currentActivePanel);
        }
      } catch (err) {
        console.error("Error processing newReservation SSE event:", err);
      }
    });

    eventSource.addEventListener('newLeftover', (e) => {
      try {
        const leftover = JSON.parse(e.data);
        addActivityLog(`New leftover logged: ${leftover.item}`);
        showToast(`Leftovers updated: ${leftover.item}!`);
        if (currentActivePanel === 'leftovers') {
          switchPanel(currentActivePanel);
        }
      } catch (err) {
        console.error("Error processing newLeftover SSE event:", err);
      }
    });

    eventSource.addEventListener('deleteLeftover', (e) => {
      try {
        if (currentActivePanel === 'leftovers') {
          switchPanel(currentActivePanel);
        }
      } catch (err) {
        console.error("Error processing deleteLeftover SSE event:", err);
      }
    });

    eventSource.onerror = (err) => {
      console.warn("SSE connection error. Closing stream...", err);
      eventSource.close();
      // Retry connection after 5 seconds
      setTimeout(startSseStream, 5000);
    };
  };

  // Client-side Canvas Image Compression helper
  const compressImage = (file, maxWidth = 800, maxHeight = 800) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8)); // compress to 80% quality JPEG
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
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

  let userRole = 'admin'; // 'admin' or 'worker'

  const checkAuth = async () => {
    if (typeof BABKE_CONFIG === 'undefined') {
      console.error("BABKE_CONFIG settings not loaded.");
      return;
    }

    try {
      const res = await fetch('/api/admin/verify');
      if (res.ok) {
        const data = await res.json();
        userRole = data.role || 'admin';

        if (loginWrapper) loginWrapper.style.display = 'none';
        if (adminShell) adminShell.style.display = 'flex';

        // Toggle sidebar button visibility depending on role
        const navButtons = document.querySelectorAll('.nav-item-btn[data-panel]');
        if (userRole === 'worker') {
          navButtons.forEach(btn => {
            if (btn.dataset.panel !== 'leftovers') {
              btn.style.display = 'none';
            } else {
              btn.style.display = 'flex';
              const span = btn.querySelector('span');
              if (span) span.textContent = 'Leftovers Entry';
            }
          });
          // Workers must land on leftovers panel
          currentActivePanel = 'leftovers';
        } else {
          navButtons.forEach(btn => {
            btn.style.display = 'flex';
            if (btn.dataset.panel === 'leftovers') {
              const span = btn.querySelector('span');
              if (span) span.textContent = 'Leftovers & Analytics';
            }
          });
        }

        switchPanel(currentActivePanel);
        startSseStream(); // Initialize SSE listener for real-time bookings/orders
      } else {
        if (loginWrapper) loginWrapper.style.display = 'flex';
        if (adminShell) adminShell.style.display = 'none';
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
      }
    } catch (err) {
      console.error("Auth verification failed:", err);
      if (loginWrapper) loginWrapper.style.display = 'flex';
      if (adminShell) adminShell.style.display = 'none';
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
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
            if (loginErrorMsg) loginErrorMsg.style.display = 'none';
            loginForm.reset();
            await checkAuth();
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
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch('/api/admin/logout', { method: 'POST' });
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        addActivityLog("Administrator logged out");
        await checkAuth();
      } catch (err) {
        console.error("Logout request failed:", err);
      }
    });
  }

  // 4. ROUTING BETWEEN DASHBOARD PANELS
  let currentActivePanel = 'overview'; // Default

  const switchPanel = async (panelName) => {
    currentActivePanel = panelName;
    
    // Reset notifications when visiting the orders logs
    if (panelName === 'orders-reservations') {
      unreadNotificationCount = 0;
      updatePageTitle();
    }
    
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
      case 'leftovers':
        renderLeftoversPanel();
        break;
    }
  };

  // Wire sidebar clicks
  document.querySelectorAll('.nav-item-btn[data-panel]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetPanel = e.currentTarget.dataset.panel;
      switchPanel(targetPanel);

      // Auto close sidebar drawer on mobile after selection
      const sidebar = document.getElementById('admin-sidebar');
      const overlay = document.getElementById('sidebar-overlay');
      if (sidebar) sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('active');
    });
  });

  // Mobile menu drawer toggle listeners
  const menuToggleBtn = document.getElementById('menu-toggle-btn');
  const adminSidebar = document.getElementById('admin-sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');

  if (menuToggleBtn && adminSidebar && sidebarOverlay) {
    menuToggleBtn.addEventListener('click', () => {
      adminSidebar.classList.add('open');
      sidebarOverlay.classList.add('active');
    });

    sidebarOverlay.addEventListener('click', () => {
      adminSidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
    });
  }


  // 5. PANEL RENDERING CONTROLLERS

  // Chart instance registry — prevents canvas reuse crashes
  const _chartInstances = {};
  function _destroyChart(id) {
    if (_chartInstances[id]) { _chartInstances[id].destroy(); delete _chartInstances[id]; }
  }

  // A. OVERVIEW PANEL
  function renderOverviewPanel() {
    const contentArea = document.getElementById('admin-body-content');
    if (!contentArea || typeof BabkeDB === 'undefined') return;

    const orders = BabkeDB.getOrders();
    const reservations = BabkeDB.getReservations();
    const menuItems = BabkeDB.getMenu();
    const leftovers = BabkeDB.getLeftovers();

    // Compute stats
    const totalOrders = orders.length;
    const totalReservations = reservations.length;
    
    const activeRevenue = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.subtotal, 0);

    // Order status breakdown
    const statusCounts = { pending: 0, preparing: 0, delivered: 0, cancelled: 0 };
    orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

    // Popular dishes
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
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);

    // Revenue by day (last 7 days)
    const revByDay = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      revByDay[key] = 0;
    }
    orders.forEach(o => {
      if (o.status !== 'cancelled' && o.createdAt) {
        const day = new Date(o.createdAt).toISOString().split('T')[0];
        if (revByDay[day] !== undefined) revByDay[day] += (o.subtotal || 0);
      }
    });

    const logs = getActivityLogs();
    let logsHtml = logs.slice(0, 6).map(log => `
      <div class="activity-item">
        <div class="activity-icon" style="width:8px; height:8px; border-radius:50%; background:var(--accent-admin); flex-shrink:0; margin-top:6px;"></div>
        <div class="activity-details">
          <p>${log.text}</p>
          <span>${formatRelativeTime(new Date(log.time))}</span>
        </div>
      </div>
    `).join('');

    // Destroy existing chart instances
    ['chart-order-status', 'chart-popular-dishes', 'chart-revenue-trend'].forEach(_destroyChart);

    contentArea.innerHTML = `
      <!-- Stats cards grid -->
      <div class="dashboard-grid-stats">
        <div class="stat-card">
          <div class="stat-card-details">
            <span>Total Revenue</span>
            <h3>${activeRevenue.toFixed(1)} TND</h3>
            <span class="stat-card-trend positive">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              +12.4% vs last month
            </span>
          </div>
          <div class="stat-card-visual">
            <svg class="stat-sparkline" width="60" height="24" viewBox="0 0 60 24">
              <path d="M0,18 C10,12 15,4 30,10 C45,16 50,2 60,8" fill="none" stroke="var(--accent-admin)" stroke-width="2" stroke-linecap="round"></path>
            </svg>
            <div class="stat-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-details">
            <span>Total Orders</span>
            <h3>${totalOrders}</h3>
            <span class="stat-card-trend positive">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              +8.2% vs yesterday
            </span>
          </div>
          <div class="stat-card-visual">
            <svg class="stat-sparkline" width="60" height="24" viewBox="0 0 60 24">
              <path d="M0,15 Q15,22 30,10 T60,6" fill="none" stroke="var(--accent-admin)" stroke-width="2" stroke-linecap="round"></path>
            </svg>
            <div class="stat-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-details">
            <span>Reservations</span>
            <h3>${totalReservations}</h3>
            <span class="stat-card-trend positive">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              +19.1% this week
            </span>
          </div>
          <div class="stat-card-visual">
            <svg class="stat-sparkline" width="60" height="24" viewBox="0 0 60 24">
              <path d="M0,22 C10,15 20,5 30,18 C40,31 50,6 60,12" fill="none" stroke="var(--accent-admin)" stroke-width="2" stroke-linecap="round"></path>
            </svg>
            <div class="stat-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-details">
            <span>Active Events</span>
            <h3>${BabkeDB.getEvents().filter(e => e.status === 'published').length}</h3>
            <span class="stat-card-trend neutral">
              Seasonal promo active
            </span>
          </div>
          <div class="stat-card-visual">
            <svg class="stat-sparkline" width="60" height="24" viewBox="0 0 60 24">
              <path d="M0,10 Q20,10 30,10 T60,10" fill="none" stroke="var(--accent-admin)" stroke-width="2" stroke-linecap="round"></path>
            </svg>
            <div class="stat-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Row 1: Donut + Bar -->
      <div class="dashboard-split-layout" style="margin-bottom: 24px;">
        <!-- Order Status Donut -->
        <div class="admin-card" style="padding: 24px;">
          <div class="admin-card-header" style="margin-bottom: 16px;">
            <h3>Order Status</h3>
          </div>
          <div style="position: relative; width: 100%; max-width: 260px; margin: 0 auto;">
            <canvas id="chart-order-status"></canvas>
          </div>
        </div>

        <!-- Revenue Trend Bar Chart -->
        <div class="admin-card" style="padding: 24px;">
          <div class="admin-card-header" style="margin-bottom: 16px;">
            <h3>Revenue — Last 7 Days</h3>
          </div>
          <div style="position: relative; width: 100%; height: 260px;">
            <canvas id="chart-revenue-trend"></canvas>
          </div>
        </div>
      </div>

      <!-- Charts Row 2: Popular Dishes + Activity Log -->
      <div class="dashboard-split-layout">
        <!-- Popular Dishes Horizontal Bar Chart -->
        <div class="admin-card" style="padding: 24px;">
          <div class="admin-card-header" style="margin-bottom: 16px;">
            <h3>Most Popular Dishes</h3>
          </div>
          <div style="position: relative; width: 100%; height: 220px;">
            <canvas id="chart-popular-dishes"></canvas>
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

    // ── Render Charts ──
    const chartDefaults = {
      color: '#a0a0aa',
      font: { family: "'Plus Jakarta Sans', sans-serif" },
    };

    // 1. Order Status Donut
    const statusCtx = document.getElementById('chart-order-status');
    if (statusCtx && typeof Chart !== 'undefined') {
      _chartInstances['chart-order-status'] = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
          labels: ['Pending', 'Preparing', 'Delivered', 'Cancelled'],
          datasets: [{
            data: [statusCounts.pending, statusCounts.preparing, statusCounts.delivered, statusCounts.cancelled],
            backgroundColor: [
              'rgba(241, 196, 15, 0.85)',
              'rgba(230, 126, 34, 0.85)',
              'rgba(39, 174, 96, 0.85)',
              'rgba(192, 57, 43, 0.85)',
            ],
            borderColor: 'transparent',
            borderWidth: 0,
            hoverOffset: 8,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          cutout: '68%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { ...chartDefaults, padding: 14, usePointStyle: true, pointStyleWidth: 10 },
            },
            tooltip: {
              backgroundColor: 'rgba(20,20,24,0.95)',
              titleFont: { ...chartDefaults.font, weight: '600' },
              bodyFont: chartDefaults.font,
              padding: 12,
              cornerRadius: 8,
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${ctx.parsed} orders`,
              },
            },
          },
        },
      });
    }

    // 2. Revenue Trend Bar Chart
    const revCtx = document.getElementById('chart-revenue-trend');
    if (revCtx && typeof Chart !== 'undefined') {
      const revDays = Object.keys(revByDay);
      const revValues = Object.values(revByDay);
      const dayLabels = revDays.map(d => {
        const dt = new Date(d + 'T00:00:00');
        return dt.toLocaleDateString('en', { weekday: 'short', day: 'numeric' });
      });

      _chartInstances['chart-revenue-trend'] = new Chart(revCtx, {
        type: 'bar',
        data: {
          labels: dayLabels,
          datasets: [{
            label: 'Revenue (TND)',
            data: revValues,
            backgroundColor: (ctx) => {
              const chart = ctx.chart;
              const { ctx: c, chartArea } = chart;
              if (!chartArea) return 'rgba(192, 58, 46, 0.7)';
              const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
              gradient.addColorStop(0, 'rgba(192, 58, 46, 0.85)');
              gradient.addColorStop(1, 'rgba(192, 58, 46, 0.25)');
              return gradient;
            },
            borderRadius: 6,
            borderSkipped: false,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(20,20,24,0.95)',
              titleFont: { ...chartDefaults.font, weight: '600' },
              bodyFont: chartDefaults.font,
              padding: 12,
              cornerRadius: 8,
              callbacks: {
                label: (ctx) => ` ${ctx.parsed.y.toFixed(1)} TND`,
              },
            },
          },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.04)' },
              ticks: { ...chartDefaults, font: { ...chartDefaults.font, size: 11 } },
            },
            y: {
              grid: { color: 'rgba(255,255,255,0.04)' },
              ticks: { ...chartDefaults, font: { ...chartDefaults.font, size: 11 }, callback: v => v + ' TND' },
              beginAtZero: true,
            },
          },
        },
      });
    }

    // 3. Popular Dishes Horizontal Bar
    const dishCtx = document.getElementById('chart-popular-dishes');
    if (dishCtx && typeof Chart !== 'undefined') {
      const dishLabels = popularDishes.map(d => d.name);
      const dishValues = popularDishes.map(d => d.qty);
      const dishColors = [
        'rgba(192, 58, 46, 0.85)',
        'rgba(230, 126, 34, 0.80)',
        'rgba(241, 196, 15, 0.75)',
        'rgba(39, 174, 96, 0.75)',
        'rgba(41, 128, 185, 0.75)',
        'rgba(155, 89, 182, 0.75)',
      ];

      _chartInstances['chart-popular-dishes'] = new Chart(dishCtx, {
        type: 'bar',
        data: {
          labels: dishLabels,
          datasets: [{
            label: 'Orders',
            data: dishValues,
            backgroundColor: dishColors.slice(0, dishLabels.length),
            borderRadius: 6,
            borderSkipped: false,
          }],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(20,20,24,0.95)',
              titleFont: { ...chartDefaults.font, weight: '600' },
              bodyFont: chartDefaults.font,
              padding: 12,
              cornerRadius: 8,
              callbacks: {
                label: (ctx) => ` ${ctx.parsed.x} ordered`,
              },
            },
          },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.04)' },
              ticks: { ...chartDefaults, font: { ...chartDefaults.font, size: 11 }, stepSize: 1 },
              beginAtZero: true,
            },
            y: {
              grid: { display: false },
              ticks: { ...chartDefaults, font: { ...chartDefaults.font, size: 12, weight: '600' } },
            },
          },
        },
      });
    }
  }

  // B. MENU MANAGEMENT PANEL
  function renderMenuPanel() {
    const contentArea = document.getElementById('admin-body-content');
    if (!contentArea) return;

    const menuItems = BabkeDB.getMenu();

    contentArea.innerHTML = `
      <div class="admin-card">
        <div class="admin-card-header" style="margin-bottom: 16px;">
          <h3>Menu Items Registry (${menuItems.length} items)</h3>
          <button class="btn-admin-primary" id="btn-add-new-menu-item">
            <span>+ Add New Item</span>
          </button>
        </div>

        <!-- Real-Time Search & Category Filters (UX Upgrade) -->
        <div class="admin-card-filters" style="display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap;">
          <div class="filter-group" style="flex: 1; min-width: 220px; position: relative;">
            <input type="text" id="menu-search-input" class="admin-input" placeholder="Search by name, tag, or ID..." style="padding-left: 36px; margin-bottom: 0;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-admin-muted); pointer-events: none;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <div class="filter-group" style="width: 180px;">
            <select id="menu-category-filter" class="admin-select" style="margin-bottom: 0;">
              <option value="all">All Categories</option>
              <option value="kebab">Kebabs</option>
              <option value="plate">Plates & Grills</option>
              <option value="side">Sides / Appetizers</option>
              <option value="dessert">Desserts</option>
              <option value="drink">Drinks</option>
            </select>
          </div>
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
              <!-- Dynamic Rows Injected Here -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    const tbody = contentArea.querySelector('tbody');
    const searchInput = document.getElementById('menu-search-input');
    const categoryFilter = document.getElementById('menu-category-filter');

    const filterAndRenderRows = () => {
      const query = searchInput.value.trim().toLowerCase();
      const cat = categoryFilter.value;

      let filtered = menuItems;
      if (cat !== 'all') {
        filtered = filtered.filter(item => item.category === cat);
      }
      if (query) {
        filtered = filtered.filter(item => {
          const titleEn = (item.title.en || '').toLowerCase();
          const titleFr = (item.title.fr || '').toLowerCase();
          const titleTn = (item.title.tn || '').toLowerCase();
          const desc = (item.description.en || '').toLowerCase();
          const tags = (item.tags.en || []).join(' ').toLowerCase();
          return titleEn.includes(query) || titleFr.includes(query) || titleTn.includes(query) || desc.includes(query) || tags.includes(query) || item.id.toLowerCase().includes(query);
        });
      }

      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="padding: 0;">
              <div class="empty-state-container">
                <div class="empty-state-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                <h4>No Menu Items Found</h4>
                <p>Try refining your search terms or selecting a different category.</p>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = filtered.map(item => {
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
                <button class="btn-admin-action btn-edit-menu-item" data-id="${item.id}" title="Edit Item" style="display:flex; align-items:center; justify-content:center;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn-admin-action delete btn-delete-menu-item" data-id="${item.id}" title="Delete Item" style="display:flex; align-items:center; justify-content:center;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      // Bind row actions
      tbody.querySelectorAll('.btn-edit-menu-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.dataset.id;
          openMenuModal(id);
        });
      });

      tbody.querySelectorAll('.btn-delete-menu-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.dataset.id;
          if (confirm("Are you sure you want to delete this menu item? This cannot be undone.")) {
            deleteMenuItem(id);
          }
        });
      });
    };

    searchInput.addEventListener('input', filterAndRenderRows);
    categoryFilter.addEventListener('change', filterAndRenderRows);

    // Initial render
    filterAndRenderRows();

    // Bind add button click
    document.getElementById('btn-add-new-menu-item').addEventListener('click', () => openMenuModal());
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
    previewBox.innerHTML = '<span class="placeholder-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></span>';
    
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
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const compressedBase64 = await compressImage(file, 800, 800);
        base64Input.value = compressedBase64;
        previewBox.innerHTML = `<img src="${compressedBase64}">`;
      } catch (err) {
        console.error("Image compression failed:", err);
        showToast("Image compression failed.");
      }
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
        showToast("Failed to save menu item!");
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
      showToast("Failed to delete menu item!");
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
            <button class="btn-admin-action shift-left" data-index="${index}" title="Move Left" ${index === 0 ? 'disabled style="opacity:0.3;pointer-events:none;"' : ''} style="display:flex; align-items:center; justify-content:center;">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </button>
            <button class="btn-admin-action btn-edit-gallery-item" data-id="${item.id}" data-index="${index}" title="Edit Photo Details" style="display:flex; align-items:center; justify-content:center;">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-admin-action delete btn-delete-gallery-item" data-id="${item.id}" data-index="${index}" title="Delete Photo" style="display:flex; align-items:center; justify-content:center;">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
            <button class="btn-admin-action shift-right" data-index="${index}" title="Move Right" ${index === gallery.length - 1 ? 'disabled style="opacity:0.3;pointer-events:none;"' : ''} style="display:flex; align-items:center; justify-content:center;">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
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
      uploaderInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
          const compressedBase64 = await compressImage(file, 800, 800);
          
          const newPhoto = {
            id: "gal-" + Date.now(),
            image: compressedBase64,
            alt: "Uploaded Babke food shot",
            likes: Math.floor(Math.random() * 800 + 200) + "",
            link: "https://www.instagram.com/"
          };

          await BabkeDB.addGalleryPhoto(newPhoto);
          addActivityLog("New photo uploaded to gallery");
          renderGalleryPanel();
          // Automatically open modal for details editing
          openGalleryModal(newPhoto.id);
        } catch (err) {
          console.error("Error uploading gallery photo:", err);
          showToast("Gallery photo upload failed.");
        }
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

    // Bind edit details
    document.querySelectorAll('.btn-edit-gallery-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        openGalleryModal(id);
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
      showToast("Failed to delete gallery photo!");
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
              ${item.featured ? 'Featured' : 'Standard'}
            </button>
          </td>
          <td>
            <button class="btn-admin-secondary btn-toggle-review-hide" data-id="${item.id}" style="padding:4px 10px; font-size:0.75rem;">
              ${item.hidden ? 'Hidden' : 'Visible'}
            </button>
          </td>
          <td>
            <div class="btn-action-row">
              <button class="btn-admin-action btn-edit-review" data-id="${item.id}" title="Edit Review" style="display:flex; align-items:center; justify-content:center;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn-admin-action delete btn-delete-review" data-id="${item.id}" title="Delete Review" style="display:flex; align-items:center; justify-content:center;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
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
        showToast("Failed to save review!");
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
      showToast("Failed to delete review!");
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
              <button class="btn-admin-action btn-edit-event" data-id="${event.id}" title="Edit Event" style="display:flex; align-items:center; justify-content:center;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn-admin-action delete btn-delete-event" data-id="${event.id}" title="Delete Event" style="display:flex; align-items:center; justify-content:center;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
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

  // Gallery Modal controls
  const galleryModal = document.getElementById('gallery-editor-modal');
  const closeGalleryModalBtn = document.getElementById('btn-close-gallery-modal');
  const cancelGalleryModalBtn = document.getElementById('btn-cancel-gallery-editor');
  const galleryForm = document.getElementById('gallery-item-form');

  const openGalleryModal = (photoId) => {
    if (!galleryForm) return;
    galleryForm.reset();
    
    const photo = BabkeDB.getGallery().find(g => g.id === photoId);
    if (!photo) return;

    document.getElementById('gallery-form-id').value = photo.id;
    document.getElementById('gallery-form-preview').src = getAdminImageSrc(photo.image);
    document.getElementById('gallery-form-link').value = photo.link || '';
    document.getElementById('gallery-form-alt').value = photo.alt || '';
    document.getElementById('gallery-form-likes').value = photo.likes || '';

    galleryModal.classList.add('open');
  };

  const closeGalleryModal = () => {
    if (galleryModal) galleryModal.classList.remove('open');
  };

  if (closeGalleryModalBtn) closeGalleryModalBtn.addEventListener('click', closeGalleryModal);
  if (cancelGalleryModalBtn) cancelGalleryModalBtn.addEventListener('click', closeGalleryModal);

  if (galleryForm) {
    galleryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('gallery-form-id').value;
      const link = document.getElementById('gallery-form-link').value.trim();
      const alt = document.getElementById('gallery-form-alt').value.trim();
      const likes = document.getElementById('gallery-form-likes').value.trim();

      try {
        const gallery = BabkeDB.getGallery();
        const item = gallery.find(g => g.id === id);
        if (item) {
          item.link = link;
          item.alt = alt;
          item.likes = likes;
          await BabkeDB.saveGallery(gallery);
          addActivityLog(`Gallery photo #${gallery.indexOf(item) + 1} details updated`);
          showToast("Gallery photo details updated!");
          closeGalleryModal();
          renderGalleryPanel();
        }
      } catch (err) {
        console.error("Error saving gallery photo updates:", err);
        showToast("Failed to save changes!");
      }
    });
  }

  const fetchLikesBtn = document.getElementById('btn-fetch-instagram-likes');
  if (fetchLikesBtn) {
    fetchLikesBtn.addEventListener('click', async () => {
      const linkUrl = document.getElementById('gallery-form-link').value.trim();
      if (!linkUrl) {
        showToast("Please enter an Instagram post link first.");
        return;
      }

      fetchLikesBtn.disabled = true;
      const originalText = fetchLikesBtn.innerHTML;
      fetchLikesBtn.innerHTML = `<span>Scraping...</span>`;

      try {
        const res = await fetch('/api/gallery/scrape-likes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: linkUrl })
        });
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || `HTTP error ${res.status}`);
        }

        const data = await res.json();
        if (data.success && data.likes) {
          document.getElementById('gallery-form-likes').value = data.likes;
          showToast(`Successfully scraped likes: ${data.likes}`);
        } else {
          throw new Error(data.error || "Could not fetch likes count.");
        }
      } catch (err) {
        console.error("Error scraping instagram likes:", err);
        showToast(err.message || "Failed to scrape likes. Enter manually.");
      } finally {
        fetchLikesBtn.disabled = false;
        fetchLikesBtn.innerHTML = originalText;
      }
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
    eventPreviewBox.innerHTML = '<span class="placeholder-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></span>';
    
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
    eventFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const compressedBase64 = await compressImage(file, 800, 800);
        eventBase64Input.value = compressedBase64;
        eventPreviewBox.innerHTML = `<img src="${compressedBase64}">`;
      } catch (err) {
        console.error("Event image compression failed:", err);
        showToast("Image compression failed.");
      }
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
        showToast("Failed to save event!");
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
      showToast("Failed to delete event!");
    }
  };

  // F. ORDERS & RESERVATIONS LOGS PANEL
  let activeLogSubTab = 'orders'; // orders or reservations

  function renderOrdersReservationsPanel() {
    const contentArea = document.getElementById('admin-body-content');
    if (!contentArea) return;

    const orders = BabkeDB.getOrders();
    const reservations = BabkeDB.getReservations();

    contentArea.innerHTML = `
      <!-- Sub tabs selectors -->
      <div style="display:flex; gap:12px; margin-bottom:20px; border-bottom:1px solid var(--border-admin); padding-bottom:12px;">
        <button class="btn-admin-secondary ${activeLogSubTab === 'orders' ? 'btn-admin-primary' : ''}" id="btn-tab-select-orders" style="padding:8px 16px;">
          Incoming Orders (${orders.length})
        </button>
        <button class="btn-admin-secondary ${activeLogSubTab === 'reservations' ? 'btn-admin-primary' : ''}" id="btn-tab-select-reservations" style="padding:8px 16px;">
          Table Reservations (${reservations.length})
        </button>
      </div>

      <div class="admin-card">
        <div class="admin-card-header" style="margin-bottom: 16px;">
          <h3>${activeLogSubTab === 'orders' ? 'WhatsApp captured orders' : 'Customer online bookings'}</h3>
        </div>

        <!-- Real-Time Search & Status Filters (UX Upgrade) -->
        <div class="admin-card-filters" style="display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap;">
          <div class="filter-group" style="flex: 1; min-width: 220px; position: relative;">
            <input type="text" id="log-search-input" class="admin-input" placeholder="Search by name, phone, or ID..." style="padding-left: 36px; margin-bottom: 0;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-admin-muted); pointer-events: none;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <div class="filter-group" style="width: 180px;">
            <select id="log-status-filter" class="admin-select" style="margin-bottom: 0;">
              <option value="all">All Statuses</option>
              ${activeLogSubTab === 'orders' ? `
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              ` : `
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              `}
            </select>
          </div>
        </div>
        
        <div class="table-responsive-wrapper">
          <table class="admin-table">
            <thead>
              <!-- Dynamic Headers Injected Here -->
            </thead>
            <tbody>
              <!-- Dynamic Rows Injected Here -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    const thead = contentArea.querySelector('thead');
    const tbody = contentArea.querySelector('tbody');
    const searchInput = document.getElementById('log-search-input');
    const statusFilter = document.getElementById('log-status-filter');

    const filterAndRenderLogs = () => {
      const query = searchInput.value.trim().toLowerCase();
      const statusVal = statusFilter.value;

      if (activeLogSubTab === 'orders') {
        // Render Orders Headers
        thead.innerHTML = `
          <tr>
            <th>Order ID</th>
            <th>Customer Information</th>
            <th>Ordered Feast Items</th>
            <th>Subtotal</th>
            <th>Status</th>
            <th>Date Created</th>
          </tr>
        `;

        let filteredOrders = orders;
        if (statusVal !== 'all') {
          filteredOrders = filteredOrders.filter(o => o.status === statusVal);
        }
        if (query) {
          filteredOrders = filteredOrders.filter(o => {
            const name = (o.customer.name || '').toLowerCase();
            const phone = (o.customer.phone || '').toLowerCase();
            const addr = (o.customer.address || '').toLowerCase();
            return name.includes(query) || phone.includes(query) || addr.includes(query) || o.id.toLowerCase().includes(query);
          });
        }

        if (filteredOrders.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="6" style="padding: 0;">
                <div class="empty-state-container">
                  <div class="empty-state-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <h4>No Incoming Orders Found</h4>
                  <p>No matching orders were found in this query. Check back later!</p>
                </div>
              </td>
            </tr>
          `;
          return;
        }

        tbody.innerHTML = filteredOrders.map(o => {
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
                  <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
                  <option value="preparing" ${o.status === 'preparing' ? 'selected' : ''}>Preparing</option>
                  <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                  <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
              </td>
              <td><span style="font-size:0.75rem; color:var(--text-admin-muted);">${new Date(o.createdAt).toLocaleString()}</span></td>
            </tr>
          `;
        }).join('');

        // Bind status selector listener
        tbody.querySelectorAll('.order-status-updater').forEach(select => {
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
                showToast("Failed to update status on server!");
              }
            } catch (err) {
              console.error("Order status update failed:", err);
            } finally {
              selectEl.disabled = false;
              renderOrdersReservationsPanel();
            }
          });
        });

      } else {
        // Render Reservations Headers
        thead.innerHTML = `
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

        let filteredReservations = reservations;
        if (statusVal !== 'all') {
          filteredReservations = filteredReservations.filter(r => r.status === statusVal);
        }
        if (query) {
          filteredReservations = filteredReservations.filter(r => {
            const name = (r.name || '').toLowerCase();
            const phone = (r.phone || '').toLowerCase();
            const notes = (r.notes || '').toLowerCase();
            return name.includes(query) || phone.includes(query) || notes.includes(query) || r.id.toLowerCase().includes(query);
          });
        }

        if (filteredReservations.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="7" style="padding: 0;">
                <div class="empty-state-container">
                  <div class="empty-state-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <h4>No Table Bookings Found</h4>
                  <p>No matching reservations were found for this query.</p>
                </div>
              </td>
            </tr>
          `;
          return;
        }

        tbody.innerHTML = filteredReservations.map(r => {
          return `
            <tr>
              <td><strong style="color:var(--accent-info); font-family:'Outfit';">${r.id}</strong></td>
              <td>
                <strong>${r.name}</strong><br>
                <span style="font-size:0.75rem; color:var(--text-admin-muted);">${r.phone}</span>
              </td>
              <td>
                <strong>${r.date}</strong><br>
                <span style="color:var(--accent-info); font-weight:700;">${r.time}</span>
              </td>
              <td><span class="status-badge info" style="font-size:0.75rem; font-weight:800;">${r.guests} Guests</span></td>
              <td style="max-width:180px; font-size:0.76rem; font-style:italic;">${r.notes ? `"${r.notes}"` : '-'}</td>
              <td>
                <select class="table-status-select reservation-status-updater" data-id="${r.id}">
                  <option value="pending" ${r.status === 'pending' ? 'selected' : ''}>Pending</option>
                  <option value="confirmed" ${r.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                  <option value="cancelled" ${r.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
              </td>
              <td><span style="font-size:0.75rem; color:var(--text-admin-muted);">${new Date(r.createdAt).toLocaleString()}</span></td>
            </tr>
          `;
        }).join('');

        // Bind status updater change listener
        tbody.querySelectorAll('.reservation-status-updater').forEach(select => {
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
                showToast("Failed to update status on server!");
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
    };

    // Bind sub tabs clicks
    document.getElementById('btn-tab-select-orders').addEventListener('click', () => {
      activeLogSubTab = 'orders';
      renderOrdersReservationsPanel();
    });

    document.getElementById('btn-tab-select-reservations').addEventListener('click', () => {
      activeLogSubTab = 'reservations';
      renderOrdersReservationsPanel();
    });

    searchInput.addEventListener('input', filterAndRenderLogs);
    statusFilter.addEventListener('change', filterAndRenderLogs);

    // Initial render
    filterAndRenderLogs();
  }

  // G. LEFTOVERS & ANALYTICS PANEL
  function renderLeftoversPanel() {
    const contentArea = document.getElementById('admin-body-content');
    if (!contentArea) return;

    const leftovers = BabkeDB.getLeftovers();
    const orders = BabkeDB.getOrders();
    const reservations = BabkeDB.getReservations();

    // Calculate Analytics
    const totalRev = orders.reduce((sum, o) => sum + (o.subtotal || 0), 0);

    // Leftover breakdown by item (for donut)
    const leftoverByItem = {};
    leftovers.forEach(l => {
      leftoverByItem[l.item] = (leftoverByItem[l.item] || 0) + l.quantity;
    });

    // Leftover count per day (last 7 days, for bar chart)
    const leftoverByDay = {};
    const nowL = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(nowL); d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      leftoverByDay[key] = 0;
    }
    leftovers.forEach(l => {
      if (leftoverByDay[l.date] !== undefined) leftoverByDay[l.date] += l.quantity;
    });

    // Build Analytics Charts HTML (Admin Only)
    let analyticsHtml = '';
    if (userRole === 'admin') {
      analyticsHtml = `
        <!-- Analytics Summary Cards -->
        <div class="dashboard-grid-stats" style="margin-bottom: 24px;">
          <div class="stat-card">
            <div class="stat-card-details">
              <span>Total Revenue</span>
              <h3>${totalRev.toFixed(1)} TND</h3>
              <span class="stat-card-trend positive">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                +12.4% vs last month
              </span>
            </div>
            <div class="stat-card-visual">
              <svg class="stat-sparkline" width="60" height="24" viewBox="0 0 60 24">
                <path d="M0,18 C10,12 15,4 30,10 C45,16 50,2 60,8" fill="none" stroke="var(--accent-admin)" stroke-width="2" stroke-linecap="round"></path>
              </svg>
              <div class="stat-card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card-details">
              <span>Total Orders</span>
              <h3>${orders.length}</h3>
              <span class="stat-card-trend positive">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                +8.2% vs yesterday
              </span>
            </div>
            <div class="stat-card-visual">
              <svg class="stat-sparkline" width="60" height="24" viewBox="0 0 60 24">
                <path d="M0,15 Q15,22 30,10 T60,6" fill="none" stroke="var(--accent-admin)" stroke-width="2" stroke-linecap="round"></path>
              </svg>
              <div class="stat-card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
              </div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card-details">
              <span>Leftovers Logged</span>
              <h3>${leftovers.length}</h3>
              <span class="stat-card-trend positive">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
                -4.1% waste reduction
              </span>
            </div>
            <div class="stat-card-visual">
              <svg class="stat-sparkline" width="60" height="24" viewBox="0 0 60 24">
                <path d="M0,10 C15,22 30,4 45,18 T60,6" fill="none" stroke="var(--accent-admin)" stroke-width="2" stroke-linecap="round"></path>
              </svg>
              <div class="stat-card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M3 20h3"/><path d="M3 10h18"/><path d="M3 5h18"/><path d="M3 15h18"/></svg>
              </div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card-details">
              <span>Table Bookings</span>
              <h3>${reservations.length}</h3>
              <span class="stat-card-trend positive">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                +19.1% this week
              </span>
            </div>
            <div class="stat-card-visual">
              <svg class="stat-sparkline" width="60" height="24" viewBox="0 0 60 24">
                <path d="M0,22 C10,15 20,5 30,18 C40,31 50,6 60,12" fill="none" stroke="var(--accent-admin)" stroke-width="2" stroke-linecap="round"></path>
              </svg>
              <div class="stat-card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Analytics Charts Row -->
        <div class="dashboard-split-layout" style="margin-bottom: 30px;">
          <!-- Leftover Breakdown Donut -->
          <div class="admin-card" style="padding: 24px;">
            <div class="admin-card-header" style="margin-bottom: 16px;">
              <h3>Leftover Breakdown</h3>
            </div>
            <div style="position: relative; width: 100%; max-width: 240px; margin: 0 auto;">
              <canvas id="chart-leftover-donut"></canvas>
            </div>
          </div>

          <!-- Daily Leftover Trend Bar -->
          <div class="admin-card" style="padding: 24px;">
            <div class="admin-card-header" style="margin-bottom: 16px;">
              <h3>Daily Leftovers — Last 7 Days</h3>
            </div>
            <div style="position: relative; width: 100%; height: 240px;">
              <canvas id="chart-leftover-trend"></canvas>
            </div>
          </div>
        </div>
      `;
    }

    // Group Leftover Logs by Date
    const grouped = {};
    leftovers.forEach(log => {
      if (!grouped[log.date]) {
        grouped[log.date] = [];
      }
      grouped[log.date].push(log);
    });
    // Get sorted dates descending
    const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    let datesHtml = '';
    if (dates.length === 0) {
      datesHtml = `
        <div class="empty-state-container" style="padding: 30px 10px;">
          <div class="empty-state-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M3 20h3"/><path d="M3 10h18"/><path d="M3 5h18"/><path d="M3 15h18"/></svg>
          </div>
          <h4>No Leftovers Logged Yet</h4>
          <p>Log surplus ingredients on the left to track waste reductions and daily metrics.</p>
        </div>
      `;
    } else {
      datesHtml = dates.map((date, idx) => {
        const items = grouped[date];
        const isFirst = idx === 0; // Expand first day by default
        const itemsRows = items.map(item => `
          <tr data-id="${item.id}">
            <td style="font-weight: 500; color: var(--text-admin);">${item.item}</td>
            <td style="font-weight: 600; color: var(--accent-admin); white-space: nowrap;">${item.quantity} ${item.unit}</td>
            <td style="font-size:0.8rem; color:var(--text-admin-muted);">${new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
            <td>
              <button class="btn-admin-action delete btn-delete-leftover" data-id="${item.id}" aria-label="Delete log">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </button>
            </td>
          </tr>
        `).join('');

        return `
          <div class="leftovers-day-group" style="margin-bottom: 12px; border: 1px solid var(--border-admin); border-radius: 8px; overflow: hidden; background: rgba(255, 255, 255, 0.02);">
            <div class="leftovers-day-header" data-date="${date}" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; background: rgba(255, 255, 255, 0.04); cursor: pointer; transition: background 0.2s;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-admin-muted);"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span style="font-weight: 600; font-size: 0.95rem;">${date}</span>
                <span style="font-size: 0.8rem; background: var(--bg-admin-secondary); color: var(--text-admin-muted); padding: 2px 8px; border-radius: 12px; font-weight: 500;">
                  ${items.length} items logged
                </span>
              </div>
              <div class="expand-arrow" style="transition: transform 0.2s; transform: ${isFirst ? 'rotate(180deg)' : 'rotate(0)'}; font-weight: bold; font-size: 0.85rem; color: var(--text-admin-muted);">▼</div>
            </div>
            
            <div class="leftovers-day-details" id="details-${date}" style="display: ${isFirst ? 'block' : 'none'}; padding: 15px; border-top: 1px solid var(--border-admin);">
              <div class="table-responsive-wrapper">
                <table class="admin-table" style="margin: 0; width: 100%;">
                  <thead>
                    <tr>
                      <th>Garniture</th>
                      <th>Quantity</th>
                      <th>Time</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsRows}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Destroy existing chart instances
    ['chart-leftover-donut', 'chart-leftover-trend'].forEach(_destroyChart);

    contentArea.innerHTML = `
      ${analyticsHtml}

      <!-- Leftovers Log Form (Full Width) -->
      <div class="admin-card glass-card" style="margin-bottom: 24px;">
        <div class="admin-card-header">
          <h3>Log Daily Leftovers</h3>
        </div>
        <form id="leftovers-log-form" style="display:flex; flex-direction:column; gap:16px; padding-top:15px;">
          <div class="form-grid-admin" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-bottom: 0;">
            <div class="form-group-admin">
              <label for="left-form-date">Date</label>
              <input type="date" id="left-form-date" value="${todayStr}" required>
            </div>
            
            <div class="form-group-admin">
              <label for="left-form-item">Garniture / Meat Type</label>
              <select id="left-form-item" required>
                <option value="Kebab">Kebab (Skewers)</option>
                <option value="Chich Taouk">Chich Taouk (Shish Taouk)</option>
                <option value="Chicken Legs">Chicken Legs</option>
                <option value="Crispy">Crispy Chicken</option>
                <option value="Chicken Shawarma">Chicken Shawarma</option>
                <option value="Falafel">Falafel (Pieces)</option>
              </select>
            </div>

            <div class="form-grid-admin" style="margin-bottom: 0; gap: 12px; grid-template-columns: 1.2fr 1fr;">
              <div class="form-group-admin">
                <label for="left-form-qty">Quantity</label>
                <input type="number" id="left-form-qty" step="0.1" min="0.1" placeholder="e.g. 3.5" required>
              </div>
              <div class="form-group-admin">
                <label for="left-form-unit">Unit</label>
                <select id="left-form-unit" required>
                  <option value="kg">Kilos (kg)</option>
                  <option value="sticks">Sticks / Skewers</option>
                </select>
              </div>
            </div>
          </div>

          <button type="submit" class="btn-admin-primary" style="align-self: flex-end; padding: 12px 24px; min-width: 160px; margin-top: 10px;">Save Daily Log</button>
        </form>
      </div>

      <!-- Leftovers Log History (Full Width) -->
      <div class="admin-card glass-card">
        <div class="admin-card-header" style="margin-bottom: 15px;">
          <h3>Leftovers Daily Log History</h3>
        </div>
        <div class="leftovers-grouped-container" style="max-height: 480px; overflow-y: auto; padding-right: 5px;">
          ${datesHtml}
        </div>
      </div>
    `;

    // ── Render Leftover Charts (Admin Only) ──
    if (userRole === 'admin' && typeof Chart !== 'undefined') {
      const chartDefaults = {
        color: '#a0a0aa',
        font: { family: "'Plus Jakarta Sans', sans-serif" },
      };

      // Leftover Breakdown Donut
      const donutCtx = document.getElementById('chart-leftover-donut');
      if (donutCtx) {
        const items = Object.keys(leftoverByItem);
        const quantities = Object.values(leftoverByItem);
        const donutColors = [
          'rgba(192, 58, 46, 0.85)',
          'rgba(230, 126, 34, 0.80)',
          'rgba(241, 196, 15, 0.80)',
          'rgba(39, 174, 96, 0.80)',
          'rgba(41, 128, 185, 0.80)',
          'rgba(155, 89, 182, 0.80)',
        ];

        _chartInstances['chart-leftover-donut'] = new Chart(donutCtx, {
          type: 'doughnut',
          data: {
            labels: items,
            datasets: [{
              data: quantities,
              backgroundColor: donutColors.slice(0, items.length),
              borderColor: 'transparent',
              borderWidth: 0,
              hoverOffset: 8,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '65%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: { ...chartDefaults, padding: 12, usePointStyle: true, pointStyleWidth: 10 },
              },
              tooltip: {
                backgroundColor: 'rgba(20,20,24,0.95)',
                titleFont: { ...chartDefaults.font, weight: '600' },
                bodyFont: chartDefaults.font,
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                  label: (ctx) => ` ${ctx.label}: ${ctx.parsed} total`,
                },
              },
            },
          },
        });
      }

      // Daily Leftover Trend Bar
      const trendCtx = document.getElementById('chart-leftover-trend');
      if (trendCtx) {
        const trendDays = Object.keys(leftoverByDay);
        const trendValues = Object.values(leftoverByDay);
        const trendLabels = trendDays.map(d => {
          const dt = new Date(d + 'T00:00:00');
          return dt.toLocaleDateString('en', { weekday: 'short', day: 'numeric' });
        });

        _chartInstances['chart-leftover-trend'] = new Chart(trendCtx, {
          type: 'bar',
          data: {
            labels: trendLabels,
            datasets: [{
              label: 'Leftovers',
              data: trendValues,
              backgroundColor: (ctx) => {
                const chart = ctx.chart;
                const { ctx: c, chartArea } = chart;
                if (!chartArea) return 'rgba(230, 126, 34, 0.7)';
                const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                gradient.addColorStop(0, 'rgba(230, 126, 34, 0.85)');
                gradient.addColorStop(1, 'rgba(230, 126, 34, 0.20)');
                return gradient;
              },
              borderRadius: 6,
              borderSkipped: false,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: 'rgba(20,20,24,0.95)',
                titleFont: { ...chartDefaults.font, weight: '600' },
                bodyFont: chartDefaults.font,
                padding: 12,
                cornerRadius: 8,
              },
            },
            scales: {
              x: {
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: { ...chartDefaults, font: { ...chartDefaults.font, size: 11 } },
              },
              y: {
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: { ...chartDefaults, font: { ...chartDefaults.font, size: 11 } },
                beginAtZero: true,
              },
            },
          },
        });
      }
    }

    // Bind Accordion Toggles
    document.querySelectorAll('.leftovers-day-header').forEach(header => {
      header.addEventListener('click', (e) => {
        const date = e.currentTarget.dataset.date;
        const details = document.getElementById(`details-${date}`);
        const arrow = e.currentTarget.querySelector('.expand-arrow');
        if (details.style.display === 'none') {
          details.style.display = 'block';
          arrow.style.transform = 'rotate(180deg)';
        } else {
          details.style.display = 'none';
          arrow.style.transform = 'rotate(0)';
        }
      });
    });

    // Bind Form Submit Listener
    const form = document.getElementById('leftovers-log-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const date = document.getElementById('left-form-date').value;
        const item = document.getElementById('left-form-item').value;
        const quantity = parseFloat(document.getElementById('left-form-qty').value);
        const unit = document.getElementById('left-form-unit').value;

        const newLog = {
          id: "left-" + Date.now(),
          date,
          item,
          quantity,
          unit,
          createdAt: new Date().toISOString()
        };

        try {
          await BabkeDB.addLeftover(newLog);
          showToast(`Logged ${quantity} ${unit} of ${item}`);
          form.reset();
          document.getElementById('left-form-date').value = todayStr; // reset date default
          renderLeftoversPanel();
        } catch (err) {
          console.error("Failed to log leftovers:", err);
          showToast("Failed to save log.");
        }
      });
    }

    // Bind Delete Action listeners
    document.querySelectorAll('.btn-delete-leftover').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation(); // prevent accordion toggle on delete click
        const id = e.currentTarget.dataset.id;
        if (!confirm("Are you sure you want to delete this leftovers entry?")) return;
        try {
          await BabkeDB.deleteLeftover(id);
          showToast("Leftover log entry removed.");
          renderLeftoversPanel();
        } catch (err) {
          console.error("Failed to delete leftover log:", err);
          showToast("Failed to delete entry.");
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

  window.addEventListener('babkeLeftoversChanged', () => {
    addActivityLog("Leftovers logs synced in real-time");
    if (currentActivePanel === 'leftovers') {
      renderLeftoversPanel();
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
        window.dispatchEvent(new Event('babkeLeftoversChanged'));
      } catch (err) {
        console.error("Polling sync failed:", err);
      }
    }
  }, 30000);

  // Check auth state on script start
  checkAuth();
});
