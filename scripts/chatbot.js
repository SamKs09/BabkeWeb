/* ==========================================================================
   BABKE KEBAB & PLATES — FOOD RECOMMENDATION CHATBOT LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  let chatState = {
    isOpen: false,
    step: 'welcome', // welcome, budget, preference, finished
    userName: '',
    budget: null, // 'low', 'mid', 'high'
    preference: null // 'spicy', 'cheese', 'vegan', 'grill', 'any'
  };

  const getLang = () => localStorage.getItem('babke_lang') || 'en';

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

    closeBtn.addEventListener('click', () => {
      chatState.isOpen = false;
      windowContainer.classList.remove('open');
    });

    // Close on Escape key press (UX & Accessibility Upgrade)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && chatState.isOpen) {
        chatState.isOpen = false;
        windowContainer.classList.remove('open');
      }
    });

    inputForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = textInput.value.trim();
      if (!val) return;

      textInput.value = '';

      if (chatState.step === 'welcome') {
        handleNameSubmit(val);
      }
    });
  };

  const startChatFlow = () => {
    chatState.step = 'welcome';
    chatState.userName = '';
    chatState.budget = null;
    chatState.preference = null;

    const messagesBody = document.getElementById('chatbot-messages-body');
    if (messagesBody) messagesBody.innerHTML = '';
    
    const optionsContainer = document.getElementById('chatbot-options-container');
    if (optionsContainer) optionsContainer.innerHTML = '';

    const inputForm = document.getElementById('chatbot-input-footer');
    if (inputForm) inputForm.classList.remove('disabled');

    const lang = getLang();
    const t = BabkeComponents.chatbotTranslations[lang];

    showTyping(() => {
      addMessage('assistant', t.msg_welcome);
    });
  };

  const handleNameSubmit = (name) => {
    chatState.userName = name;
    addMessage('user', name);

    // Disable text input since the next steps use button options
    const inputForm = document.getElementById('chatbot-input-footer');
    if (inputForm) inputForm.classList.add('disabled');

    chatState.step = 'budget';
    const lang = getLang();
    const t = BabkeComponents.chatbotTranslations[lang];

    showTyping(() => {
      const budgetPrompt = t.msg_budget.replace('{name}', `<strong>${name}</strong>`);
      addMessage('assistant', budgetPrompt);
      showBudgetOptions();
    });
  };

  const showBudgetOptions = () => {
    const optionsContainer = document.getElementById('chatbot-options-container');
    if (!optionsContainer) return;

    const lang = getLang();
    const t = BabkeComponents.chatbotTranslations[lang];

    optionsContainer.innerHTML = `
      <button class="btn-chatbot-option" data-budget="low">${t.opt_budget_low}</button>
      <button class="btn-chatbot-option" data-budget="mid">${t.opt_budget_mid}</button>
      <button class="btn-chatbot-option" data-budget="high">${t.opt_budget_high}</button>
    `;

    optionsContainer.querySelectorAll('.btn-chatbot-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const budgetCode = e.currentTarget.dataset.budget;
        const budgetText = e.currentTarget.textContent;
        handleBudgetSelect(budgetCode, budgetText);
      });
    });
  };

  const handleBudgetSelect = (budgetCode, budgetText) => {
    chatState.budget = budgetCode;
    addMessage('user', budgetText);

    // Clear option buttons
    const optionsContainer = document.getElementById('chatbot-options-container');
    if (optionsContainer) optionsContainer.innerHTML = '';

    chatState.step = 'preference';
    const lang = getLang();
    const t = BabkeComponents.chatbotTranslations[lang];

    showTyping(() => {
      addMessage('assistant', t.msg_preference);
      showPreferenceOptions();
    });
  };

  const showPreferenceOptions = () => {
    const optionsContainer = document.getElementById('chatbot-options-container');
    if (!optionsContainer) return;

    const lang = getLang();
    const t = BabkeComponents.chatbotTranslations[lang];

    optionsContainer.innerHTML = `
      <button class="btn-chatbot-option" data-pref="spicy">${t.opt_pref_spicy}</button>
      <button class="btn-chatbot-option" data-pref="cheese">${t.opt_pref_cheese}</button>
      <button class="btn-chatbot-option" data-pref="vegan">${t.opt_pref_vegan}</button>
      <button class="btn-chatbot-option" data-pref="grill">${t.opt_pref_grill}</button>
      <button class="btn-chatbot-option" data-pref="any">${t.opt_pref_any}</button>
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
    addMessage('user', prefText);

    const optionsContainer = document.getElementById('chatbot-options-container');
    if (optionsContainer) optionsContainer.innerHTML = '';

    chatState.step = 'finished';

    showTyping(() => {
      generateRecommendations();
    });
  };

  const generateRecommendations = () => {
    if (typeof BabkeDB === 'undefined') {
      console.error("BabkeDB is not loaded.");
      return;
    }

    const menu = BabkeDB.getMenu();
    const lang = getLang();
    const t = BabkeComponents.chatbotTranslations[lang];

    // Filter logic
    let matches = menu;

    // 1. Budget filter
    if (chatState.budget === 'low') {
      matches = matches.filter(item => item.price < 15.0);
    } else if (chatState.budget === 'mid') {
      matches = matches.filter(item => item.price >= 15.0 && item.price <= 25.0);
    } // 'high' shows all

    // 2. Preference filter
    if (chatState.preference === 'spicy') {
      // Find items containing spicy or adana or heat
      matches = matches.filter(item => {
        const title = (item.title[lang] || "").toLowerCase();
        const desc = (item.description[lang] || "").toLowerCase();
        const hasSpicyTag = (item.tags[lang] || []).some(tag => tag.toLowerCase().includes('spice') || tag.toLowerCase().includes('épic') || tag.includes('حار') || tag.includes('محرحر'));
        return title.includes('spicy') || title.includes('adana') || desc.includes('harissa') || desc.includes('spicy') || hasSpicyTag;
      });
    } else if (chatState.preference === 'cheese') {
      // Cheddar or cheesy
      matches = matches.filter(item => {
        const title = (item.title[lang] || "").toLowerCase();
        const desc = (item.description[lang] || "").toLowerCase();
        const hasCheeseTag = (item.tags[lang] || []).some(tag => tag.toLowerCase().includes('cheese') || tag.toLowerCase().includes('fromage') || tag.includes('جبن'));
        return title.includes('cheddar') || desc.includes('cheddar') || desc.includes('cheese') || desc.includes('fromage') || hasCheeseTag;
      });
    } else if (chatState.preference === 'vegan') {
      matches = matches.filter(item => {
        const hasVeganTag = (item.tags[lang] || []).some(tag => tag.toLowerCase().includes('vegan') || tag.toLowerCase().includes('végan') || tag.includes('نباتي'));
        return hasVeganTag;
      });
    } else if (chatState.preference === 'grill') {
      // Charcoal, Adana, Royal, Spit, skewers
      matches = matches.filter(item => {
        const title = (item.title[lang] || "").toLowerCase();
        const desc = (item.description[lang] || "").toLowerCase();
        return title.includes('kebab') || title.includes('adana') || title.includes('plat') || desc.includes('charcoal') || desc.includes('charbon') || desc.includes('جمر') || desc.includes('grill') || desc.includes('brochette');
      });
    } // 'any' doesn't filter further

    // Display
    if (matches.length > 0) {
      addMessage('assistant', t.msg_results);
      renderProductCards(matches.slice(0, 3)); // show max 3 recommendations
    } else {
      // No matches found, recommend Best Seller (Chicken Shawarma Wrap - item-0)
      addMessage('assistant', t.msg_no_results);
      const fallbackItem = menu.find(item => item.id === 'item-0') || menu[0];
      if (fallbackItem) {
        renderProductCards([fallbackItem]);
      }
    }

    // Show reset button option
    showResetOption();
  };

  const renderProductCards = (items) => {
    const messagesBody = document.getElementById('chatbot-messages-body');
    if (!messagesBody) return;

    const lang = getLang();
    const t = BabkeComponents.chatbotTranslations[lang];

    const scroller = document.createElement('div');
    scroller.className = 'chatbot-cards-scroller';

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'chatbot-product-card';
      
      const title = item.title[lang] || item.title['en'];
      const desc = item.description[lang] || item.description['en'];
      const imageSrc = item.image;
      const fallbackSrc = item.fallbackImage;

      card.innerHTML = `
        <img class="chatbot-card-img" src="${imageSrc}" onerror="this.onerror=null; this.src='${fallbackSrc}';" alt="${title}">
        <div class="chatbot-card-info">
          <h6>${title}</h6>
          <p>${desc}</p>
          <div class="chatbot-card-footer">
            <span class="chatbot-card-price">${item.price.toFixed(1)} TND</span>
            <button class="btn-chatbot-add-to-cart" data-id="${item.id}" data-name="${title}" data-price="${item.price}" data-desc="${desc}">
              ${t.btn_add_to_cart}
            </button>
          </div>
        </div>
      `;

      // Wire cart add
      const addBtn = card.querySelector('.btn-chatbot-add-to-cart');
      addBtn.addEventListener('click', (e) => {
        const btn = e.currentTarget;
        const id = btn.dataset.id;
        const name = btn.dataset.name;
        const price = parseFloat(btn.dataset.price);
        const descText = btn.dataset.desc;

        // Custom global cart addition event or function call
        if (window.BabkeCart && window.BabkeCart.addDefaultItem) {
          window.BabkeCart.addDefaultItem(id, name, price, descText);
          
          // Animate button feedback
          btn.textContent = t.added_notification;
          btn.classList.add('added');
          setTimeout(() => {
            btn.textContent = t.btn_add_to_cart;
            btn.classList.remove('added');
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

    const lang = getLang();
    const t = BabkeComponents.chatbotTranslations[lang];

    optionsContainer.innerHTML = `
      <button class="btn-chatbot-option restart-btn" id="btn-chatbot-restart">${t.restart_chat}</button>
    `;

    document.getElementById('btn-chatbot-restart').addEventListener('click', startChatFlow);
  };

  // Helper utility functions
  const addMessage = (sender, htmlContent) => {
    const messagesBody = document.getElementById('chatbot-messages-body');
    if (!messagesBody) return;

    const wrapper = document.createElement('div');
    wrapper.className = `chat-bubble-wrapper ${sender}`;

    const avatarHtml = sender === 'assistant' 
      ? `<div class="chat-bubble-avatar"><img src="assets/logo.png" alt="B" class="chatbot-avatar-img"></div>` 
      : `<div class="chat-bubble-avatar user-avatar">${chatState.userName ? chatState.userName.charAt(0).toUpperCase() : 'U'}</div>`;

    wrapper.innerHTML = `
      ${avatarHtml}
      <div class="chat-bubble-text">${htmlContent}</div>
    `;

    messagesBody.appendChild(wrapper);
    scrollToBottom();
  };

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
      messagesBody.scrollTo({ top: messagesBody.scrollHeight, behavior: 'smooth' });
    }
  };

  // Listen to lang changes to reset and update chatbot language instantly
  window.addEventListener('babkeLangChanged', () => {
    injectChatbot();
    // Reset state
    chatState.step = 'welcome';
    chatState.userName = '';
    chatState.budget = null;
    chatState.preference = null;
  });

  // Initial load
  injectChatbot();
});
