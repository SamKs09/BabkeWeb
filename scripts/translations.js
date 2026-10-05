/* ==========================================================================
   BABKE KEBAB & PLATES — MULTI-LANGUAGE TRANSLATION SYSTEM (EN, FR, TN)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof BabkeDB !== 'undefined') {
    try {
      await BabkeDB.init();
    } catch (e) {
      console.error("Failed to initialize database cache:", e);
    }
  }
  
  // 1. Language Translation Dictionary (Static UI labels + placeholders)
  const translations = {
    en: {
      nav_home: "Home",
      nav_menu: "Menu",
      nav_about: "Our Story",
      nav_gallery: "Socials",
      nav_reviews: "Reviews",
      nav_contact: "Find Us",
      nav_order_now: "Order Now",

      hero_award: "BEST SHAWARMA 2025 BY TORCHI.TN",
      hero_badge: "Sousse's Favorite Kebab Spot",
      hero_title: 'THE STREETS OF <span class="highlight">SOUSSE</span> JUST GOT FLAVOR.',
      hero_desc: "Charcoal-grilled Adana and halabi kebabs, chich taouk skewers and chawarma sliced to order. Every platter comes with rice, fries, three salads, three Babke sauces and our homemade bread.",
      hero_explore_menu: "Explore the Menu",
      hero_order_delivery: "Order Delivery",
      hero_stat_charcoal: "Charcoal Grilled",
      hero_stat_spices: "Levantine Spices",
      hero_stat_social: "Social Followers",
      hero_tag_harissa: "Spicy Harissa",
      hero_tag_toum: "Garlic Toum",
      
      // Ticker keys keep their legacy names (index.html references them), but the
      // text must only name dishes on the printed menu.
      ticker_text: " DINE IN & TAKEAWAY •  CHAWARMA PLATTERS •  CHARCOAL GRILLED ADANA •  CHICH TAOUK SKEWERS •  FALAFEL PLATTERS •  FAST SOUSSE DELIVERY • ",
      ticker_dine: "DINE IN & TAKEAWAY",
      ticker_wraps: "CHAWARMA PLATTERS",
      ticker_adana: "CHARCOAL GRILLED ADANA",
      ticker_fries: "CHICH TAOUK SKEWERS",
      ticker_hummus: "FALAFEL PLATTERS",
      ticker_delivery: "FAST SOUSSE DELIVERY",
      
      menu_section_title: "CHOOSE YOUR CRAVING",
      menu_section_subtitle: "Crafted with authentic Lebanese ingredients and grilled over red-hot embers.",
      tab_plats: "Platters",
      tab_enfant: "Kids Menu",
      
      about_fresh: "100% Fresh Daily",
      about_fresh_desc: "Vegetables sliced and sauces whipped fresh every single morning.",
      about_charcoal: "Authentic Oak Charcoal",
      about_charcoal_desc: "We grill exclusively over pure wood embers for that signature smokiness.",
      
      gallery_title: "FEAST WITH YOUR EYES",
      gallery_subtitle: "Follow us on Instagram <a href=\"https://www.instagram.com/babke_kebab/\" target=\"_blank\" class=\"instagram-link\">@babke_kebab</a> for your daily dose of smoke and skewers.",
      
      reviews_title: "STREET CREDIBILITY",
      reviews_subtitle: "Real feedback from real diners. No fluff, just pure flavor reviews.",
      
      contact_locate: "LOCATE & CRAVE",
      contact_title: "VISIT THE STREET OF EMBER",
      contact_location_title: "Our Location",
      contact_phone: "Call the Grill",
      contact_hours: "Operating Hours",
      contact_delivery_card_title: "GET IT DELIVERED TO YOUR COUCH",
      contact_delivery_card_desc: "Order direct through Sousse's leading food apps for blazing fast delivery straight to your doorstep.",
      contact_delivery_btn: "Order",
      contact_map_title: "Interactive Map — Sousse Center",
      contact_map_label_sub: "HAMMAM SOUSSE",
      contact_map_footer: "Call to reserve outdoor seats!",
      contact_map_directions: "GET DIRECTIONS ON GOOGLE MAPS ➔",
      read_more_reviews: "READ MORE REAL GOOGLE REVIEWS (4.3/5 ★ based on 500+ reviews)",
      
      footer_nav_title: "Navigation",
      footer_powered: "Powered by",
      footer_nav_home: "Home",
      footer_nav_menu: "Menu",
      footer_nav_about: "Our Story",
      footer_nav_gallery: "Social Gallery",
      footer_stay_connected: "Stay Connected",
      
      nav_events: "Events",
      events_title: "UPCOMING EVENTS",
      events_subtitle: "Catch us hosting stands and preparing live street food at these local events.",
      event_status_cancelled: "CANCELLED",
      event_status_upcoming: "UPCOMING",
      visit_stand: "Visit our stand",

      nav_wheel: "Spin & Win",
      nav_loyalty: "Loyalty",
      menubook_title: "THE MENU BOOK",
      menubook_subtitle: "Turn the pages of our charcoal grill menu. Tap any dish to add it to your order.",
      menubook_cta: "Open the menu book",
      wheel_title: "THE BABKE WHEEL",
      wheel_subtitle: "Spin for free and try your luck: charcoal-grilled plats, chawarma or bonus seals. The embers decide.",
      loyalty_title: "EVERY ORDER LEAVES ITS SEAL",
      loyalty_subtitle: "Collect a seal with every order and unlock dishes from the grill. Your card lives on your phone."
    },
    fr: {
      nav_home: "Accueil",
      nav_menu: "Menu",
      nav_about: "Notre Histoire",
      nav_gallery: "Réseaux",
      nav_reviews: "Avis",
      nav_contact: "Nous Trouver",
      nav_order_now: "Commander",

      hero_award: "MEILLEUR CHAWARMA 2025 PAR TORCHI.TN",
      hero_badge: "Le Coin Kebab Préféré de Sousse",
      hero_title: 'LES RUES DE <span class="highlight">SOUSSE</span> ONT ENFIN DU GOÛT.',
      hero_desc: "Kebabs adana et halabi grillés au charbon de bois, brochettes de chich taouk et chawarma découpé à la commande. Chaque plat est servi avec riz, frites, 3 salades, 3 sauces Babke et notre pain maison.",
      hero_explore_menu: "Découvrir le Menu",
      hero_order_delivery: "Commander en Livraison",
      hero_stat_charcoal: "Grillé au Charbon",
      hero_stat_spices: "Épices du Levant",
      hero_stat_social: "Abonnés Sociaux",
      hero_tag_harissa: "Harissa Épicée",
      hero_tag_toum: "Toum à l'Ail",
      
      ticker_text: " SUR PLACE & À EMPORTER •  PLATS CHAWARMA •  ADANA TURC AU CHARBON •  BROCHETTES CHICH TAOUK •  PLATS FALAFEL •  LIVRAISON SOUSSE RAPIDE • ",
      ticker_dine: "SUR PLACE & À EMPORTER",
      ticker_wraps: "PLATS CHAWARMA",
      ticker_adana: "ADANA TURC AU CHARBON",
      ticker_fries: "BROCHETTES CHICH TAOUK",
      ticker_hummus: "PLATS FALAFEL",
      ticker_delivery: "LIVRAISON SOUSSE RAPIDE",
      
      menu_section_title: "CHOISISSEZ VOTRE ENVIE",
      menu_section_subtitle: "Préparé avec d'authentiques ingrédients libanais et grillé sur des braises de bois ardentes.",
      tab_plats: "Plats",
      tab_enfant: "Menu Enfant",
      
      about_fresh: "100% Frais du Jour",
      about_fresh_desc: "Légumes découpés et sauces maison fouettées chaque matin.",
      about_charcoal: "Véritable Charbon de Bois",
      about_charcoal_desc: "Nous grillons exclusivement sur de vraies braises pour ce goût fumé inimitable.",
      
      gallery_title: "RÉGALEZ VOS YEUX",
      gallery_subtitle: "Suivez-nous sur Instagram <a href=\"https://www.instagram.com/babke_kebab/\" target=\"_blank\" class=\"instagram-link\">@babke_kebab</a> pour votre dose quotidienne de fumée et de brochettes.",
      
      reviews_title: "CRÉDIBILITÉ DE LA RUE",
      reviews_subtitle: "Vrais retours de nos clients. Pas de chichis, juste de la pure saveur.",
      
      contact_locate: "TROUVEZ & SAVOUREZ",
      contact_title: "VISITENT LA RUE DE LA BRAISE",
      contact_location_title: "Notre Emplacement",
      contact_phone: "Appeler le Grill",
      contact_hours: "Heures d'Ouverture",
      contact_delivery_card_title: "LIVRÉ SUR VOTRE CANAPÉ",
      contact_delivery_card_desc: "Commandez via les meilleures applications de livraison de Sousse pour recevoir votre repas en un éclair.",
      contact_delivery_btn: "Commander",
      contact_map_title: "Carte Interactive — Sousse Centre",
      contact_map_label_sub: "HAMMAM SOUSSE",
      contact_map_footer: "Appelez pour réserver en terrasse !",
      contact_map_directions: "OBTENIR L'ITINÉRAIRE SUR GOOGLE MAPS ➔",
      read_more_reviews: "LIRE PLUS D'AVIS GOOGLE (4.3/5 ★ basés sur 500+ avis)",
      
      footer_nav_title: "Navigation",
      footer_powered: "Réalisé par",
      footer_nav_home: "Accueil",
      footer_nav_menu: "Menu",
      footer_nav_about: "Notre Histoire",
      footer_nav_gallery: "Réseaux Sociaux",
      footer_stay_connected: "Restez Connectés",
      
      nav_events: "Événements",
      events_title: "ÉVÉNEMENTS À VENIR",
      events_subtitle: "Retrouvez-nous en direct ! Nous tenons des stands et servons des grillades au charbon lors de ces événements.",
      event_status_cancelled: "ANNULÉ",
      event_status_upcoming: "À VENIR",
      visit_stand: "Visitez notre stand",

      nav_wheel: "La Roue",
      nav_loyalty: "Fidélité",
      menubook_title: "LE CARNET",
      menubook_subtitle: "Feuilletez notre carte des grillades au charbon. Touchez un plat pour l'ajouter à votre commande.",
      menubook_cta: "Feuilleter le carnet",
      wheel_title: "LA ROUE BABKE",
      wheel_subtitle: "Tentez votre chance gratuitement : plats grillés au charbon, chawarma ou sceaux bonus. La braise décide.",
      loyalty_title: "CHAQUE COMMANDE LAISSE SON SCEAU",
      loyalty_subtitle: "Un sceau à chaque commande, des plats offerts au bout du chemin. Votre carte vit dans votre téléphone."
    },
    tn: {
      nav_home: "الرئيسية",
      nav_menu: "المنيو",
      nav_about: "حكايتنا",
      nav_gallery: "التواصل",
      nav_reviews: "الآراء",
      nav_contact: "زورنا",
      nav_order_now: "أطلب توا",

      hero_award: "أحسن شاورما 2025 حسب TORCHI.TN",
      hero_badge: "أشهم بنّة كباب في سوسة",
      hero_title: 'شوارع <span class="highlight">سوسة</span> زادت بنّة على بنّة.',
      hero_desc: "كباب أدنّا وحلبي مشوي عالجمر، أسياخ شيش طاووق وشاورما مقصوصة في الحين. كل طبق يجي معاه روز، بطاطا مقلية، 3 سلطات، 3 صلصات بَبكي وخبز الدار.",
      hero_explore_menu: "تصفّح المنيو",
      hero_order_delivery: "أطلب دليفري",
      hero_stat_charcoal: "مشوي 100% عالجمر",
      hero_stat_spices: "توابل شامية أصلية",
      hero_stat_social: "متابع على الميديا",
      hero_tag_harissa: "هريسة عربي حارة",
      hero_tag_toum: "ثومية شرقية",
      
      ticker_text: " على عين المكان وتيك أواي •  أطباق شاورما •  أدنّا عالجمر •  أسياخ شيش طاووق •  أطباق فلافل •  توصيل سريع في سوسة • ",
      ticker_dine: "على عين المكان وتيك أواي",
      ticker_wraps: "أطباق شاورما",
      ticker_adana: "أدنّا عالجمر",
      ticker_fries: "أسياخ شيش طاووق",
      ticker_hummus: "أطباق فلافل",
      ticker_delivery: "توصيل سريع في سوسة",
      
      menu_section_title: "اختار شهوتك توا",
      menu_section_subtitle: "محضر بأصول شرقية ومشوي على الجمر الأحمر الحامي.",
      tab_plats: "أطباق",
      tab_enfant: "منيو الأطفال",
      
      about_fresh: "100% فريشك كل يوم",
      about_fresh_desc: "خضرة مقصوصة وثومية مخفوقة فريشك كل صباح.",
      about_charcoal: "فحم البلوط الأصلي",
      about_charcoal_desc: "نشويو كان على جمر الحطب الحقيقي للبنة المدخنة الأصلية.",
      
      gallery_title: "شيّخ عينيك بالبنة",
      gallery_subtitle: "تابعنا على إنستغرام <a href=\"https://www.instagram.com/babke_kebab/\" target=\"_blank\" class=\"instagram-link\">@babke_kebab</a> باش تشوف الجديد كل يوم.",
      
      reviews_title: "ثقة حرفائنا",
      reviews_subtitle: "كلام صحيح من ناس جربتنا. لا زينة لا تفشليم، كان البنة الحقيقية.",
      
      contact_locate: "أطلب و زورنا",
      contact_title: "زورنا في شارع الجمر",
      contact_location_title: "بلاصتنا",
      contact_phone: "كلم الشواية",
      contact_hours: "أوقات الخدمة",
      contact_delivery_card_title: "توصلك البنة لبلاصتك",
      contact_delivery_card_desc: "أطلب ديراكت من تطبيقات التوصيل المعروفة في سوسة وتوصلك في رمشة عين.",
      contact_delivery_btn: "أطلب",
      contact_map_title: "خريطة تفاعلية — وسط سوسة",
      contact_map_label_sub: "حمام سوسة",
      contact_map_footer: "كلمونا باش تحجزوا طاولتكم لبرا !",
      contact_map_directions: "الحصول على الاتجاهات في خرائط جوجل ➔",
      read_more_reviews: "اقرأ المزيد من تقييمات جوجل (4.3/5 ★ استنادًا إلى أكثر من 500 تقييم)",
      
      footer_nav_title: "تصفح الموقع",
      footer_powered: "تصميم",
      footer_nav_home: "الرئيسية",
      footer_nav_menu: "المنيو",
      footer_nav_about: "حكايتنا",
      footer_nav_gallery: "معرض الصور",
      footer_stay_connected: "تابعونا",
      
      nav_events: "الأحداث",
      events_title: "الأحداث القادمة",
      events_subtitle: "تفضل بزيارتنا! تلقانا حاضرين في الأحداث القادمة بوقيد مشوي عالجمر وبنتنا المعهودة.",
      event_status_cancelled: "ملغي",
      event_status_upcoming: "قريبًا",
      visit_stand: "زوروا الكشك متعنا",

      nav_wheel: "الرّودة",
      nav_loyalty: "الوفاء",
      menubook_title: "كرّاس المنيو",
      menubook_subtitle: "قلّب صفحات المنيو متاعنا. انزل على أي ماكلة باش تزيدها للكوموند.",
      menubook_cta: "قلّب الكرّاس",
      wheel_title: "رودة بابكي",
      wheel_subtitle: "جرّب زهرك بلاش: أطباق مشوية عالجمر، شاورما ولا طوابع زايدة. الجمر هو اللي يقرّر.",
      loyalty_title: "كل كوموند تخلّي طابعها",
      loyalty_subtitle: "طابع مع كل كوموند و ماكلة بلاش في الآخر. الكارت متاعك ديما في تليفونك."
    }
  };

  // 2. DOM TRANSLATION UPDATER FUNCTION
  const applyLanguage = (lang) => {
    // Merge dynamic content from BabkeDB if present
    if (typeof BabkeDB !== 'undefined') {
      const content = BabkeDB.getContent();
      if (content) {
        ['en', 'fr', 'tn'].forEach(l => {
          if (translations[l]) {
            if (content.hero) {
              if (content.hero.award && content.hero.award[l]) translations[l].hero_award = content.hero.award[l];
              if (content.hero.badge && content.hero.badge[l]) translations[l].hero_badge = content.hero.badge[l];
              if (content.hero.title && content.hero.title[l]) translations[l].hero_title = content.hero.title[l];
              if (content.hero.desc && content.hero.desc[l]) translations[l].hero_desc = content.hero.desc[l];
            }
            if (content.story) {
              if (content.story.heritage && content.story.heritage[l]) translations[l].about_heritage = content.story.heritage[l];
              if (content.story.title && content.story.title[l]) translations[l].about_section_title = content.story.title[l];
              if (content.story.p1 && content.story.p1[l]) translations[l].about_p1 = content.story.p1[l];
              if (content.story.p2 && content.story.p2[l]) translations[l].about_p2 = content.story.p2[l];
              if (content.story.p3 && content.story.p3[l]) translations[l].about_p3 = content.story.p3[l];
            }
            if (content.contact) {
              if (content.contact.address && content.contact.address[l]) translations[l].contact_location_desc = content.contact.address[l];
              if (content.contact.hours && content.contact.hours.weekday && content.contact.hours.weekday[l]) translations[l].contact_hours_desc1 = content.contact.hours.weekday[l];
              if (content.contact.hours && content.contact.hours.weekend && content.contact.hours.weekend[l]) translations[l].contact_hours_desc2 = content.contact.hours.weekend[l];
            }
            if (content.footer) {
              if (content.footer.desc && content.footer.desc[l]) translations[l].footer_desc = content.footer.desc[l];
              if (content.footer.rights && content.footer.rights[l]) translations[l].footer_rights = content.footer.rights[l];
            }
          }
        });
      }
    }

    // Set document attributes
    document.documentElement.setAttribute('lang', lang);
    if (lang === 'tn') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.body.classList.add('rtl-active');
    } else {
      document.documentElement.removeAttribute('dir');
      document.body.classList.remove('rtl-active');
    }

    // Replace text elements based on data-translate key
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(el => {
      const key = el.getAttribute('data-translate');
      if (translations[lang] && translations[lang][key]) {
        if (key === 'hero_title' || key === 'gallery_subtitle' || key.startsWith('about_p') || key === 'menu_section_subtitle') {
          el.innerHTML = translations[lang][key];
        } else {
          el.textContent = translations[lang][key];
        }
      }
    });

    // Update Language Button indicator label
    const currentCodeLabel = document.querySelector('.lang-current-code');
    if (currentCodeLabel) {
      currentCodeLabel.textContent = lang.toUpperCase();
    }

    // Save preference
    localStorage.setItem('babke_lang', lang);

    // Dispatch custom event to notify other scripts
    window.dispatchEvent(new CustomEvent('babkeLangChanged', { detail: { lang } }));
  };

  // 3. INJECT THE LANGUAGE DROPDOWN AND MARKS
  const setupLanguageUI = () => {
    const mappings = {
      ".navbar .nav-menu a[href='#home']": "nav_home",
      ".navbar .nav-menu a[href='#menu']": "nav_menu",
      ".navbar .nav-menu a[href='#about']": "nav_about",
      ".navbar .nav-menu a[href='#events']": "nav_events",
      ".navbar .nav-menu a[href='#gallery']": "nav_gallery",
      ".navbar .nav-menu a[href='#reviews']": "nav_reviews",
      ".navbar .nav-menu a[href='#contact']": "nav_contact",
      ".navbar .btn-delivery-pulse span": "nav_order_now",
      
      ".award-hero-badge span": "hero_award",
      ".hero-badge span:last-child": "hero_badge",
      ".hero-title": "hero_title",
      ".hero-description": "hero_desc",
      ".hero-actions .btn-primary-food": "hero_explore_menu",
      ".hero-actions .btn-secondary-dark": "hero_order_delivery",
      ".hero-stats .hero-stat-item:nth-child(1) .stat-txt": "hero_stat_charcoal",
      ".hero-stats .hero-stat-item:nth-child(2) .stat-txt": "hero_stat_spices",
      ".hero-stats .hero-stat-item:nth-child(3) .stat-txt": "hero_stat_social",
      ".glow-disc-wrapper .tag-1 span": "hero_tag_harissa",
      ".glow-disc-wrapper .tag-2 span": "hero_tag_toum",
      
      ".menu-section .section-title": "menu_section_title",
      ".menu-section .section-subtitle": "menu_section_subtitle",
      ".menu-tab[data-category='plats'] .tab-label": "tab_plats",
      ".menu-tab[data-category='enfant'] .tab-label": "tab_enfant",
      
      ".about-section .hero-badge span": "about_heritage",
      ".about-section .section-title": "about_section_title",
      ".about-features-grid .about-feat-item:nth-child(1) h4": "about_fresh",
      ".about-features-grid .about-feat-item:nth-child(1) p": "about_fresh_desc",
      ".about-features-grid .about-feat-item:nth-child(2) h4": "about_charcoal",
      ".about-features-grid .about-feat-item:nth-child(2) p": "about_charcoal_desc",
      ".about-section .about-p:nth-of-type(1)": "about_p1",
      ".about-section .about-p:nth-of-type(2)": "about_p2",
      ".about-section .about-p:nth-of-type(3)": "about_p3",
      
      ".gallery-section .section-title": "gallery_title",
      ".gallery-section .section-subtitle": "gallery_subtitle",
      
      ".events-section .section-title": "events_title",
      ".events-section .section-subtitle": "events_subtitle",
      
      ".reviews-section .section-title": "reviews_title",
      ".reviews-section .section-subtitle": "reviews_subtitle",
      
      ".contact-section .hero-badge span": "contact_locate",
      ".contact-section .section-title": "contact_title",
      ".info-blocks-grid .info-block:nth-child(1) h3": "contact_location_title",
      ".info-blocks-grid .info-block:nth-child(2) h3": "contact_phone",
      ".info-blocks-grid .info-block:nth-child(3) h3": "contact_hours",
      ".delivery-integration-card h4": "contact_delivery_card_title",
      ".delivery-integration-card p": "contact_delivery_card_desc",

      ".navbar .nav-menu a[href='#wheel']": "nav_wheel",
      ".navbar .nav-menu a[href='#loyalty']": "nav_loyalty",
      ".menubook-section .section-title": "menubook_title",
      ".menubook-section .section-subtitle": "menubook_subtitle",
      ".wheel-section .section-title": "wheel_title",
      ".wheel-section .section-subtitle": "wheel_subtitle",
      ".loyalty-section .section-title": "loyalty_title",
      ".loyalty-section .section-subtitle": "loyalty_subtitle"
    };

    Object.keys(mappings).forEach(selector => {
      const el = document.querySelector(selector);
      if (el) {
        el.setAttribute('data-translate', mappings[selector]);
      }
    });

    const navActions = document.querySelector('.nav-actions');
    if (navActions && !document.querySelector('.lang-selector-wrapper')) {
      const langWrapper = document.createElement('div');
      langWrapper.className = 'lang-selector-wrapper';
      langWrapper.innerHTML = `
        <button class="btn-lang-toggle" id="btn-lang-toggle" aria-label="Switch Language">
          <svg class="lang-globe-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
          </svg>
          <span class="lang-current-code">EN</span>
        </button>
        <div class="lang-dropdown" id="lang-dropdown">
          <button data-lang="en" class="lang-opt active">English (EN)</button>
          <button data-lang="fr" class="lang-opt">Français (FR)</button>
          <button data-lang="tn" class="lang-opt">تـونسي (TN)</button>
        </div>
      `;
      const themeToggle = document.getElementById('theme-toggle-btn');
      if (themeToggle) {
        navActions.insertBefore(langWrapper, themeToggle);
      } else {
        navActions.appendChild(langWrapper);
      }
    }

    const btnToggle = document.getElementById('btn-lang-toggle');
    const dropdown = document.getElementById('lang-dropdown');
    
    if (btnToggle && dropdown) {
      btnToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
      });

      document.addEventListener('click', () => {
        dropdown.classList.remove('open');
      });

      const options = dropdown.querySelectorAll('.lang-opt');
      options.forEach(opt => {
        opt.addEventListener('click', (e) => {
          const targetLang = e.currentTarget.dataset.lang;
          
          options.forEach(o => o.classList.remove('active'));
          e.currentTarget.classList.add('active');
          
          applyLanguage(targetLang);
          dropdown.classList.remove('open');
        });
      });
    }
  };

  setupLanguageUI();

  // Listen to dynamic content database changes to reload translations in real-time
  window.addEventListener('babkeContentChanged', () => {
    const savedLang = localStorage.getItem('babke_lang') || 'en';
    applyLanguage(savedLang);
  });

  const savedLang = localStorage.getItem('babke_lang') || 'en';
  applyLanguage(savedLang);
});
