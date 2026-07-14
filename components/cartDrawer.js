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
      <div class="cart-drawer-items" id="cart-drawer-items">
        <!-- Dynamically populated -->
      </div>
      <div class="cart-drawer-footer">
        <div class="cart-subtotal-row">
          <span>${txt.subtotal}</span>
          <span class="cart-subtotal-val" id="cart-subtotal-val">0.0 TND</span>
        </div>
        
        <!-- Customer Info Fields for Order Capture -->
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

        <button class="btn-whatsapp-checkout" id="btn-whatsapp-checkout">
          <span>${txt.btn_checkout}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
        </button>
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
