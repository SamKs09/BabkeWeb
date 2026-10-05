/* ==========================================================================
   BABKE KEBAB & PLATES — DYNAMIC TRANSLATED WHATSAPP CART SYSTEM
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  let cart = [];
  let currentCustomizingItem = null;
  // Paid add-ons currently rendered in the customisation modal, normalised from
  // BabkeDB.getContent().supplements. This snapshot is the price authority for
  // the open modal: what the customer sees is what gets charged.
  let activeSupplements = [];
  // content.customizationPrices — only consulted by the legacy fallback modal.
  let activeLegacyPrices = {};

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
      empty_desc: "Explore our menu and choose your craving to start your charcoal feast.",
      modal_spice_title: "Spice Level <span class=\"required-indicator\">*</span>",
      modal_sauces_title: "Sauces",
      modal_veggies_title: "Vegetables",
      modal_cheese_title: "Cheese (Choose one)",
      modal_add_title: "Extras",
      modal_notes_title: "Special Instructions",
      modal_notes_placeholder: "e.g. Well done, extra harissa on the side...",
      modal_btn_add: "Add to Feast Order",
      btn_card_add: "Add to Order",
      remove: "Remove",

      spice_mild: "Mild",
      spice_medium: "Medium",
      spice_spicy: "Spicy",
      spice_fiery: "Fiery Harissa",

      add_fries: "Extra Crispy Fries",

      garni_toum: "Garlic Sauce", garni_toum_val: "Garlic Sauce",
      garni_houmous: "Houmous", garni_houmous_val: "Houmous",
      garni_harissa: "Harissa", garni_harissa_val: "Harissa",
      garni_tomato: "Tomatoes", garni_tomato_val: "Tomatoes",
      garni_onion: "Onions", garni_onion_val: "Onions",
      garni_cornichon: "Pickles", garni_cornichon_val: "Pickles",
      garni_laitue: "Lettuce", garni_laitue_val: "Lettuce",
      garni_cheddar: "Cheddar", garni_cheddar_val: "Cheddar",
      garni_mozza: "Mozzarella", garni_mozza_val: "Mozzarella",
      garni_no_cheese: "No Cheese"
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
      modal_spice_title: "Niveau d'épice <span class=\"required-indicator\">*</span>",
      modal_sauces_title: "Sauces",
      modal_veggies_title: "Légumes",
      modal_cheese_title: "Fromage (un seul choix)",
      modal_add_title: "Extras",
      modal_notes_title: "Instructions Spéciales",
      modal_notes_placeholder: "ex : Bien cuit, harissa sur le côté...",
      modal_btn_add: "Ajouter au Festin",
      btn_card_add: "Ajouter",
      remove: "Supprimer",

      spice_mild: "Doux",
      spice_medium: "Moyen",
      spice_spicy: "Épicé",
      spice_fiery: "Harissa Intense",

      add_fries: "Supplément Frites Croustillantes",

      garni_toum: "Sauce à l'ail", garni_toum_val: "Sauce Ail",
      garni_houmous: "Houmous", garni_houmous_val: "Houmous",
      garni_harissa: "Harissa", garni_harissa_val: "Harissa",
      garni_tomato: "Tomates", garni_tomato_val: "Tomates",
      garni_onion: "Oignons", garni_onion_val: "Oignons",
      garni_cornichon: "Cornichons", garni_cornichon_val: "Cornichons",
      garni_laitue: "Laitue", garni_laitue_val: "Laitue",
      garni_cheddar: "Cheddar", garni_cheddar_val: "Cheddar",
      garni_mozza: "Mozzarella", garni_mozza_val: "Mozzarella",
      garni_no_cheese: "Sans Fromage"
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
      modal_sauces_title: "الصوصات",
      modal_veggies_title: "الخضر",
      modal_cheese_title: "الجبن (اختار واحد)",
      modal_add_title: "إضافات",
      modal_notes_title: "توصيات خاصة بالطلب",
      modal_notes_placeholder: "مثال: خبز محمر بالباهي، هريسة على شيرة...",
      modal_btn_add: "زيد للطلبية البنينة",
      btn_card_add: "أطلب",
      remove: "نحّي",

      spice_mild: "مش حار",
      spice_medium: "شوية شوية",
      spice_spicy: "محرحر",
      spice_fiery: "بالهريسة العربي الحارة",

      add_fries: "فريت مقرمش إضافي",

      garni_toum: "صوص الثوم", garni_toum_val: "صوص الثوم",
      garni_houmous: "حمص", garni_houmous_val: "حمص",
      garni_harissa: "هريسة", garni_harissa_val: "هريسة",
      garni_tomato: "طماطم", garni_tomato_val: "طماطم",
      garni_onion: "بصل", garni_onion_val: "بصل",
      garni_cornichon: "خيار مخلل", garni_cornichon_val: "خيار مخلل",
      garni_laitue: "لاتو", garni_laitue_val: "لاتو",
      garni_cheddar: "تشيدر", garni_cheddar_val: "تشيدر",
      garni_mozza: "موزاريلا", garni_mozza_val: "موزاريلا",
      garni_no_cheese: "بلاش جبن"
    }
  };

  const getLang = () => localStorage.getItem('babke_lang') || 'en';

  const components = () => (typeof BabkeComponents !== 'undefined' ? BabkeComponents : {});

  // Escape anything data-derived before it is interpolated into HTML.
  const escapeHtml = (value) => {
    const helper = components().escapeHtml;
    if (typeof helper === 'function') return helper(value);
    if (value === undefined || value === null) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const normalizeSupplements = (raw, lang) => {
    const helper = components().normalizeSupplements;
    return typeof helper === 'function' ? helper(raw, lang) : [];
  };

  const getSiteContent = () => {
    if (typeof BabkeDB === 'undefined' || typeof BabkeDB.getContent !== 'function') return {};
    return BabkeDB.getContent() || {};
  };

  /**
   * Price of one selected add-on input. Resolved from the supplement data by id;
   * the DOM data-price is only a last-resort echo of what we rendered, never the
   * client's own idea of a price.
   */
  const resolveAddonPrice = (input) => {
    if (!input) return 0;
    const addonId = input.dataset ? input.dataset.addonId : '';
    if (addonId) {
      const match = activeSupplements.find(sup => sup.id === addonId);
      if (match) return Number(match.price) || 0;
    }
    const priceKey = input.dataset ? input.dataset.priceKey : '';
    if (priceKey) {
      const configured = Number(activeLegacyPrices[priceKey]);
      if (isFinite(configured) && configured >= 0) return configured;
      const defaults = components().LEGACY_ADDON_PRICE_DEFAULTS || {};
      const fallback = Number(defaults[priceKey]);
      return isFinite(fallback) ? fallback : 0;
    }
    const rendered = parseFloat(input.dataset ? input.dataset.price : '');
    return isFinite(rendered) ? rendered : 0;
  };

  // Every checked paid add-on, in the order the modal lists them.
  const collectSelectedAddons = (form) => {
    if (!form) return [];
    const selected = [];
    form.querySelectorAll('input[name="addition"]:checked').forEach((input) => {
      const addonId = (input.dataset && input.dataset.addonId) ? input.dataset.addonId : input.value;
      selected.push({
        id: String(addonId),
        label: input.value,
        price: resolveAddonPrice(input)
      });
    });
    return selected;
  };

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
      const siteContent = getSiteContent();
      activeLegacyPrices = siteContent.customizationPrices || {};
      activeSupplements = normalizeSupplements(siteContent.supplements, lang);

      const tempDiv1 = document.createElement('div');
      tempDiv1.innerHTML = BabkeComponents.getCartDrawerHTML(txt);
      while(tempDiv1.firstChild) bodyContainer.appendChild(tempDiv1.firstChild);

      const tempDiv2 = document.createElement('div');
      tempDiv2.innerHTML = BabkeComponents.getCustomizationModalHTML(txt, activeLegacyPrices, activeSupplements, lang);
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
          <button class="btn-card-add" data-id="${escapeHtml(cardId)}" data-name="${escapeHtml(title)}" data-price="${Number(price)}" data-desc="${escapeHtml(desc)}">
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
      resetCheckoutStep();
    };

    const resetCheckoutStep = () => {
      const p1 = document.getElementById('checkout-panel-step-1');
      const p2 = document.getElementById('checkout-panel-step-2');
      const p3 = document.getElementById('checkout-panel-step-3');
      if (p1) p1.style.display = 'flex';
      if (p2) p2.style.display = 'none';
      if (p3) p3.style.display = 'none';

      const step1 = document.getElementById('step-dot-1');
      const step2 = document.getElementById('step-dot-2');
      const step3 = document.getElementById('step-dot-3');
      const line1 = document.getElementById('step-line-1');
      const line2 = document.getElementById('step-line-2');

      if (step1) step1.className = 'progress-step active';
      if (step2) step2.className = 'progress-step';
      if (step3) step3.className = 'progress-step';
      if (line1) line1.className = 'progress-step-line';
      if (line2) line2.className = 'progress-step-line';
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

    // Wizard navigation controls (UX Upgrade)
    const btnGotoStep2 = document.getElementById('btn-goto-step-2');
    const btnBackToStep1 = document.getElementById('btn-back-to-step-1');
    const btnGotoStep3 = document.getElementById('btn-goto-step-3');
    const btnBackToStep2 = document.getElementById('btn-back-to-step-2');

    if (btnGotoStep2) {
      btnGotoStep2.addEventListener('click', () => {
        if (cart.length === 0) return;
        
        document.getElementById('checkout-panel-step-1').style.display = 'none';
        document.getElementById('checkout-panel-step-2').style.display = 'flex';
        
        document.getElementById('step-dot-1').className = 'progress-step completed';
        document.getElementById('step-line-1').className = 'progress-step-line completed';
        document.getElementById('step-dot-2').className = 'progress-step active';
      });
    }

    if (btnBackToStep1) {
      btnBackToStep1.addEventListener('click', () => {
        document.getElementById('checkout-panel-step-2').style.display = 'none';
        document.getElementById('checkout-panel-step-1').style.display = 'flex';
        
        document.getElementById('step-dot-1').className = 'progress-step active';
        document.getElementById('step-line-1').className = 'progress-step-line';
        document.getElementById('step-dot-2').className = 'progress-step';
      });
    }

    if (btnGotoStep3) {
      btnGotoStep3.addEventListener('click', () => {
        const name = cartCustNameInput.value.trim();
        const phone = cartCustPhoneInput.value.trim();
        const address = cartAddressInput.value.trim();

        if (!name) {
          const msg = getLang() === 'fr' ? "Veuillez spécifier votre nom complet !" : (getLang() === 'tn' ? "عايش خويا أكتب اسمك أولاً!" : "Please specify your full name!");
          if (typeof window.showToast === 'function') window.showToast("⚠️ " + msg);
          else alert(msg);
          cartCustNameInput.focus();
          return;
        }

        if (!phone) {
          const msg = getLang() === 'fr' ? "Veuillez spécifier votre numéro de téléphone !" : (getLang() === 'tn' ? "عايش خويا أكتب رقم تليفونك أولاً!" : "Please specify your phone number!");
          if (typeof window.showToast === 'function') window.showToast("⚠️ " + msg);
          else alert(msg);
          cartCustPhoneInput.focus();
          return;
        }

        if (!address) {
          const msg = getLang() === 'fr' ? "Veuillez spécifier une adresse de livraison !" : (getLang() === 'tn' ? "عايش خويا أكتب عنوان التوصيل أولاً!" : "Please specify a Delivery Address or write 'Dine-In' / 'Pickup'!");
          if (typeof window.showToast === 'function') window.showToast("⚠️ " + msg);
          else alert(msg);
          cartAddressInput.focus();
          return;
        }

        // Fill Confirmation Summary fields
        document.getElementById('summary-cust-name').textContent = name;
        document.getElementById('summary-cust-phone').textContent = phone;
        document.getElementById('summary-cust-address').textContent = address;

        document.getElementById('checkout-panel-step-2').style.display = 'none';
        document.getElementById('checkout-panel-step-3').style.display = 'flex';
        
        document.getElementById('step-dot-2').className = 'progress-step completed';
        document.getElementById('step-line-2').className = 'progress-step-line completed';
        document.getElementById('step-dot-3').className = 'progress-step active';
      });
    }

    if (btnBackToStep2) {
      btnBackToStep2.addEventListener('click', () => {
        document.getElementById('checkout-panel-step-3').style.display = 'none';
        document.getElementById('checkout-panel-step-2').style.display = 'flex';
        
        document.getElementById('step-dot-2').className = 'progress-step active';
        document.getElementById('step-line-2').className = 'progress-step-line';
        document.getElementById('step-dot-3').className = 'progress-step';
      });
    }

    // Les groupes de choix appartiennent au plat : on les relit dans le menu
    // par son id, car les boutons ne portent que id/nom/prix/description.
    const getDishModifiers = (itemDetails) => {
      if (itemDetails && Array.isArray(itemDetails.modifiers)) return itemDetails.modifiers;
      if (typeof BabkeDB === 'undefined' || typeof BabkeDB.getMenu !== 'function') return [];
      const dish = (BabkeDB.getMenu() || []).find((m) => m && m.id === (itemDetails && itemDetails.id));
      return (dish && Array.isArray(dish.modifiers)) ? dish.modifiers : [];
    };

    const renderDishModifiers = (itemDetails) => {
      const host = document.getElementById('dish-modifier-groups');
      if (!host) return [];
      const raw = getDishModifiers(itemDetails);
      const lang = getLang();
      const bc = window.BabkeComponents;
      const groups = (bc && bc.normalizeModifiers) ? bc.normalizeModifiers(raw, lang) : [];
      host.innerHTML = (bc && bc.getModifierGroupsHTML) ? bc.getModifierGroupsHTML(raw, lang) : '';
      return groups;
    };

    // Lit les choix coches, dans l'ordre des groupes du plat.
    const collectModifierChoices = () => {
      const groups = activeDishModifiers || [];
      return groups.map((g) => {
        const picked = [];
        customizationForm.querySelectorAll(
          'input[data-mod-group="' + (window.CSS && CSS.escape ? CSS.escape(g.id) : g.id) + '"]:checked'
        ).forEach((el) => {
          const opt = g.options.find((o) => o.id === el.dataset.modOption);
          picked.push({ id: el.dataset.modOption, label: el.value, price: opt ? opt.price : 0 });
        });
        return { id: g.id, label: g.label, type: g.type, required: g.required, max: g.max, picked: picked };
      });
    };

    let activeDishModifiers = [];

    const openCustomizationModal = (itemDetails) => {
      currentCustomizingItem = itemDetails;
      modalQty = 1;
      modalQtyVal.textContent = modalQty;

      // Rendu AVANT reset() : les champs doivent exister pour etre remis a zero.
      activeDishModifiers = renderDishModifiers(itemDetails);
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

    // Unit price = dish + every selected paid add-on, priced from the data.
    const getCustomizedUnitPrice = () => {
      if (!currentCustomizingItem) return 0;
      let unitPrice = Number(currentCustomizingItem.price) || 0;

      collectSelectedAddons(customizationForm).forEach(addon => {
        unitPrice += addon.price;
      });

      collectModifierChoices().forEach(group => {
        group.picked.forEach(opt => { unitPrice += opt.price; });
      });

      const checkedCheese = customizationForm.querySelector('input[name="cheese"]:checked');
      if (checkedCheese && checkedCheese.value !== 'none') {
        unitPrice += resolveAddonPrice(checkedCheese);
      }

      return unitPrice;
    };

    const updateModalTotalPrice = () => {
      if (!currentCustomizingItem) return;
      const total = getCustomizedUnitPrice() * modalQty;
      const totalEl = document.getElementById('modal-total-button-price');
      if (totalEl) totalEl.textContent = `${total.toFixed(1)} TND`;
    };

    // Delegated so the handler covers every add-on row without one listener each.
    if (customizationForm) {
      customizationForm.addEventListener('change', (e) => {
        const name = e.target && e.target.name;
        const isMod = !!(e.target && e.target.dataset && e.target.dataset.modGroup);
        if (isMod && e.target.type === 'checkbox') enforceModifierMax(e.target);
        if (isMod || name === 'addition' || name === 'cheese') updateModalTotalPrice();
      });
    }

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

    // Un groupe limite a N : la case en trop est refusee tout de suite plutot
    // que de laisser le client decouvrir le probleme en validant.
    const enforceModifierMax = (changed) => {
      const gid = changed.dataset.modGroup;
      const group = (activeDishModifiers || []).find((g) => g.id === gid);
      if (!group || !group.max) return;
      const sel = 'input[data-mod-group="' + (window.CSS && CSS.escape ? CSS.escape(gid) : gid) + '"]:checked';
      const checked = customizationForm.querySelectorAll(sel);
      if (checked.length <= group.max) return;
      changed.checked = false;
      const lang = getLang();
      const msg = {
        en: 'Up to ' + group.max + ' choice(s) for ' + group.label + '.',
        fr: group.label + ' : ' + group.max + ' choix maximum.',
        tn: group.label + ' : ' + group.max + ' كان.'
      };
      if (typeof window.showToast === 'function') window.showToast('⚠️ ' + (msg[lang] || msg.en));
    };

    // Renvoie le premier groupe obligatoire laisse vide, sinon null.
    const firstMissingModifier = () => {
      const groups = collectModifierChoices();
      for (let i = 0; i < groups.length; i++) {
        if (groups[i].required && !groups[i].picked.length) return groups[i];
      }
      return null;
    };

    if (btnModalSubmit) {
      btnModalSubmit.addEventListener('click', () => {
        if (!currentCustomizingItem) return;

        const missing = firstMissingModifier();
        if (missing) {
          const lang = getLang();
          const msg = {
            en: 'Please choose: ' + missing.label,
            fr: 'Choisissez : ' + missing.label,
            tn: 'اختار : ' + missing.label
          };
          if (typeof window.showToast === 'function') window.showToast('⚠️ ' + (msg[lang] || msg.en));
          const wrap = customizationForm.querySelector('[data-mod-group-wrap="' + (window.CSS && CSS.escape ? CSS.escape(missing.id) : missing.id) + '"]');
          if (wrap && wrap.scrollIntoView) wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }

        const spiceLevel = customizationForm.querySelector('input[name="spice-level"]:checked').value;
        
        // Collect sauces
        const sauces = [];
        customizationForm.querySelectorAll('input[name="sauce"]:checked').forEach(cb => sauces.push(cb.value));

        // Collect veggies
        const veggies = [];
        customizationForm.querySelectorAll('input[name="veggie"]:checked').forEach(cb => veggies.push(cb.value));

        // Collect cheese choice (legacy fallback modal only — radio, skip "none")
        const cheeseInput = customizationForm.querySelector('input[name="cheese"]:checked');
        const cheese = (cheeseInput && cheeseInput.value !== 'none') ? cheeseInput.value : '';
        const cheesePrice = cheese ? resolveAddonPrice(cheeseInput) : 0;

        // Collect paid extras (data-driven add-ons, priced from content.supplements)
        const addonItems = collectSelectedAddons(customizationForm);
        const additions = addonItems.map(addon => addon.label);
        const addonsCost = addonItems.reduce((sum, addon) => sum + addon.price, 0);

        // Ingredients choisis sur le plat. Ils partent AUSSI dans `addons`
        // (en texte "Groupe : Ingredient") : le panier, le message WhatsApp et
        // la fiche commande de l'admin lisent deja ce tableau, la cuisine voit
        // donc les choix sans aucun autre changement.
        const modifierGroups = collectModifierChoices().filter(g => g.picked.length);
        const modifierCost = modifierGroups.reduce((sum, g) =>
          sum + g.picked.reduce((s2, o) => s2 + o.price, 0), 0);
        const modifierLabels = modifierGroups.map(g =>
          g.label + ' : ' + g.picked.map(o => o.label).join(', '));
        const modifierChoices = modifierGroups.map(g => ({
          id: g.id,
          label: g.label,
          options: g.picked.map(o => ({ id: o.id, label: o.label, price: o.price }))
        }));

        const totalAddonsCost = addonsCost + cheesePrice + modifierCost;
        const notes = modalSpecialNotes.value.trim();

        // Build garniture summary string for unique cart key. Add-ons are keyed by
        // their stable ids so the same choice merges regardless of display language.
        const garnitureKey = [...sauces, ...veggies, cheese].filter(Boolean).sort().join(',');
        const addonKey = addonItems.map(addon => addon.id).sort().join(',');
        // Deux fois le meme plat avec des ingredients differents = deux lignes.
        const modifierKey = modifierGroups
          .map(g => g.id + ':' + g.picked.map(o => o.id).sort().join('+'))
          .sort().join(',');
        const customKey = `${currentCustomizingItem.id}-${spiceLevel}-${garnitureKey}-${addonKey}-${modifierKey}-${notes}`;

        const cartItem = {
          key: customKey,
          id: currentCustomizingItem.id,
          name: currentCustomizingItem.name,
          basePrice: currentCustomizingItem.price,
          itemPrice: currentCustomizingItem.price + totalAddonsCost,
          qty: modalQty,
          spice: spiceLevel,
          sauces: sauces,
          veggies: veggies,
          cheese: cheese,
          addons: additions.concat(modifierLabels),
          modifierChoices: modifierChoices,
          addonItems: addonItems,
          addonsCost: totalAddonsCost,
          exclusions: [],
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

        // Show toast confirmation (UX Upgrade)
        const currentLang = getLang();
        const addedMsg = {
          en: `Added ${cartItem.qty}x ${cartItem.name} (${cartItem.spice}) to your order!`,
          fr: `Ajouté ${cartItem.qty}x ${cartItem.name} (${cartItem.spice}) à votre panier !`,
          tn: `زدنا ${cartItem.qty}x ${cartItem.name} (${cartItem.spice}) للطلبية البنينة!`
        };
        if (typeof window.showToast === 'function') {
          window.showToast("🔥 " + (addedMsg[currentLang] || addedMsg.en));
        }
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
          const msg = getLang() === 'fr' ? "Veuillez ajouter des articles avant de commander !" : (getLang() === 'tn' ? "أقعد اختار واطلب بنتك قبل ماتبعث!" : "Please add items to your order before checking out!");
          if (typeof window.showToast === 'function') window.showToast("⚠️ " + msg);
          else alert(msg);
          return;
        }

        const name = cartCustNameInput.value.trim();
        const phone = cartCustPhoneInput.value.trim();
        const address = cartAddressInput.value.trim();

        if (!name) {
          const msg = getLang() === 'fr' ? "Veuillez spécifier votre nom complet !" : (getLang() === 'tn' ? "عايش خويا أكتب اسمك أولاً!" : "Please specify your full name!");
          if (typeof window.showToast === 'function') window.showToast("⚠️ " + msg);
          else alert(msg);
          cartCustNameInput.focus();
          return;
        }

        if (!phone) {
          const msg = getLang() === 'fr' ? "Veuillez spécifier votre numéro de téléphone !" : (getLang() === 'tn' ? "عايش خويا أكتب رقم تليفونك أولاً!" : "Please specify your phone number!");
          if (typeof window.showToast === 'function') window.showToast("⚠️ " + msg);
          else alert(msg);
          cartCustPhoneInput.focus();
          return;
        }

        if (!address) {
          const msg = getLang() === 'fr' ? "Veuillez spécifier une adresse de livraison !" : (getLang() === 'tn' ? "عايش خويا أكتب عنوان التوصيل أولاً!" : "Please specify a Delivery Address or write 'Dine-In' / 'Pickup'!");
          if (typeof window.showToast === 'function') window.showToast("⚠️ " + msg);
          else alert(msg);
          cartAddressInput.focus();
          return;
        }

        let subtotal = 0;
        cart.forEach((item) => {
          subtotal += item.itemPrice * item.qty;
        });

        // 1. CAPTURE ORDER RECORD IN LOCAL STORAGE & CACHE
        const orderNum = "ORD-" + Date.now();
        const newOrder = {
          id: orderNum,
          customer: {
            name: name,
            phone: phone,
            address: address
          },
          items: cart.map(item => ({
            name: item.name,
            qty: item.qty,
            price: item.itemPrice,
            basePrice: item.basePrice,
            spice: item.spice,
            addons: item.addons || [],
            // Priced breakdown of the paid add-ons, straight from the menu data.
            addonItems: (item.addonItems || []).map(addon => ({
              id: addon.id,
              label: addon.label,
              price: Number(addon.price) || 0
            })),
            exclusions: item.exclusions
          })),
          subtotal: subtotal,
          status: "pending",
          createdAt: new Date().toISOString()
        };

        // Save last order ID locally so Suivre Commande pre-fills automatically
        try {
          localStorage.setItem('babke_last_order_id', orderNum);
        } catch (e) {
          console.error(e);
        }

        if (typeof BabkeDB !== 'undefined') {
          BabkeDB.addOrder(newOrder);
        }

        // 2. CONSTRUCT WHATSAPP MESSAGE
        let msg = getLang() === 'fr' ? `*COMMANDE BABKE KEBAB & PLATES*\n` : (getLang() === 'tn' ? `*طلب بَبكي كباب وأطباق*\n` : `*BABKE KEBAB & PLATES ORDER*\n`);
        msg += `*N° DE COMMANDE : ${orderNum}*\n`;
        msg += `=============================\n\n`;
        msg += getLang() === 'fr' ? `*Client :* ${name}\n` : (getLang() === 'tn' ? `*الحريف:* ${name}\n` : `*Customer:* ${name}\n`);
        msg += getLang() === 'fr' ? `*Téléphone :* ${phone}\n\n` : (getLang() === 'tn' ? `*الهاتف:* ${phone}\n\n` : `*Phone:* ${phone}\n\n`);

        cart.forEach((item) => {
          const itemTotal = item.itemPrice * item.qty;
          msg += `*${item.qty}x ${item.name}*\n`;
          msg += `   • Spice: ${item.spice}\n`;

          const saucesList = item.sauces && item.sauces.length > 0 ? item.sauces.join(', ') : null;
          const veggiesList = item.veggies && item.veggies.length > 0 ? item.veggies.join(', ') : null;
          const cheeseChoice = item.cheese || null;

          if (saucesList) msg += `   • Sauces: ${saucesList}\n`;
          if (veggiesList) msg += `   • Légumes: ${veggiesList}\n`;
          if (cheeseChoice) msg += `   • Fromage: ${cheeseChoice}\n`;
          
          if (item.addonItems && item.addonItems.length > 0) {
            msg += `   • Extras: ${item.addonItems.map(a => `${a.label} (+${(Number(a.price) || 0).toFixed(1)} TND)`).join(', ')}\n`;
          } else if (item.addons && item.addons.length > 0) {
            msg += `   • Extras: ${item.addons.join(', ')}\n`;
          }
          if (item.exclusions && item.exclusions.length > 0) {
            msg += `   • Sans: ${item.exclusions.join(', ')}\n`;
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
        
        // Clear cart & inputs
        cart = [];
        saveCart();
        closeCartDrawer();
        
        cartCustNameInput.value = '';
        cartCustPhoneInput.value = '';
        cartAddressInput.value = '';

        window.open(whatsappUrl, '_blank');

        if (typeof window.showToast === 'function') {
          window.showToast(`🎉 N° de commande : ${orderNum} (Cliquer sur 'Suivre ma Commande' pour le suivi en direct)`);
        }

        if (window.babkeTrackOrder) {
          setTimeout(() => window.babkeTrackOrder(orderNum), 1200);
        }
      });
    }

    // Order Now / Commander buttons listener (Navbar & Hero)
    const navOrderNowBtn = document.getElementById('btn-nav-order-now');
    const heroOrderDeliveryBtn = document.getElementById('btn-hero-order-delivery');

    const handleOrderNowClick = (e) => {
      e.preventDefault();
      const menuSection = document.getElementById('menu');
      if (menuSection) {
        menuSection.scrollIntoView({ behavior: 'smooth' });
      }
      openCartDrawer();
    };

    if (navOrderNowBtn) navOrderNowBtn.addEventListener('click', handleOrderNowClick);
    if (heroOrderDeliveryBtn) heroOrderDeliveryBtn.addEventListener('click', handleOrderNowClick);

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
    const cartSubtotalVal1 = document.getElementById('cart-subtotal-val-1');
    const cartSubtotalVal3 = document.getElementById('cart-subtotal-val-3');
    const orderSummaryList = document.getElementById('order-summary-items-list');
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
      if (cartSubtotalVal1) cartSubtotalVal1.textContent = "0.0 TND";
      if (cartSubtotalVal3) cartSubtotalVal3.textContent = "0.0 TND";
      
      // UX Wizard: Reset to step 1 automatically when cart is emptied
      const p1 = document.getElementById('checkout-panel-step-1');
      const p2 = document.getElementById('checkout-panel-step-2');
      const p3 = document.getElementById('checkout-panel-step-3');
      if (p1) p1.style.display = 'flex';
      if (p2) p2.style.display = 'none';
      if (p3) p3.style.display = 'none';
      
      const step1 = document.getElementById('step-dot-1');
      const step2 = document.getElementById('step-dot-2');
      const step3 = document.getElementById('step-dot-3');
      const line1 = document.getElementById('step-line-1');
      const line2 = document.getElementById('step-line-2');
      if (step1) step1.className = 'progress-step active';
      if (step2) step2.className = 'progress-step';
      if (step3) step3.className = 'progress-step';
      if (line1) line1.className = 'progress-step-line';
      if (line2) line2.className = 'progress-step-line';
    } else {
      let html = '';
      let subtotal = 0;
      let summaryHtml = '';

      cart.forEach((item, index) => {
        const itemTotal = item.itemPrice * item.qty;
        subtotal += itemTotal;

        // One chip per paid add-on so a dozen of them wrap instead of overflowing.
        let addonsString = '';
        if (item.addonItems && item.addonItems.length > 0) {
          addonsString = item.addonItems.map(addon => {
            const priceLabel = (Number(addon.price) || 0) > 0 ? ` (+${(Number(addon.price) || 0).toFixed(1)} TND)` : '';
            return `<span class="cart-item-detail-tag addition">+ ${escapeHtml(addon.label)}${escapeHtml(priceLabel)}</span>`;
          }).join('');
        } else if (item.addons && item.addons.length > 0) {
          addonsString = `<span class="cart-item-detail-tag addition">+ ${escapeHtml(item.addons.join(', '))}</span>`;
        }
        const saucesString = item.sauces && item.sauces.length > 0 ? `<span class="cart-item-detail-tag sauce">${escapeHtml(item.sauces.join(' · '))}</span>` : '';
        const veggiesString = item.veggies && item.veggies.length > 0 ? `<span class="cart-item-detail-tag veggie">${escapeHtml(item.veggies.join(' · '))}</span>` : '';
        const cheeseString = item.cheese ? `<span class="cart-item-detail-tag cheese">${escapeHtml(item.cheese)}</span>` : '';
        const exclString = item.exclusions && item.exclusions.length > 0 ? `<span class="cart-item-detail-tag exclusion">- ${escapeHtml(item.exclusions.join(', '))}</span>` : '';
        const notesString = item.notes ? `<p class="cart-item-note">Note: "${escapeHtml(item.notes)}"</p>` : '';

        html += `
          <div class="cart-item-card">
            <div class="cart-item-main">
              <div class="cart-item-details">
                <h4>${escapeHtml(item.name)}</h4>
                <div class="cart-item-specs">
                   <span class="cart-item-detail-tag spice">${escapeHtml(item.spice)}</span>
                   ${saucesString}
                   ${veggiesString}
                   ${cheeseString}
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

        const garnitureSummary = [
          ...(item.sauces || []),
          ...(item.veggies || []),
          item.cheese || ''
        ].filter(Boolean);
        const addonLabels = (item.addonItems && item.addonItems.length > 0)
          ? item.addonItems.map(addon => addon.label)
          : (item.addons || []);
        const addonsSummary = addonLabels.length > 0 ? ` (+ ${addonLabels.join(', ')})` : '';
        const garniSummaryStr = garnitureSummary.length > 0 ? `, ${garnitureSummary.join(', ')}` : '';
        summaryHtml += `
          <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.8rem; border-bottom:1px solid rgba(255,255,255,0.02); padding-bottom:4px;">
            <span>${item.qty}x <strong>${escapeHtml(item.name)}</strong> <span style="font-size:0.75rem; color:var(--text-muted);">(${escapeHtml(item.spice)}${escapeHtml(garniSummaryStr)}${escapeHtml(addonsSummary)})</span></span>
            <strong>${itemTotal.toFixed(1)} TND</strong>
          </div>
        `;
      });

      cartDrawerItems.innerHTML = html;
      if (cartSubtotalVal1) cartSubtotalVal1.textContent = `${subtotal.toFixed(1)} TND`;
      if (cartSubtotalVal3) cartSubtotalVal3.textContent = `${subtotal.toFixed(1)} TND`;
      if (orderSummaryList) orderSummaryList.innerHTML = summaryHtml;

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
        addonItems: [],
        addonsCost: 0,
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

      // Show toast confirmation (UX Upgrade)
      const currentLang = getLang();
      const addedMsg = {
        en: `Added ${name} to your order!`,
        fr: `Ajouté ${name} à votre panier !`,
        tn: `زدنا ${name} للطلبية البنينة!`
      };
      if (typeof window.showToast === 'function') {
        window.showToast("🔥 " + (addedMsg[currentLang] || addedMsg.en));
      }
    }
  };

  window.addEventListener('babkeLangChanged', () => {
    injectCartUI();
  });

  window.addEventListener('babkeContentChanged', () => {
    injectCartUI();
  });

  injectCartUI();
  loadCart();
});
