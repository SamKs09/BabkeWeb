/* ==========================================================================
   BABKE KEBAB & PLATES — INITIAL SEED DATA
   ========================================================================== */

const DEFAULT_DATA = {
  menu: [
    {
      id: "plat-chawarma",
      category: "plats",
      price: 26,
      image: "assets/plat_chawarma.jpg",
      fallbackImage: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Chawarma Platter",
        fr: "Plat Chawarma",
        tn: "طبق شاورما"
      },
      description: {
        en: "3 Babke sauces, homemade bread, rice, 3 salads, fries, 200g chawarma",
        fr: "3 sauces Babke, pain maison, riz, 3 salades, frites, 200g chawarma",
        tn: "3 صلصات بَبكي، خبز الدار، روز، 3 سلطات، بطاطا مقلية، 200غ شاورما"
      },
      tags: {
        en: ["200g chawarma", "rice", "fries"],
        fr: ["200g chawarma", "riz", "frites"],
        tn: ["200غ شاورما", "روز", "بطاطا"]
      }
    },
    {
      id: "plat-chich-taouk",
      category: "plats",
      price: 26,
      image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&auto=format&fit=crop&q=80",
      fallbackImage: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Chich Taouk Platter",
        fr: "Plat Chich Taouk",
        tn: "طبق شيش طاووق"
      },
      description: {
        en: "3 Babke sauces, homemade bread, rice, 3 salads, fries, 2 chich taouk skewers",
        fr: "3 sauces Babke, pain maison, riz, 3 salades, frites, 2 brochettes chich taouk",
        tn: "3 صلصات بَبكي، خبز الدار، روز، 3 سلطات، بطاطا مقلية، سيخين شيش طاووق"
      },
      tags: {
        en: ["2 skewers", "rice", "fries"],
        fr: ["2 brochettes", "riz", "frites"],
        tn: ["سيخين", "روز", "بطاطا"]
      }
    },
    {
      id: "plat-chich-kebab",
      category: "plats",
      price: 27,
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
      fallbackImage: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Chich Kebab Platter",
        fr: "Plat Chich Kebab",
        tn: "طبق شيش كباب"
      },
      description: {
        en: "3 Babke sauces, homemade bread, rice, 3 salads, fries, 1 chich taouk skewer, 1 chich kebab skewer",
        fr: "3 sauces Babke, pain maison, riz, 3 salades, frites, 1 brochette chich taouk, 1 brochette chich kebab",
        tn: "3 صلصات بَبكي، خبز الدار، روز، 3 سلطات، بطاطا مقلية، سيخ شيش طاووق، سيخ شيش كباب"
      },
      tags: {
        en: ["chich taouk", "chich kebab", "rice"],
        fr: ["chich taouk", "chich kebab", "riz"],
        tn: ["شيش طاووق", "شيش كباب", "روز"]
      }
    },
    {
      id: "plat-falafel",
      category: "plats",
      price: 15,
      image: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=600&auto=format&fit=crop&q=80",
      fallbackImage: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Falafel Platter",
        fr: "Plat Falafel",
        tn: "طبق فلافل"
      },
      description: {
        en: "Sliced falafel sandwich, 3 falafel pieces, falafel sauce, fries, 3 salads",
        fr: "Sandwich falafel découpé, 3 pièces falafel, sauce falafel, frites, 3 salades",
        tn: "سندويتش فلافل مقطّع، 3 قطع فلافل، صلصة الفلافل، بطاطا مقلية، 3 سلطات"
      },
      tags: {
        en: ["3 falafel pieces", "falafel sauce", "fries"],
        fr: ["3 pièces falafel", "sauce falafel", "frites"],
        tn: ["3 قطع فلافل", "صلصة فلافل", "بطاطا"]
      }
    },
    {
      id: "plat-chawarma-special",
      category: "plats",
      price: 22,
      image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&auto=format&fit=crop&q=80",
      fallbackImage: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Special Chawarma Platter",
        fr: "Plat Chawarma Spécial",
        tn: "طبق شاورما سبيسيال"
      },
      description: {
        en: "Sliced chawarma sandwich, 50g chawarma, garlic sauce, fries, 3 salads",
        fr: "Sandwich chawarma découpé, 50g chawarma, sauce à l'ail, frites, 3 salades",
        tn: "سندويتش شاورما مقطّع، 50غ شاورما، صلصة ثوم، بطاطا مقلية، 3 سلطات"
      },
      tags: {
        en: ["sliced sandwich", "50g chawarma", "garlic sauce"],
        fr: ["sandwich découpé", "50g chawarma", "sauce à l'ail"],
        tn: ["سندويتش مقطّع", "50غ شاورما", "صلصة ثوم"]
      }
    },
    {
      id: "plat-poulet-grille",
      category: "plats",
      price: 26,
      image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&auto=format&fit=crop&q=80",
      fallbackImage: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Grilled Chicken Platter",
        fr: "Plat Poulet Grillé",
        tn: "طبق دجاج مشوي"
      },
      description: {
        en: "3 Babke sauces, homemade bread, rice, 3 salads, fries, 200g grilled chicken",
        fr: "3 sauces Babke, pain maison, riz, 3 salades, frites, 200g poulet grillé",
        tn: "3 صلصات بَبكي، خبز الدار، روز، 3 سلطات، بطاطا مقلية، 200غ دجاج مشوي"
      },
      tags: {
        en: ["200g grilled chicken", "rice", "fries"],
        fr: ["200g poulet grillé", "riz", "frites"],
        tn: ["200غ دجاج مشوي", "روز", "بطاطا"]
      }
    },
    {
      id: "plat-poulet-crispy",
      category: "plats",
      price: 26,
      image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&auto=format&fit=crop&q=80",
      fallbackImage: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Crispy Chicken Platter",
        fr: "Plat Poulet Crispy",
        tn: "طبق دجاج كريسبي"
      },
      description: {
        en: "3 Babke sauces, homemade bread, rice, 3 salads, fries, 200g crispy chicken",
        fr: "3 sauces Babke, pain maison, riz, 3 salades, frites, 200g poulet crispy",
        tn: "3 صلصات بَبكي، خبز الدار، روز، 3 سلطات، بطاطا مقلية، 200غ دجاج كريسبي"
      },
      tags: {
        en: ["200g crispy chicken", "rice", "fries"],
        fr: ["200g poulet crispy", "riz", "frites"],
        tn: ["200غ دجاج كريسبي", "روز", "بطاطا"]
      }
    },
    {
      id: "plat-babke",
      category: "plats",
      price: 40,
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
      fallbackImage: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Babke Platter",
        fr: "Plat Babke",
        tn: "طبق بَبكي"
      },
      description: {
        en: "3 Babke sauces, homemade bread, rice, 3 salads, fries, 1 slice of grilled chicken, chawarma, 1 meat kebab, 1 chich taouk, 1 crispy, 2 falafel pieces",
        fr: "3 sauces Babke, pain maison, riz, 3 salades, frites, 1 tranche poulet grillé, chawarma, 1 kebab viande, 1 chich taouk, 1 crispy, 2 pièces falafel",
        tn: "3 صلصات بَبكي، خبز الدار، روز، 3 سلطات، بطاطا مقلية، شريحة دجاج مشوي، شاورما، كباب لحم، شيش طاووق، كريسبي، 2 قطع فلافل"
      },
      tags: {
        en: ["chawarma", "kebab", "chich taouk"],
        fr: ["chawarma", "kebab", "chich taouk"],
        tn: ["شاورما", "كباب", "شيش طاووق"]
      }
    },
    {
      id: "plat-6-brochettes",
      category: "plats",
      price: 40,
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
      fallbackImage: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "6 Skewers Platter",
        fr: "Plat 6 Brochettes",
        tn: "طبق 6 شواش"
      },
      description: {
        en: "3 Babke sauces, homemade bread, rice, 3 salads, fries, 2 chich taouk skewers, 2 meat kebab skewers, 2 chicken kebab skewers",
        fr: "3 sauces Babke, pain maison, riz, 3 salades, frites, 2 brochettes chich taouk, 2 brochettes kebab viande, 2 brochettes kebab poulet",
        tn: "3 صلصات بَبكي، خبز الدار، روز، 3 سلطات، بطاطا مقلية، سيخين شيش طاووق، سيخين كباب لحم، سيخين كباب دجاج"
      },
      tags: {
        en: ["6 skewers", "rice", "fries"],
        fr: ["6 brochettes", "riz", "frites"],
        tn: ["6 أسياخ", "روز", "بطاطا"]
      }
    },
    {
      id: "plat-brochettes-tikka",
      category: "plats",
      price: 38,
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
      fallbackImage: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Tikka Skewers Platter",
        fr: "Plat Brochettes Tikka",
        tn: "طبق شواش تيكا"
      },
      description: {
        en: "2 skewers, 3 salads, 3 sauces, homemade bread, rice, fries",
        fr: "2 brochettes, 3 salades, 3 sauces, pain maison, riz, frites",
        tn: "سيخين، 3 سلطات، 3 صلصات، خبز الدار، روز، بطاطا مقلية"
      },
      tags: {
        en: ["2 skewers", "rice", "fries"],
        fr: ["2 brochettes", "riz", "frites"],
        tn: ["سيخين", "روز", "بطاطا"]
      }
    },
    {
      id: "plat-chawarma-kebab",
      category: "plats",
      price: 28,
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
      fallbackImage: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Chawarma & Kebab Platter",
        fr: "Plat Chawarma Kebab",
        tn: "طبق شاورما كباب"
      },
      description: {
        en: "3 Babke sauces, homemade bread, rice, 3 salads, fries, 1 meat kebab skewer, 100g chawarma",
        fr: "3 sauces Babke, pain maison, riz, 3 salades, frites, 1 brochette kebab viande, 100g chawarma",
        tn: "3 صلصات بَبكي، خبز الدار، روز، 3 سلطات، بطاطا مقلية، سيخ كباب لحم، 100غ شاورما"
      },
      tags: {
        en: ["meat kebab", "100g chawarma", "rice"],
        fr: ["kebab viande", "100g chawarma", "riz"],
        tn: ["كباب لحم", "100غ شاورما", "روز"]
      }
    },
    {
      id: "plat-chich-chawarma",
      category: "plats",
      price: 26,
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80",
      fallbackImage: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Chich & Chawarma Platter",
        fr: "Plat Chich Chawarma",
        tn: "طبق شيش شاورما"
      },
      description: {
        en: "3 Babke sauces, homemade bread, rice, 3 salads, fries, 1 chich taouk skewer, 100g chawarma",
        fr: "3 sauces Babke, pain maison, riz, 3 salades, frites, 1 brochette chich taouk, 100g chawarma",
        tn: "3 صلصات بَبكي، خبز الدار، روز، 3 سلطات، بطاطا مقلية، سيخ شيش طاووق، 100غ شاورما"
      },
      tags: {
        en: ["chich taouk", "100g chawarma", "rice"],
        fr: ["chich taouk", "100g chawarma", "riz"],
        tn: ["شيش طاووق", "100غ شاورما", "روز"]
      }
    },
    {
      id: "plat-kebab-poulet",
      category: "plats",
      price: 25,
      image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&auto=format&fit=crop&q=80",
      fallbackImage: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Chicken Kebab Platter",
        fr: "Plat Kebab Poulet",
        tn: "طبق كباب دجاج"
      },
      description: {
        en: "3 Babke sauces, homemade bread, rice, 3 salads, fries, 3 chicken kebab skewers",
        fr: "3 sauces Babke, pain maison, riz, 3 salades, frites, 3 brochettes kebab poulet",
        tn: "3 صلصات بَبكي، خبز الدار، روز، 3 سلطات، بطاطا مقلية، 3 أسياخ كباب دجاج"
      },
      tags: {
        en: ["3 skewers", "chicken kebab", "fries"],
        fr: ["3 brochettes", "kebab poulet", "frites"],
        tn: ["3 أسياخ", "كباب دجاج", "بطاطا"]
      }
    },
    {
      id: "plat-kebab-mixte",
      category: "plats",
      price: 28,
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
      fallbackImage: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Mixed Kebab Platter",
        fr: "Plat Kebab Mixte",
        tn: "طبق كباب مكس"
      },
      description: {
        en: "3 Babke sauces, homemade bread, rice, fries, 3 salads, 2 chicken kebab skewers, 1 kebab halabi skewer",
        fr: "3 sauces Babke, pain maison, riz, frites, 3 salades, 2 brochettes kebab poulet, 1 brochette kebab halabi",
        tn: "3 صلصات بَبكي، خبز الدار، روز، بطاطا مقلية، 3 سلطات، سيخين كباب دجاج، سيخ كباب حلبي"
      },
      tags: {
        en: ["chicken kebab", "kebab halabi", "rice"],
        fr: ["kebab poulet", "kebab halabi", "riz"],
        tn: ["كباب دجاج", "كباب حلبي", "روز"]
      }
    },
    {
      id: "plat-kebab-halabi",
      category: "plats",
      price: 30,
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
      fallbackImage: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Kebab Halabi Platter",
        fr: "Plat Kebab Halabi",
        tn: "طبق كباب حلبي"
      },
      description: {
        en: "3 skewers, 3 salads, 3 sauces, homemade bread, rice, fries",
        fr: "3 brochettes, 3 salades, 3 sauces, pain maison, riz, frites",
        tn: "3 أسياخ، 3 سلطات، 3 صلصات، خبز الدار، روز، بطاطا مقلية"
      },
      tags: {
        en: ["3 skewers", "rice", "fries"],
        fr: ["3 brochettes", "riz", "frites"],
        tn: ["3 أسياخ", "روز", "بطاطا"]
      }
    },
    {
      id: "plat-kebab-adana",
      category: "plats",
      price: 32,
      image: "assets/plat_adana.jpg",
      fallbackImage: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Kebab Adana Platter",
        fr: "Plat Kebab Adana",
        tn: "طبق كباب أدنّا"
      },
      description: {
        en: "(Turkish) 3 skewers, 3 salads, 3 sauces, homemade bread, rice, fries",
        fr: "(turc) 3 brochettes, 3 salades, 3 sauces, pain maison, riz, frites",
        tn: "(تركي) 3 أسياخ، 3 سلطات، 3 صلصات، خبز الدار، روز، بطاطا مقلية"
      },
      tags: {
        en: ["turkish", "3 skewers", "rice"],
        fr: ["turc", "3 brochettes", "riz"],
        tn: ["تركي", "3 أسياخ", "روز"]
      }
    },
    {
      id: "plat-kebab-azmarli",
      category: "plats",
      price: 34,
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
      fallbackImage: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Kebab Azmarli Platter",
        fr: "Plat Kebab Azmarli",
        tn: "طبق كباب أزمرلي"
      },
      description: {
        en: "(kebab, cheese) 3 skewers, 3 salads, 3 sauces, homemade bread, rice, fries",
        fr: "(kebab, fromage) 3 brochettes, 3 salades, 3 sauces, pain maison, riz, frites",
        tn: "(كباب، جبن) 3 أسياخ، 3 سلطات، 3 صلصات، خبز الدار، روز، بطاطا مقلية"
      },
      tags: {
        en: ["kebab", "cheese", "3 skewers"],
        fr: ["kebab", "fromage", "3 brochettes"],
        tn: ["كباب", "جبن", "3 أسياخ"]
      }
    },
    {
      id: "plat-kebab-royal",
      category: "plats",
      price: 36,
      image: "assets/plat_royal.jpg",
      fallbackImage: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Kebab Royal Platter",
        fr: "Plat Kebab Royal",
        tn: "طبق كباب رويال"
      },
      description: {
        en: "(kebab, cheese, nuts) 3 skewers, 3 salads, 3 sauces, homemade bread, rice, fries",
        fr: "(kebab, fromage, fruits secs) 3 brochettes, 3 salades, 3 sauces, pain maison, riz, frites",
        tn: "(كباب، جبن، فواكه جافة) 3 أسياخ، 3 سلطات، 3 صلصات، خبز الدار، روز، بطاطا مقلية"
      },
      tags: {
        en: ["kebab", "cheese", "nuts"],
        fr: ["kebab", "fromage", "fruits secs"],
        tn: ["كباب", "جبن", "فواكه جافة"]
      }
    },
    {
      id: "mfattet-chawarma",
      category: "plats",
      price: 18,
      image: "assets/fattet_chawarma.jpg",
      fallbackImage: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Mfattet Chawarma",
        fr: "Mfattet Chawarma",
        tn: "مفتّت شاورما"
      },
      description: {
        en: "Garlic sauce, fried bread, rice, 150g chawarma",
        fr: "Sauce à l'ail, pain frit, riz, 150g chawarma",
        tn: "صلصة ثوم، خبز مقلي، روز، 150غ شاورما"
      },
      tags: {
        en: ["fried bread", "rice", "150g chawarma"],
        fr: ["pain frit", "riz", "150g chawarma"],
        tn: ["خبز مقلي", "روز", "150غ شاورما"]
      }
    },
    {
      id: "mfattet-chich-taouk",
      category: "plats",
      price: 18,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80",
      fallbackImage: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Mfattet Chich Taouk",
        fr: "Mfattet Chich Taouk",
        tn: "مفتّت شيش طاووق"
      },
      description: {
        en: "Spicy toum sauce, fried bread, rice, 150g chich taouk",
        fr: "Sauce spicy thoum, pain frit, riz, 150g chich taouk",
        tn: "صلصة ثومية حارة، خبز مقلي، روز، 150غ شيش طاووق"
      },
      tags: {
        en: ["fried bread", "rice", "150g chich taouk"],
        fr: ["pain frit", "riz", "150g chich taouk"],
        tn: ["خبز مقلي", "روز", "150غ شيش طاووق"]
      }
    },
    {
      id: "menu-enfant",
      category: "enfant",
      price: 15,
      image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&auto=format&fit=crop&q=80",
      fallbackImage: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&auto=format&fit=crop&q=80",
      title: {
        en: "Kids Menu",
        fr: "Menu Enfant",
        tn: "منيو الأطفال"
      },
      description: {
        en: "3 crispy chicken pieces, coleslaw, fries, drink",
        fr: "3 pièces poulet crispy, coleslaw, frites, boisson",
        tn: "3 قطع دجاج كريسبي، كولسلو، بطاطا مقلية، مشروب"
      },
      tags: {
        en: ["crispy chicken", "fries", "drink"],
        fr: ["poulet crispy", "frites", "boisson"],
        tn: ["دجاج كريسبي", "بطاطا", "مشروب"]
      }
    }
  ],
  content: {
    // Paid add-ons ("Suppléments") from the printed menu. Priced per unit,
    // added on top of a dish in the cart — they are NOT menu items.
    supplements: [
      { id: "sup-chawarma-100g", label: { en: "Chawarma (100g)", fr: "Chawarma (100g)", tn: "شاورما (100غ)" }, price: 6 },
      { id: "sup-pain", label: { en: "Bread", fr: "Pain", tn: "خبز" }, price: 1 },
      { id: "sup-mozzarella", label: { en: "Mozzarella", fr: "Mozzarella", tn: "موزاريلا" }, price: 5 },
      { id: "sup-chich-taouk", label: { en: "Chich taouk", fr: "Chich taouk", tn: "شيش طاووق" }, price: 7 },
      { id: "sup-poulet-grille-100g", label: { en: "Grilled chicken (100g)", fr: "Poulet grillé (100g)", tn: "دجاج مشوي (100غ)" }, price: 7 },
      { id: "sup-kebab-halabi", label: { en: "Kebab halabi", fr: "Kebab halabi", tn: "كباب حلبي" }, price: 8 },
      { id: "sup-portion-frites", label: { en: "Portion of fries", fr: "Portion de frites", tn: "بطاطا مقلية" }, price: 6 },
      { id: "sup-falafel-1-piece", label: { en: "Falafel (1 piece)", fr: "Falafel (1 pièce)", tn: "فلافل (قطعة)" }, price: 2 },
      { id: "sup-kebab-adana", label: { en: "Kebab adana", fr: "Kebab adana", tn: "كباب أدنّا" }, price: 8.5 },
      { id: "sup-kebab-azmarli", label: { en: "Kebab azmarli", fr: "Kebab azmarli", tn: "كباب أزمرلي" }, price: 10 },
      { id: "sup-kebab-royal", label: { en: "Kebab royal", fr: "Kebab royal", tn: "كباب رويال" }, price: 10 },
      { id: "sup-assiette-riz", label: { en: "Plate of rice", fr: "Assiette de riz", tn: "صحن روز" }, price: 8 }
    ],
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
        // Only dishes from the printed menu. Kept identical to hero_desc in
        // scripts/translations.js (the static fallback).
        en: "Charcoal-grilled Adana and halabi kebabs, chich taouk skewers and chawarma sliced to order. Every platter comes with rice, fries, three salads, three Babke sauces and our homemade bread.",
        fr: "Kebabs adana et halabi grillés au charbon de bois, brochettes de chich taouk et chawarma découpé à la commande. Chaque plat est servi avec riz, frites, 3 salades, 3 sauces Babke et notre pain maison.",
        tn: "كباب أدنّا وحلبي مشوي عالجمر، أسياخ شيش طاووق وشاورما مقصوصة في الحين. كل طبق يجي معاه روز، بطاطا مقلية، 3 سلطات، 3 صلصات بَبكي وخبز الدار."
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
        fr: "Situés au cœur de Hammam Sousse, nous marions les épices authentiques du Levant avec l'ambiance moderne et branchée de Sousse. Nous vous invitons à vous installer confortablement, à regarder les braises s'enflammer et à savourer la street-food telle qu'elle doit être faite.",
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
      text: "Terrific service and cozy, friendly atmosphere! If you haven't ordered the Kebab Halabi platter or the Mfattet Chich Taouk, you are missing out on life. Generous portions and very fair prices.",
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
      text: "The Kebab Adana has an incredible charcoal smokiness. You can tell they use proper wood embers instead of standard electric grills. With the rice, fries and three salads on the side it is a proper full meal.",
      author: "Karim Jellouli",
      role: "Food Enthusiast",
      avatar: "K",
      featured: true,
      hidden: false
    }
  ],
  gallery: [
    // Alt text describes what each photo actually shows, using menu dish names.
    { id: "gal-0", image: "assets/insta_1.jpg", alt: "Assorted charcoal-grilled kebab and chich taouk skewers on a platter", likes: "1.2k", link: "https://www.instagram.com/p/C-kebab1/" },
    { id: "gal-1", image: "assets/insta_2.jpg", alt: "Kebab skewers platter with rice, fries and salad", likes: "954", link: "https://www.instagram.com/p/C-shawarma2/" },
    { id: "gal-2", image: "assets/insta_3.jpg", alt: "Grilled kebab skewers served with rice, fries and salad", likes: "821", link: "https://www.instagram.com/p/C-mezze3/" },
    { id: "gal-3", image: "assets/insta_4.jpg", alt: "Sliced sandwich pieces and fries shared at the table", likes: "1.5k", link: "https://www.instagram.com/p/C-street4/" },
    { id: "gal-4", image: "assets/insta_5.jpg", alt: "Kids menu tray with crispy chicken, fries, coleslaw and a drink", likes: "1.1k", link: "https://www.instagram.com/p/C-grill5/" },
    { id: "gal-5", image: "assets/insta_6.jpg", alt: "A young guest enjoying crispy chicken and fries", likes: "998", link: "https://www.instagram.com/p/C-chicken6/" }
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
        en: "Come visit our live charcoal grilling stand! Serving chawarma platters, chich taouk skewers and smoky Adana kebabs all night long.",
        fr: "Venez visiter notre stand de grillades au charbon ! Nous servons plats chawarma, brochettes chich taouk et kebabs Adana fumés toute la soirée.",
        tn: "زورونا في الكشك متعنا بالبنة المعهودة! أطباق شاورما، أسياخ شيش طاووق، وكباب أدنّا مشوي عالجمر ليل كامل."
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
        en: "Grab a bite between matches! We are setting up a charcoal grill stand right next to the court to refuel players and fans.",
        fr: "Prenez une bouchée entre deux matchs ! Nous installons un stand de grillades au charbon juste à côté du court pour recharger les joueurs et spectateurs.",
        tn: "كول بنة تشحذك في اللعب! تلقانا بحذا الملعب ديراكت كشك مشاوي عالجمر باش تشيخ وتكمل تتفرج والا تلعب."
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
      { id: "tier-5",  stamps: 5,  active: true, reward: { fr: "Portion de frites offerte (6 DT)", en: "Free portion of fries (6 DT)", tn: "حصة بطاطا بلاش (6 د)" } },
      { id: "tier-10", stamps: 10, active: true, reward: { fr: "Plat Falafel offert (15 DT)", en: "Free Falafel platter (15 DT)", tn: "طبق فلافل بلاش (15 د)" } }
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
    // Mirrors the two categories of the printed menu. The old wraps / plates /
    // mezze / specialties pages no longer exist: no sandwich or drinks page was
    // photographed, so nothing is invented for them here.
    categories: [
      { id: "plats", visible: true, title: { fr: "Plats", en: "Platters", tn: "أطباق" }, kicker: { fr: "Servis avec riz, frites et 3 salades", en: "Served with rice, fries and 3 salads", tn: "تتقدم بالروز، البطاطا و3 سلطات" } },
      { id: "enfant", visible: true, title: { fr: "Menu Enfant", en: "Kids Menu", tn: "منيو الأطفال" }, kicker: { fr: "Pour les plus petits", en: "For the little ones", tn: "للصغار" } }
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

