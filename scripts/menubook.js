/* =====================================================================
   Babke landing: "Le Carnet", the 3D flip-book menu.
   Exposes window.BabkeMenuBook = { rebuild(), jumpToCategory(id) }.

   Plain classic script, deferred, no build step. Depends on:
     - window.BabkeFx (scripts/fx-core.js)
     - BabkeDB (data/store.js, bare global, guarded): getMenu(), getContent(),
       getMenuBook() and init()
     - GET /api/menu-book (P8) when BabkeDB carries no menuBook
     - the existing cart seam: window 'babkeOpenCustomizer' CustomEvent

   The book is built from the LIVE menu, never from a hardcoded list.
   Engine: the hardened kinben / pickelz sheet state machine.
     - `sheet` = number of leaves already turned (0..total). Sheet i carries
       pages[2i] on its front (right page) and pages[2i+1] on its back.
     - One writer per leaf (applyTurn) sets rotateY and the two turn-shade
       opacities together (inline: gesture start, drags, landing). Only
       transform and opacity ever change on moving elements, never an
       inherited custom property, so a turn never restyles the page subtree,
       repaints the paper or re-rasterises its photos.
     - Tweened turns and single-mode pans run as Web Animations sampled from
       the same cubicInOut curve (play()), so the compositor animates them
       off the main thread. The rAF tween still runs as the clock (writing
       nothing) and lands the turn exactly when it always did; the landing
       commits the same values inline and drops the animations. Reduced
       motion and browsers without WAAPI keep the rAF tween as the writer
       (instant under reduced motion).
     - layout() rewrites the resting z-index ramps and the inert flags after
       every commit, cancel, tap, rebuild and breakpoint change, and gives
       .is-ready to the two leaves that can turn next (either side of the
       spread) and to no other. Resting writes are cached: an unchanged value
       is never written again.
     - Dish thumbnails load a 160px centre-cropped copy from assets/thumbs/
       when the photo is a same-origin assets/*.jpg; a missing copy falls back
       to the photo, then to item.fallbackImage.
     - Presses that land mid-turn are banked (+-3) and drained one at a time.
     - Mouse drags start in the outer 28% and capture on e.target, so a dish
       button pressed there keeps its own click.

   Security:
     - Every interpolated string goes through BabkeFx.esc(). Menu text, book
       settings and contact details are admin-editable.
     - Image URLs are allow-listed (http/https, relative, data:image) and the
       fallback image is wired with a listener, never an inline onerror.
     - The menu grid's card class is never used here: cart.js rewrites every
       element carrying it. Rows are .menubook-row.
   ===================================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  const mount = document.getElementById('menubook-root');
  if (!mount) return;
  if (typeof BabkeFx === 'undefined' || !BabkeFx) return;

  const Fx = BabkeFx;
  const esc = Fx.esc;
  const section = document.getElementById('menubook');

  /* ------------------------------------------------------------ i18n */

  const I18N = {
    fr: {
      book_label: 'Carnet de la carte Babke',
      prev: 'Page précédente',
      next: 'Page suivante',
      counter: 'Page {x} sur {n}',
      hint_spread: 'Tirez le coin d’une page, touchez son bord ou utilisez les flèches du clavier.',
      hint_single: 'Glissez la page ou touchez son bord.',
      add_label: 'Ajouter {name}, {price}',
      sold_out: 'Épuisé',
      part: 'Partie {x}/{n}',
      cover_hint: 'Ouvrez le carnet →',
      back_title: 'Nous trouver',
      loading: 'Préparation du carnet…',
      empty: 'La carte arrive bientôt.',
      error: 'Le carnet n’a pas pu être chargé.',
      btn_retry: 'Réessayer',
      contents_label: 'Sommaire du carnet',
      to_cover: 'Revenir à la couverture'
    },
    en: {
      book_label: 'Babke menu book',
      prev: 'Previous page',
      next: 'Next page',
      counter: 'Page {x} of {n}',
      hint_spread: 'Drag a page corner, tap its edge or use the arrow keys.',
      hint_single: 'Swipe the page or tap its edge.',
      add_label: 'Add {name}, {price}',
      sold_out: 'Sold out',
      part: 'Part {x}/{n}',
      cover_hint: 'Open the book →',
      back_title: 'Find us',
      loading: 'Preparing the menu book…',
      empty: 'The menu is coming soon.',
      error: 'The menu book could not be loaded.',
      btn_retry: 'Try again',
      contents_label: 'Menu book contents',
      to_cover: 'Back to the cover'
    },
    tn: {
      book_label: 'كرّاس منيو بابكي',
      prev: 'الصفحة اللي قبل',
      next: 'الصفحة الجاية',
      counter: 'صفحة {x} من {n}',
      hint_spread: 'اسحب طرف الصفحة، انزل على جنبها ولا استعمل فلاش الكلافيي.',
      hint_single: 'اسحب الصفحة ولا انزل على جنبها.',
      add_label: 'زيد {name}، {price}',
      sold_out: 'وفى',
      part: 'جزء {x}/{n}',
      cover_hint: 'حِلّ الكرّاس ←',
      back_title: 'وين تلقانا',
      loading: 'الكرّاس يتحضّر…',
      empty: 'المنيو جاي قريب.',
      error: 'الكرّاس ما تحلّش.',
      btn_retry: 'عاود',
      contents_label: 'فهرس الكرّاس',
      to_cover: 'ارجع للغلاف'
    }
  };
  const T = (key, vars, lang) => Fx.t(I18N, key, vars, lang);

  /* ------------------------------------------------------- constants */

  const SINGLE_MQ = '(max-width: 899px)';
  const DRAG_ZONE = 0.28;        // outer share of the book where a mouse drag may start
  const TAP_EPS = 0.02;          // a drag that moved less than this is a click
  const COMMIT_AT = 0.4;         // share of a turn the drag must cover to commit
  const SWIPE_PX = 36;           // touch / single mode swipe threshold
  const QUEUE_MAX = 3;
  const PAN_MS = 500;
  const JUMP_FADE_MS = 400;
  const REDUCED_FADE_MS = 200;
  const EASE_OUT_QUAD = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'; // WAAPI stand-in for power2.out

  // 8-point khatam star (two squares), filled
  const STAR = '<img class="menubook-star" src="assets/BabkeLogo.png" alt="" aria-hidden="true" draggable="false" decoding="async">';
  // khatam rosette used as a watermark
  const ROSETTE = '<img class="menubook-rosette-mark" src="assets/BabkeLogo.png" alt="" aria-hidden="true" draggable="false" decoding="async">';
  const PLUS = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
  const ICON_PIN = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></g></svg>';
  const ICON_PHONE = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M6.5 3.5h3l1.6 4.4-2.1 1.3a10.5 10.5 0 0 0 5.8 5.8l1.3-2.1 4.4 1.6v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2z"/></svg>';
  const ICON_CLOCK = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/></g></svg>';

  /* --------------------------------------------------------- helpers */

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const hasDB = () => typeof BabkeDB !== 'undefined' && !!BabkeDB;

  // Menu item text, seed-shaped: field[lang] || field.en, with defensive fallbacks.
  function pick(field, lang) {
    if (field == null) return '';
    if (typeof field === 'string') return field;
    if (typeof field === 'object') {
      const v = field[lang] || field.en || field.fr || field.tn;
      return v == null ? '' : String(v);
    }
    return String(field);
  }

  function pickTags(tags, lang) {
    if (!tags || typeof tags !== 'object') return [];
    const list = Array.isArray(tags) ? tags : (tags[lang] || tags.en || tags.fr || tags.tn || []);
    if (!Array.isArray(list)) return [];
    return list.filter((x) => typeof x === 'string' && x.trim()).slice(0, 2);
  }

  // Images come from admin-editable data: only http(s), protocol-relative,
  // same-origin relative paths and raster data URIs are allowed.
  function safeUrl(u) {
    const s = String(u == null ? '' : u).trim();
    if (!s || s.length > 2048) return '';
    if (/^(https?:)?\/\//i.test(s)) return s;
    if (/^data:image\/(png|jpe?g|gif|webp|avif);/i.test(s)) return s;
    if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return '';
    return s;
  }

  // The book prints dishes at 3.8em (48 to 64 CSS px) but the photos are
  // 1080x1350. Every same-origin assets/<name>.jpg ships a 160x160
  // centre-cropped copy at assets/thumbs/<name>.jpg (the same crop the
  // object-fit: cover square shows). Anything else (admin data: URIs, other
  // hosts, PNGs) has no copy and loads as-is. Returns '' when there is none.
  function thumbUrl(src) {
    if (!src || /^data:/i.test(src)) return '';
    let u;
    try { u = new URL(src, document.baseURI); } catch (e) { return ''; }
    if (u.origin !== window.location.origin || u.search || u.hash) return '';
    const m = /^(.*\/assets\/)([^/]+\.jpe?g)$/i.exec(u.pathname);
    return m ? m[1] + 'thumbs/' + m[2] : '';
  }

  function isSettings(s) {
    return !!s && typeof s === 'object' && !Array.isArray(s) && !s.error &&
      (Array.isArray(s.categories) || typeof s.enabled === 'boolean');
  }

  function dbSettings() {
    if (!hasDB() || typeof BabkeDB.getMenuBook !== 'function') return null;
    try {
      const s = BabkeDB.getMenuBook();
      return isSettings(s) ? s : null;
    } catch (e) { return null; }
  }

  function getMenu() {
    if (!hasDB() || typeof BabkeDB.getMenu !== 'function') return [];
    let m;
    try { m = BabkeDB.getMenu(); } catch (e) { return []; }
    if (!Array.isArray(m)) return [];
    return m.filter((x) => x && typeof x === 'object' && x.id != null && x.id !== '' &&
      typeof x.category === 'string' && x.category);
  }

  function getContact() {
    if (!hasDB() || typeof BabkeDB.getContent !== 'function') return {};
    try {
      const c = BabkeDB.getContent();
      return (c && typeof c.contact === 'object' && c.contact) ? c.contact : {};
    } catch (e) { return {}; }
  }

  function signature(s, menu, lang) {
    return JSON.stringify([s ? s.version : null, lang,
      menu.map((m) => [m.id, m.available !== false, m.price, m.title && m.title[lang]])]);
  }

  const reduced = () => Fx.reducedMotion();

  /* ---------------------------------------------------------- shell */

  mount.innerHTML =
    '<div class="menubook" data-mode="spread" data-state="loading">' +
      '<nav class="menubook-contents"></nav>' +
      '<div class="menubook-stage">' +
        '<div class="menubook-book" role="group" tabindex="0" dir="ltr"></div>' +
        '<div class="menubook-skeleton">' +
          '<div class="menubook-skeleton-half menubook-skeleton-l" aria-hidden="true"><i></i><i></i><i></i><i></i></div>' +
          '<div class="menubook-skeleton-half menubook-skeleton-r" aria-hidden="true"><i></i><i></i><i></i><i></i></div>' +
          '<div class="menubook-skeleton-msg"><div class="menubook-skeleton-card">' +
            '<span class="menubook-skeleton-mark">' + STAR + '</span>' +
            '<p class="menubook-skeleton-text" role="status"></p>' +
            '<button type="button" class="btn-secondary-dark menubook-retry" hidden></button>' +
          '</div></div>' +
        '</div>' +
      '</div>' +
      '<div class="menubook-controls" dir="ltr">' +
        '<button type="button" class="btn-icon menubook-prev">&#8249;</button>' +
        '<span class="menubook-counter" aria-live="polite" dir="auto"></span>' +
        '<button type="button" class="btn-icon menubook-next">&#8250;</button>' +
      '</div>' +
      '<p class="menubook-hint"></p>' +
    '</div>';

  const root = mount.querySelector('.menubook');
  const contents = root.querySelector('.menubook-contents');
  const stage = root.querySelector('.menubook-stage');
  const book = root.querySelector('.menubook-book');
  const skelText = root.querySelector('.menubook-skeleton-text');
  const retryBtn = root.querySelector('.menubook-retry');
  const controls = root.querySelector('.menubook-controls');
  const prevBtn = root.querySelector('.menubook-prev');
  const nextBtn = root.querySelector('.menubook-next');
  const counter = root.querySelector('.menubook-counter');
  const hint = root.querySelector('.menubook-hint');

  Fx.reveal([contents, stage, controls, hint], { stagger: 90 });

  /* ---------------------------------------------------------- state */

  const st = {
    sheet: 0,            // leaves turned, 0..total
    half: 'r',           // single mode: which page of the spread is on view
    single: false,
    busy: false,         // a turn or pan is in flight
    drag: null,          // live pointer gesture
    queued: 0,           // banked presses, -3..3
    swallowClick: false
  };
  let live = null;          // { cancel, land } of the turn or pan in flight
  let swallowTimer = 0;
  let pages = [];
  let sheets = [];          // .menubook-sheet elements
  let fronts = [];
  let backs = [];
  let leaves = [];          // per sheet: { shadeF, shadeB, t, z, f, b, ready } (last written values)
  let panT = '';            // last transform written on the book (single-mode pan)
  let chips = [];           // [{ el, cat, page }]
  let rowItems = [];        // menu items by row index, for the add buttons
  let perPage = 3;
  let built = false;        // the book DOM matches `pages`
  let loaded = false;       // settings were obtained at least once
  let loading = false;
  let lastSettings = null;
  let lastSig = null;

  const total = () => sheets.length;

  function setState(state) {
    root.dataset.state = state;
    const lang = Fx.getLang();
    if (state === 'ready') return;
    skelText.textContent = T(state === 'loading' ? 'loading' : state === 'empty' ? 'empty' : 'error', null, lang);
    retryBtn.hidden = state !== 'error';
    retryBtn.textContent = T('btn_retry', null, lang);
  }

  function setHidden(h) {
    if (section) section.hidden = h;
    else mount.hidden = h;
    const ctas = document.querySelectorAll('.menubook-cta');
    for (let i = 0; i < ctas.length; i++) ctas[i].hidden = h;
  }

  /* ---------------------------------------------------- pagination */

  function buildPages(s, menu, lang) {
    perPage = Number.isInteger(s.itemsPerPage) ? clamp(s.itemsPerPage, 2, 4) : 3;
    const showSoldOut = s.showSoldOut !== false;
    const listed = Array.isArray(s.categories)
      ? s.categories.filter((c) => c && typeof c === 'object' && c.id != null && c.id !== '')
      : [];
    const known = new Set(listed.map((c) => String(c.id)));
    const seen = new Set();
    const cats = [];
    listed.forEach((c) => {
      const id = String(c.id);
      if (c.visible === false || seen.has(id)) return;
      seen.add(id);
      cats.push({ id, title: c.title, kicker: c.kicker });
    });
    // categories present in the menu but unknown to the book settings
    menu.forEach((m) => {
      const id = m.category;
      if (known.has(id) || seen.has(id)) return;
      seen.add(id);
      cats.push({ id, title: { fr: id, en: id, tn: id }, kicker: { fr: id, en: id, tn: id } });
    });

    const list = [{ id: 'cover', type: 'cover' }];
    let itemCount = 0;
    cats.forEach((cat) => {
      const items = menu.filter((m) => m.category === cat.id && (showSoldOut || m.available !== false));
      if (!items.length) return;
      itemCount += items.length;
      const parts = Math.ceil(items.length / perPage);
      for (let k = 0; k < parts; k++) {
        list.push({ id: 'cat:' + cat.id + ':' + k, type: 'category', cat, part: k, parts,
          items: items.slice(k * perPage, (k + 1) * perPage) });
      }
    });
    list.push({ id: 'back', type: 'back' });
    // every leaf prints two faces: pad with the house page, before the back page
    if (list.length % 2 === 1) list.splice(list.length - 1, 0, { id: 'house', type: 'house' });
    return { list, itemCount };
  }

  /* ---------------------------------------------------- page markup */

  const dirOf = (lang) => (lang === 'tn' ? 'rtl' : 'ltr');

  function rule(extra) {
    return '<div class="menubook-rule' + (extra ? ' ' + extra : '') + '" aria-hidden="true"><span></span>' + STAR + '<span></span></div>';
  }

  function coverHtml(s, lang) {
    const c = (s.cover && typeof s.cover === 'object') ? s.cover : {};
    const kicker = Fx.loc(c.kicker, lang);
    const title = Fx.loc(c.title, lang) || 'Babke';
    const subtitle = Fx.loc(c.subtitle, lang);
    return '<div class="menubook-page menubook-page-cover" dir="' + dirOf(lang) + '">' +
      '<span class="menubook-cover-frame" aria-hidden="true"></span>' +
      '<div class="menubook-cover-body">' +
        '<div class="menubook-cover-medallion"><span class="menubook-cover-rosette" aria-hidden="true">' + ROSETTE + '</span>' +
          '<img src="assets/BabkeLogo.png" alt="Babke" width="72" height="72" draggable="false"></div>' +
        (kicker ? '<p class="menubook-cover-kicker">' + esc(kicker) + '</p>' : '') +
        '<h3 class="menubook-cover-title">' + esc(title) + '</h3>' +
        rule('menubook-rule-brass') +
        (subtitle ? '<p class="menubook-cover-subtitle">' + esc(subtitle) + '</p>' : '') +
      '</div>' +
      '<button type="button" class="menubook-open">' + esc(T('cover_hint', null, lang)) + '</button>' +
    '</div>';
  }

  function rowHtml(item, lang) {
    const name = pick(item.title, lang) || String(item.id);
    const desc = pick(item.description, lang);
    const tags = pickTags(item.tags, lang);
    const price = Number(item.price);
    const priceOk = item.price !== null && item.price !== '' && isFinite(price) && price >= 0;
    const priceTxt = priceOk ? Fx.fmtPrice(price) : '';
    const soldOut = item.available === false;
    const img = safeUrl(item.image);
    const fb = safeUrl(item.fallbackImage);
    const src = img || fb;
    const small = thumbUrl(src);
    const idx = rowItems.push(item) - 1;

    const thumb = src
      ? '<img class="menubook-thumb" src="' + esc(small || src) + '"' +
          (small ? ' data-full="' + esc(src) + '"' : '') +
          (fb && fb !== src ? ' data-fallback="' + esc(fb) + '"' : '') +
          ' alt="" loading="lazy" decoding="async" width="64" height="64" draggable="false">'
      : '<span class="menubook-thumb menubook-thumb-empty" aria-hidden="true">' + STAR + '</span>';

    let action = '';
    if (soldOut) {
      action = '<button type="button" class="menubook-soldout" disabled>' + esc(T('sold_out', null, lang)) + '</button>';
    } else if (priceOk) {
      action = '<button type="button" class="menubook-add" data-row="' + idx + '" aria-label="' +
        esc(T('add_label', { name, price: priceTxt }, lang)) + '">' + PLUS + '</button>';
    }

    return '<li class="menubook-row' + (soldOut ? ' is-soldout' : '') + '">' +
      thumb +
      '<div class="menubook-row-main">' +
        '<h4 class="menubook-name">' + esc(name) + '</h4>' +
        (tags.length ? '<p class="menubook-tags">' + tags.map((t) => '<span class="menubook-tag">' + esc(t) + '</span>').join('') + '</p>' : '') +
        (desc ? '<p class="menubook-desc">' + esc(desc) + '</p>' : '') +
      '</div>' +
      '<div class="menubook-row-side">' +
        (priceTxt ? '<span class="menubook-price" dir="ltr">' + esc(priceTxt) + '</span>' : '') +
        action +
      '</div>' +
    '</li>';
  }

  function categoryHtml(pg, index, lang) {
    const title = Fx.loc(pg.cat.title, lang) || pg.cat.id;
    let kicker = Fx.loc(pg.cat.kicker, lang);
    // an auto-appended category carries its id as both title and kicker: print it once
    if (kicker === title) kicker = '';
    const part = pg.parts > 1 ? T('part', { x: pg.part + 1, n: pg.parts }, lang) : '';
    const kickerLine = [kicker, part].filter(Boolean).join(' · ');
    return '<div class="menubook-page menubook-page-category" dir="' + dirOf(lang) + '">' +
      '<header class="menubook-head">' +
        (kickerLine ? '<p class="menubook-kicker">' + esc(kickerLine) + '</p>' : '') +
        '<h3 class="menubook-title">' + esc(title) + '</h3>' +
        rule() +
      '</header>' +
      '<ul class="menubook-rows">' + pg.items.map((it) => rowHtml(it, lang)).join('') + '</ul>' +
      '<p class="menubook-folio" aria-hidden="true">' + (index + 1) + '</p>' +
    '</div>';
  }

  function houseHtml(s, index, lang) {
    const h = (s.housePage && typeof s.housePage === 'object') ? s.housePage : {};
    const title = Fx.loc(h.title, lang) || 'Babke';
    const body = Fx.loc(h.body, lang);
    return '<div class="menubook-page menubook-page-house" dir="' + dirOf(lang) + '">' +
      '<span class="menubook-house-mark" aria-hidden="true">' + ROSETTE + '</span>' +
      '<div class="menubook-house-body">' +
        '<h3 class="menubook-title">' + esc(title) + '</h3>' +
        rule() +
        (body ? '<p class="menubook-house-text">' + esc(body) + '</p>' : '') +
      '</div>' +
      '<p class="menubook-folio" aria-hidden="true">' + (index + 1) + '</p>' +
    '</div>';
  }

  function backHtml(s, lang) {
    const contact = getContact();
    const address = Fx.loc(contact.address, lang);
    const phone = typeof contact.phone === 'string' ? contact.phone.trim() : '';
    const tel = phone.replace(/[^\d+]/g, '');
    const hours = (contact.hours && typeof contact.hours === 'object') ? contact.hours : {};
    const weekday = Fx.loc(hours.weekday, lang);
    const weekend = Fx.loc(hours.weekend, lang);
    const note = Fx.loc(s.backPage && typeof s.backPage === 'object' ? s.backPage.note : null, lang);

    let lines = '';
    if (address) lines += '<li>' + ICON_PIN + '<span>' + esc(address) + '</span></li>';
    if (phone) {
      lines += '<li>' + ICON_PHONE + '<span>' + (/^\+?\d{6,15}$/.test(tel)
        ? '<a class="menubook-tel" href="tel:' + esc(tel) + '" dir="ltr" draggable="false">' + esc(phone) + '</a>'
        : '<span dir="ltr">' + esc(phone) + '</span>') + '</span></li>';
    }
    if (weekday || weekend) {
      lines += '<li>' + ICON_CLOCK + '<span>' +
        (weekday ? '<span class="menubook-hours">' + esc(weekday) + '</span>' : '') +
        (weekend ? '<span class="menubook-hours">' + esc(weekend) + '</span>' : '') +
      '</span></li>';
    }

    return '<div class="menubook-page menubook-page-back" dir="' + dirOf(lang) + '">' +
      '<div class="menubook-back-body">' +
        '<h3 class="menubook-title">' + esc(T('back_title', null, lang)) + '</h3>' +
        rule() +
        (lines ? '<ul class="menubook-find">' + lines + '</ul>' : '') +
        (note ? '<p class="menubook-note">' + esc(note) + '</p>' : '') +
      '</div>' +
      '<button type="button" class="menubook-tocover" aria-label="' + esc(T('to_cover', null, lang)) + '">↑</button>' +
    '</div>';
  }

  function pageHtml(pg, index, s, lang) {
    if (!pg) return '';
    if (pg.type === 'cover') return coverHtml(s, lang);
    if (pg.type === 'category') return categoryHtml(pg, index, lang);
    if (pg.type === 'house') return houseHtml(s, index, lang);
    return backHtml(s, lang);
  }

  function renderBook(s, lang) {
    rowItems = [];
    const n = pages.length / 2;
    let html = '<div class="menubook-under menubook-under-l" aria-hidden="true"></div>' +
      '<div class="menubook-under menubook-under-r" aria-hidden="true"></div>';
    for (let i = 0; i < n; i++) {
      const front = pages[2 * i];
      const back = pages[2 * i + 1];
      html += '<div class="menubook-sheet" data-i="' + i + '">' +
        '<div class="menubook-face menubook-face-front">' +
          '<div class="menubook-paper' + (front.type === 'cover' ? ' menubook-paper-cover' : '') + '">' +
            pageHtml(front, 2 * i, s, lang) +
            '<span class="menubook-shade-front" aria-hidden="true"></span>' +
            '<button type="button" class="menubook-edge menubook-edge-next" tabindex="-1" aria-hidden="true"></button>' +
            '<button type="button" class="menubook-edge menubook-edge-prev menubook-edge-fold" tabindex="-1" aria-hidden="true"></button>' +
          '</div>' +
        '</div>' +
        '<div class="menubook-face menubook-face-back">' +
          '<div class="menubook-paper' + (back.type === 'cover' ? ' menubook-paper-cover' : '') + '">' +
            pageHtml(back, 2 * i + 1, s, lang) +
            '<span class="menubook-shade-back" aria-hidden="true"></span>' +
            '<button type="button" class="menubook-edge menubook-edge-prev" tabindex="-1" aria-hidden="true"></button>' +
            '<button type="button" class="menubook-edge menubook-edge-next menubook-edge-fold" tabindex="-1" aria-hidden="true"></button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }
    html += '<div class="menubook-spine" aria-hidden="true"></div>';
    book.innerHTML = html;
    sheets = Array.prototype.slice.call(book.querySelectorAll('.menubook-sheet'));
    fronts = sheets.map((el) => el.querySelector('.menubook-face-front'));
    backs = sheets.map((el) => el.querySelector('.menubook-face-back'));
    leaves = sheets.map((el) => ({
      shadeF: el.querySelector('.menubook-shade-front'),
      shadeB: el.querySelector('.menubook-shade-back'),
      t: null, z: null, f: null, b: null, ready: false
    }));
  }

  function renderChips(lang) {
    chips = [];
    let html = '';
    const seenCat = new Set();
    pages.forEach((pg, p) => {
      if (pg.type !== 'category' || seenCat.has(pg.cat.id)) return;
      seenCat.add(pg.cat.id);
      const i = chips.push({ cat: pg.cat.id, page: p, el: null }) - 1;
      html += '<button type="button" class="menubook-chip" data-chip="' + i + '">' +
        esc(Fx.loc(pg.cat.title, lang) || pg.cat.id) + '</button>';
    });
    contents.innerHTML = html;
    const els = contents.querySelectorAll('.menubook-chip');
    for (let i = 0; i < els.length; i++) if (chips[i]) chips[i].el = els[i];
    contents.hidden = chips.length === 0;
  }

  /* --------------------------------------------------------- engine */

  // Single mode: the camera is a translateX on the (composited) book, written
  // inline. A custom property here would restyle every page in the book on
  // every frame of a pan. Spread mode never pans: no transform at all.
  function setPan(v) {
    const t = st.single ? 'translateX(' + v + '%)' : '';
    if (t === panT) return;
    panT = t;
    book.style.transform = t;
  }

  function pinHalf() {
    if (st.sheet <= 0) st.half = 'r';
    else if (st.sheet >= total()) st.half = 'l';
  }

  function visiblePage() {
    const p = st.half === 'r' ? 2 * st.sheet : 2 * st.sheet - 1;
    return clamp(p, 0, Math.max(0, pages.length - 1));
  }

  // page indices on view, left to right
  function facing() {
    if (st.single) return [visiblePage()];
    const out = [];
    if (st.sheet > 0) out.push(2 * st.sheet - 1);
    if (st.sheet < total()) out.push(2 * st.sheet);
    return out;
  }

  function setInert(el, on) {
    if (!el || el.hasAttribute('inert') === on) return;
    if (on) el.setAttribute('inert', '');
    else el.removeAttribute('inert');
  }

  // The turn shading, written straight to the two shade layers. Same curve as
  // the old calc(var(--turn) * 1.6) (opacity clamps at 1). Unchanged values
  // are not written again.
  function setShades(i, f, b) {
    const L = leaves[i];
    const fs = f <= 0 ? '0' : f >= 1 ? '1' : f.toFixed(3);
    const bs = b <= 0 ? '0' : b >= 1 ? '1' : b.toFixed(3);
    if (fs !== L.f) { L.f = fs; L.shadeF.style.opacity = fs; }
    if (bs !== L.b) { L.b = bs; L.shadeB.style.opacity = bs; }
  }

  function setLeaf(i, t, z) {
    const L = leaves[i];
    const el = sheets[i];
    if (t !== L.t) { L.t = t; el.style.transform = t; }
    if (z !== L.z) { L.z = z; el.style.zIndex = z; }
  }

  // One rotation + shading writer per leaf, lifted clear of both stacks. The
  // leaf's shades are already promoted (.is-ready, set at rest by layout()):
  // promoting them here, on the first frame of a turn, re-rasterised the
  // turning page while it moved and flashed it on screen. The class is only
  // added here for a leaf layout() did not ready. Every frame writes only
  // transform and opacity.
  function applyTurn(i, v) {
    const L = leaves[i];
    if (!L) return;
    if (!L.ready) {
      L.ready = true;
      sheets[i].classList.add('is-ready');
    }
    setLeaf(i, 'rotateY(' + (-180 * v) + 'deg)', '100');
    setShades(i, v * 1.6, (1 - v) * 1.6);
  }

  // Resting state of the whole book from the committed (sheet, half):
  // two z-index ramps meeting in the middle, and only the facing pages live.
  function layout() {
    const n = total();
    const s = st.sheet;
    const active = document.activeElement;
    let lostFocus = false;
    for (let i = 0; i < n; i++) {
      const flipped = i < s;
      setLeaf(i, 'rotateY(' + (flipped ? -180 : 0) + 'deg)', String(flipped ? i + 1 : n - i));
      setShades(i, flipped ? 1 : 0, flipped ? 0 : 1);
      // the leaves either side of the spread are the only ones a turn can
      // start on: their shades stay promoted while the book is at rest, so
      // the layer change (and the repaint of the page under the shade) happens
      // here, with nothing moving, instead of on the first frame of a turn
      const ready = i === s || i === s - 1;
      if (leaves[i].ready !== ready) {
        leaves[i].ready = ready;
        sheets[i].classList.toggle('is-ready', ready);
      }
      let frontLive = i === s;
      let backLive = i === s - 1;
      if (st.single) {
        frontLive = frontLive && st.half === 'r';
        backLive = backLive && st.half === 'l';
      }
      if (active && !frontLive && fronts[i].contains(active)) lostFocus = true;
      if (active && !backLive && backs[i].contains(active)) lostFocus = true;
      setInert(fronts[i], !frontLive);
      setInert(backs[i], !backLive);
    }
    setPan(st.single ? (st.half === 'r' ? -50 : 0) : 0);
    // the pressed control went inert under the turned leaf: hand focus to the book
    if (lostFocus) focusQuiet(book);
  }

  function focusQuiet(el) {
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
  }

  function updateChrome() {
    const lang = Fx.getLang();
    const n = total();
    const x = st.single ? visiblePage() + 1 : st.sheet + 1;
    const of = st.single ? pages.length : n + 1;
    const txt = T('counter', { x, n: of }, lang);
    if (counter.textContent !== txt) counter.textContent = txt;

    const focused = document.activeElement;
    prevBtn.disabled = st.sheet <= 0;
    nextBtn.disabled = st.sheet >= n;
    // the pressed arrow just disabled itself at an end of the book: hand focus across
    if (focused === prevBtn && prevBtn.disabled && !nextBtn.disabled) focusQuiet(nextBtn);
    else if (focused === nextBtn && nextBtn.disabled && !prevBtn.disabled) focusQuiet(prevBtn);

    // every category printed on the pages in view (a spread can show two)
    const onView = new Set();
    facing().forEach((i) => {
      const pg = pages[i];
      if (pg && pg.type === 'category') onView.add(pg.cat.id);
    });
    let activeEl = null;
    chips.forEach((c) => {
      if (!c.el) return;
      const on = onView.has(c.cat);
      c.el.classList.toggle('active', on);
      if (on) {
        c.el.setAttribute('aria-current', 'true');
        if (!activeEl) activeEl = c.el;
      } else {
        c.el.removeAttribute('aria-current');
      }
    });
    // keep the active chip in view inside a horizontally scrolling strip, never the page
    if (activeEl && contents.scrollWidth > contents.clientWidth + 1) {
      const a = activeEl.getBoundingClientRect();
      const r = contents.getBoundingClientRect();
      const delta = (a.left + a.width / 2) - (r.left + r.width / 2);
      if (Math.abs(delta) > 1) {
        try { contents.scrollBy({ left: delta, behavior: reduced() ? 'auto' : 'smooth' }); }
        catch (e) { contents.scrollLeft += delta; }
      }
    }
  }

  function updateTexts() {
    const lang = Fx.getLang();
    book.setAttribute('aria-label', T('book_label', null, lang));
    contents.setAttribute('aria-label', T('contents_label', null, lang));
    contents.setAttribute('dir', dirOf(lang));
    hint.setAttribute('dir', dirOf(lang));
    prevBtn.setAttribute('aria-label', T('prev', null, lang));
    nextBtn.setAttribute('aria-label', T('next', null, lang));
    hint.textContent = T(st.single ? 'hint_single' : 'hint_spread', null, lang);
  }

  function updateFontSize() {
    if (!built) return;
    const w = book.offsetWidth;
    if (!w) return;
    // type scales with the page, so a phone page holds what a desktop page holds
    const div = st.single ? (perPage >= 4 ? 29 : 27) : 32;
    const fs = clamp((w / 2) / div, 11, 15);
    book.style.setProperty('--menubook-fs', fs.toFixed(2) + 'px');
  }

  function fadeStage(ms) {
    if (typeof stage.animate !== 'function') return;
    try { stage.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: ms, easing: EASE_OUT_QUAD }); }
    catch (e) { /* ignore */ }
  }

  function drain() {
    const q = st.queued;
    if (!q) return;
    const dir = q > 0 ? 1 : -1;
    st.queued = q - dir;
    step(dir);
  }

  /* ------------------------------------------- compositor animations */

  // A tweened turn or pan is handed to the compositor as a Web Animation.
  // Measured in Chromium: an inline 3D rotateY on a sheet (and an inline
  // translateX on the 3D book) is never a direct compositor update, so each
  // frame re-layerised the whole page; the same motion as a Web Animation runs
  // off the main thread. The keyframes sample the exact cubicInOut curve the
  // rAF tween wrote frame by frame (linear between samples, KF_MS apart).
  const KF_MS = 25;
  const canAnimate = typeof book.animate === 'function';

  function sampled(from, to, duration, frame) {
    const k = Math.max(8, Math.ceil(duration / KF_MS));
    const out = [];
    for (let j = 0; j <= k; j++) {
      const f = frame(from + (to - from) * Fx.ease.cubicInOut(j / k));
      f.offset = j / k;
      out.push(f);
    }
    return out;
  }

  // Runs [element, keyframes] tracks together, holding the last frame
  // (fill: forwards) until the caller has committed the same values inline;
  // the returned stop() then drops them. Returns null when WAAPI is missing
  // (the caller keeps writing frames itself). The landing is NOT tied to the
  // animation's finish event: with no other main-thread frame pending,
  // Chromium can deliver it long after the end. The rAF tween stays the clock.
  function play(tracks, duration) {
    if (!canAnimate) return null;
    const anims = [];
    const stop = () => {
      while (anims.length) {
        const a = anims.pop();
        try { a.cancel(); } catch (e) { /* ignore */ }
      }
    };
    try {
      tracks.forEach((t) => { anims.push(t[0].animate(t[1], { duration, fill: 'forwards' })); });
    } catch (e) {
      stop();
      return null;
    }
    return stop;
  }

  const leafFrame = (v) => ({ transform: 'rotateY(' + (-180 * v) + 'deg)' });
  const shadeFFrame = (v) => ({ opacity: clamp(v * 1.6, 0, 1) });
  const shadeBFrame = (v) => ({ opacity: clamp((1 - v) * 1.6, 0, 1) });
  const panFrame = (p) => ({ transform: 'translateX(' + p + '%)' });

  // Land whatever is in flight on its own target and forget pending input.
  function finishNow() {
    if (live) {
      const l = live;
      live = null;
      l.cancel();
      l.land();
    }
    st.drag = null;
    st.queued = 0;
    st.busy = false;
  }

  // Tween leaf `idx` from `from` to `to`, then commit `target`.
  function turn(idx, from, to, target) {
    const el = sheets[idx];
    if (!el) {
      st.sheet = target.sheet; st.half = target.half;
      pinHalf(); layout(); updateChrome();
      return;
    }
    st.busy = true;
    let landed = false;
    let cancelTween = () => {};
    let stopAnims = () => {};
    const land = () => {
      if (landed) return;
      landed = true;
      if (live && live.land === land) live = null;
      applyTurn(idx, to);
      st.sheet = target.sheet;
      st.half = target.half;
      st.busy = false;
      pinHalf();
      layout();
      updateChrome();
      // the resting values are inline now: drop the held last frame
      stopAnims();
    };
    live = { land, cancel: () => cancelTween() };
    // seeded before the tween so the leaf is lifted clear on the first frame
    applyTurn(idx, from);
    const rm = reduced();
    const duration = rm ? 0 : (0.55 + Math.abs(to - from) * 0.45) * 1000;
    const onDone = () => {
      land();
      if (rm) fadeStage(REDUCED_FADE_MS);
      drain();
    };
    let onCompositor = false;
    if (duration > 0) {
      const L = leaves[idx];
      const tracks = [
        [el, sampled(from, to, duration, leafFrame)],
        [L.shadeF, sampled(from, to, duration, shadeFFrame)],
        [L.shadeB, sampled(from, to, duration, shadeBFrame)]
      ];
      // single mode: the camera rides the turn, so the turn ends on the page it delivered
      if (st.single) tracks.push([book, sampled(from, to, duration, (v) => panFrame(-50 + 50 * v))]);
      const stop = play(tracks, duration);
      if (stop) {
        stopAnims = stop;
        onCompositor = true;
      }
    }
    // the clock (and, without WAAPI, the frame writer): lands on the first
    // frame at or after `duration`, exactly as before
    const cancelClock = Fx.tween({
      from, to, duration,
      ease: Fx.ease.cubicInOut,
      onUpdate: onCompositor ? null : (v) => {
        applyTurn(idx, v);
        if (st.single) setPan(-50 + 50 * v);
      },
      onDone
    });
    cancelTween = () => { cancelClock(); stopAnims(); };
  }

  // Single mode: cross the fold inside a spread. No paper moves.
  function panOnly(h) {
    st.busy = true;
    let done = false;
    let cancelTween = () => {};
    let stopAnims = () => {};
    const from = st.half === 'r' ? -50 : 0;
    const to = h === 'r' ? -50 : 0;
    const land = () => {
      if (done) return;
      done = true;
      if (live && live.land === land) live = null;
      st.half = h;
      st.busy = false;
      pinHalf();
      layout();
      updateChrome();
      stopAnims();
    };
    live = { land, cancel: () => cancelTween() };
    const rm = reduced();
    const onDone = () => {
      land();
      if (rm) fadeStage(REDUCED_FADE_MS);
      drain();
    };
    const stop = rm ? null : play([[book, sampled(from, to, PAN_MS, panFrame)]], PAN_MS);
    if (stop) stopAnims = stop;
    const cancelClock = Fx.tween({
      from, to, duration: rm ? 0 : PAN_MS,
      ease: Fx.ease.cubicInOut,
      onUpdate: stop ? null : setPan,
      onDone
    });
    cancelTween = () => { cancelClock(); stopAnims(); };
  }

  function step(dir) {
    if (!built) return;
    if (st.busy || st.drag) {
      st.queued = clamp(st.queued + dir, -QUEUE_MAX, QUEUE_MAX);
      return;
    }
    const s = st.sheet;
    if (dir > 0) {
      // a bank that cannot advance is stale
      if (s >= total()) { st.queued = 0; return; }
      if (st.single && st.half === 'l') { panOnly('r'); return; }
      turn(s, 0, 1, { sheet: s + 1, half: 'l' });
    } else {
      if (s <= 0) { st.queued = 0; return; }
      if (st.single && st.half === 'r') { panOnly('l'); return; }
      turn(s - 1, 1, 0, { sheet: s - 1, half: 'r' });
    }
  }

  // Commit a page instantly (no fade). Used by jump() and by rebuilds.
  function commitPage(p) {
    p = clamp(p | 0, 0, Math.max(0, pages.length - 1));
    st.sheet = Math.ceil(p / 2);
    st.half = p % 2 === 0 ? 'r' : 'l';
    pinHalf();
    layout();
    updateChrome();
  }

  function jump(p) {
    if (!built || st.busy || st.drag) return;
    st.queued = 0;
    p = clamp(p | 0, 0, Math.max(0, pages.length - 1));
    const s = Math.ceil(p / 2);
    const h = p % 2 === 0 ? 'r' : 'l';
    if (s === st.sheet && (!st.single || h === st.half)) return;
    commitPage(p);
    fadeStage(reduced() ? REDUCED_FADE_MS : JUMP_FADE_MS);
  }

  /* --------------------------------------------------------- pointer */

  function armSwallow() {
    st.swallowClick = true;
    clearTimeout(swallowTimer);
    // a swipe is often followed by no click at all: never let the flag eat a later one
    swallowTimer = setTimeout(() => { st.swallowClick = false; }, 700);
  }

  book.addEventListener('pointerdown', (e) => {
    st.swallowClick = false;
    if (!built || st.drag) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    // a finger, a pen, or any pointer on the one-page layout gets the snap model;
    // recorded even mid-turn, so pointerup's step() banks the swipe instead of losing it
    if (e.pointerType !== 'mouse' || st.single) {
      st.drag = { mode: 'swipe', id: e.pointerId, startX: e.clientX, startY: e.clientY };
      return;
    }
    // a mouse drag grabs a leaf, so it never starts while one is in flight
    if (st.busy) return;
    const rect = book.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const s = st.sheet;
    const fwd = x > rect.width * (1 - DRAG_ZONE) && s < total();
    const back = !fwd && x < rect.width * DRAG_ZONE && s > 0;
    if (!fwd && !back) return;
    const dir = fwd ? 1 : -1;
    st.drag = { mode: 'drag', id: e.pointerId, dir, idx: fwd ? s : s - 1,
      startX: e.clientX, width: rect.width, progress: fwd ? 0 : 1 };
    // captured on the pressed element, never on the book: the click after a
    // press that never moved goes to the capture target, and a dish button has
    // to keep that click to reach the cart
    try { if (e.target && e.target.setPointerCapture) e.target.setPointerCapture(e.pointerId); }
    catch (err) { /* ignore */ }
  });

  book.addEventListener('pointermove', (e) => {
    const d = st.drag;
    if (!d || d.mode !== 'drag' || d.id !== e.pointerId) return;
    if (!sheets[d.idx]) return;
    const base = d.dir === 1 ? 0 : 1;
    d.progress = clamp(base + (d.startX - e.clientX) / (d.width * 0.85), 0, 1);
    applyTurn(d.idx, d.progress);
  });

  book.addEventListener('pointerup', (e) => {
    const d = st.drag;
    if (!d || d.id !== e.pointerId) return;
    st.drag = null;
    if (d.mode === 'swipe') {
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
        armSwallow();
        step(dx < 0 ? 1 : -1);
      } else {
        drain();
      }
      return;
    }
    const base = d.dir === 1 ? 0 : 1;
    if (Math.abs(d.progress - base) < TAP_EPS) {
      // a click, not a drag: park the leaf and let the element underneath own it
      layout();
      drain();
      return;
    }
    armSwallow();
    // the drag has to cover COMMIT_AT of a turn in its own direction to commit
    const endFlipped = d.dir === 1 ? d.progress > COMMIT_AT : d.progress > 1 - COMMIT_AT;
    turn(d.idx, d.progress, endFlipped ? 1 : 0,
      { sheet: endFlipped ? d.idx + 1 : d.idx, half: endFlipped ? 'l' : 'r' });
  });

  // The browser took the gesture (scroll), or the pointer left: return the
  // paper to where it started and commit nothing.
  const onAbort = (e) => {
    const d = st.drag;
    if (!d || d.id !== e.pointerId) return;
    st.drag = null;
    if (d.mode === 'drag') {
      const base = d.dir === 1 ? 0 : 1;
      if (sheets[d.idx] && Math.abs(d.progress - base) >= TAP_EPS) {
        turn(d.idx, d.progress, base, { sheet: st.sheet, half: st.half });
        return;
      }
      layout();
    }
    drain();
  };
  book.addEventListener('pointercancel', onAbort);
  book.addEventListener('pointerleave', onAbort);

  // native link / image drags would cancel the pointer stream mid-turn
  book.addEventListener('dragstart', (e) => { e.preventDefault(); });

  // The edge zones are aria-hidden duplicates of the labelled controls: a click
  // must never park focus on them.
  book.addEventListener('mousedown', (e) => {
    const t = e.target;
    if (t && t.classList && t.classList.contains('menubook-edge')) e.preventDefault();
  });

  // Exactly one click is swallowed after a real drag or swipe.
  book.addEventListener('click', (e) => {
    if (!st.swallowClick) return;
    st.swallowClick = false;
    clearTimeout(swallowTimer);
    e.preventDefault();
    e.stopPropagation();
  }, true);

  // Missing thumbnails fall back to the full photo (a photo added after the
  // thumbs were cut), then once to item.fallbackImage (error does not bubble: capture).
  book.addEventListener('error', (e) => {
    const img = e.target;
    if (!img || img.tagName !== 'IMG' || !img.classList.contains('menubook-thumb')) return;
    const full = img.getAttribute('data-full');
    if (full) {
      img.removeAttribute('data-full');
      img.src = full;
      return;
    }
    const fb = img.getAttribute('data-fallback');
    img.removeAttribute('data-fallback');
    if (fb) img.src = fb;
    else img.classList.add('is-broken');
  }, true);

  function addToCart(btn) {
    const item = rowItems[Number(btn.getAttribute('data-row'))];
    if (!item) return;
    const lang = Fx.getLang();
    // availability can change under an open page: trust the live menu, not the render
    let src = item;
    if (hasDB()) {
      const liveItem = getMenu().find((m) => String(m.id) === String(item.id));
      if (!liveItem || liveItem.available === false) { scheduleRebuild(); return; }
      src = liveItem;
    }
    const price = Number(src.price);
    if (!isFinite(price)) return;
    window.dispatchEvent(new CustomEvent('babkeOpenCustomizer', {
      detail: {
        id: src.id,
        name: pick(src.title, lang) || String(src.id),
        price,
        desc: pick(src.description, lang)
      }
    }));
  }

  book.addEventListener('click', (e) => {
    const t = e.target && e.target.closest ? e.target.closest('button, a') : null;
    if (!t || !book.contains(t)) return;
    if (t.classList.contains('menubook-edge')) {
      if (st.swallowClick) return;
      step(t.classList.contains('menubook-edge-next') ? 1 : -1);
    } else if (t.classList.contains('menubook-add')) {
      addToCart(t);
    } else if (t.classList.contains('menubook-open')) {
      step(1);
    } else if (t.classList.contains('menubook-tocover')) {
      jump(0);
    }
  });

  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));

  contents.addEventListener('click', (e) => {
    const b = e.target && e.target.closest ? e.target.closest('.menubook-chip') : null;
    if (!b) return;
    const c = chips[Number(b.getAttribute('data-chip'))];
    if (c) jump(c.page);
  });

  retryBtn.addEventListener('click', () => { load(true); });

  /* -------------------------------------------------------- keyboard */

  root.addEventListener('keydown', (e) => {
    if (!built || e.defaultPrevented) return;
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const k = e.key;
    if (k !== 'ArrowRight' && k !== 'ArrowLeft' && k !== 'Home' && k !== 'End') return;
    const t = e.target;
    if (t && t.closest && t.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
    if (document.querySelector('#cart-drawer.open, #customization-modal-overlay.open')) return;
    e.preventDefault();
    // screen terms: the book frame is LTR in every language
    if (k === 'ArrowRight') step(1);
    else if (k === 'ArrowLeft') step(-1);
    else if (k === 'Home') jump(0);
    else jump(pages.length - 1);
  });

  /* ---------------------------------------------------- layout mode */

  const mql = window.matchMedia ? window.matchMedia(SINGLE_MQ) : null;

  function applyMode() {
    const single = !!(mql && mql.matches);
    if (built) finishNow();
    st.single = single;
    root.dataset.mode = single ? 'single' : 'spread';
    updateTexts();
    if (!built) return;
    pinHalf();
    layout();
    updateChrome();
    updateFontSize();
  }

  if (mql) {
    if (mql.addEventListener) mql.addEventListener('change', applyMode);
    else if (mql.addListener) mql.addListener(applyMode);
  }

  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(() => updateFontSize()).observe(stage);
  } else {
    window.addEventListener('resize', updateFontSize);
  }

  /* --------------------------------------------------- build / load */

  function facingPageId() {
    if (!built || !pages.length) return null;
    const f = facing();
    const pg = pages[f[0]];
    return pg ? { id: pg.id, index: f[0] } : null;
  }

  function findPlace(keep) {
    if (!keep) return 0;
    let i = pages.findIndex((p) => p.id === keep.id);
    if (i >= 0) return i;
    const m = /^cat:(.*):(\d+)$/.exec(keep.id);
    if (m) {
      const catPages = [];
      pages.forEach((p, idx) => { if (p.type === 'category' && p.cat.id === m[1]) catPages.push(idx); });
      if (catPages.length) return catPages[Math.min(Number(m[2]), catPages.length - 1)];
    }
    return clamp(keep.index, 0, Math.max(0, pages.length - 1));
  }

  function rebuild() {
    const s = dbSettings() || lastSettings;
    if (!s) return;
    lastSettings = s;
    const lang = Fx.getLang();
    const menu = getMenu();

    if (s.enabled === false) {
      if (built) finishNow();
      setHidden(true);
      built = false;
      book.innerHTML = '';
      sheets = []; fronts = []; backs = []; leaves = []; pages = []; chips = [];
      lastSig = signature(s, menu, lang);
      return;
    }
    setHidden(false);

    const keep = facingPageId();
    if (built) finishNow();
    // a rebuild replaces the page DOM: keep keyboard users where they were
    const act = document.activeElement;
    const focusInBook = !!act && book.contains(act);
    const chipFocus = act && contents.contains(act) ? act.getAttribute('data-chip') : null;

    const res = buildPages(s, menu, lang);
    pages = res.list;
    lastSig = signature(s, menu, lang);
    updateTexts();

    if (!res.itemCount) {
      built = false;
      book.innerHTML = '';
      sheets = []; fronts = []; backs = []; leaves = []; chips = [];
      contents.innerHTML = '';
      setState('empty');
      return;
    }

    renderBook(s, lang);
    renderChips(lang);
    built = true;
    setState('ready');
    commitPage(findPlace(keep));
    updateFontSize();
    if (focusInBook) focusQuiet(book);
    else if (chipFocus != null) {
      const c = chips[Number(chipFocus)] || chips[0];
      if (c && c.el) focusQuiet(c.el);
    }
  }

  let rebuildTimer = 0;
  function scheduleRebuild() {
    if (!loaded) return;
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(rebuild, 0);
  }

  async function load(force) {
    if (loading) return;
    loading = true;
    setState('loading');
    try {
      if (hasDB() && typeof BabkeDB.init === 'function') {
        try { await BabkeDB.init(!!force); } catch (e) { /* store.js degrades to empty data */ }
      }
      let s = dbSettings();
      if (!s) {
        const r = await Fx.api('/api/menu-book');
        if (r.ok && isSettings(r.data)) {
          s = r.data;
        } else if (r.status === 404 || (r.ok && !isSettings(r.data))) {
          // no book configured on this server
          setHidden(true);
          return;
        } else {
          setState('error');
          return;
        }
      }
      lastSettings = s;
      loaded = true;
      rebuild();
    } finally {
      loading = false;
    }
  }

  window.addEventListener('babkeLangChanged', () => {
    if (!loaded) { updateTexts(); if (root.dataset.state !== 'ready') setState(root.dataset.state); return; }
    scheduleRebuild();
  });
  window.addEventListener('babkeMenuChanged', scheduleRebuild);
  window.addEventListener('babkeContentChanged', scheduleRebuild);
  window.addEventListener('babkeDataRefreshed', () => {
    if (!loaded) {
      // a background refetch succeeded while the book sat on its error state
      if (root.dataset.state === 'error' && !loading) load(false);
      return;
    }
    const s = dbSettings() || lastSettings;
    const sig = signature(s, getMenu(), Fx.getLang());
    if (sig !== lastSig) scheduleRebuild();
  });

  window.BabkeMenuBook = {
    rebuild() {
      if (loaded) rebuild();
      else load(true);
    },
    jumpToCategory(id) {
      if (!built) return false;
      const p = pages.findIndex((pg) => pg.type === 'category' && pg.cat.id === String(id));
      if (p < 0) return false;
      finishNow();
      jump(p);
      return true;
    }
  };

  applyMode();
  await load(false);
});
