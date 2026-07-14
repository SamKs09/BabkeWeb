/* ==========================================================================
   BABKE KEBAB & PLATES — FOOD RECOMMENDATION CHATBOT COMPONENT
   ========================================================================== */

(function() {
  window.BabkeComponents = window.BabkeComponents || {};
  const bc = window.BabkeComponents;

  bc.chatbotTranslations = {
  en: {
    tooltip: "Hungry? Chat with me!",
    header_title: "Babke Assistant",
    header_subtitle: "Food Recommendation AI",
    input_placeholder: "Type your name or reply here...",
    btn_send: "Send",
    
    msg_welcome: "Marhaban! I am your Babke Assistant. 🌟 I'll help you find the perfect Middle Eastern bite. To start, what should I call you?",
    msg_budget: "Nice to meet you, {name}! Let's talk budget first. 💰 What is your price limit for this feast?",
    msg_preference: "Got it! Now, what style of street-food are you craving today? 🔥",
    msg_results: "Brilliant! Here are the best charcoal dishes I hand-picked for you matching your criteria. You can add them straight to your cart!",
    msg_no_results: "Oops! I couldn't find anything matching that exact budget and taste. However, you should definitely try our Best Seller wrap below:",
    msg_error_name: "Please enter a valid name so I know who I'm talking to!",
    
    opt_budget_low: "Under 15 TND",
    opt_budget_mid: "15 - 25 TND",
    opt_budget_high: "Show All / No Limit",
    
    opt_pref_spicy: "Spicy / Heat 🌶️",
    opt_pref_cheese: "Extra Cheesy 🧀",
    opt_pref_vegan: "Vegan / Healthy 🥗",
    opt_pref_grill: "Charcoal Grilled / Meat 🥩",
    opt_pref_any: "Show Everything! 🍽️",
    
    btn_add_to_cart: "Add to Order",
    added_notification: "Added to Order!",
    restart_chat: "Find Another Bite 🔄"
  },
  fr: {
    tooltip: "Une faim ? Parlez avec moi !",
    header_title: "Assistant Babke",
    header_subtitle: "Recommandation Culinaire",
    input_placeholder: "Tapez votre réponse ici...",
    btn_send: "Envoyer",
    
    msg_welcome: "Marhaban ! Je suis votre assistant Babke. 🌟 Je vais vous aider à trouver le repas parfait. Tout d'abord, comment vous appelez-vous ?",
    msg_budget: "Ravi de vous rencontrer, {name} ! Parlons budget. 💰 Quelle est votre limite de prix pour ce festin ?",
    msg_preference: "C'est noté ! Quel style de street-food vous fait envie aujourd'hui ? 🔥",
    msg_results: "Excellent ! Voici les meilleures grillades que j'ai sélectionnées pour vous. Vous pouvez les ajouter directement au panier !",
    msg_no_results: "Oups ! Je n'ai rien trouvé qui corresponde exactement. Cependant, vous devez absolument tester notre wrap Best-Seller ci-dessous :",
    msg_error_name: "Veuillez entrer un prénom valide !",
    
    opt_budget_low: "Moins de 15 TND",
    opt_budget_mid: "15 - 25 TND",
    opt_budget_high: "Voir Tout / Sans Limite",
    
    opt_pref_spicy: "Épicé / Piquant 🌶️",
    opt_pref_cheese: "Extra Fromage 🧀",
    opt_pref_vegan: "Végan / Sain 🥗",
    opt_pref_grill: "Charcoal Grill / Viande 🥩",
    opt_pref_any: "Tout voir ! 🍽️",
    
    btn_add_to_cart: "Ajouter au Festin",
    added_notification: "Ajouté !",
    restart_chat: "Nouvelle recherche 🔄"
  },
  tn: {
    tooltip: "جيعان؟ أحكي معايا!",
    header_title: "مساعد بَبكي",
    header_subtitle: "دليل البنة والماكلة",
    input_placeholder: "أكتب اسمك أو جوابك هنا...",
    btn_send: "أبعث",
    
    msg_welcome: "مرحباً بيك! أنا مساعد بَبكي الذكي. 🌟 باش نعاونك تختار الدبارة المحرحرة البنينة. أول حاجة، شنوة اسمك يا باهي؟",
    msg_budget: "مرحبا بيك {name}! خلينا نحكيو في الميزانية قبل. 💰 قداش تحب تصرف كحد أقصى في هالعشوية البنينة؟",
    msg_preference: "واضح! وشنوة نوع البنة والماكلة اللي مشتهيها اليوم؟ 🔥",
    msg_results: "يا بابا عالبنة! هاذم أحسن الأطباق المشوية اللي اخترتهملك على ذوقك. تنجم تزيدهم لطلبيتك ديراكت!",
    msg_no_results: "أوووه! مالقيتش أطباق بنفس الميزانية والذوق بالضبط. أما ننصحك تجرب اللفّة الأكثر طلباً عندنا لوطا:",
    msg_error_name: "عايش خويا أكتب اسمك الصحيح باش نعرف مع شكون نحكي!",
    
    opt_budget_low: "أقل من 15 د.ت",
    opt_budget_mid: "15 - 25 د.ت",
    opt_budget_high: "ورينا الكل / بلاش ليميت",
    
    opt_pref_spicy: "محرحر / حار 🌶️",
    opt_pref_cheese: "معبي بالجبن 🧀",
    opt_pref_vegan: "نباتي / خفيف 🥗",
    opt_pref_grill: "مشوي عالجمر / لحوم 🥩",
    opt_pref_any: "ورينا كل شي! 🍽️",
    
    btn_add_to_cart: "أطلب البنة",
    added_notification: "زيت للطلبية!",
    restart_chat: "دبارة أخرى 🔄"
  }
};

  bc.getChatbotMarkup = function(lang) {
  const t = bc.chatbotTranslations[lang] || bc.chatbotTranslations.en;
  
  return `
    <!-- Floating Chat Trigger Button -->
    <button class="chatbot-trigger-bubble" id="chatbot-trigger-bubble" aria-label="Open Food Assistant">
      <div class="trigger-icon-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <span class="trigger-tooltip-txt">${t.tooltip}</span>
    </button>

    <!-- Chat Window Container -->
    <div class="chatbot-window-container" id="chatbot-window-container">
      <!-- Chat Header -->
      <div class="chatbot-header">
        <div class="header-avatar-group">
          <div class="chatbot-avatar-active">
            <img src="assets/logo.png" alt="Babke Logo" class="chatbot-avatar-img">
          </div>
          <div>
            <h5>${t.header_title}</h5>
            <span>${t.header_subtitle}</span>
          </div>
        </div>
        <button class="btn-close-chatbot" id="btn-close-chatbot" aria-label="Close Assistant">&times;</button>
      </div>

      <!-- Messages Body Area -->
      <div class="chatbot-messages-body" id="chatbot-messages-body">
        <!-- Interactive messages injected here -->
      </div>

      <!-- Quick Option Buttons Container (Appears conditionally above input) -->
      <div class="chatbot-options-container" id="chatbot-options-container"></div>

      <!-- Message Input Form (Used for Name Input) -->
      <form class="chatbot-input-footer" id="chatbot-input-footer" onsubmit="event.preventDefault();">
        <input type="text" id="chatbot-text-input" placeholder="${t.input_placeholder}" required autocomplete="off">
        <button type="submit" class="btn-send-chat" id="btn-send-chat" aria-label="Send Message">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </form>
    </div>
  `;
};

})();
