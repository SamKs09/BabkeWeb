/* =====================================================================
   Babke landing: loyalty card ("Carte Babke"), web pass and /carte route.
   Exposes window.BabkeLoyalty = { open(), refresh(), getToken() }.
   Spec: section 5.1 + APPENDIX A. Styles: styles/loyalty.css (prefix loyalty-).
   Depends on window.BabkeFx (scripts/fx-core.js), which draws the QR codes
   through the vendored qrcode generator. Public API used: P1-P4.

   Security:
   - The card token lives only in localStorage['babke_loyalty_card'] and in
     the X-Babke-Card request header. It never goes into a URL, a QR code,
     the DOM or a log. The QR only carries the public card id
     ('babke:c:LC-XXXXXXXXXX', spec 0.3).
   - Every string placed in innerHTML goes through BabkeFx.esc(), including
     our own dictionary strings. Server error `message` fields are never
     rendered: the `error` code is mapped to LOYALTY_I18N instead.
   - Nothing of value is decided in the browser. Stamps, activation and
     rewards all happen at the counter, against the database.
   ===================================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  const root = document.getElementById('loyalty-root');
  if (!root) return;
  if (typeof BabkeFx === 'undefined') return;
  const Fx = BabkeFx;

  /* ---------- i18n (spec A.7: LOYALTY_I18N + the shared keys it uses) ---------- */

  const LOYALTY_I18N = {
    fr: {
      err_network: 'Impossible de joindre le restaurant. Vérifiez votre connexion.',
      err_rate: 'Trop de tentatives. Réessayez dans un moment.',
      err_generic: 'Une erreur est survenue. Réessayez.',
      err_name: 'Indiquez votre prénom.',
      err_phone: 'Entrez un numéro tunisien à 8 chiffres.',
      err_consent: 'Cochez la case pour continuer.',
      btn_retry: 'Réessayer',
      form_first_name: 'Prénom',
      form_phone: 'Numéro de téléphone',
      form_busy: 'Un instant…',
      how_title: 'Comment ça marche',
      step1: 'Créez votre carte avec votre prénom et votre numéro.',
      step2: 'Montrez le QR au comptoir : on active votre carte à votre prochaine commande.',
      step3: 'Un sceau par commande. Les récompenses se débloquent toutes seules.',
      tiers_title: 'Les récompenses',
      tier_row: '{n} sceaux',
      form_consent: "J'accepte que Babke conserve mon prénom et mon numéro pour gérer ma carte de fidélité.",
      form_submit: 'Obtenir ma carte',
      err_paused: 'Le programme de fidélité fait une petite pause.',
      card_placeholder_name: 'VOTRE PRÉNOM',
      status_pending: 'À activer au comptoir',
      pending_note: 'Montrez ce QR au comptoir lors de votre prochaine commande pour activer votre carte.',
      pending_bonus: 'Un sceau de bienvenue vous attend.',
      next_one: "Plus qu'un sceau pour : {reward}",
      next_many: 'Plus que {n} sceaux pour : {reward}',
      status_ready: 'Récompense prête : {reward}. Montrez votre carte au comptoir.',
      unlocked_title: 'Déjà débloqué',
      btn_open_pass: 'Ouvrir ma carte',
      btn_forget: 'Oublier cette carte sur cet appareil',
      confirm_forget: 'Retirer la carte de cet appareil ? Vos sceaux restent enregistrés au comptoir.',
      btn_refresh: 'Actualiser',
      pass_refreshing: 'Actualisation…',
      pass_tip_title: "Gardez-la sur votre écran d'accueil",
      pass_tip_ios: "Dans Safari, touchez Partager puis « Sur l'écran d'accueil ».",
      pass_tip_android: "Dans Chrome, ouvrez le menu ⋮ puis « Ajouter à l'écran d'accueil ».",
      pass_tip_other: 'Ajoutez cette page à vos favoris : le QR est votre carte.',
      pass_close: 'Fermer',
      aria_card: 'Carte de fidélité Babke, {n} sceaux sur {goal}',
      aria_qr: 'QR code de votre carte',
      // Extra key (not in A.7): card title fallback when P1 is unavailable.
      card_title: 'Carte Babke'
    },
    en: {
      err_network: "We couldn't reach the restaurant. Check your connection.",
      err_rate: 'Too many attempts. Try again in a moment.',
      err_generic: 'Something went wrong. Please try again.',
      err_name: 'Tell us your first name.',
      err_phone: 'Enter an 8-digit Tunisian number.',
      err_consent: 'Tick the box to continue.',
      btn_retry: 'Try again',
      form_first_name: 'First name',
      form_phone: 'Phone number',
      form_busy: 'One moment…',
      how_title: 'How it works',
      step1: 'Create your card with your first name and number.',
      step2: 'Show the QR at the counter: we activate your card with your next order.',
      step3: 'One seal per order. Rewards unlock on their own.',
      tiers_title: 'Rewards',
      tier_row: '{n} seals',
      form_consent: 'I agree that Babke keeps my first name and number to run my loyalty card.',
      form_submit: 'Get my card',
      err_paused: 'The loyalty programme is taking a short break.',
      card_placeholder_name: 'YOUR NAME',
      status_pending: 'Activate at the counter',
      pending_note: 'Show this QR at the counter with your next order to activate your card.',
      pending_bonus: 'A welcome seal is waiting for you.',
      next_one: 'One more seal for: {reward}',
      next_many: '{n} more seals for: {reward}',
      status_ready: 'Reward ready: {reward}. Show your card at the counter.',
      unlocked_title: 'Already unlocked',
      btn_open_pass: 'Open my card',
      btn_forget: 'Forget this card on this device',
      confirm_forget: 'Remove the card from this device? Your seals stay saved at the counter.',
      btn_refresh: 'Refresh',
      pass_refreshing: 'Refreshing…',
      pass_tip_title: 'Keep it on your home screen',
      pass_tip_ios: 'In Safari, tap Share, then "Add to Home Screen".',
      pass_tip_android: 'In Chrome, open the ⋮ menu, then "Add to Home screen".',
      pass_tip_other: 'Bookmark this page: the QR is your card.',
      pass_close: 'Close',
      aria_card: 'Babke loyalty card, {n} of {goal} seals',
      aria_qr: 'Your card QR code',
      card_title: 'Babke Card'
    },
    tn: {
      err_network: 'ما نجمناش نوصلو للمطعم. ثبّت في الكونكسيون.',
      err_rate: 'برشا محاولات. عاود بعد شوية.',
      err_generic: 'صار مشكل. عاود جرّب.',
      err_name: 'اكتب اسمك.',
      err_phone: 'اكتب نومرو تونسي بـ8 أرقام.',
      err_consent: 'علّم على الخانة باش تكمّل.',
      btn_retry: 'عاود',
      form_first_name: 'الاسم',
      form_phone: 'نومرو التليفون',
      form_busy: 'لحظة…',
      how_title: 'كيفاش تخدم',
      step1: 'اعمل الكارت متاعك باسمك و نومرو التليفون.',
      step2: 'ورّي الـQR في الكونتوار: نفعّلولك الكارت مع الكوموند الجاية.',
      step3: 'طابع على كل كوموند. الهدايا تتحلّ وحدها.',
      tiers_title: 'الهدايا',
      tier_row: '{n} طوابع',
      form_consent: 'نقبل إلي بابكي يخبّي اسمي و نومرويا باش يتصرّف في كارت الوفاء متاعي.',
      form_submit: 'خوذ الكارت متاعك',
      err_paused: 'برنامج الوفاء واقف شوية.',
      card_placeholder_name: 'إسمك',
      status_pending: 'فعّلها في الكونتوار',
      pending_note: 'ورّي هالـQR في الكونتوار مع الكوموند الجاية باش تتفعّل الكارت.',
      pending_bonus: 'طابع ترحيب يستنّى فيك.',
      next_one: 'باقي طابع واحد على: {reward}',
      next_many: 'باقي {n} طوابع على: {reward}',
      status_ready: 'الهدية واجدة: {reward}. ورّي الكارت في الكونتوار.',
      unlocked_title: 'تحلّت',
      btn_open_pass: 'حِلّ الكارت',
      btn_forget: 'انسى الكارت في هالتليفون',
      confirm_forget: 'نحّي الكارت من هالتليفون؟ الطوابع متاعك يقعدو مسجّلين في الكونتوار.',
      btn_refresh: 'حدّث',
      pass_refreshing: 'يتحدّث…',
      pass_tip_title: 'خلّيها في الشاشة الرئيسية',
      pass_tip_ios: 'في Safari، انزل على Partager و من بعد « Sur l\'écran d\'accueil ».',
      pass_tip_android: 'في Chrome، حِلّ القائمة ⋮ و من بعد « Ajouter à l\'écran d\'accueil ».',
      pass_tip_other: 'زيد الصفحة للمفضّلة: الـQR هو الكارت متاعك.',
      pass_close: 'سكّر',
      aria_card: 'كارت وفاء بابكي، {n} من {goal} طوابع',
      aria_qr: 'كود QR متاع الكارت',
      card_title: 'كارت بابكي'
    }
  };

  const T = (key, vars) => Fx.t(LOYALTY_I18N, key, vars);
  const E = (s) => Fx.esc(s);
  const L = (field) => Fx.loc(field);
  const reduced = () => Fx.reducedMotion();

  /* ---------- constants ---------- */

  const TOKEN_KEY = 'babke_loyalty_card';               // spec 0.4
  const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;               // 32 random bytes, base64url
  const CARD_ID_RE = /^LC-[A-Z0-9]{10}$/;               // same check as the admin scanner (A10)
  const CARTE_PATH = '/carte';
  const REFRESH_THROTTLE_MS = 20000;
  const DEFAULT_GOAL = 10;
  const MAX_SLOTS = 20;
  const STEP_NUMERALS = ['١', '٢', '٣'];

  // Filled seal: an 8-point khatam (two squares) in white, with an ember eye.
  // The seal is the Babke logo itself. It sits on the ember-red stamp disc, so
  // CSS renders it in solid white (see .loyalty-seal-mark in loyalty.css); the
  // PNG is transparent, which is what makes that work.
  const SEAL_SVG = '<img class="loyalty-seal-mark" src="assets/BabkeLogo.png" alt="" ' +
    'aria-hidden="true" draggable="false" decoding="async" loading="lazy">';
  // Locked QR placeholder: khatam outline with a keyhole.
  const LOCK_SVG = '<img class="loyalty-lock-mark" src="assets/BabkeLogo.png" alt="" aria-hidden="true" draggable="false" decoding="async">';
  const CLOSE_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" ' +
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  /* ---------- helpers ---------- */

  // Client mirror of server sanitizeName (spec 2.1). A regex literal with \p{..}
  // is a SyntaxError on very old engines, so it is compiled defensively.
  let NAME_RE = null;
  try { NAME_RE = new RegExp("^[\\p{L}\\p{M}][\\p{L}\\p{M} '’.\\-]{1,39}$", 'u'); } catch (e) { NAME_RE = null; }
  function sanitizeName(raw) {
    const s = String(raw == null ? '' : raw).replace(/[\u0000-\u001F\u007F]/g, '').trim().replace(/\s+/g, ' ');
    if (NAME_RE) return NAME_RE.test(s) ? s : null;
    return (s.length >= 2 && s.length <= 40 && !/[0-9<>{}[\]@#$%^&*=+|\\/:;"!?_~`]/.test(s)) ? s : null;
  }

  const intIn = (v, lo, hi, dflt) => (Number.isInteger(v) && v >= lo && v <= hi) ? v : dflt;

  function cleanLoc(v) {
    if (typeof v === 'string') return v;
    if (v && typeof v === 'object') {
      const o = {};
      ['fr', 'en', 'tn'].forEach((l) => { if (typeof v[l] === 'string') o[l] = v[l]; });
      return o;
    }
    return '';
  }

  // P1 programPublicView -> trusted shape (spec 3.2).
  function cleanProgram(d) {
    if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
    const tiers = (Array.isArray(d.tiers) ? d.tiers : [])
      .filter((t) => t && Number.isInteger(t.stamps) && t.stamps > 0)
      .map((t) => ({ id: String(t.id == null ? '' : t.id), stamps: t.stamps, reward: cleanLoc(t.reward) }))
      .sort((a, b) => a.stamps - b.stamps);
    return {
      active: d.active !== false,
      cardTitle: cleanLoc(d.cardTitle),
      stampRule: cleanLoc(d.stampRule),
      stampGoal: intIn(d.stampGoal, 1, 50, DEFAULT_GOAL),
      welcomeBonus: intIn(d.welcomeBonus, 0, 50, 0),
      tiers
    };
  }

  // P2 card / P3 cardView -> trusted shape (spec 3.2). Anything malformed is null.
  function cleanCard(d) {
    if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
    const cardId = typeof d.cardId === 'string' ? d.cardId : '';
    if (!CARD_ID_RE.test(cardId)) return null;
    const firstName = typeof d.firstName === 'string' ? d.firstName.slice(0, 60) : '';
    if (d.status === 'pending') return { cardId, status: 'pending', firstName };
    if (d.status !== 'active') return null;
    const stamps = intIn(d.stamps, 0, 1000000, 0);
    const tier = (t) => {
      if (!t || typeof t !== 'object' || !Number.isInteger(t.stamps)) return null;
      return {
        tierId: String(t.tierId == null ? '' : t.tierId),
        stamps: t.stamps,
        remaining: Number.isInteger(t.remaining) ? t.remaining : t.stamps - stamps,
        reward: cleanLoc(t.reward)
      };
    };
    return {
      cardId,
      status: 'active',
      firstName,
      stamps,
      stampGoal: intIn(d.stampGoal, 1, 50, 0) || null,
      nextReward: tier(d.nextReward),
      unlocked: (Array.isArray(d.unlocked) ? d.unlocked : []).map(tier).filter(Boolean)
    };
  }

  function readToken() {
    const v = Fx.store.get(TOKEN_KEY);
    if (typeof v === 'string' && TOKEN_RE.test(v)) return v;
    if (v != null) Fx.store.remove(TOKEN_KEY);   // corrupt value: drop it
    return null;
  }

  function errKey(r) {
    const code = r && r.data && typeof r.data.error === 'string' ? r.data.error : '';
    if (!r || r.status === 0 || code === 'network') return 'err_network';
    switch (code) {
      case 'invalid_phone': return 'err_phone';
      case 'invalid_name': return 'err_name';
      case 'consent_required': return 'err_consent';
      case 'loyalty_paused': return 'err_paused';
      case 'rate_limited': return 'err_rate';
      default: break;
    }
    if (r.status === 429) return 'err_rate';
    return 'err_generic';
  }

  // QR markup from BabkeFx.qrSvg (path data only, no untrusted text) + an escaped label.
  function qrMarkup(cardId, px) {
    if (!CARD_ID_RE.test(cardId)) return '';
    const svg = Fx.qrSvg('babke:c:' + cardId, px);
    if (!svg) return '';
    return svg.replace('<svg ', '<svg role="img" aria-label="' + E(T('aria_qr')) + '" ');
  }

  // Re-rendering must not steal focus or the caret from someone typing.
  function withFocusKept(container, fn) {
    const a = document.activeElement;
    let id = null, s = null, e = null;
    if (a && a.id && container.contains(a)) {
      id = a.id;
      try { s = a.selectionStart; e = a.selectionEnd; } catch (err) { s = null; }
    }
    fn();
    if (!id) return;
    const el = document.getElementById(id);
    if (!el || el === document.activeElement) return;
    try {
      el.focus({ preventScroll: true });
      if (s != null && typeof el.setSelectionRange === 'function') el.setSelectionRange(s, e);
    } catch (err) { /* ignore */ }
  }

  function focusEl(el) {
    if (!el) return;
    try { el.focus({ preventScroll: true }); } catch (e) { try { el.focus(); } catch (e2) { /* ignore */ } }
  }

  function scrollToSection(smooth) {
    const sec = document.getElementById('loyalty');
    if (!sec) return;
    const nav = document.querySelector('.navbar');
    const top = sec.getBoundingClientRect().top + (window.pageYOffset || 0) - (nav ? nav.offsetHeight : 0);
    // main.css sets html{scroll-behavior:smooth}, so 'auto' would still animate: ask for 'instant'.
    const behavior = smooth && !reduced() ? 'smooth' : 'instant';
    try { window.scrollTo({ top: Math.max(0, top), behavior }); } catch (e) { window.scrollTo(0, Math.max(0, top)); }
  }

  function detectOS() {
    const ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    return 'other';
  }

  const standaloneMql = (() => {
    try { return window.matchMedia ? window.matchMedia('(display-mode: standalone)') : null; } catch (e) { return null; }
  })();
  const isStandalone = () => !!(standaloneMql && standaloneMql.matches) || navigator.standalone === true;

  const finePointerMql = (() => {
    try { return window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)') : null; } catch (e) { return null; }
  })();

  /* ---------- state ---------- */

  const state = {
    token: readToken(),
    program: null,                 // cleaned P1 view
    programStatus: 'loading',      // loading | ok | error
    pausedByServer: false,         // P2 answered loyalty_paused although P1 said active
    card: null,                    // cleaned P2/P3 card view
    cardStatus: 'none',            // none | loading | ok | error
    lastCardFetch: 0,
    lastProgramFetch: 0,
    formBusy: false,
    formError: '',                 // i18n key
    draft: { firstName: '', phone: '', consent: false },
    forgetBusy: false,
    forgetError: ''                // i18n key
  };
  if (state.token) state.cardStatus = 'loading';

  // Stamp "press": slots that became filled since the previous render of a card.
  // One generation per balance change; each surface (section, pass) plays it once.
  // The first paint of a card id is the baseline, so a reload with an unchanged balance does not press.
  const seenStamps = new Map();    // cardId -> stamps last painted
  const press = { gen: 0, cardId: null, from: 0, to: 0 };
  const pressConsumed = { section: 0, pass: 0 };

  function setCard(c) {
    const n = c.status === 'active' ? c.stamps : 0;
    const prev = seenStamps.has(c.cardId) ? seenStamps.get(c.cardId) : n;
    if (n > prev) {
      press.gen += 1;
      press.cardId = c.cardId;
      press.from = Math.min(prev, MAX_SLOTS);
      press.to = Math.min(n, MAX_SLOTS);
    }
    seenStamps.set(c.cardId, n);
    state.card = c;
  }

  function takePress(surface, d) {
    if (!d.active || reduced() || !press.gen) return null;
    if (press.cardId !== d.c.cardId || pressConsumed[surface] === press.gen) return null;
    pressConsumed[surface] = press.gen;
    return press;
  }

  function dropToken() {
    state.token = null;
    Fx.store.remove(TOKEN_KEY);
    state.card = null;
    state.cardStatus = 'none';
    state.forgetError = '';
    if (pass.open) closePass(false);
  }

  /* ---------- derived view ---------- */

  function derive() {
    const p = state.program;
    const c = state.card;
    const active = !!(c && c.status === 'active');
    const pending = !!(c && c.status === 'pending');
    const goal = (active && c.stampGoal) || (p && p.stampGoal) || DEFAULT_GOAL;
    const stamps = active ? c.stamps : 0;
    let tiers = p ? p.tiers : [];
    if (!p && active) {
      const byStamps = new Map();
      c.unlocked.concat(c.nextReward ? [c.nextReward] : []).forEach((t) => byStamps.set(t.stamps, t));
      tiers = Array.from(byStamps.values()).sort((a, b) => a.stamps - b.stamps);
    }
    const paused = state.pausedByServer || !!(p && !p.active);
    const cardLoading = !!state.token && !c && state.cardStatus === 'loading';
    const cardFailed = !!state.token && !c && state.cardStatus === 'error';
    const programLoading = !p && state.programStatus === 'loading';
    return {
      p, c, active, pending, goal, stamps, tiers, paused,
      loading: cardLoading || (!state.token && programLoading),
      cardFailed,
      title: (p && L(p.cardTitle)) || T('card_title'),
      status: statusText(p, c, active, pending)
    };
  }

  function statusText(p, c, active, pending) {
    if (active) {
      if (c.nextReward) {
        const rem = Math.max(1, c.nextReward.remaining);
        return rem === 1
          ? T('next_one', { reward: L(c.nextReward.reward) })
          : T('next_many', { n: rem, reward: L(c.nextReward.reward) });
      }
      if (c.unlocked.length) {
        const top = c.unlocked.reduce((a, b) => (b.stamps > a.stamps ? b : a));
        return T('status_ready', { reward: L(top.reward) });
      }
      return p ? L(p.stampRule) : '';
    }
    if (pending) {
      let s = T('pending_note');
      if (p && p.welcomeBonus >= 1) s += ' ' + T('pending_bonus');
      return s;
    }
    return p ? L(p.stampRule) : '';
  }

  /* ---------- markup: the card ---------- */

  function cardHtml(d, surface) {
    const count = Math.max(d.goal, Math.min(d.stamps, MAX_SLOTS));
    const dense = count > 10;
    const tierSet = new Set(d.tiers.map((t) => t.stamps));
    const pr = takePress(surface, d);
    let slots = '';
    let ordinal = 0;
    for (let i = 0; i < count; i++) {
      const filled = i < d.stamps;
      let cls = 'loyalty-stamp';
      let style = '';
      if (tierSet.has(i + 1)) cls += ' is-tier';
      if (d.loading || d.cardFailed) style = ' style="--s:' + i + '"';
      if (filled) {
        cls += ' filled';
        if (pr && i >= pr.from && i < pr.to) { cls += ' is-new'; style = ' style="--i:' + (ordinal++) + '"'; }
      }
      slots += '<span class="' + cls + '"' + style + '>' + (filled ? SEAL_SVG : String(i + 1)) + '</span>';
    }

    const states = ['loyalty-card'];
    if (d.loading) states.push('is-loading');
    if (d.cardFailed) states.push('is-stalled');
    if (d.pending) states.push('is-pending');
    if (d.active) states.push('is-active');
    if (!d.c) states.push('is-empty');

    let name;
    if (d.c && d.c.firstName) name = '<div class="loyalty-card-name" dir="auto">' + E(d.c.firstName) + '</div>';
    else if (d.loading || d.cardFailed) name = '<div class="loyalty-card-name is-skeleton" aria-hidden="true">&nbsp;</div>';
    else name = '<div class="loyalty-card-name is-placeholder">' + E(T('card_placeholder_name')) + '</div>';

    let qr = '';
    if (surface === 'section') {
      const svg = d.c ? qrMarkup(d.c.cardId, 88) : '';
      qr = svg
        ? '<div class="loyalty-qr">' + svg + '</div>'
        : '<div class="loyalty-qr is-locked" aria-hidden="true">' + LOCK_SVG + '</div>';
    }

    const aria = T('aria_card', { n: d.stamps, goal: d.goal });
    return '<div class="' + states.join(' ') + '" role="img" aria-label="' + E(aria) + '">' +
      '<div class="loyalty-card-head">' +
        '<img class="loyalty-card-logo" src="assets/BabkeLogo.png" alt="" decoding="async">' +
        '<span class="loyalty-card-chip">' + E(d.title) + '</span>' +
      '</div>' +
      '<div class="loyalty-card-body' + (qr ? '' : ' no-qr') + '">' +
        '<div class="loyalty-card-main">' + name +
          '<div class="loyalty-stamps' + (dense ? ' is-dense' : '') + '"' +
            (dense ? ' style="--loyalty-cols:' + Math.ceil(count / 2) + '"' : '') + '>' + slots + '</div>' +
        '</div>' + qr +
      '</div>' +
      '<div class="loyalty-card-foot"><p class="loyalty-card-status">' + E(d.status) + '</p></div>' +
      (d.pending ? '<div class="loyalty-card-ribbon">' + E(T('status_pending')) + '</div>' : '') +
    '</div>';
  }

  /* ---------- markup: the copy column ---------- */

  function howHtml() {
    let steps = '';
    for (let i = 0; i < 3; i++) {
      steps += '<li class="loyalty-step"><span class="loyalty-step-num" aria-hidden="true">' + STEP_NUMERALS[i] +
        '</span><span class="loyalty-step-text">' + E(T('step' + (i + 1))) + '</span></li>';
    }
    return '<div class="loyalty-how"><h3 class="loyalty-block-title">' + E(T('how_title')) + '</h3>' +
      '<ol class="loyalty-steps">' + steps + '</ol></div>';
  }

  function tiersHtml(d) {
    let body;
    if (!d.p && state.programStatus === 'loading') {
      body = '<ul class="loyalty-tier-list is-loading" aria-hidden="true">' +
        '<li class="loyalty-tier"><span class="loyalty-skel"></span></li>' +
        '<li class="loyalty-tier"><span class="loyalty-skel"></span></li></ul>';
    } else if (!d.p && state.programStatus === 'error') {
      body = '<div class="loyalty-load-error"><p class="loyalty-error" role="alert">' + E(T('err_network')) + '</p>' +
        '<button type="button" class="btn-secondary-dark loyalty-retry" id="loyalty-retry" data-action="retry">' +
        E(T('btn_retry')) + '</button></div>';
    } else {
      const reached = d.active ? d.stamps : -1;
      const nextId = d.active && d.c.nextReward ? d.c.nextReward.tierId : null;
      body = '<ul class="loyalty-tier-list">' + d.tiers.map((t) => {
        let cls = 'loyalty-tier';
        if (d.active && t.stamps <= reached) cls += ' is-reached';
        if (nextId && (t.id === nextId || t.tierId === nextId)) cls += ' is-next';
        return '<li class="' + cls + '"><span class="loyalty-tier-seal" aria-hidden="true">' + SEAL_SVG + '</span>' +
          '<span class="loyalty-tier-count">' + E(T('tier_row', { n: t.stamps })) + '</span>' +
          '<span class="loyalty-tier-reward">' + E(L(t.reward)) + '</span></li>';
      }).join('') + '</ul>';
      const rule = d.p ? L(d.p.stampRule) : '';
      if (rule) body += '<p class="loyalty-rule">' + E(rule) + '</p>';
    }
    return '<div class="loyalty-tiers"><h3 class="loyalty-block-title">' + E(T('tiers_title')) + '</h3>' + body + '</div>';
  }

  function unlockedHtml(d) {
    if (!d.active || !d.c.nextReward || !d.c.unlocked.length) return '';
    return '<div class="loyalty-unlocked"><h4 class="loyalty-unlocked-title">' + E(T('unlocked_title')) + '</h4>' +
      '<ul class="loyalty-chips">' + d.c.unlocked.map((u) =>
        '<li class="loyalty-chip"><span class="loyalty-chip-seal" aria-hidden="true">' + SEAL_SVG + '</span>' +
        E(L(u.reward)) + '</li>').join('') + '</ul></div>';
  }

  function pausedHtml() {
    return '<div class="loyalty-paused" role="status"><span class="loyalty-paused-mark" aria-hidden="true">' +
      LOCK_SVG + '</span><p>' + E(T('err_paused')) + '</p></div>';
  }

  function formHtml() {
    const dr = state.draft;
    const busy = state.formBusy;
    return '<form class="loyalty-form glass-card" novalidate' + (busy ? ' aria-busy="true"' : '') + '>' +
      '<div class="loyalty-field">' +
        '<label for="loyalty-first-name">' + E(T('form_first_name')) + '</label>' +
        '<input class="loyalty-input" id="loyalty-first-name" name="firstName" type="text" dir="auto" ' +
          'autocomplete="given-name" maxlength="40" required value="' + E(dr.firstName) + '">' +
      '</div>' +
      '<div class="loyalty-field">' +
        '<label for="loyalty-phone">' + E(T('form_phone')) + '</label>' +
        '<div class="loyalty-phone-field" dir="ltr">' +
          '<span class="loyalty-phone-prefix" id="loyalty-phone-prefix">+216</span>' +
          '<input class="loyalty-input" id="loyalty-phone" name="phone" type="tel" inputmode="tel" ' +
            'autocomplete="tel-national" placeholder="20 123 456" dir="ltr" maxlength="20" required ' +
            'aria-describedby="loyalty-phone-prefix" value="' + E(dr.phone) + '">' +
        '</div>' +
      '</div>' +
      '<label class="loyalty-consent" for="loyalty-consent">' +
        '<input type="checkbox" id="loyalty-consent" name="consent"' + (dr.consent ? ' checked' : '') + '>' +
        '<span>' + E(T('form_consent')) + '</span>' +
      '</label>' +
      '<div class="loyalty-submit-row">' +
        '<p class="loyalty-error" id="loyalty-form-error" role="alert">' + (state.formError ? E(T(state.formError)) : '') + '</p>' +
        '<button type="submit" class="btn-primary-food loyalty-submit" id="loyalty-submit"' + (busy ? ' disabled' : '') + '>' +
          E(T(busy ? 'form_busy' : 'form_submit')) + '</button>' +
      '</div>' +
    '</form>';
  }

  function actionsHtml(d) {
    let note;
    if (d.c) note = '<p class="loyalty-note">' + E(d.status) + '</p>';
    else if (d.cardFailed) note = '';
    else note = '<p class="loyalty-note is-skeleton" aria-hidden="true"><span class="loyalty-skel"></span><span class="loyalty-skel is-short"></span></p>';
    const failed = d.cardFailed
      ? '<div class="loyalty-load-error"><p class="loyalty-error" role="alert">' + E(T('err_network')) + '</p>' +
        '<button type="button" class="btn-secondary-dark loyalty-retry" id="loyalty-retry" data-action="retry">' +
        E(T('btn_retry')) + '</button></div>'
      : '';
    const openDisabled = d.c ? '' : ' disabled';
    return '<div class="loyalty-actions glass-card">' + note + failed +
      '<button type="button" class="btn-primary-food loyalty-open" id="loyalty-open-pass" data-action="open-pass"' +
        openDisabled + '>' + E(T('btn_open_pass')) + '</button>' +
      '<button type="button" class="loyalty-forget" id="loyalty-forget" data-action="forget"' +
        (state.forgetBusy ? ' aria-disabled="true"' : '') + '>' +
        E(T(state.forgetBusy ? 'form_busy' : 'btn_forget')) + '</button>' +
      '<p class="loyalty-error" role="alert">' + (state.forgetError ? E(T(state.forgetError)) : '') + '</p>' +
    '</div>';
  }

  function copyHtml(d) {
    let tail = '';
    if (d.paused) tail += pausedHtml();
    if (state.token) tail += actionsHtml(d);
    else if (!d.paused) tail += formHtml();
    return howHtml() + tiersHtml(d) + unlockedHtml(d) + tail;
  }

  /* ---------- section skeleton + render ---------- */

  root.innerHTML = '<div class="loyalty-container">' +
    '<div class="loyalty-card-stage"></div><div class="loyalty-copy"></div></div>';
  const stageEl = root.querySelector('.loyalty-card-stage');
  const copyEl = root.querySelector('.loyalty-copy');

  function render() {
    const d = derive();
    withFocusKept(root, () => {
      stageEl.innerHTML = cardHtml(d, 'section');
      copyEl.innerHTML = copyHtml(d);
    });
    root.setAttribute('aria-busy', d.loading || (!d.p && state.programStatus === 'loading') ? 'true' : 'false');
    bindTilt(stageEl.querySelector('.loyalty-card'));
    if (pass.open) renderPass();
  }

  /* ---------- entrance + tilt ---------- */

  // The card rises out of the embers once, on reveal (CSS keyframe loyaltyCardIn).
  // .is-settled stops it from replaying when the card is re-rendered.
  const settle = () => stageEl.classList.add('is-settled');
  stageEl.addEventListener('animationend', (e) => { if (e.animationName === 'loyaltyCardIn') settle(); });
  if (reduced()) settle();
  if (typeof MutationObserver === 'function') {
    const mo = new MutationObserver(() => {
      if (!stageEl.classList.contains('fx-in')) return;
      mo.disconnect();
      const delay = parseFloat(stageEl.style.getPropertyValue('--fx-delay')) || 0;
      setTimeout(settle, delay + 1400);   // safety net if animationend never fires
    });
    mo.observe(stageEl, { attributes: true, attributeFilter: ['class'] });
  }

  function bindTilt(card) {
    if (!card) return;
    let frame = 0, px = 0.5, py = 0.5;
    card.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      if (!finePointerMql || !finePointerMql.matches || reduced()) return;
      const r = card.getBoundingClientRect();
      if (!r.width || !r.height) return;
      px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        card.style.transition = '';
        card.style.transform = 'rotate(var(--loyalty-rest)) rotateX(' + (-(py - 0.5) * 12).toFixed(2) +
          'deg) rotateY(' + ((px - 0.5) * 14).toFixed(2) + 'deg)';
      });
    });
    card.addEventListener('pointerleave', () => {
      if (frame) { cancelAnimationFrame(frame); frame = 0; }
      if (!card.style.transform) return;
      card.style.transition = 'transform .8s cubic-bezier(0.34,1.56,0.64,1)';
      card.style.transform = '';
    });
  }

  Fx.onReducedMotionChange((isReduced) => {
    if (!isReduced) return;
    settle();
    const card = stageEl.querySelector('.loyalty-card');
    if (card) { card.style.transform = ''; card.style.transition = ''; }
  });

  /* ---------- data ---------- */

  let programSeq = 0;
  let cardSeq = 0;

  async function loadProgram() {
    const seq = ++programSeq;
    state.lastProgramFetch = Date.now();
    if (!state.program) state.programStatus = 'loading';
    const r = await Fx.api('/api/loyalty/program');
    if (seq !== programSeq) return;
    const p = r.ok ? cleanProgram(r.data) : null;
    if (p) {
      state.program = p;
      state.programStatus = 'ok';
      if (p.active) state.pausedByServer = false;
    } else if (!state.program) {
      state.programStatus = 'error';
    }
  }

  // Returns { ok, err } where err is an i18n key. Stale replies are ignored.
  async function loadCard() {
    const tok = state.token;
    if (!tok) { state.card = null; state.cardStatus = 'none'; return { ok: true }; }
    const seq = ++cardSeq;
    state.lastCardFetch = Date.now();
    if (!state.card) state.cardStatus = 'loading';
    const r = await Fx.api('/api/loyalty/card', { headers: { 'X-Babke-Card': tok } });
    if (seq !== cardSeq || state.token !== tok) return { ok: false, stale: true };
    if (r.ok) {
      const c = cleanCard(r.data);
      if (c) { setCard(c); state.cardStatus = 'ok'; return { ok: true }; }
      if (!state.card) state.cardStatus = 'error';
      return { ok: false, err: 'err_generic' };
    }
    if (r.status === 404 || r.status === 401) {   // unknown, revoked or malformed: forget silently
      dropToken();
      return { ok: true, dropped: true };
    }
    if (!state.card) state.cardStatus = 'error';
    return { ok: false, err: errKey(r) };
  }

  let loadRun = 0;
  async function load() {
    const run = ++loadRun;
    render();
    const res = await Promise.all([loadProgram(), loadCard()]);
    if (run === loadRun) render();
    return res[1];
  }

  function maybeRefresh() {
    const now = Date.now();
    const jobs = [];
    if (state.token && now - state.lastCardFetch >= REFRESH_THROTTLE_MS) jobs.push(loadCard());
    // P1 too, so a page opened while the program was paused picks up a resume (and tier edits).
    if (now - state.lastProgramFetch >= REFRESH_THROTTLE_MS) jobs.push(loadProgram());
    if (jobs.length) Promise.all(jobs).then(render);
  }

  /* ---------- enroll ---------- */

  function formEls() {
    const form = copyEl.querySelector('.loyalty-form');
    if (!form) return null;
    return {
      form,
      name: form.querySelector('#loyalty-first-name'),
      phone: form.querySelector('#loyalty-phone'),
      consent: form.querySelector('#loyalty-consent'),
      error: form.querySelector('#loyalty-form-error'),
      submit: form.querySelector('#loyalty-submit')
    };
  }

  function setFormError(key, field) {
    state.formError = key || '';
    const f = formEls();
    if (!f) return;
    [f.name, f.phone, f.consent].forEach((el) => {
      if (el) el.removeAttribute('aria-invalid');
    });
    if (field) {
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-errormessage', 'loyalty-form-error');
    }
    if (f.error) f.error.textContent = key ? T(key) : '';
  }

  function setFormBusy(busy) {
    state.formBusy = busy;
    const f = formEls();
    if (!f || !f.submit) return;
    f.submit.disabled = busy;
    f.submit.textContent = T(busy ? 'form_busy' : 'form_submit');
    if (busy) f.form.setAttribute('aria-busy', 'true'); else f.form.removeAttribute('aria-busy');
  }

  let submitting = false;
  async function submitEnroll() {
    if (submitting || state.formBusy) return;
    const f = formEls();
    if (!f) return;
    state.draft = { firstName: f.name.value, phone: f.phone.value, consent: f.consent.checked };

    const firstName = sanitizeName(f.name.value);
    if (!firstName) { setFormError('err_name', f.name); focusEl(f.name); return; }
    const phone = Fx.normalizePhone(f.phone.value);
    if (!phone) { setFormError('err_phone', f.phone); focusEl(f.phone); return; }
    if (!f.consent.checked) { setFormError('err_consent', f.consent); focusEl(f.consent); return; }

    submitting = true;
    setFormError('');
    setFormBusy(true);
    const r = await Fx.api('/api/loyalty/enroll', {
      method: 'POST',
      body: { phone, firstName, consent: true, lang: Fx.getLang() }
    });
    submitting = false;
    setFormBusy(false);

    if (r.ok) {
      const tok = r.data && r.data.cardToken;
      const c = cleanCard(r.data && r.data.card);
      if (typeof tok === 'string' && TOKEN_RE.test(tok) && c) {
        state.token = tok;
        Fx.store.set(TOKEN_KEY, tok);
        cardSeq++;                       // any in-flight read for an older token is now stale
        setCard(c);
        state.cardStatus = 'ok';
        state.lastCardFetch = Date.now();
        state.draft = { firstName: '', phone: '', consent: false };
        state.formError = '';
        render();
        focusEl(copyEl.querySelector('#loyalty-open-pass'));
        return;
      }
      setFormError('err_generic');
      return;
    }

    const key = errKey(r);
    if (key === 'err_paused') {
      state.pausedByServer = true;
      state.formError = '';
      render();
      return;
    }
    const again = formEls();
    if (!again) return;
    const field = key === 'err_name' ? again.name : key === 'err_phone' ? again.phone : key === 'err_consent' ? again.consent : null;
    setFormError(key, field);
    focusEl(field || again.submit);
  }

  /* ---------- forget ---------- */

  async function forgetCard() {
    if (state.forgetBusy || !state.token) return;
    let ok = false;
    try { ok = window.confirm(T('confirm_forget')); } catch (e) { ok = false; }
    if (!ok) return;
    const tok = state.token;
    state.forgetBusy = true;
    state.forgetError = '';
    render();
    const r = await Fx.api('/api/loyalty/card', { method: 'DELETE', headers: { 'X-Babke-Card': tok } });
    state.forgetBusy = false;
    if (state.token !== tok) { render(); return; }   // changed in another tab meanwhile
    if (r.ok || r.status === 404 || r.status === 401) {
      dropToken();
      render();
      focusEl(copyEl.querySelector('#loyalty-first-name'));
      maybeRefresh();   // throttled P1: form vs paused notice now depends on the current program
      return;
    }
    state.forgetError = errKey(r);
    render();
    focusEl(copyEl.querySelector('#loyalty-forget'));
  }

  /* ---------- pass overlay + /carte ---------- */

  const pass = { el: null, open: false, history: 'none', release: null, busy: false, error: '', returnId: null };

  function preloaderActive() {
    const p = document.getElementById('cinematic-preloader');
    return !!(p && p.style.opacity !== '0');
  }

  function ensurePassEl() {
    if (pass.el) return pass.el;
    const el = document.createElement('div');
    el.className = 'loyalty-pass';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'loyalty-pass-title');
    el.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn || !el.contains(btn)) return;
      if (btn.dataset.action === 'close-pass') closePass(false);
      else if (btn.dataset.action === 'refresh-pass') refreshFromPass();
    });
    document.body.appendChild(el);
    pass.el = el;
    return el;
  }

  function passHtml() {
    const d = derive();
    const svg = d.c ? qrMarkup(d.c.cardId, 220) : '';
    const qrBox = svg
      ? '<div class="loyalty-pass-qr">' + svg + '</div>'
      : '<div class="loyalty-pass-qr is-placeholder' + (d.loading ? ' is-loading' : '') + '" aria-hidden="true">' + LOCK_SVG + '</div>';
    const status = d.c ? d.status : '';
    const tip = isStandalone() ? '' :
      '<div class="loyalty-pass-tip glass-card"><h3 class="loyalty-pass-tip-title">' + E(T('pass_tip_title')) + '</h3>' +
      '<p>' + E(T('pass_tip_' + detectOS())) + '</p></div>';
    const errKeyNow = pass.error || (d.cardFailed ? 'err_network' : '');
    return '<button type="button" class="loyalty-pass-close" id="loyalty-pass-close" data-action="close-pass" ' +
        'aria-label="' + E(T('pass_close')) + '" title="' + E(T('pass_close')) + '">' + CLOSE_SVG + '</button>' +
      '<div class="loyalty-pass-inner">' +
        '<h2 class="loyalty-pass-title" id="loyalty-pass-title">' + E(d.title) + '</h2>' +
        cardHtml(d, 'pass') +
        qrBox +
        (d.c ? '<p class="loyalty-pass-id" dir="ltr">' + E(d.c.cardId) + '</p>' : '') +
        '<p class="loyalty-pass-status">' + E(status) + '</p>' +
        '<button type="button" class="btn-secondary-dark loyalty-pass-refresh" id="loyalty-pass-refresh" data-action="refresh-pass"' +
          (pass.busy ? ' aria-disabled="true"' : '') + '>' + E(T(pass.busy ? 'pass_refreshing' : 'btn_refresh')) + '</button>' +
        '<p class="loyalty-error" role="alert">' + (errKeyNow ? E(T(errKeyNow)) : '') + '</p>' +
        tip +
      '</div>';
  }

  function renderPass() {
    if (!pass.el) return;
    withFocusKept(pass.el, () => { pass.el.innerHTML = passHtml(); });
  }

  function openPass(mode) {
    if (!state.token) { scrollToSection(true); focusEl(copyEl.querySelector('#loyalty-first-name')); return; }
    ensurePassEl();
    if (mode === 'push') {
      if (location.pathname !== CARTE_PATH) {
        try { history.pushState({ loyaltyPass: 1 }, '', CARTE_PATH); } catch (e) { /* ignore */ }
      }
      pass.history = 'push';
    } else if (mode === 'direct') {
      pass.history = 'direct';
    } else if (mode === 'pop') {
      pass.history = 'push';
    }
    if (pass.open) { renderPass(); return; }
    pass.open = true;
    pass.error = '';
    // The section re-renders while the pass is open, so remember the opener by id, not by node.
    const opener = document.activeElement;
    pass.returnId = opener && opener.id && root.contains(opener) ? opener.id : null;
    renderPass();
    pass.el.classList.add('open');
    Fx.lockScroll();
    pass.release = Fx.trapFocus(pass.el);
    if (preloaderActive()) {
      // preloader.js clears body overflow when it finishes; keep the page locked under the pass.
      [3400, 4600].forEach((ms) => setTimeout(() => { if (pass.open) document.body.style.overflow = 'hidden'; }, ms));
    }
    if (mode !== 'direct') maybeRefresh();   // on a direct /carte load the boot load() fetches P3
  }

  function closePass(fromPop) {
    if (!pass.open) return;
    pass.open = false;
    pass.busy = false;
    pass.el.classList.remove('open');
    Fx.unlockScroll();
    if (preloaderActive()) document.body.style.overflow = 'hidden';
    const rel = pass.release;
    pass.release = null;
    if (rel) rel();
    const active = document.activeElement;
    if (pass.returnId && (!active || active === document.body || pass.el.contains(active))) {
      focusEl(document.getElementById(pass.returnId));
    }
    pass.returnId = null;
    const how = pass.history;
    pass.history = 'none';
    if (fromPop) return;
    if (how === 'direct') {
      try { history.replaceState(null, '', '/#loyalty'); } catch (e) { /* ignore */ }
      scrollToSection(false);
    } else if (how === 'push' && location.pathname === CARTE_PATH) {
      history.back();
    }
  }

  async function refreshFromPass() {
    if (pass.busy) return;
    pass.busy = true;
    pass.error = '';
    renderPass();
    const res = await loadCard();
    pass.busy = false;
    pass.error = res && !res.ok && res.err ? res.err : '';
    render();   // re-renders the section and, while it is open, the pass
  }

  /* ---------- events ---------- */

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn || !root.contains(btn)) return;
    const action = btn.dataset.action;
    if (action === 'open-pass') { e.preventDefault(); if (!btn.disabled) openPass('push'); }
    else if (action === 'forget') { e.preventDefault(); forgetCard(); }
    else if (action === 'retry') { e.preventDefault(); load(); }
  });

  root.addEventListener('submit', (e) => {
    if (!e.target.closest || !e.target.closest('.loyalty-form')) return;
    e.preventDefault();
    submitEnroll();
  });

  root.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'loyalty-first-name') state.draft.firstName = t.value;
    else if (t.id === 'loyalty-phone') state.draft.phone = t.value;
    else return;
    if (t.getAttribute('aria-invalid') === 'true') setFormError('');
  });

  root.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id !== 'loyalty-consent') return;
    state.draft.consent = t.checked;
    if (t.checked && state.formError === 'err_consent') setFormError('');
  });

  document.addEventListener('keydown', (e) => {
    if (pass.open && (e.key === 'Escape' || e.key === 'Esc')) { e.preventDefault(); closePass(false); }
  });

  window.addEventListener('popstate', () => {
    if (location.pathname === CARTE_PATH) {
      if (state.token) { if (!pass.open) openPass('pop'); }
      else { try { history.replaceState(null, '', '/#loyalty'); } catch (e) { /* ignore */ } scrollToSection(false); }
    } else if (pass.open) {
      closePass(true);
    }
  });

  window.addEventListener('focus', maybeRefresh);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') maybeRefresh(); });

  // Cross-tab sync (spec 5.1 data flow 4).
  window.addEventListener('storage', (e) => {
    if (e.key !== null && e.key !== TOKEN_KEY) return;
    const tok = readToken();
    if (tok === state.token) return;
    state.token = tok;
    state.card = null;
    state.cardStatus = tok ? 'loading' : 'none';
    state.forgetError = '';
    cardSeq++;
    if (!tok && pass.open) closePass(false);
    load();
  });

  window.addEventListener('babkeLangChanged', () => render());

  if (standaloneMql) {
    const onStandalone = () => { if (pass.open) renderPass(); };
    if (standaloneMql.addEventListener) standaloneMql.addEventListener('change', onStandalone);
    else if (standaloneMql.addListener) standaloneMql.addListener(onStandalone);
  }

  /* ---------- public API (before the first await) ---------- */

  window.BabkeLoyalty = {
    open() { openPass('push'); },
    refresh() { return load(); },
    getToken() { return state.token; }
  };

  /* ---------- boot ---------- */

  Fx.reveal([stageEl, copyEl], { stagger: 90 });

  let scrollAfterLoad = false;
  if (location.pathname === CARTE_PATH) {
    if (state.token) openPass('direct');
    else {
      try { history.replaceState(null, '', '/#loyalty'); } catch (e) { /* ignore */ }
      scrollAfterLoad = true;
    }
  }

  await load();

  if (scrollAfterLoad) {
    // Sections above render asynchronously; re-aim once more unless the visitor has moved.
    let moved = false;
    const mark = () => { moved = true; };
    ['wheel', 'touchstart', 'keydown'].forEach((ev) => window.addEventListener(ev, mark, { once: true, passive: true }));
    scrollToSection(false);
    setTimeout(() => { if (!moved) scrollToSection(false); }, 3400);
  }
  if (pass.open && !state.token) closePass(false);
});
