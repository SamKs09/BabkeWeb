/* ==========================================================================
   BABKE KEBAB & PLATES — CLIENT-SIDE CACHE & BACKEND API LAYER
   ========================================================================== */

const babkeChannel = new BroadcastChannel('babke_sync_channel');

const BabkeDB = {
  cache: null,
  initPromise: null,

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
        console.log("Babke DB initialized from backend server successfully.");
        return data;
      })
      .catch(err => {
        console.error("Critical error fetching database state:", err);
        // Fallback structures if backend goes down
        this.cache = {
          menu: [],
          content: {},
          reviews: [],
          gallery: [],
          orders: [],
          reservations: [],
          events: []
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
    if (this.cache) this.cache.menu = menu;
    window.dispatchEvent(new Event('babkeMenuChanged'));
    babkeChannel.postMessage({ type: 'menu_changed' });

    try {
      const res = await fetch('/api/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menu)
      });
      return await res.json();
    } catch (err) {
      console.error('Error saving menu to backend:', err);
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
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      return await res.json();
    } catch (err) {
      console.error('Error saving menu item to backend:', err);
    }
  },

  async deleteMenuItem(id) {
    if (!this.cache) await this.init();
    this.cache.menu = this.cache.menu.filter(m => m.id !== id);

    window.dispatchEvent(new Event('babkeMenuChanged'));
    babkeChannel.postMessage({ type: 'menu_changed' });

    try {
      const res = await fetch(`/api/menu/${id}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (err) {
      console.error('Error deleting menu item from backend:', err);
    }
  },

  // WEBSITE CONTENT
  getContent() {
    return this.cache ? (this.cache.content || {}) : {};
  },

  async saveContent(content) {
    if (this.cache) this.cache.content = content;
    window.dispatchEvent(new Event('babkeContentChanged'));
    babkeChannel.postMessage({ type: 'content_changed' });

    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
      });
      return await res.json();
    } catch (err) {
      console.error('Error saving website content to backend:', err);
    }
  },

  // REVIEWS
  getReviews() {
    return this.cache ? (this.cache.reviews || []) : [];
  },

  async saveReviews(reviews) {
    if (this.cache) this.cache.reviews = reviews;
    window.dispatchEvent(new Event('babkeReviewsChanged'));
    babkeChannel.postMessage({ type: 'reviews_changed' });

    try {
      const res = await fetch('/api/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviews)
      });
      return await res.json();
    } catch (err) {
      console.error('Error saving reviews to backend:', err);
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
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review)
      });
      return await res.json();
    } catch (err) {
      console.error('Error saving review to backend:', err);
    }
  },

  async deleteReviewItem(id) {
    if (!this.cache) await this.init();
    this.cache.reviews = this.cache.reviews.filter(r => r.id !== id);

    window.dispatchEvent(new Event('babkeReviewsChanged'));
    babkeChannel.postMessage({ type: 'reviews_changed' });

    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (err) {
      console.error('Error deleting review from backend:', err);
    }
  },

  // GALLERY
  getGallery() {
    return this.cache ? (this.cache.gallery || []) : [];
  },

  async saveGallery(gallery) {
    if (this.cache) this.cache.gallery = gallery;
    window.dispatchEvent(new Event('babkeGalleryChanged'));
    babkeChannel.postMessage({ type: 'gallery_changed' });

    try {
      const res = await fetch('/api/gallery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gallery)
      });
      return await res.json();
    } catch (err) {
      console.error('Error saving gallery to backend:', err);
    }
  },

  async addGalleryPhoto(photo) {
    if (!this.cache) await this.init();
    this.cache.gallery.push(photo);

    window.dispatchEvent(new Event('babkeGalleryChanged'));
    babkeChannel.postMessage({ type: 'gallery_changed' });

    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(photo)
      });
      return await res.json();
    } catch (err) {
      console.error('Error adding gallery photo to backend:', err);
    }
  },

  async deleteGalleryPhoto(id) {
    if (!this.cache) await this.init();
    this.cache.gallery = this.cache.gallery.filter(g => g.id !== id);

    window.dispatchEvent(new Event('babkeGalleryChanged'));
    babkeChannel.postMessage({ type: 'gallery_changed' });

    try {
      const res = await fetch(`/api/gallery/${id}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (err) {
      console.error('Error deleting gallery photo from backend:', err);
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
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      return await res.json();
    } catch (err) {
      console.error('Error placing order to backend:', err);
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
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      return res.ok;
    } catch (err) {
      console.error(`Error updating status for order ${id}:`, err);
      return false;
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
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservation)
      });
      return await res.json();
    } catch (err) {
      console.error('Error creating reservation to backend:', err);
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
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      return res.ok;
    } catch (err) {
      console.error(`Error updating status for reservation ${id}:`, err);
      return false;
    }
  },

  // EVENTS
  getEvents() {
    let events = this.cache ? (this.cache.events || []) : [];
    
    // Auto-archiving logic:
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    let updated = false;
    events = events.map(event => {
      if (event.date && event.date < todayStr && event.status === 'published') {
        event.status = 'archived';
        updated = true;
      }
      return event;
    });
    
    if (updated) {
      this.saveEvents(events);
    }
    return events;
  },

  async saveEvents(events) {
    if (this.cache) this.cache.events = events;
    window.dispatchEvent(new Event('babkeEventsChanged'));
    babkeChannel.postMessage({ type: 'events_changed' });

    try {
      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(events)
      });
      return await res.json();
    } catch (err) {
      console.error('Error saving events to backend:', err);
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
      const url = isEdit ? `/api/events/${event.id}` : '/api/events';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      return await res.json();
    } catch (err) {
      console.error('Error saving event item to backend:', err);
    }
  },

  async deleteEventItem(id) {
    if (!this.cache) await this.init();
    this.cache.events = this.cache.events.filter(e => e.id !== id);

    window.dispatchEvent(new Event('babkeEventsChanged'));
    babkeChannel.postMessage({ type: 'events_changed' });

    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (err) {
      console.error('Error deleting event from backend:', err);
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
      }
    } catch (err) {
      console.error("Failed to sync cache following cross-tab notification:", err);
    }
  }
};
