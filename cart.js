/* ==========================================================================
   BABKE KEBAB & PLATES — DYNAMIC TRANSLATED WHATSAPP CART SYSTEM
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  let cart = [];
  let currentCustomizingItem = null;

  // Cart Translation Strings (Emojis Removed)
  const cartTranslations = {
    en: {
      drawer_title: "YOUR FEAST ORDER",
      close: "Close",
      subtotal: "Subtotal:",
      address_label: "Delivery Address (Or type \"Dine-In / Pickup\")",
      address_placeholder: "e.g. Hammam Sousse, Near Monoprix...",
      btn_checkout: "Send Order via WhatsApp",
      empty_title: "Your plate is empty",
      empty_desc: "Explore our loaded menu and choose your craving to start your charcoal feast.",
      modal_spice_title: "Choose Spice Level <span class=\"required-indicator\">*</span>",
      modal_add_title: "Customize Your Bite (Additions)",
      modal_excl_title: "Exclusions (No Thanks)",
      modal_notes_title: "Special Instructions",
      modal_notes_placeholder: "e.g. Well done wrap, extra harissa on the side...",
      modal_btn_add: "Add to Feast Order",
      btn_card_add: "Add to Order",
      remove: "Remove",
      
      spice_mild: "Mild",
      spice_medium: "Medium",
      spice_spicy: "Spicy",
      spice_fiery: "Fiery Harissa",
      
      add_cheddar: "Extra Cheddar Cheese",
      add_toum: "Extra Garlic Toum",
      add_fries: "Extra Crispy Fries",
      
      excl_onions: "No Onions",
      excl_pickles: "No Pickles"
    },
    fr: {
      drawer_title: "VOTRE COMMANDE",
      close: "Fermer",
      subtotal: "Sous-total :",
      address_label: "Adresse de Livraison (Ou écrivez \"Sur Place / À Emporter\")",
      address_placeholder: "ex : Hammam Sousse, près du Monoprix...",
      btn_checkout: "Commander via WhatsApp",
      empty_title: "Votre assiette est vide",
      empty_desc: "Explorez notre menu et choisissez votre envie pour commencer votre festin au charbon.",
      modal_spice_title: "Choisissez le niveau d'épice <span class=\"required-indicator\">*</span>",
      modal_add_title: "Personnalisez votre bouchée (Ajouts)",
      modal_excl_title: "Exclusions (Sans oignon/pickle)",
      modal_notes_title: "Instructions Spéciales",
      modal_notes_placeholder: "ex : Wrap bien cuit, harissa sur le côté...",
      modal_btn_add: "Ajouter au Festin",
      btn_card_add: "Ajouter",
      remove: "Supprimer",
      
      spice_mild: "Doux",
      spice_medium: "Moyen",
      spice_spicy: "Épicé",
      spice_fiery: "Harissa Intense",
      
      add_cheddar: "Supplément Cheddar",
      add_toum: "Supplément Toum d'Ail",
      add_fries: "Supplément Frites Croustillantes",
      
      excl_onions: "Sans Oignon",
      excl_pickles: "Sans Cornichon"
    },
    tn: {
      drawer_title: "طلبيتك البنينة",
      close: "سكر",
      subtotal: "المجموع الكلي:",
      address_label: "عنوان التوصيل (أو اكتب \"تاكل لهنا / متعدي\")",
      address_placeholder: "مثال: حمام سوسة، بجنب المونبري...",
      btn_checkout: "أبعث الطلبية عالواتساب",
      empty_title: "صحنك مازال فارغ",
      empty_desc: "شوف المنيو المحرحر واختار شهوتك باش تبدا شواك البنين عالجمر.",
      modal_spice_title: "اختار مستوى الحرورة <span class=\"required-indicator\">*</span>",
      modal_add_title: "زيد بنة على بنة (إضافات)",
      modal_excl_title: "ماتحطليش (بلاش)",
      modal_notes_title: "توصيات خاصة بالطلب",
      modal_notes_placeholder: "مثال: خبز محمر بالباهي، هريسة على شيرة...",
      modal_btn_add: "زيد للطلبية البنينة",
      btn_card_add: "أطلب",
      remove: "نحّي",
      
      spice_mild: "مش حار",
      spice_medium: "شوية شوية",
      spice_spicy: "محرحر",
      spice_fiery: "بالهريسة العربي الحارة",
      
      add_cheddar: "جبن تشيدر إضافي",
      add_toum: "ثومية إضافية بنينة",
      add_fries: "فريت مقرمش إضافي",
      
      excl_onions: "بلاش بصل",
      excl_pickles: "بلاش خيار مخلل"
    }
  };

  const getLang = () => localStorage.getItem('babke_lang') || 'en';

  // Initialize Cart from LocalStorage
  const loadCart = () => {
    const savedCart = localStorage.getItem('babke_cart');
    if (savedCart) {
      try {
        cart = JSON.parse(savedCart);
      } catch (e) {
        cart = [];
      }
    }
    updateCartUI();
  };

  const saveCart = () => {
    localStorage.setItem('babke_cart', JSON.stringify(cart));
    updateCartUI();
  };

  // 1. DYNAMICALLY INJECT BUTTONS AND CART UI IN index.html
  const injectCartUI = () => {
    const lang = getLang();
    const txt = cartTranslations[lang];

    // A. Inject cart bubble/icon inside navbar actions (if not already there)
    let cartBubbleWrapper = document.querySelector('.cart-bubble-wrapper');
    if (!cartBubbleWrapper) {
      const navActions = document.querySelector('.nav-actions');
      if (navActions) {
        cartBubbleWrapper = document.createElement('div');
        cartBubbleWrapper.className = 'cart-bubble-wrapper';
        cartBubbleWrapper.innerHTML = `
          <button class="btn-cart-toggle" id="btn-cart-toggle" aria-label="Open Order Cart">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
            </svg>
            <span class="cart-count">0</span>
          </button>
        `;
        // Insert right before theme toggle button
        const themeToggle = document.getElementById('theme-toggle-btn');
        if (themeToggle) {
          navActions.insertBefore(cartBubbleWrapper, themeToggle);
        } else {
          navActions.appendChild(cartBubbleWrapper);
        }
      }
    }

    // A2. Inject cart bubble/icon inside mobile nav menu drawer (if not already there)
    let cartMobileWrapper = document.querySelector('.cart-mobile-wrapper');
    if (cartMobileWrapper) cartMobileWrapper.remove();
    
    const navMenu = document.getElementById('nav-menu');
    if (navMenu) {
      cartMobileWrapper = document.createElement('div');
      cartMobileWrapper.className = 'cart-mobile-wrapper';
      cartMobileWrapper.innerHTML = `
        <button class="btn-cart-toggle-mobile" id="btn-cart-toggle-mobile" aria-label="Open Order Cart Mobile">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
          </svg>
          <span>${txt.drawer_title}</span>
          <span class="cart-count">0</span>
        </button>
      `;
      navMenu.appendChild(cartMobileWrapper);
    }

    // B. Inject/Replace Shopping Cart Side Drawer
    let drawerOverlay = document.getElementById('cart-drawer-overlay');
    let drawer = document.getElementById('cart-drawer');
    
    if (drawerOverlay) drawerOverlay.remove();
    if (drawer) drawer.remove();

    const cartDrawerHTML = `
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
          
          <div class="cart-address-input-wrapper">
            <label for="cart-address">${txt.address_label}</label>
            <input type="text" id="cart-address" placeholder="${txt.address_placeholder}" value="">
          </div>

          <button class="btn-whatsapp-checkout" id="btn-whatsapp-checkout">
            <span>${txt.btn_checkout}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </button>
        </div>
      </div>
    `;

    const bodyContainer = document.body;
    const tempDiv1 = document.createElement('div');
    tempDiv1.innerHTML = cartDrawerHTML;
    while(tempDiv1.firstChild) bodyContainer.appendChild(tempDiv1.firstChild);

    // C. Inject/Replace Customization Modal
    let modalOverlay = document.getElementById('customization-modal-overlay');
    if (modalOverlay) modalOverlay.remove();

    const customizationModalHTML = `
      <div class="customization-modal-overlay" id="customization-modal-overlay">
        <div class="customization-modal glass-card">
          <button class="btn-close-modal" id="btn-close-modal" aria-label="Close Options">&times;</button>
          
          <div class="modal-product-header">
            <h3 id="modal-item-name">Chicken Shawarma Wrap</h3>
            <span class="modal-item-price" id="modal-item-price">12.5 TND</span>
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
                <span class="total-button-price" id="modal-total-button-price">12.5 TND</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const tempDiv2 = document.createElement('div');
    tempDiv2.innerHTML = customizationModalHTML;
    while(tempDiv2.firstChild) document.body.appendChild(tempDiv2.firstChild);

    // D. Inject/Replace "Add to Order" buttons inside menu cards
    const menuCards = document.querySelectorAll('.menu-item-card');
    menuCards.forEach((card, index) => {
      const oldRow = card.querySelector('.menu-card-actions-row');
      if (oldRow) oldRow.remove();

      const itemBody = card.querySelector('.menu-item-body');
      if (itemBody) {
        const title = itemBody.querySelector('h3').textContent;
        const priceText = itemBody.querySelector('.menu-item-price').textContent;
        const price = parseFloat(priceText.replace(' TND', ''));
        const desc = itemBody.querySelector('.menu-item-text').textContent;

        const actionRow = document.createElement('div');
        actionRow.className = 'menu-card-actions-row';
        actionRow.innerHTML = `
          <button class="btn-card-add" data-id="item-${index}" data-name="${title}" data-price="${price}" data-desc="${desc}">
            <span>${txt.btn_card_add}</span>
            <span class="btn-plus-icon">+</span>
          </button>
        `;
        itemBody.appendChild(actionRow);
      }
    });

    bindCartEvents();
  };

  // 2. BIND DOM EVENT LISTENERS
  const bindCartEvents = () => {
    const btnCartToggle = document.getElementById('btn-cart-toggle');
    const cartDrawer = document.getElementById('cart-drawer');
    const cartDrawerOverlay = document.getElementById('cart-drawer-overlay');
    const btnCloseDrawer = document.getElementById('btn-close-drawer');
    const btnWhatsappCheckout = document.getElementById('btn-whatsapp-checkout');
    const cartAddressInput = document.getElementById('cart-address');

    const customizationModalOverlay = document.getElementById('customization-modal-overlay');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const modalQtyVal = document.getElementById('modal-qty-val');
    const btnModalDec = document.getElementById('btn-modal-dec');
    const btnModalInc = document.getElementById('btn-modal-inc');
    const btnModalSubmit = document.getElementById('btn-modal-submit');
    const modalSpecialNotes = document.getElementById('modal-special-notes');
    const customizationForm = document.getElementById('customization-form');

    let modalQty = 1;

    const openCartDrawer = () => {
      cartDrawer.classList.add('open');
      cartDrawerOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    const closeCartDrawer = () => {
      cartDrawer.classList.remove('open');
      cartDrawerOverlay.classList.remove('open');
      document.body.style.overflow = '';
    };

    if (btnCartToggle) btnCartToggle.addEventListener('click', openCartDrawer);
    
    const btnCartToggleMobile = document.getElementById('btn-cart-toggle-mobile');
    if (btnCartToggleMobile) {
      btnCartToggleMobile.addEventListener('click', () => {
        const burgerMenuBtn = document.getElementById('burger-menu');
        const navMenu = document.getElementById('nav-menu');
        if (burgerMenuBtn) burgerMenuBtn.classList.remove('open');
        if (navMenu) navMenu.classList.remove('open');
        setTimeout(openCartDrawer, 300);
      });
    }
    
    if (btnCloseDrawer) btnCloseDrawer.addEventListener('click', closeCartDrawer);
    if (cartDrawerOverlay) cartDrawerOverlay.addEventListener('click', closeCartDrawer);

    const openCustomizationModal = (itemDetails) => {
      currentCustomizingItem = itemDetails;
      modalQty = 1;
      modalQtyVal.textContent = modalQty;

      customizationForm.reset();
      modalSpecialNotes.value = '';

      document.getElementById('modal-item-name').textContent = itemDetails.name;
      document.getElementById('modal-item-price').textContent = `${itemDetails.price.toFixed(1)} TND`;
      document.getElementById('modal-item-desc').textContent = itemDetails.desc;

      updateModalTotalPrice();
      customizationModalOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    const closeCustomizationModal = () => {
      customizationModalOverlay.classList.remove('open');
      currentCustomizingItem = null;
      if (!cartDrawer.classList.contains('open')) {
        document.body.style.overflow = '';
      }
    };

    if (btnCloseModal) btnCloseModal.addEventListener('click', closeCustomizationModal);
    if (customizationModalOverlay) {
      customizationModalOverlay.addEventListener('click', (e) => {
        if (e.target === customizationModalOverlay) {
          closeCustomizationModal();
        }
      });
    }

    const updateModalTotalPrice = () => {
      if (!currentCustomizingItem) return;
      let basePrice = currentCustomizingItem.price;
      
      const checkedAdditions = customizationForm.querySelectorAll('input[name="addition"]:checked');
      checkedAdditions.forEach(checkbox => {
        basePrice += parseFloat(checkbox.dataset.price);
      });

      const total = basePrice * modalQty;
      document.getElementById('modal-total-button-price').textContent = `${total.toFixed(1)} TND`;
    };

    customizationForm.querySelectorAll('input[name="addition"]').forEach(checkbox => {
      checkbox.addEventListener('change', updateModalTotalPrice);
    });

    if (btnModalInc) {
      btnModalInc.addEventListener('click', () => {
        modalQty++;
        modalQtyVal.textContent = modalQty;
        updateModalTotalPrice();
      });
    }

    if (btnModalDec) {
      btnModalDec.addEventListener('click', () => {
        if (modalQty > 1) {
          modalQty--;
          modalQtyVal.textContent = modalQty;
          updateModalTotalPrice();
        }
      });
    }

    const addButtons = document.querySelectorAll('.btn-card-add');
    addButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dataset = e.currentTarget.dataset;
        openCustomizationModal({
          id: dataset.id,
          name: dataset.name,
          price: parseFloat(dataset.price),
          desc: dataset.desc
        });
      });
    });

    if (btnModalSubmit) {
      btnModalSubmit.addEventListener('click', () => {
        if (!currentCustomizingItem) return;

        const spiceLevel = customizationForm.querySelector('input[name="spice-level"]:checked').value;
        
        const additions = [];
        const checkedAdditions = customizationForm.querySelectorAll('input[name="addition"]:checked');
        let addonsCost = 0;
        checkedAdditions.forEach(checkbox => {
          additions.push(checkbox.value);
          addonsCost += parseFloat(checkbox.dataset.price);
        });

        const exclusions = [];
        const checkedExclusions = customizationForm.querySelectorAll('input[name="exclusion"]:checked');
        checkedExclusions.forEach(checkbox => {
          exclusions.push(checkbox.value);
        });

        const notes = modalSpecialNotes.value.trim();
        const customKey = `${currentCustomizingItem.id}-${spiceLevel}-${additions.sort().join(',')}-${exclusions.sort().join(',')}-${notes}`;

        const cartItem = {
          key: customKey,
          id: currentCustomizingItem.id,
          name: currentCustomizingItem.name,
          basePrice: currentCustomizingItem.price,
          itemPrice: currentCustomizingItem.price + addonsCost,
          qty: modalQty,
          spice: spiceLevel,
          addons: additions,
          exclusions: exclusions,
          notes: notes
        };

        const existingIndex = cart.findIndex(item => item.key === cartItem.key);
        if (existingIndex > -1) {
          cart[existingIndex].qty += cartItem.qty;
        } else {
          cart.push(cartItem);
        }

        saveCart();
        closeCustomizationModal();
        triggerCartNotification();
        openCartDrawer();
      });
    }

    const triggerCartNotification = () => {
      const bubble = document.querySelector('.btn-cart-toggle');
      if (bubble) {
        bubble.classList.add('pulse-active');
        setTimeout(() => {
          bubble.classList.remove('pulse-active');
        }, 500);
      }
    };

    if (btnWhatsappCheckout) {
      btnWhatsappCheckout.addEventListener('click', () => {
        if (cart.length === 0) {
          alert(getLang() === 'fr' ? "Veuillez ajouter des articles avant de commander !" : (getLang() === 'tn' ? "أقعد اختار واطلب بنتك قبل ماتبعث!" : "Please add items to your order before checking out!"));
          return;
        }

        const address = cartAddressInput.value.trim();
        if (!address) {
          alert(getLang() === 'fr' ? "Veuillez spécifier une adresse de livraison !" : (getLang() === 'tn' ? "عايش خويا أكتب عنوان التوصيل أولاً!" : "Please specify a Delivery Address or write 'Dine-In' / 'Pickup' to submit your order!"));
          cartAddressInput.focus();
          return;
        }

        let msg = getLang() === 'fr' ? `*COMMANDE BABKE KEBAB & PLATES*\n` : (getLang() === 'tn' ? `*طلب بَبكي كباب وأطباق*\n` : `*BABKE KEBAB & PLATES ORDER*\n`);
        msg += `=============================\n\n`;

        let subtotal = 0;
        cart.forEach((item, index) => {
          const itemTotal = item.itemPrice * item.qty;
          subtotal += itemTotal;

          msg += `*${item.qty}x ${item.name}*\n`;
          msg += `   • Spice: ${item.spice}\n`;
          
          if (item.addons.length > 0) {
            msg += `   • Add: ${item.addons.join(', ')}\n`;
          }
          if (item.exclusions.length > 0) {
            msg += `   • Exclude: ${item.exclusions.join(', ')}\n`;
          }
          if (item.notes) {
            msg += `   • Note: "${item.notes}"\n`;
          }
          msg += `   *Price: ${itemTotal.toFixed(1)} TND*\n\n`;
        });

        msg += `=============================\n`;
        msg += getLang() === 'fr' ? `*Sous-total : ${subtotal.toFixed(1)} TND*\n` : (getLang() === 'tn' ? `*المجموع الكلي: ${subtotal.toFixed(1)} د.ت*\n` : `*Subtotal: ${subtotal.toFixed(1)} TND*\n`);
        msg += getLang() === 'fr' ? `*Adresse/Table :* ${address}\n\n` : (getLang() === 'tn' ? `*العنوان/الطاولة:* ${address}\n\n` : `*Delivery/Table:* ${address}\n\n`);
        msg += `Built via Babke Kebab & Plates Website`;

        const phoneNumber = "21673821999";
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(msg)}`;
        window.open(whatsappUrl, '_blank');
      });
    }

    updateCartUI();
  };

  // 3. UI RENDERING AND SYNCHRONIZATION
  const updateCartUI = () => {
    const lang = getLang();
    const txt = cartTranslations[lang];
    const cartDrawerItems = document.getElementById('cart-drawer-items');
    const cartSubtotalVal = document.getElementById('cart-subtotal-val');
    if (!cartDrawerItems) return;

    const countBadges = document.querySelectorAll('.cart-count');
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    countBadges.forEach(badge => {
      badge.textContent = totalQty;
      if (totalQty > 0) {
        badge.classList.add('visible');
      } else {
        badge.classList.remove('visible');
      }
    });

    if (cart.length === 0) {
      cartDrawerItems.innerHTML = `
        <div class="empty-cart-message">
          <p>${txt.empty_title}</p>
          <span>${txt.empty_desc}</span>
        </div>
      `;
      cartSubtotalVal.textContent = "0.0 TND";
    } else {
      let html = '';
      let subtotal = 0;

      cart.forEach((item, index) => {
        const itemTotal = item.itemPrice * item.qty;
        subtotal += itemTotal;

        const addonsString = item.addons.length > 0 ? `<span class="cart-item-detail-tag addition">+ ${item.addons.join(', ')}</span>` : '';
        const exclString = item.exclusions.length > 0 ? `<span class="cart-item-detail-tag exclusion">- ${item.exclusions.join(', ')}</span>` : '';
        const notesString = item.notes ? `<p class="cart-item-note">Note: "${item.notes}"</p>` : '';

        html += `
          <div class="cart-item-card">
            <div class="cart-item-main">
              <div class="cart-item-details">
                <h4>${item.name}</h4>
                <div class="cart-item-specs">
                  <span class="cart-item-detail-tag spice">${item.spice}</span>
                  ${addonsString}
                  ${exclString}
                </div>
                ${notesString}
              </div>
              <div class="cart-item-price-col">
                <span>${itemTotal.toFixed(1)} TND</span>
              </div>
            </div>
            <div class="cart-item-actions">
              <div class="quantity-picker small">
                <button type="button" class="btn-qty-dec-cart" data-index="${index}">-</button>
                <span class="qty-val">${item.qty}</span>
                <button type="button" class="btn-qty-inc-cart" data-index="${index}">+</button>
              </div>
              <button class="btn-cart-remove" data-index="${index}">${txt.remove}</button>
            </div>
          </div>
        `;
      });

      cartDrawerItems.innerHTML = html;
      cartSubtotalVal.textContent = `${subtotal.toFixed(1)} TND`;

      const decButtons = document.querySelectorAll('.btn-qty-dec-cart');
      const incButtons = document.querySelectorAll('.btn-qty-inc-cart');
      const removeButtons = document.querySelectorAll('.btn-cart-remove');

      decButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.dataset.index);
          if (cart[idx].qty > 1) {
            cart[idx].qty--;
            saveCart();
          } else {
            cart.splice(idx, 1);
            saveCart();
          }
        });
      });

      incButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.dataset.index);
          cart[idx].qty++;
          saveCart();
        });
      });

      removeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.dataset.index);
          cart.splice(idx, 1);
          saveCart();
        });
      });
    }
  };

  window.addEventListener('babkeLangChanged', () => {
    injectCartUI();
  });

  injectCartUI();
  loadCart();
});
