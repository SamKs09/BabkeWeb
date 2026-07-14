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
      name_label: "Full Name",
      name_placeholder: "e.g. Ahmed...",
      phone_label: "Phone Number",
      phone_placeholder: "e.g. +216 98...",
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
      name_label: "Nom Complet",
      name_placeholder: "ex : Sophie...",
      phone_label: "Numéro de Téléphone",
      phone_placeholder: "ex : +216 22...",
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
      name_label: "الاسم الكامل",
      name_placeholder: "مثال: أحمد...",
      phone_label: "رقم تليفونك",
      phone_placeholder: "مثال: +216 98...",
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

    // B. Inject/Replace Shopping Cart Side Drawer & Customization Modal
    let drawerOverlay = document.getElementById('cart-drawer-overlay');
    let drawer = document.getElementById('cart-drawer');
    if (drawerOverlay) drawerOverlay.remove();
    if (drawer) drawer.remove();

    let modalOverlay = document.getElementById('customization-modal-overlay');
    if (modalOverlay) modalOverlay.remove();

    if (typeof BabkeComponents !== 'undefined' && BabkeComponents.getCartDrawerHTML && BabkeComponents.getCustomizationModalHTML) {
      const bodyContainer = document.body;
      
      const tempDiv1 = document.createElement('div');
      tempDiv1.innerHTML = BabkeComponents.getCartDrawerHTML(txt);
      while(tempDiv1.firstChild) bodyContainer.appendChild(tempDiv1.firstChild);

      const tempDiv2 = document.createElement('div');
      tempDiv2.innerHTML = BabkeComponents.getCustomizationModalHTML(txt);
      while(tempDiv2.firstChild) bodyContainer.appendChild(tempDiv2.firstChild);
    }

    // C. Inject/Replace "Add to Order" buttons inside menu cards
    const menuCards = document.querySelectorAll('.menu-item-card');
    menuCards.forEach((card) => {
      const oldRow = card.querySelector('.menu-card-actions-row');
      if (oldRow) oldRow.remove();

      const itemBody = card.querySelector('.menu-item-body');
      if (itemBody) {
        const title = itemBody.querySelector('h3').textContent;
        const priceText = itemBody.querySelector('.menu-item-price').textContent;
        const price = parseFloat(priceText.replace(' TND', ''));
        const desc = itemBody.querySelector('.menu-item-text').textContent;
        const cardId = card.id || 'item-unknown';

        const actionRow = document.createElement('div');
        actionRow.className = 'menu-card-actions-row';
        actionRow.innerHTML = `
          <button class="btn-card-add" data-id="${cardId}" data-name="${title}" data-price="${price}" data-desc="${desc}">
            <span>${txt.btn_card_add}</span>
            <span class="btn-plus-icon">+</span>
          </button>
        `;
        card.appendChild(actionRow);
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
    
    const cartCustNameInput = document.getElementById('cart-cust-name');
    const cartCustPhoneInput = document.getElementById('cart-cust-phone');
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
      const bubble = document.getElementById('btn-cart-toggle');
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

        const name = cartCustNameInput.value.trim();
        const phone = cartCustPhoneInput.value.trim();
        const address = cartAddressInput.value.trim();

        if (!name) {
          alert(getLang() === 'fr' ? "Veuillez spécifier votre nom complet !" : (getLang() === 'tn' ? "عايش خويا أكتب اسمك أولاً!" : "Please specify your full name!"));
          cartCustNameInput.focus();
          return;
        }

        if (!phone) {
          alert(getLang() === 'fr' ? "Veuillez spécifier votre numéro de téléphone !" : (getLang() === 'tn' ? "عايش خويا أكتب رقم تليفونك أولاً!" : "Please specify your phone number!"));
          cartCustPhoneInput.focus();
          return;
        }

        if (!address) {
          alert(getLang() === 'fr' ? "Veuillez spécifier une adresse de livraison !" : (getLang() === 'tn' ? "عايش خويا أكتب عنوان التوصيل أولاً!" : "Please specify a Delivery Address or write 'Dine-In' / 'Pickup'!"));
          cartAddressInput.focus();
          return;
        }

        let subtotal = 0;
        cart.forEach((item) => {
          subtotal += item.itemPrice * item.qty;
        });

        // 1. CAPTURE ORDER RECORD IN LOCAL STORAGE
        const newOrder = {
          id: "ORD-" + Date.now(),
          customer: {
            name: name,
            phone: phone,
            address: address
          },
          items: cart.map(item => ({
            name: item.name,
            qty: item.qty,
            price: item.itemPrice,
            spice: item.spice,
            addons: item.addons,
            exclusions: item.exclusions
          })),
          subtotal: subtotal,
          status: "pending",
          createdAt: new Date().toISOString()
        };

        if (typeof BabkeDB !== 'undefined') {
          BabkeDB.addOrder(newOrder);
        }

        // 2. CONSTRUCT WHATSAPP MESSAGE
        let msg = getLang() === 'fr' ? `*COMMANDE BABKE KEBAB & PLATES*\n` : (getLang() === 'tn' ? `*طلب بَبكي كباب وأطباق*\n` : `*BABKE KEBAB & PLATES ORDER*\n`);
        msg += `=============================\n\n`;
        msg += getLang() === 'fr' ? `*Client :* ${name}\n` : (getLang() === 'tn' ? `*الحريف:* ${name}\n` : `*Customer:* ${name}\n`);
        msg += getLang() === 'fr' ? `*Téléphone :* ${phone}\n\n` : (getLang() === 'tn' ? `*الهاتف:* ${phone}\n\n` : `*Phone:* ${phone}\n\n`);

        cart.forEach((item) => {
          const itemTotal = item.itemPrice * item.qty;
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

        const phoneNo = (typeof BABKE_CONFIG !== 'undefined' ? BABKE_CONFIG.PHONE_NUMBER : "21673821999");
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNo}&text=${encodeURIComponent(msg)}`;
        
        // Clear cart
        cart = [];
        saveCart();
        closeCartDrawer();
        
        // Clear input details
        cartCustNameInput.value = '';
        cartCustPhoneInput.value = '';
        cartAddressInput.value = '';

        window.open(whatsappUrl, '_blank');
      });
    }

    // Dynamic menu card customizer trigger listener
    window.addEventListener('babkeOpenCustomizer', (e) => {
      openCustomizationModal({
        id: e.detail.id,
        name: e.detail.name,
        price: e.detail.price,
        desc: e.detail.desc
      });
    });

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

  // EXPOSE GLOBAL API FOR CHATBOT ADDITIONS
  window.BabkeCart = {
    addDefaultItem(id, name, price, desc) {
      const customKey = `${id}-Mild---`; // default spice Mild, no extras

      const cartItem = {
        key: customKey,
        id: id,
        name: name,
        basePrice: price,
        itemPrice: price,
        qty: 1,
        spice: "Mild",
        addons: [],
        exclusions: [],
        notes: ""
      };

      const existingIndex = cart.findIndex(item => item.key === cartItem.key);
      if (existingIndex > -1) {
        cart[existingIndex].qty += 1;
      } else {
        cart.push(cartItem);
      }

      saveCart();
      
      // Cart bubble pulse animation
      const bubble = document.getElementById('btn-cart-toggle');
      if (bubble) {
        bubble.classList.add('pulse-active');
        setTimeout(() => {
          bubble.classList.remove('pulse-active');
        }, 500);
      }

      // Slide open the cart drawer
      const cartDrawer = document.getElementById('cart-drawer');
      const cartDrawerOverlay = document.getElementById('cart-drawer-overlay');
      if (cartDrawer && cartDrawerOverlay) {
        cartDrawer.classList.add('open');
        cartDrawerOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    }
  };

  window.addEventListener('babkeLangChanged', () => {
    injectCartUI();
  });

  injectCartUI();
  loadCart();
});
