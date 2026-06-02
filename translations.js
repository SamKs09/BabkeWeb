/* ==========================================================================
   BABKE KEBAB & PLATES — MULTI-LANGUAGE TRANSLATION SYSTEM (EN, FR, TN)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Language Translation Dictionary (Emojis Removed)
  const translations = {
    en: {
      nav_home: "Home",
      nav_menu: "Menu",
      nav_about: "Our Story",
      nav_gallery: "Socials",
      nav_reviews: "Reviews",
      nav_contact: "Find Us",
      nav_order_now: "Order Now",
      
      hero_award: "MEILLEUR CHAWARMA 2025 BY TORCHI.TN",
      hero_badge: "Sousse's Favorite Kebab Spot",
      hero_title: "THE STREETS OF <span class=\"highlight\">SOUSSE</span> JUST GOT FLAVOR.",
      hero_desc: "Charcoal-grilled Turkish Adana, toasted Lebanese-style chicken shawarma, and loaded crispy fries dripping with our signature garlic whip and spices. Hand-carved daily, served fresh.",
      hero_explore_menu: "Explore the Menu",
      hero_order_delivery: "Order Delivery",
      hero_stat_charcoal: "Charcoal Grilled",
      hero_stat_spices: "Levantine Spices",
      hero_stat_social: "Social Followers",
      hero_tag_harissa: "Spicy Harissa",
      hero_tag_toum: "Garlic Toum",
      
      ticker_text: " DINE IN & TAKEAWAY •  SPICY SHAWARMA WRAPS •  CHARCOAL GRILLED ADANA •  LOADED CHEDDAR FRIES •  FRESH CHICKPEA HUMMUS •  FAST SOUSSE DELIVERY • ",
      ticker_dine: "DINE IN & TAKEAWAY",
      ticker_wraps: "SPICY SHAWARMA WRAPS",
      ticker_adana: "CHARCOAL GRILLED ADANA",
      ticker_fries: "LOADED CHEDDAR FRIES",
      ticker_hummus: "FRESH CHICKPEA HUMMUS",
      ticker_delivery: "FAST SOUSSE DELIVERY",
      
      menu_section_title: "CHOOSE YOUR CRAVING",
      menu_section_subtitle: "Crafted with authentic Lebanese ingredients and grilled over red-hot embers.",
      tab_wraps: "Wraps & Sandwiches",
      tab_plates: "Feast Platters",
      tab_mezze: "Mezze & Dips",
      tab_specialties: "Specialties",
      
      about_heritage: "OUR HERITAGE",
      about_section_title: "FROM THE LEVANT STRAIGHT TO HAMMAM SOUSSE",
      about_fresh: "100% Fresh Daily",
      about_fresh_desc: "Vegetables sliced and sauces whipped fresh every single morning.",
      about_charcoal: "Authentic Oak Charcoal",
      about_charcoal_desc: "We grill exclusively over pure wood embers for that signature smokiness.",
      about_p1: "At <strong>Babke Kebab & Plates</strong>, we don’t believe in shortcuts. We set out with a clear, singular goal: to elevate the standard street kebab into a culinary experience.",
      about_p2: "Every single day, our team hand-stacks layers of premium, marinated chicken onto our vertical spit, creating the iconic slow-roasted shawarma. We hand-knead and spice our minced beef for our signature charcoal Adana skewers. Our legendary Lebanese garlic whip (toum) is made in-house using traditional techniques—never pre-packaged.",
      about_p3: "Located in the heart of Hammam Sousse, we blend authentic spices from the Levant with Sousse’s modern, trendy dining vibe. We invite you to sit back, watch the charcoal flame rise, and enjoy street-food the way it was meant to be made.",
      
      gallery_title: "FEAST WITH YOUR EYES",
      gallery_subtitle: "Follow us on Instagram <a href=\"https://www.instagram.com/babke_kebab/\" target=\"_blank\" class=\"instagram-link\">@babke_kebab</a> for your daily dose of smoke and cheddar.",
      
      reviews_title: "STREET CREDIBILITY",
      reviews_subtitle: "Real feedback from real diners. No fluff, just pure flavor reviews.",
      
      contact_locate: "LOCATE & CRAVE",
      contact_title: "VISIT THE STREET OF EMBER",
      contact_location_title: "Our Location",
      contact_location_desc: "Avenue des Orangers, Hammam Sousse, Tunisia",
      contact_phone: "Call the Grill",
      contact_phone_desc: "+216 73 821 999",
      contact_hours: "Operating Hours",
      contact_hours_desc1: "Mon - Thu: 11:30 AM - Midnight",
      contact_hours_desc2: "Fri - Sun: 11:30 AM - 1:00 AM",
      contact_delivery_card_title: "GET IT DELIVERED TO YOUR COUCH",
      contact_delivery_card_desc: "Order direct through Sousse's leading food apps for blazing fast delivery straight to your doorstep.",
      contact_delivery_btn: "Order",
      contact_map_title: "Interactive Map — Sousse Center",
      contact_map_label_sub: "HAMMAM SOUSSE",
      contact_map_footer: "Call to reserve outdoor seats!",
      contact_map_directions: "GET DIRECTIONS ON GOOGLE MAPS ➔",
      read_more_reviews: "READ MORE REAL GOOGLE REVIEWS (4.3/5 ★ based on 500+ reviews)",
      
      footer_desc: "Elevating the street kebab experience with Levant spices and charcoal embers in Hammam Sousse.",
      footer_nav_title: "Navigation",
      footer_nav_home: "Home",
      footer_nav_menu: "Menu",
      footer_nav_about: "Our Story",
      footer_nav_gallery: "Social Gallery",
      footer_stay_connected: "Stay Connected",
      footer_rights: "© 2026 Babke Kebab & Plates. Built with passion for street food.",
      
      // Menu Items EN
      menu_item1_title: "Chicken Shawarma Wrap",
      menu_item1_desc: "Slow-roasted vertical spit chicken shawarma, homemade Lebanese garlic paste (toum), tangy cucumber pickles, French fries wrapped in thin flatbread and toasted to crispy gold.",
      menu_item1_tag_award: "Meilleur Chawarma 2025",
      menu_item1_tag_spicy: "Spicy Option",
      menu_item1_tag_seller: "Best Seller",
      
      menu_item2_title: "Babke \"2 Viandes\" Wrap",
      menu_item2_desc: "The ultimate meat union. Toasted wrap filled with slow-cooked chicken shawarma AND tender minced beef kebab, rich garlic whip, hummus layer, fresh onions, tomatoes, and sumac.",
      menu_item2_tag_sig: "Signature",
      
      menu_item3_title: "Cheddarli Taouk",
      menu_item3_desc: "Skewered cubes of marinated breast chicken (Chich Taouk) grilled over open charcoal, rolled in flatbread and flooded with rich, warm liquid cheddar cheese sauce.",
      menu_item3_tag_cheese: "Extra Cheesy",
      
      menu_item4_title: "Crispy Falafel Wrap",
      menu_item4_desc: "Vibrant homemade falafel discs fried to absolute crispiness, loaded with nutty sesame tahini sauce, fresh mint leaves, pickled turnips, tomatoes, radishes, and sliced cucumber.",
      menu_item4_tag_vegan: "Vegan",
      
      menu_item5_title: "Plat Royal Babke",
      menu_item5_desc: "The king of the grill. A massive platter showcasing two skewers of charcoal Adana kebab, one skewer of Chich Taouk, chicken shawarma carvings, served with creamy hummus, garlic whip, fries, and warm pita.",
      menu_item5_tag_royal: "Royal Feast",
      
      menu_item6_title: "Plat Kebab Adana",
      menu_item6_desc: "Traditional hand-minced beef and lamb shoulder kebab mixed with red bell peppers, authentic spices, grilled over red-hot charcoal. Served on flatbread with chargrilled tomatoes and sumac-onion salad.",
      menu_item6_tag_heat: "Medium Heat",
      
      menu_item7_title: "Plat Chawarma",
      menu_item7_desc: "A mountain of vertical-spit carved chicken shawarma, drizzled with Lebanese garlic whip, served with fresh house tabbouleh salad, crisp French fries, pickles, and grilled flatbread.",
      
      menu_item8_title: "Hummus & Shawarma Dip",
      menu_item8_desc: "Smooth, rich chickpea purée blended with premium sesame tahini, fresh lemon juice, garlic, topped with warm, juicy chicken shawarma carvings, toasted pine nuts, sumac, and olive oil.",
      menu_item8_tag_pop: "Popular",
      
      menu_item9_title: "Smoky Baba Ghanoush",
      menu_item9_desc: "Charcoal-roasted eggplant mashed with sesame tahini, garlic, lemon juice, sumac, and extra virgin olive oil, crowned with fresh pomegranate seeds for a sweet burst.",
      
      menu_item10_title: "Vibrant Lebanese Tabbouleh",
      menu_item10_desc: "Super finely hand-chopped flat-leaf parsley, fresh mint, red ripe tomatoes, green onions, and fine bulgur wheat, tossed in a zesty freshly squeezed lemon juice and cold olive oil dressing.",
      
      menu_item11_title: "Spicy Loaded Babke Fries",
      menu_item11_desc: "A mountain of house-cut golden fries loaded with slow-roasted chicken shawarma strips, flooded with warm cheddar cheese sauce, garlic whip, and a fiery drizzle of Tunisian harissa-mayo.",
      menu_item11_tag_cheat: "Cheat Meal Dream",
      
      menu_item12_title: "Fattet Chawarma",
      menu_item12_desc: "An incredible Levantine comfort dish. Layers of crispy toasted pita bread chips, spiced basmati rice, slow-cooked chicken shawarma, bathed in a warm garlic-tahini yogurt sauce, and sprinkled with fried pine nuts.",
      menu_item12_tag_chef: "Chef Special"
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
      hero_badge: "Le Kebab Préféré de Sousse",
      hero_title: "LES RUES DE <span class=\"highlight\">SOUSSE</span> ONT ENFIN DU GOÛT.",
      hero_desc: "Adana turc grillé au charbon de bois, chawarma de poulet libanais grillé, et frites croustillantes loaded nappées de notre crème d'ail signature et d'épices du Levant. Préparé frais tous les jours.",
      hero_explore_menu: "Découvrir le Menu",
      hero_order_delivery: "Commander Livraison",
      hero_stat_charcoal: "Grillé au Charbon",
      hero_stat_spices: "Épices du Levant",
      hero_stat_social: "Abonnés Sociaux",
      hero_tag_harissa: "Harissa Piquante",
      hero_tag_toum: "Toum à l'Ail",
      
      ticker_text: " SUR PLACE & À EMPORTER •  CHAWARMA ÉPICÉ •  ADANA TURC AU CHARBON •  FRITES LOADED AU CHEDDAR •  HOUMOUS MAISON FRAIS •  LIVRAISON SOUSSE RAPIDE • ",
      ticker_dine: "SUR PLACE & À EMPORTER",
      ticker_wraps: "CHAWARMA ÉPICÉ",
      ticker_adana: "ADANA TURC AU CHARBON",
      ticker_fries: "FRITES LOADED AU CHEDDAR",
      ticker_hummus: "HOUMOUS MAISON FRAIS",
      ticker_delivery: "LIVRAISON SOUSSE RAPIDE",
      
      menu_section_title: "CHOISISSEZ VOTRE ENVIE",
      menu_section_subtitle: "Préparé avec d'authentiques ingrédients libanais et grillé sur des braises de bois ardentes.",
      tab_wraps: "Wraps & Sandwichs",
      tab_plates: "Plats Grillades",
      tab_mezze: "Mezzés & Entrées",
      tab_specialties: "Spécialités",
      
      about_heritage: "NOTRE HÉRITAGE",
      about_section_title: "DU LEVANT DIRECTEMENT À HAMMAM SOUSSE",
      about_fresh: "100% Frais du Jour",
      about_fresh_desc: "Légumes découpés et sauces maison fouettées chaque matin.",
      about_charcoal: "Véritable Charbon de Bois",
      about_charcoal_desc: "Nous grillons exclusivement sur de vraies braises pour ce goût fumé inimitable.",
      about_p1: "Chez <strong>Babke Kebab & Plates</strong>, nous ne croyons pas aux raccourcis. Nous sommes partis d'un objectif clair et unique : élever le kebab de rue standard au rang d'expérience culinaire.",
      about_p2: "Chaque jour, notre équipe empile à la main des couches de poulet mariné de première qualité sur notre broche verticale, créant ainsi notre chawarma rôti lentement. Nous pétrissons et épiçons notre bœuf haché à la main pour nos brochettes Adana au charbon. Notre légendaire crème d'ail libanaise (toum) est préparée sur place selon des techniques traditionnelles — jamais pré-emballée.",
      about_p3: "Situés au cœur de Hammam Sousse, nous marions les épices authentiques du Levant avec l'ambiance moderne et branchée de Sousse. Nous vous invitons à vous installer confortablement, à regarder les braises s'enflammer et à savourer la street-food telle qu'elle doit être faite.",
      
      gallery_title: "RÉGALEZ VOS YEUX",
      gallery_subtitle: "Suivez-nous sur Instagram <a href=\"https://www.instagram.com/babke_kebab/\" target=\"_blank\" class=\"instagram-link\">@babke_kebab</a> pour votre dose quotidienne de fumée et cheddar.",
      
      reviews_title: "CRÉDIBILITÉ DE LA RUE",
      reviews_subtitle: "Vrais retours de nos clients. Pas de chichis, juste de la pure saveur.",
      
      contact_locate: "TROUVEZ & SAVOUREZ",
      contact_title: "VISITEZ LA RUE DE LA BRAISE",
      contact_location_title: "Notre Emplacement",
      contact_location_desc: "Avenue des Orangers, Hammam Sousse, Tunisie",
      contact_phone: "Appeler le Grill",
      contact_phone_desc: "+216 73 821 999",
      contact_hours: "Heures d'Ouverture",
      contact_hours_desc1: "Lun - Jeu: 11h30 - Minuit",
      contact_hours_desc2: "Ven - Dim: 11h30 - 01h00 du matin",
      contact_delivery_card_title: "LIVRÉ SUR VOTRE CANAPÉ",
      contact_delivery_card_desc: "Commandez via les meilleures applications de livraison de Sousse pour recevoir votre repas en un éclair.",
      contact_delivery_btn: "Commander",
      contact_map_title: "Carte Interactive — Sousse Centre",
      contact_map_label_sub: "HAMMAM SOUSSE",
      contact_map_footer: "Appelez pour réserver en terrasse !",
      contact_map_directions: "OBTENIR L'ITINÉRAIRE SUR GOOGLE MAPS ➔",
      read_more_reviews: "LIRE PLUS D'AVIS GOOGLE (4.3/5 ★ basés sur 500+ avis)",
      
      footer_desc: "Sublimer l'expérience du kebab de rue avec les épices du Levant et les braises de charbon à Hammam Sousse.",
      footer_nav_title: "Navigation",
      footer_nav_home: "Accueil",
      footer_nav_menu: "Menu",
      footer_nav_about: "Notre Histoire",
      footer_nav_gallery: "Réseaux Sociaux",
      footer_stay_connected: "Restez Connectés",
      footer_rights: "© 2026 Babke Kebab & Plates. Conçu avec passion pour la street food.",
      
      // Menu Items FR
      menu_item1_title: "Chawarma Poulet Classique",
      menu_item1_desc: "Chawarma de poulet rôti lentement à la broche, crème d'ail libanaise maison (toum), cornichons croquants, frites enroulées dans un pain plat et grillées.",
      menu_item1_tag_award: "Meilleur Chawarma 2025",
      menu_item1_tag_spicy: "Option Épicé",
      menu_item1_tag_seller: "Best-Seller",
      
      menu_item2_title: "Wrap Babke \"2 Viandes\"",
      menu_item2_desc: "L'union parfaite des viandes. Wrap grillé fourré au chawarma de poulet ET kebab de bœuf tendre, crème d'ail, lit de houmous, oignons frais, tomates et sumac.",
      menu_item2_tag_sig: "Signature",
      
      menu_item3_title: "Cheddarli Taouk",
      menu_item3_desc: "Cubes de blanc de poulet mariné (Chich Taouk) grillés au charbon, roulés dans un pain plat et inondés d'une sauce cheddar chaude et coulante.",
      menu_item3_tag_cheese: "Extra Fromage",
      
      menu_item4_title: "Falafel Wrap Croustillant",
      menu_item4_desc: "Falafels maison ultra-croustillants, sauce tahini au sésame, menthe fraîche, navets marinés, tomates, radis et concombre.",
      menu_item4_tag_vegan: "Végan",
      
      menu_item5_title: "Plat Royal Babke",
      menu_item5_desc: "Le roi de la grillade. Un grand plateau composé de deux brochettes d'Adana de bœuf au charbon, une brochette de Chich Taouk, chawarma de poulet, servi avec houmous, crème d'ail, frites et pain pita chaud.",
      menu_item5_tag_royal: "Festin Royal",
      
      menu_item6_title: "Plat Kebab Adana",
      menu_item6_desc: "Kebab traditionnel de bœuf et d'agneau haché maison aux poivrons rouges et épices, grillé au charbon de bois. Servi sur pain plat avec tomates grillées et salade d'oignons au sumac.",
      menu_item6_tag_heat: "Épicé Moyen",
      
      menu_item7_title: "Plat Chawarma",
      menu_item7_desc: "Une montagne de chawarma de poulet rôti à la broche verticale, nappé de crème d'ail libanaise, servi avec taboulé maison frais, frites croustillantes, cornichons et pain plat grillé.",
      
      menu_item8_title: "Hummus & Chawarma",
      menu_item8_desc: "Purée de pois chiches crémeuse au tahini, jus de citron frais et ail, surmontée de chawarma de poulet chaud, pignons de pin grillés, sumac et huile d'olive vierge extra.",
      menu_item8_tag_pop: "Populaire",
      
      menu_item9_title: "Smoky Baba Ghanoush",
      menu_item9_desc: "Aubergines grillées au charbon de bois et écrasées avec du tahini, ail, citron, sumac et huile d'olive, garnies de graines de grenade fraîches.",
      
      menu_item10_title: "Taboulé Libanais Frais",
      menu_item10_desc: "Persil plat finement haché à la main, menthe fraîche, tomates mûres, oignons verts et boulgour fin, assaisonnés de jus de citron pressé et d'huile d'olive.",
      
      menu_item11_title: "Frites Loaded Épicées",
      menu_item11_desc: "Une montagne de frites dorées surmontée d'émincé de chawarma de poulet, nappée de sauce cheddar chaude, crème d'ail et d'un filet de harissa-mayo maison.",
      menu_item11_tag_cheat: "Plaisir Coupable",
      
      menu_item12_title: "Fattet Chawarma",
      menu_item12_desc: "Un plat de confort ultime du Levant. Couches de pain pita croustillant, riz basmati épicé, chawarma de poulet, nappés d'une sauce yaourt au tahini et à l'ail, saupoudrés de pignons grillés.",
      menu_item12_tag_chef: "Spécial Chef"
    },
    tn: {
      nav_home: "الرئيسية",
      nav_menu: "المنيو",
      nav_about: "حكايتنا",
      nav_gallery: "التواصل",
      nav_reviews: "الآراء",
      nav_contact: "زورنا",
      nav_order_now: "أطلب توا",
      
      hero_award: "أحسن شاورما 2025 من تورشي.تن",
      hero_badge: "البلاصة المفضلة للكل في سوسة",
      hero_title: "شوارع <span class=\"highlight\">سوسة</span> توا ولا فيها البنة.",
      hero_desc: "أدنّا تركي مشوي على الجمر، شاورما دجاج لبنانية محمصة، وبطاطا مقرمشة غارقة بالتشيدر والثومية الخاصة. مقصوصة فريشك كل يوم.",
      hero_explore_menu: "اكتشف المنيو",
      hero_order_delivery: "أطلب توصيل",
      hero_stat_charcoal: "مشوي عالجمر",
      hero_stat_spices: "بهارات شامية",
      hero_stat_social: "متابعين",
      hero_tag_harissa: "هريسة محرحرة",
      hero_tag_toum: "ثومية بنينة",
      
      ticker_text: " على عين المكان وتيك أواي •  شاورما حارة •  أدنّا عالجمر •  بطاطا بالتشيدر •  حمص فريشك •  توصيل سريع في سوسة • ",
      ticker_dine: "على عين المكان وتيك أواي",
      ticker_wraps: "شاورما حارة",
      ticker_adana: "أدنّا عالجمر",
      ticker_fries: "بطاطا بالتشيدر",
      ticker_hummus: "حمص فريشك",
      ticker_delivery: "توصيل سريع في سوسة",
      
      menu_section_title: "اختار شهوتك توا",
      menu_section_subtitle: "محضر بأصول لبنانية ومشوي على الجمر الأحمر الحامي.",
      tab_wraps: "سندويشات",
      tab_plates: "أطباق مشوية",
      tab_mezze: "مقبلات و غطوس",
      tab_specialties: "العروض الخاصة",
      
      about_heritage: "أصولنا وبنتنا",
      about_section_title: "من بلاد الشام ديراكت لحمام سوسة",
      about_fresh: "100% فريشك كل يوم",
      about_fresh_desc: "خضرة مقصوصة وثومية مخفوقة فريشك كل صباح.",
      about_charcoal: "فحم البلوط الأصلي",
      about_charcoal_desc: "نشويو كان على جمر الحطب الحقيقي للبنة المدخنة الأصلية.",
      about_p1: "في <strong>بَبكي كباب وأطباق</strong>، مانؤمنوش بالطرق السهلة. هدفنا واضح وواحد من الأول: نطلعوا بكباب الشارع العادي لمرتبة التجربة الفريدة والبنينة.",
      about_p2: "كل يوم، نحضروا دجاجنا المتبل ونرصوه باليد على الشواية العمودية باش نخرجوا أحسن شاورما. ونعجنوا ونبهّروا اللحم المفروم بيدينا باش نعملوا شواش أدنّا المشوية عالجمر. والثومية اللبنانية الشهيرة متاعنا نحضروها في المحل بالطريقة التقليدية — فريشك وبلاش مواد حافظة.",
      about_p3: "في قلب حمام سوسة، نخلطوا بهارات الشام الأصلية مع الجو العصري والمزيان متع سوسة. ندعيوكم باش تقعدوا شيخين، وتتفرجوا على لهيب الجمر وتذوقوا الماكلة الشعبية بأصولها الحقيقية.",
      
      gallery_title: "شيّخ عينيك بالبنة",
      gallery_subtitle: "تابعنا على إنستغرام <a href=\"https://www.instagram.com/babke_kebab/\" target=\"_blank\" class=\"instagram-link\">@babke_kebab</a> باش تشوف الجديد كل يوم.",
      
      reviews_title: "ثقة حرفائنا",
      reviews_subtitle: "كلام صحيح من ناس جربتنا. لا زينة لا تفشليم، كان البنة الحقيقية.",
      
      contact_locate: "أطلب و زورنا",
      contact_title: "زورنا في شارع الجمر",
      contact_location_title: "بلاصتنا",
      contact_location_desc: "شارع البرتقال، حمام سوسة، تونس",
      contact_phone: "كلم الشواية",
      contact_phone_desc: "+216 73 821 999",
      contact_hours: "أوقات الخدمة",
      contact_hours_desc1: "الإثنين - الخميس: 11:30 صباحًا - منتصف الليل",
      contact_hours_desc2: "الجمعة - الأحد: 11:30 صباحًا - 1:00 صباحًا",
      contact_delivery_card_title: "توصلك البنة لبلاصتك",
      contact_delivery_card_desc: "أطلب ديراكت من تطبيقات التوصيل المعروفة في سوسة وتوصلك في رمشة عين.",
      contact_delivery_btn: "أطلب",
      contact_map_title: "خريطة تفاعلية — وسط سوسة",
      contact_map_label_sub: "حمام سوسة",
      contact_map_footer: "كلمونا باش تحجزوا طاولتكم لبرا !",
      contact_map_directions: "الحصول على الاتجاهات في خرائط جوجل ➔",
      read_more_reviews: "اقرأ المزيد من تقييمات جوجل (4.3/5 ★ استنادًا إلى أكثر من 500 تقييم)",
      
      footer_desc: "نطلعوا بكباب الشارع لمرتبة البنة الحقيقية ببهارات الشام وجمر الحطب في حمام سوسة.",
      footer_nav_title: "تصفح الموقع",
      footer_nav_home: "الرئيسية",
      footer_nav_menu: "المنيو",
      footer_nav_about: "حكايتنا",
      footer_nav_gallery: "معرض الصور",
      footer_stay_connected: "تابعونا",
      footer_rights: "© 2026 بَبكي كباب وأطباق. محضر بكل حب وشغف لبلادنا.",
      
      // Menu Items TN
      menu_item1_title: "لفّة شاورما دجاج",
      menu_item1_desc: "شاورما دجاج محضرة عالسيخ المشوي، ثومية لبنانية بنينة محضرينها في المحل، خيار مخلل، وبطاطا مقلية ملفوفة في خبز رقيق ومحمرة للبنة الكاملة.",
      menu_item1_tag_award: "أحسن شاورما 2025",
      menu_item1_tag_spicy: "محرحر",
      menu_item1_tag_seller: "الأكثر طلبًا",
      
      menu_item2_title: "لفّة بَبكي \"2 لحوم\"",
      menu_item2_desc: "البنة الدوبل! خبز ملفوف ومحمر معبي بشاورما الدجاج المشوي وكباب اللحم المفروم المتبل، ثومية، حمص، بصل فريشك، طماطم وسماق.",
      menu_item2_tag_sig: "خاص بالمحل",
      
      menu_item3_title: "شيش طاووق بالتشيدر",
      menu_item3_desc: "طروف صدر دجاج متبل ومشوين عالجمر الحقيقي، ملفوفين في خبز رقيق وغارقين بصلصة جبن التشيدر الدافية والذايبة.",
      menu_item3_tag_cheese: "جبن إضافي",
      
      menu_item4_title: "لفّة فلافل مقرمشة",
      menu_item4_desc: "أقراص فلافل فريشك مقرمشة ومقلية كما يحب الخاطر، معبية بصلصة الطحينة بالجلجلان، نعناع، لفت مخلل، طماطم، فجل وخيار.",
      menu_item4_tag_vegan: "نباتي",
      
      menu_item5_title: "طبق ملكي بَبكي",
      menu_item5_desc: "سلطان الطاولة! طبق كبير معبي بزوز شواش كباب أدنّا عالجمر، شيش طاووق، شاورما دجاج، حمص فريشك، ثومية، بطاطا مقلية وخبز بيتا سخون.",
      menu_item5_tag_royal: "وليمة ملكية",
      
      menu_item6_title: "طبق كباب أدنّا",
      menu_item6_desc: "كباب لحم مفروم بأصول تركية مشوي عالجمر مع فلفل أحمر وبهارات خاصة. يقدم مع خبز رقيق، طماطم مشوية وسلطة بصل بالسماق.",
      menu_item6_tag_heat: "حرورية متوسطة",
      
      menu_item7_title: "طبق شاورما",
      menu_item7_desc: "جبل من شاورما الدجاج المقصوصة مالسيخ المشوي، ثومية، يقدم مع تبولة فريشك محضرينها بيدينا، بطاطا مقلية مقرمشة، خيار مخلل وخبز سخون.",
      
      menu_item8_title: "حمص بالشاورما",
      menu_item8_desc: "حمص مرحي فريشك بالليمون والطحينة وزيت الزيتون، فوقو شاورما دجاج سخونة، فاكهة مقلية، سماق وزيت زيتونة بكر أصلي.",
      menu_item8_tag_pop: "محبوب الكل",
      
      menu_item9_title: "بابا غنوج مدخن",
      menu_item9_desc: "بيتنجان مشوي عالجمر ومرحي مع الطحينة، ثوم، قارص، سماق وزيت زيتونة، مزين بحبات الرمان الفريشك للبنة الحلوة.",
      
      menu_item10_title: "تبولة لبنانية",
      menu_item10_desc: "معدنوس مقصوص جويد باليد، نعناع فريشك، طماطم حمراء، بصل أخضر وبرغل جويد، متبلين بالقارص المعصور وزيت الزيتونة الفريشك.",
      
      menu_item11_title: "بطاطا بَبكي المحرحرة",
      menu_item11_desc: "صحفة كبيرة معبية بالبطاطا المقلية المقرمشة وفوقها طروف شاورما دجاج سخونة، صوص جبن تشيدر دايبة، ثومية، ورشة مايونيز بالهريسة التونسية المحرحرة.",
      menu_item11_tag_cheat: "شيخة الماكلة",
      
      menu_item12_title: "فتة شاورما دجاج",
      menu_item12_desc: "أقوى ماكلة شامية تدفيك! طبقات من خبز البيتا المقرمش، روز بسمتي متبل، شاورما دجاج، صوص ياغورت بالطحينة والثوم السخونة، ومرشوش بالفاكهة المقلية.",
      menu_item12_tag_chef: "شيف خاص"
    }
  };

  // 2. DOM TRANSLATION UPDATER FUNCTION
  const applyLanguage = (lang) => {
    // A. Set document attributes
    document.documentElement.setAttribute('lang', lang);
    if (lang === 'tn') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.body.classList.add('rtl-active');
    } else {
      document.documentElement.removeAttribute('dir');
      document.body.classList.remove('rtl-active');
    }

    // B. Replace text elements based on data-translate key
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(el => {
      const key = el.getAttribute('data-translate');
      if (translations[lang] && translations[lang][key]) {
        // If element is heading or title with highlighted spans or paragraphs, update innerHTML
        if (key === 'hero_title' || key === 'gallery_subtitle' || key.startsWith('about_p')) {
          el.innerHTML = translations[lang][key];
        } else {
          el.textContent = translations[lang][key];
        }
      }
    });

    // C. Update scrolling ticker values (Handled automatically by data-translate on individual spans to prevent double bullets and preserve alternating colors)

    // D. Update Language Button indicator
    const currentCodeLabel = document.querySelector('.lang-current-code');
    if (currentCodeLabel) {
      currentCodeLabel.textContent = lang.toUpperCase();
    }

    // E. Save choice
    localStorage.setItem('babke_lang', lang);

    // F. Dispatch custom event to notify other scripts (like cart.js)
    window.dispatchEvent(new CustomEvent('babkeLangChanged', { detail: { lang } }));
  };

  // 3. INJECT THE LANGUAGE DROPDOWN AND MARKS
  const setupLanguageUI = () => {
    const mappings = {
      ".navbar .nav-menu a[href='#home']": "nav_home",
      ".navbar .nav-menu a[href='#menu']": "nav_menu",
      ".navbar .nav-menu a[href='#about']": "nav_about",
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
      
      ".menu-section .section-title": "menu_section_title",
      ".menu-section .section-subtitle": "menu_section_subtitle",
      ".menu-tab[data-category='wraps'] .tab-label": "tab_wraps",
      ".menu-tab[data-category='plates'] .tab-label": "tab_plates",
      ".menu-tab[data-category='mezze'] .tab-label": "tab_mezze",
      ".menu-tab[data-category='specialties'] .tab-label": "tab_specialties",
      
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
      
      ".reviews-section .section-title": "reviews_title",
      ".reviews-section .section-subtitle": "reviews_subtitle",
      
      ".contact-section .hero-badge span": "contact_locate",
      ".contact-section .section-title": "contact_title",
      ".info-blocks-grid .info-block:nth-child(1) h3": "contact_location_title",
      ".info-blocks-grid .info-block:nth-child(2) h3": "contact_phone",
      ".info-blocks-grid .info-block:nth-child(3) h3": "contact_hours",
      ".delivery-integration-card h4": "contact_delivery_card_title",
      ".delivery-integration-card p": "contact_delivery_card_desc"
    };

    Object.keys(mappings).forEach(selector => {
      const el = document.querySelector(selector);
      if (el) {
        el.setAttribute('data-translate', mappings[selector]);
      }
    });

    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
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

  const savedLang = localStorage.getItem('babke_lang') || 'en';
  applyLanguage(savedLang);
});
