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
        tn: "شاورما دجاج محضرة عالسيخ المشوي، ثومية لبنانية بنينة محضرينها في المحل، خيار مخلل، وبطاطا مقلية ملفوفة في خبز رقيق ومحمرة للبنة الكاملة."
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
        tn: "تبولة لبنانية"
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
        tn: "أدنّا تركي مشوي على الجمر، شاورما دجاج لبنانية محمصة، وبطاطا مقلية مقرمشة غارقة بالتشيدر والثومية الخاصة. مقصوصة فريشك كل يوم."
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
      phone: "+216 73 821 999",
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
      date: "2026-07-28",
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
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DEFAULT_DATA;
}

