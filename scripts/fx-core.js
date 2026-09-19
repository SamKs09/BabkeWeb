/* =====================================================================
   Babke landing: shared FX core for the loyalty card, prize wheel and
   menu book. Exposes window.BabkeFx. Plain classic script, no build step.

   Load order (index.html, deferred):
     scripts/vendor/qrcode-generator.js  -> global qrcode (used lazily)
     scripts/fx-core.js                   -> window.BabkeFx
     scripts/loyalty.js / wheel.js / menubook.js

   Security notes:
   - esc() is the only HTML escaper the feature scripts need. t() and loc()
     return RAW strings: escape them before any innerHTML interpolation.
   - api() is same-origin only and never renders or logs server messages.
   - normalizePhone() is a byte-for-byte copy of the server's normalizePhone
     (server.js, spec 2.1). Change both together or not at all.
   ===================================================================== */
(function () {
  'use strict';

  var LANGS = { en: 1, fr: 1, tn: 1 };

  /* ---------- language + i18n ---------- */

  function getLang() {
    var l = null;
    try { l = window.localStorage.getItem('babke_lang'); } catch (e) { l = null; }
    return (l && Object.prototype.hasOwnProperty.call(LANGS, l)) ? l : 'en';
  }

  function toStr(v) {
    if (v == null) return '';
    return typeof v === 'string' ? v : String(v);
  }

  // Trilingual field -> string. Strings pass through; {fr,en,tn} objects pick
  // the requested language, then fr, then en, then tn.
  function loc(field, lang) {
    if (field == null) return '';
    if (typeof field === 'string') return field;
    if (typeof field === 'object') {
      var l = lang || getLang();
      return toStr(field[l] || field.fr || field.en || field.tn || '');
    }
    return toStr(field);
  }

  var ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s) {
    return toStr(s).replace(/[&<>"']/g, function (c) { return ESC_MAP[c]; });
  }

  // dict[lang][key] || dict.fr[key] || dict.en[key] || key, then {var} replacement.
  // Unknown {placeholders} are left as-is. The result is NOT escaped.
  function t(dict, key, vars, lang) {
    var l = lang || getLang();
    var d = dict || {};
    var s = (d[l] && d[l][key]) || (d.fr && d.fr[key]) || (d.en && d.en[key]) || key;
    s = toStr(s);
    if (vars && typeof vars === 'object') {
      s = s.replace(/\{(\w+)\}/g, function (m, name) {
        return Object.prototype.hasOwnProperty.call(vars, name) ? toStr(vars[name]) : m;
      });
    }
    return s;
  }

  /* ---------- reduced motion ---------- */

  var rmMql = null;
  function getRmMql() {
    if (rmMql) return rmMql;
    try {
      if (window.matchMedia) rmMql = window.matchMedia('(prefers-reduced-motion: reduce)');
    } catch (e) { rmMql = null; }
    return rmMql;
  }

  function reducedMotion() {
    var m = getRmMql();
    return !!(m && m.matches);
  }

  // Calls fn(isReduced) whenever the OS setting changes. Returns an unsubscribe function.
  function onReducedMotionChange(fn) {
    var m = getRmMql();
    if (!m || typeof fn !== 'function') return function () {};
    var handler = function (e) { fn(!!(e && typeof e.matches === 'boolean' ? e.matches : m.matches)); };
    if (m.addEventListener) {
      m.addEventListener('change', handler);
      return function () { m.removeEventListener('change', handler); };
    }
    if (m.addListener) { // Safari < 14
      m.addListener(handler);
      return function () { m.removeListener(handler); };
    }
    return function () {};
  }

  /* ---------- easing ---------- */

  // CSS cubic-bezier(x1,y1,x2,y2) as a function of progress t in [0,1].
  // Solves x(s) = t with Newton-Raphson, falling back to bisection, then returns y(s).
  function bezier(x1, y1, x2, y2) {
    x1 = Math.min(1, Math.max(0, +x1 || 0));
    x2 = Math.min(1, Math.max(0, +x2 || 0));
    y1 = +y1 || 0;
    y2 = +y2 || 0;
    if (x1 === y1 && x2 === y2) return function (p) { return p <= 0 ? 0 : p >= 1 ? 1 : p; };

    var cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    var cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    function sampleX(s) { return ((ax * s + bx) * s + cx) * s; }
    function sampleY(s) { return ((ay * s + by) * s + cy) * s; }
    function slopeX(s) { return (3 * ax * s + 2 * bx) * s + cx; }

    function solveX(x) {
      var s = x, i, err, d;
      for (i = 0; i < 8; i++) {                     // Newton-Raphson
        err = sampleX(s) - x;
        if (Math.abs(err) < 1e-7) return s;
        d = slopeX(s);
        if (Math.abs(d) < 1e-6) break;
        s -= err / d;
        if (s < 0 || s > 1) break;                  // left the unit interval: bisect instead
      }
      var lo = 0, hi = 1;                           // bisection fallback
      s = x;
      for (i = 0; i < 40; i++) {
        err = sampleX(s) - x;
        if (Math.abs(err) < 1e-7) return s;
        if (err > 0) hi = s; else lo = s;
        s = (lo + hi) / 2;
      }
      return s;
    }

    return function (p) {
      p = +p;
      if (!(p > 0)) return 0;
      if (p >= 1) return 1;
      return sampleY(solveX(p));
    };
  }

  var ease = {
    power2Out: function (t) { return 1 - (1 - t) * (1 - t); },
    cubicInOut: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    linear: function (t) { return t; }
  };

  /* ---------- tween (rAF) ---------- */

  var raf = window.requestAnimationFrame
    ? function (f) { return window.requestAnimationFrame(f); }
    : function (f) { return window.setTimeout(function () { f(now()); }, 16); };
  var caf = window.cancelAnimationFrame
    ? function (id) { window.cancelAnimationFrame(id); }
    : function (id) { window.clearTimeout(id); };
  function now() {
    return (window.performance && performance.now) ? performance.now() : Date.now();
  }

  // tween({ from, to, duration(ms), ease, onUpdate, onDone }) -> cancel()
  // duration 0 (or less / invalid) => onUpdate(to); onDone() synchronously.
  // cancel() stops the tween; onDone is not called after a cancel.
  function tween(opts) {
    var o = opts || {};
    var from = Number(o.from); if (!isFinite(from)) from = 0;
    var to = Number(o.to); if (!isFinite(to)) to = 0;
    var duration = Number(o.duration);
    var easeFn = typeof o.ease === 'function' ? o.ease : ease.linear;
    var onUpdate = typeof o.onUpdate === 'function' ? o.onUpdate : function () {};
    var onDone = typeof o.onDone === 'function' ? o.onDone : function () {};

    if (!(duration > 0)) {
      onUpdate(to);
      onDone();
      return function () {};
    }

    var cancelled = false, id = null, t0 = now();
    function frame() {
      if (cancelled) return;
      var p = (now() - t0) / duration;
      if (p >= 1) {
        id = null;
        onUpdate(to);
        onDone();
        return;
      }
      if (p < 0) p = 0;
      onUpdate(from + (to - from) * easeFn(p));
      if (!cancelled) id = raf(frame);
    }
    id = raf(frame);
    return function cancel() {
      cancelled = true;
      if (id != null) { caf(id); id = null; }
    };
  }

  /* ---------- api (same-origin JSON) ---------- */

  // Never throws. Resolves { ok, status, data }; a network failure resolves
  // { ok:false, status:0, data:{ error:'network' } }. data is always an object
  // (or a JSON array): empty or non-JSON bodies, e.g. a proxy's HTML 502, give {}.
  function api(path, opts) {
    var o = opts || {};
    var networkFail = function () { return { ok: false, status: 0, data: { error: 'network' } }; };
    try {
      var method = String(o.method || 'GET').toUpperCase();
      var headers = { 'Accept': 'application/json' };
      if (o.headers && typeof o.headers === 'object') {
        Object.keys(o.headers).forEach(function (k) {
          if (o.headers[k] != null) headers[k] = String(o.headers[k]);
        });
      }
      var init = {
        method: method,
        headers: headers,
        credentials: 'same-origin',
        mode: 'same-origin',
        cache: 'no-store'
      };
      if (o.body !== undefined && method !== 'GET' && method !== 'HEAD') {
        headers['Content-Type'] = 'application/json';
        init.body = JSON.stringify(o.body);
      }
      if (typeof fetch !== 'function') return Promise.resolve(networkFail());
      return fetch(path, init).then(function (res) {
        return res.text().then(function (txt) {
          var data = {};
          if (txt) {
            try {
              var parsed = JSON.parse(txt);
              data = (parsed && typeof parsed === 'object') ? parsed : {};
            } catch (e) { data = {}; }
          }
          return { ok: !!res.ok, status: res.status, data: data };
        }, function () {
          return { ok: !!res.ok, status: res.status, data: {} };
        });
      }, networkFail).catch(networkFail);
    } catch (e) {
      return Promise.resolve(networkFail());
    }
  }

  /* ---------- phone, price, date ---------- */

  // PHONE: identical to server.js normalizePhone (spec 2.1). Canonical form = 8 Tunisian digits, first digit 2-9.
  function normalizePhone(raw) {
    let s = String(raw == null ? '' : raw).replace(/[\s\-.()\/\u00A0]/g, '');
    if (s.startsWith('+216')) s = s.slice(4);
    else if (s.startsWith('00216')) s = s.slice(5);
    else if (s.length === 11 && s.startsWith('216')) s = s.slice(3);
    return /^[2-9]\d{7}$/.test(s) ? s : null;
  }

  function formatPhone(p) {
    var s = toStr(p);
    return '+216 ' + s.slice(0, 2) + ' ' + s.slice(2, 5) + ' ' + s.slice(5);
  }

  function fmtPrice(n) {
    var v = Number(n);
    if (!isFinite(v)) v = 0;
    return v.toFixed(1) + ' TND';
  }

  function fmtDate(iso, lang) {
    if (iso == null || iso === '') return '';
    var d = iso instanceof Date ? iso : new Date(iso);
    if (isNaN(d.getTime())) return '';
    var l = lang || getLang();
    var locale = l === 'tn' ? 'ar-TN' : l === 'fr' ? 'fr-FR' : 'en-GB';
    try {
      return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return d.toISOString().slice(0, 10);
    }
  }

  /* ---------- localStorage ---------- */

  // Objects/arrays are stored as JSON; strings, numbers and booleans as String(v).
  // get() parses only values that look like JSON objects/arrays, so a stored
  // token string always comes back byte-identical. Every call is try/catch.
  var store = {
    get: function (k) {
      var raw;
      try { raw = window.localStorage.getItem(k); } catch (e) { return null; }
      if (raw == null) return null;
      var c = raw.charAt(0);
      if (c === '{' || c === '[') {
        try { return JSON.parse(raw); } catch (e) { return null; }
      }
      return raw;
    },
    set: function (k, v) {
      if (v == null) return store.remove(k);
      try {
        window.localStorage.setItem(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
        return true;
      } catch (e) { return false; }
    },
    remove: function (k) {
      try { window.localStorage.removeItem(k); return true; } catch (e) { return false; }
    }
  };

  /* ---------- ids ---------- */

  function uuid() {
    var c = window.crypto || window.msCrypto;
    try {
      if (c && typeof c.randomUUID === 'function') return c.randomUUID();
    } catch (e) { /* insecure context: fall through */ }
    var bytes = new Array(16), i;
    try {
      if (c && typeof c.getRandomValues === 'function') {
        var u8 = new Uint8Array(16);
        c.getRandomValues(u8);
        for (i = 0; i < 16; i++) bytes[i] = u8[i];
      } else {
        throw new Error('no crypto');
      }
    } catch (e) {
      // Idempotency key only, never a secret.
      for (i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    var hex = '';
    for (i = 0; i < 16; i++) hex += (bytes[i] < 16 ? '0' : '') + bytes[i].toString(16);
    return hex;
  }

  /* ---------- QR as SVG ---------- */

  // One <path> of dark modules, viewBox 0 0 n n, no quiet zone (the wrapper supplies it).
  // Returns '' if the vendored qrcode library is missing or the text cannot be encoded.
  function qrSvg(text, px) {
    if (typeof qrcode !== 'function') return '';
    var qr, n;
    try {
      qr = qrcode(0, 'M');
      qr.addData(toStr(text));
      qr.make();
      n = qr.getModuleCount();
    } catch (e) {
      return '';
    }
    var d = '';
    for (var r = 0; r < n; r++) {
      var c = 0;
      while (c < n) {
        if (qr.isDark(r, c)) {
          var start = c;
          while (c < n && qr.isDark(r, c)) c++;
          var len = c - start;
          d += 'M' + start + ' ' + r + 'h' + len + 'v1h-' + len + 'z';
        } else {
          c++;
        }
      }
    }
    var size = Number(px);
    size = size > 0 ? Math.round(size) : n * 4;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size +
      '" viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges" focusable="false">' +
      '<path fill="#0a0908" d="' + d + '"/></svg>';
  }

  /* ---------- scroll reveal ---------- */

  function toElementList(elements) {
    if (!elements) return [];
    if (elements.nodeType === 1) return [elements];
    var out = [];
    try {
      for (var i = 0; i < elements.length; i++) {
        if (elements[i] && elements[i].nodeType === 1) out.push(elements[i]);
      }
    } catch (e) { /* not array-like */ }
    return out;
  }

  // Adds .fx-reveal, then .fx-in (with --fx-delay) once each element scrolls into view.
  // Elements entering together are staggered in the order they were passed.
  // Reduced motion or no IntersectionObserver => .fx-in immediately.
  function reveal(elements, opts) {
    var o = opts || {};
    var stagger = Number(o.stagger);
    if (!isFinite(stagger) || stagger < 0) stagger = 90;
    var list = toElementList(elements).filter(function (el) { return !el.classList.contains('fx-in'); });
    if (!list.length) return;

    var order = new Map();
    list.forEach(function (el, i) {
      order.set(el, i);
      el.classList.add('fx-reveal');
    });

    var showNow = function (el, delay) {
      el.style.setProperty('--fx-delay', Math.max(0, Math.round(delay)) + 'ms');
      el.classList.add('fx-in');
    };

    if (reducedMotion() || typeof window.IntersectionObserver !== 'function') {
      list.forEach(function (el) { showNow(el, 0); });
      return;
    }

    var pending = list.length;
    var io = new IntersectionObserver(function (entries) {
      var entering = entries
        .filter(function (en) { return en.isIntersecting || en.intersectionRatio > 0; })
        .map(function (en) { return en.target; })
        .sort(function (a, b) { return order.get(a) - order.get(b); });
      var reduced = reducedMotion();
      entering.forEach(function (el, i) {
        io.unobserve(el);
        showNow(el, reduced ? 0 : i * stagger);
        pending--;
      });
      if (pending <= 0) io.disconnect();
    }, { rootMargin: '0px 0px -12% 0px' });

    list.forEach(function (el) { io.observe(el); });
  }

  /* ---------- scroll lock ---------- */

  var lockCount = 0;
  function lockScroll() {
    lockCount++;
    if (lockCount === 1 && document.body) document.body.style.overflow = 'hidden';
  }
  function unlockScroll() {
    if (lockCount === 0) return;
    lockCount--;
    if (lockCount === 0 && document.body) document.body.style.overflow = '';
  }

  /* ---------- focus trap ---------- */

  var FOCUSABLE = 'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), ' +
    'select:not([disabled]), textarea:not([disabled]), iframe, audio[controls], video[controls], ' +
    '[contenteditable]:not([contenteditable="false"]), [tabindex]';
  var trapStack = [];

  function focusables(container) {
    var nodes = container.querySelectorAll(FOCUSABLE), out = [];
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.tabIndex < 0) continue;
      if (el.closest && el.closest('[inert]')) continue;
      if (!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)) continue;
      out.push(el);
    }
    return out;
  }

  function focusEl(el) {
    try { el.focus({ preventScroll: true }); } catch (e) { try { el.focus(); } catch (e2) { /* ignore */ } }
  }

  // Keeps Tab / Shift+Tab inside container. Moves focus in if it is outside.
  // Call it after the container is visible (.open), or the initial focus is lost.
  // release() removes the trap and restores the previously focused element.
  // Traps stack: only the most recent un-released trap handles Tab.
  function trapFocus(container) {
    if (!container || container.nodeType !== 1) return function () {};
    var previous = document.activeElement;
    var trap = { container: container };
    trapStack.push(trap);

    var onKey = function (e) {
      if (e.key !== 'Tab' || trapStack[trapStack.length - 1] !== trap) return;
      var items = focusables(container);
      var active = document.activeElement;
      if (!items.length) {
        e.preventDefault();
        if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1');
        focusEl(container);
        return;
      }
      var first = items[0], last = items[items.length - 1];
      var inside = container.contains(active);
      if (e.shiftKey) {
        if (!inside || active === first || active === container) { e.preventDefault(); focusEl(last); }
      } else if (!inside || active === last) {
        e.preventDefault(); focusEl(first);
      }
    };
    document.addEventListener('keydown', onKey, true);

    if (!container.contains(document.activeElement)) {
      var items = focusables(container);
      if (items.length) focusEl(items[0]);
      else {
        if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1');
        focusEl(container);
      }
    }

    var released = false;
    return function release() {
      if (released) return;
      released = true;
      document.removeEventListener('keydown', onKey, true);
      var idx = trapStack.indexOf(trap);
      if (idx !== -1) trapStack.splice(idx, 1);
      if (previous && previous !== document.body && typeof previous.focus === 'function' &&
          document.documentElement.contains(previous)) {
        focusEl(previous);
      }
    };
  }

  window.BabkeFx = {
    getLang: getLang,
    loc: loc,
    esc: esc,
    t: t,
    reducedMotion: reducedMotion,
    onReducedMotionChange: onReducedMotionChange,
    bezier: bezier,
    ease: ease,
    tween: tween,
    api: api,
    normalizePhone: normalizePhone,
    formatPhone: formatPhone,
    fmtPrice: fmtPrice,
    fmtDate: fmtDate,
    store: store,
    uuid: uuid,
    qrSvg: qrSvg,
    reveal: reveal,
    lockScroll: lockScroll,
    unlockScroll: unlockScroll,
    trapFocus: trapFocus
  };
})();
