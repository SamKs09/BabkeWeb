/* ==========================================================================
   BABKE KEBAB & PLATES — CLIENT-SIDE CACHE & BACKEND API LAYER
   ========================================================================== */

const babkeChannel = new BroadcastChannel('babke_sync_channel');

const BabkeDB = {
  cache: null,
  initPromise: null,

  // true dès qu'un chargement de /api/all-data a échoué : les écrans ne
  // doivent pas présenter un cache de secours comme la vérité.
  degraded: false,

  // ----------------------------------------------------
  // TOUTE ÉCRITURE PASSE PAR ICI.
  // Chaque save/add/delete met le cache à jour et prévient l'interface AVANT
  // d'envoyer la requête, pour que l'écran réagisse tout de suite. Le prix de
  // ce confort : si la requête est refusée et que personne ne lit la réponse,
  // l'écran ment jusqu'au prochain rafraîchissement, et le patron croit avoir
  // enregistré. apiFetch lève une erreur sur toute réponse non-OK ;
  // resyncAfterFailedWrite remet ensuite le cache en phase avec le serveur.
  // ----------------------------------------------------
  async apiFetch(url, options) {
    let res;
    try {
      res = await fetch(url, Object.assign({ credentials: 'same-origin' }, options || {}));
    } catch (networkErr) {
      const err = new Error('Serveur injoignable — la modification n’a PAS été enregistrée.');
      err.status = 0;
      throw err;
    }
    if (res.ok) return res;

    let detail = '';
    try {
      const body = await res.clone().json();
      detail = body.message || body.error || '';
    } catch (e) { /* réponse sans JSON */ }

    const byStatus = {
      401: 'Session expirée — reconnectez-vous. La modification n’a PAS été enregistrée.',
      403: 'Votre rôle n’a pas le droit d’enregistrer ici. La modification n’a PAS été enregistrée.',
      413: 'Fichier trop lourd pour le serveur — la modification n’a PAS été enregistrée.',
      429: 'Trop de requêtes — réessayez dans un instant. Rien n’a été enregistré.'
    };
    const err = new Error(byStatus[res.status] || detail || ('Enregistrement refusé par le serveur (HTTP ' + res.status + ').'));
    err.status = res.status;
    err.detail = detail;
    throw err;
  },

  // Après un refus, le cache porte encore la modification fantôme : on le
  // recharge depuis le serveur et on redessine, pour que l’écran montre ce
  // qui est vraiment enregistré plutôt que ce que l’on espérait.
  async resyncAfterFailedWrite(eventName) {
    try {
      await this.init(true);
      if (eventName) window.dispatchEvent(new Event(eventName));
      window.dispatchEvent(new Event('babkeDataRefreshed'));
    } catch (e) {
      console.error('Resync after a failed write did not succeed:', e);
    }
  },

  // Les écritures groupées remplacent TOUTE la collection (réordonner la
  // carte, la galerie...). Si le dernier chargement a échoué, le cache peut
  // être vide : l’envoyer effacerait le vrai contenu côté serveur.
  assertNotDegraded(what) {
    if (!this.degraded) return;
    const err = new Error('Données non chargées (serveur injoignable) — ' + what + ' annulé pour ne rien écraser. Rechargez la page.');
    err.status = 0;
    throw err;
  },
  // Initialize and load all data from the Express backend
  init(forceRefetch = false) {
    if (this.cache && !forceRefetch) {
      return Promise.resolve(this.cache);
    }

    if (this.initPromise && !forceRefetch) {
      return this.initPromise;
    }

    this.initPromise = fetch('/api/all-data')
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load database. HTTP status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        this.cache = data;
        this.degraded = false;
        console.log("Babke DB initialized from backend server successfully.");
        window.dispatchEvent(new Event('babkeDataRefreshed'));
        return data;
      })
      .catch(err => {
        console.error("Critical error fetching database state:", err);
        this.degraded = true;
        window.dispatchEvent(new Event('babkeDataUnavailable'));
        // Garder les données déjà chargées : les remplacer par des tableaux
        // vides ferait croire à une base vide, et un enregistrement groupé
        // (PUT /api/menu, /api/gallery...) écraserait alors le vrai contenu.
        if (this.cache) return this.cache;
        // Premier chargement raté : squelette vide, mais degraded reste vrai.
        this.cache = {
          menu: [],
          content: {},
          reviews: [],
          gallery: [],
          orders: [],
          reservations: [],
          events: [],
          menuBook: null
        };
        return this.cache;
      });

    return this.initPromise;
  },

  // MENU
  getMenu() {
    return this.cache ? (this.cache.menu || []) : [];
  },

  async saveMenu(menu) {
    this.assertNotDegraded('la carte');
    if (this.cache) this.cache.menu = menu;
    window.dispatchEvent(new Event('babkeMenuChanged'));
    babkeChannel.postMessage({ type: 'menu_changed' });

    try {
      const res = await this.apiFetch('/api/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menu)
      });
      return await res.json();
    } catch (err) {
      console.error('Error saving menu to backend:', err);
      await this.resyncAfterFailedWrite('babkeMenuChanged');
      throw err;
    }
  },

  async saveMenuItem(item) {
    if (!this.cache) await this.init();
    
    const isEdit = this.cache.menu.some(m => m.id === item.id);
    if (isEdit) {
      this.cache.menu = this.cache.menu.map(m => m.id === item.id ? item : m);
    } else {
      this.cache.menu.push(item);
    }

    window.dispatchEvent(new Event('babkeMenuChanged'));
    babkeChannel.postMessage({ type: 'menu_changed' });

    try {
      const url = isEdit ? `/api/menu/${item.id}` : '/api/menu';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await this.apiFetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      return await res.json();
    } catch (err) {
      console.error('Error saving menu item to backend:', err);
      await this.resyncAfterFailedWrite('babkeMenuChanged');
      throw err;
    }
  },

  async toggleMenuAvailability(id, available) {
    if (!this.cache) await this.init();
    const item = (this.cache.menu || []).find(m => m.id === id || m.id.toLowerCase() === id.toLowerCase());
    if (item) {
      item.available = Boolean(available);
      window.dispatchEvent(new Event('babkeMenuChanged'));
      try {
        localStorage.setItem('babke_menu_cache', JSON.stringify(this.cache.menu));
      } catch (e) {}
    }

    try {
      const res = await this.apiFetch(`/api/menu/${encodeURIComponent(id)}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ available: Boolean(available) })
      });
      if (res.ok) {
        const data = await res.json();
        babkeChannel.postMessage({ type: 'menu_changed' });
        return data;
      }
    } catch (err) {
      console.warn('Backend server offline, saved availability state to local storage:', err);
      await this.resyncAfterFailedWrite('babkeMenuChanged');
      throw err;
    }
  },

  async deleteMenuItem(id) {
    if (!this.cache) await this.init();
    this.cache.menu = this.cache.menu.filter(m => m.id !== id);

    window.dispatchEvent(new Event('babkeMenuChanged'));
    babkeChannel.postMessage({ type: 'menu_changed' });

    try {
      const res = await this.apiFetch(`/api/menu/${id}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (err) {
      console.error('Error deleting menu item from backend:', err);
      await this.resyncAfterFailedWrite('babkeMenuChanged');
      throw err;
    }
  },

  // WEBSITE CONTENT
  getContent() {
    return this.cache ? (this.cache.content || {}) : {};
  },

  getMenuBook() { return this.cache ? (this.cache.menuBook || null) : null; },

  async saveContent(content) {
    if (this.cache) this.cache.content = content;
    window.dispatchEvent(new Event('babkeContentChanged'));
    babkeChannel.postMessage({ type: 'content_changed' });

    try {
      const res = await this.apiFetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
      });
      return await res.json();
    } catch (err) {
      console.error('Error saving website content to backend:', err);
      await this.resyncAfterFailedWrite('babkeContentChanged');
      throw err;
    }
  },

  // REVIEWS
  getReviews() {
    return this.cache ? (this.cache.reviews || []) : [];
  },

  async saveReviews(reviews) {
    this.assertNotDegraded('les avis');
    if (this.cache) this.cache.reviews = reviews;
    window.dispatchEvent(new Event('babkeReviewsChanged'));
    babkeChannel.postMessage({ type: 'reviews_changed' });

    try {
      const res = await this.apiFetch('/api/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviews)
      });
      return await res.json();
    } catch (err) {
      console.error('Error saving reviews to backend:', err);
      await this.resyncAfterFailedWrite('babkeReviewsChanged');
      throw err;
    }
  },

  async saveReviewItem(review) {
    if (!this.cache) await this.init();

    const isEdit = this.cache.reviews.some(r => r.id === review.id);
    if (isEdit) {
      this.cache.reviews = this.cache.reviews.map(r => r.id === review.id ? review : r);
    } else {
      this.cache.reviews.push(review);
    }

    window.dispatchEvent(new Event('babkeReviewsChanged'));
    babkeChannel.postMessage({ type: 'reviews_changed' });

    try {
      const url = isEdit ? `/api/reviews/${review.id}` : '/api/reviews';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await this.apiFetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review)
      });
      return await res.json();
    } catch (err) {
      console.error('Error saving review to backend:', err);
      await this.resyncAfterFailedWrite('babkeReviewsChanged');
      throw err;
    }
  },

  async deleteReviewItem(id) {
    if (!this.cache) await this.init();
    this.cache.reviews = this.cache.reviews.filter(r => r.id !== id);

    window.dispatchEvent(new Event('babkeReviewsChanged'));
    babkeChannel.postMessage({ type: 'reviews_changed' });

    try {
      const res = await this.apiFetch(`/api/reviews/${id}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (err) {
      console.error('Error deleting review from backend:', err);
      await this.resyncAfterFailedWrite('babkeReviewsChanged');
      throw err;
    }
  },

  // GALLERY
  getGallery() {
    return this.cache ? (this.cache.gallery || []) : [];
  },

  async saveGallery(gallery) {
    this.assertNotDegraded('la galerie');
    if (this.cache) this.cache.gallery = gallery;
    window.dispatchEvent(new Event('babkeGalleryChanged'));
    babkeChannel.postMessage({ type: 'gallery_changed' });

    try {
      const res = await this.apiFetch('/api/gallery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gallery)
      });
      return await res.json();
    } catch (err) {
      console.error('Error saving gallery to backend:', err);
      await this.resyncAfterFailedWrite('babkeGalleryChanged');
      throw err;
    }
  },

  async addGalleryPhoto(photo) {
    if (!this.cache) await this.init();
    this.cache.gallery.push(photo);

    window.dispatchEvent(new Event('babkeGalleryChanged'));
    babkeChannel.postMessage({ type: 'gallery_changed' });

    try {
      const res = await this.apiFetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(photo)
      });
      return await res.json();
    } catch (err) {
      console.error('Error adding gallery photo to backend:', err);
      await this.resyncAfterFailedWrite('babkeGalleryChanged');
      throw err;
    }
  },

  async deleteGalleryPhoto(id) {
    if (!this.cache) await this.init();
    this.cache.gallery = this.cache.gallery.filter(g => g.id !== id);

    window.dispatchEvent(new Event('babkeGalleryChanged'));
    babkeChannel.postMessage({ type: 'gallery_changed' });

    try {
      const res = await this.apiFetch(`/api/gallery/${id}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (err) {
      console.error('Error deleting gallery photo from backend:', err);
      await this.resyncAfterFailedWrite('babkeGalleryChanged');
      throw err;
    }
  },

  // ORDERS
  getOrders() {
    return this.cache ? (this.cache.orders || []) : [];
  },

  async addOrder(order) {
    if (this.cache) {
      if (!this.cache.orders) this.cache.orders = [];
      this.cache.orders.unshift(order);
    }
    window.dispatchEvent(new Event('babkeOrdersChanged'));
    babkeChannel.postMessage({ type: 'orders_changed' });

    try {
      const res = await this.apiFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      return await res.json();
    } catch (err) {
      console.error('Error placing order to backend:', err);
      await this.resyncAfterFailedWrite('babkeOrdersChanged');
      throw err;
    }
  },

  async updateOrderStatus(id, status) {
    if (this.cache && this.cache.orders) {
      const idx = this.cache.orders.findIndex(o => o.id === id);
      if (idx > -1) {
        this.cache.orders[idx].status = status;
      }
    }
    window.dispatchEvent(new Event('babkeOrdersChanged'));
    babkeChannel.postMessage({ type: 'orders_changed' });

    try {
      const res = await this.apiFetch(`/api/orders/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status })
      });
      return true;
    } catch (err) {
      console.error(`Error updating status for order ${id}:`, err);
      await this.resyncAfterFailedWrite('babkeOrdersChanged');
      throw err;
    }
  },

  // RESERVATIONS
  getReservations() {
    return this.cache ? (this.cache.reservations || []) : [];
  },

  async addReservation(reservation) {
    if (this.cache) {
      if (!this.cache.reservations) this.cache.reservations = [];
      this.cache.reservations.unshift(reservation);
    }
    window.dispatchEvent(new Event('babkeReservationsChanged'));
    babkeChannel.postMessage({ type: 'reservations_changed' });

    try {
      const res = await this.apiFetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(reservation)
      });
      return await res.json();
    } catch (err) {
      console.error('Error creating reservation to backend:', err);
      await this.resyncAfterFailedWrite('babkeReservationsChanged');
      throw err;
    }
  },

  async updateReservationStatus(id, status) {
    if (this.cache && this.cache.reservations) {
      const idx = this.cache.reservations.findIndex(r => r.id === id);
      if (idx > -1) {
        this.cache.reservations[idx].status = status;
      }
    }
    window.dispatchEvent(new Event('babkeReservationsChanged'));
    babkeChannel.postMessage({ type: 'reservations_changed' });

    try {
      const res = await this.apiFetch(`/api/reservations/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status })
      });
      return true;
    } catch (err) {
      console.error(`Error updating status for reservation ${id}:`, err);
      await this.resyncAfterFailedWrite('babkeReservationsChanged');
      throw err;
    }
  },

  // EVENTS
  getEvents() {
    return this.cache ? (this.cache.events || []) : [];
  },

  async saveEvents(events) {
    this.assertNotDegraded('les événements');
    if (this.cache) this.cache.events = events;
    window.dispatchEvent(new Event('babkeEventsChanged'));
    babkeChannel.postMessage({ type: 'events_changed' });

    try {
      const res = await this.apiFetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(events)
      });
      return await res.json();
    } catch (err) {
      console.error('Error saving events to backend:', err);
      await this.resyncAfterFailedWrite('babkeEventsChanged');
      throw err;
    }
  },

  async saveEventItem(event) {
    if (!this.cache) await this.init();

    const isEdit = this.cache.events.some(e => e.id === event.id);
    if (isEdit) {
      this.cache.events = this.cache.events.map(e => e.id === event.id ? event : e);
    } else {
      this.cache.events.push(event);
    }

    window.dispatchEvent(new Event('babkeEventsChanged'));
    babkeChannel.postMessage({ type: 'events_changed' });

    try {
      const url = isEdit ? `/api/events/${encodeURIComponent(event.id)}` : '/api/events';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await this.apiFetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(event)
      });
      return await res.json();
    } catch (err) {
      console.error('Error saving event item to backend:', err);
      await this.resyncAfterFailedWrite('babkeEventsChanged');
      throw err;
    }
  },

  async deleteEventItem(id) {
    if (!this.cache) await this.init();
    this.cache.events = this.cache.events.filter(e => e.id !== id);

    window.dispatchEvent(new Event('babkeEventsChanged'));
    babkeChannel.postMessage({ type: 'events_changed' });

    try {
      const res = await this.apiFetch(`/api/events/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      return await res.json();
    } catch (err) {
      console.error('Error deleting event from backend:', err);
      await this.resyncAfterFailedWrite('babkeEventsChanged');
      throw err;
    }
  },

  // LEFTOVERS
  getLeftovers() {
    return this.cache ? (this.cache.leftovers || []) : [];
  },

  async addLeftover(leftover) {
    if (!this.cache) await this.init();
    if (!this.cache.leftovers) this.cache.leftovers = [];
    this.cache.leftovers.unshift(leftover);

    window.dispatchEvent(new Event('babkeLeftoversChanged'));
    babkeChannel.postMessage({ type: 'leftovers_changed' });

    try {
      const res = await this.apiFetch('/api/leftovers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leftover)
      });
      return await res.json();
    } catch (err) {
      console.error('Error logging leftover item to backend:', err);
      await this.resyncAfterFailedWrite('babkeLeftoversChanged');
      throw err;
    }
  },

  async deleteLeftover(id) {
    if (!this.cache) await this.init();
    if (this.cache.leftovers) {
      this.cache.leftovers = this.cache.leftovers.filter(l => l.id !== id);
    }

    window.dispatchEvent(new Event('babkeLeftoversChanged'));
    babkeChannel.postMessage({ type: 'leftovers_changed' });

    try {
      const res = await this.apiFetch(`/api/leftovers/${id}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (err) {
      console.error('Error deleting leftover log from backend:', err);
      await this.resyncAfterFailedWrite('babkeLeftoversChanged');
      throw err;
    }
  },

  // EXPENSES
  getExpenses() {
    return this.cache ? (this.cache.expenses || []) : [];
  },

  async addExpense(expense) {
    if (!this.cache) await this.init();
    if (!this.cache.expenses) this.cache.expenses = [];
    this.cache.expenses.unshift(expense);

    window.dispatchEvent(new Event('babkeExpensesChanged'));
    babkeChannel.postMessage({ type: 'expenses_changed' });

    try {
      const res = await this.apiFetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense)
      });
      return await res.json();
    } catch (err) {
      console.error('Error logging expense item to backend:', err);
      await this.resyncAfterFailedWrite('babkeExpensesChanged');
      throw err;
    }
  },

  async deleteExpense(id) {
    if (!this.cache) await this.init();
    if (this.cache.expenses) {
      this.cache.expenses = this.cache.expenses.filter(e => e.id !== id);
    }

    window.dispatchEvent(new Event('babkeExpensesChanged'));
    babkeChannel.postMessage({ type: 'expenses_changed' });

    try {
      const res = await this.apiFetch(`/api/expenses/${id}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (err) {
      console.error('Error deleting expense log from backend:', err);
      await this.resyncAfterFailedWrite('babkeExpensesChanged');
      throw err;
    }
  },

  // RUINED PRODUCTS
  getRuinedProducts() {
    return this.cache ? (this.cache.ruinedProducts || []) : [];
  },

  async addRuinedProduct(item) {
    if (!this.cache) await this.init();
    if (!this.cache.ruinedProducts) this.cache.ruinedProducts = [];
    this.cache.ruinedProducts.unshift(item);

    window.dispatchEvent(new Event('babkeRuinedChanged'));
    babkeChannel.postMessage({ type: 'ruined_changed' });

    try {
      const res = await this.apiFetch('/api/ruined-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      return await res.json();
    } catch (err) {
      console.error('Error logging ruined product to backend:', err);
      await this.resyncAfterFailedWrite('babkeRuinedChanged');
      throw err;
    }
  },

  async deleteRuinedProduct(id) {
    if (!this.cache) await this.init();
    if (this.cache.ruinedProducts) {
      this.cache.ruinedProducts = this.cache.ruinedProducts.filter(r => r.id !== id);
    }

    window.dispatchEvent(new Event('babkeRuinedChanged'));
    babkeChannel.postMessage({ type: 'ruined_changed' });

    try {
      const res = await this.apiFetch(`/api/ruined-products/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch (err) {
      console.error('Error deleting ruined product log:', err);
      await this.resyncAfterFailedWrite('babkeRuinedChanged');
      throw err;
    }
  },

  // PRODUCT TYPES
  getProductTypes() {
    return this.cache ? (this.cache.productTypes || []) : [];
  },

  async addProductType(type) {
    if (!this.cache) await this.init();
    if (!this.cache.productTypes) this.cache.productTypes = [];
    this.cache.productTypes.push(type);

    window.dispatchEvent(new Event('babkeProductTypesChanged'));
    babkeChannel.postMessage({ type: 'product_types_changed' });

    try {
      const res = await this.apiFetch('/api/product-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(type)
      });
      return await res.json();
    } catch (err) {
      console.error('Error adding product type to backend:', err);
      await this.resyncAfterFailedWrite('babkeProductTypesChanged');
      throw err;
    }
  },

  async deleteProductType(id) {
    if (!this.cache) await this.init();
    if (this.cache.productTypes) {
      this.cache.productTypes = this.cache.productTypes.filter(p => p.id !== id);
    }

    window.dispatchEvent(new Event('babkeProductTypesChanged'));
    babkeChannel.postMessage({ type: 'product_types_changed' });

    try {
      const res = await this.apiFetch(`/api/product-types/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch (err) {
      console.error('Error deleting product type:', err);
      await this.resyncAfterFailedWrite('babkeProductTypesChanged');
      throw err;
    }
  },

  // STOCK MOVEMENTS
  getStockMovements() {
    return this.cache ? (this.cache.stockMovements || []) : [];
  },

  async addStockMovement(movement) {
    if (!this.cache) await this.init();
    if (!this.cache.stockMovements) this.cache.stockMovements = [];
    this.cache.stockMovements.unshift(movement);

    window.dispatchEvent(new Event('babkeStockChanged'));
    babkeChannel.postMessage({ type: 'stock_changed' });

    try {
      const res = await this.apiFetch('/api/stock/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movement)
      });
      return await res.json();
    } catch (err) {
      console.error('Error adding stock movement:', err);
      await this.resyncAfterFailedWrite('babkeStockChanged');
      throw err;
    }
  },

  async deleteStockMovement(id) {
    if (!this.cache) await this.init();
    if (this.cache.stockMovements) {
      this.cache.stockMovements = this.cache.stockMovements.filter(s => s.id !== id);
    }

    window.dispatchEvent(new Event('babkeStockChanged'));
    babkeChannel.postMessage({ type: 'stock_changed' });

    try {
      const res = await this.apiFetch(`/api/stock/movements/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch (err) {
      console.error('Error deleting stock movement:', err);
      await this.resyncAfterFailedWrite('babkeStockChanged');
      throw err;
    }
  },

  // AUDIT LOGS
  getAuditLogs() {
    return this.cache ? (this.cache.auditLogs || []) : [];
  },

  // ACCOUNTING SHEETS
  getAccountingSheets(sheetType) {
    if (!this.cache || !this.cache.accountingSheets) return sheetType ? [] : { sahloul_jfs: [], frits: [], nettoyage: [], poulet_viandes: [] };
    if (sheetType) {
      return this.cache.accountingSheets[sheetType] || [];
    }
    return this.cache.accountingSheets;
  },

  async addAccountingSheetItem(item) {
    if (!this.cache) await this.init();
    if (!this.cache.accountingSheets) this.cache.accountingSheets = { sahloul_jfs: [], frits: [], nettoyage: [], poulet_viandes: [] };
    const sheetType = item.sheetType;
    if (!this.cache.accountingSheets[sheetType]) this.cache.accountingSheets[sheetType] = [];
    this.cache.accountingSheets[sheetType].push(item);

    window.dispatchEvent(new Event('babkeAccountingSheetsChanged'));
    babkeChannel.postMessage({ type: 'accounting_sheets_changed' });

    try {
      const res = await this.apiFetch('/api/accounting-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      return await res.json();
    } catch (err) {
      console.error('Error adding accounting sheet entry:', err);
      await this.resyncAfterFailedWrite('babkeAccountingSheetsChanged');
      throw err;
    }
  },

  async updateAccountingSheetItem(id, item) {
    if (!this.cache) await this.init();
    if (this.cache.accountingSheets) {
      const sheetType = item.sheetType;
      if (this.cache.accountingSheets[sheetType]) {
        const idx = this.cache.accountingSheets[sheetType].findIndex(x => x.id === id);
        if (idx > -1) this.cache.accountingSheets[sheetType][idx] = { ...this.cache.accountingSheets[sheetType][idx], ...item };
      }
    }

    window.dispatchEvent(new Event('babkeAccountingSheetsChanged'));
    babkeChannel.postMessage({ type: 'accounting_sheets_changed' });

    try {
      const res = await this.apiFetch(`/api/accounting-sheets/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      return await res.json();
    } catch (err) {
      console.error('Error updating accounting sheet entry:', err);
      await this.resyncAfterFailedWrite('babkeAccountingSheetsChanged');
      throw err;
    }
  },

  async deleteAccountingSheetItem(id, sheetType) {
    if (!this.cache) await this.init();
    if (this.cache.accountingSheets && this.cache.accountingSheets[sheetType]) {
      this.cache.accountingSheets[sheetType] = this.cache.accountingSheets[sheetType].filter(x => x.id !== id);
    }

    window.dispatchEvent(new Event('babkeAccountingSheetsChanged'));
    babkeChannel.postMessage({ type: 'accounting_sheets_changed' });

    try {
      const res = await this.apiFetch(`/api/accounting-sheets/${encodeURIComponent(id)}?sheetType=${encodeURIComponent(sheetType)}`, { method: 'DELETE' });
      return await res.json();
    } catch (err) {
      console.error('Error deleting accounting sheet entry:', err);
      await this.resyncAfterFailedWrite('babkeAccountingSheetsChanged');
      throw err;
    }
  },

  // DATABASE RESET & RE-SEED
  async resetDatabase() {
    try {
      const res = await fetch('/api/admin/reset-database', { method: 'POST' });
      if (res.ok) {
        // Clear local storage caches
        localStorage.clear();
        // Re-fetch all data from backend
        await this.init(true);
        // Trigger global state refresh events
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
        window.dispatchEvent(new Event('babkeProductTypesChanged'));
        window.dispatchEvent(new Event('babkeAccountingSheetsChanged'));
        babkeChannel.postMessage({ type: 'database_reset' });
        return { success: true };
      }
      const data = await res.json();
      return { success: false, error: data.error || 'Erreur lors de la réinitialisation' };
    } catch (err) {
      console.error('Error resetting database via store:', err);
      return { success: false, error: err.message };
    }
  }
};


// Handle incoming message broadcasts from other tabs
babkeChannel.onmessage = async (event) => {
  console.log("Cross-tab sync notification received:", event.data);
  if (event.data && event.data.type) {
    try {
      // Perform background refetch
      await BabkeDB.init(true);
      
      // Dispatch local event corresponding to change
      if (event.data.type === 'menu_changed') {
        window.dispatchEvent(new Event('babkeMenuChanged'));
      } else if (event.data.type === 'content_changed') {
        window.dispatchEvent(new Event('babkeContentChanged'));
      } else if (event.data.type === 'reviews_changed') {
        window.dispatchEvent(new Event('babkeReviewsChanged'));
      } else if (event.data.type === 'gallery_changed') {
        window.dispatchEvent(new Event('babkeGalleryChanged'));
      } else if (event.data.type === 'events_changed') {
        window.dispatchEvent(new Event('babkeEventsChanged'));
      } else if (event.data.type === 'orders_changed') {
        window.dispatchEvent(new Event('babkeOrdersChanged'));
      } else if (event.data.type === 'reservations_changed') {
        window.dispatchEvent(new Event('babkeReservationsChanged'));
      } else if (event.data.type === 'leftovers_changed') {
        window.dispatchEvent(new Event('babkeLeftoversChanged'));
      } else if (event.data.type === 'expenses_changed') {
        window.dispatchEvent(new Event('babkeExpensesChanged'));
      }
    } catch (err) {
      console.error("Failed to sync cache following cross-tab notification:", err);
    }
  }
};
