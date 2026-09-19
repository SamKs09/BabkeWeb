/* ==========================================================================
   BABKE KEBAB & PLATES — FOOD RECOMMENDATION CHATBOT LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  let chatState = {
    isOpen: false,
    step: 'welcome', // welcome, budget, preference, finished
    userName: '',
    budget: null, // null, or a bucket from computeBudgetBuckets() / ANY_BUDGET
    preference: null // 'spicy', 'cheese', 'vegan', 'grill', 'any'
  };

  // Budget buckets offered at the last budget prompt (derived from the live menu).
  let budgetBuckets = [];
  const ANY_BUDGET = { code: 'any', lo: -Infinity, hi: Infinity, min: null, max: null };

  const SUPPORTED_LANGS = ['en', 'fr', 'tn'];
  const getLang = () => {
    let lang = null;
    try { lang = localStorage.getItem('babke_lang'); } catch (e) { /* storage blocked */ }
    return SUPPORTED_LANGS.indexOf(lang) > -1 ? lang : 'en';
  };

  // Escape any admin-editable or user-typed value before it is interpolated into innerHTML
  const esc = (value) => String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  // Honour prefers-reduced-motion for programmatic scrolling
  const scrollBehavior = () => (
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  );

  /* ---------------------------------------------------------------------
     Strings owned by this file. Everything else comes from
     BabkeComponents.chatbotTranslations (components/foodChatbot.js), which
     wins on any key clash so it stays the single source of truth.
     --------------------------------------------------------------------- */
  const localTranslations = {
    en: {
      opt_budget_tier_low: 'Smaller budget',
      opt_budget_tier_mid: 'Mid budget',
      opt_budget_tier_high: 'Bigger budget',
      budget_range: '{min} to {max} TND',
      budget_single: '{min} TND',
      msg_results_outside_budget: "Nothing in that price range matches that taste, so here are the closest matches just outside it:",
      msg_results_taste_not_found: "I couldn't find a dish on our menu matching that taste. Here is what fits your budget instead:",
      msg_menu_unavailable: "Our menu is being updated right now. Please try again in a moment!"
    },
    fr: {
      opt_budget_tier_low: 'Petit budget',
      opt_budget_tier_mid: 'Budget moyen',
      opt_budget_tier_high: 'Grand budget',
      budget_range: '{min} à {max} TND',
      budget_single: '{min} TND',
      msg_results_outside_budget: "Rien dans cette gamme de prix ne correspond à ce goût, voici donc les plats les plus proches, juste au-delà :",
      msg_results_taste_not_found: "Je n'ai trouvé aucun plat de notre carte correspondant à ce goût. Voici plutôt ce qui entre dans votre budget :",
      msg_menu_unavailable: "Notre carte est en cours de mise à jour. Réessayez dans un instant !"
    },
    tn: {
      opt_budget_tier_low: 'ميزانية صغيرة',
      opt_budget_tier_mid: 'ميزانية متوسطة',
      opt_budget_tier_high: 'ميزانية كبيرة',
      budget_range: 'من {min} حتى {max} د.ت',
      budget_single: '{min} د.ت',
      msg_results_outside_budget: "مالقيتش طبق بهالذوق في هالميزانية، هاذم أقرب الأطباق ليها:",
      msg_results_taste_not_found: "مالقيتش طبق في المنيو متاعنا بهالذوق. هاذم الأطباق اللي تدخل في ميزانيتك:",
      msg_menu_unavailable: "المنيو قاعد يتحدّث توّا. عاود جرّب بعد شوية!"
    }
  };

  const getTranslations = (lang) => {
    const shared = (typeof BabkeComponents !== 'undefined' && BabkeComponents.chatbotTranslations) || {};
    // Most specific wins: shared[lang] > local[lang] > shared.en > local.en
    return Object.assign({}, localTranslations.en, shared.en || {}, localTranslations[lang] || {}, shared[lang] || {});
  };

  // Fill {placeholders}; a function replacer so "$&"-style sequences stay literal
  const fill = (template, values) => String(template || '').replace(/\{(\w+)\}/g, (whole, key) => (
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : whole
  ));

  /* ---------------------------------------------------------------------
     Menu helpers
     --------------------------------------------------------------------- */
  const priceOf = (item) => Number(item && item.price);

  // Only dishes a guest can actually order are recommended or used for buckets.
  const getOrderablePool = (menu) => (Array.isArray(menu) ? menu : []).filter(item => (
    item && item.id && isFinite(priceOf(item)) && priceOf(item) >= 0 && item.available !== false
  ));

  const withMenu = (callback) => {
    if (typeof BabkeDB === 'undefined') {
      console.error("BabkeDB is not loaded.");
      callback([]);
      return;
    }
    if (BabkeDB.cache || typeof BabkeDB.init !== 'function') {
      callback(BabkeDB.getMenu());
      return;
    }
    BabkeDB.init().then(() => callback(BabkeDB.getMenu()), () => callback([]));
  };

  const pickLoc = (field, lang) => {
    if (field == null) return '';
    if (typeof field === 'string') return field;
    if (typeof field === 'object') return field[lang] || field.en || field.fr || field.tn || '';
    return '';
  };

  // Every language's text for a field, so filters give the same dishes in en/fr/tn.
  const allText = (field) => {
    if (field == null) return '';
    if (typeof field === 'string') return field;
    if (Array.isArray(field)) return field.map(allText).join(' ');
    if (typeof field === 'object') return SUPPORTED_LANGS.map(k => allText(field[k])).join(' ');
    return '';
  };

  // TND has millimes, so keep up to 3 decimals and drop trailing zeros (26 -> "26", 8.5 -> "8.5")
  const formatAmount = (value) => String(Math.round(value * 1000) / 1000);

  /**
   * Split the live menu's prices into up to three non-empty, contiguous buckets.
   * Cut points are always real menu prices, chosen so the buckets hold roughly
   * equal numbers of dishes, and dishes sharing a price always share a bucket.
   * Bucket i matches lo <= price < hi; the outer buckets are open-ended, so the
   * buckets partition every possible price.
   */
  const computeBudgetBuckets = (pool) => {
    const prices = pool.map(priceOf).sort((a, b) => a - b);
    const distinct = prices.filter((p, i) => i === 0 || p !== prices[i - 1]);
    const count = Math.min(3, distinct.length);
    if (count < 2) return []; // one price (or none): the "show all" option covers it

    const cuts = [];
    let minIdx = 1;
    for (let k = 1; k < count; k++) {
      const target = Math.round(prices.length * k / count);
      const maxIdx = distinct.length - (count - k); // leave a distinct price for each later bucket
      let bestIdx = minIdx;
      let bestDiff = Infinity;
      for (let i = minIdx; i <= maxIdx; i++) {
        const below = prices.filter(p => p < distinct[i]).length;
        const diff = Math.abs(below - target);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestIdx = i;
        }
      }
      cuts.push(distinct[bestIdx]);
      minIdx = bestIdx + 1;
    }

    const tiers = count === 3 ? ['low', 'mid', 'high'] : ['low', 'high'];
    const bounds = [-Infinity].concat(cuts, [Infinity]);

    return tiers.map((tier, i) => {
      const lo = bounds[i];
      const hi = bounds[i + 1];
      const inBucket = prices.filter(p => p >= lo && p < hi);
      return { code: tier, lo, hi, min: inBucket[0], max: inBucket[inBucket.length - 1] };
    });
  };

  const budgetLabel = (bucket, t) => {
    const tierName = t['opt_budget_tier_' + bucket.code] || '';
    const range = bucket.min === bucket.max
      ? fill(t.budget_single, { min: formatAmount(bucket.min) })
      : fill(t.budget_range, { min: formatAmount(bucket.min), max: formatAmount(bucket.max) });
    return tierName ? `${tierName} · ${range}` : range;
  };

  const inBudget = (item, bucket) => {
    const price = priceOf(item);
    return price >= bucket.lo && price < bucket.hi;
  };

  // How far a price sits outside the chosen bucket (0 when inside it)
  const budgetDistance = (item, bucket) => {
    const price = priceOf(item);
    if (bucket.min != null && price < bucket.min) return bucket.min - price;
    if (bucket.max != null && price > bucket.max) return price - bucket.max;
    return 0;
  };

  // Keywords are matched against the dish's own title, description and tags
  // in every language. They only react to words the menu itself prints, so the
  // bot never attaches a spice, diet or cooking claim the menu does not make.
  const PREFERENCE_KEYWORDS = {
    spicy: ['spicy', 'spice', 'épicé', 'epice', 'piquant', 'harissa', 'حار', 'محرحر', 'هريسة'],
    cheese: ['cheese', 'cheddar', 'mozzarella', 'fromage', 'جبن', 'فروماج', 'موزاريلا'],
    vegan: ['vegan', 'végan', 'vegetarian', 'végétarien', 'نباتي'],
    grill: [
      'kebab', 'brochette', 'skewer', 'grill', 'charcoal', 'charbon', 'chawarma', 'shawarma',
      'taouk', 'chicken', 'poulet', 'meat', 'viande',
      'كباب', 'سيخ', 'أسياخ', 'شواش', 'مشوي', 'جمر', 'شاورما', 'طاووق', 'دجاج', 'لحم'
    ]
  };

  const matchesPreference = (item, pref) => {
    const keywords = PREFERENCE_KEYWORDS[pref];
    if (!keywords) return true; // 'any'
    const haystack = [allText(item.title), allText(item.description), allText(item.tags)].join(' ').toLowerCase();
    return keywords.some(word => haystack.includes(word));
  };

  /* ---------------------------------------------------------------------
     Chat UI
     --------------------------------------------------------------------- */
  const closeChat = () => {
    chatState.isOpen = false;
    const windowContainer = document.getElementById('chatbot-window-container');
    if (windowContainer) windowContainer.classList.remove('open');
  };

  const injectChatbot = () => {
    const lang = getLang();

    // Remove existing container if any
    const oldBubble = document.getElementById('chatbot-trigger-bubble');
    const oldWindow = document.getElementById('chatbot-window-container');
    if (oldBubble) oldBubble.remove();
    if (oldWindow) oldWindow.remove();

    if (typeof BabkeComponents === 'undefined' || !BabkeComponents.getChatbotMarkup) {
      console.error("BabkeComponents chatbot markup is missing.");
      return;
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = BabkeComponents.getChatbotMarkup(lang);
    while (tempDiv.firstChild) {
      document.body.appendChild(tempDiv.firstChild);
    }

    bindChatbotEvents();
  };

  const bindChatbotEvents = () => {
    const bubble = document.getElementById('chatbot-trigger-bubble');
    const windowContainer = document.getElementById('chatbot-window-container');
    const closeBtn = document.getElementById('btn-close-chatbot');
    const inputForm = document.getElementById('chatbot-input-footer');
    const textInput = document.getElementById('chatbot-text-input');

    if (!bubble || !windowContainer || !closeBtn) return;

    bubble.addEventListener('click', () => {
      chatState.isOpen = !chatState.isOpen;
      if (chatState.isOpen) {
        windowContainer.classList.add('open');
        // If it's the first time opening, run welcome flow
        const messagesBody = document.getElementById('chatbot-messages-body');
        if (messagesBody && messagesBody.children.length === 0) {
          startChatFlow();
        }
        setTimeout(() => {
          if (textInput && chatState.step === 'welcome') textInput.focus();
        }, 300);
      } else {
        windowContainer.classList.remove('open');
      }
    });

    closeBtn.addEventListener('click', closeChat);

    if (inputForm && textInput) {
      inputForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = textInput.value.trim();
        if (!val) return;

        textInput.value = '';

        if (chatState.step === 'welcome') {
          handleNameSubmit(val);
        }
      });
    }
  };

  // Close on Escape key press. Registered once: the chat markup is rebuilt on
  // every language change, so the handler looks the window up each time.
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chatState.isOpen) closeChat();
  });

  const startChatFlow = () => {
    chatState.step = 'welcome';
    chatState.userName = '';
    chatState.budget = null;
    chatState.preference = null;
    budgetBuckets = [];

    const messagesBody = document.getElementById('chatbot-messages-body');
    if (messagesBody) messagesBody.innerHTML = '';

    const optionsContainer = document.getElementById('chatbot-options-container');
    if (optionsContainer) optionsContainer.innerHTML = '';

    const inputForm = document.getElementById('chatbot-input-footer');
    if (inputForm) inputForm.classList.remove('disabled');

    const t = getTranslations(getLang());

    showTyping(() => {
      addMessage('assistant', t.msg_welcome);
    });
  };

  const handleNameSubmit = (rawName) => {
    const name = Array.from(rawName).slice(0, 40).join('');
    chatState.userName = name;
    addUserMessage(name);

    // Disable text input since the next steps use button options
    const inputForm = document.getElementById('chatbot-input-footer');
    if (inputForm) inputForm.classList.add('disabled');

    chatState.step = 'budget';
    const t = getTranslations(getLang());

    showTyping(() => {
      const budgetPrompt = fill(t.msg_budget, { name: `<strong>${esc(name)}</strong>` });
      addMessage('assistant', budgetPrompt);
      showBudgetOptions();
    });
  };

  const showBudgetOptions = () => {
    withMenu((menu) => {
      const optionsContainer = document.getElementById('chatbot-options-container');
      if (!optionsContainer || chatState.step !== 'budget') return;

      const t = getTranslations(getLang());
      budgetBuckets = computeBudgetBuckets(getOrderablePool(menu));

      const bucketButtons = budgetBuckets.map((bucket, index) => (
        `<button type="button" class="btn-chatbot-option" data-budget="${index}">${esc(budgetLabel(bucket, t))}</button>`
      )).join('');

      optionsContainer.innerHTML = `
        ${bucketButtons}
        <button type="button" class="btn-chatbot-option" data-budget="any">${esc(t.opt_budget_high)}</button>
      `;

      optionsContainer.querySelectorAll('.btn-chatbot-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const key = e.currentTarget.dataset.budget;
          const bucket = key === 'any' ? ANY_BUDGET : (budgetBuckets[Number(key)] || ANY_BUDGET);
          handleBudgetSelect(bucket, e.currentTarget.textContent);
        });
      });
    });
  };

  const handleBudgetSelect = (bucket, budgetText) => {
    chatState.budget = bucket;
    addUserMessage(budgetText);

    // Clear option buttons
    const optionsContainer = document.getElementById('chatbot-options-container');
    if (optionsContainer) optionsContainer.innerHTML = '';

    chatState.step = 'preference';
    const t = getTranslations(getLang());

    showTyping(() => {
      addMessage('assistant', t.msg_preference);
      showPreferenceOptions();
    });
  };

  const showPreferenceOptions = () => {
    const optionsContainer = document.getElementById('chatbot-options-container');
    if (!optionsContainer) return;

    const t = getTranslations(getLang());

    optionsContainer.innerHTML = `
      <button type="button" class="btn-chatbot-option" data-pref="spicy">${esc(t.opt_pref_spicy)}</button>
      <button type="button" class="btn-chatbot-option" data-pref="cheese">${esc(t.opt_pref_cheese)}</button>
      <button type="button" class="btn-chatbot-option" data-pref="vegan">${esc(t.opt_pref_vegan)}</button>
      <button type="button" class="btn-chatbot-option" data-pref="grill">${esc(t.opt_pref_grill)}</button>
      <button type="button" class="btn-chatbot-option" data-pref="any">${esc(t.opt_pref_any)}</button>
    `;

    optionsContainer.querySelectorAll('.btn-chatbot-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prefCode = e.currentTarget.dataset.pref;
        const prefText = e.currentTarget.textContent;
        handlePreferenceSelect(prefCode, prefText);
      });
    });
  };

  const handlePreferenceSelect = (prefCode, prefText) => {
    chatState.preference = prefCode;
    addUserMessage(prefText);

    const optionsContainer = document.getElementById('chatbot-options-container');
    if (optionsContainer) optionsContainer.innerHTML = '';

    chatState.step = 'finished';

    showTyping(() => {
      withMenu(generateRecommendations);
    });
  };

  const generateRecommendations = (menu) => {
    const t = getTranslations(getLang());
    const pool = getOrderablePool(menu);
    const bucket = chatState.budget || ANY_BUDGET;
    const pref = chatState.preference || 'any';

    const inBucket = pool.filter(item => inBudget(item, bucket));
    const strict = inBucket.filter(item => matchesPreference(item, pref));

    let message;
    let picks;

    if (strict.length > 0) {
      message = t.msg_results;
      picks = strict;
    } else {
      // Never dead-end: keep the taste and step outside the budget first,
      // then keep the budget and drop the taste, then show the whole menu.
      const tasteOnly = pool
        .filter(item => matchesPreference(item, pref))
        .sort((a, b) => budgetDistance(a, bucket) - budgetDistance(b, bucket));

      if (tasteOnly.length > 0) {
        message = t.msg_results_outside_budget;
        picks = tasteOnly;
      } else if (inBucket.length > 0) {
        message = t.msg_results_taste_not_found;
        picks = inBucket;
      } else {
        message = t.msg_results_taste_not_found;
        picks = pool;
      }
    }

    if (picks.length > 0) {
      addMessage('assistant', message);
      renderProductCards(picks.slice(0, 3)); // show max 3 recommendations
    } else {
      addMessage('assistant', t.msg_menu_unavailable);
    }

    // Show reset button option
    showResetOption();
  };

  const renderProductCards = (items) => {
    const messagesBody = document.getElementById('chatbot-messages-body');
    if (!messagesBody) return;

    const lang = getLang();
    const t = getTranslations(lang);

    const scroller = document.createElement('div');
    scroller.className = 'chatbot-cards-scroller';

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'chatbot-product-card';

      const id = item.id;
      const title = pickLoc(item.title, lang);
      const desc = pickLoc(item.description, lang);
      const price = priceOf(item);
      const fallbackSrc = item.fallbackImage;
      const imageSrc = item.image || fallbackSrc || '';

      card.innerHTML = `
        <img class="chatbot-card-img" src="${esc(imageSrc)}" alt="${esc(title)}" loading="lazy">
        <div class="chatbot-card-info">
          <h6>${esc(title)}</h6>
          <p>${esc(desc)}</p>
          <div class="chatbot-card-footer">
            <span class="chatbot-card-price">${esc(price.toFixed(1))} TND</span>
            <button type="button" class="btn-chatbot-add-to-cart">${esc(t.btn_add_to_cart)}</button>
          </div>
        </div>
      `;

      // Image fallback wired as a listener (keeps the URL out of an inline handler)
      const cardImg = card.querySelector('.chatbot-card-img');
      if (cardImg && fallbackSrc && fallbackSrc !== imageSrc) {
        cardImg.addEventListener('error', function handleImgError() {
          cardImg.removeEventListener('error', handleImgError);
          cardImg.src = fallbackSrc;
        });
      }

      // Wire cart add with the item's own values (no round-trip through data-* attributes)
      const addBtn = card.querySelector('.btn-chatbot-add-to-cart');
      addBtn.addEventListener('click', () => {
        if (window.BabkeCart && window.BabkeCart.addDefaultItem) {
          window.BabkeCart.addDefaultItem(id, title, price, desc);

          // Button feedback
          addBtn.textContent = t.added_notification;
          addBtn.classList.add('added');
          setTimeout(() => {
            addBtn.textContent = t.btn_add_to_cart;
            addBtn.classList.remove('added');
          }, 2000);
        } else {
          console.error("BabkeCart global handler is not available.");
        }
      });

      scroller.appendChild(card);
    });

    messagesBody.appendChild(scroller);
    scrollToBottom();
  };

  const showResetOption = () => {
    const optionsContainer = document.getElementById('chatbot-options-container');
    if (!optionsContainer) return;

    const t = getTranslations(getLang());

    optionsContainer.innerHTML = `
      <button type="button" class="btn-chatbot-option restart-btn" id="btn-chatbot-restart">${esc(t.restart_chat)}</button>
    `;

    document.getElementById('btn-chatbot-restart').addEventListener('click', startChatFlow);
  };

  // Helper utility functions

  // `htmlContent` must be trusted markup (translation strings with escaped values)
  const addMessage = (sender, htmlContent) => {
    const messagesBody = document.getElementById('chatbot-messages-body');
    if (!messagesBody) return;

    const wrapper = document.createElement('div');
    wrapper.className = `chat-bubble-wrapper ${sender}`;

    const initial = chatState.userName ? Array.from(chatState.userName)[0].toUpperCase() : 'U';
    const avatarHtml = sender === 'assistant'
      ? `<div class="chat-bubble-avatar"><img src="assets/logo.png" alt="B" class="chatbot-avatar-img"></div>`
      : `<div class="chat-bubble-avatar user-avatar">${esc(initial)}</div>`;

    wrapper.innerHTML = `
      ${avatarHtml}
      <div class="chat-bubble-text">${htmlContent}</div>
    `;

    messagesBody.appendChild(wrapper);
    scrollToBottom();
  };

  // Anything the guest typed or clicked is shown as plain text
  const addUserMessage = (text) => addMessage('user', esc(String(text || '').trim()));

  const showTyping = (callback) => {
    const messagesBody = document.getElementById('chatbot-messages-body');
    if (!messagesBody) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-bubble-wrapper assistant typing-indicator-wrapper';
    wrapper.innerHTML = `
      <div class="chat-bubble-avatar"><img src="assets/logo.png" alt="B" class="chatbot-avatar-img"></div>
      <div class="chat-bubble-text typing-indicator">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    `;

    messagesBody.appendChild(wrapper);
    scrollToBottom();

    // Remove typing bubble and trigger callback
    setTimeout(() => {
      wrapper.remove();
      callback();
    }, 1000 + Math.random() * 800);
  };

  const scrollToBottom = () => {
    const messagesBody = document.getElementById('chatbot-messages-body');
    if (messagesBody) {
      messagesBody.scrollTo({ top: messagesBody.scrollHeight, behavior: scrollBehavior() });
    }
  };

  // Listen to lang changes to reset and update chatbot language instantly
  window.addEventListener('babkeLangChanged', () => {
    injectChatbot();
    // Reset state (the rebuilt window starts closed)
    chatState.isOpen = false;
    chatState.step = 'welcome';
    chatState.userName = '';
    chatState.budget = null;
    chatState.preference = null;
    budgetBuckets = [];
  });

  // Initial load
  injectChatbot();
});
