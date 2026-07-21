/* ==========================================================================
   BABKE KEBAB & PLATES — SHOPPING CART & CUSTOMIZATION TEMPLATES
   ========================================================================== */

(function() {
  window.BabkeComponents = window.BabkeComponents || {};
  const bc = window.BabkeComponents;

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

  bc.getCustomizationModalHTML = function(txt) {
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
          <!-- Spice Modifier Selection -->
          <div class="modifier-group">
            <h4 id="modal-spice-header">${txt.modal_spice_title}</h4>
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
          
          <!-- Extra Additions -->
          <div class="modifier-group">
            <h4 id="modal-add-header">${txt.modal_add_title}</h4>
            <div class="additions-list">
              <label class="checkbox-option">
                <input type="checkbox" name="addition" value="Extra Cheddar" data-price="1.5">
                <span class="option-name-label">${txt.add_cheddar}</span>
                <span class="option-price-label">+1.5 TND</span>
              </label>
              <label class="checkbox-option">
                <input type="checkbox" name="addition" value="Extra Toum" data-price="1.0">
                <span class="option-name-label">${txt.add_toum}</span>
                <span class="option-price-label">+1.0 TND</span>
              </label>
              <label class="checkbox-option">
                <input type="checkbox" name="addition" value="Extra Fries" data-price="2.0">
                <span class="option-name-label">${txt.add_fries}</span>
                <span class="option-price-label">+2.0 TND</span>
              </label>
            </div>
          </div>

          <!-- Exclusions -->
          <div class="modifier-group">
            <h4 id="modal-excl-header">${txt.modal_excl_title}</h4>
            <div class="exclusions-list">
              <label class="checkbox-option">
                <input type="checkbox" name="exclusion" value="No Onions">
                <span class="option-name-label">${txt.excl_onions}</span>
              </label>
              <label class="checkbox-option">
                <input type="checkbox" name="exclusion" value="No Pickles">
                <span class="option-name-label">${txt.excl_pickles}</span>
              </label>
            </div>
          </div>

          <!-- Extra Notes -->
          <div class="modifier-group">
            <h4 id="modal-notes-header">${txt.modal_notes_title}</h4>
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
