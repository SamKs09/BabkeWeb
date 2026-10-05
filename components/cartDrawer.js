/* ==========================================================================
   BABKE KEBAB & PLATES — SHOPPING CART & CUSTOMIZATION TEMPLATES
   ========================================================================== */

(function() {
  window.BabkeComponents = window.BabkeComponents || {};
  const bc = window.BabkeComponents;

  /* ---------------------------------------------------------------------
     Shared helpers (also consumed by scripts/cart.js so the add-on list has
     exactly one source of truth for ids, labels and prices).
     --------------------------------------------------------------------- */

  // Every data-derived string is escaped before it is interpolated into HTML.
  bc.escapeHtml = function(value) {
    if (value === undefined || value === null) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  // Legacy prices, used only when content.supplements is missing/empty.
  bc.LEGACY_ADDON_PRICE_DEFAULTS = {
    cheddarPrice: 2.0,
    mozzarellaPrice: 5.0,
    friesPrice: 2.0
  };

  // Supplement labels live in the database ({ en, fr, tn }), never in translations.js.
  bc.pickSupplementLabel = function(label, lang) {
    if (typeof label === 'string') return label.trim();
    if (!label || typeof label !== 'object') return '';
    const order = [lang, 'fr', 'en', 'tn'];
    for (let i = 0; i < order.length; i++) {
      const key = order[i];
      if (key && typeof label[key] === 'string' && label[key].trim()) return label[key].trim();
    }
    const keys = Object.keys(label);
    for (let i = 0; i < keys.length; i++) {
      const val = label[keys[i]];
      if (typeof val === 'string' && val.trim()) return val.trim();
    }
    return '';
  };

  /**
   * Normalise BabkeDB.getContent().supplements into a render/price-safe list.
   * Shape in: [{ id, label: { en, fr, tn }, price }]
   * Shape out: [{ id, label: "<resolved for lang>", price: <number> }]
   * Bad rows are dropped rather than rendered with a broken price.
   */
  bc.normalizeSupplements = function(raw, lang) {
    if (!Array.isArray(raw)) return [];
    const seen = Object.create(null);
    const list = [];
    raw.forEach((entry, index) => {
      if (!entry || typeof entry !== 'object') return;
      if (entry.available === false) return;
      const price = Number(entry.price);
      if (!isFinite(price) || price < 0) return;
      const label = bc.pickSupplementLabel(entry.label !== undefined ? entry.label : entry.name, lang);
      if (!label) return;
      let id = (entry.id === undefined || entry.id === null) ? '' : String(entry.id).trim();
      if (!id) id = 'sup-' + index;
      if (seen[id]) return;
      seen[id] = true;
      list.push({ id: id, label: label, price: price });
    });
    return list;
  };

  bc.getCartDrawerHTML = function(txt) {
  return `
    <div class="cart-drawer-overlay" id="cart-drawer-overlay"></div>
    <div class="cart-drawer" id="cart-drawer">
      <div class="cart-drawer-header">
        <h3>${txt.drawer_title}</h3>
        <button class="btn-close-drawer" id="btn-close-drawer" aria-label="Close Cart">&times;</button>
      </div>

      <!-- Checkout Progress Indicator (UX Wizard Upgrade) -->
      <div class="checkout-progress-bar-wrapper">
        <div class="progress-bar-steps">
          <div class="progress-step active" id="step-dot-1">
            <span class="step-num">1</span>
            <span class="step-label">Feast</span>
          </div>
          <div class="progress-step-line" id="step-line-1"></div>
          <div class="progress-step" id="step-dot-2">
            <span class="step-num">2</span>
            <span class="step-label">Details</span>
          </div>
          <div class="progress-step-line" id="step-line-2"></div>
          <div class="progress-step" id="step-dot-3">
            <span class="step-num">3</span>
            <span class="step-label">Confirm</span>
          </div>
        </div>
      </div>

      <!-- STEP 1: Review Items -->
      <div class="checkout-step-panel active" id="checkout-panel-step-1">
        <div class="cart-drawer-items" id="cart-drawer-items">
          <!-- Dynamically populated -->
        </div>
        <div class="cart-drawer-footer">
          <div class="cart-subtotal-row">
            <span>${txt.subtotal}</span>
            <span class="cart-subtotal-val" id="cart-subtotal-val-1">0.0 TND</span>
          </div>
          <button class="btn-checkout-next" id="btn-goto-step-2">
            <span>Next: Details ➔</span>
          </button>
        </div>
      </div>

      <!-- STEP 2: Delivery Details Form -->
      <div class="checkout-step-panel" id="checkout-panel-step-2" style="display:none;">
        <div class="checkout-panel-body" style="padding: 20px; flex: 1; overflow-y: auto;">
          <div class="cart-customer-info-wrapper">
            <div class="cart-input-field">
              <label for="cart-cust-name">${txt.name_label || "Your Name"}</label>
              <input type="text" id="cart-cust-name" placeholder="${txt.name_placeholder || "e.g. Anis..."}" value="">
            </div>
            <div class="cart-input-field">
              <label for="cart-cust-phone">${txt.phone_label || "Phone Number"}</label>
              <input type="tel" id="cart-cust-phone" placeholder="${txt.phone_placeholder || "e.g. +216 98..."}" value="">
            </div>
            <div class="cart-input-field">
              <label for="cart-address">${txt.address_label}</label>
              <input type="text" id="cart-address" placeholder="${txt.address_placeholder}" value="">
            </div>
          </div>
        </div>
        <div class="cart-drawer-footer">
          <div style="display: flex; gap: 12px; width: 100%;">
            <button class="btn-checkout-back" id="btn-back-to-step-1" style="flex: 1; padding: 12px;">
              <span>⬅ Back</span>
            </button>
            <button class="btn-checkout-next" id="btn-goto-step-3" style="flex: 2;">
              <span>Next: Confirm ➔</span>
            </button>
          </div>
        </div>
      </div>

      <!-- STEP 3: Order Confirmation Summary -->
      <div class="checkout-step-panel" id="checkout-panel-step-3" style="display:none;">
        <div class="checkout-panel-body" style="padding: 20px; flex: 1; overflow-y: auto;">
          <div class="order-summary-card glass-card" style="padding: 16px; margin-bottom: 20px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px;">
            <h4 style="margin-top: 0; color: var(--accent-primary); font-family: var(--font-heading); margin-bottom: 12px;">Order Summary</h4>
            <div id="order-summary-items-list" style="margin-bottom: 12px; max-height: 120px; overflow-y: auto; font-size: 0.85rem; line-height: 1.5; color: var(--text-muted);">
              <!-- Summary of items injected here -->
            </div>
            <div class="cart-subtotal-row" style="margin-top:12px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 8px;">
              <span>${txt.subtotal}</span>
              <span class="cart-subtotal-val" id="cart-subtotal-val-3" style="color:var(--accent-primary); font-weight:800;">0.0 TND</span>
            </div>
          </div>

          <div class="delivery-summary-card glass-card" style="padding: 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px;">
            <h4 style="margin-top: 0; color: var(--accent-primary); font-family: var(--font-heading); margin-bottom: 12px;">Delivery Information</h4>
            <p style="margin: 4px 0; font-size: 0.85rem;"><strong style="color:var(--text-primary);">Name:</strong> <span id="summary-cust-name">-</span></p>
            <p style="margin: 4px 0; font-size: 0.85rem;"><strong style="color:var(--text-primary);">Phone:</strong> <span id="summary-cust-phone">-</span></p>
            <p style="margin: 4px 0; font-size: 0.85rem;"><strong style="color:var(--text-primary);">Address:</strong> <span id="summary-cust-address">-</span></p>
          </div>
        </div>
        <div class="cart-drawer-footer">
          <div style="display: flex; gap: 12px; width: 100%; flex-direction: column;">
            <button class="btn-whatsapp-checkout" id="btn-whatsapp-checkout" style="width: 100%;">
              <span>${txt.btn_checkout}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            </button>
            <button class="btn-checkout-back" id="btn-back-to-step-2" style="width: 100%; padding: 12px; background: transparent; border: 1px solid rgba(255,255,255,0.1);">
              <span>⬅ Back to Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
};

  /**
   * @param txt          cart translation strings (trusted, may contain markup)
   * @param prices       content.customizationPrices — legacy fallback only
   * @param supplements  normalised paid add-ons (see bc.normalizeSupplements)
   * @param lang         'en' | 'fr' | 'tn'
   */
  // ----------------------------------------------------
  // INGREDIENTS AU CHOIX, PAR PLAT.
  // Le patron les declare sur le plat dans l'admin (fiche plat ->
  // "Ingredients au choix"). Forme stockee :
  //   modifiers: [{ id, label:{en,fr,tn}, type:'single'|'multi',
  //                 required, max, options:[{ id, label:{en,fr,tn}, price }] }]
  // Un plat sans groupe est servi tel quel : aucune section de choix ne
  // s'affiche, seuls les supplements payants du panier restent proposes.
  // ----------------------------------------------------
  bc.pickModifierLabel = function(label, lang) {
    if (typeof label === 'string') return label;
    if (label && typeof label === 'object') {
      const order = [lang, 'fr', 'en', 'tn'];
      for (let i = 0; i < order.length; i++) {
        const v = label[order[i]];
        if (typeof v === 'string' && v.trim()) return v.trim();
      }
    }
    return '';
  };

  bc.normalizeModifiers = function(raw, lang) {
    if (!Array.isArray(raw)) return [];
    const groups = [];
    raw.forEach(function(g, gi) {
      if (!g || typeof g !== 'object') return;
      const label = bc.pickModifierLabel(g.label, lang);
      const options = (Array.isArray(g.options) ? g.options : []).map(function(o, oi) {
        if (!o || typeof o !== 'object') return null;
        const oLabel = bc.pickModifierLabel(o.label, lang);
        if (!oLabel) return null;
        const price = Number(o.price);
        return {
          id: String(o.id || ('opt-' + gi + '-' + oi)),
          label: oLabel,
          price: (isFinite(price) && price > 0) ? price : 0
        };
      }).filter(Boolean);
      if (!label || !options.length) return;
      const max = Math.max(0, Math.floor(Number(g.max) || 0));
      groups.push({
        id: String(g.id || ('group-' + gi)),
        label: label,
        type: g.type === 'single' ? 'single' : 'multi',
        required: !!g.required,
        max: g.type === 'single' ? 1 : max,
        options: options
      });
    });
    return groups;
  };

  // Reutilise les classes des anciennes sections garniture : meme rendu,
  // meme comportement tactile, aucune CSS nouvelle a maintenir.
  bc.getModifierGroupsHTML = function(modifiers, lang) {
    const groups = bc.normalizeModifiers(modifiers, lang);
    if (!groups.length) return '';
    const esc = bc.escapeHtml;
    const hint = {
      en: { one: 'Choose one', upTo: 'Choose up to', required: 'required' },
      fr: { one: 'Un seul choix', upTo: 'Jusqu\u2019a', required: 'obligatoire' },
      tn: { one: 'اختار واحد', upTo: 'حتى', required: 'ضروري' }
    }[lang] || { one: 'Choose one', upTo: 'Choose up to', required: 'required' };
    return groups.map(function(g) {
      const note = g.type === 'single' ? hint.one : (g.max ? (hint.upTo + ' ' + g.max) : '');
      const marks = [note, g.required ? hint.required : ''].filter(Boolean).join(' \u00b7 ');
      const rows = g.options.map(function(o) {
        const input = g.type === 'single'
          ? '<input type="radio" name="mod-' + esc(g.id) + '" data-mod-group="' + esc(g.id) + '" data-mod-option="' + esc(o.id) + '" data-price="' + o.price + '" value="' + esc(o.label) + '">'
          : '<input type="checkbox" name="mod-' + esc(g.id) + '" data-mod-group="' + esc(g.id) + '" data-mod-option="' + esc(o.id) + '" data-price="' + o.price + '" value="' + esc(o.label) + '">';
        return '<label class="garniture-chip">' + input +
          '<span>' + esc(o.label) + (o.price > 0 ? ' (+' + o.price.toFixed(1) + ' TND)' : '') + '</span></label>';
      }).join('');
      return '<div class="modifier-group" data-mod-group-wrap="' + esc(g.id) + '">' +
        '<h4 class="modifier-group-title">' + esc(g.label) +
        (marks ? ' <span class="modifier-group-note">(' + esc(marks) + ')</span>' : '') + '</h4>' +
        '<div class="garniture-chip-grid">' + rows + '</div></div>';
    }).join('');
  };

  bc.getCustomizationModalHTML = function(txt, prices, supplements, lang) {
    prices = prices || {};
    const esc = bc.escapeHtml;
    const defaults = bc.LEGACY_ADDON_PRICE_DEFAULTS;
    const legacyPrice = (key) => {
      const raw = Number(prices[key]);
      return (isFinite(raw) && raw >= 0) ? raw : defaults[key];
    };
    const cheddarPrice = legacyPrice('cheddarPrice');
    const mozzarellaPrice = legacyPrice('mozzarellaPrice');
    const friesPrice = legacyPrice('friesPrice');

    // Data-driven add-ons. Falls back to the historical cheddar/mozzarella/fries
    // trio so an older database (no content.supplements) still works.
    const addons = Array.isArray(supplements)
      ? supplements
      : bc.normalizeSupplements(supplements, lang);
    const hasAddonData = addons.length > 0;

    const addonRows = addons.map((addon) => `
              <label class="checkbox-option">
                <input type="checkbox" name="addition" data-addon-id="${esc(addon.id)}" data-price="${Number(addon.price)}" value="${esc(addon.label)}">
                <span class="option-name-label">${esc(addon.label)}</span>
                ${addon.price > 0 ? `<span class="option-price-label" style="margin-inline-start:10px; white-space:nowrap;">+${Number(addon.price).toFixed(1)} TND</span>` : ''}
              </label>`).join('');

    // The list can hold a dozen rows: cap it and let it scroll on its own so the
    // modal never overflows on a 390px viewport. No animation is introduced, so
    // prefers-reduced-motion is unaffected.
    const addonsSection = hasAddonData
      ? `<div class="additions-list additions-list-scroll" style="max-height:240px; overflow-y:auto; overscroll-behavior:contain; padding-inline-end:4px;">${addonRows}
            </div>`
      : `<div class="additions-list">
              <label class="checkbox-option">
                <input type="checkbox" name="addition" data-price-key="friesPrice" data-price="${friesPrice}" value="Extra Fries">
                <span class="option-name-label">${txt.add_fries}</span>
                <span class="option-price-label">+${friesPrice.toFixed(1)} TND</span>
              </label>
            </div>`;

    // The paid cheese radios were two of the three hardcoded extras; when real
    // supplement data exists they live in the add-on list instead.
    const cheeseSection = hasAddonData ? '' : `
          <!-- SECTION 4: Garniture — Fromage (radio: one or none) -->
          <div class="modifier-group">
            <h4 class="modifier-group-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13c0-1.1.9-2 2-2h12l2 8H2z"/><path d="M20 11 4.12 4.23"/><path d="M4 13V7.37"/></svg>
              ${txt.modal_cheese_title}
            </h4>
            <div class="garniture-chip-grid cheese-choice">
              <label class="garniture-chip cheese-chip">
                <input type="radio" name="cheese" value="none" data-price="0" checked>
                <span>${txt.garni_no_cheese}</span>
              </label>
              <label class="garniture-chip cheese-chip">
                <input type="radio" name="cheese" value="${esc(txt.garni_cheddar_val)}" data-price-key="cheddarPrice" data-price="${cheddarPrice}">
                <span>${txt.garni_cheddar} ${cheddarPrice > 0 ? `(+${cheddarPrice.toFixed(1)} TND)` : ''}</span>
              </label>
              <label class="garniture-chip cheese-chip">
                <input type="radio" name="cheese" value="${esc(txt.garni_mozza_val)}" data-price-key="mozzarellaPrice" data-price="${mozzarellaPrice}">
                <span>${txt.garni_mozza} ${mozzarellaPrice > 0 ? `(+${mozzarellaPrice.toFixed(1)} TND)` : ''}</span>
              </label>
            </div>
          </div>
`;

  return `
    <div class="customization-modal-overlay" id="customization-modal-overlay">
      <div class="customization-modal glass-card">
        <button class="btn-close-modal" id="btn-close-modal" aria-label="Close Options">&times;</button>
        
        <div class="modal-product-header">
          <h3 id="modal-item-name">Item Name</h3>
          <span class="modal-item-price" id="modal-item-price">0.0 TND</span>
        </div>
        
        <p class="modal-product-desc" id="modal-item-desc"></p>
        
        <form id="customization-form" onsubmit="event.preventDefault();">

          <!-- SECTION 1: Spice Level -->
          <div class="modifier-group">
            <h4 class="modifier-group-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
              ${txt.modal_spice_title}
            </h4>
            <div class="spice-selector-grid">
              <label class="spice-option">
                <input type="radio" name="spice-level" value="Mild" checked>
                <span class="spice-label">${txt.spice_mild}</span>
              </label>
              <label class="spice-option">
                <input type="radio" name="spice-level" value="Medium">
                <span class="spice-label">${txt.spice_medium}</span>
              </label>
              <label class="spice-option">
                <input type="radio" name="spice-level" value="Spicy">
                <span class="spice-label">${txt.spice_spicy}</span>
              </label>
              <label class="spice-option">
                <input type="radio" name="spice-level" value="Fiery Harissa">
                <span class="spice-label">${txt.spice_fiery}</span>
              </label>
            </div>
          </div>

          <!-- SECTIONS 2-3 : les anciens choix gratuits (sauces / legumes),
               identiques pour toute la carte, sont remplaces par les groupes
               declares sur le plat. Rempli a l'ouverture par scripts/cart.js
               (renderDishModifiers) ; vide pour un plat a composition fixe. -->
          <div id="dish-modifier-groups"></div>

${cheeseSection}
          <!-- SECTION 5: Extra Additions (paid, data-driven from content.supplements) -->
          <div class="modifier-group">
            <h4 class="modifier-group-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
              ${txt.modal_add_title}
            </h4>
            ${addonsSection}
          </div>

          <!-- SECTION 6: Special Notes -->
          <div class="modifier-group">
            <h4 class="modifier-group-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              ${txt.modal_notes_title}
            </h4>
            <textarea id="modal-special-notes" rows="2" placeholder="${txt.modal_notes_placeholder}"></textarea>
          </div>

          <!-- Add to Cart Trigger Row -->
          <div class="modal-submit-row">
            <div class="quantity-picker">
              <button type="button" class="btn-qty-dec" id="btn-modal-dec">-</button>
              <span class="qty-val" id="modal-qty-val">1</span>
              <button type="button" class="btn-qty-inc" id="btn-modal-inc">+</button>
            </div>
            
            <button type="button" class="btn-modal-submit" id="btn-modal-submit">
              <span id="modal-btn-submit-label">${txt.modal_btn_add}</span>
              <span class="total-button-price" id="modal-total-button-price">0.0 TND</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
};

})();
