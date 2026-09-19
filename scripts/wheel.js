/* =====================================================================
   Babke landing: "La Roue Babke", the prize wheel (#wheel-root).
   Exposes window.BabkeWheel = { refresh() }. Classic deferred script,
   no build step, no GSAP: motion is BabkeFx.tween / BabkeFx.bezier / WAAPI.

   COMPLIANCE (carried from the source, keep this note): nothing in this flow
   may mention Google, mention reviews or ask for a review in exchange for the
   prize, and the prize is never conditioned on anything the customer has to
   do first. The game is free with no purchase required.

   Trust model: the client NEVER decides the prize. It posts to
   /api/wheel/play, receives { segmentIndex, segmentId, result, prize } and
   only animates to that wedge. Labels are admin-editable: every string that
   reaches innerHTML goes through BabkeFx.esc. Server `message` fields are
   never rendered; `error` codes are mapped to this file's dictionary.
   ===================================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  const root = document.getElementById('wheel-root');
  if (!root) return;
  if (typeof BabkeFx === 'undefined') return;
  const Fx = BabkeFx;

  /* ------------------------------------------------------------------
     Dictionary (spec A.7: WHEEL_I18N + the shared keys it uses)
     ------------------------------------------------------------------ */
  const WHEEL_I18N = {
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
      form_title: 'Votre tour gratuit',
      form_consent: "J'accepte que Babke conserve mon prénom et mon numéro pour gérer mon lot.",
      form_submit: 'Tourner la roue',
      spinning_title: 'Ça tourne…',
      spinning_body: 'La braise choisit votre lot.',
      win_eyebrow: 'Bravo {name} !',
      win_code_label: 'Votre code',
      win_valid_until: "Valable jusqu'au {date}",
      win_instructions: 'Présentez ce code au comptoir de Babke.',
      win_stamps_instructions: 'Présentez ce code avec votre Carte Babke : on crédite vos {n} sceau(x).',
      lose_title: 'Pas cette fois, {name}',
      lose_body: 'Retentez votre chance dans {days} jours.',
      cooldown_title: 'Déjà joué !',
      cooldown_body: 'Ce numéro a déjà tenté sa chance. Une participation tous les {days} jours.',
      err_iplimit: "Trop de participations depuis ce réseau aujourd'hui. Revenez demain.",
      err_config: "La roue vient d'être mise à jour. Nouvel essai…",
      disabled_title: 'La roue fait une pause',
      disabled_body: 'Revenez bientôt pour tenter votre chance.',
      last_prize_title: 'Votre dernier lot',
      status_won: 'À retirer',
      status_redeemed: 'Déjà remis',
      status_expired: 'Expiré',
      status_void: 'Annulé',
      btn_close: 'Fermer',
      copied: 'Code copié',
      btn_card: 'Voir ma Carte Babke',
      prizes_title: 'Les lots de la roue',
      rules_title: 'Règlement',
      aria_wheel: 'Roue des lots : {labels}'
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
      form_title: 'Your free spin',
      form_consent: 'I agree that Babke keeps my first name and number to manage my prize.',
      form_submit: 'Spin the wheel',
      spinning_title: 'Spinning…',
      spinning_body: 'The embers are picking your prize.',
      win_eyebrow: 'Well done, {name}!',
      win_code_label: 'Your code',
      win_valid_until: 'Valid until {date}',
      win_instructions: 'Show this code at the Babke counter.',
      win_stamps_instructions: "Show this code with your Babke Card: we'll add your {n} seal(s).",
      lose_title: 'Not this time, {name}',
      lose_body: 'Try your luck again in {days} days.',
      cooldown_title: 'Already played!',
      cooldown_body: 'This number has already played. One spin every {days} days.',
      err_iplimit: 'Too many spins from this network today. Come back tomorrow.',
      err_config: 'The wheel was just updated. Trying again…',
      disabled_title: 'The wheel is taking a break',
      disabled_body: 'Come back soon to try your luck.',
      last_prize_title: 'Your last prize',
      status_won: 'To collect',
      status_redeemed: 'Collected',
      status_expired: 'Expired',
      status_void: 'Cancelled',
      btn_close: 'Close',
      copied: 'Code copied',
      btn_card: 'See my Babke Card',
      prizes_title: 'Prizes on the wheel',
      rules_title: 'Rules',
      aria_wheel: 'Prize wheel: {labels}'
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
      form_title: 'الدورة البلاش متاعك',
      form_consent: 'نقبل إلي بابكي يخبّي اسمي و نومرويا باش يتصرّف في الهدية متاعي.',
      form_submit: 'دوّر الرّودة',
      spinning_title: 'تدور…',
      spinning_body: 'الجمر يختار في الهدية متاعك.',
      win_eyebrow: 'برافو {name}!',
      win_code_label: 'الكود متاعك',
      win_valid_until: 'صالح حتى {date}',
      win_instructions: 'ورّي هالكود في كونتوار بابكي.',
      win_stamps_instructions: 'ورّي هالكود مع كارت بابكي: نزيدولك {n} طوابع.',
      lose_title: 'المرة الجاية، {name}',
      lose_body: 'عاود جرّب زهرك بعد {days} أيام.',
      cooldown_title: 'لعبت قبل!',
      cooldown_body: 'هالنومرو لعب قبل. دورة وحدة كل {days} أيام.',
      err_iplimit: 'برشا مشاركات من هالريزو اليوم. ارجع غدوة.',
      err_config: 'الرّودة تبدّلت توّا. نعاودو…',
      disabled_title: 'الرّودة واقفة شوية',
      disabled_body: 'ارجع قريب باش تجرّب زهرك.',
      last_prize_title: 'آخر هدية ربحتها',
      status_won: 'تستنّى فيك',
      status_redeemed: 'تسلّمت',
      status_expired: 'فاتت',
      status_void: 'تلغات',
      btn_close: 'سكّر',
      copied: 'الكود تنسخ',
      btn_card: 'شوف كارت بابكي',
      prizes_title: 'هدايا الرّودة',
      rules_title: 'القوانين',
      aria_wheel: 'رودة الهدايا: {labels}'
    }
  };
  const T = (key, vars) => Fx.t(WHEEL_I18N, key, vars);
  const E = Fx.esc;
  const lang = () => Fx.getLang();

  /* ------------------------------------------------------------------
     Constants. Geometry is in viewBox units of a 200x200 box.
     Ported verbatim from the source wheel (spec 5.2).
     ------------------------------------------------------------------ */
  const CX = 100, CY = 100;
  const R = 87;                   // disc: base plate, wedges and labels stop here
  const RIM_MID = 93.5;           // rim band centre (stroke 11 => 88..99)
  const LAMP_RADIUS = 93.5;
  const HUB_RADIUS = 26;          // spokes stop at the hub (a 26% DOM div)
  const ROSETTE_RADIUS = 40;
  const LABEL_RADIUS = 58.5;
  const LABEL_TRACK = 51;         // 33..84 along the radius
  const LABEL_INNER_RADIUS = 33;
  const LINE_HEIGHT = 1.14;
  const MAX_FONT = 8.6;
  const MIN_FONT = 4.4;
  const MAX_LINES = 3;
  const LINE_BONUS = 1.15;
  const TRACKING_EM = 0.06;       // letter-spacing applied to Latin labels

  const IDLE_DRIFT_MS = 140000;   // +360deg every 140 s
  const WAIT_TURNS = 16;
  const WAIT_MS_PER_TURN = 1150;
  const LANDING_TURNS = 4;
  const LANDING_MS = 4000;
  const REDUCED_MS = 450;
  const SPIN_START_DELAY_MS = 520;
  const STOP_EASE_MS = 900;
  const TICK_MIN_MS = 90;
  const REQUEST_TIMEOUT_MS = 30000;
  const CONFETTI_COUNT = 52;
  const CONFETTI_MS = 3200;
  const CONFETTI_COLORS = ['#ff5a1f', '#ffb830', '#fbf9f6', '#136f63', '#e73623'];
  const LAND_EASE = Fx.bezier(0.12, 0.72, 0.16, 1);

  const TONES = { ember: '#c93f16', brass: '#b8781f', charcoal: '#1c1714', tile: '#136f63', herb: '#55702f' };
  const toneOf = (t) => (Object.prototype.hasOwnProperty.call(TONES, t) ? t : 'charcoal');

  const KEY_PLAY = 'babke_wheel_play';
  const KEY_PENDING = 'babke_wheel_pending';
  const KEY_NAME = 'babke_wheel_name';
  const TOKEN_RE = /^[A-Za-z0-9_-]{1,96}$/;
  const REQUEST_ID_RE = /^[A-Za-z0-9-]{16,64}$/;

  const reduced = () => Fx.reducedMotion();
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const nowMs = () => (window.performance && performance.now ? performance.now() : Date.now());

  /* ------------------------------------------------------------------
     Geometry primitives
     ------------------------------------------------------------------ */
  const r3 = (n) => Math.round(n * 1000) / 1000;
  // angles run clockwise from twelve, where the pointer sits
  function polar(radius, deg) {
    const rad = (deg * Math.PI) / 180;
    return { x: r3(CX + radius * Math.sin(rad)), y: r3(CY - radius * Math.cos(rad)) };
  }
  function segmentPath(index, count) {
    const span = 360 / count;
    if (count === 1) {
      return 'M ' + CX + ' ' + (CY - R) + ' A ' + R + ' ' + R + ' 0 1 1 ' + (CX - 0.001) + ' ' + (CY - R) + ' Z';
    }
    const a = polar(R, index * span);
    const b = polar(R, (index + 1) * span);
    const largeArc = span > 180 ? 1 : 0;
    return 'M ' + CX + ' ' + CY + ' L ' + a.x.toFixed(3) + ' ' + a.y.toFixed(3) +
      ' A ' + R + ' ' + R + ' 0 ' + largeArc + ' 1 ' + b.x.toFixed(3) + ' ' + b.y.toFixed(3) + ' Z';
  }

  // The rotation that parks the centre of `index` under the pointer, forward only.
  // A wheel that visibly reverses reads as rigged. Ported verbatim (spec 5.2).
  function landingRotation(current, index, count, turns) {
    const spanDeg = 360 / count;
    const desired = (((-(index + 0.5) * spanDeg) % 360) + 360) % 360;
    const base = current + turns * 360;
    const baseMod = ((base % 360) + 360) % 360;
    let delta = desired - baseMod;
    if (delta < 0) delta += 360;
    return base + delta;
  }

  /* ------------------------------------------------------------------
     Label fit: layoutLabel / bestSplit with MEASURED widths
     (one offscreen canvas; Outfit for fr/en, Cairo for tn)
     ------------------------------------------------------------------ */
  let measureCtx = null;
  function makeMeasurer(isTn) {
    if (!measureCtx) {
      try { measureCtx = document.createElement('canvas').getContext('2d'); } catch (e) { measureCtx = null; }
    }
    const font = isTn
      ? "700 10px Cairo, Outfit, 'Segoe UI', Tahoma, sans-serif"
      : "700 10px Outfit, 'Segoe UI', Roboto, Arial, sans-serif";
    const cache = new Map();
    // width of s at font size `size`, in viewBox units, tracking included
    // (Arabic gets no tracking: letter-spacing breaks the cursive joins)
    return function width(s, size) {
      let w10 = cache.get(s);
      if (w10 === undefined) {
        if (measureCtx) {
          measureCtx.font = font;
          w10 = measureCtx.measureText(s).width;
        } else {
          w10 = s.length * 6.4;   // no canvas: a conservative Outfit-bold average
        }
        cache.set(s, w10);
      }
      return (w10 * size) / 10 + (isTn ? 0 : TRACKING_EM * size * s.length);
    };
  }

  // Splits words into exactly `parts` lines, minimising the widest one.
  function bestSplit(words, parts, width) {
    if (parts <= 1 || words.length <= 1) return [words.join(' ')];
    if (parts >= words.length) return words.slice();
    let best = [words.join(' ')];
    let bestMax = Infinity;
    for (let cut = 1; cut <= words.length - (parts - 1); cut += 1) {
      const head = words.slice(0, cut).join(' ');
      const tail = bestSplit(words.slice(cut), parts - 1, width);
      const longest = tail.reduce((m, line) => Math.max(m, width(line, 1)), width(head, 1));
      if (longest < bestMax) { bestMax = longest; best = [head].concat(tail); }   // strict: ties break early
    }
    return best;
  }

  function layoutLabel(raw, count, width) {
    const clean = String(raw == null ? '' : raw).trim().replace(/\s+/g, ' ');
    if (!clean) return { lines: [''], fontSize: MAX_FONT };
    const words = clean.split(' ').slice(0, 12);
    const innerArc = (2 * Math.PI * LABEL_INNER_RADIUS) / count;

    let best = { lines: [clean], fontSize: 0 };
    for (let parts = 1; parts <= MAX_LINES; parts += 1) {
      const lines = bestSplit(words, parts, width);
      if (parts > 1 && lines.length < parts) break;       // fewer words than lines
      const longest = lines.reduce((m, l) => Math.max(m, width(l, 1)), 0.0001);
      const byTrack = LABEL_TRACK / longest;               // the widest line fits the radial track
      // the stack fits across the wedge at its narrowest point (0.86 = corner margin)
      const byArc = (innerArc * 0.86) / (lines.length * LINE_HEIGHT);
      const size = Math.min(MAX_FONT, byTrack, byArc);
      if (parts === 1 || size > best.fontSize * LINE_BONUS) best = { lines: lines, fontSize: size };
    }
    if (best.fontSize >= MIN_FONT) {
      // floored, never rounded up past the track it was measured against
      return { lines: best.lines, fontSize: Math.floor(best.fontSize * 100) / 100 };
    }
    // Truncation fallback. Honest only because every prize is printed in
    // full in .wheel-prizes under the wheel: KEEP THAT LIST.
    const fitted = best.lines.map((line) => {
      if (width(line, MIN_FONT) <= LABEL_TRACK) return line;
      const chars = Array.from(line);
      while (chars.length > 1 && width(chars.join('').trimEnd() + '…', MIN_FONT) > LABEL_TRACK) chars.pop();
      return chars.join('').trimEnd() + '…';
    });
    return { lines: fitted, fontSize: MIN_FONT };
  }

  /* ------------------------------------------------------------------
     State
     ------------------------------------------------------------------ */
  const PLACEHOLDER = ['ember', 'charcoal', 'brass', 'tile', 'charcoal', 'brass', 'herb', 'ember']
    .map((tone) => ({ id: '', label: '', tone: tone }));

  let cfg = null;                 // last good P5 body
  let segments = [];              // cfg.segments, or [] (placeholder wheel drawn instead)
  let drawnKey = '';              // what the disc SVG currently shows
  let state = 'loading';          // loading | form | spinning | result | cooldown | disabled | error
  let stateData = {};             // per-state render data
  let formError = '';             // i18n key shown in the form
  let formDraft = null;           // { firstName, phone, consent } kept across re-renders
  let invalidField = '';          // 'name' | 'phone' | 'consent'
  let lastPlay = null;            // P7 body shown in .wheel-last
  let busy = false;               // re-entrancy guard for a play round
  let round = 0;                  // stale-reply guard
  let pendingRebuild = false;     // a language change arrived mid-spin

  // motion
  let rotation = 0;
  let spinning = false;
  let targetIndex = null;         // set from the landing until the next round
  let winnerIndex = null;
  let cancelMotion = null;        // the one running rotation tween
  let driftRaf = null, driftLast = 0;
  let stageVisible = true;
  let lastTickIndex = -1, lastTickAt = 0, tickAnim = null;

  // overlay
  let overlay = null, overlayCard = null, overlayOpen = false, releaseTrap = null;
  let overlayData = null, overlayAnim = null;

  /* ------------------------------------------------------------------
     Static SVG pieces
     ------------------------------------------------------------------ */
  const KHATAM_PATH = (cx, cy, r) => {
    const h = r3(r / Math.SQRT2);
    const a = [cx - h, cy - h, cx + h, cy - h, cx + h, cy + h, cx - h, cy + h];
    const b = [cx, cy - r, cx + r, cy, cx, cy + r, cx - r, cy];
    const p = (v) => 'M' + v[0] + ' ' + v[1] + 'L' + v[2] + ' ' + v[3] + 'L' + v[4] + ' ' + v[5] + 'L' + v[6] + ' ' + v[7] + 'Z';
    return p(a.map(r3)) + p(b.map(r3));
  };
  // The mark leading the form title is the Babke logo, not a generic star.
  const ICON_STAR = '<img class="wheel-kicker-mark" src="assets/BabkeLogo.png" alt="" ' +
    'aria-hidden="true" draggable="false" decoding="async">';
  const ICON_CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/></svg>';
  const ICON_SPIN = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4.5h-4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function emblem(kind) {
    // an 8-point khatam in brass: two squares, an inner ring, and a mark per state
    const inner = {
      spinning: '<circle cx="32" cy="32" r="5" fill="currentColor"/>',
      cooldown: '<path d="M32 21v11l7 5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
      disabled: '<path d="M27 25v14M37 25v14" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>',
      error: '<path d="M32 22v12" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/><circle cx="32" cy="41" r="2.2" fill="currentColor"/>'
    }[kind] || '';
    // The emblem is the Babke logo. The per-state mark (clock, pause, error)
    // still has to be readable, so it rides along as a small corner badge
    // rather than being drawn inside the logo.
    const badge = inner
      ? '<svg class="wheel-emblem-badge" viewBox="0 0 64 64" focusable="false" aria-hidden="true">' + inner + '</svg>'
      : '';
    return '<div class="wheel-emblem" aria-hidden="true">' +
      '<img class="wheel-emblem-mark" src="assets/BabkeLogo.png" alt="" draggable="false" decoding="async">' +
      badge + '</div>';
  }

  function frameSvg(count) {
    const n = Math.max(1, count) * 2;
    let a = '', b = '';
    for (let i = 0; i < n; i++) {
      const p = polar(LAMP_RADIUS, (i * 360) / n);
      const c = '<circle cx="' + p.x + '" cy="' + p.y + '" r="1.7" fill="#ffe9b0" filter="url(#wheelGlow)"/>';
      if (i % 2 === 0) a += c; else b += c;
    }
    return '<svg class="wheel-frame" viewBox="0 0 200 200" aria-hidden="true" focusable="false">' +
      '<defs>' +
        '<linearGradient id="wheelRim" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0%" stop-color="#fff0c2"/><stop offset="14%" stop-color="#ffcf6b"/>' +
          '<stop offset="28%" stop-color="#b8781f"/><stop offset="42%" stop-color="#6b4312"/>' +
          '<stop offset="57%" stop-color="#ffd27a"/><stop offset="71%" stop-color="#c8862a"/>' +
          '<stop offset="85%" stop-color="#4a2d12"/><stop offset="100%" stop-color="#f2c26a"/>' +
        '</linearGradient>' +
        '<radialGradient id="wheelShade" cx="50%" cy="50%" r="50%">' +
          '<stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="88%" stop-color="#000" stop-opacity=".22"/>' +
          '<stop offset="100%" stop-color="#000" stop-opacity=".5"/>' +
        '</radialGradient>' +
        '<radialGradient id="wheelGloss" cx="50%" cy="8%" r="95%">' +
          '<stop offset="0%" stop-color="#fff" stop-opacity="1"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/>' +
        '</radialGradient>' +
        '<filter id="wheelGlow" x="-160%" y="-160%" width="420%" height="420%">' +
          '<feGaussianBlur stdDeviation="1.2" result="blur"/>' +
          '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>' +
        '</filter>' +
      '</defs>' +
      '<circle cx="100" cy="100" r="' + R + '" fill="url(#wheelShade)"/>' +
      '<path d="M13 100 A87 87 0 0 1 187 100 Z" fill="url(#wheelGloss)" opacity=".12"/>' +
      '<circle cx="100" cy="100" r="' + RIM_MID + '" fill="none" stroke="url(#wheelRim)" stroke-width="11"/>' +
      '<circle cx="100" cy="100" r="88" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="1"/>' +
      '<circle cx="100" cy="100" r="99" fill="none" stroke="rgba(255,240,200,.35)" stroke-width=".6"/>' +
      '<g class="wheel-lamps-a">' + a + '</g><g class="wheel-lamps-b">' + b + '</g>' +
      '</svg>';
  }

  const POINTER_SVG =
    '<svg viewBox="0 0 32 40" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="wheelPointerBrass" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#ffe3a3"/><stop offset="55%" stop-color="#b8781f"/><stop offset="100%" stop-color="#6b4312"/>' +
      '</linearGradient></defs>' +
      '<path d="M16 6 L26 6 L16 33 L6 6 Z" fill="url(#wheelPointerBrass)" stroke="#3b2410" stroke-width="5.5" stroke-linejoin="round" paint-order="stroke"/>' +
      '<circle cx="16" cy="11" r="3" fill="#ff5a1f"/>' +
      '<circle cx="15" cy="10" r="1" fill="#fff" opacity=".55"/>' +
    '</svg>';

  // The rotating disc. Built once per (segments, language); never during a spin.
  function discSvg(segs, isTn, isPlaceholder) {
    const count = segs.length;
    const span = 360 / count;
    const width = makeMeasurer(isTn);
    let wedges = '', spokes = '', labels = '';
    for (let i = 0; i < count; i++) {
      const tone = toneOf(segs[i].tone);
      wedges += '<path d="' + segmentPath(i, count) + '" fill="' + TONES[tone] + '"/>';
      if (count > 1) {
        const p1 = polar(HUB_RADIUS, i * span), p2 = polar(R, i * span);
        spokes += '<line x1="' + p1.x + '" y1="' + p1.y + '" x2="' + p2.x + '" y2="' + p2.y + '"/>';
      }
      if (isPlaceholder) continue;
      let text = Fx.loc(segs[i].label, lang());
      if (!isTn) text = text.toLocaleUpperCase(lang() === 'fr' ? 'fr-FR' : 'en-GB');
      const laid = layoutLabel(text, count, width);
      const angle = (i + 0.5) * span;
      const anchor = polar(LABEL_RADIUS, angle);
      const onLeftHalf = angle > 180 && angle < 360;   // never upside down
      const rot = onLeftHalf ? angle + 90 : angle - 90;
      const fs = laid.fontSize;
      const firstDy = -((laid.lines.length - 1) / 2) * LINE_HEIGHT * fs;
      const fill = tone === 'charcoal' ? '#ffb830' : '#fff8ee';
      let tspans = '';
      laid.lines.forEach((line, li) => {
        tspans += '<tspan x="' + anchor.x + '" dy="' + r3(li === 0 ? firstDy : LINE_HEIGHT * fs) + '">' + E(line) + '</tspan>';
      });
      labels += '<text class="wheel-label" x="' + anchor.x + '" y="' + anchor.y + '"' +
        ' transform="rotate(' + rot.toFixed(2) + ' ' + anchor.x.toFixed(3) + ' ' + anchor.y.toFixed(3) + ')"' +
        ' text-anchor="middle" dominant-baseline="central" fill="' + fill + '" font-size="' + fs + '"' +
        (isTn ? ' direction="rtl"' : ' letter-spacing="' + r3(fs * TRACKING_EM) + '"') + '>' + tspans + '</text>';
    }
    return '<svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">' +
      '<defs><radialGradient id="wheelSheen" gradientUnits="userSpaceOnUse" cx="100" cy="100" r="' + R + '">' +
        '<stop offset="' + r3(HUB_RADIUS / R) + '" stop-color="#fff" stop-opacity="0"/>' +
        '<stop offset="1" stop-color="#fff" stop-opacity=".10"/>' +
      '</radialGradient></defs>' +
      '<circle cx="100" cy="100" r="' + R + '" fill="#120e0c"/>' +
      '<g>' + wedges + '</g>' +
      '<circle cx="100" cy="100" r="' + R + '" fill="url(#wheelSheen)"/>' +
      '<g stroke="rgba(255,214,150,.55)" stroke-width=".6" stroke-linecap="round">' + spokes + '</g>' +
      '<g class="wheel-labels">' + labels + '</g>' +
      '<g class="wheel-winner-layer"></g>' +
      '</svg>';
  }

  /* ------------------------------------------------------------------
     Skeleton (built once; only the panel / lists / disc are re-rendered)
     ------------------------------------------------------------------ */
  root.innerHTML =
    '<div class="wheel-container">' +
      '<div class="wheel-stage-col">' +
        '<div class="wheel-stage is-loading" role="img">' +
          '<div class="wheel-bloom" aria-hidden="true"></div>' +
          '<div class="wheel-disc"></div>' +
          '<div class="wheel-frame-host"></div>' +
          '<div class="wheel-hub" aria-hidden="true"><img src="assets/BabkeLogo.png" alt="" draggable="false"></div>' +
          '<div class="wheel-pointer" aria-hidden="true"><div class="wheel-pointer-inner">' + POINTER_SVG + '</div></div>' +
        '</div>' +
      '</div>' +
      '<div class="wheel-side">' +
        '<div class="wheel-panel glass-card" data-state="loading" tabindex="-1"></div>' +
        '<div class="wheel-last glass-card" hidden></div>' +
      '</div>' +
    '</div>' +
    '<div class="wheel-info">' +
      '<div class="wheel-prizes" hidden></div>' +
      '<details class="wheel-rules" hidden><summary></summary><p class="wheel-rules-text"></p></details>' +
    '</div>';

  const stage = root.querySelector('.wheel-stage');
  const disc = root.querySelector('.wheel-disc');
  const frameHost = root.querySelector('.wheel-frame-host');
  const pointerInner = root.querySelector('.wheel-pointer-inner');
  const panel = root.querySelector('.wheel-panel');
  const lastEl = root.querySelector('.wheel-last');
  const prizesEl = root.querySelector('.wheel-prizes');
  const rulesEl = root.querySelector('.wheel-rules');
  frameHost.style.display = 'contents';

  /* ------------------------------------------------------------------
     Disc build
     ------------------------------------------------------------------ */
  function drawDisc(force) {
    const isPlaceholder = segments.length === 0;
    const segs = isPlaceholder ? PLACEHOLDER : segments;
    const isTn = lang() === 'tn';
    const key = JSON.stringify([isPlaceholder, isTn, lang(), segs.map((s) => [s.id, s.tone, s.label])]);
    if (!force && key === drawnKey) return;
    // never rebuild under a spin, except the spec'd refetch-and-rebuild when the
    // reply's segmentId is not where the client expected it (force === 'spin')
    if (spinning && force !== 'spin') { pendingRebuild = true; return; }
    drawnKey = key;
    pendingRebuild = false;
    disc.innerHTML = discSvg(segs, isTn, isPlaceholder);
    disc.classList.toggle('is-tn', isTn);
    frameHost.innerHTML = frameSvg(segs.length);
    if (winnerIndex !== null && !isPlaceholder) showWinner(winnerIndex, false);
    const labels = segments.map((s) => Fx.loc(s.label, lang())).filter(Boolean);
    stage.setAttribute('aria-label', T('aria_wheel', { labels: labels.join(', ') }));
  }

  function showWinner(idx, animate) {
    const layer = disc.querySelector('.wheel-winner-layer');
    if (!layer || !segments.length || idx == null || idx < 0 || idx >= segments.length) return;
    layer.innerHTML = '<path class="wheel-winner is-winner' + (animate ? '' : ' is-still') + '" d="' +
      segmentPath(idx, segments.length) + '"/>';
  }
  function clearWinner() {
    winnerIndex = null;
    const layer = disc.querySelector('.wheel-winner-layer');
    if (layer) layer.innerHTML = '';
  }

  /* ------------------------------------------------------------------
     Motion engine: rotation in degrees, one writer
     ------------------------------------------------------------------ */
  function setRotation(v) {
    rotation = v;
    disc.style.transform = 'rotate(' + v + 'deg)';
    tick(v);
  }

  // Each wedge crossing the pointer knocks it back. Ticks inside the 90 ms
  // window are DROPPED, not deferred (lastTickIndex updates before the throttle).
  function tick(v) {
    if (!spinning || reduced()) return;
    const count = segments.length;
    if (!count) return;
    const span = 360 / count;
    const under = Math.min(count - 1, Math.floor((((-v % 360) + 360) % 360) / span));
    if (under === lastTickIndex) return;
    lastTickIndex = under;
    const t = nowMs();
    if (t - lastTickAt < TICK_MIN_MS) return;
    lastTickAt = t;
    if (typeof pointerInner.animate !== 'function') return;
    if (tickAnim) { try { tickAnim.cancel(); } catch (e) { /* ignore */ } }
    tickAnim = pointerInner.animate([
      { transform: 'rotate(-11deg)' },
      { transform: 'rotate(4deg)', offset: 0.45 },
      { transform: 'rotate(-1.5deg)', offset: 0.75 },
      { transform: 'rotate(0deg)' }
    ], { duration: 300, easing: 'ease-out' });
  }

  function stopMotion() {
    if (cancelMotion) { cancelMotion(); cancelMotion = null; }
  }

  // Stage 1: idle drift, +360deg / 140 s, only when idle, visible and not reduced.
  function driftAllowed() {
    return !spinning && targetIndex === null && !reduced() && stageVisible && !document.hidden &&
      segments.length > 0 && (state === 'form' || state === 'cooldown' || state === 'result');
  }
  function updateDrift() {
    if (driftAllowed()) {
      if (driftRaf === null) {
        driftLast = 0;
        driftRaf = requestAnimationFrame(driftFrame);
      }
    } else if (driftRaf !== null) {
      cancelAnimationFrame(driftRaf);
      driftRaf = null;
    }
  }
  function driftFrame(ts) {
    driftRaf = null;
    if (!driftAllowed()) return;
    if (driftLast) {
      const dt = Math.min(100, Math.max(0, ts - driftLast));   // no jump after a background tab
      setRotation(rotation + (360 * dt) / IDLE_DRIFT_MS);
    }
    driftLast = ts;
    driftRaf = requestAnimationFrame(driftFrame);
  }

  // Stage 2: waiting for the server. A long linear turn, cancelled on reply.
  // It chains another turn set if the reply is slower than the 18.4 s ceiling.
  function startWaiting() {
    stopMotion();
    if (reduced() || !segments.length) return;
    const go = () => {
      cancelMotion = Fx.tween({
        from: rotation, to: rotation + WAIT_TURNS * 360, duration: WAIT_TURNS * WAIT_MS_PER_TURN,
        ease: Fx.ease.linear, onUpdate: setRotation, onDone: () => { if (spinning && targetIndex === null) go(); }
      });
    };
    go();
  }

  // Stage 3: land on the wedge centre, forward only. Resolves when settled.
  function land(idx) {
    stopMotion();
    const count = segments.length;
    const rm = reduced();
    const target = landingRotation(rotation, idx, count, rm ? 0 : LANDING_TURNS);
    return new Promise((resolve) => {
      cancelMotion = Fx.tween({
        from: rotation, to: target, duration: rm ? REDUCED_MS : LANDING_MS,
        ease: rm ? Fx.ease.power2Out : LAND_EASE, onUpdate: setRotation,
        onDone: () => { cancelMotion = null; resolve(); }
      });
    });
  }

  // Errors while spinning: ease the waiting turn out, 900 ms power2Out, +120deg.
  function easeOut() {
    stopMotion();
    if (reduced() || !segments.length) return Promise.resolve();
    return new Promise((resolve) => {
      cancelMotion = Fx.tween({
        from: rotation, to: rotation + 120, duration: STOP_EASE_MS, ease: Fx.ease.power2Out,
        onUpdate: setRotation, onDone: () => { cancelMotion = null; resolve(); }
      });
    });
  }

  function setSpinning(on) {
    spinning = on;
    stage.classList.toggle('is-spinning', on);
    if (!on) {
      lastTickIndex = -1;
      if (pendingRebuild) drawDisc(true);
    }
    updateDrift();
  }

  if (typeof IntersectionObserver === 'function') {
    new IntersectionObserver((entries) => {
      entries.forEach((en) => { stageVisible = en.isIntersecting; });
      updateDrift();
    }, { rootMargin: '80px 0px' }).observe(stage);
  }
  document.addEventListener('visibilitychange', updateDrift);
  Fx.onReducedMotionChange(() => updateDrift());

  /* ------------------------------------------------------------------
     Rendering helpers
     ------------------------------------------------------------------ */
  const STATUS = { won: 'status_won', redeemed: 'status_redeemed', expired: 'status_expired', void: 'status_void' };
  const statusOf = (p) => (p && Object.prototype.hasOwnProperty.call(STATUS, p.status) ? p.status : 'won');
  const pill = (status) => '<span class="wheel-pill is-' + status + '">' + E(T(STATUS[status])) + '</span>';
  const qrPayload = (prize) => {
    if (prize && typeof prize.qr === 'string' && /^babke:w:[A-Z0-9]{10}$/.test(prize.qr)) return prize.qr;
    const raw = String((prize && prize.code) || '').replace(/[^A-Z0-9]/g, '');
    return raw ? 'babke:w:' + raw : '';
  };
  const qrBox = (prize, size, cls) => {
    const payload = qrPayload(prize);
    const svg = payload ? Fx.qrSvg(payload, size) : '';
    return svg ? '<div class="wheel-qr ' + cls + '" aria-hidden="true">' + svg + '</div>' : '';
  };
  const codeButton = (code, small) =>
    '<button type="button" class="wheel-code' + (small ? ' wheel-code-sm' : '') + '" dir="ltr" data-code="' + E(code) + '"' +
    ' aria-label="' + E(T('win_code_label') + ' ' + code) + '">' + E(code) + '</button>' +
    '<span class="wheel-copied" aria-live="polite"></span>';
  const loyaltyAvailable = () => !!document.getElementById('loyalty');

  // Shared by the panel ('panel') and the overlay ('overlay').
  function resultHtml(ctx, where) {
    const inOverlay = where === 'overlay';
    const st = inOverlay ? ' data-stagger' : '';
    const titleAttrs = inOverlay ? ' id="wheel-result-title" tabindex="-1"' : ' tabindex="-1"';
    const data = ctx.data || {};
    const prize = data.result === 'win' ? data.prize : null;
    const name = ctx.name || '';
    if (!prize) {
      const days = (cfg && Number(cfg.cooldownDays)) || 7;
      return '<div class="wheel-result is-lose">' +
        (ctx.wedge ? '<p class="wheel-result-eyebrow"' + st + '>' + E(ctx.wedge) + '</p>' : '') +
        '<h3 class="wheel-result-prize"' + titleAttrs + st + '>' + E(T('lose_title', { name: name })) + '</h3>' +
        '<p class="wheel-result-note"' + st + '>' + E(T('lose_body', { days: days })) + '</p>' +
        '</div>';
    }
    const status = statusOf(prize);
    const code = String(prize.code || '');
    const isStamps = prize.type === 'stamps';
    const n = Number.isInteger(prize.stamps) ? prize.stamps : 1;
    const valid = status === 'won' ? Fx.fmtDate(prize.expiresAt, lang()) : '';
    let html = '<div class="wheel-result">' +
      (name ? '<p class="wheel-result-eyebrow"' + st + '>' + E(T('win_eyebrow', { name: name })) + '</p>' : '') +
      '<h3 class="wheel-result-prize"' + titleAttrs + st + '>' + E(Fx.loc(prize.label, lang())) + '</h3>' +
      (status !== 'won' ? '<div' + st + '>' + pill(status) + '</div>' : '') +
      '<div class="wheel-code-block"' + st + '><span class="wheel-code-label">' + E(T('win_code_label')) + '</span>' + codeButton(code, false) + '</div>' +
      (status === 'won' ? qrBox(prize, inOverlay ? 150 : 128, inOverlay ? 'is-lg' : 'is-md').replace('<div class="wheel-qr', '<div' + st + ' class="wheel-qr') : '') +
      (valid ? '<p class="wheel-result-valid"' + st + '>' + E(T('win_valid_until', { date: valid })) + '</p>' : '') +
      (status === 'won' ? '<p class="wheel-result-note"' + st + '>' + E(isStamps ? T('win_stamps_instructions', { n: n }) : T('win_instructions')) + '</p>' : '');
    if (isStamps && status === 'won' && loyaltyAvailable() && !inOverlay) {
      html += '<div class="wheel-result-actions"><button type="button" class="wheel-btn wheel-btn-ghost" data-action="card">' + E(T('btn_card')) + '</button></div>';
    }
    return html + '</div>';
  }

  /* ------------------------------------------------------------------
     Panel
     ------------------------------------------------------------------ */
  function defaultDraft() {
    const saved = Fx.store.get(KEY_NAME);
    return { firstName: typeof saved === 'string' ? saved.slice(0, 40) : '', phone: '', consent: false };
  }

  function formHtml() {
    const d = formDraft || (formDraft = defaultDraft());
    const inv = (f) => (invalidField === f ? ' aria-invalid="true" aria-describedby="wheel-form-error"' : '');
    return '<form class="wheel-form" novalidate>' +
      '<h3 class="wheel-panel-title" tabindex="-1"><span class="wheel-kicker" aria-hidden="true">' + ICON_STAR + '</span>' + E(T('form_title')) + '</h3>' +
      '<div class="wheel-field"><label for="wheel-first-name">' + E(T('form_first_name')) + '</label>' +
        '<input class="wheel-input" id="wheel-first-name" name="firstName" type="text" autocomplete="given-name" maxlength="40" required value="' + E(d.firstName) + '"' + inv('name') + '></div>' +
      '<div class="wheel-field"><label for="wheel-phone">' + E(T('form_phone')) + '</label>' +
        '<div class="wheel-phone-wrap" dir="ltr"><span class="wheel-phone-prefix" aria-hidden="true">+216</span>' +
        '<input class="wheel-input" id="wheel-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="20 123 456" dir="ltr" maxlength="20" required value="' + E(d.phone) + '"' + inv('phone') + '></div></div>' +
      '<label class="wheel-consent"><input type="checkbox" id="wheel-consent" name="consent"' + (d.consent ? ' checked' : '') + inv('consent') + '><span>' + E(T('form_consent')) + '</span></label>' +
      '<p class="wheel-error" id="wheel-form-error" role="alert"' + (formError ? '' : ' hidden') + '>' + (formError ? E(T(formError)) : '') + '</p>' +
      '<button type="submit" class="btn-primary-food wheel-btn wheel-submit"' + (busy ? ' disabled' : '') + '>' + ICON_SPIN + '<span>' + E(busy ? T('form_busy') : T('form_submit')) + '</span></button>' +
      '</form>';
  }

  function stateHtml(kind, title, body, extra, tone) {
    return '<div class="wheel-state' + (tone ? ' ' + tone : '') + '" data-kind="' + kind + '">' + emblem(kind) +
      '<h3 class="wheel-panel-title" tabindex="-1">' + E(title) + '</h3>' +
      (body ? '<p class="wheel-panel-body">' + E(body) + '</p>' : '') + (extra || '') + '</div>';
  }

  function renderPanel() {
    panel.setAttribute('data-state', state);
    panel.setAttribute('aria-busy', state === 'loading' || state === 'spinning' ? 'true' : 'false');
    let html = '';
    switch (state) {
      case 'loading':
        html = '<div class="wheel-skeleton" aria-hidden="true"><span class="wheel-skel-line is-title"></span>' +
          '<span class="wheel-skel-line is-field"></span><span class="wheel-skel-line is-field"></span>' +
          '<span class="wheel-skel-line is-short"></span><span class="wheel-skel-line is-field"></span></div>' +
          '<span class="wheel-sr" role="status">' + E(T('form_busy')) + '</span>';
        break;
      case 'form':
        html = formHtml();
        break;
      case 'spinning':
        html = stateHtml('spinning', T('spinning_title'), T('spinning_body'),
          '<p class="wheel-note" role="status">' + (stateData.note ? E(T(stateData.note)) : '') + '</p>', '');
        break;
      case 'result':
        html = resultHtml(stateData, 'panel');
        break;
      case 'cooldown':
        html = stateHtml('cooldown', T('cooldown_title'), T('cooldown_body', { days: stateData.days || 7 }), '', '');
        break;
      case 'disabled':
        html = stateHtml('disabled', T('disabled_title'), T('disabled_body'), '', 'is-muted');
        break;
      case 'error':
      default:
        html = stateHtml('error', T(stateData.msg || 'err_generic'), '',
          '<button type="button" class="wheel-btn wheel-btn-ghost" data-action="retry">' + E(T('btn_retry')) + '</button>', 'is-ember');
        break;
    }
    panel.innerHTML = html;
    stage.classList.toggle('is-loading', state === 'loading');
    stage.classList.toggle('is-dormant', state === 'disabled' || (state === 'error' && !segments.length));
    renderLast();
    updateDrift();
  }

  function setState(next, data) {
    state = next;
    stateData = data || {};
    renderPanel();
  }

  function focusPanelTitle() {
    const h = panel.querySelector('.wheel-panel-title, .wheel-result-prize');
    if (!h) return;
    try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); }
  }

  function renderInfo() {
    if (segments.length) {
      const seen = new Set();
      let items = '';
      segments.forEach((s) => {
        const text = Fx.loc(s.label, lang());
        const tone = toneOf(s.tone);
        const key = tone + '|' + text;
        if (!text || seen.has(key)) return;
        seen.add(key);
        items += '<li class="wheel-prize"><span class="wheel-swatch tone-' + tone + '" aria-hidden="true"></span>' +
          '<span class="wheel-prize-text">' + E(text) + '</span></li>';
      });
      prizesEl.innerHTML = '<h3 class="wheel-prizes-title">' + E(T('prizes_title')) + '</h3><ul class="wheel-prizes-list">' + items + '</ul>';
      prizesEl.hidden = !items;
    } else {
      prizesEl.hidden = true;
      prizesEl.innerHTML = '';
    }
    const rules = cfg ? Fx.loc(cfg.rules, lang()).trim() : '';
    rulesEl.hidden = !rules;
    rulesEl.querySelector('summary').textContent = T('rules_title');
    rulesEl.querySelector('.wheel-rules-text').textContent = rules;
  }

  function renderLast() {
    const p = lastPlay && lastPlay.result === 'win' ? lastPlay.prize : null;
    const shownInPanel = state === 'result' && stateData.data && lastPlay && stateData.data.playId === lastPlay.playId;
    if (!p || shownInPanel || state === 'spinning') {
      lastEl.hidden = true;
      lastEl.innerHTML = '';
      return;
    }
    const status = statusOf(p);
    const valid = status === 'won' ? Fx.fmtDate(p.expiresAt, lang()) : '';
    lastEl.innerHTML = '<div class="wheel-last-main">' +
      '<p class="wheel-last-title">' + E(T('last_prize_title')) + '</p>' +
      '<p class="wheel-last-label">' + E(Fx.loc(p.label, lang())) + '</p>' +
      pill(status) + codeButton(String(p.code || ''), true) +
      (valid ? '<p class="wheel-last-meta">' + E(T('win_valid_until', { date: valid })) + '</p>' : '') +
      '</div>' + (status === 'won' ? qrBox(p, 92, 'is-sm') : '');
    lastEl.hidden = false;
  }

  /* ------------------------------------------------------------------
     Copy code (toast when app.js provides it + inline confirmation,
     because the toast layer sits under the 10060 overlay)
     ------------------------------------------------------------------ */
  function copyCode(btn) {
    const code = btn.getAttribute('data-code') || '';
    if (!code) return;
    const done = () => {
      btn.classList.add('is-copied');
      const note = btn.parentNode && btn.parentNode.querySelector('.wheel-copied');
      if (note) note.textContent = T('copied');
      if (typeof window.showToast === 'function') window.showToast(E(T('copied')));
      setTimeout(() => {
        btn.classList.remove('is-copied');
        if (note) note.textContent = '';
      }, 1800);
    };
    const selectIt = () => {
      try {
        const range = document.createRange();
        range.selectNodeContents(btn);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (e) { /* ignore */ }
    };
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(code).then(done, selectIt);
      } else {
        selectIt();
      }
    } catch (e) { selectIt(); }
  }

  /* ------------------------------------------------------------------
     Result overlay (appended to <body> so no transformed ancestor can
     break position:fixed)
     ------------------------------------------------------------------ */
  function ensureOverlay() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'wheel-result-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'wheel-result-title');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = '<div class="wheel-result-card" tabindex="-1"></div>';
    overlayCard = overlay.firstChild;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) { closeOverlay(); return; }
      const btn = e.target.closest ? e.target.closest('button') : null;
      if (!btn || !overlay.contains(btn)) return;
      if (btn.classList.contains('wheel-code')) copyCode(btn);
      else if (btn.getAttribute('data-action') === 'close') closeOverlay();
      else if (btn.getAttribute('data-action') === 'card') goToCard();
    });
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlayOpen) { e.preventDefault(); e.stopPropagation(); closeOverlay(); }
    });
  }

  function overlayHtml(ctx) {
    const data = ctx.data || {};
    const prize = data.result === 'win' ? data.prize : null;
    const showCard = prize && prize.type === 'stamps' && statusOf(prize) === 'won' && loyaltyAvailable();
    return '<button type="button" class="wheel-result-close" data-action="close" aria-label="' + E(T('btn_close')) + '">' + ICON_CLOSE + '</button>' +
      resultHtml(ctx, 'overlay').replace(/<\/div>$/, '') +
      '<div class="wheel-result-actions" data-stagger>' +
        (showCard ? '<button type="button" class="btn-primary-food wheel-btn" data-action="card">' + E(T('btn_card')) + '</button>' : '') +
        '<button type="button" class="' + (showCard ? 'wheel-btn wheel-btn-ghost' : 'btn-primary-food wheel-btn') + '" data-action="close">' + E(T('btn_close')) + '</button>' +
      '</div></div>';
  }

  let scrollLocked = false;
  function dropOverlayAnim() {
    if (!overlayAnim) return;
    overlayAnim.onfinish = null;
    overlayAnim.oncancel = null;
    try { overlayAnim.cancel(); } catch (e) { /* ignore */ }
    overlayAnim = null;
  }

  function openOverlay(ctx) {
    ensureOverlay();
    overlayData = ctx;
    overlayCard.innerHTML = overlayHtml(ctx);
    dropOverlayAnim();            // also clears a finished exit's fill:forwards
    overlayOpen = true;
    if (!scrollLocked) { scrollLocked = true; Fx.lockScroll(); }
    stage.classList.add('is-covered');
    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.add('open');
    overlay.scrollTop = 0;
    if (releaseTrap) releaseTrap();
    releaseTrap = Fx.trapFocus(overlayCard);
    const title = overlayCard.querySelector('#wheel-result-title');
    if (title) { try { title.focus({ preventScroll: true }); } catch (e) { title.focus(); } }
    if (!reduced() && typeof overlayCard.animate === 'function') {
      const ease = 'cubic-bezier(0.25, 1, 0.5, 1)';
      overlayAnim = overlayCard.animate([
        { opacity: 0, transform: 'translateY(24px) scale(.9)' },
        { opacity: 1, transform: 'none' }
      ], { duration: 450, easing: ease });
      overlayCard.querySelectorAll('[data-stagger]').forEach((el, i) => {
        el.animate([
          { opacity: 0, transform: 'translateY(14px)' },
          { opacity: 1, transform: 'none' }
        ], { duration: 500, delay: 120 + i * 70, easing: ease, fill: 'backwards' });
      });
    }
  }

  function closeOverlay() {
    if (!overlay || !overlayOpen) return;
    overlayOpen = false;
    const finish = () => {
      if (overlayOpen) return;    // reopened while the exit was running
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      stage.classList.remove('is-covered');
      if (scrollLocked) { scrollLocked = false; Fx.unlockScroll(); }
      if (releaseTrap) { const r = releaseTrap; releaseTrap = null; r(); }
      // the element that opened it (the submit button) is usually gone: land on the panel result
      const a = document.activeElement;
      if (!a || a === document.body || overlay.contains(a)) focusPanelTitle();
    };
    dropOverlayAnim();
    if (!reduced() && typeof overlayCard.animate === 'function') {
      // fill:forwards keeps the card hidden while the backdrop fades; the next open cancels it
      overlayAnim = overlayCard.animate([
        { opacity: 1, transform: 'none' },
        { opacity: 0, transform: 'translateY(16px) scale(.95)' }
      ], { duration: 250, easing: 'ease-in', fill: 'forwards' });
      overlayAnim.onfinish = finish;
    } else {
      finish();
    }
  }

  function goToCard() {
    closeOverlay();
    const target = document.getElementById('loyalty');
    if (target) target.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
  }

  /* ------------------------------------------------------------------
     Confetti: 52 spans, seeded LCG from the playId, WAAPI, removed at 3.2 s.
     Win only; nothing under reduced motion.
     ------------------------------------------------------------------ */
  function confetti(seedText) {
    if (reduced() || typeof document.body.animate !== 'function') return;
    let s = 2166136261 >>> 0;
    String(seedText || 'babke').split('').forEach((ch) => { s = (Math.imul(s ^ ch.charCodeAt(0), 16777619)) >>> 0; });
    const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const host = document.createElement('div');
    host.className = 'wheel-confetti';
    host.setAttribute('aria-hidden', 'true');
    const travel = (window.innerHeight || 800) + 160;
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      const w = 5 + Math.round(rand() * 5);
      const round = rand() > 0.68;                       // 32% round
      const h = round ? w : w + Math.round(rand() * 7);
      const left = Math.round((i / (CONFETTI_COUNT - 1)) * 96 + (rand() * 6 - 3));
      const drift = Math.round(rand() * 120 - 60);
      const spin = Math.round(rand() * 720 - 360);
      const delay = Math.round(rand() * 520);
      const duration = 1900 + Math.round(rand() * 700);
      const el = document.createElement('span');
      el.style.cssText = 'left:' + left + '%;width:' + w + 'px;height:' + h + 'px;background:' +
        CONFETTI_COLORS[i % CONFETTI_COLORS.length] + ';border-radius:' + (round ? '9999px' : '1px');
      host.appendChild(el);
      el.animate([
        { transform: 'translate(0,-60px) rotate(0deg) scale(.6)' },
        { transform: 'translate(' + drift + 'px,' + travel + 'px) rotate(' + spin + 'deg) scale(1)' }
      ], { duration: duration, delay: delay, easing: 'cubic-bezier(0.2, 0.6, 0.4, 1)', fill: 'both' });
      el.animate([
        { opacity: 0, offset: 0 }, { opacity: 1, offset: 0.08 }, { opacity: 1, offset: 0.74 }, { opacity: 0, offset: 1 }
      ], { duration: duration, delay: delay, easing: 'linear', fill: 'both' });
    }
    document.body.appendChild(host);
    setTimeout(() => { if (host.parentNode) host.parentNode.removeChild(host); }, CONFETTI_MS);
  }

  /* ------------------------------------------------------------------
     Data: P5 config, P7 last play
     ------------------------------------------------------------------ */
  function sanitizeConfig(d) {
    if (!d || typeof d !== 'object') return null;
    const segs = Array.isArray(d.segments) ? d.segments.slice(0, 24).map((s) => ({
      id: s && typeof s.id === 'string' ? s.id : '',
      label: s && s.label != null ? s.label : '',
      tone: s && typeof s.tone === 'string' ? s.tone : 'charcoal'
    })) : [];
    return {
      enabled: d.enabled === true,
      version: Number.isInteger(d.version) ? d.version : null,
      cooldownDays: Number.isFinite(d.cooldownDays) && d.cooldownDays > 0 ? d.cooldownDays : 7,
      codeValidityDays: d.codeValidityDays,
      rules: d.rules || '',
      segments: segs
    };
  }

  // Resolves to 'ok' | 'disabled' | 'error:<i18n key>'
  async function fetchConfig() {
    const res = await Fx.api('/api/wheel');
    if (res.ok) {
      const c = sanitizeConfig(res.data);
      if (!c) return 'error:err_generic';
      cfg = c;
      segments = c.enabled && c.version !== null ? c.segments : [];
      return c.enabled && segments.length ? 'ok' : 'disabled';
    }
    if (res.status === 0) return 'error:err_network';
    if (res.status === 429) return 'error:err_rate';
    return 'error:err_generic';
  }

  async function fontsReady(isTn) {
    const fonts = document.fonts;
    if (!fonts || !fonts.load) return;
    const loads = [fonts.load(isTn ? "700 10px Cairo" : "700 10px Outfit")];
    if (fonts.ready) loads.push(fonts.ready);
    // never let a blocked font CDN hold the wheel back
    await Promise.race([Promise.all(loads).catch(() => {}), wait(1500)]);
  }

  function readStoredPlay() {
    const v = Fx.store.get(KEY_PLAY);
    if (v && typeof v === 'object' && TOKEN_RE.test(String(v.playId)) && TOKEN_RE.test(String(v.playToken))) return v;
    if (v != null) Fx.store.remove(KEY_PLAY);
    return null;
  }
  function readPending() {
    const v = Fx.store.get(KEY_PENDING);
    if (v && typeof v === 'object' && REQUEST_ID_RE.test(String(v.requestId)) && Fx.normalizePhone(v.phone) &&
        typeof v.firstName === 'string' && Number.isInteger(v.version)) {
      return { requestId: v.requestId, phone: Fx.normalizePhone(v.phone), firstName: v.firstName.slice(0, 40),
        version: v.version, lang: ['en', 'fr', 'tn'].indexOf(v.lang) !== -1 ? v.lang : lang() };
    }
    if (v != null) Fx.store.remove(KEY_PENDING);
    return null;
  }

  async function loadLastPlay() {
    const stored = readStoredPlay();
    if (!stored) { lastPlay = null; renderLast(); return; }
    const res = await Fx.api('/api/wheel/my-play', { headers: { 'X-Babke-Play': stored.playId + '.' + stored.playToken } });
    const now = readStoredPlay();
    if (!now || now.playId !== stored.playId) return;   // a newer play was stored meanwhile
    if (res.ok && res.data && typeof res.data === 'object' && res.data.playId === stored.playId) {
      lastPlay = res.data;
    } else if (res.status === 404) {
      Fx.store.remove(KEY_PLAY);
      lastPlay = null;
    }
    renderLast();
  }

  /* ------------------------------------------------------------------
     A play round (spec 5.2 "Game flow")
     ------------------------------------------------------------------ */
  function resolveIndex(data) {
    const i = data.segmentIndex;
    if (Number.isInteger(i) && i >= 0 && i < segments.length && segments[i].id === data.segmentId) return i;
    return -1;
  }

  function timeout(ms) {
    return wait(ms).then(() => ({ ok: false, status: 0, data: { error: 'network' }, timedOut: true }));
  }

  const FORM_ERRORS = { invalid_phone: 'err_phone', invalid_name: 'err_name', consent_required: 'err_consent' };

  async function runPlay(pending, opts) {
    if (busy) return;
    busy = true;
    const my = ++round;
    const o = opts || {};
    let body = { version: pending.version, phone: pending.phone, firstName: pending.firstName, consent: true,
      lang: pending.lang, requestId: pending.requestId };
    let configRetried = false;

    closeOverlay();
    clearWinner();
    targetIndex = null;
    formError = '';
    invalidField = '';
    rotation = ((rotation % 360) + 360) % 360;
    setRotation(rotation);

    // 1. the request leaves FIRST, so the round trip runs under the animation
    let request = Promise.race([Fx.api('/api/wheel/play', { method: 'POST', body: body }), timeout(REQUEST_TIMEOUT_MS)]);
    if (o.scroll) stage.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
    await wait(SPIN_START_DELAY_MS);
    if (my !== round) return;
    setState('spinning');
    focusPanelTitle();
    setSpinning(true);
    startWaiting();

    for (;;) {
      const res = await request;
      if (my !== round) return;

      if (res.ok && res.data && typeof res.data.playId === 'string') {
        const data = res.data;
        // A losing spin never hides a prize that is still waiting at the counter:
        // keep the stored win so "Your last prize" survives a reload.
        const keepWin = data.result !== 'win' && lastPlay && lastPlay.result === 'win' && lastPlay.prize &&
          statusOf(lastPlay.prize) === 'won' && lastPlay.playId !== data.playId;
        if (!keepWin && TOKEN_RE.test(data.playId) && TOKEN_RE.test(String(data.playToken))) {
          Fx.store.set(KEY_PLAY, { playId: data.playId, playToken: data.playToken });
        }
        Fx.store.remove(KEY_PENDING);
        let idx = resolveIndex(data);
        if (idx === -1) {
          // the wheel changed under us: refetch P5, rebuild, find the wedge by id
          const r = await fetchConfig();
          if (my !== round) return;
          if (r === 'ok') { drawDisc('spin'); renderInfo(); }
          idx = segments.findIndex((s) => s.id === data.segmentId);
        }
        let wedge = '';
        if (idx === -1) {
          await easeOut();
        } else {
          targetIndex = idx;
          await land(idx);
          winnerIndex = idx;
          showWinner(idx, !reduced());
          if (data.result !== 'win') wedge = Fx.loc(segments[idx].label, lang());
        }
        if (my !== round) return;
        setSpinning(false);
        // reveal: only now are BOTH the landing and the response done
        lastPlay = data.result === 'win' ? data : lastPlay;
        const ctx = { data: data, name: pending.firstName, wedge: wedge };
        busy = false;
        setState('result', ctx);
        openOverlay(ctx);
        if (data.result === 'win' && data.prize) confetti(data.playId);
        return;
      }

      const code = res.data && typeof res.data.error === 'string' ? res.data.error : '';

      if (res.status === 409 && code === 'config_changed' && !configRetried) {
        // refetch, rebuild, re-POST ONCE with the SAME requestId and the new version
        configRetried = true;
        setState('spinning', { note: 'err_config' });
        await easeOut();
        if (my !== round) return;
        const r = await fetchConfig();
        if (my !== round) return;
        setSpinning(false);
        drawDisc();
        renderInfo();
        if (r !== 'ok') { busy = false; Fx.store.remove(KEY_PENDING); setState(r === 'disabled' ? 'disabled' : 'error', { msg: r.slice(6) || 'err_generic', retry: 'config' }); return; }
        const nv = Number.isInteger(res.data.version) ? res.data.version : cfg.version;
        pending = Object.assign({}, pending, { version: nv });
        body = Object.assign({}, body, { version: nv });
        Fx.store.set(KEY_PENDING, pending);
        request = Promise.race([Fx.api('/api/wheel/play', { method: 'POST', body: body }), timeout(REQUEST_TIMEOUT_MS)]);
        setSpinning(true);
        startWaiting();
        continue;
      }

      // every other failure: ease the turn out, then show the right state
      await easeOut();
      if (my !== round) return;
      setSpinning(false);
      busy = false;
      const transient = res.status === 0 || (res.status >= 500 && code !== 'wheel_unavailable');
      if (transient) {
        // keep babke_wheel_pending: Retry re-POSTs the SAME requestId (idempotent server side)
        setState('error', { msg: res.status === 0 ? 'err_network' : 'err_generic', retry: 'play' });
        focusPanelTitle();
        return;
      }
      Fx.store.remove(KEY_PENDING);
      if (res.status === 429 && code === 'cooldown') {
        const h = Number(res.data.retryAfterHours);
        setState('cooldown', { days: h > 0 ? Math.ceil(h / 24) : (cfg && cfg.cooldownDays) || 7 });
      } else if (res.status === 403 && code === 'wheel_disabled') {
        segments = [];
        drawDisc();
        renderInfo();
        setState('disabled');
      } else {
        formError = code === 'ip_limit' ? 'err_iplimit'
          : code === 'rate_limited' || res.status === 429 ? 'err_rate'
          : FORM_ERRORS[code] || 'err_generic';
        invalidField = code === 'invalid_phone' ? 'phone' : code === 'invalid_name' ? 'name' : code === 'consent_required' ? 'consent' : '';
        setState('form');
      }
      focusPanelTitle();
      return;
    }
  }

  /* ------------------------------------------------------------------
     Form submit (client checks mirror the server's)
     ------------------------------------------------------------------ */
  let NAME_RE = null;
  try { NAME_RE = new RegExp("^[\\p{L}\\p{M}][\\p{L}\\p{M} '’.\\-]{1,39}$", 'u'); } catch (e) { NAME_RE = null; }
  function cleanName(raw) {
    const s = String(raw == null ? '' : raw).replace(/[\u0000-\u001F\u007F]/g, '').trim().replace(/\s+/g, ' ');
    if (NAME_RE) return NAME_RE.test(s) ? s : null;
    return s.length >= 2 && s.length <= 40 && !/[<>{}\d]/.test(s) ? s : null;
  }

  function onSubmit(form) {
    if (busy || state !== 'form') return;
    const d = formDraft || defaultDraft();
    d.firstName = form.querySelector('#wheel-first-name').value;
    d.phone = form.querySelector('#wheel-phone').value;
    d.consent = form.querySelector('#wheel-consent').checked;
    formDraft = d;
    const name = cleanName(d.firstName);
    const phone = Fx.normalizePhone(d.phone);
    let err = '', field = '';
    if (!name) { err = 'err_name'; field = 'name'; }
    else if (!phone) { err = 'err_phone'; field = 'phone'; }
    else if (!d.consent) { err = 'err_consent'; field = 'consent'; }
    if (err || !cfg || cfg.version === null) {
      formError = err || 'err_generic';
      invalidField = field;
      renderPanel();
      const target = panel.querySelector(field === 'name' ? '#wheel-first-name' : field === 'phone' ? '#wheel-phone' : '#wheel-consent');
      if (target) target.focus();
      return;
    }
    const pending = { requestId: Fx.uuid(), phone: phone, firstName: name, version: cfg.version, lang: lang() };
    Fx.store.set(KEY_PENDING, pending);
    Fx.store.set(KEY_NAME, name);
    runPlay(pending, { scroll: true });
  }

  /* ------------------------------------------------------------------
     Events
     ------------------------------------------------------------------ */
  root.addEventListener('submit', (e) => {
    const form = e.target;
    if (!form || !form.classList || !form.classList.contains('wheel-form')) return;
    e.preventDefault();
    onSubmit(form);
  });
  root.addEventListener('input', (e) => {
    const el = e.target;
    if (!el || !el.closest || !el.closest('.wheel-form')) return;
    const d = formDraft || (formDraft = defaultDraft());
    if (el.id === 'wheel-first-name') d.firstName = el.value;
    else if (el.id === 'wheel-phone') d.phone = el.value;
    else if (el.id === 'wheel-consent') d.consent = el.checked;
  });
  root.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'wheel-consent') (formDraft || (formDraft = defaultDraft())).consent = e.target.checked;
  });
  root.addEventListener('click', (e) => {
    const btn = e.target && e.target.closest ? e.target.closest('button') : null;
    if (!btn || !root.contains(btn)) return;
    if (btn.classList.contains('wheel-code')) { copyCode(btn); return; }
    const action = btn.getAttribute('data-action');
    if (action === 'card') goToCard();
    else if (action === 'retry') retry();
  });

  function retry() {
    if (busy) return;
    if (stateData.retry === 'play') {
      const pending = readPending();
      if (pending) { runPlay(pending, { scroll: true }); return; }
      setState('form');
      return;
    }
    boot(false);
  }

  window.addEventListener('babkeLangChanged', () => {
    drawDisc();                   // deferred automatically while spinning
    renderInfo();
    renderPanel();
    if (overlayOpen && overlayData) {
      overlayCard.innerHTML = overlayHtml(overlayData);
      const title = overlayCard.querySelector('#wheel-result-title');
      if (title) { try { title.focus({ preventScroll: true }); } catch (err) { title.focus(); } }
    }
  });

  /* ------------------------------------------------------------------
     Mount
     ------------------------------------------------------------------ */
  async function boot(isFirst) {
    if (busy) return;
    const r = await fetchConfig();
    await fontsReady(lang() === 'tn');
    if (busy) return;             // a play started while we waited
    const keepResult = !isFirst && r === 'ok' && (state === 'result' || state === 'cooldown');
    if (winnerIndex !== null) {
      const want = keepResult && stateData.data ? stateData.data.segmentId : null;
      if (!want || !segments[winnerIndex] || segments[winnerIndex].id !== want) { clearWinner(); targetIndex = null; }
    }
    drawDisc(true);
    renderInfo();
    if (isFirst) Fx.reveal([root.querySelector('.wheel-stage-col'), root.querySelector('.wheel-side'), root.querySelector('.wheel-info')], { stagger: 90 });

    // A play left in flight (reload, crash, lost network): re-POST it with the
    // SAME requestId. The server replays a stored result, even when paused.
    const pending = readPending();
    if (pending && r !== 'error:err_network') {
      loadLastPlay();
      runPlay(pending, { scroll: false });
      return;
    }
    if (keepResult) renderPanel();
    else if (r === 'ok') setState('form');
    else if (r === 'disabled') setState('disabled');
    else setState('error', { msg: r.slice(6) || 'err_generic', retry: 'config' });
    loadLastPlay();
  }

  // Public API (spec 4.3)
  window.BabkeWheel = {
    refresh: function () { return boot(false); }
  };

  drawDisc(true);                 // placeholder wheel while loading
  renderPanel();
  await boot(true);
});
