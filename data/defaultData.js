/* ==========================================================================
   BABKE KEBAB & PLATES — INITIAL SEED DATA
   ========================================================================== */

const DEFAULT_DATA = {
  menu: [
    {
      id: "item-0",
      category: "wraps",
      price: 12.5,
      image: "assets/shawarma_wrap.jpg",
      fallbackImage: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Chicken Shawarma Wrap",
        fr: "Chawarma Poulet Classique",
        tn: "لفّة شاورما دجاج"
      },
      description: {
        en: "Slow-roasted vertical spit chicken shawarma, homemade Lebanese garlic paste (toum), tangy cucumber pickles, French fries wrapped in thin flatbread and toasted to crispy gold.",
        fr: "Chawarma de poulet rôti lentement à la broche, crème d'ail libanaise maison (toum), cornichons croquants, frites enroulées dans un pain plat et grillées.",
        tn: "شاورما دجاج محضرة عالسيخ المشوي، ثومية شرقية بنينة محضرينها في المحل، خيار مخلل، وبطاطا مقلية ملفوفة في خبز رقيق ومحمرة للبنة الكاملة."
      },
      tags: {
        en: ["Meilleur Chawarma 2025", "Spicy Option", "Best Seller"],
        fr: ["Meilleur Chawarma 2025", "Option Épicé", "Best-Seller"],
        tn: ["أحسن شاورما 2025", "محرحر", "الأكثر طلبًا"]
      }
    },
    {
      id: "item-1",
      category: "wraps",
      price: 16.0,
      image: "assets/two_viandes.jpg",
      fallbackImage: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Babke \"2 Viandes\" Wrap",
        fr: "Wrap Babke \"2 Viandes\"",
        tn: "لفّة بَبكي \"2 لحوم\""
      },
      description: {
        en: "The ultimate meat union. Toasted wrap filled with slow-cooked chicken shawarma AND tender minced beef kebab, rich garlic whip, hummus layer, fresh onions, tomatoes, and sumac.",
        fr: "L'union parfaite des viandes. Wrap grillé fourré au chawarma de poulet ET kebab de bœuf tendre, crème d'ail, lit de houmous, oignons frais, tomates et sumac.",
        tn: "البنة الدوبل! خبز ملفوف ومحمر معبي بشاورما الدجاج المشوي وكباب اللحم المفروم المتبل، ثومية، حمص، بصل فريشك، طماطم وسماق."
      },
      tags: {
        en: ["Signature"],
        fr: ["Signature"],
        tn: ["خاص بالمحل"]
      }
    },
    {
      id: "item-2",
      category: "wraps",
      price: 14.0,
      image: "assets/cheddarli_taouk.jpg",
      fallbackImage: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Cheddarli Taouk",
        fr: "Cheddarli Taouk",
        tn: "شيش طاووق بالتشيدر"
      },
      description: {
        en: "Skewered cubes of marinated breast chicken (Chich Taouk) grilled over open charcoal, rolled in flatbread and flooded with rich, warm liquid cheddar cheese sauce.",
        fr: "Cubes de blanc de poulet mariné (Chich Taouk) grillés au charbon, roulés dans un pain plat et inondés d'une sauce cheddar chaude et coulante.",
        tn: "طروف صدر دجاج متبل ومشوين عالجمر الحقيقي، ملفوفين في خبز رقيق وغارقين بصلصة جبن التشيدر الدافية والذايبة."
      },
      tags: {
        en: ["Extra Cheesy"],
        fr: ["Extra Fromage"],
        tn: ["جبن إضافي"]
      }
    },
    {
      id: "item-3",
      category: "wraps",
      price: 9.5,
      image: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=600&auto=format&fit=crop&q=80",
      fallbackImage: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Crispy Falafel Wrap",
        fr: "Falafel Wrap Croustillant",
        tn: "لفّة فلافل مقرمشة"
      },
      description: {
        en: "Vibrant homemade falafel discs fried to absolute crispiness, loaded with nutty sesame tahini sauce, fresh mint leaves, pickled turnips, tomatoes, radishes, and sliced cucumber.",
        fr: "Falafels maison ultra-croustillants, sauce tahini au sésame, menthe fraîche, navets marinés, tomates, radis et concombre.",
        tn: "أقراص فلافل فريشك مقرمشة ومقلية كما يحب الخاطر، معبية بصلصة الطحينة بالجلجلان، نعناع، لفت مخلل، طماطم، فجل وخيار."
      },
      tags: {
        en: ["Vegan"],
        fr: ["Végan"],
        tn: ["نباتي"]
      }
    },
    {
      id: "item-4",
      category: "plates",
      price: 34.0,
      image: "assets/plat_royal.jpg",
      fallbackImage: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Plat Royal Babke",
        fr: "Plat Royal Babke",
        tn: "طبق ملكي بَبكي"
      },
      description: {
        en: "The king of the grill. A massive platter showcasing two skewers of charcoal Adana kebab, one skewer of Chich Taouk, chicken shawarma carvings, served with creamy hummus, garlic whip, fries, and warm pita.",
        fr: "Le roi de la grillade. Un grand plateau composé de deux brochettes d'Adana de bœuf au charbon, une brochette de Chich Taouk, chawarma de poulet, servi avec houmous, crème d'ail, frites et pain pita chaud.",
        tn: "سلطان الطاولة! طبق كبير معبي بزوز شواش كباب أدنّا عالجمر، شيش طاووق، شاورما دجاج، حمص فريشك، ثومية، بطاطا مقلية وخبز بيتا سخون."
      },
      tags: {
        en: ["Royal Feast"],
        fr: ["Festin Royal"],
        tn: ["وليمة ملكية"]
      }
    },
    {
      id: "item-5",
      category: "plates",
      price: 22.0,
      image: "assets/plat_adana.jpg",
      fallbackImage: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Plat Kebab Adana",
        fr: "Plat Kebab Adana",
        tn: "طبق كباب أدنّا"
      },
      description: {
        en: "Traditional hand-minced beef and lamb shoulder kebab mixed with red bell peppers, authentic spices, grilled over red-hot charcoal. Served on flatbread with chargrilled tomatoes and sumac-onion salad.",
        fr: "Kebab traditionnel de bœuf et d'agneau haché maison aux poivrons rouges et épices, grillé au charbon de bois. Servi sur pain plat avec tomates grillées et salade d'oignons au sumac.",
        tn: "كباب لحم مفروم بأصول تركية مشوي عالجمر مع فلفل أحمر وبهارات خاصة. يقدم مع خبز رقيق، طماطم مشوية وسلطة بصل بالسماق."
      },
      tags: {
        en: ["Medium Heat"],
        fr: ["Épicé Moyen"],
        tn: ["حرورية متوسطة"]
      }
    },
    {
      id: "item-6",
      category: "plates",
      price: 18.5,
      image: "assets/plat_chawarma.jpg",
      fallbackImage: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Plat Chawarma",
        fr: "Plat Chawarma",
        tn: "طبق شاورما"
      },
      description: {
        en: "A mountain of vertical-spit carved chicken shawarma, drizzled with Lebanese garlic whip, served with fresh house tabbouleh salad, crisp French fries, pickles, and grilled flatbread.",
        fr: "Une montagne de chawarma de poulet rôti à la broche verticale, nappé de crème d'ail libanaise, servi avec taboulé maison frais, frites croustillantes, cornichons et pain plat grillé.",
        tn: "جبل من شاورما الدجاج المقصوصة مالسيخ المشوي، ثومية، يقدم مع تبولة فريشك محضرينها بيدينا، بطاطا مقلية مقرمشة، خيار مخلل وخبز سخون."
      },
      tags: {
        en: [],
        fr: [],
        tn: []
      }
    },
    {
      id: "item-7",
      category: "mezze",
      price: 11.0,
      image: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=600&auto=format&fit=crop&q=80",
      fallbackImage: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Hummus & Shawarma Dip",
        fr: "Hummus & Chawarma",
        tn: "حمص بالشاورما"
      },
      description: {
        en: "Smooth, rich chickpea purée blended with premium sesame tahini, fresh lemon juice, garlic, topped with warm, juicy chicken shawarma carvings, toasted pine nuts, sumac, and olive oil.",
        fr: "Purée de pois chiches crémeuse au tahini, jus de citron frais et ail, surmontée de chawarma de poulet chaud, pignons de pin grillés, sumac et huile d'olive vierge extra.",
        tn: "حمص مرحي فريشك بالليمون والطحينة وزيت الزيتون، فوقو شاورما دجاج سخونة، فاكهة مقلية، سماق وزيت زيتونة بكر أصلي."
      },
      tags: {
        en: ["Popular"],
        fr: ["Populaire"],
        tn: ["محبوب الكل"]
      }
    },
    {
      id: "item-8",
      category: "mezze",
      price: 8.5,
      image: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=600&auto=format&fit=crop&q=80",
      fallbackImage: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Smoky Baba Ghanoush",
        fr: "Smoky Baba Ghanoush",
        tn: "بابا غنوج مدخن"
      },
      description: {
        en: "Charcoal-roasted eggplant mashed with sesame tahini, garlic, lemon juice, sumac, and extra virgin olive oil, crowned with fresh pomegranate seeds for a sweet burst.",
        fr: "Aubergines grillées au charbon de bois et écrasées avec du tahini, ail, citron, sumac et huile d'olive, garnies de graines de grenade fraîches.",
        tn: "بيتنجان مشوي عالجمر ومرحي مع الطحينة، ثوم، قارص، سماق وزيت زيتونة، مزين بحبات الرمان الفريشك للبنة الحلوة."
      },
      tags: {
        en: ["Vegan"],
        fr: ["Végan"],
        tn: ["نباتي"]
      }
    },
    {
      id: "item-9",
      category: "mezze",
      price: 7.5,
      image: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=600&auto=format&fit=crop&q=80",
      fallbackImage: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Vibrant Lebanese Tabbouleh",
        fr: "Taboulé Libanais Frais",
        tn: "تبولة شرقية"
      },
      description: {
        en: "Super finely hand-chopped flat-leaf parsley, fresh mint, red ripe tomatoes, green onions, and fine bulgur wheat, tossed in a zesty freshly squeezed lemon juice and cold olive oil dressing.",
        fr: "Persil plat finement haché à la main, menthe fraîche, tomates mûres, oignons verts et boulgour fin, assaisonnés de jus de citron pressé et d'huile d'olive.",
        tn: "معدنوس مقصوص جويد باليد، نعناع فريشك، طماطم حمراء، بصل أخضر وبرغل جويد، متبلين بالقارص المعصور وزيت الزيتونة الفريشك."
      },
      tags: {
        en: ["Vegan"],
        fr: ["Végan"],
        tn: ["نباتي"]
      }
    },
    {
      id: "item-10",
      category: "specialties",
      price: 14.5,
      image: "assets/loaded_fries.jpg",
      fallbackImage: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Spicy Loaded Babke Fries",
        fr: "Frites Loaded Épicées",
        tn: "بطاطا بَبكي المحرحرة"
      },
      description: {
        en: "A mountain of house-cut golden fries loaded with slow-roasted chicken shawarma strips, flooded with warm cheddar cheese sauce, garlic whip, and a fiery drizzle of Tunisian harissa-mayo.",
        fr: "Une montagne de frites dorées surmontée d'émincé de chawarma de poulet, nappée de sauce cheddar chaude, crème d'ail et d'un filet de harissa-mayo maison.",
        tn: "صحفة كبيرة معبية بالبطاطا المقلية المقرمشة وفوقها طروف شاورما دجاج سخونة، صوص جبن تشيدر دايبة، ثومية، ورشة مايونيز بالهريسة التونسية المحرحرة."
      },
      tags: {
        en: ["Cheat Meal Dream"],
        fr: ["Plaisir Coupable"],
        tn: ["شيخة الماكلة"]
      }
    },
    {
      id: "item-11",
      category: "specialties",
      price: 17.5,
      image: "assets/fattet_chawarma.jpg",
      fallbackImage: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Fattet Chawarma",
        fr: "Fattet Chawarma",
        tn: "فتة شاورما دجاج"
      },
      description: {
        en: "An incredible Levantine comfort dish. Layers of crispy toasted pita bread chips, spiced basmati rice, slow-cooked chicken shawarma, bathed in a warm garlic-tahini yogurt sauce, and sprinkled with fried pine nuts.",
        fr: "Un plat de confort ultime du Levant. Couches de pain pita croustillant, riz basmati épicé, chawarma de poulet, nappés d'une sauce yaourt au tahini et à l'ail, saupoudrés de pignons grillés.",
        tn: "أقوى ماكلة شامية تدفيك! طبقات من خبز البيتا المقرمش، روز بسمتي متبل، شاورما دجاج، صوص ياغورت بالطحينة والثوم السخونة، ومرشوش بالفاكهة المقلية."
      },
      tags: {
        en: ["Chef Special"],
        fr: ["Spécial Chef"],
        tn: ["شيف خاص"]
      }
    }
  ],
  content: {
    customizationPrices: {
      cheddarPrice: 2.0,
      mozzarellaPrice: 5.0,
      friesPrice: 2.0
    },
    hero: {
      award: {
        en: "MEILLEUR CHAWARMA 2025 BY TORCHI.TN",
        fr: "MEILLEUR CHAWARMA 2025 PAR TORCHI.TN",
        tn: "أحسن شاورما 2025 من تورشي.تن"
      },
      badge: {
        en: "Sousse's Favorite Kebab Spot",
        fr: "Le Kebab Préféré de Sousse",
        tn: "البلاصة المفضلة للكل في سوسة"
      },
      title: {
        en: "THE STREETS OF <span class=\"highlight\">SOUSSE</span> JUST GOT FLAVOR.",
        fr: "LES RUES DE <span class=\"highlight\">SOUSSE</span> ONT ENFIN DU GOÛT.",
        tn: "شوارع <span class=\"highlight\">سوسة</span> توا ولا فيها البنة."
      },
      desc: {
        en: "Charcoal-grilled Turkish Adana, toasted Lebanese-style chicken shawarma, and loaded crispy fries dripping with our signature garlic whip and spices. Hand-carved daily, served fresh.",
        fr: "Adana turc grillé au charbon de bois, chawarma de poulet libanais grillé, et frites croustillantes loaded nappées de notre crème d'ail signature et d'épices du Levant. Préparé frais tous les jours.",
        tn: "أدنّا تركي مشوي على الجمر، شاورما دجاج شرقية محمصة، وبطاطا مقلية مقرمشة غارقة بالتشيدر والثومية الخاصة. مقصوصة فريشك كل يوم."
      }
    },
    story: {
      heritage: {
        en: "OUR HERITAGE",
        fr: "NOTRE HÉRITAGE",
        tn: "أصولنا وبنتنا"
      },
      title: {
        en: "FROM THE LEVANT STRAIGHT TO HAMMAM SOUSSE",
        fr: "DU LEVANT DIRECTEMENT À HAMMAM SOUSSE",
        tn: "من بلاد الشام ديراكت لحمام سوسة"
      },
      p1: {
        en: "At <strong>Babke Kebab & Plates</strong>, we don’t believe in shortcuts. We set out with a clear, singular goal: to elevate the standard street kebab into a culinary experience.",
        fr: "Chez <strong>Babke Kebab & Plates</strong>, nous ne croyons pas aux raccourcis. Nous sommes partis d'un objectif clair et unique : élever le kebab de rue standard au rang d'expérience culinaire.",
        tn: "في <strong>بَبكي كباب وأطباق</strong>، مانؤمنوش بالطرق السهلة. هدفنا واضح وواحد من الأول: نطلعوا بكباب الشارع العادي لمرتبة التجربة الفريدة والبنينة."
      },
      p2: {
        en: "Every single day, our team hand-stacks layers of premium, marinated chicken onto our vertical spit, creating the iconic slow-roasted shawarma. We hand-knead and spice our minced beef for our signature charcoal Adana skewers. Our legendary Lebanese garlic whip (toum) is made in-house using traditional techniques—never pre-packaged.",
        fr: "Chaque jour, notre équipe empile à la main des couches de poulet mariné de première qualité sur notre broche verticale, créant ainsi notre chawarma rôti lentement. Nous pétrissons et épiçons notre bœuf haché à la main pour nos brochettes Adana au charbon. Notre légendaire crème d'ail libanaise (toum) est préparée sur place selon des techniques traditionnelles — jamais pré-emballée.",
        tn: "كل يوم، نحضروا دجاجنا المتبل ونرصوه باليد على الشواية العمودية باش نخرجوا أحسن شاورما. ونعجنوا ونبهّروا اللحم المفروم بيدينا باش نعملوا شواش أدنّا المشوية عالجمر. والثومية اللبنانية الشهيرة متاعنا نحضروها في المحل بالطريقة التقليدية — فريشك وبلاش مواد حافظة."
      },
      p3: {
        en: "Located in the heart of Hammam Sousse, we blend authentic spices from the Levant with Sousse’s modern, trendy dining vibe. We invite you to sit back, watch the charcoal flame rise, and enjoy street-food the way it was meant to be made.",
        fr: "Situés au cœur de Hammam Sousse, we marions les épices authentiques du Levant avec l'ambiance moderne et branchée de Sousse. Nous vous invitons à vous installer confortablement, à regarder les braises s'enflammer et à savourer la street-food telle qu'elle doit être faite.",
        tn: "في قلب حمام سوسة، نخلطوا بهارات الشام الأصلية مع الجو العصري والمزيان متع سوسة. ندعيوكم باش تقعدوا شيخين، وتتفرجوا على لهيب الجمر وتذوقوا الماكلة الشعبية بأصولها الحقيقية."
      }
    },
    contact: {
      address: {
        en: "Avenue des Orangers, Hammam Sousse, Tunisia",
        fr: "Avenue des Orangers, Hammam Sousse, Tunisie",
        tn: "شارع البرتقال، حمام سوسة، تونس"
      },
      phone: "+216 20 985 204",
      hours: {
        weekday: {
          en: "Mon - Thu: 11:30 AM - Midnight",
          fr: "Lun - Jeu: 11h30 - Minuit",
          tn: "الإثنين - الخميس: 11:30 صباحًا - منتصف الليل"
        },
        weekend: {
          en: "Fri - Sun: 11:30 AM - 1:00 AM",
          fr: "Ven - Dim: 11h30 - 01h00 du matin",
          tn: "الجمعة - الأحد: 11:30 صباحًا - 1:00 صباحًا"
        }
      }
    },
    socials: {
      instagram: "https://www.instagram.com/babke_kebab/",
      tiktok: "https://tiktok.com"
    },
    delivery: {
      yassir: "https://yassir.com",
      glovo: "https://glovoapp.com",
      zigzag: "https://www.facebook.com/ZigZag.Tunisie/",
      menutium: "https://menutium.com/"
    },
    footer: {
      desc: {
        en: "Elevating the street kebab experience with Levant spices and charcoal embers in Hammam Sousse.",
        fr: "Sublimer l'expérience du kebab de rue avec les épices du Levant et les braises de charbon à Hammam Sousse.",
        tn: "نطلعوا بكباب الشارع لمرتبة البنة الحقيقية ببهارات الشام وجمر الحطب في حمام سوسة."
      },
      rights: {
        en: "© 2026 Babke Kebab & Plates. Built with passion for street food.",
        fr: "© 2026 Babke Kebab & Plates. Conçu avec passion pour la street food.",
        tn: "© 2026 بَبكي كباب وأطباق. محضر بكل حب وشغف لبلادنا."
      }
    }
  },
  reviews: [
    {
      id: "rev-0",
      stars: 5,
      date: "Google Review",
      text: "Honestly the best chicken shawarma in Hammam Sousse! The garlic paste (toum) is absolutely perfect, just like the traditional Lebanese one. Portion is huge and the meat is not dry at all. 10/10.",
      author: "Anis Ben Amor",
      role: "Local Guide • Sousse",
      avatar: "A",
      featured: true,
      hidden: false
    },
    {
      id: "rev-1",
      stars: 5,
      date: "Google Review",
      text: "Terrific service and cozy, friendly atmosphere! If you haven't ordered the loaded Babke Fries or the Cheddarli Taouk, you are missing out on life. Generous portions and very fair prices.",
      author: "Mariem Guedouar",
      role: "Local Guide • Hammam Sousse",
      avatar: "M",
      featured: true,
      hidden: false
    },
    {
      id: "rev-2",
      stars: 5,
      date: "Google Review",
      text: "The Kebab Adana has an incredible charcoal smokiness. You can tell they use proper wood embers instead of standard electric grills. Hummus is velvety and has authentic olive oil on top.",
      author: "Karim Jellouli",
      role: "Food Enthusiast",
      avatar: "K",
      featured: true,
      hidden: false
    }
  ],
  gallery: [
    { id: "gal-0", image: "assets/insta_1.jpg", alt: "Babke Charcoal Kebabs skewers on fire", likes: "1.2k", link: "https://www.instagram.com/p/C-kebab1/" },
    { id: "gal-1", image: "assets/insta_2.jpg", alt: "Toasted Chicken Shawarma Wraps dripping garlic whip", likes: "954", link: "https://www.instagram.com/p/C-shawarma2/" },
    { id: "gal-2", image: "assets/insta_3.jpg", alt: "Beautiful Middle Eastern Mezze Platters with fresh hummus and pita", likes: "821", link: "https://www.instagram.com/p/C-mezze3/" },
    { id: "gal-3", image: "assets/insta_4.jpg", alt: "Mouthwatering street food visual", likes: "1.5k", link: "https://www.instagram.com/p/C-street4/" },
    { id: "gal-4", image: "assets/insta_5.jpg", alt: "Grilling skewers under flames", likes: "1.1k", link: "https://www.instagram.com/p/C-grill5/" },
    { id: "gal-5", image: "assets/insta_6.jpg", alt: "Delicious chicken platter close-up", likes: "998", link: "https://www.instagram.com/p/C-chicken6/" }
  ],
  events: [
    {
      id: "evt-0",
      image: "assets/event_village.jpg",
      fallbackImage: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "The Village Street Food Fest",
        fr: "Festival Street Food The Village",
        tn: "مهرجان الأكلات الشعبية بالقرية"
      },
      date: "2026-08-15",
      duration: {
        en: "3 Days (6 PM - Midnight)",
        fr: "3 Jours (18h - Minuit)",
        tn: "3 أيام (من 6 مساءً لمنتصف الليل)"
      },
      location: {
        en: "The Village, Hammam Sousse",
        fr: "Le Village, Hammam Sousse",
        tn: "القرية، حمام سوسة"
      },
      description: {
        en: "Come visit our live charcoal grilling stand! Serving Sousse's best shawarma wraps, loaded cheddar fries, and smoky Adana skewers all night long.",
        fr: "Venez visiter notre stand de grillades au charbon ! Nous servons les meilleurs wraps chawarma, frites cheddar et brochettes Adana fumées.",
        tn: "زورونا في الكشك متعنا بالبنة المعهودة! شاورما سخونة على السيخ، بطاطا بالجبن، وكباب أدنّا مشوي على جمر الغابة الأصلي ليل كامل."
      },
      status: "published"
    },
    {
      id: "evt-1",
      image: "assets/event_padel.jpg",
      fallbackImage: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Kantaoui Padel Championship",
        fr: "Championnat de Padel Kantaoui",
        tn: "بطولة البادل بالقنطاوي"
      },
      date: "2026-08-04",
      duration: {
        en: "2 Days (4 PM - 10 PM)",
        fr: "2 Jours (16h - 22h)",
        tn: "يومين (من 4 مساءً لـ 10 مساءً)"
      },
      location: {
        en: "Port El Kantaoui Padel Club",
        fr: "Padel Club Port El Kantaoui",
        tn: "نادي البادل، ميناء القنطاوي"
      },
      description: {
        en: "Grab a bite between matches! We are setting up a specialized wrap stand right next to the court to refuel players and fans.",
        fr: "Prenez une bouchée entre deux matchs ! Nous installons un stand de wraps juste à côté du court pour recharger les joueurs et spectateurs.",
        tn: "كول بنة تشحذك في اللعب! تلقانا بحذا الملعب ديراكت كشك خاص بالسندويشات باش تشيخ وتكمل تتفرج والا تلعب."
      },
      status: "published"
    }
  ],
  expenses: [
    {
      id: "exp-1721500000000",
      date: "2026-07-21",
      category: "worker_extra",
      description: "Ahmed extra hours 3h (Late night weekend shift)",
      amount: 45.0,
      paymentMethod: "cash",
      recordedBy: "cashier",
      createdAt: "2026-07-21T21:30:00.000Z"
    },
    {
      id: "exp-1721510000000",
      date: "2026-07-22",
      category: "fournisseur",
      description: "Viande d'agneau et poulet fresh meat delivery (Fournisseur Sousse)",
      amount: 180.0,
      paymentMethod: "cash",
      recordedBy: "cashier",
      createdAt: "2026-07-22T10:15:00.000Z"
    },
    {
      id: "exp-1721520000000",
      date: "2026-07-22",
      category: "ingredients",
      description: "Marché central vegetables, fresh parsley, garlic & lemon Toum prep",
      amount: 35.5,
      paymentMethod: "cash",
      recordedBy: "cashier",
      createdAt: "2026-07-22T08:45:00.000Z"
    },
    {
      id: "exp-1721530000000",
      date: "2026-07-23",
      category: "maintenance",
      description: "Grill charcoal recharge (3x bags oak charcoal) & Gaz refill",
      amount: 60.0,
      paymentMethod: "cash",
      recordedBy: "cashier",
      createdAt: "2026-07-23T09:10:00.000Z"
    }
  ],
  productTypes: [
    { id: "pt-1", name: "Falafel", category: "garniture", defaultUnit: "kg", minStockAlert: 10 },
    { id: "pt-2", name: "Samboussek Fromage", category: "garniture", defaultUnit: "pièces", minStockAlert: 20 },
    { id: "pt-3", name: "Samboussek Viande", category: "garniture", defaultUnit: "pièces", minStockAlert: 20 },
    { id: "pt-4", name: "Samboussek Épinard", category: "garniture", defaultUnit: "pièces", minStockAlert: 20 },
    { id: "pt-5", name: "Kibbeh / Keba", category: "garniture", defaultUnit: "pièces", minStockAlert: 15 },
    { id: "pt-6", name: "Msakhan", category: "viande", defaultUnit: "pièces", minStockAlert: 10 },
    { id: "pt-7", name: "Poulet Crispy", category: "viande", defaultUnit: "kg", minStockAlert: 10 },
    { id: "pt-8", name: "Riz", category: "garniture", defaultUnit: "kg", minStockAlert: 10 },
    { id: "pt-9", name: "Huile Végétale", category: "ingrédient", defaultUnit: "litres", minStockAlert: 10 },
    { id: "pt-10", name: "Kebab Halabi", category: "viande", defaultUnit: "brochettes", minStockAlert: 15 },
    { id: "pt-11", name: "Kebab Poulet", category: "viande", defaultUnit: "brochettes", minStockAlert: 15 },
    { id: "pt-12", name: "Kebab Royal", category: "viande", defaultUnit: "brochettes", minStockAlert: 15 },
    { id: "pt-13", name: "Kebab Azmarli", category: "viande", defaultUnit: "brochettes", minStockAlert: 15 },
    { id: "pt-14", name: "Kebab Adana", category: "viande", defaultUnit: "brochettes", minStockAlert: 15 },
    { id: "pt-15", name: "Cuisse Désossée", category: "viande", defaultUnit: "kg", minStockAlert: 10 },
    { id: "pt-16", name: "Cuisse Mandi", category: "viande", defaultUnit: "pièces", minStockAlert: 10 },
    { id: "pt-17", name: "Chich Taouk", category: "viande", defaultUnit: "brochettes", minStockAlert: 15 },
    { id: "pt-18", name: "Poulet Grillé", category: "viande", defaultUnit: "pièces", minStockAlert: 8 },
    { id: "pt-19", name: "Pistache", category: "garniture", defaultUnit: "kg", minStockAlert: 2 },
    { id: "pt-20", name: "Fruits Secs", category: "garniture", defaultUnit: "kg", minStockAlert: 2 },
    { id: "pt-21", name: "Sauce Houmous", category: "sauce", defaultUnit: "litres", minStockAlert: 5 },
    { id: "pt-22", name: "Sauce à l'Ail (Toum)", category: "sauce", defaultUnit: "litres", minStockAlert: 5 },
    { id: "pt-23", name: "Sauce Chef", category: "sauce", defaultUnit: "litres", minStockAlert: 5 },
    { id: "pt-24", name: "Sauce Spicy", category: "sauce", defaultUnit: "litres", minStockAlert: 5 },
    { id: "pt-25", name: "Harissa", category: "sauce", defaultUnit: "litres", minStockAlert: 5 },
    { id: "pt-26", name: "Baba Ghanouj", category: "sauce", defaultUnit: "litres", minStockAlert: 5 },
    { id: "pt-27", name: "Fromage Slice (Cheddar)", category: "garniture", defaultUnit: "paquets", minStockAlert: 5 },
    { id: "pt-28", name: "Mozzarella", category: "garniture", defaultUnit: "kg", minStockAlert: 5 },
    { id: "pt-29", name: "Soda / Boissons", category: "boisson", defaultUnit: "canettes", minStockAlert: 24 },
    { id: "pt-30", name: "Eau 0.5L", category: "boisson", defaultUnit: "bouteilles", minStockAlert: 24 },
    { id: "pt-31", name: "Frites", category: "garniture", defaultUnit: "kg", minStockAlert: 15 },
    { id: "pt-32", name: "Emballage Bol 750ml", category: "emballage", defaultUnit: "pièces", minStockAlert: 50 },
    { id: "pt-33", name: "Emballage Bol 1200ml", category: "emballage", defaultUnit: "pièces", minStockAlert: 50 },
    { id: "pt-34", name: "Sauce / Épice A1", category: "sauce", defaultUnit: "bouteilles", minStockAlert: 3 }
  ],
  ruinedProducts: [
    {
      id: "ruin-1",
      date: "2026-07-28",
      item: "Chawarma Poulet",
      quantity: 1.5,
      unit: "kg",
      reason: "Cramé",
      recordedBy: "worker",
      createdAt: "2026-07-28T21:40:00.000Z"
    },
    {
      id: "ruin-2",
      date: "2026-07-29",
      item: "Pain Libanais Plat",
      quantity: 2,
      unit: "paquets",
      reason: "Périmé",
      recordedBy: "worker",
      createdAt: "2026-07-29T08:30:00.000Z"
    }
  ],
  stockMovements: [
    {
      id: "stock-1",
      date: "2026-07-25",
      productName: "Chawarma Poulet",
      type: "IN",
      quantity: 50,
      unit: "kg",
      unitPrice: 12.0,
      totalPrice: 600.0,
      supplier: "Volailles Sousse",
      reason: "Achat hebdomadaire",
      recordedBy: "comptable",
      createdAt: "2026-07-25T09:00:00.000Z"
    },
    {
      id: "stock-2",
      date: "2026-07-26",
      productName: "Chawarma Poulet",
      type: "OUT",
      quantity: 15,
      unit: "kg",
      unitPrice: 0,
      totalPrice: 0,
      supplier: "",
      reason: "Recharge Cuisine / Broche",
      recordedBy: "comptable",
      createdAt: "2026-07-26T11:00:00.000Z"
    }
  ],
  auditLogs: [
    {
      id: "log-seed-1",
      timestamp: "29/07/2026 à 09:00:00",
      userRole: "ADMIN",
      username: "admin",
      actionType: "LOGIN",
      details: "Connexion réussie du Propriétaire"
    },
    {
      id: "log-seed-2",
      timestamp: "29/07/2026 à 09:30:15",
      userRole: "COMPTABLE",
      username: "comptable",
      actionType: "STOCK_MOVEMENT",
      details: "Achat Stock: Chawarma Poulet (50 kg) - Coût/Fournisseur: 600 TND / Volailles Sousse"
    }
  ],
  accountingSheets: {
    sahloul_jfs: [
      { id: "sjfs-1", article: "a1", quantity: 100, unitValue: 1.045, total: 104.5 },
      { id: "sjfs-2", article: "osk 50", quantity: 3, unitValue: 7.8, total: 23.4 },
      { id: "sjfs-3", article: "jumbo", quantity: 12, unitValue: 2.8, total: 33.6 },
      { id: "sjfs-4", article: "savon main", quantity: 5, unitValue: 3.6, total: 18.0 },
      { id: "sjfs-5", article: "goble", quantity: 10, unitValue: 5.0, total: 50.0 }
    ],
    frits: [
      { id: "frit-1", date: "2026-07-01", quantity: 65, unitValue: 7.0, total: 455.0 },
      { id: "frit-2", date: "2026-07-02", quantity: 50, unitValue: 7.0, total: 350.0 },
      { id: "frit-3", date: "2026-07-03", quantity: 60, unitValue: 7.0, total: 420.0 },
      { id: "frit-4", date: "2026-07-04", quantity: 70, unitValue: 7.0, total: 490.0 }
    ],
    nettoyage: [
      { id: "net-1", date: "2026-07-03", article: "dinol", quantity: 20, unitValue: 1.0, total: 20.0 },
      { id: "net-2", date: "2026-07-03", article: "javel", quantity: 20, unitValue: 0.5, total: 10.0 },
      { id: "net-3", date: "2026-07-22", article: "javel", quantity: 60, unitValue: 0.5, total: 30.0 },
      { id: "net-4", date: "2026-07-22", article: "dinol", quantity: 80, unitValue: 1.0, total: 80.0 },
      { id: "net-5", date: "2026-07-29", article: "javel", quantity: 40, unitValue: 0.5, total: 20.0 },
      { id: "net-6", date: "2026-07-29", article: "dinol", quantity: 90, unitValue: 1.0, total: 90.0 }
    ],
    poulet_viandes: [
      { id: "pv-1", date: "2026-07-01", cuisseQty: 35.9, cuisseVal: 11.2, cuisseTot: 402.08, blancQty: 27, blancVal: 14.8, blancTot: 399.6, escalopeQty: 35, escalopeVal: 15.2, escalopeTot: 532.0, cuisseCompQty: 0, cuisseCompVal: 0, cuisseCompTot: 0, oeufQty: 0, oeufVal: 0, oeufTot: 0 },
      { id: "pv-2", date: "2026-07-02", cuisseQty: 43.2, cuisseVal: 11.6, cuisseTot: 501.12, blancQty: 22, blancVal: 15.2, blancTot: 334.4, escalopeQty: 35, escalopeVal: 15.4, escalopeTot: 539.0, cuisseCompQty: 2, cuisseCompVal: 9.0, cuisseCompTot: 18.0, oeufQty: 5, oeufVal: 6.8, oeufTot: 34.0 },
      { id: "pv-3", date: "2026-07-03", cuisseQty: 40.5, cuisseVal: 11.8, cuisseTot: 477.90, blancQty: 22, blancVal: 15.2, blancTot: 334.4, escalopeQty: 35, escalopeVal: 15.5, escalopeTot: 542.5, cuisseCompQty: 1, cuisseCompVal: 9.0, cuisseCompTot: 9.0, oeufQty: 0, oeufVal: 0, oeufTot: 0 },
      { id: "pv-4", date: "2026-07-04", cuisseQty: 41.8, cuisseVal: 11.8, cuisseTot: 493.24, blancQty: 27, blancVal: 15.2, blancTot: 410.4, escalopeQty: 48, escalopeVal: 15.5, escalopeTot: 744.0, cuisseCompQty: 1.6, cuisseCompVal: 9.0, cuisseCompTot: 14.4, oeufQty: 0, oeufVal: 0, oeufTot: 0 },
      { id: "pv-5", date: "2026-07-05", cuisseQty: 43.2, cuisseVal: 11.8, cuisseTot: 509.76, blancQty: 22, blancVal: 15.2, blancTot: 334.4, escalopeQty: 40, escalopeVal: 15.6, escalopeTot: 624.0, cuisseCompQty: 1.7, cuisseCompVal: 9.4, cuisseCompTot: 15.98, oeufQty: 5, oeufVal: 6.8, oeufTot: 34.0 },
      { id: "pv-6", date: "2026-07-06", cuisseQty: 37.8, cuisseVal: 12.0, cuisseTot: 453.60, blancQty: 27, blancVal: 15.2, blancTot: 410.4, escalopeQty: 28, escalopeVal: 15.6, escalopeTot: 436.8, cuisseCompQty: 6, cuisseCompVal: 9.4, cuisseCompTot: 56.4, oeufQty: 0, oeufVal: 0, oeufTot: 0 },
      { id: "pv-7", date: "2026-07-07", cuisseQty: 33.7, cuisseVal: 12.0, cuisseTot: 404.40, blancQty: 22, blancVal: 15.4, blancTot: 338.8, escalopeQty: 30, escalopeVal: 15.6, escalopeTot: 468.0, cuisseCompQty: 0, cuisseCompVal: 0, cuisseCompTot: 0, oeufQty: 0, oeufVal: 0, oeufTot: 0 },
      { id: "pv-8", date: "2026-07-08", cuisseQty: 36.6, cuisseVal: 12.0, cuisseTot: 439.20, blancQty: 21, blancVal: 15.2, blancTot: 319.2, escalopeQty: 25, escalopeVal: 15.5, escalopeTot: 387.5, cuisseCompQty: 2.6, cuisseCompVal: 9.4, cuisseCompTot: 24.44, oeufQty: 0, oeufVal: 0, oeufTot: 0 },
      { id: "pv-9", date: "2026-07-09", cuisseQty: 37.8, cuisseVal: 12.0, cuisseTot: 453.60, blancQty: 21, blancVal: 15.2, blancTot: 319.2, escalopeQty: 32, escalopeVal: 15.5, escalopeTot: 496.0, cuisseCompQty: 0.9, cuisseCompVal: 9.4, cuisseCompTot: 8.46, oeufQty: 0, oeufVal: 0, oeufTot: 0 },
      { id: "pv-10", date: "2026-07-10", cuisseQty: 40.5, cuisseVal: 12.0, cuisseTot: 486.00, blancQty: 26, blancVal: 15.2, blancTot: 395.2, escalopeQty: 40, escalopeVal: 15.5, escalopeTot: 620.0, cuisseCompQty: 1, cuisseCompVal: 9.4, cuisseCompTot: 9.4, oeufQty: 0, oeufVal: 0, oeufTot: 0 },
      { id: "pv-11", date: "2026-07-11", cuisseQty: 40.4, cuisseVal: 12.0, cuisseTot: 484.80, blancQty: 27, blancVal: 15.2, blancTot: 410.4, escalopeQty: 35, escalopeVal: 15.5, escalopeTot: 542.5, cuisseCompQty: 1, cuisseCompVal: 9.4, cuisseCompTot: 9.4, oeufQty: 0, oeufVal: 0, oeufTot: 0 },
      { id: "pv-12", date: "2026-07-12", cuisseQty: 43.1, cuisseVal: 12.0, cuisseTot: 517.20, blancQty: 22, blancVal: 15.2, blancTot: 334.4, escalopeQty: 35, escalopeVal: 15.6, escalopeTot: 546.0, cuisseCompQty: 0, cuisseCompVal: 0, cuisseCompTot: 0, oeufQty: 5, oeufVal: 6.8, oeufTot: 34.0 },
      { id: "pv-13", date: "2026-07-13", cuisseQty: 38.2, cuisseVal: 12.0, cuisseTot: 458.40, blancQty: 27, blancVal: 15.2, blancTot: 410.4, escalopeQty: 40, escalopeVal: 15.6, escalopeTot: 624.0, cuisseCompQty: 0, cuisseCompVal: 0, cuisseCompTot: 0, oeufQty: 0, oeufVal: 0, oeufTot: 0 },
      { id: "pv-14", date: "2026-07-14", cuisseQty: 38.7, cuisseVal: 12.0, cuisseTot: 464.40, blancQty: 22, blancVal: 15.2, blancTot: 334.4, escalopeQty: 40, escalopeVal: 15.6, escalopeTot: 624.0, cuisseCompQty: 1.5, cuisseCompVal: 9.4, cuisseCompTot: 14.1, oeufQty: 0, oeufVal: 0, oeufTot: 0 },
      { id: "pv-15", date: "2026-07-15", cuisseQty: 42.3, cuisseVal: 12.0, cuisseTot: 507.60, blancQty: 27, blancVal: 15.3, blancTot: 413.1, escalopeQty: 37, escalopeVal: 15.7, escalopeTot: 580.9, cuisseCompQty: 2, cuisseCompVal: 9.5, cuisseCompTot: 19.0, oeufQty: 0, oeufVal: 0, oeufTot: 0 },
      { id: "pv-16", date: "2026-07-16", cuisseQty: 40.1, cuisseVal: 12.0, cuisseTot: 481.20, blancQty: 27, blancVal: 15.2, blancTot: 410.4, escalopeQty: 40, escalopeVal: 15.7, escalopeTot: 628.0, cuisseCompQty: 0, cuisseCompVal: 0, cuisseCompTot: 0, oeufQty: 0, oeufVal: 0, oeufTot: 0 },
      { id: "pv-17", date: "2026-07-17", cuisseQty: 45.2, cuisseVal: 12.0, cuisseTot: 542.40, blancQty: 22, blancVal: 15.2, blancTot: 334.4, escalopeQty: 35, escalopeVal: 15.7, escalopeTot: 549.5, cuisseCompQty: 1.3, cuisseCompVal: 9.4, cuisseCompTot: 12.22, oeufQty: 0, oeufVal: 0, oeufTot: 0 },
      { id: "pv-18", date: "2026-07-18", cuisseQty: 47.2, cuisseVal: 12.0, cuisseTot: 566.40, blancQty: 23, blancVal: 15.2, blancTot: 349.6, escalopeQty: 42, escalopeVal: 15.7, escalopeTot: 659.4, cuisseCompQty: 0, cuisseCompVal: 0, cuisseCompTot: 0, oeufQty: 0, oeufVal: 0, oeufTot: 0 },
      { id: "pv-19", date: "2026-07-19", cuisseQty: 49.6, cuisseVal: 12.0, cuisseTot: 595.20, blancQty: 22, blancVal: 15.2, blancTot: 334.4, escalopeQty: 50, escalopeVal: 15.7, escalopeTot: 785.0, cuisseCompQty: 2.6, cuisseCompVal: 9.5, cuisseCompTot: 24.7, oeufQty: 0, oeufVal: 0, oeufTot: 0 },
      { id: "pv-20", date: "2026-07-20", cuisseQty: 44.3, cuisseVal: 12.0, cuisseTot: 531.60, blancQty: 22, blancVal: 15.5, blancTot: 341.0, escalopeQty: 40, escalopeVal: 15.7, escalopeTot: 628.0, cuisseCompQty: 1.4, cuisseCompVal: 9.5, cuisseCompTot: 13.3, oeufQty: 0, oeufVal: 0, oeufTot: 0 },
      { id: "pv-21", date: "2026-07-21", cuisseQty: 50.5, cuisseVal: 12.2, cuisseTot: 616.10, blancQty: 22, blancVal: 15.5, blancTot: 341.0, escalopeQty: 35, escalopeVal: 15.9, escalopeTot: 556.5, cuisseCompQty: 0, cuisseCompVal: 0, cuisseCompTot: 0, oeufQty: 0, oeufVal: 0, oeufTot: 0 },
      { id: "pv-22", date: "2026-07-22", cuisseQty: 43.0, cuisseVal: 12.4, cuisseTot: 533.20, blancQty: 22, blancVal: 15.7, blancTot: 345.4, escalopeQty: 33, escalopeVal: 16.0, escalopeTot: 528.0, cuisseCompQty: 0, cuisseCompVal: 0, cuisseCompTot: 0, oeufQty: 0, oeufVal: 0, oeufTot: 0 },
      { id: "pv-23", date: "2026-07-23", cuisseQty: 48.4, cuisseVal: 12.4, cuisseTot: 600.16, blancQty: 22, blancVal: 16.5, blancTot: 363.0, escalopeQty: 33, escalopeVal: 16.8, escalopeTot: 554.4, cuisseCompQty: 0.6, cuisseCompVal: 10.0, cuisseCompTot: 6.0, oeufQty: 0, oeufVal: 0, oeufTot: 0 },
      { id: "pv-24", date: "2026-07-24", cuisseQty: 47.3, cuisseVal: 12.8, cuisseTot: 605.44, blancQty: 22, blancVal: 16.7, blancTot: 367.4, escalopeQty: 400, escalopeVal: 17.0, escalopeTot: 6800.0, cuisseCompQty: 1.4, cuisseCompVal: 10.0, cuisseCompTot: 14.0, oeufQty: 10, oeufVal: 6.5, oeufTot: 65.0 },
      { id: "pv-25", date: "2026-07-25", cuisseQty: 55.8, cuisseVal: 13.4, cuisseTot: 747.72, blancQty: 21, blancVal: 17.0, blancTot: 357.0, escalopeQty: 35, escalopeVal: 17.4, escalopeTot: 609.0, cuisseCompQty: 0.5, cuisseCompVal: 11.0, cuisseCompTot: 5.5, oeufQty: 0, oeufVal: 0, oeufTot: 0 },
      { id: "pv-26", date: "2026-07-26", cuisseQty: 51.0, cuisseVal: 13.8, cuisseTot: 703.80, blancQty: 31, blancVal: 17.5, blancTot: 542.5, escalopeQty: 43, escalopeVal: 17.8, escalopeTot: 765.4, cuisseCompQty: 7, cuisseCompVal: 10.5, cuisseCompTot: 73.5, oeufQty: 0, oeufVal: 0, oeufTot: 0 },
      { id: "pv-27", date: "2026-07-27", cuisseQty: 49.5, cuisseVal: 13.8, cuisseTot: 683.10, blancQty: 21, blancVal: 17.5, blancTot: 367.5, escalopeQty: 37, escalopeVal: 17.8, escalopeTot: 658.6, cuisseCompQty: 0.5, cuisseCompVal: 10.5, cuisseCompTot: 5.25, oeufQty: 0, oeufVal: 0, oeufTot: 0 },
      { id: "pv-28", date: "2026-07-28", cuisseQty: 56.2, cuisseVal: 13.8, cuisseTot: 775.56, blancQty: 22, blancVal: 17.5, blancTot: 385.0, escalopeQty: 50, escalopeVal: 17.8, escalopeTot: 890.0, cuisseCompQty: 1.3, cuisseCompVal: 10.8, cuisseCompTot: 14.04, oeufQty: 0, oeufVal: 0, oeufTot: 0 },
      { id: "pv-29", date: "2026-07-29", cuisseQty: 47.0, cuisseVal: 13.8, cuisseTot: 648.60, blancQty: 22, blancVal: 17.5, blancTot: 385.0, escalopeQty: 41, escalopeVal: 17.8, escalopeTot: 729.8, cuisseCompQty: 1.2, cuisseCompVal: 10.5, cuisseCompTot: 12.6, oeufQty: 0, oeufVal: 0, oeufTot: 0 },
      { id: "pv-30", date: "2026-07-30", cuisseQty: 51.2, cuisseVal: 13.87, cuisseTot: 710.14, blancQty: 22, blancVal: 17.6, blancTot: 387.2, escalopeQty: 35, escalopeVal: 17.8, escalopeTot: 623.0, cuisseCompQty: 0.8, cuisseCompVal: 10.5, cuisseCompTot: 8.4, oeufQty: 0, oeufVal: 0, oeufTot: 0 },
      { id: "pv-31", date: "2026-07-31", cuisseQty: 58.5, cuisseVal: 14.0, cuisseTot: 819.00, blancQty: 28, blancVal: 17.6, blancTot: 492.8, escalopeQty: 43, escalopeVal: 17.8, escalopeTot: 765.4, cuisseCompQty: 1.3, cuisseCompVal: 10.8, cuisseCompTot: 14.04, oeufQty: 0, oeufVal: 0, oeufTot: 0 }
    ]
  },
  // Loyalty card ("Carte Babke") defaults. This file is PUBLIC (served to the
  // landing page and the admin), so it holds no secrets and nothing about the
  // prize draw: that lives only in server.js.
  loyaltyProgram: {
    active: true,
    cardTitle: { fr: "Carte Babke", en: "Babke Card", tn: "كارت بابكي" },
    stampRule: { fr: "1 sceau par commande dès 10 DT", en: "1 seal per order from 10 DT", tn: "طابع على كل كوموند من 10 دينار" },
    stampGoal: 10, welcomeBonus: 1, maxStampsPerDay: 3,
    tiers: [
      { id: "tier-5",  stamps: 5,  active: true, reward: { fr: "Taboulé Libanais offert (7,5 DT)", en: "Free Lebanese Tabbouleh (7.5 DT)", tn: "تبولة لبنانية بلاش (7.5 د)" } },
      { id: "tier-10", stamps: 10, active: true, reward: { fr: "Chawarma Poulet Classique offert (12,5 DT)", en: "Free Classic Chicken Shawarma (12.5 DT)", tn: "شاورما دجاج كلاسيك بلاش (12.5 د)" } }
    ]
  },
  // 3D menu book ("Le Carnet") defaults.
  menuBook: {
    enabled: true, itemsPerPage: 3, showSoldOut: true,
    cover: {
      kicker:   { fr: "Depuis le Levant", en: "From the Levant", tn: "من بلاد الشام" },
      title:    { fr: "La Carte", en: "The Menu", tn: "المنيو" },
      subtitle: { fr: "Grillades au charbon · Hammam Sousse", en: "Charcoal grill · Hammam Sousse", tn: "مشاوي عالفحم · حمام سوسة" }
    },
    categories: [
      { id: "wraps", visible: true, title: { fr: "Wraps & Sandwichs", en: "Wraps & Sandwiches", tn: "سندويشات" }, kicker: { fr: "Roulés minute, dorés au charbon", en: "Rolled to order, charcoal-toasted", tn: "ملفوفة في الحين و محمّرة عالفحم" } },
      { id: "plates", visible: true, title: { fr: "Plats Grillades", en: "Feast Platters", tn: "أطباق مشوية" }, kicker: { fr: "Pour les grandes faims", en: "For the big appetites", tn: "للجوع الكبير" } },
      { id: "mezze", visible: true, title: { fr: "Mezzés & Entrées", en: "Mezze & Dips", tn: "مقبلات و غطوس" }, kicker: { fr: "À partager au centre de la table", en: "To share across the table", tn: "للقسمة في وسط الطاولة" } },
      { id: "specialties", visible: true, title: { fr: "Spécialités", en: "Specialties", tn: "العروض الخاصة" }, kicker: { fr: "Les recettes de la maison", en: "House recipes", tn: "وصفات الدار" } }
    ],
    housePage: {
      title: { fr: "La Maison", en: "The House", tn: "الدار" },
      body:  { fr: "Nos broches tournent dès l'ouverture, notre toum est montée chaque matin et chaque pain passe sur la braise à la minute. Bienvenue chez Babke, le Levant au cœur de Hammam Sousse.",
               en: "Our spits turn from opening time, our toum is whipped every morning and every bread meets the embers to order. Welcome to Babke, the Levant in the heart of Hammam Sousse.",
               tn: "السيخ يدور من أول ما نحلّو، الثومية تتعمل كل صباح و الخبزة تتحمّر عالجمر في الحين. مرحبا بيك في بابكي، الشام في قلب حمام سوسة." }
    },
    backPage: { note: { fr: "Touchez un plat pour l'ajouter à votre commande.", en: "Tap a dish to add it to your order.", tn: "انزل على ماكلة باش تزيدها للكوموند." } }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DEFAULT_DATA;
}

