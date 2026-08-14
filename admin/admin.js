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
  // Professional Glassmorphic Toast Notification utility (Error, Warning, Success, Info)
  const showToast = (message, type = 'info', title = null) => {
    let container = document.querySelector('.babke-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'babke-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `babke-toast toast-${type}`;
    
    let iconSvg = '';
    let accentColor = '#c03a2e';
    let defaultTitle = 'Notification';

    if (type === 'error') {
      accentColor = '#dc2626';
      defaultTitle = 'Stock Insuffisant / Erreur';
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else if (type === 'warning') {
      accentColor = '#d97706';
      defaultTitle = 'Avertissement';
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    } else if (type === 'success') {
      accentColor = '#059669';
      defaultTitle = 'Opération Réussie';
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    } else {
      accentColor = 'var(--accent-admin)';
      defaultTitle = 'Information';
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-admin)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `
      <div class="babke-toast-accent" style="background: ${accentColor}; height: 100%; min-height: 28px;"></div>
      <div style="display: flex; align-items: flex-start; gap: 10px; flex: 1;">
        <div style="flex-shrink: 0; margin-top: 1px;">${iconSvg}</div>
        <div>
          <strong style="display: block; font-size: 0.85rem; font-weight: 800; color: var(--text-admin-primary); margin-bottom: 2px;">${title || defaultTitle}</strong>
          <span style="font-size: 0.82rem; font-weight: 500; color: var(--text-admin-secondary); line-height: 1.35;">${message}</span>
        </div>
      </div>
      <button type="button" class="toast-close-btn" style="background: none; border: none; color: var(--text-admin-muted); cursor: pointer; padding: 2px 6px; font-size: 1.2rem; line-height: 1; font-weight: bold;">&times;</button>
    `;

    toast.querySelector('.toast-close-btn').addEventListener('click', () => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    });

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 40);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
      }
    }, 6000);
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

    eventSource.addEventListener('newExpense', (e) => {
      try {
        const expense = JSON.parse(e.data);
        addActivityLog(`New Expense logged: ${expense.category} - ${expense.amount} TND`);
        showToast(`💰 New Expense logged by ${expense.recordedBy || 'Cashier'}: ${expense.amount} TND!`);
        unreadNotificationCount++;
        updatePageTitle();
        playNotificationAlert();

        if (currentActivePanel === 'expenses' || currentActivePanel === 'overview') {
          switchPanel(currentActivePanel);
        }
      } catch (err) {
        console.error("Error processing newExpense SSE event:", err);
      }
    });

    eventSource.addEventListener('deleteExpense', (e) => {
      try {
        if (currentActivePanel === 'expenses' || currentActivePanel === 'overview') {
          switchPanel(currentActivePanel);
        }
      } catch (err) {
        console.error("Error processing deleteExpense SSE event:", err);
      }
    });

    eventSource.addEventListener('menuChanged', async () => {
      try {
        await BabkeDB.init(true);
        if (currentActivePanel === 'menu' || currentActivePanel === 'overview') {
          switchPanel(currentActivePanel);
        }
      } catch (err) {
        console.error("Error processing menuChanged SSE event:", err);
      }
    });

    eventSource.addEventListener('eventsChanged', async () => {
      try {
        await BabkeDB.init(true);
        if (currentActivePanel === 'events' || currentActivePanel === 'overview') {
          switchPanel(currentActivePanel);
        }
      } catch (err) {
        console.error("Error processing eventsChanged SSE event:", err);
      }
    });

    eventSource.addEventListener('ordersChanged', async () => {
      try {
        await BabkeDB.init(true);
        if (currentActivePanel === 'orders-reservations' || currentActivePanel === 'overview') {
          switchPanel(currentActivePanel);
        }
      } catch (err) {
        console.error("Error processing ordersChanged SSE event:", err);
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

  // Sync theme on load (Force Light Sand & Terracotta theme matching website)
  let savedTheme = localStorage.getItem('babke_theme');
  if (!savedTheme || savedTheme === 'dark') {
    savedTheme = 'light';
    localStorage.setItem('babke_theme', 'light');
  }
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

  let userRole = 'admin'; // 'admin', 'comptable', 'sm_manager', 'cashier', 'worker'

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

        // Update role badge in header
        const roleText = document.getElementById('user-role-text');
        const dropdownRole = document.getElementById('dropdown-user-role');
        const roleLabels = {
          'admin': 'PROPRIÉTAIRE',
          'comptable': 'COMPTABLE',
          'sm_manager': 'RESPONSABLE MÉDIA',
          'cashier': 'CAISSIER',
          'worker': 'OUVRIER'
        };
        const label = roleLabels[userRole] || userRole.toUpperCase();
        if (roleText) roleText.textContent = label;
        if (dropdownRole) dropdownRole.textContent = label + ' RESTAURANT';

        if (loginWrapper) loginWrapper.style.display = 'none';
        if (adminShell) adminShell.style.display = 'flex';

        // Toggle sidebar button visibility depending on RBAC role privileges
        const navButtons = document.querySelectorAll('.nav-item-btn[data-panel]');
        if (userRole === 'worker') {
          navButtons.forEach(btn => {
            btn.style.display = (btn.dataset.panel === 'leftovers' || btn.dataset.panel === 'ruined') ? 'flex' : 'none';
          });
          if (!['leftovers', 'ruined'].includes(currentActivePanel)) currentActivePanel = 'leftovers';
        } else if (userRole === 'cashier') {
          navButtons.forEach(btn => {
            btn.style.display = (['expenses', 'orders-reservations', 'menu'].includes(btn.dataset.panel)) ? 'flex' : 'none';
          });
          if (!['expenses', 'orders-reservations', 'menu'].includes(currentActivePanel)) currentActivePanel = 'expenses';
        } else if (userRole === 'sm_manager') {
          navButtons.forEach(btn => {
            btn.style.display = (['menu', 'content', 'gallery', 'events', 'reviews'].includes(btn.dataset.panel)) ? 'flex' : 'none';
          });
          if (!['menu', 'content', 'gallery', 'events', 'reviews'].includes(currentActivePanel)) currentActivePanel = 'menu';
        } else if (userRole === 'comptable') {
          navButtons.forEach(btn => {
            btn.style.display = (['stock', 'leftovers', 'ruined', 'expenses', 'comptabilite', 'product-types'].includes(btn.dataset.panel)) ? 'flex' : 'none';
          });
          if (!['stock', 'leftovers', 'ruined', 'expenses', 'comptabilite', 'product-types'].includes(currentActivePanel)) currentActivePanel = 'stock';
        } else {
          // Admin / Owner
          navButtons.forEach(btn => btn.style.display = 'flex');
        }

        switchPanel(currentActivePanel);
        startSseStream(); // Initialize SSE listener for real-time updates
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
            addActivityLog("Utilisateur connecté avec succès");
          } else {
            if (loginErrorMsg) {
              loginErrorMsg.textContent = data.error || 'Identifiant ou mot de passe incorrect !';
              loginErrorMsg.style.display = 'block';
            }
          }
        } else {
          if (loginErrorMsg) {
            loginErrorMsg.textContent = 'Identifiant ou mot de passe incorrect !';
            loginErrorMsg.style.display = 'block';
          }
        }
      } catch (err) {
        console.error("Login API request failed:", err);
        if (loginErrorMsg) loginErrorMsg.style.display = 'block';
      }
    });
  }

  const logoutBtns = document.querySelectorAll('#btn-admin-logout, #btn-admin-logout-top');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await fetch('/api/admin/logout', { method: 'POST' });
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        addActivityLog("Utilisateur déconnecté");
        await checkAuth();
      } catch (err) {
        console.error("Logout request failed:", err);
      }
    });
  });

  const resetDataBtn = document.getElementById('btn-reset-demo-data');
  if (resetDataBtn) {
    resetDataBtn.addEventListener('click', async () => {
      if (confirm("⚠️ ATTENTION : Êtes-vous sûr de vouloir supprimer TOUTES les données actuelles et ré-ensemencer la base de données avec des données démo propres ?")) {
        showToast("⏳ Réinitialisation et ré-ensemencement en cours...", "warning");
        const res = await BabkeDB.resetDatabase();
        if (res.success) {
          showToast("⚡ Base de données réinitialisée et ré-ensemencée avec succès !");
          if (typeof renderCurrentPanel === 'function') renderCurrentPanel();
        } else {
          showToast("❌ " + (res.error || "Erreur lors de la réinitialisation"), "error");
        }
      }
    });
  }

  // User Profile Dropdown Menu Toggle Handler
  const profileTrigger = document.getElementById('user-profile-trigger');
  const profileDropdown = document.getElementById('user-profile-dropdown');

  if (profileTrigger && profileDropdown) {
    profileTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = profileDropdown.classList.toggle('open');
      profileTrigger.classList.toggle('active', isOpen);
    });

    document.addEventListener('click', (e) => {
      if (!profileDropdown.contains(e.target) && !profileTrigger.contains(e.target)) {
        profileDropdown.classList.remove('open');
        profileTrigger.classList.remove('active');
      }
    });
  }

  // Order Audio Alert Chime Generator (Web Audio API)
  let audioAlertsEnabled = true;
  function playOrderAudioAlert() {
    if (!audioAlertsEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const playTone = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };
      // Chime: D5 -> A5
      playTone(587.33, 0.0, 0.35);
      playTone(880.00, 0.18, 0.45);
    } catch (err) {
      console.warn("Audio chime play warning:", err);
    }
  }

  const soundToggleBtn = document.getElementById('btn-sound-toggle');
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      audioAlertsEnabled = !audioAlertsEnabled;
      const icon = document.getElementById('sound-icon');
      const label = document.getElementById('sound-label');
      if (audioAlertsEnabled) {
        if (icon) icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
        if (label) label.textContent = 'Alertes : ON';
        soundToggleBtn.style.background = 'rgba(255, 90, 31, 0.12)';
        soundToggleBtn.style.borderColor = 'rgba(255, 90, 31, 0.3)';
        playOrderAudioAlert();
        showToast("Alertes sonores activées");
      } else {
        if (icon) icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
        if (label) label.textContent = 'Alertes : OFF';
        soundToggleBtn.style.background = 'rgba(255, 255, 255, 0.05)';
        soundToggleBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        showToast("Alertes sonores désactivées");
      }
    });
  }

  // 4. ROUTING BETWEEN DASHBOARD PANELS
  let currentActivePanel = 'overview'; // Default

  const switchPanel = async (panelName) => {
    currentActivePanel = panelName;
    
    // Reset notifications when visiting the orders logs or expenses logs
    if (panelName === 'orders-reservations' || panelName === 'expenses') {
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

    // Update panel title header in French
    const titleHeader = document.getElementById('admin-panel-title');
    if (titleHeader) {
      const titles = {
        'overview': 'Tableau de Bord Exécutif & Audits',
        'stock': 'Gestion des Stocks (Achats & Retraits)',
        'leftovers': 'Restes de Fin de Journée',
        'ruined': 'Produits Gâtés & Pertes',
        'expenses': 'Journal des Dépenses de Caisse',
        'comptabilite': 'Comptabilité & Exportation Excel',
        'product-types': 'Gestion des Types de Produits',
        'menu': 'Catalogue du Menu',
        'content': 'Contenu du Site Web',
        'gallery': 'Galerie Instagram',
        'events': 'Événements & Popups',
        'reviews': 'Avis Clients',
        'orders-reservations': 'Commandes & Réservations'
      };
      titleHeader.textContent = titles[panelName] || 'Dashboard';
    }

    // Render selected panel view
    switch (panelName) {
      case 'overview':
        renderOverviewPanel();
        break;
      case 'stock':
        renderStockPanel();
        break;
      case 'leftovers':
        renderLeftoversPanel();
        break;
      case 'ruined':
        renderRuinedPanel();
        break;
      case 'expenses':
        renderExpensesPanel();
        break;
      case 'comptabilite':
        renderComptabilitePanel();
        break;
      case 'product-types':
        renderProductTypesPanel();
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
  // ── Helper Exporter function (Excel CSV) ──
  function exportToCsv(filename, headers, rows) {
    let csvContent = "\uFEFF"; // UTF-8 BOM for French accents in Excel
    csvContent += headers.join(";") + "\n";
    rows.forEach(row => {
      const formattedRow = row.map(field => {
        let text = String(field !== null && field !== undefined ? field : "").replace(/"/g, '""');
        if (text.includes(";") || text.includes("\n") || text.includes('"')) {
          text = `"${text}"`;
        }
        return text;
      });
      csvContent += formattedRow.join(";") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // A. OVERVIEW PANEL (Tableau de Bord Exécutif & Audits)
  function renderOverviewPanel() {
    const contentArea = document.getElementById('admin-body-content');
    if (!contentArea || typeof BabkeDB === 'undefined') return;

    const orders = BabkeDB.getOrders();
    const reservations = BabkeDB.getReservations();
    const leftovers = BabkeDB.getLeftovers();
    const ruined = BabkeDB.getRuinedProducts();
    const expenses = BabkeDB.getExpenses();
    const stockMovements = BabkeDB.getStockMovements();
    const auditLogs = BabkeDB.getAuditLogs();

    // Compute executive stats
    const totalOrders = orders.length;
    const totalReservations = reservations.length;
    const activeRevenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.subtotal || 0), 0);
    const totalExpensesAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalStockPurchases = stockMovements.filter(m => m.type === 'IN').reduce((sum, m) => sum + (m.totalPrice || 0), 0);
    const netProfit = activeRevenue - totalExpensesAmount;

    // Build Audit Log Timeline HTML
    const auditItemsHtml = auditLogs.length === 0 ? `
      <div style="text-align: center; padding: 24px; color: var(--text-admin-muted);">Aucune action enregistrée pour le moment.</div>
    ` : auditLogs.slice(0, 15).map(log => `
      <div class="audit-item">
        <span class="audit-role-badge ${log.userRole.toLowerCase()}">${log.userRole}</span>
        <div class="audit-content">
          <div class="audit-header">
            <span class="audit-username">${log.username} (${log.actionType})</span>
            <span class="audit-timestamp">🕒 ${log.timestamp}</span>
          </div>
          <div class="audit-details">${log.details}</div>
        </div>
      </div>
    `).join('');

    // Destroy existing chart instances
    ['chart-revenue-vs-expenses', 'chart-waste-breakdown'].forEach(_destroyChart);

    contentArea.innerHTML = `
      <!-- Executive Summary Cards (Clickable Gateways for Owner / Admin) -->
      <div class="dashboard-grid-stats" style="margin-bottom: 24px;">
        <div class="stat-card clickable-stat-card" data-target-panel="orders-reservations" title="Cliquer pour voir le détail des Commandes & Réservations">
          <div class="stat-card-details">
            <span>Chiffre d'Affaires</span>
            <h3>${activeRevenue.toFixed(1)} TND</h3>
            <span class="stat-card-trend positive">Voir Commandes &rarr;</span>
          </div>
          <div class="stat-card-visual">
            <div class="stat-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
        </div>
        <div class="stat-card clickable-stat-card" data-target-panel="expenses" title="Cliquer pour voir le Journal des Dépenses de Caisse">
          <div class="stat-card-details">
            <span>Dépenses de Caisse</span>
            <h3>${totalExpensesAmount.toFixed(1)} TND</h3>
            <span class="stat-card-trend negative">Voir Dépenses &rarr;</span>
          </div>
          <div class="stat-card-visual">
            <div class="stat-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </div>
          </div>
        </div>
        <div class="stat-card clickable-stat-card" data-target-panel="comptabilite" title="Cliquer pour voir la Comptabilité et Exports Excel">
          <div class="stat-card-details">
            <span>Bénéfice Net Estimé</span>
            <h3 style="color: ${netProfit >= 0 ? 'var(--accent-admin)' : '#ef4444'}">${netProfit.toFixed(1)} TND</h3>
            <span class="stat-card-trend positive">Bilan & Exports &rarr;</span>
          </div>
          <div class="stat-card-visual">
            <div class="stat-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            </div>
          </div>
        </div>
        <div class="stat-card clickable-stat-card" data-target-panel="stock" title="Cliquer pour voir la Gestion des Stocks">
          <div class="stat-card-details">
            <span>Achats Stock Cumulés</span>
            <h3>${totalStockPurchases.toFixed(1)} TND</h3>
            <span class="stat-card-trend neutral">Voir Inventaire &rarr;</span>
          </div>
          <div class="stat-card-visual">
            <div class="stat-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Overview Split Layout -->
      <div class="dashboard-split-layout" style="margin-bottom: 24px;">
        <!-- Left: Financial Charts -->
        <div class="admin-card" style="padding: 24px;">
          <div class="admin-card-header" style="margin-bottom: 16px;">
            <h3>📊 Analyse Financière & Activités</h3>
          </div>
          <div style="position: relative; width: 100%; height: 260px;">
            <canvas id="chart-revenue-vs-expenses"></canvas>
          </div>
        </div>

        <!-- Right: Waste & Leftovers Breakdown -->
        <div class="admin-card" style="padding: 24px;">
          <div class="admin-card-header" style="margin-bottom: 16px;">
            <h3>🥗 Répartition des Restes & Pertes</h3>
          </div>
          <div style="position: relative; width: 100%; height: 260px;">
            <canvas id="chart-waste-breakdown"></canvas>
          </div>
        </div>
      </div>

      <!-- Action Audit Trail Timeline (Owner Insight) -->
      <div class="admin-card" style="padding: 24px;">
        <div class="admin-card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; border-bottom: 1px dashed var(--border-admin); padding-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <h3>🕵️ Journal d'Audits Horodaté (Actions du Personnel)</h3>
            <span style="font-size: 0.75rem; font-weight: 800; padding: 3px 10px; border-radius: 20px; background: rgba(255, 90, 31, 0.15); color: var(--accent-admin);">${auditLogs.length} Actions</span>
          </div>
        </div>
        <div class="audit-timeline">
          ${auditItemsHtml}
        </div>
      </div>
    `;

    // Render Chart.js
    if (typeof Chart !== 'undefined') {
      // 1. Revenue vs Expenses
      const finCtx = document.getElementById('chart-revenue-vs-expenses');
      if (finCtx) {
        _chartInstances['chart-revenue-vs-expenses'] = new Chart(finCtx, {
          type: 'bar',
          data: {
            labels: ['Chiffre d\'Affaires', 'Dépenses Caisse', 'Achats de Stock', 'Bénéfice Net'],
            datasets: [{
              label: 'Montant (TND)',
              data: [activeRevenue, totalExpensesAmount, totalStockPurchases, Math.max(0, netProfit)],
              backgroundColor: [
                'rgba(16, 185, 129, 0.85)',
                'rgba(239, 68, 68, 0.85)',
                'rgba(59, 130, 246, 0.85)',
                'rgba(245, 158, 11, 0.85)'
              ],
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
          }
        });
      }

      // 2. Waste & Leftovers Breakdown
      const wasteCtx = document.getElementById('chart-waste-breakdown');
      if (wasteCtx) {
        _chartInstances['chart-waste-breakdown'] = new Chart(wasteCtx, {
          type: 'doughnut',
          data: {
            labels: ['Restes Enregistrés (' + leftovers.length + ')', 'Produits Gâtés / Pertes (' + ruined.length + ')'],
            datasets: [{
              data: [leftovers.length || 1, ruined.length || 1],
              backgroundColor: ['rgba(59, 130, 246, 0.85)', 'rgba(239, 68, 68, 0.85)']
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%'
          }
        });
      }
    }
  }

  // B. GESTION DES STOCKS (Comptable & Admin)
  function renderStockPanel() {
    const contentArea = document.getElementById('admin-body-content');
    if (!contentArea || typeof BabkeDB === 'undefined') return;

    const productTypes = BabkeDB.getProductTypes();
    const stockMovements = BabkeDB.getStockMovements();
    const ruined = BabkeDB.getRuinedProducts();

    // Calculate real-time stock balance per product type
    // Stock Balance = Total IN - Total OUT - Total Ruined
    const stockBalance = {};
    productTypes.forEach(pt => {
      stockBalance[pt.name] = {
        name: pt.name,
        category: pt.category,
        unit: pt.defaultUnit,
        minAlert: pt.minStockAlert || 5,
        totalIn: 0,
        totalOut: 0,
        ruined: 0,
        balance: 0
      };
    });

    stockMovements.forEach(m => {
      if (!stockBalance[m.productName]) {
        stockBalance[m.productName] = {
          name: m.productName,
          category: 'Autre',
          unit: m.unit,
          minAlert: 5,
          totalIn: 0,
          totalOut: 0,
          ruined: 0,
          balance: 0
        };
      }
      if (m.type === 'IN') {
        stockBalance[m.productName].totalIn += (m.quantity || 0);
      } else if (m.type === 'OUT') {
        stockBalance[m.productName].totalOut += (m.quantity || 0);
      }
    });

    ruined.forEach(r => {
      if (stockBalance[r.item]) {
        stockBalance[r.item].ruined += (r.quantity || 0);
      }
    });

    Object.keys(stockBalance).forEach(k => {
      const item = stockBalance[k];
      item.balance = Math.max(0, item.totalIn - item.totalOut - item.ruined);
    });

    // Render Balance Cards
    const balanceCardsHtml = Object.values(stockBalance).map(sb => {
      const isLow = sb.balance <= sb.minAlert;
      return `
        <div class="stock-card ${isLow ? 'low-stock' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div>
              <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--text-admin-primary); margin-bottom: 2px;">${sb.name}</h4>
              <span style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-admin-muted); font-weight: 700;">${sb.category}</span>
            </div>
            ${isLow ? '<span style="font-size: 0.7rem; font-weight: 800; padding: 2px 8px; border-radius: 12px; background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4);">⚠️ Stock Bas</span>' : ''}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <div style="font-size: 1.6rem; font-weight: 900; color: ${isLow ? '#ef4444' : 'var(--accent-primary)'};">
              ${sb.balance.toFixed(1)} <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-admin-muted);">${sb.unit}</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-admin-muted); text-align: right;">
              <div>Entrées: +${sb.totalIn.toFixed(1)}</div>
              <div>Sorties: -${sb.totalOut.toFixed(1)}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Movement Table Rows
    const movementRowsHtml = stockMovements.length === 0 ? `
      <tr><td colspan="8" style="text-align: center; padding: 24px; color: var(--text-admin-muted);">Aucun mouvement de stock enregistré.</td></tr>
    ` : stockMovements.map(m => `
      <tr>
        <td>${m.date}</td>
        <td><strong style="color: var(--text-admin-primary);">${m.productName}</strong></td>
        <td><span class="movement-badge ${m.type === 'IN' ? 'in' : 'out'}">${m.type === 'IN' ? '📥 ACHAT (ENTRÉE)' : '📤 RETRAIT (SORTIE)'}</span></td>
        <td><strong>${m.quantity} ${m.unit}</strong></td>
        <td>${m.totalPrice ? m.totalPrice.toFixed(1) + ' TND' : '-'}</td>
        <td>${m.supplier || m.reason || '-'}</td>
        <td><span style="font-size: 0.78rem; text-transform: uppercase; font-weight: 700; color: var(--accent-primary);">${m.recordedBy || 'comptable'}</span></td>
        <td style="text-align: right;">
          <button class="btn-action-delete btn-delete-stock" data-id="${m.id}">Supprimer</button>
        </td>
      </tr>
    `).join('');

    const canExportStock = (userRole === 'comptable' || userRole === 'admin');

    contentArea.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 14px;">
        <div>
          <h3 style="font-size: 1.25rem; font-weight: 800;">📦 Soldes du Stock en Temps Réel</h3>
          <p style="font-size: 0.85rem; color: var(--text-admin-muted);">Suivi automatique: Stock Disponible = Achats - Retraits Cuisine - Pertes</p>
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          ${canExportStock ? `
            <button class="btn-excel-export" id="btn-panel-export-stock" title="Télécharger le fichier Excel des mouvements de stock">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>📊 Exporter le Stock (.csv)</span>
            </button>
          ` : ''}
          <button class="btn-admin-primary" id="btn-open-stock-in" style="background: #10b981;">
            <span>Saisir un Achat (Entrée)</span>
          </button>
          <button class="btn-admin-primary" id="btn-open-stock-out" style="background: #ef4444;">
            <span>📤 Saisir un Retrait (Sortie)</span>
          </button>
        </div>
      </div>

      <div class="stock-balance-grid">
        ${balanceCardsHtml}
      </div>

      <div class="admin-card" style="margin-top: 24px;">
        <div class="admin-card-header" style="margin-bottom: 18px;">
          <h3>📋 Journal des Mouvements de Stock</h3>
        </div>
        <div class="table-responsive-wrapper">
          <table class="admin-data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Produit</th>
                <th>Type</th>
                <th>Quantité</th>
                <th>Prix Total</th>
                <th>Fournisseur / Motif</th>
                <th>Enregistré Par</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${movementRowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Bind Modals & Delete Buttons
    const exportStockBtn = document.getElementById('btn-panel-export-stock');
    if (exportStockBtn) {
      exportStockBtn.addEventListener('click', () => {
        const stockMovements = BabkeDB.getStockMovements();
        const headers = ["Date", "Nom Produit", "Type Mouvement", "Quantite", "Unite", "Prix Unitaire (TND)", "Coût Total (TND)", "Fournisseur / Motif", "Enregistre Par"];
        const rows = stockMovements.map(s => [
          s.date,
          s.productName,
          s.type === 'IN' ? 'ACHAT (ENTRÉE)' : 'RETRAIT (SORTIE)',
          s.quantity,
          s.unit,
          s.unitPrice || 0,
          s.totalPrice || 0,
          s.supplier || s.reason || '',
          s.recordedBy || ''
        ]);
        exportToCsv(`Babke_Mouvements_Stock_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
        showToast("📊 Exportation Excel du Stock générée avec succès !", "success");
      });
    }
    const openInBtn = document.getElementById('btn-open-stock-in');
    if (openInBtn) {
      openInBtn.addEventListener('click', () => {
        populateProductDropdown('stock-in-product');
        document.getElementById('stock-in-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('stock-in-modal').classList.add('open');
      });
    }

    const openOutBtn = document.getElementById('btn-open-stock-out');
    if (openOutBtn) {
      openOutBtn.addEventListener('click', () => {
        populateProductDropdown('stock-out-product');
        updateLiveStockBadge('stock-out-product', 'stock-out-balance-badge');
        document.getElementById('stock-out-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('stock-out-modal').classList.add('open');
      });
    }

    contentArea.querySelectorAll('.btn-delete-stock').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        if (confirm("Voulez-vous vraiment supprimer ce mouvement de stock ?")) {
          await BabkeDB.deleteStockMovement(id);
          showToast("🗑️ Mouvement de stock supprimé.");
          renderStockPanel();
        }
      });
    });
  }

  let activeProductSelectTarget = null;

  // Robust Helper to calculate available stock balance for a product
  function getAvailableStockBalance(productName) {
    if (!productName || typeof BabkeDB === 'undefined') return 0;
    const cleanTargetName = String(productName).trim().toLowerCase();
    const stockMovements = BabkeDB.getStockMovements() || [];
    const ruined = BabkeDB.getRuinedProducts() || [];

    let totalIn = 0;
    let totalOut = 0;
    let totalRuined = 0;

    stockMovements.forEach(m => {
      const mName = String(m.productName || '').trim().toLowerCase();
      if (mName === cleanTargetName) {
        const qty = parseFloat(m.quantity) || 0;
        if (m.type === 'IN') totalIn += qty;
        else if (m.type === 'OUT') totalOut += qty;
      }
    });

    ruined.forEach(r => {
      const rName = String(r.item || '').trim().toLowerCase();
      if (rName === cleanTargetName) {
        const qty = parseFloat(r.quantity) || 0;
        totalRuined += qty;
      }
    });

    const balance = totalIn - totalOut - totalRuined;
    return isNaN(balance) ? 0 : balance;
  }

  // Update live stock helper badge under select dropdown
  function updateLiveStockBadge(selectId, badgeId) {
    const select = document.getElementById(selectId);
    const badge = document.getElementById(badgeId);
    if (!select || !badge) return;
    const productName = select.value;
    if (!productName || productName === '__add_new_product__') {
      badge.style.display = 'none';
      return;
    }
    const balance = getAvailableStockBalance(productName);
    const types = BabkeDB.getProductTypes();
    const matched = types.find(t => t.name === productName);
    const unit = matched ? matched.defaultUnit : 'unités';

    badge.style.display = 'block';
    if (balance <= 0) {
      badge.style.background = 'rgba(239, 68, 68, 0.15)';
      badge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
      badge.style.color = '#ef4444';
      badge.innerHTML = `⚠️ <strong>Stock Épuisé :</strong> 0 ${unit} disponible`;
    } else {
      badge.style.background = 'rgba(16, 185, 129, 0.15)';
      badge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
      badge.style.color = '#059669';
      badge.innerHTML = `📦 <strong>Stock En Réserve :</strong> ${balance.toFixed(1)} ${unit} disponible`;
    }
  }

  // Populate Product Select Dropdowns
  function populateProductDropdown(selectId, selectedValue = null) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const types = BabkeDB.getProductTypes();
    let optionsHtml = types.map(t => `<option value="${t.name}">${t.name} (${t.defaultUnit})</option>`).join('');
    optionsHtml += `<option value="__add_new_product__" style="font-weight: 700; color: var(--accent-admin);">➕ Ajouter un nouveau produit...</option>`;
    select.innerHTML = optionsHtml;
    
    if (selectedValue) {
      select.value = selectedValue;
    }

    // Attach change listener if selecting '__add_new_product__'
    if (!select.dataset.hasAddListener) {
      select.dataset.hasAddListener = 'true';
      select.addEventListener('change', (e) => {
        if (e.target.value === '__add_new_product__') {
          activeProductSelectTarget = selectId;
          document.getElementById('product-type-modal').classList.add('open');
          e.target.selectedIndex = 0;
        } else {
          if (selectId === 'stock-out-product') updateLiveStockBadge('stock-out-product', 'stock-out-balance-badge');
          if (selectId === 'ruined-form-product') updateLiveStockBadge('ruined-form-product', 'ruined-form-balance-badge');
        }
      });
    }
  }

  // Delegated click handler for + Nouveau Produit inline buttons
  document.addEventListener('click', (e) => {
    const inlineBtn = e.target.closest('.btn-inline-add-pt');
    if (inlineBtn) {
      e.preventDefault();
      activeProductSelectTarget = inlineBtn.dataset.target;
      const ptModal = document.getElementById('product-type-modal');
      if (ptModal) ptModal.classList.add('open');
    }
  });

  // Delegated click handler for interactive Stat Cards across the dashboard
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.stat-card[data-target-panel]');
    if (card) {
      const targetPanel = card.dataset.targetPanel;
      if (targetPanel) {
        switchPanel(targetPanel);
      }
    }
  });

  // C. PRODUITS GÂTÉS & PERTES PANEL (Ouvrier, Comptable, Admin)
  function renderRuinedPanel() {
    const contentArea = document.getElementById('admin-body-content');
    if (!contentArea || typeof BabkeDB === 'undefined') return;

    const ruined = BabkeDB.getRuinedProducts();

    const ruinedRowsHtml = ruined.length === 0 ? `
      <tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-admin-muted);">Aucune perte ni produit gâté enregistré.</td></tr>
    ` : ruined.map(r => `
      <tr>
        <td>${r.date}</td>
        <td><strong style="color: var(--text-admin-primary);">${r.item}</strong></td>
        <td><strong style="color: #ef4444;">${r.quantity} ${r.unit}</strong></td>
        <td><span style="padding: 3px 8px; border-radius: 6px; background: rgba(239, 68, 68, 0.15); color: #f87171; font-weight: 700; font-size: 0.78rem;">${r.reason}</span></td>
        <td><span style="font-size: 0.78rem; font-weight: 700; text-transform: uppercase; color: var(--accent-primary);">${r.recordedBy || 'worker'}</span></td>
        <td style="text-align: right;">
          <button class="btn-action-delete btn-delete-ruined" data-id="${r.id}">Supprimer</button>
        </td>
      </tr>
    `).join('');

    const canExportRuined = (userRole === 'comptable' || userRole === 'admin');

    contentArea.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 14px;">
        <div>
          <h3 style="font-size: 1.25rem; font-weight: 800;">🗑️ Saisie des Produits Gâtés & Pertes</h3>
          <p style="font-size: 0.85rem; color: var(--text-admin-muted);">Enregistrement des ingrédients périmés, brûlés ou détériorés.</p>
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          ${canExportRuined ? `
            <button class="btn-excel-export" id="btn-panel-export-ruined" title="Télécharger le fichier Excel des produits gâtés et pertes">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>📊 Exporter les Pertes (.csv)</span>
            </button>
          ` : ''}
          <button class="btn-admin-primary" id="btn-open-ruined-modal" style="background: #ef4444;">
            <span>+ Saisir un Produit Gâté</span>
          </button>
        </div>
      </div>

      <div class="admin-card">
        <div class="table-responsive-wrapper">
          <table class="admin-data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Produit Concerné</th>
                <th>Quantité Gâtée</th>
                <th>Cause / Motif</th>
                <th>Enregistré Par</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${ruinedRowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const exportRuinedBtn = document.getElementById('btn-panel-export-ruined');
    if (exportRuinedBtn) {
      exportRuinedBtn.addEventListener('click', () => {
        const ruined = BabkeDB.getRuinedProducts();
        const headers = ["Date", "Produit Gate / Abime", "Quantite Perdue", "Unite", "Cause / Motif", "Enregistre Par"];
        const rows = ruined.map(r => [
          r.date,
          r.item,
          r.quantity,
          r.unit,
          r.reason,
          r.recordedBy || ''
        ]);
        exportToCsv(`Babke_Produits_Gates_Pertes_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
        showToast("📊 Exportation Excel des Pertes générée avec succès !", "success");
      });
    }

    const openBtn = document.getElementById('btn-open-ruined-modal');
    if (openBtn) {
      openBtn.addEventListener('click', () => {
        populateProductDropdown('ruined-form-product');
        updateLiveStockBadge('ruined-form-product', 'ruined-form-balance-badge');
        document.getElementById('ruined-form-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('ruined-modal').classList.add('open');
      });
    }

    contentArea.querySelectorAll('.btn-delete-ruined').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        if (confirm("Voulez-vous vraiment supprimer cet enregistrement de perte ?")) {
          await BabkeDB.deleteRuinedProduct(id);
          showToast("🗑️ Perte supprimée.");
          renderRuinedPanel();
        }
      });
    });
  }

  // D. TYPES DE PRODUITS PANEL (Comptable & Admin)
  function renderProductTypesPanel() {
    const contentArea = document.getElementById('admin-body-content');
    if (!contentArea || typeof BabkeDB === 'undefined') return;

    const types = BabkeDB.getProductTypes();

    const rowsHtml = types.map(t => `
      <tr>
        <td><strong style="color: var(--text-admin-primary);">${t.name}</strong></td>
        <td><span style="padding: 3px 8px; border-radius: 6px; background: rgba(255, 90, 31, 0.15); color: var(--accent-primary); font-weight: 700; font-size: 0.78rem;">${t.category}</span></td>
        <td>${t.defaultUnit}</td>
        <td>${t.minStockAlert || 5} ${t.defaultUnit}</td>
        <td style="text-align: right;">
          <button class="btn-action-delete btn-delete-pt" data-id="${t.id}">Supprimer</button>
        </td>
      </tr>
    `).join('');

    contentArea.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 14px;">
        <div>
          <h3 style="font-size: 1.25rem; font-weight: 800;">🏷️ Gestion des Types de Produits</h3>
          <p style="font-size: 0.85rem; color: var(--text-admin-muted);">Définissez les produits que les ouvriers et le comptable sélectionnent dans les listes.</p>
        </div>
        <button class="btn-admin-primary" id="btn-open-pt-modal">
          <span>+ Ajouter un Type de Produit</span>
        </button>
      </div>

      <div class="admin-card">
        <div class="table-responsive-wrapper">
          <table class="admin-data-table">
            <thead>
              <tr>
                <th>Nom du Produit</th>
                <th>Catégorie</th>
                <th>Unité par Défaut</th>
                <th>Seuil d'Alerte Stock</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const openBtn = document.getElementById('btn-open-pt-modal');
    if (openBtn) {
      openBtn.addEventListener('click', () => {
        document.getElementById('product-type-modal').classList.add('open');
      });
    }

    contentArea.querySelectorAll('.btn-delete-pt').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        if (confirm("Voulez-vous vraiment supprimer ce type de produit ?")) {
          await BabkeDB.deleteProductType(id);
          showToast("🗑️ Type de produit supprimé.");
          renderProductTypesPanel();
        }
      });
    });
  }

  // ── Accounting Module State ──
  let currentAcctViewMode = 'comptable'; // 'comptable' | 'proprietaire' | 'pnl'
  let currentAcctSubTab = 'poulet_viandes'; // 'poulet_viandes' | 'frits' | 'nettoyage' | 'sahloul_jfs'

  // E. COMPTABILITÉ DIGITALISÉE, EXPORT EXCEL & ANALYTIQUE PROPRIÉTAIRE
  function renderComptabilitePanel() {
    const contentArea = document.getElementById('admin-body-content');
    if (!contentArea || typeof BabkeDB === 'undefined') return;

    const orders = BabkeDB.getOrders();
    const expenses = BabkeDB.getExpenses();
    const stockMovements = BabkeDB.getStockMovements();
    const leftovers = BabkeDB.getLeftovers();
    const ruined = BabkeDB.getRuinedProducts();
    const sheets = BabkeDB.getAccountingSheets() || {};

    const pvData = sheets.poulet_viandes || [];
    const fritsData = sheets.frits || [];
    const netData = sheets.nettoyage || [];
    const sjfsData = sheets.sahloul_jfs || [];

    // Financial Calculations for P&L
    const grossRevenue = orders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
    
    // Total cost from digitalized sheets
    const totalPvCost = pvData.reduce((s, r) => s + (r.cuisseTot || 0) + (r.blancTot || 0) + (r.escalopeTot || 0) + (r.cuisseCompTot || 0) + (r.oeufTot || 0), 0);
    const totalFritsCost = fritsData.reduce((s, r) => s + (r.total || (r.quantity * r.unitValue) || 0), 0);
    const totalNetCost = netData.reduce((s, r) => s + (r.total || (r.quantity * r.unitValue) || 0), 0);
    const totalSjfsCost = sjfsData.reduce((s, r) => s + (r.total || (r.quantity * r.unitValue) || 0), 0);
    const totalSheetsCost = totalPvCost + totalFritsCost + totalNetCost + totalSjfsCost;

    const cogsStockIn = stockMovements
      .filter(m => m.type === 'IN')
      .reduce((sum, m) => sum + (m.totalPrice || ((m.quantity || 0) * (m.unitPrice || 0))), 0) + totalSheetsCost;

    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalCosts = cogsStockIn + totalExpenses;
    const netProfit = grossRevenue - totalCosts;
    const marginPct = grossRevenue > 0 ? ((netProfit / grossRevenue) * 100) : 0;
    const isProfitable = netProfit >= 0;

    // Destroy existing chart instances before rendering
    ['chart-acct-price-trends', 'chart-acct-category-breakdown'].forEach(_destroyChart);

    contentArea.innerHTML = `
      <div style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 12px;">
          <div>
            <h3 style="font-size: 1.35rem; font-weight: 900; color: var(--text-admin-primary); margin-bottom: 4px;">📊 Espace Comptabilité & Grand Livre Digitalisé</h3>
            <p style="font-size: 0.85rem; color: var(--text-admin-muted);">Saisie directe des feuilles d'achats (Poulet, Frits, Nettoyage, Sahloul JFS) avec calculs automatiques, revue analytique Propriétaire et export Excel.</p>
          </div>
          
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn-excel-export" id="btn-export-master-workbook" style="padding: 10px 16px; background: #059669; border-color: #059669;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              <span>Exporter Grand Livre Excel (.csv)</span>
            </button>
          </div>
        </div>

        <!-- Primary View Mode Selector Tabs -->
        <div class="acct-mode-nav-tabs" style="display: flex; gap: 10px; border-bottom: 1px solid var(--border-admin); padding-bottom: 12px; margin-bottom: 20px;">
          <button type="button" class="acct-mode-btn ${currentAcctViewMode === 'comptable' ? 'active' : ''}" data-acct-mode="comptable" style="padding: 9px 18px; border-radius: 8px; font-weight: 700; font-size: 0.88rem; cursor: pointer; border: 1px solid var(--border-admin); background: ${currentAcctViewMode === 'comptable' ? 'var(--accent-admin)' : 'transparent'}; color: ${currentAcctViewMode === 'comptable' ? '#fff' : 'var(--text-admin-secondary)'}; transition: all 0.2s ease;">
            📝 Mode Comptable (Saisie Excel Directe)
          </button>
          <button type="button" class="acct-mode-btn ${currentAcctViewMode === 'proprietaire' ? 'active' : ''}" data-acct-mode="proprietaire" style="padding: 9px 18px; border-radius: 8px; font-weight: 700; font-size: 0.88rem; cursor: pointer; border: 1px solid var(--border-admin); background: ${currentAcctViewMode === 'proprietaire' ? 'var(--accent-admin)' : 'transparent'}; color: ${currentAcctViewMode === 'proprietaire' ? '#fff' : 'var(--text-admin-secondary)'}; transition: all 0.2s ease;">
            👑 Mode Propriétaire (Revue & Analytique)
          </button>
          <button type="button" class="acct-mode-btn ${currentAcctViewMode === 'pnl' ? 'active' : ''}" data-acct-mode="pnl" style="padding: 9px 18px; border-radius: 8px; font-weight: 700; font-size: 0.88rem; cursor: pointer; border: 1px solid var(--border-admin); background: ${currentAcctViewMode === 'pnl' ? 'var(--accent-admin)' : 'transparent'}; color: ${currentAcctViewMode === 'pnl' ? '#fff' : 'var(--text-admin-secondary)'}; transition: all 0.2s ease;">
            📈 Rapport P&L & Exports Définitifs
          </button>
        </div>
      </div>

      <!-- VIEW MODE A: SAISIE DIRECTE COMPTABLE (EXCEL SPREADSHEETS) -->
      ${currentAcctViewMode === 'comptable' ? `
        <div class="acct-workspace-card glass-card admin-card" style="padding: 22px; margin-bottom: 24px;">
          <!-- Sub-Tabs Bar for Excel Sheets -->
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid var(--border-admin);">
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button type="button" class="acct-subtab-btn ${currentAcctSubTab === 'poulet_viandes' ? 'active' : ''}" data-subtab="poulet_viandes" style="padding: 7px 14px; border-radius: 6px; font-size: 0.82rem; font-weight: 700; cursor: pointer; border: 1px solid ${currentAcctSubTab === 'poulet_viandes' ? 'var(--accent-admin)' : 'var(--border-admin)'}; background: ${currentAcctSubTab === 'poulet_viandes' ? 'rgba(255,90,31,0.15)' : 'transparent'}; color: ${currentAcctSubTab === 'poulet_viandes' ? 'var(--accent-admin)' : 'var(--text-admin-muted)'};">
                🍗 Poulet & Viandes (${pvData.length} jours)
              </button>
              <button type="button" class="acct-subtab-btn ${currentAcctSubTab === 'frits' ? 'active' : ''}" data-subtab="frits" style="padding: 7px 14px; border-radius: 6px; font-size: 0.82rem; font-weight: 700; cursor: pointer; border: 1px solid ${currentAcctSubTab === 'frits' ? 'var(--accent-admin)' : 'var(--border-admin)'}; background: ${currentAcctSubTab === 'frits' ? 'rgba(255,90,31,0.15)' : 'transparent'}; color: ${currentAcctSubTab === 'frits' ? 'var(--accent-admin)' : 'var(--text-admin-muted)'};">
                🍟 Frits (${fritsData.length} enregistrements)
              </button>
              <button type="button" class="acct-subtab-btn ${currentAcctSubTab === 'nettoyage' ? 'active' : ''}" data-subtab="nettoyage" style="padding: 7px 14px; border-radius: 6px; font-size: 0.82rem; font-weight: 700; cursor: pointer; border: 1px solid ${currentAcctSubTab === 'nettoyage' ? 'var(--accent-admin)' : 'var(--border-admin)'}; background: ${currentAcctSubTab === 'nettoyage' ? 'rgba(255,90,31,0.15)' : 'transparent'}; color: ${currentAcctSubTab === 'nettoyage' ? 'var(--accent-admin)' : 'var(--text-admin-muted)'};">
                🧹 Produits Nettoyage (${netData.length} articles)
              </button>
              <button type="button" class="acct-subtab-btn ${currentAcctSubTab === 'sahloul_jfs' ? 'active' : ''}" data-subtab="sahloul_jfs" style="padding: 7px 14px; border-radius: 6px; font-size: 0.82rem; font-weight: 700; cursor: pointer; border: 1px solid ${currentAcctSubTab === 'sahloul_jfs' ? 'var(--accent-admin)' : 'var(--border-admin)'}; background: ${currentAcctSubTab === 'sahloul_jfs' ? 'rgba(255,90,31,0.15)' : 'transparent'}; color: ${currentAcctSubTab === 'sahloul_jfs' ? 'var(--accent-admin)' : 'var(--text-admin-muted)'};">
                📦 SAHLOUL JFS (${sjfsData.length} articles)
              </button>
            </div>

            <div style="display: flex; gap: 10px;">
              <button type="button" class="btn-admin-primary" id="btn-add-acct-entry" style="padding: 8px 16px; font-size: 0.83rem;">
                + Saisir Nouvelle Ligne
              </button>
              <button type="button" class="btn-excel-export" id="btn-export-active-sheet" style="padding: 8px 14px; font-size: 0.8rem;">
                📥 Exporter Feuille (.csv)
              </button>
            </div>
          </div>

          <!-- Dynamic Spreadsheet Table Container -->
          <div id="acct-sheet-table-container">
            ${renderAcctSubTabTableContent(currentAcctSubTab, sheets)}
          </div>
        </div>
      ` : ''}

      <!-- VIEW MODE B: MODE PROPRIÉTAIRE (REVUE & ANALYTIQUE) -->
      ${currentAcctViewMode === 'proprietaire' ? `
        <div style="margin-bottom: 24px;">
          <!-- Owner Review Status Banner -->
          <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 18px 22px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 24px;">
            <div>
              <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: 800; color: #10b981; letter-spacing: 0.05em;">● Statut Validation Propriétaire</span>
              <h4 style="font-size: 1.15rem; font-weight: 900; color: var(--text-admin-primary); margin-top: 2px;">Saisies Comptables Enregistrées & Vérifiées 🟢</h4>
              <p style="font-size: 0.8rem; color: var(--text-admin-muted); margin-top: 2px;">Feuilles d'achats soumises par le Comptable. Analyse automatique des coûts moyens pondérés et variations des prix fournisseurs.</p>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.75rem; color: var(--text-admin-muted); display: block;">Total Achats Ingrédients Cumulés</span>
              <strong style="font-size: 1.4rem; font-weight: 900; color: #3b82f6;">${totalSheetsCost.toFixed(2)} TND</strong>
            </div>
          </div>

          <!-- Key Metrics: Weighted Average Unit Cost (Moyennes Pondérées) -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
            ${calculateWeightedAverageCardsHtml(pvData)}
          </div>

          <!-- Charts Section: Price Fluctuation Trend & Expense Distribution -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 24px; margin-bottom: 24px;">
            <div class="admin-card glass-card" style="padding: 20px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div>
                  <h4 style="font-size: 1.05rem; font-weight: 800;">📈 Évolution des Prix Unitaires par kg (TND)</h4>
                  <span style="font-size: 0.76rem; color: var(--text-admin-muted);">Fluctuations quotidiennes du prix du kg (Cuisse, Blanc, Escalope)</span>
                </div>
              </div>
              <div style="position: relative; height: 280px; width: 100%;">
                <canvas id="chart-acct-price-trends"></canvas>
              </div>
            </div>

            <div class="admin-card glass-card" style="padding: 20px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div>
                  <h4 style="font-size: 1.05rem; font-weight: 800;">🍩 Répartition des Dépenses par Catégorie</h4>
                  <span style="font-size: 0.76rem; color: var(--text-admin-muted);">Proportion des coûts (Poulet/Viandes vs Frits vs Nettoyage vs Supplies)</span>
                </div>
              </div>
              <div style="position: relative; height: 280px; width: 100%; display: flex; justify-content: center; align-items: center;">
                <canvas id="chart-acct-category-breakdown"></canvas>
              </div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- VIEW MODE C: RAPPORT P&L & EXPORTS DE FIN D'EXERCICE -->
      ${currentAcctViewMode === 'pnl' ? `
        <!-- Profit & Loss (P&L) Financial Report Card -->
        <div class="admin-card glass-card" style="padding: 24px; margin-bottom: 30px; border-left: 4px solid ${isProfitable ? 'var(--accent-success, #10b981)' : '#ef4444'};">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 20px;">
            <div>
              <h4 style="font-size: 1.2rem; font-weight: 900; margin-bottom: 4px;">📈 Compte de Résultat Financier (Profit & Loss)</h4>
              <span style="font-size: 0.82rem; color: var(--text-admin-muted);">Période cumulée des ventes et dépenses enregistrées</span>
            </div>
            <button class="btn-excel-export" id="btn-export-pnl" style="padding: 10px 18px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Exporter Rapport P&L (.csv)</span>
            </button>
          </div>

          <!-- P&L Stats Overview Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-admin); padding: 16px; border-radius: 10px;">
              <span style="font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-admin-muted); font-weight: 700;">Chiffre d'Affaires Brut</span>
              <h3 style="font-size: 1.4rem; font-weight: 900; color: #3b82f6; margin-top: 6px;">+${grossRevenue.toFixed(2)} TND</h3>
              <span style="font-size: 0.75rem; color: var(--text-admin-muted);">${orders.length} commandes livrées</span>
            </div>

            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-admin); padding: 16px; border-radius: 10px;">
              <span style="font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-admin-muted); font-weight: 700;">Coût des Achats (COGS)</span>
              <h3 style="font-size: 1.4rem; font-weight: 900; color: #f59e0b; margin-top: 6px;">-${cogsStockIn.toFixed(2)} TND</h3>
              <span style="font-size: 0.75rem; color: var(--text-admin-muted);">Achats stock & feuilles comptables</span>
            </div>

            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-admin); padding: 16px; border-radius: 10px;">
              <span style="font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-admin-muted); font-weight: 700;">Dépenses de Caisse</span>
              <h3 style="font-size: 1.4rem; font-weight: 900; color: #ef4444; margin-top: 6px;">-${totalExpenses.toFixed(2)} TND</h3>
              <span style="font-size: 0.75rem; color: var(--text-admin-muted);">${expenses.length} dépenses saisies</span>
            </div>

            <div style="background: ${isProfitable ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)'}; border: 1px solid ${isProfitable ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}; padding: 16px; border-radius: 10px;">
              <span style="font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; color: ${isProfitable ? '#10b981' : '#ef4444'}; font-weight: 800;">Bénéfice Net (Résultat)</span>
              <h3 style="font-size: 1.4rem; font-weight: 900; color: ${isProfitable ? '#10b981' : '#ef4444'}; margin-top: 6px;">${netProfit >= 0 ? '+' : ''}${netProfit.toFixed(2)} TND</h3>
              <span style="font-size: 0.75rem; font-weight: 700; color: ${isProfitable ? '#10b981' : '#ef4444'};">Marge Nette : ${marginPct.toFixed(1)}%</span>
            </div>
          </div>

          <!-- P&L Table Breakdown -->
          <div class="table-responsive-wrapper">
            <table class="admin-table" style="margin: 0;">
              <thead>
                <tr>
                  <th>Ligne du Compte de Résultat (P&L)</th>
                  <th>Valeur Cumulée</th>
                  <th>% du Chiffre d'Affaires</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-weight: 700;">1. Chiffre d'Affaires (Ventes Commandes)</td>
                  <td style="font-weight: 800; color: #3b82f6;">+${grossRevenue.toFixed(2)} TND</td>
                  <td style="font-weight: 600;">100.0%</td>
                  <td><span class="badge-status delivered">ENTRÉE REVENUS</span></td>
                </tr>
                <tr>
                  <td style="font-weight: 700;">2. Achats de Stock & Feuille Comptables (COGS)</td>
                  <td style="font-weight: 800; color: #f59e0b;">-${cogsStockIn.toFixed(2)} TND</td>
                  <td style="font-weight: 600;">${grossRevenue > 0 ? ((cogsStockIn / grossRevenue) * 100).toFixed(1) : '0.0'}%</td>
                  <td><span class="badge-status preparing">COÛT DIRECT</span></td>
                </tr>
                <tr>
                  <td style="font-weight: 700;">3. Dépenses de Caisse Opérationnelles</td>
                  <td style="font-weight: 800; color: #ef4444;">-${totalExpenses.toFixed(2)} TND</td>
                  <td style="font-weight: 600;">${grossRevenue > 0 ? ((totalExpenses / grossRevenue) * 100).toFixed(1) : '0.0'}%</td>
                  <td><span class="badge-status cancelled">CHARGES OPEX</span></td>
                </tr>
                <tr style="background: rgba(255, 255, 255, 0.04); font-weight: 900;">
                  <td style="font-weight: 900; font-size: 0.95rem;">BÉNÉFICE NET DE L'EXERCICE</td>
                  <td style="font-size: 1.05rem; color: ${isProfitable ? '#10b981' : '#ef4444'};">${netProfit >= 0 ? '+' : ''}${netProfit.toFixed(2)} TND</td>
                  <td style="font-size: 1.05rem; color: ${isProfitable ? '#10b981' : '#ef4444'};">${marginPct.toFixed(1)}%</td>
                  <td><span class="badge-status ${isProfitable ? 'delivered' : 'cancelled'}">${isProfitable ? 'BÉNÉFICIAIRE 🟢' : 'DÉFICITAIRE 🔴'}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
    `;

    // ── Wire Mode Switcher Buttons ──
    contentArea.querySelectorAll('.acct-mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        currentAcctViewMode = e.currentTarget.dataset.acctMode;
        renderComptabilitePanel();
      });
    });

    // ── Wire SubTab Buttons ──
    contentArea.querySelectorAll('.acct-subtab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        currentAcctSubTab = e.currentTarget.dataset.subtab;
        renderComptabilitePanel();
      });
    });

    // ── Master Excel Export Handler ──
    document.getElementById('btn-export-master-workbook')?.addEventListener('click', () => {
      exportMasterAccountingWorkbookCsv(sheets);
    });

    // ── Active Sheet Export Handler ──
    document.getElementById('btn-export-active-sheet')?.addEventListener('click', () => {
      exportActiveSheetCsv(currentAcctSubTab, sheets);
    });

    // ── Add Entry Button Handler ──
    document.getElementById('btn-add-acct-entry')?.addEventListener('click', () => {
      openAcctModal(currentAcctSubTab);
    });

    // ── Row Action Edit/Delete Listeners ──
    contentArea.querySelectorAll('.btn-edit-acct-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const sheetType = e.currentTarget.dataset.sheetType;
        const items = sheets[sheetType] || [];
        const item = items.find(x => x.id === id);
        if (item) openAcctModal(sheetType, item);
      });
    });

    contentArea.querySelectorAll('.btn-delete-acct-row').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        const sheetType = e.currentTarget.dataset.sheetType;
        if (confirm("Voulez-vous vraiment supprimer cette ligne de saisie comptable ?")) {
          await BabkeDB.deleteAccountingSheetItem(id, sheetType);
          showToast("Ligne comptable supprimée avec succès", "warning");
          renderComptabilitePanel();
        }
      });
    });

    // ── Render Charts for Mode Propriétaire ──
    if (currentAcctViewMode === 'proprietaire') {
      renderOwnerAnalyticsCharts(pvData, totalPvCost, totalFritsCost, totalNetCost, totalSjfsCost);
    }

    // ── P&L Export Button Handler ──
    if (currentAcctViewMode === 'pnl') {
      document.getElementById('btn-export-pnl')?.addEventListener('click', () => {
        const headers = ["Poste PnL", "Montant (TND)", "Pourcentage CA (%)"];
        const rows = [
          ["Chiffre d'Affaires Brut (Ventes)", grossRevenue.toFixed(2), "100.0%"],
          ["Coût des Achats Stock (COGS)", cogsStockIn.toFixed(2), grossRevenue > 0 ? ((cogsStockIn / grossRevenue) * 100).toFixed(1) + "%" : "0.0%"],
          ["Dépenses de Caisse Opérationnelles", totalExpenses.toFixed(2), grossRevenue > 0 ? ((totalExpenses / grossRevenue) * 100).toFixed(1) + "%" : "0.0%"],
          ["Bénéfice Net Résultat", netProfit.toFixed(2), marginPct.toFixed(1) + "%"]
        ];
        exportToCsv(`Babke_Rapport_Financier_PNL_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
        showToast("📊 Rapport Financier P&L exporté avec succès !");
      });
    }
  }

  // ── Helper Table Content Renderer ──
  function renderAcctSubTabTableContent(subTab, sheets) {
    if (subTab === 'poulet_viandes') {
      const rows = sheets.poulet_viandes || [];
      let totCuisseQty = 0, totCuisseTot = 0;
      let totBlancQty = 0, totBlancTot = 0;
      let totEscQty = 0, totEscTot = 0;
      let totCuisseCompQty = 0, totCuisseCompTot = 0;
      let totOeufQty = 0, totOeufTot = 0;

      rows.forEach(r => {
        totCuisseQty += (r.cuisseQty || 0); totCuisseTot += (r.cuisseTot || 0);
        totBlancQty += (r.blancQty || 0); totBlancTot += (r.blancTot || 0);
        totEscQty += (r.escalopeQty || 0); totEscTot += (r.escalopeTot || 0);
        totCuisseCompQty += (r.cuisseCompQty || 0); totCuisseCompTot += (r.cuisseCompTot || 0);
        totOeufQty += (r.oeufQty || 0); totOeufTot += (r.oeufTot || 0);
      });

      const avgCuisse = totCuisseQty > 0 ? (totCuisseTot / totCuisseQty) : 0;
      const avgBlanc = totBlancQty > 0 ? (totBlancTot / totBlancQty) : 0;
      const avgEsc = totEscQty > 0 ? (totEscTot / totEscQty) : 0;
      const avgCuisseComp = totCuisseCompQty > 0 ? (totCuisseCompTot / totCuisseCompQty) : 0;

      return `
        <div class="table-responsive-wrapper">
          <table class="admin-table" style="font-size: 0.81rem;">
            <thead>
              <tr style="text-align: center;">
                <th rowspan="2" style="vertical-align: middle;">Date</th>
                <th colspan="3" style="background: rgba(255, 90, 31, 0.08); color: var(--accent-admin);">CUISSE</th>
                <th colspan="3" style="background: rgba(59, 130, 246, 0.08); color: #3b82f6;">BLANC</th>
                <th colspan="3" style="background: rgba(16, 185, 129, 0.08); color: #10b981;">ESCALOPE</th>
                <th colspan="3" style="background: rgba(245, 158, 11, 0.08); color: #f59e0b;">CUISSE COMPLET</th>
                <th colspan="2" style="background: rgba(168, 85, 247, 0.08); color: #a855f7;">ŒUF</th>
                <th rowspan="2" style="vertical-align: middle;">Actions</th>
              </tr>
              <tr style="font-size: 0.75rem;">
                <th>Qty</th><th>Prix</th><th>Total</th>
                <th>Qty</th><th>Prix</th><th>Total</th>
                <th>Qty</th><th>Prix</th><th>Total</th>
                <th>Qty</th><th>Prix</th><th>Total</th>
                <th>Qty</th><th>Prix</th>
              </tr>
            </thead>
            <tbody>
              ${rows.length === 0 ? '<tr><td colspan="16" style="text-align:center; padding: 20px;">Aucune donnée enregistrée</td></tr>' : 
                rows.map(r => `
                  <tr>
                    <td style="font-weight: 700;">${r.date || ''}</td>
                    <td>${r.cuisseQty || 0}</td><td>${r.cuisseVal || 0}</td><td style="font-weight:700;">${(r.cuisseTot || 0).toFixed(2)}</td>
                    <td>${r.blancQty || 0}</td><td>${r.blancVal || 0}</td><td style="font-weight:700;">${(r.blancTot || 0).toFixed(2)}</td>
                    <td>${r.escalopeQty || 0}</td><td>${r.escalopeVal || 0}</td><td style="font-weight:700;">${(r.escalopeTot || 0).toFixed(2)}</td>
                    <td>${r.cuisseCompQty || 0}</td><td>${r.cuisseCompVal || 0}</td><td style="font-weight:700;">${(r.cuisseCompTot || 0).toFixed(2)}</td>
                    <td>${r.oeufQty || 0}</td><td>${r.oeufVal || 0}</td>
                    <td>
                      <div style="display:flex; gap:6px;">
                        <button class="btn-action-icon btn-edit-acct-row" data-id="${r.id}" data-sheet-type="poulet_viandes" title="Modifier">✏️</button>
                        <button class="btn-action-icon btn-delete-acct-row" data-id="${r.id}" data-sheet-type="poulet_viandes" title="Supprimer">🗑️</button>
                      </div>
                    </td>
                  </tr>
                `).join('')
              }
              <tr style="background: rgba(255,255,255,0.06); font-weight: 800; border-top: 2px solid var(--border-admin);">
                <td style="font-weight:900;">TOTAL CUMULÉ</td>
                <td>${totCuisseQty.toFixed(1)}</td><td>--</td><td style="color:var(--accent-admin);">${totCuisseTot.toFixed(2)}</td>
                <td>${totBlancQty.toFixed(1)}</td><td>--</td><td style="color:#3b82f6;">${totBlancTot.toFixed(2)}</td>
                <td>${totEscQty.toFixed(1)}</td><td>--</td><td style="color:#10b981;">${totEscTot.toFixed(2)}</td>
                <td>${totCuisseCompQty.toFixed(1)}</td><td>--</td><td style="color:#f59e0b;">${totCuisseCompTot.toFixed(2)}</td>
                <td>${totOeufQty.toFixed(1)}</td><td>--</td>
                <td>--</td>
              </tr>
              <tr style="background: rgba(59, 130, 246, 0.08); font-weight: 900; color: #3b82f6;">
                <td style="font-weight:900;">MOYENNE PONDÉRÉE</td>
                <td colspan="3" style="text-align:center;">${avgCuisse.toFixed(2)} TND / kg</td>
                <td colspan="3" style="text-align:center;">${avgBlanc.toFixed(2)} TND / kg</td>
                <td colspan="3" style="text-align:center;">${avgEsc.toFixed(2)} TND / kg</td>
                <td colspan="3" style="text-align:center;">${avgCuisseComp.toFixed(2)} TND / kg</td>
                <td colspan="2" style="text-align:center;">--</td>
                <td>--</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    if (subTab === 'frits') {
      const rows = sheets.frits || [];
      let totQty = 0, totCost = 0;
      rows.forEach(r => { totQty += (r.quantity || 0); totCost += (r.total || (r.quantity * r.unitValue) || 0); });
      const avgPrice = totQty > 0 ? (totCost / totQty) : 0;

      return `
        <div class="table-responsive-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Quantité (kg / sacs)</th>
                <th>Valeur Unitaire (TND)</th>
                <th>Total Dépensé (TND)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rows.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding: 20px;">Aucune donnée enregistrée</td></tr>' :
                rows.map(r => `
                  <tr>
                    <td style="font-weight: 700;">${r.date || ''}</td>
                    <td>${r.quantity || 0}</td>
                    <td>${r.unitValue || 0} TND</td>
                    <td style="font-weight: 800; color: var(--accent-admin);">${(r.total || (r.quantity * r.unitValue) || 0).toFixed(2)} TND</td>
                    <td>
                      <div style="display:flex; gap:6px;">
                        <button class="btn-action-icon btn-edit-acct-row" data-id="${r.id}" data-sheet-type="frits" title="Modifier">✏️</button>
                        <button class="btn-action-icon btn-delete-acct-row" data-id="${r.id}" data-sheet-type="frits" title="Supprimer">🗑️</button>
                      </div>
                    </td>
                  </tr>
                `).join('')
              }
              <tr style="background: rgba(255,255,255,0.06); font-weight: 900;">
                <td>TOTAL FRITS</td>
                <td>${totQty.toFixed(1)}</td>
                <td>Moyenne : ${avgPrice.toFixed(2)} TND</td>
                <td style="color: var(--accent-admin); font-size: 1.05rem;">${totCost.toFixed(2)} TND</td>
                <td>--</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    if (subTab === 'nettoyage') {
      const rows = sheets.nettoyage || [];
      let totCost = 0;
      rows.forEach(r => { totCost += (r.total || (r.quantity * r.unitValue) || 0); });

      return `
        <div class="table-responsive-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Article de Nettoyage</th>
                <th>Quantité</th>
                <th>Valeur Unitaire (TND)</th>
                <th>Total (TND)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rows.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding: 20px;">Aucune donnée enregistrée</td></tr>' :
                rows.map(r => `
                  <tr>
                    <td style="font-weight: 700;">${r.date || ''}</td>
                    <td style="font-weight: 700; text-transform: uppercase;">${r.article || ''}</td>
                    <td>${r.quantity || 0}</td>
                    <td>${r.unitValue || 0} TND</td>
                    <td style="font-weight: 800; color: #3b82f6;">${(r.total || (r.quantity * r.unitValue) || 0).toFixed(2)} TND</td>
                    <td>
                      <div style="display:flex; gap:6px;">
                        <button class="btn-action-icon btn-edit-acct-row" data-id="${r.id}" data-sheet-type="nettoyage" title="Modifier">✏️</button>
                        <button class="btn-action-icon btn-delete-acct-row" data-id="${r.id}" data-sheet-type="nettoyage" title="Supprimer">🗑️</button>
                      </div>
                    </td>
                  </tr>
                `).join('')
              }
              <tr style="background: rgba(255,255,255,0.06); font-weight: 900;">
                <td colspan="4">TOTAL PRODUITS NETTOYAGE</td>
                <td style="color: #3b82f6; font-size: 1.05rem;">${totCost.toFixed(2)} TND</td>
                <td>--</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    if (subTab === 'sahloul_jfs') {
      const rows = sheets.sahloul_jfs || [];
      let totCost = 0;
      rows.forEach(r => { totCost += (r.total || (r.quantity * r.unitValue) || 0); });

      return `
        <div class="table-responsive-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Article Supply</th>
                <th>Quantité</th>
                <th>Valeur Unitaire (TND)</th>
                <th>Total (TND)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rows.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding: 20px;">Aucune donnée enregistrée</td></tr>' :
                rows.map(r => `
                  <tr>
                    <td style="font-weight: 800; text-transform: uppercase; color: var(--accent-admin);">${r.article || ''}</td>
                    <td>${r.quantity || 0}</td>
                    <td>${r.unitValue || 0} TND</td>
                    <td style="font-weight: 800; color: #10b981;">${(r.total || (r.quantity * r.unitValue) || 0).toFixed(2)} TND</td>
                    <td>
                      <div style="display:flex; gap:6px;">
                        <button class="btn-action-icon btn-edit-acct-row" data-id="${r.id}" data-sheet-type="sahloul_jfs" title="Modifier">✏️</button>
                        <button class="btn-action-icon btn-delete-acct-row" data-id="${r.id}" data-sheet-type="sahloul_jfs" title="Supprimer">🗑️</button>
                      </div>
                    </td>
                  </tr>
                `).join('')
              }
              <tr style="background: rgba(255,255,255,0.06); font-weight: 900;">
                <td colspan="3">TOTAL ARTICLES SAHLOUL JFS</td>
                <td style="color: #10b981; font-size: 1.05rem;">${totCost.toFixed(2)} TND</td>
                <td>--</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    return '';
  }

  // ── Helper HTML generator for Weighted Average Cards in Owner Mode ──
  function calculateWeightedAverageCardsHtml(pvData) {
    let totCuisseQty = 0, totCuisseTot = 0;
    let totBlancQty = 0, totBlancTot = 0;
    let totEscQty = 0, totEscTot = 0;
    let totCuisseCompQty = 0, totCuisseCompTot = 0;

    pvData.forEach(r => {
      totCuisseQty += (r.cuisseQty || 0); totCuisseTot += (r.cuisseTot || 0);
      totBlancQty += (r.blancQty || 0); totBlancTot += (r.blancTot || 0);
      totEscQty += (r.escalopeQty || 0); totEscTot += (r.escalopeTot || 0);
      totCuisseCompQty += (r.cuisseCompQty || 0); totCuisseCompTot += (r.cuisseCompTot || 0);
    });

    const avgCuisse = totCuisseQty > 0 ? (totCuisseTot / totCuisseQty) : 0;
    const avgBlanc = totBlancQty > 0 ? (totBlancTot / totBlancQty) : 0;
    const avgEsc = totEscQty > 0 ? (totEscTot / totEscQty) : 0;
    const avgCuisseComp = totCuisseCompQty > 0 ? (totCuisseCompTot / totCuisseCompQty) : 0;

    return `
      <div style="background: rgba(255, 90, 31, 0.08); border: 1px solid rgba(255, 90, 31, 0.25); padding: 16px; border-radius: 12px;">
        <span style="font-size: 0.76rem; text-transform: uppercase; font-weight: 800; color: var(--accent-admin);">Cuisse (Poulet)</span>
        <h3 style="font-size: 1.35rem; font-weight: 900; color: var(--text-admin-primary); margin-top: 4px;">${avgCuisse.toFixed(2)} TND / kg</h3>
        <span style="font-size: 0.74rem; color: var(--text-admin-muted);">Total : ${totCuisseTot.toFixed(1)} TND (${totCuisseQty.toFixed(1)} kg)</span>
      </div>

      <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.25); padding: 16px; border-radius: 12px;">
        <span style="font-size: 0.76rem; text-transform: uppercase; font-weight: 800; color: #3b82f6;">Blanc (Poulet)</span>
        <h3 style="font-size: 1.35rem; font-weight: 900; color: var(--text-admin-primary); margin-top: 4px;">${avgBlanc.toFixed(2)} TND / kg</h3>
        <span style="font-size: 0.74rem; color: var(--text-admin-muted);">Total : ${totBlancTot.toFixed(1)} TND (${totBlancQty.toFixed(1)} kg)</span>
      </div>

      <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); padding: 16px; border-radius: 12px;">
        <span style="font-size: 0.76rem; text-transform: uppercase; font-weight: 800; color: #10b981;">Escalope</span>
        <h3 style="font-size: 1.35rem; font-weight: 900; color: var(--text-admin-primary); margin-top: 4px;">${avgEsc.toFixed(2)} TND / kg</h3>
        <span style="font-size: 0.74rem; color: var(--text-admin-muted);">Total : ${totEscTot.toFixed(1)} TND (${totEscQty.toFixed(1)} kg)</span>
      </div>

      <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); padding: 16px; border-radius: 12px;">
        <span style="font-size: 0.76rem; text-transform: uppercase; font-weight: 800; color: #f59e0b;">Cuisse Complet</span>
        <h3 style="font-size: 1.35rem; font-weight: 900; color: var(--text-admin-primary); margin-top: 4px;">${avgCuisseComp.toFixed(2)} TND / kg</h3>
        <span style="font-size: 0.74rem; color: var(--text-admin-muted);">Total : ${totCuisseCompTot.toFixed(1)} TND (${totCuisseCompQty.toFixed(1)} kg)</span>
      </div>
    `;
  }

  // ── Helper Chart Renderer for Owner Mode ──
  function renderOwnerAnalyticsCharts(pvData, totalPv, totalFrits, totalNet, totalSjfs) {
    if (typeof Chart === 'undefined') return;

    // Line Chart: Price Fluctuation Trend
    const ctxTrend = document.getElementById('chart-acct-price-trends')?.getContext('2d');
    if (ctxTrend) {
      const labels = pvData.map(r => r.date ? r.date.replace('2026-07-', '07/') : '');
      const cuisseValData = pvData.map(r => r.cuisseVal || 0);
      const blancValData = pvData.map(r => r.blancVal || 0);
      const escalopeValData = pvData.map(r => r.escalopeVal || 0);

      _chartInstances['chart-acct-price-trends'] = new Chart(ctxTrend, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            { label: 'Cuisse (TND/kg)', data: cuisseValData, borderColor: '#ff5a1f', backgroundColor: 'rgba(255, 90, 31, 0.1)', tension: 0.3, fill: false },
            { label: 'Blanc (TND/kg)', data: blancValData, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', tension: 0.3, fill: false },
            { label: 'Escalope (TND/kg)', data: escalopeValData, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', tension: 0.3, fill: false }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { boxWidth: 12, font: { family: 'Outfit', size: 11 } } }
          },
          scales: {
            y: { title: { display: true, text: 'Prix Unitaire (TND)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // Doughnut Chart: Category Expense Breakdown
    const ctxBreakdown = document.getElementById('chart-acct-category-breakdown')?.getContext('2d');
    if (ctxBreakdown) {
      _chartInstances['chart-acct-category-breakdown'] = new Chart(ctxBreakdown, {
        type: 'doughnut',
        data: {
          labels: ['Poulet & Viandes', 'Frits', 'Produits Nettoyage', 'Supplies SAHLOUL'],
          datasets: [{
            data: [totalPv, totalFrits, totalNet, totalSjfs],
            backgroundColor: ['#ff5a1f', '#f59e0b', '#3b82f6', '#10b981'],
            borderWidth: 2,
            borderColor: 'var(--bg-admin-card)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Outfit', size: 11 } } }
          }
        }
      });
    }
  }

  // ── Modal Handler for Accounting Entries ──
  function openAcctModal(sheetType, editItem = null) {
    const modal = document.getElementById('accounting-sheet-modal');
    const form = document.getElementById('acct-sheet-form');
    const fieldsContainer = document.getElementById('acct-dynamic-fields');
    const titleEl = document.getElementById('acct-modal-title');
    const previewTotalEl = document.getElementById('acct-calc-preview-total');
    if (!modal || !form || !fieldsContainer) return;

    document.getElementById('acct-form-id').value = editItem ? editItem.id : '';
    document.getElementById('acct-form-sheet-type').value = sheetType;

    const titles = {
      'poulet_viandes': 'Saisie Journée Poulet & Viandes',
      'frits': 'Saisie Achats / Consommation Frits',
      'nettoyage': 'Saisie Produits de Nettoyage',
      'sahloul_jfs': 'Saisie Fournitures SAHLOUL JFS'
    };
    if (titleEl) titleEl.textContent = (editItem ? "Modifier " : "Nouvelle ") + (titles[sheetType] || 'Ligne Comptable');

    // Build dynamic input fields
    if (sheetType === 'poulet_viandes') {
      fieldsContainer.innerHTML = `
        <div class="form-group-admin" style="margin-bottom: 14px;">
          <label for="acct-in-date">Date</label>
          <input type="date" id="acct-in-date" value="${editItem ? editItem.date : new Date().toISOString().split('T')[0]}" required>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; background: rgba(255,90,31,0.05); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,90,31,0.2);">
          <strong style="grid-column: 1 / -1; font-size: 0.82rem; color: var(--accent-admin);">CUISSE</strong>
          <div><label style="font-size:0.75rem;">Quantité (kg)</label><input type="number" step="0.1" id="acct-cuisse-qty" value="${editItem ? editItem.cuisseQty || 0 : ''}"></div>
          <div><label style="font-size:0.75rem;">Valeur Unitaire (TND)</label><input type="number" step="0.1" id="acct-cuisse-val" value="${editItem ? editItem.cuisseVal || 0 : ''}"></div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; background: rgba(59,130,246,0.05); padding: 10px; border-radius: 8px; border: 1px solid rgba(59,130,246,0.2);">
          <strong style="grid-column: 1 / -1; font-size: 0.82rem; color: #3b82f6;">BLANC</strong>
          <div><label style="font-size:0.75rem;">Quantité (kg)</label><input type="number" step="0.1" id="acct-blanc-qty" value="${editItem ? editItem.blancQty || 0 : ''}"></div>
          <div><label style="font-size:0.75rem;">Valeur Unitaire (TND)</label><input type="number" step="0.1" id="acct-blanc-val" value="${editItem ? editItem.blancVal || 0 : ''}"></div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; background: rgba(16,185,129,0.05); padding: 10px; border-radius: 8px; border: 1px solid rgba(16,185,129,0.2);">
          <strong style="grid-column: 1 / -1; font-size: 0.82rem; color: #10b981;">ESCALOPE</strong>
          <div><label style="font-size:0.75rem;">Quantité (kg)</label><input type="number" step="0.1" id="acct-esc-qty" value="${editItem ? editItem.escalopeQty || 0 : ''}"></div>
          <div><label style="font-size:0.75rem;">Valeur Unitaire (TND)</label><input type="number" step="0.1" id="acct-esc-val" value="${editItem ? editItem.escalopeVal || 0 : ''}"></div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; background: rgba(245,158,11,0.05); padding: 10px; border-radius: 8px; border: 1px solid rgba(245,158,11,0.2);">
          <strong style="grid-column: 1 / -1; font-size: 0.82rem; color: #f59e0b;">CUISSE COMPLET</strong>
          <div><label style="font-size:0.75rem;">Quantité (kg)</label><input type="number" step="0.1" id="acct-ccomp-qty" value="${editItem ? editItem.cuisseCompQty || 0 : ''}"></div>
          <div><label style="font-size:0.75rem;">Valeur Unitaire (TND)</label><input type="number" step="0.1" id="acct-ccomp-val" value="${editItem ? editItem.cuisseCompVal || 0 : ''}"></div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: rgba(168,85,247,0.05); padding: 10px; border-radius: 8px; border: 1px solid rgba(168,85,247,0.2);">
          <strong style="grid-column: 1 / -1; font-size: 0.82rem; color: #a855f7;">ŒUF</strong>
          <div><label style="font-size:0.75rem;">Quantité</label><input type="number" step="1" id="acct-oeuf-qty" value="${editItem ? editItem.oeufQty || 0 : ''}"></div>
          <div><label style="font-size:0.75rem;">Valeur Unitaire (TND)</label><input type="number" step="0.1" id="acct-oeuf-val" value="${editItem ? editItem.oeufVal || 0 : ''}"></div>
        </div>
      `;
    } else if (sheetType === 'frits') {
      fieldsContainer.innerHTML = `
        <div class="form-grid-admin">
          <div class="form-group-admin">
            <label for="acct-in-date">Date</label>
            <input type="date" id="acct-in-date" value="${editItem ? editItem.date : new Date().toISOString().split('T')[0]}" required>
          </div>
          <div class="form-group-admin">
            <label for="acct-in-qty">Quantité (kg / sacs)</label>
            <input type="number" step="0.1" id="acct-in-qty" value="${editItem ? editItem.quantity : ''}" required>
          </div>
        </div>
        <div class="form-group-admin" style="margin-top: 14px;">
          <label for="acct-in-unitval">Valeur Unitaire (TND)</label>
          <input type="number" step="0.1" id="acct-in-unitval" value="${editItem ? editItem.unitValue : ''}" required>
        </div>
      `;
    } else if (sheetType === 'nettoyage') {
      fieldsContainer.innerHTML = `
        <div class="form-grid-admin">
          <div class="form-group-admin">
            <label for="acct-in-date">Date</label>
            <input type="date" id="acct-in-date" value="${editItem ? editItem.date : new Date().toISOString().split('T')[0]}" required>
          </div>
          <div class="form-group-admin">
            <label for="acct-in-article">Article Nettoyage</label>
            <input type="text" id="acct-in-article" placeholder="ex : dinol, javel..." value="${editItem ? editItem.article : ''}" required>
          </div>
        </div>
        <div class="form-grid-admin" style="margin-top: 14px;">
          <div class="form-group-admin">
            <label for="acct-in-qty">Quantité</label>
            <input type="number" step="0.1" id="acct-in-qty" value="${editItem ? editItem.quantity : ''}" required>
          </div>
          <div class="form-group-admin">
            <label for="acct-in-unitval">Valeur Unitaire (TND)</label>
            <input type="number" step="0.1" id="acct-in-unitval" value="${editItem ? editItem.unitValue : ''}" required>
          </div>
        </div>
      `;
    } else if (sheetType === 'sahloul_jfs') {
      fieldsContainer.innerHTML = `
        <div class="form-group-admin">
          <label for="acct-in-article">Article Supply SAHLOUL</label>
          <input type="text" id="acct-in-article" placeholder="ex : a1, osk 50, jumbo, savon main, goble..." value="${editItem ? editItem.article : ''}" required>
        </div>
        <div class="form-grid-admin" style="margin-top: 14px;">
          <div class="form-group-admin">
            <label for="acct-in-qty">Quantité</label>
            <input type="number" step="0.1" id="acct-in-qty" value="${editItem ? editItem.quantity : ''}" required>
          </div>
          <div class="form-group-admin">
            <label for="acct-in-unitval">Valeur Unitaire (TND)</label>
            <input type="number" step="0.1" id="acct-in-unitval" value="${editItem ? editItem.unitValue : ''}" required>
          </div>
        </div>
      `;
    }

    // Function to calculate and update modal live preview
    const updatePreviewCalc = () => {
      let total = 0;
      if (sheetType === 'poulet_viandes') {
        const cQ = parseFloat(document.getElementById('acct-cuisse-qty')?.value || 0);
        const cV = parseFloat(document.getElementById('acct-cuisse-val')?.value || 0);
        const bQ = parseFloat(document.getElementById('acct-blanc-qty')?.value || 0);
        const bV = parseFloat(document.getElementById('acct-blanc-val')?.value || 0);
        const eQ = parseFloat(document.getElementById('acct-esc-qty')?.value || 0);
        const eV = parseFloat(document.getElementById('acct-esc-val')?.value || 0);
        const ccQ = parseFloat(document.getElementById('acct-ccomp-qty')?.value || 0);
        const ccV = parseFloat(document.getElementById('acct-ccomp-val')?.value || 0);
        const oQ = parseFloat(document.getElementById('acct-oeuf-qty')?.value || 0);
        const oV = parseFloat(document.getElementById('acct-oeuf-val')?.value || 0);
        total = (cQ * cV) + (bQ * bV) + (eQ * eV) + (ccQ * ccV) + (oQ * oV);
      } else {
        const q = parseFloat(document.getElementById('acct-in-qty')?.value || 0);
        const v = parseFloat(document.getElementById('acct-in-unitval')?.value || 0);
        total = q * v;
      }
      if (previewTotalEl) previewTotalEl.textContent = `Total : ${total.toFixed(2)} TND`;
    };

    fieldsContainer.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', updatePreviewCalc);
    });
    updatePreviewCalc();

    modal.classList.add('show');
  }

  // ── Modal Form Submit & Close Handlers ──
  document.getElementById('btn-close-acct-modal')?.addEventListener('click', () => {
    document.getElementById('accounting-sheet-modal')?.classList.remove('show');
  });

  document.getElementById('btn-cancel-acct-modal')?.addEventListener('click', () => {
    document.getElementById('accounting-sheet-modal')?.classList.remove('show');
  });

  document.getElementById('acct-sheet-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('acct-form-id').value;
    const sheetType = document.getElementById('acct-form-sheet-type').value;

    let payload = { sheetType: sheetType };
    if (id) payload.id = id;

    if (sheetType === 'poulet_viandes') {
      const date = document.getElementById('acct-in-date').value;
      const cQ = parseFloat(document.getElementById('acct-cuisse-qty').value || 0);
      const cV = parseFloat(document.getElementById('acct-cuisse-val').value || 0);
      const bQ = parseFloat(document.getElementById('acct-blanc-qty').value || 0);
      const bV = parseFloat(document.getElementById('acct-blanc-val').value || 0);
      const eQ = parseFloat(document.getElementById('acct-esc-qty').value || 0);
      const eV = parseFloat(document.getElementById('acct-esc-val').value || 0);
      const ccQ = parseFloat(document.getElementById('acct-ccomp-qty').value || 0);
      const ccV = parseFloat(document.getElementById('acct-ccomp-val').value || 0);
      const oQ = parseFloat(document.getElementById('acct-oeuf-qty').value || 0);
      const oV = parseFloat(document.getElementById('acct-oeuf-val').value || 0);

      payload = {
        ...payload,
        date: date,
        cuisseQty: cQ, cuisseVal: cV, cuisseTot: (cQ * cV),
        blancQty: bQ, blancVal: bV, blancTot: (bQ * bV),
        escalopeQty: eQ, escalopeVal: eV, escalopeTot: (eQ * eV),
        cuisseCompQty: ccQ, cuisseCompVal: ccV, cuisseCompTot: (ccQ * ccV),
        oeufQty: oQ, oeufVal: oV, oeufTot: (oQ * oV)
      };
    } else {
      const date = document.getElementById('acct-in-date')?.value || '';
      const article = document.getElementById('acct-in-article')?.value || '';
      const q = parseFloat(document.getElementById('acct-in-qty').value || 0);
      const v = parseFloat(document.getElementById('acct-in-unitval').value || 0);
      payload = {
        ...payload,
        date: date,
        article: article,
        quantity: q,
        unitValue: v,
        total: (q * v)
      };
    }

    if (id) {
      await BabkeDB.updateAccountingSheetItem(id, payload);
      showToast("Ligne comptable mise à jour avec succès");
    } else {
      await BabkeDB.addAccountingSheetItem(payload);
      showToast("Nouvelle ligne comptable enregistrée avec succès");
    }

    document.getElementById('accounting-sheet-modal')?.classList.remove('show');
    renderComptabilitePanel();
  });

  // ── CSV Exporter Helpers for Accounting Sheets ──
  function exportActiveSheetCsv(subTab, sheets) {
    if (subTab === 'poulet_viandes') {
      const headers = ["Date", "Cuisse Qty (kg)", "Cuisse Prix (TND)", "Cuisse Total (TND)", "Blanc Qty (kg)", "Blanc Prix (TND)", "Blanc Total (TND)", "Escalope Qty (kg)", "Escalope Prix (TND)", "Escalope Total (TND)", "Cuisse Complet Qty", "Cuisse Complet Prix", "Cuisse Complet Total", "Oeuf Qty", "Oeuf Prix"];
      const rows = (sheets.poulet_viandes || []).map(r => [r.date, r.cuisseQty, r.cuisseVal, r.cuisseTot, r.blancQty, r.blancVal, r.blancTot, r.escalopeQty, r.escalopeVal, r.escalopeTot, r.cuisseCompQty, r.cuisseCompVal, r.cuisseCompTot, r.oeufQty, r.oeufVal]);
      exportToCsv(`Babke_Comptabilite_Poulet_Viandes_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
    } else if (subTab === 'frits') {
      const headers = ["Date", "Quantite", "Valeur Unitaire (TND)", "Total Depense (TND)"];
      const rows = (sheets.frits || []).map(r => [r.date, r.quantity, r.unitValue, r.total || (r.quantity * r.unitValue)]);
      exportToCsv(`Babke_Comptabilite_Frits_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
    } else if (subTab === 'nettoyage') {
      const headers = ["Date", "Article", "Quantite", "Valeur Unitaire (TND)", "Total (TND)"];
      const rows = (sheets.nettoyage || []).map(r => [r.date, r.article, r.quantity, r.unitValue, r.total || (r.quantity * r.unitValue)]);
      exportToCsv(`Babke_Comptabilite_Produits_Nettoyage_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
    } else if (subTab === 'sahloul_jfs') {
      const headers = ["Article", "Quantite", "Valeur Unitaire (TND)", "Total (TND)"];
      const rows = (sheets.sahloul_jfs || []).map(r => [r.article, r.quantity, r.unitValue, r.total || (r.quantity * r.unitValue)]);
      exportToCsv(`Babke_Comptabilite_SAHLOUL_JFS_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
    }
    showToast("📥 Feuille Excel exportée avec succès !");
  }

  function exportMasterAccountingWorkbookCsv(sheets) {
    const headers = ["Type Feuille", "Date", "Article / Coupe", "Quantite", "Valeur Unitaire (TND)", "Total (TND)"];
    const rows = [];

    (sheets.poulet_viandes || []).forEach(r => {
      if (r.cuisseTot) rows.push(["POULET & VIANDES", r.date, "Cuisse", r.cuisseQty, r.cuisseVal, r.cuisseTot]);
      if (r.blancTot) rows.push(["POULET & VIANDES", r.date, "Blanc", r.blancQty, r.blancVal, r.blancTot]);
      if (r.escalopeTot) rows.push(["POULET & VIANDES", r.date, "Escalope", r.escalopeQty, r.escalopeVal, r.escalopeTot]);
      if (r.cuisseCompTot) rows.push(["POULET & VIANDES", r.date, "Cuisse Complet", r.cuisseCompQty, r.cuisseCompVal, r.cuisseCompTot]);
      if (r.oeufQty) rows.push(["POULET & VIANDES", r.date, "Oeuf", r.oeufQty, r.oeufVal, (r.oeufQty * r.oeufVal)]);
    });

    (sheets.frits || []).forEach(r => {
      rows.push(["FRITS", r.date, "Frits", r.quantity, r.unitValue, r.total || (r.quantity * r.unitValue)]);
    });

    (sheets.nettoyage || []).forEach(r => {
      rows.push(["PRODUITS NETTOYAGE", r.date, r.article, r.quantity, r.unitValue, r.total || (r.quantity * r.unitValue)]);
    });

    (sheets.sahloul_jfs || []).forEach(r => {
      rows.push(["SAHLOUL JFS", "N/A", r.article, r.quantity, r.unitValue, r.total || (r.quantity * r.unitValue)]);
    });

    exportToCsv(`Babke_Grand_Livre_Comptable_Master_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
    showToast("📂 Grand Livre Comptable Master exporté avec succès !");
  }


  // B. MENU MANAGEMENT PANEL
  function renderMenuPanel() {
    const contentArea = document.getElementById('admin-body-content');
    if (!contentArea) return;

    const menuItems = BabkeDB.getMenu();

    const canEditOrDeleteMenu = (userRole === 'admin' || userRole === 'sm_manager');

    contentArea.innerHTML = `
      <div class="admin-card">
        <div class="admin-card-header" style="margin-bottom: 16px;">
          <h3>Catalogue du Menu (${menuItems.length} articles)</h3>
          ${canEditOrDeleteMenu ? `
            <button class="btn-admin-primary" id="btn-add-new-menu-item">
              <span>+ Add New Item</span>
            </button>
          ` : `
            <span style="font-size:0.8rem; color:var(--text-admin-muted); font-weight:700;">Mode Caissier: Gestion Disponibilité Uniquement</span>
          `}
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
                <th>Status (Disponibilité)</th>
                <th>Tags</th>
                ${canEditOrDeleteMenu ? `<th>Actions</th>` : ''}
              </tr>
            </thead>
            <tbody>
              <!-- Dynamic Rows Injected Here -->
            </tbody>
          </table>
        </div>
      </div>

      ${canEditOrDeleteMenu ? `
        <!-- Garniture & Cheese Extra Pricing Standards Card -->
        <div class="admin-card" style="margin-top: 24px;">
          <div class="admin-card-header" style="margin-bottom: 12px;">
            <h3 style="display:flex; align-items:center; gap:8px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13c0-1.1.9-2 2-2h12l2 8H2z"/><path d="M20 11 4.12 4.23"/><path d="M4 13V7.37"/></svg>
              Garniture & Cheese Extra Standards (Menu Manager Config)
            </h3>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-admin-muted); margin-bottom: 16px;">
            Set standard extra prices for sandwich options & cheeses. Customers customizing their order on the storefront will be charged these exact amounts.
          </p>
          <form id="customization-prices-form" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; align-items: end;">
            <div class="admin-input-group">
              <label for="cfg-price-cheddar">Cheddar Cheese Extra (TND)</label>
              <input type="number" step="0.5" min="0" id="cfg-price-cheddar" class="admin-input" value="${(BabkeDB.getContent().customizationPrices || {}).cheddarPrice !== undefined ? (BabkeDB.getContent().customizationPrices || {}).cheddarPrice : 2.0}" required>
            </div>
            <div class="admin-input-group">
              <label for="cfg-price-mozza">Mozzarella Cheese Extra (TND)</label>
              <input type="number" step="0.5" min="0" id="cfg-price-mozza" class="admin-input" value="${(BabkeDB.getContent().customizationPrices || {}).mozzarellaPrice !== undefined ? (BabkeDB.getContent().customizationPrices || {}).mozzarellaPrice : 5.0}" required>
            </div>
            <div class="admin-input-group">
              <label for="cfg-price-fries">Extra Fries (TND)</label>
              <input type="number" step="0.5" min="0" id="cfg-price-fries" class="admin-input" value="${(BabkeDB.getContent().customizationPrices || {}).friesPrice !== undefined ? (BabkeDB.getContent().customizationPrices || {}).friesPrice : 2.0}" required>
            </div>
            <div class="admin-input-group">
              <button type="submit" class="btn-admin-primary" id="btn-save-custom-prices" style="width: 100%;">
                <span>Save Option Standards</span>
              </button>
            </div>
          </form>
        </div>
      ` : ''}
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
            <td colspan="${canEditOrDeleteMenu ? 7 : 6}" style="padding: 0;">
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
        const isAvail = item.available !== false;

        const availBadge = isAvail 
          ? `<button class="btn-toggle-availability" data-id="${item.id}" data-available="true" title="Cliquer pour marquer Indisponible / Épuisé" style="background:rgba(34,197,94,0.15); color:#22c55e; border:1px solid rgba(34,197,94,0.3); padding:6px 14px; border-radius:20px; font-weight:800; font-size:0.8rem; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:transform 0.15s ease;"><span>🟢 Disponible</span></button>`
          : `<button class="btn-toggle-availability" data-id="${item.id}" data-available="false" title="Cliquer pour réactiver (Disponible)" style="background:rgba(239,68,68,0.15); color:#ef4444; border:1px solid rgba(239,68,68,0.3); padding:6px 14px; border-radius:20px; font-weight:800; font-size:0.8rem; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:transform 0.15s ease;"><span>🔴 Indisponible (Épuisé)</span></button>`;

        const actionColHtml = canEditOrDeleteMenu ? `
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
        ` : '';

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
            <td>${availBadge}</td>
            <td>${tagsBadgeHtml}</td>
            ${actionColHtml}
          </tr>
        `;
      }).join('');

      // Bind availability toggle actions
      tbody.querySelectorAll('.btn-toggle-availability').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.currentTarget.dataset.id;
          const currentAvail = e.currentTarget.dataset.available === 'true';
          const nextAvail = !currentAvail;
          
          btn.disabled = true;
          try {
            await BabkeDB.toggleMenuAvailability(id, nextAvail);
            showToast(nextAvail ? "🟢 Article marqué comme DISPONIBLE !" : "🔴 Article marqué comme INDISPONIBLE (Épuisé).");
          } catch (err) {
            console.warn("Availability update warning:", err);
            showToast(nextAvail ? "🟢 Article marqué comme DISPONIBLE !" : "🔴 Article marqué comme INDISPONIBLE (Épuisé).");
          } finally {
            renderMenuPanel();
          }
        });
      });

      // Bind row actions only if authorized
      if (canEditOrDeleteMenu) {
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
      }
    };

    searchInput.addEventListener('input', filterAndRenderRows);
    categoryFilter.addEventListener('change', filterAndRenderRows);

    // Initial render
    filterAndRenderRows();

    // Bind add button click (if available for user role)
    const addNewBtn = document.getElementById('btn-add-new-menu-item');
    if (addNewBtn) {
      addNewBtn.addEventListener('click', () => openMenuModal());
    }

    // Bind customization prices form submit
    const customPricesForm = document.getElementById('customization-prices-form');
    if (customPricesForm) {
      customPricesForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const cheddarPrice = parseFloat(document.getElementById('cfg-price-cheddar').value) || 0;
        const mozzarellaPrice = parseFloat(document.getElementById('cfg-price-mozza').value) || 0;
        const friesPrice = parseFloat(document.getElementById('cfg-price-fries').value) || 0;

        const content = BabkeDB.getContent() || {};
        content.customizationPrices = {
          cheddarPrice,
          mozzarellaPrice,
          friesPrice
        };

        const submitBtn = document.getElementById('btn-save-custom-prices');
        const origText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.textContent = "Saving...";

        try {
          await BabkeDB.saveContent(content);
          addActivityLog(`Updated customization option standards: Cheddar (+${cheddarPrice} TND), Mozzarella (+${mozzarellaPrice} TND), Fries (+${friesPrice} TND)`);
          showToast("Customization option standards updated successfully!");
        } catch (err) {
          console.error("Error saving customization prices:", err);
          showToast("Failed to save customization standards!");
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = origText;
        }
      });
    }
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
    if (!content.story.heritage.fr) content.story.heritage.fr = content.story.heritage.en || '';
    if (!content.story.title.fr) content.story.title.fr = content.story.title.en || '';
    if (!content.story.p1.fr) content.story.p1.fr = content.story.p1.en || '';
    if (!content.story.p2.fr) content.story.p2.fr = content.story.p2.en || '';
    if (!content.story.p3.fr) content.story.p3.fr = content.story.p3.en || '';

    if (!content.contact.address.fr) content.contact.address.fr = content.contact.address.en || '';
    if (!content.contact.hours.weekday.fr) content.contact.hours.weekday.fr = content.contact.hours.weekday.en || '';
    if (!content.contact.hours.weekend.fr) content.contact.hours.weekend.fr = content.contact.hours.weekend.en || '';

    contentArea.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h3 style="font-size: 1.3rem; font-weight: 900; margin-bottom: 4px;">🌐 Éditeur Multilingue du Site Web</h3>
          <p style="font-size: 0.88rem; color: var(--text-admin-muted);">Modifiez les textes, titres et histoires en Anglais (EN), Français (FR) et Tunisien (TN).</p>
        </div>
        
        <!-- Language Selector Tabs -->
        <div class="lang-tabs-container" style="display: flex; background: rgba(255, 255, 255, 0.04); padding: 4px; border-radius: 12px; border: 1px solid var(--border-admin);">
          <button type="button" class="lang-tab-btn active" data-lang="all" style="padding: 8px 16px; border-radius: 8px; border: none; font-weight: 800; font-size: 0.82rem; cursor: pointer; background: var(--accent-admin); color: #fff;">Tous (EN / FR / TN)</button>
          <button type="button" class="lang-tab-btn" data-lang="en" style="padding: 8px 16px; border-radius: 8px; border: none; font-weight: 800; font-size: 0.82rem; cursor: pointer; background: transparent; color: var(--text-admin-muted);">🇬🇧 English</button>
          <button type="button" class="lang-tab-btn" data-lang="fr" style="padding: 8px 16px; border-radius: 8px; border: none; font-weight: 800; font-size: 0.82rem; cursor: pointer; background: transparent; color: var(--text-admin-muted);">🇫🇷 Français</button>
          <button type="button" class="lang-tab-btn" data-lang="tn" style="padding: 8px 16px; border-radius: 8px; border: none; font-weight: 800; font-size: 0.82rem; cursor: pointer; background: transparent; color: var(--text-admin-muted);">🇹🇳 تـونسي</button>
        </div>
      </div>

      <form id="website-content-form">
        <!-- HERO SECTION -->
        <div class="admin-card">
          <div class="admin-card-header">
            <h3>Hero Section Parameters</h3>
          </div>
          
          <div class="lang-edit-section lang-block-en">
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

          <div class="lang-edit-section lang-block-fr">
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

          <div class="lang-edit-section lang-block-tn">
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

        <!-- OUR STORY SECTION -->
        <div class="admin-card">
          <div class="admin-card-header">
            <h3>Restaurant Heritage Story (Our Story)</h3>
          </div>
          
          <div class="lang-edit-section lang-block-en">
            <div class="lang-section-header">Story Details - English (EN)</div>
            <div class="form-group-admin" style="margin-bottom:12px;">
              <label for="story-heritage-en">Badge (EN)</label>
              <input type="text" id="story-heritage-en" value="${content.story.heritage.en || ''}">
            </div>
            <div class="form-group-admin" style="margin-bottom:12px;">
              <label for="story-title-en">Section Title (EN)</label>
              <input type="text" id="story-title-en" value="${content.story.title.en || ''}">
            </div>
            <div class="form-group-admin" style="margin-bottom:12px;">
              <label for="story-p1-en">Paragraph 1 (EN)</label>
              <textarea id="story-p1-en" rows="2">${content.story.p1.en || ''}</textarea>
            </div>
            <div class="form-group-admin" style="margin-bottom:12px;">
              <label for="story-p2-en">Paragraph 2 (EN)</label>
              <textarea id="story-p2-en" rows="3">${content.story.p2.en || ''}</textarea>
            </div>
            <div class="form-group-admin">
              <label for="story-p3-en">Paragraph 3 (EN)</label>
              <textarea id="story-p3-en" rows="2">${content.story.p3.en || ''}</textarea>
            </div>
          </div>

          <div class="lang-edit-section lang-block-fr">
            <div class="lang-section-header">Story Details - Français (FR)</div>
            <div class="form-group-admin" style="margin-bottom:12px;">
              <label for="story-heritage-fr">Badge (FR)</label>
              <input type="text" id="story-heritage-fr" value="${content.story.heritage.fr || ''}">
            </div>
            <div class="form-group-admin" style="margin-bottom:12px;">
              <label for="story-title-fr">Section Title (FR)</label>
              <input type="text" id="story-title-fr" value="${content.story.title.fr || ''}">
            </div>
            <div class="form-group-admin" style="margin-bottom:12px;">
              <label for="story-p1-fr">Paragraph 1 (FR)</label>
              <textarea id="story-p1-fr" rows="2">${content.story.p1.fr || ''}</textarea>
            </div>
            <div class="form-group-admin" style="margin-bottom:12px;">
              <label for="story-p2-fr">Paragraph 2 (FR)</label>
              <textarea id="story-p2-fr" rows="3">${content.story.p2.fr || ''}</textarea>
            </div>
            <div class="form-group-admin">
              <label for="story-p3-fr">Paragraph 3 (FR)</label>
              <textarea id="story-p3-fr" rows="2">${content.story.p3.fr || ''}</textarea>
            </div>
          </div>
          
          <div class="lang-edit-section lang-block-tn">
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

        <!-- CONTACT DETAILS & HOURS -->
        <div class="admin-card">
          <div class="admin-card-header">
            <h3>Contact Details & Hours</h3>
          </div>
          
          <div class="form-group-admin" style="margin-bottom: 16px;">
            <label for="contact-phone">Phone Number (Global)</label>
            <input type="text" id="contact-phone" value="${content.contact.phone || ''}">
          </div>

          <div class="form-grid-admin" style="margin-bottom:16px;">
            <div class="form-group-admin lang-block-en">
              <label for="contact-address-en">Address (EN)</label>
              <input type="text" id="contact-address-en" value="${content.contact.address.en || ''}">
            </div>
            <div class="form-group-admin lang-block-fr">
              <label for="contact-address-fr">Address (FR)</label>
              <input type="text" id="contact-address-fr" value="${content.contact.address.fr || ''}">
            </div>
            <div class="form-group-admin lang-block-tn">
              <label for="contact-address-tn" style="display:block; text-align:right;">Address (TN)</label>
              <input type="text" id="contact-address-tn" value="${content.contact.address.tn || ''}" dir="rtl">
            </div>
          </div>
          
          <div class="lang-edit-section">
            <div class="lang-section-header">Operating Hours</div>
            <div class="form-grid-admin">
              <div class="form-group-admin lang-block-en">
                <label for="hours-weekday-en">Weekday hours (EN)</label>
                <input type="text" id="hours-weekday-en" value="${content.contact.hours.weekday.en || ''}">
              </div>
              <div class="form-group-admin lang-block-en">
                <label for="hours-weekend-en">Weekend hours (EN)</label>
                <input type="text" id="hours-weekend-en" value="${content.contact.hours.weekend.en || ''}">
              </div>

              <div class="form-group-admin lang-block-fr">
                <label for="hours-weekday-fr">Weekday hours (FR)</label>
                <input type="text" id="hours-weekday-fr" value="${content.contact.hours.weekday.fr || ''}">
              </div>
              <div class="form-group-admin lang-block-fr">
                <label for="hours-weekend-fr">Weekend hours (FR)</label>
                <input type="text" id="hours-weekend-fr" value="${content.contact.hours.weekend.fr || ''}">
              </div>

              <div class="form-group-admin lang-block-tn">
                <label for="hours-weekday-tn" style="display:block; text-align:right;">Weekday hours (TN)</label>
                <input type="text" id="hours-weekday-tn" value="${content.contact.hours.weekday.tn || ''}" dir="rtl">
              </div>
              <div class="form-group-admin lang-block-tn">
                <label for="hours-weekend-tn" style="display:block; text-align:right;">Weekend hours (TN)</label>
                <input type="text" id="hours-weekend-tn" value="${content.contact.hours.weekend.tn || ''}" dir="rtl">
              </div>
            </div>
          </div>
        </div>

        <!-- SOCIALS & DELIVERY LINKS -->
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

    // Tab Switch Listener for Languages
    document.querySelectorAll('.lang-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.lang-tab-btn').forEach(b => {
          b.style.background = 'transparent';
          b.style.color = 'var(--text-admin-muted)';
          b.classList.remove('active');
        });
        btn.style.background = 'var(--accent-admin)';
        btn.style.color = '#fff';
        btn.classList.add('active');

        const selectedLang = btn.dataset.lang;
        ['en', 'fr', 'tn'].forEach(l => {
          const blocks = document.querySelectorAll(`.lang-block-${l}`);
          blocks.forEach(blk => {
            if (selectedLang === 'all' || selectedLang === l) {
              blk.style.display = 'block';
            } else {
              blk.style.display = 'none';
            }
          });
        });
      });
    });

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

    content.story.heritage.fr = document.getElementById('story-heritage-fr').value.trim();
    content.story.title.fr = document.getElementById('story-title-fr').value.trim();
    content.story.p1.fr = document.getElementById('story-p1-fr').value.trim();
    content.story.p2.fr = document.getElementById('story-p2-fr').value.trim();
    content.story.p3.fr = document.getElementById('story-p3-fr').value.trim();

    content.story.heritage.tn = document.getElementById('story-heritage-tn').value.trim();
    content.story.title.tn = document.getElementById('story-title-tn').value.trim();
    content.story.p1.tn = document.getElementById('story-p1-tn').value.trim();
    content.story.p2.tn = document.getElementById('story-p2-tn').value.trim();
    content.story.p3.tn = document.getElementById('story-p3-tn').value.trim();

    // Contact
    content.contact.phone = document.getElementById('contact-phone').value.trim();
    content.contact.address.en = document.getElementById('contact-address-en').value.trim();
    content.contact.address.fr = document.getElementById('contact-address-fr').value.trim();
    content.contact.address.tn = document.getElementById('contact-address-tn').value.trim();

    // Hours
    content.contact.hours.weekday.en = document.getElementById('hours-weekday-en').value.trim();
    content.contact.hours.weekend.en = document.getElementById('hours-weekend-en').value.trim();
    content.contact.hours.weekday.fr = document.getElementById('hours-weekday-fr').value.trim();
    content.contact.hours.weekend.fr = document.getElementById('hours-weekend-fr').value.trim();
    content.contact.hours.weekday.tn = document.getElementById('hours-weekday-tn').value.trim();
    content.contact.hours.weekend.tn = document.getElementById('hours-weekend-tn').value.trim();

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

    showToast("🌐 Contenu du site web sauvegardé avec succès !");
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
      const getTitle = (e) => {
        if (!e.title) return 'No title';
        if (typeof e.title === 'string') return e.title;
        return e.title.fr || e.title.en || e.title.tn || 'No title';
      };
      const getDuration = (e) => {
        if (!e.duration) return '';
        if (typeof e.duration === 'string') return e.duration;
        return e.duration.fr || e.duration.en || e.duration.tn || '';
      };
      const getLocation = (e) => {
        if (!e.location) return '';
        if (typeof e.location === 'string') return e.location;
        return e.location.fr || e.location.en || e.location.tn || '';
      };

      const titleDisplay = getTitle(event);
      const durationDisplay = getDuration(event);
      const locationDisplay = getLocation(event);

      const statusVal = (event.status || 'published').toLowerCase();
      let badgeClass = 'draft';
      let statusText = 'BROUILLON';

      if (statusVal === 'published' || statusVal === 'publié') {
        badgeClass = 'published';
        statusText = 'PUBLIÉ';
      } else if (statusVal === 'cancelled' || statusVal === 'annulé') {
        badgeClass = 'cancelled';
        statusText = 'ANNULÉ';
      } else if (statusVal === 'archived' || statusVal === 'archivé') {
        badgeClass = 'archived';
        statusText = 'ARCHIVÉ';
      }

      return `
        <tr>
          <td>
            <img class="table-img" src="${getAdminImageSrc(event.image)}" onerror="this.onerror=null; this.src='${getAdminImageSrc(event.fallbackImage)}';" alt="${titleDisplay}">
          </td>
          <td>
            <strong style="display:block; font-size:0.95rem; color:var(--text-admin-primary);">${titleDisplay}</strong>
            <span style="color:var(--text-admin-muted); font-size:0.75rem;">ID: ${event.id}</span>
          </td>
          <td>
            <strong style="display:block; font-size:0.88rem;">${event.date}</strong>
            <span style="color:var(--text-admin-secondary); font-size:0.75rem;">${durationDisplay}</span>
          </td>
          <td>${locationDisplay}</td>
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
        
        let normalizedStatus = (event.status || 'published').toLowerCase().trim();
        if (normalizedStatus === 'publié' || normalizedStatus === 'active') normalizedStatus = 'published';
        if (normalizedStatus === 'brouillon') normalizedStatus = 'draft';
        if (normalizedStatus === 'annulé') normalizedStatus = 'cancelled';
        if (normalizedStatus === 'archivé') normalizedStatus = 'archived';
        
        const statusSelect = document.getElementById('event-form-status');
        if (statusSelect) statusSelect.value = normalizedStatus;
        
        // base64/image preview
        eventBase64Input.value = event.image;
        eventPreviewBox.innerHTML = `<img src="${getAdminImageSrc(event.image)}" onerror="this.onerror=null; this.src='${getAdminImageSrc(event.fallbackImage)}';">`;

        // Localized fields with null safety
        const setVal = (id, val) => {
          const el = document.getElementById(id);
          if (el) el.value = val || '';
        };

        const getVal = (id) => {
          const el = document.getElementById(id);
          return el ? el.value.trim() : '';
        };

        const titleObj = (typeof event.title === 'object' && event.title !== null) ? event.title : { en: event.title || '' };
        const durationObj = (typeof event.duration === 'object' && event.duration !== null) ? event.duration : { en: event.duration || '' };
        const locationObj = (typeof event.location === 'object' && event.location !== null) ? event.location : { en: event.location || '' };
        const descObj = (typeof event.description === 'object' && event.description !== null) ? event.description : { en: event.description || '' };

        setVal('event-form-title-en', titleObj.en);
        setVal('event-form-duration-en', durationObj.en);
        setVal('event-form-location-en', locationObj.en);
        setVal('event-form-desc-en', descObj.en);

        setVal('event-form-title-fr', titleObj.fr || titleObj.en);
        setVal('event-form-duration-fr', durationObj.fr || durationObj.en);
        setVal('event-form-location-fr', locationObj.fr || locationObj.en);
        setVal('event-form-desc-fr', descObj.fr || descObj.en);

        setVal('event-form-title-tn', titleObj.tn || titleObj.en);
        setVal('event-form-duration-tn', durationObj.tn || durationObj.en);
        setVal('event-form-location-tn', locationObj.tn || locationObj.en);
        setVal('event-form-desc-tn', descObj.tn || descObj.en);
      }
    } else {
      if (modalTitle) modalTitle.textContent = "Add Event";
      const idEl = document.getElementById('event-form-id');
      const statusEl = document.getElementById('event-form-status');
      if (idEl) idEl.value = '';
      if (statusEl) statusEl.value = 'published';
    }

    if (eventModal) eventModal.classList.add('open');
  };

  const closeEventModal = () => {
    if (eventModal) eventModal.classList.remove('open');
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
        if (eventBase64Input) eventBase64Input.value = compressedBase64;
        if (eventPreviewBox) eventPreviewBox.innerHTML = `<img src="${compressedBase64}">`;
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
      const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
      };

      const id = getVal('event-form-id');
      const date = getVal('event-form-date');
      const status = getVal('event-form-status') || 'published';
      const base64Image = (eventBase64Input ? eventBase64Input.value : '').trim();

      const rawTitleFr = getVal('event-form-title-fr');
      const rawTitleEn = getVal('event-form-title-en');
      const rawTitleTn = getVal('event-form-title-tn');
      const titleVal = rawTitleFr || rawTitleEn || rawTitleTn || 'Événement Babke';

      const rawDurationFr = getVal('event-form-duration-fr');
      const rawDurationEn = getVal('event-form-duration-en');
      const rawDurationTn = getVal('event-form-duration-tn');
      const durationVal = rawDurationFr || rawDurationEn || rawDurationTn || '';

      const rawLocationFr = getVal('event-form-location-fr');
      const rawLocationEn = getVal('event-form-location-en');
      const rawLocationTn = getVal('event-form-location-tn');
      const locationVal = rawLocationFr || rawLocationEn || rawLocationTn || '';

      const rawDescFr = getVal('event-form-desc-fr');
      const rawDescEn = getVal('event-form-desc-en');
      const rawDescTn = getVal('event-form-desc-tn');
      const descVal = rawDescFr || rawDescEn || rawDescTn || '';

      const eventData = {
        id: id || "evt-" + Date.now(),
        image: base64Image || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80",
        fallbackImage: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80",
        date: date,
        status: status,
        title: { en: rawTitleEn || titleVal, fr: rawTitleFr || titleVal, tn: rawTitleTn || titleVal },
        duration: { en: rawDurationEn || durationVal, fr: rawDurationFr || durationVal, tn: rawDurationTn || durationVal },
        location: { en: rawLocationEn || locationVal, fr: rawLocationFr || locationVal, tn: rawLocationTn || locationVal },
        description: { en: rawDescEn || descVal, fr: rawDescFr || descVal, tn: rawDescTn || descVal }
      };

      const submitBtn = eventForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Saving...";

      try {
        await BabkeDB.saveEventItem(eventData);
        addActivityLog(`Event '${titleVal}' ${id ? 'updated' : 'created'}`);
        showToast(`Événement ${id ? 'mis à jour' : 'créé'} avec succès!`);
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

    const canExportLeftovers = (userRole === 'comptable' || userRole === 'admin');

    contentArea.innerHTML = `
      ${analyticsHtml}

      <!-- Leftovers Log Form (Full Width) -->
      <div class="admin-card glass-card" style="margin-bottom: 24px;">
        <div class="admin-card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <h3>🥗 Saisie des Restes de Fin de Journée</h3>
          ${canExportLeftovers ? `
            <button type="button" class="btn-excel-export" id="btn-panel-export-leftovers" title="Télécharger le fichier Excel des restes de fin de journée">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>📊 Exporter les Restes (.csv)</span>
            </button>
          ` : ''}
        </div>
        <form id="leftovers-log-form" style="display:flex; flex-direction:column; gap:16px; padding-top:15px;">
          <div class="form-grid-admin" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-bottom: 0;">
            <div class="form-group-admin">
              <label for="left-form-date">Date</label>
              <input type="date" id="left-form-date" value="${todayStr}" required>
            </div>
            
            <div class="form-group-admin">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <label for="left-form-item">Produit / Viande Reste</label>
                <button type="button" class="btn-inline-add-pt" data-target="left-form-item" style="background: none; border: none; color: var(--accent-admin); font-size: 0.76rem; font-weight: 700; cursor: pointer; text-decoration: underline;">+ Nouveau Produit</button>
              </div>
              <select id="left-form-item" required></select>
            </div>

            <div class="form-grid-admin" style="margin-bottom: 0; gap: 12px; grid-template-columns: 1.2fr 1fr;">
              <div class="form-group-admin">
                <label for="left-form-qty">Quantité Reste</label>
                <input type="number" id="left-form-qty" step="0.1" min="0.1" placeholder="ex : 3.5" required>
              </div>
              <div class="form-group-admin">
                <label for="left-form-unit">Unité</label>
                <select id="left-form-unit" required>
                  <option value="kg">Kilos (kg)</option>
                  <option value="brochettes">Brochettes</option>
                  <option value="pièces">Pièces / Unités</option>
                  <option value="paquets">Paquets / Portions</option>
                  <option value="litres">Litres (L)</option>
                  <option value="canettes">Canettes</option>
                  <option value="bouteilles">Bouteilles</option>
                  <option value="sacs">Sacs</option>
                </select>
              </div>
            </div>
          </div>

          <button type="submit" class="btn-admin-primary" style="align-self: flex-end; padding: 12px 24px; min-width: 160px; margin-top: 10px;">Enregistrer le Reste</button>
        </form>
      </div>

      <!-- Leftovers Log History (Full Width) -->
      <div class="admin-card glass-card">
        <div class="admin-card-header" style="margin-bottom: 15px;">
          <h3>📋 Historique des Restes d'Invendus</h3>
        </div>
        <div class="leftovers-grouped-container" style="max-height: 480px; overflow-y: auto; padding-right: 5px;">
          ${datesHtml}
      </div>
    `;

    // Populate Product Dropdown dynamically from physical sheet product types
    populateProductDropdown('left-form-item');

    // Auto-sync default unit on product selection
    const leftItemSelect = document.getElementById('left-form-item');
    const leftUnitSelect = document.getElementById('left-form-unit');
    if (leftItemSelect && leftUnitSelect) {
      const syncLeftoverUnit = () => {
        const selectedName = leftItemSelect.value;
        const types = BabkeDB.getProductTypes();
        const matched = types.find(t => t.name === selectedName);
        if (matched && matched.defaultUnit) {
          const matchedUnit = matched.defaultUnit;
          const unitOpt = Array.from(leftUnitSelect.options).find(o => o.value === matchedUnit || o.value.includes(matchedUnit));
          if (unitOpt) {
            leftUnitSelect.value = unitOpt.value;
          }
        }
      };
      leftItemSelect.addEventListener('change', syncLeftoverUnit);
      syncLeftoverUnit();
    }

    // Bind Excel Export listener for Leftovers
    const exportLeftoversBtn = document.getElementById('btn-panel-export-leftovers');
    if (exportLeftoversBtn) {
      exportLeftoversBtn.addEventListener('click', () => {
        const leftovers = BabkeDB.getLeftovers();
        const headers = ["Date", "Produit Reste", "Quantite Invendue", "Unite", "Saisi Par"];
        const rows = leftovers.map(l => [
          l.date,
          l.item,
          l.quantity,
          l.unit,
          l.recordedBy || 'worker'
        ]);
        exportToCsv(`Babke_Restes_Invendus_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
        showToast("📊 Exportation Excel des Restes générée avec succès !", "success");
      });
    }

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

  // 6. EXPENSES MANAGEMENT PANEL
  let currentExpenseCategoryFilter = 'all';
  let currentExpenseSearchQuery = '';

  function renderExpensesPanel() {
    const container = document.getElementById('admin-body-content');
    if (!container) return;

    const canExportExpenses = (userRole === 'comptable' || userRole === 'admin');
    const expenses = BabkeDB.getExpenses();
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM

    // 1. Calculate KPI Metrics
    const todayExpenses = expenses
      .filter(e => e.date === todayStr)
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

    const monthExpenses = expenses
      .filter(e => e.date && e.date.startsWith(currentMonthStr))
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

    // Primary Spending Category
    const categoryTotals = {};
    expenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + (parseFloat(e.amount) || 0);
    });
    let topCategory = 'None';
    let topCategoryAmt = 0;
    Object.keys(categoryTotals).forEach(cat => {
      if (categoryTotals[cat] > topCategoryAmt) {
        topCategoryAmt = categoryTotals[cat];
        topCategory = cat;
      }
    });

    const categoryLabels = {
      'worker_extra': 'Worker Extra',
      'fournisseur': 'Supplier / Fournisseur',
      'ingredients': 'Market & Ingredients',
      'maintenance': 'Maintenance & Utilities',
      'other': 'Other / Misc'
    };

    // Filter list by category and search query
    let filtered = expenses.filter(e => {
      const matchCat = currentExpenseCategoryFilter === 'all' || e.category === currentExpenseCategoryFilter;
      const q = currentExpenseSearchQuery.toLowerCase().trim();
      const matchSearch = !q || (e.description && e.description.toLowerCase().includes(q)) || (e.id && e.id.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });

    let tableRowsHtml = '';
    if (filtered.length === 0) {
      tableRowsHtml = `
        <tr>
          <td colspan="7" style="padding:0;">
            <div class="empty-state-container">
              <div class="empty-state-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><path d="M6 15h2"/><path d="M12 15h6"/></svg>
              </div>
              <h4>Aucune Dépense Trouvée</h4>
              <p>Aucune dépense de caisse ne correspond à vos critères. Enregistrez une dépense ci-dessus.</p>
            </div>
          </td>
        </tr>
      `;
    } else {
      filtered.forEach(item => {
        const catName = categoryLabels[item.category] || item.category;
        const catClass = item.category || 'other';
        const methodLabel = item.paymentMethod === 'cash' ? '💵 Caisse Cash' : (item.paymentMethod === 'card' ? '💳 Carte Bancaire' : '🏛️ Virement');
        const roleClass = item.recordedBy || 'cashier';

        tableRowsHtml += `
          <tr>
            <td><strong style="color: var(--text-admin-primary); font-size: 0.9rem;">${item.date || 'N/A'}</strong></td>
            <td><span class="expense-badge ${catClass}">${catName}</span></td>
            <td style="max-width:320px; word-break:break-word;">
              <span style="font-weight:600; color:var(--text-admin-primary); line-height: 1.4;">${item.description}</span>
            </td>
            <td><span class="expense-amount-tag">${(parseFloat(item.amount) || 0).toFixed(1)} TND</span></td>
            <td>
              <span style="display: inline-flex; align-items: center; gap: 6px; font-size:0.82rem; color:var(--text-admin-secondary); background: rgba(255, 255, 255, 0.03); padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(255, 90, 31, 0.1);">
                ${methodLabel}
              </span>
            </td>
            <td><span class="role-badge-tag ${roleClass}">${item.recordedBy || 'Caissier'}</span></td>
            <td style="text-align:right;">
              <button class="btn-action-delete btn-delete-expense" data-id="${item.id}" title="Supprimer la dépense">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                <span>Supprimer</span>
              </button>
            </td>
          </tr>
        `;
      });
    }

    container.innerHTML = `
      <!-- KPI Stats Section -->
      <div class="dashboard-grid-stats" style="margin-bottom: 24px;">
        <div class="stat-card">
          <div class="stat-card-details">
            <span>Dépenses Aujourd'hui</span>
            <h3>${todayExpenses.toFixed(1)} TND</h3>
            <span class="stat-card-trend neutral">Caisse Journée</span>
          </div>
          <div class="stat-card-visual">
            <div class="stat-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-details">
            <span>Dépenses du Mois</span>
            <h3>${monthExpenses.toFixed(1)} TND</h3>
            <span class="stat-card-trend negative">Total Mensuel</span>
          </div>
          <div class="stat-card-visual">
            <div class="stat-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-details">
            <span>Poste Principal Dépense</span>
            <h3 style="font-size: 1.2rem;">${categoryLabels[topCategory] || 'Aucun'}</h3>
            <span class="stat-card-trend positive">Plus Fort Poste</span>
          </div>
          <div class="stat-card-visual">
            <div class="stat-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-details">
            <span>Nombre de Dépenses</span>
            <h3>${expenses.length}</h3>
            <span class="stat-card-trend positive">Lignes Enregistrées</span>
          </div>
          <div class="stat-card-visual">
            <div class="stat-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Expense Entry Form Card -->
      <div class="admin-card" style="margin-bottom: 24px;">
        <div class="admin-card-header" style="border-bottom: 1px dashed var(--border-admin); padding-bottom: 12px; margin-bottom: 16px;">
          <h3>💳 Saisie d'une Dépense de Caisse</h3>
          <span style="font-size: 0.8rem; color: var(--text-admin-muted);">Enregistrez les sorties de caisse (Extras Ouvrier, Paiements Fournisseurs, Achats Marché, Entretien)</span>
        </div>
        <form id="expense-log-form">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 16px;">
            <div class="form-group-admin" style="margin-bottom: 0;">
              <label for="expense-form-date">Date de Dépense</label>
              <input type="date" id="expense-form-date" value="${todayStr}" required>
            </div>

            <div class="form-group-admin" style="margin-bottom: 0;">
              <label for="expense-form-category">Catégorie</label>
              <select id="expense-form-category" required>
                <option value="worker_extra">👷 Extra Ouvrier (Heures Supp / Prime)</option>
                <option value="fournisseur">🚚 Paiement Fournisseur (Viande, Pain...)</option>
                <option value="ingredients">🛒 Achats Marché & Ingrédients (Légumes, Épices)</option>
                <option value="maintenance">🔧 Entretien & Recharge Charbon / Gaz</option>
                <option value="other">📝 Autres Dépenses de Caisse</option>
              </select>
            </div>

            <div class="form-group-admin" style="margin-bottom: 0;">
              <label for="expense-form-amount">Montant (TND)</label>
              <input type="number" id="expense-form-amount" step="0.5" min="0.5" placeholder="ex : 45.0" required>
            </div>

            <div class="form-group-admin" style="margin-bottom: 0;">
              <label for="expense-form-method">Source de Paiement</label>
              <select id="expense-form-method">
                <option value="cash">💵 Caisse Chiffre / Cash</option>
                <option value="card">💳 Carte Bancaire</option>
                <option value="bank_transfer">🏛️ Virement Bancaire</option>
              </select>
            </div>
          </div>

          <div class="form-group-admin" style="margin-bottom: 16px;">
            <label for="expense-form-desc">Description / Note de la Dépense</label>
            <input type="text" id="expense-form-desc" placeholder="ex : Payé Ahmed 40 TND pour heures supp du week-end" required>
          </div>

          <div style="display: flex; justify-content: flex-end;">
            <button type="submit" class="btn-admin-primary" style="padding: 11px 24px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>Valider la Dépense</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Expense History Table Card -->
      <div class="admin-card">
        <div class="admin-card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 20px; border-bottom: 1px dashed var(--border-admin); padding-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <h3>📋 Historique des Dépenses de Caisse</h3>
            <span style="font-size: 0.75rem; font-weight: 800; padding: 3px 10px; border-radius: 20px; background: rgba(255, 90, 31, 0.15); color: var(--accent-admin); border: 1px solid rgba(255, 90, 31, 0.25);">${filtered.length} Entrées</span>
          </div>

          <!-- Controls: Filter & Search -->
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            ${typeof canExportExpenses !== 'undefined' && canExportExpenses ? `
              <button class="btn-excel-export" id="btn-panel-export-expenses" title="Télécharger le fichier Excel des dépenses">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>📊 Exporter (.csv)</span>
              </button>
            ` : ''}
            <div style="position: relative; min-width: 220px;">
              <input type="text" id="expenses-search-input" value="${currentExpenseSearchQuery}" placeholder="Rechercher une dépense..." style="padding-left: 36px; height: 40px; font-size: 0.88rem; margin-bottom: 0;">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 12px; top: 13px; color: var(--text-admin-muted);"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>

            <select id="expenses-category-filter" style="height: 40px; font-size: 0.88rem; margin-bottom: 0; min-width: 180px;">
              <option value="all" ${currentExpenseCategoryFilter === 'all' ? 'selected' : ''}>Toutes les Catégories</option>
              <option value="worker_extra" ${currentExpenseCategoryFilter === 'worker_extra' ? 'selected' : ''}>👷 Extra Ouvrier</option>
              <option value="fournisseur" ${currentExpenseCategoryFilter === 'fournisseur' ? 'selected' : ''}>🚚 Paiement Fournisseur</option>
              <option value="ingredients" ${currentExpenseCategoryFilter === 'ingredients' ? 'selected' : ''}>🛒 Marché & Ingrédients</option>
              <option value="maintenance" ${currentExpenseCategoryFilter === 'maintenance' ? 'selected' : ''}>🔧 Entretien & Matériel</option>
              <option value="other" ${currentExpenseCategoryFilter === 'other' ? 'selected' : ''}>📝 Autres</option>
            </select>
          </div>
        </div>

        <div class="table-responsive-wrapper">
          <table class="admin-data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Catégorie</th>
                <th>Description</th>
                <th>Montant</th>
                <th>Source Paiement</th>
                <th>Saisi Par</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;


    // Event Bindings
    const form = document.getElementById('expense-log-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const date = document.getElementById('expense-form-date').value;
        const category = document.getElementById('expense-form-category').value;
        const amount = parseFloat(document.getElementById('expense-form-amount').value);
        const paymentMethod = document.getElementById('expense-form-method').value;
        const description = document.getElementById('expense-form-desc').value.trim();

        if (!date || isNaN(amount) || amount <= 0 || !description) {
          showToast("⚠️ Please enter a valid date, amount, and description!");
          return;
        }

        const newExpense = {
          id: `exp-${Date.now()}`,
          date,
          category,
          amount,
          paymentMethod,
          description,
          recordedBy: userRole || 'cashier',
          createdAt: new Date().toISOString()
        };

        try {
          await BabkeDB.addExpense(newExpense);
          showToast("✅ Cashier expense logged successfully!");
          renderExpensesPanel();
        } catch (err) {
          console.error("Failed to add expense:", err);
          showToast("❌ Error saving expense entry.");
        }
      });
    }

    // Delete Bindings
    container.querySelectorAll('.btn-delete-expense').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        if (confirm("Are you sure you want to delete this expense log entry?")) {
          try {
            await BabkeDB.deleteExpense(id);
            showToast("🗑️ Expense log deleted.");
            renderExpensesPanel();
          } catch (err) {
            console.error("Failed to delete expense:", err);
            showToast("❌ Error deleting expense log.");
          }
        }
      });
    });

    // Search and Filter Listeners
    const searchInput = document.getElementById('expenses-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentExpenseSearchQuery = e.target.value;
        renderExpensesPanel();
        const inputNow = document.getElementById('expenses-search-input');
        if (inputNow) {
          inputNow.focus();
          inputNow.setSelectionRange(inputNow.value.length, inputNow.value.length);
        }
      });
    }

    const categoryFilter = document.getElementById('expenses-category-filter');
    if (categoryFilter) {
      categoryFilter.addEventListener('change', (e) => {
        currentExpenseCategoryFilter = e.target.value;
        renderExpensesPanel();
      });
    }
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
    addActivityLog("Réservations mises à jour en temps réel");
    if (currentActivePanel === 'overview') {
      renderOverviewPanel();
    } else if (currentActivePanel === 'orders-reservations') {
      renderOrdersReservationsPanel();
    }
  });

  // Global Delegated click handler for ALL Modal Close & Cancel buttons
  document.addEventListener('click', (e) => {
    // 1. Close (&times;) or Cancel (Annuler) buttons inside any modal
    const closeTrigger = e.target.closest('.btn-close-modal-admin, .btn-admin-secondary, [data-close-modal]');
    if (closeTrigger) {
      const parentModal = closeTrigger.closest('.admin-modal-overlay');
      if (parentModal) {
        e.preventDefault();
        parentModal.classList.remove('open');
      }
    }
    // 2. Click on modal backdrop overlay background
    if (e.target.classList.contains('admin-modal-overlay')) {
      e.target.classList.remove('open');
    }
  });

  // Stock In Form Submit
  const stockInForm = document.getElementById('stock-in-form');
  if (stockInForm) {
    stockInForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const productName = document.getElementById('stock-in-product').value;
      const date = document.getElementById('stock-in-date').value;
      const quantity = parseFloat(document.getElementById('stock-in-qty').value);
      const unit = document.getElementById('stock-in-unit').value;
      const unitPrice = parseFloat(document.getElementById('stock-in-unit-price').value) || 0;
      const totalPrice = parseFloat(document.getElementById('stock-in-total-price').value) || 0;
      const supplier = document.getElementById('stock-in-supplier').value.trim();
      const reason = document.getElementById('stock-in-reason').value.trim();

      const newMovement = {
        id: `stock-${Date.now()}`,
        date,
        productName,
        type: 'IN',
        quantity,
        unit,
        unitPrice,
        totalPrice,
        supplier,
        reason,
        recordedBy: userRole || 'comptable',
        createdAt: new Date().toISOString()
      };

      await BabkeDB.addStockMovement(newMovement);
      document.getElementById('stock-in-modal').classList.remove('open');
      stockInForm.reset();
      showToast("📥 Achat de stock enregistré avec succès !");
      if (currentActivePanel === 'stock') renderStockPanel();
      else if (currentActivePanel === 'overview') renderOverviewPanel();
    });
  }

  // Stock Out Form Submit
  const stockOutForm = document.getElementById('stock-out-form');
  if (stockOutForm) {
    stockOutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const productName = document.getElementById('stock-out-product').value;
      const date = document.getElementById('stock-out-date').value;
      const quantity = parseFloat(document.getElementById('stock-out-qty').value);
      const unit = document.getElementById('stock-out-unit').value;
      const reason = document.getElementById('stock-out-reason').value.trim();

      // Check current available stock balance
      const availableStock = getAvailableStockBalance(productName);
      if (quantity > availableStock) {
        showToast(
          `Vous tentez de retirer <strong>${quantity} ${unit}</strong> pour "${productName}", mais il ne reste que <strong>${availableStock.toFixed(1)} ${unit}</strong> en stock disponible.`,
          'error',
          '❌ Stock Insuffisant !'
        );
        return;
      }

      const newMovement = {
        id: `stock-${Date.now()}`,
        date,
        productName,
        type: 'OUT',
        quantity,
        unit,
        unitPrice: 0,
        totalPrice: 0,
        supplier: '',
        reason,
        recordedBy: userRole || 'comptable',
        createdAt: new Date().toISOString()
      };

      await BabkeDB.addStockMovement(newMovement);
      document.getElementById('stock-out-modal').classList.remove('open');
      stockOutForm.reset();
      showToast("📤 Retrait de stock enregistré !");
      if (currentActivePanel === 'stock') renderStockPanel();
      else if (currentActivePanel === 'overview') renderOverviewPanel();
    });
  }

  // Ruined Item Form Submit
  const ruinedItemForm = document.getElementById('ruined-item-form');
  if (ruinedItemForm) {
    ruinedItemForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const item = document.getElementById('ruined-form-product').value;
      const date = document.getElementById('ruined-form-date').value;
      const quantity = parseFloat(document.getElementById('ruined-form-qty').value);
      const unit = document.getElementById('ruined-form-unit').value;
      const reason = document.getElementById('ruined-form-reason').value;

      // Check current available stock balance
      const availableStock = getAvailableStockBalance(item);
      if (quantity > availableStock) {
        showToast(
          `Vous tentez de déclarer une perte de <strong>${quantity} ${unit}</strong> pour "${item}", mais votre stock disponible actuel est de <strong>${availableStock.toFixed(1)} ${unit}</strong>.`,
          'error',
          '❌ Stock Insuffisant !'
        );
        return;
      }

      const newRuined = {
        id: `ruin-${Date.now()}`,
        date,
        item,
        quantity,
        unit,
        reason,
        recordedBy: userRole || 'worker',
        createdAt: new Date().toISOString()
      };

      await BabkeDB.addRuinedProduct(newRuined);
      document.getElementById('ruined-modal').classList.remove('open');
      ruinedItemForm.reset();
      showToast("🗑️ Saisie de produit gâté enregistrée !");
      if (currentActivePanel === 'ruined') renderRuinedPanel();
      else if (currentActivePanel === 'stock') renderStockPanel();
      else if (currentActivePanel === 'overview') renderOverviewPanel();
    });
  }

  // Product Type Form Submit
  const ptForm = document.getElementById('product-type-form');
  if (ptForm) {
    ptForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('pt-form-name').value.trim();
      const category = document.getElementById('pt-form-category').value;
      const defaultUnit = document.getElementById('pt-form-unit').value;
      const minStockAlert = parseInt(document.getElementById('pt-form-alert').value) || 5;

      const newType = {
        id: `pt-${Date.now()}`,
        name,
        category,
        defaultUnit,
        minStockAlert,
        createdAt: new Date().toISOString()
      };

      await BabkeDB.addProductType(newType);
      document.getElementById('product-type-modal').classList.remove('open');
      ptForm.reset();
      showToast(`🏷️ Type de produit "${name}" créé avec succès !`);

      // Refresh all product dropdowns and auto-select newly created item in current form
      ['stock-in-product', 'stock-out-product', 'ruined-form-product', 'left-form-item'].forEach(id => {
        populateProductDropdown(id, activeProductSelectTarget === id ? name : null);
      });
      activeProductSelectTarget = null;

      if (currentActivePanel === 'product-types') renderProductTypesPanel();
      else if (currentActivePanel === 'stock') renderStockPanel();
    });
  }

  window.addEventListener('babkeStockChanged', () => {
    addActivityLog("Stock mis à jour en temps réel");
    if (currentActivePanel === 'stock') renderStockPanel();
    else if (currentActivePanel === 'overview') renderOverviewPanel();
  });

  window.addEventListener('babkeRuinedChanged', () => {
    addActivityLog("Produits gâtés mis à jour en temps réel");
    if (currentActivePanel === 'ruined') renderRuinedPanel();
    else if (currentActivePanel === 'stock') renderStockPanel();
    else if (currentActivePanel === 'overview') renderOverviewPanel();
  });

  window.addEventListener('babkeOrdersChanged', () => {
    playOrderAudioAlert();
    addActivityLog("Nouvelle commande client reçue");
    showToast("🔔 Nouvelle commande reçue !");
    if (currentActivePanel === 'orders-reservations') renderOrdersReservationsPanel();
    else if (currentActivePanel === 'overview') renderOverviewPanel();
    else if (currentActivePanel === 'comptabilite') renderComptabilitePanel();
  });

  window.addEventListener('babkeReservationsChanged', () => {
    playOrderAudioAlert();
    addActivityLog("Nouvelle réservation de table reçue");
    showToast("🔔 Nouvelle réservation reçue !");
    if (currentActivePanel === 'orders-reservations') renderOrdersReservationsPanel();
    else if (currentActivePanel === 'overview') renderOverviewPanel();
  });

  window.addEventListener('babkeProductTypesChanged', () => {
    addActivityLog("Types de produits mis à jour");
    if (currentActivePanel === 'product-types') renderProductTypesPanel();
    else if (currentActivePanel === 'stock') renderStockPanel();
  });

  window.addEventListener('babkeAccountingSheetsChanged', () => {
    addActivityLog("Saisie comptable mise à jour en temps réel");
    if (currentActivePanel === 'comptabilite') renderComptabilitePanel();
    else if (currentActivePanel === 'overview') renderOverviewPanel();
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
        window.dispatchEvent(new Event('babkeExpensesChanged'));
        window.dispatchEvent(new Event('babkeStockChanged'));
        window.dispatchEvent(new Event('babkeRuinedChanged'));
      } catch (err) {
        console.error("Polling sync failed:", err);
      }
    }
  }, 30000);

  // Check auth state on script start
  checkAuth();
});

