/* ==========================================================================
   BABKE — CUSTOM SELECT (progressive enhancement of every native <select>)
   --------------------------------------------------------------------------
   The real <select> stays in the DOM and stays the source of truth: it is
   still submitted, still validated (required), still read and written by the
   existing code (select.value = x, innerHTML = options, change listeners,
   form.reset()). It is made invisible (opacity 0, not removed) and a custom
   trigger button is laid exactly over it, so the page layout does not move.
   The popup listbox is rendered into document.body (position: fixed) so no
   overflow:hidden ancestor, table cell or modal can clip it.

   Sync, both ways:
   - custom UI -> select: choosing an option sets selectedIndex on the select
     and dispatches real, bubbling 'input' then 'change' events on it, so every
     existing (direct or delegated) listener fires as it did before.
   - select -> custom UI:
       * .value and .selectedIndex writes: an own-property accessor is defined
         on each enhanced select that calls the native setter, then refreshes
         the trigger synchronously (the "value hook").
       * options added / removed / relabelled, innerHTML replaced, disabled,
         hidden, required toggled: a MutationObserver on the select (children,
         subtree, attributes, text).
       * form.reset(): a document-level 'reset' listener refreshes after the
         browser has restored the defaults.
       * option.selected = true written directly on an <option> cannot be
         observed; the UI re-reads the select on every open, focus and change,
         and BabkeSelect.refresh(select) is there for anything else.
   New selects are picked up by a MutationObserver on document.body. A select
   is never enhanced twice (instances live in a WeakMap; a select cloned via
   innerHTML together with our markup is detected and re-enhanced cleanly).

   Opt out: <select data-native> or any ancestor with [data-native-selects].
   API: window.BabkeSelect = { enhance(root), refresh(select) }
   ========================================================================== */
(function () {
  'use strict';
  if (window.BabkeSelect) return;
  if (typeof HTMLSelectElement === 'undefined' || typeof MutationObserver === 'undefined') return;

  var VALUE = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
  var INDEX = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'selectedIndex');
  if (!VALUE || !INDEX) return;

  var instances = new WeakMap();   // select -> instance
  var live = new Set();            // instances currently attached (for theme resync)
  var uid = 0;
  var openInst = null;
  var sheetQuery = window.matchMedia ? window.matchMedia('(max-width: 560px)') : null;

  var CHEVRON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" focusable="false"><polyline points="6 9 12 15 18 9"></polyline></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" focusable="false"><polyline points="20 6 9 17 4 12"></polyline></svg>';

  // Computed properties of the (now invisible) select that the trigger mirrors,
  // so it matches the neighbouring inputs in every context and theme.
  var MIRROR = [
    ['--bs-src-bg', 'background-color'],
    ['--bs-src-color', 'color'],
    ['--bs-src-bc', 'border-top-color'],
    ['--bs-src-bw', 'border-top-width'],
    ['--bs-src-bs', 'border-top-style'],
    ['--bs-src-radius', 'border-top-left-radius'],
    ['--bs-src-font', 'font-family'],
    ['--bs-src-size', 'font-size'],
    ['--bs-src-weight', 'font-weight'],
    ['--bs-src-ls', 'letter-spacing'],
    ['--bs-src-pad', 'padding-left'],
    ['--bs-src-shadow', 'box-shadow']
  ];

  // How the select sat in its container: copied to the wrapper when not the
  // initial value, so the wrapper takes the select's place exactly.
  var OUTER = [
    ['flex-grow', '0'], ['flex-shrink', '1'], ['flex-basis', 'auto'],
    ['align-self', 'auto'], ['justify-self', 'auto'], ['order', '0'],
    ['grid-column-start', 'auto'], ['grid-column-end', 'auto'],
    ['grid-row-start', 'auto'], ['grid-row-end', 'auto'],
    ['vertical-align', 'baseline']
  ];
  // Width rules, read as specified (a percentage stays a percentage).
  var SIZE_PROPS = [['width', ['auto']], ['min-width', ['auto', '0px']], ['max-width', ['none']]];

  // getComputedStyle only reports specified widths (e.g. "100%") for an element
  // that is not rendered, so the select is hidden for the duration of the read.
  function specifiedSizes(sel) {
    var st = sel.style;
    var prev = st.getPropertyValue('display');
    var prio = st.getPropertyPriority('display');
    st.setProperty('display', 'none', 'important');
    var cs = getComputedStyle(sel);
    var out = {};
    SIZE_PROPS.forEach(function (p) { out[p[0]] = cs.getPropertyValue(p[0]); });
    if (prev) st.setProperty('display', prev, prio);
    else st.removeProperty('display');
    if (!st.length) sel.removeAttribute('style');
    return out;
  }

  function eligible(sel) {
    return sel instanceof HTMLSelectElement &&
      !sel.multiple && !(sel.size > 1) &&
      !sel.hasAttribute('data-native') &&
      !(sel.closest && sel.closest('[data-native-selects]')) &&
      !!sel.parentNode;
  }

  function isSheet() { return !!(sheetQuery && sheetQuery.matches); }

  function optionText(opt) {
    var t = opt.label || opt.text || '';
    return t.replace(/\s+/g, ' ').trim();
  }

  function isHiddenOption(opt) {
    return opt.hidden || (opt.style && opt.style.display === 'none');
  }

  function isDisabledOption(opt) {
    return opt.disabled || (opt.parentNode && opt.parentNode.tagName === 'OPTGROUP' && opt.parentNode.disabled);
  }

  function ensureId(el, prefix) {
    if (!el.id) el.id = prefix + (++uid);
    return el.id;
  }

  // --------------------------------------------------------------------------
  // Instance
  // --------------------------------------------------------------------------
  function Instance(sel) {
    this.sel = sel;
    this.id = ++uid;
    this.typed = '';
    this.typedAt = 0;
    this.pop = null;
    this.list = null;
    this.backdrop = null;
    this.active = -1;
    this.justInvalid = false;
    this.build();
  }

  Instance.prototype.build = function () {
    var sel = this.sel;
    var self = this;
    var cs = getComputedStyle(sel);

    var wrap = document.createElement('span');
    wrap.className = 'bs';
    var d = cs.display;
    if (d === 'block' || d === 'flex' || d === 'grid' || d === 'table' || d === 'list-item' || d === 'flow-root') {
      wrap.classList.add('bs--block');
    }
    if (sel.classList.contains('table-status-select') || sel.classList.contains('adm-sel-sm')) {
      wrap.classList.add('bs--compact');
    }
    // The wrapper takes over the select's outer box: its margins (the select
    // itself is zeroed inside it, so the trigger covers exactly the select's
    // border box), its flex/grid participation and vertical alignment.
    ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'].forEach(function (p) {
      var v = cs.getPropertyValue(p);
      if (v && v !== '0px') wrap.style.setProperty(p, v);
    });
    OUTER.forEach(function (p) {
      var v = cs.getPropertyValue(p[0]);
      if (v && v !== p[1]) wrap.style.setProperty(p[0], v);
    });
    this.wrap = wrap;
    // Width rules (width: 100%, min-width: 180px, media-query overrides...)
    // must keep resolving against the original container: see measure().
    var sizes = specifiedSizes(sel);

    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    this.applySizes(sizes);

    var trig = document.createElement('button');
    trig.type = 'button';
    trig.className = 'bs-trigger';
    trig.id = 'bs-trigger-' + this.id;
    trig.setAttribute('aria-haspopup', 'listbox');
    trig.setAttribute('aria-expanded', 'false');
    trig.innerHTML = '<span class="bs-value" id="bs-value-' + this.id + '"></span><span class="bs-chev" aria-hidden="true">' + CHEVRON + '</span>';
    wrap.appendChild(trig);

    this.wrap = wrap;
    this.trig = trig;
    this.valueEl = trig.firstChild;

    // Hide the native control from pointer and sequential focus; it is still
    // focusable by script, which the browser needs for required validation.
    sel.setAttribute('tabindex', '-1');
    sel.setAttribute('aria-hidden', 'true');
    sel.setAttribute('data-bs', '');
    sel.classList.add('bs-native');

    this.labelTrigger();

    // Value hooks: .value / .selectedIndex writes refresh the trigger.
    Object.defineProperty(sel, 'value', {
      configurable: true,
      enumerable: true,
      get: function () { return VALUE.get.call(this); },
      set: function (v) { VALUE.set.call(this, v); self.sync(); }
    });
    Object.defineProperty(sel, 'selectedIndex', {
      configurable: true,
      enumerable: true,
      get: function () { return INDEX.get.call(this); },
      set: function (v) { INDEX.set.call(this, v); self.sync(); }
    });

    this.mo = new MutationObserver(function () {
      self.labelTrigger();
      self.mirror();
      self.sync();
      if (openInst === self) self.renderList();
    });
    this.mo.observe(sel, { childList: true, subtree: true, attributes: true, characterData: true });

    sel.addEventListener('change', function () { self.clearInvalid(); self.sync(); });
    sel.addEventListener('input', function () { self.sync(); });
    sel.addEventListener('invalid', function () {
      self.wrap.classList.add('bs--invalid');
      self.justInvalid = true;
      setTimeout(function () { self.justInvalid = false; }, 400);
    });
    sel.addEventListener('focus', function () {
      // Focus reached the hidden select: by a <label for> click or by script.
      // When the browser focuses it to show a required-field bubble, keep
      // focus there (moving it would dismiss the bubble) and show the focus
      // ring on the trigger instead. Otherwise hand focus to the trigger.
      if (self.justInvalid) { self.wrap.classList.add('bs--focus'); return; }
      self.trig.focus();
    });
    sel.addEventListener('blur', function () { self.wrap.classList.remove('bs--focus'); });
    sel.addEventListener('keydown', function (e) {
      // Keyboard on the hidden select (after a validation focus) drives the
      // custom UI instead of the invisible native one; onTriggerKey cancels
      // the native default for every key it handles.
      if (e.key === 'Tab' || e.key === 'Shift' || e.ctrlKey || e.metaKey) return;
      self.trig.focus();
      self.onTriggerKey(e);
    });
    sel.addEventListener('mousedown', function (e) { e.preventDefault(); });

    trig.addEventListener('click', function (e) {
      e.preventDefault();
      if (openInst === self) self.close(true);
      else self.open();
    });
    trig.addEventListener('keydown', function (e) { self.onTriggerKey(e); });
    trig.addEventListener('focus', function () { self.sync(); });

    if (typeof ResizeObserver !== 'undefined') {
      // A media query that resizes the select can also change its font or
      // padding: re-mirror when its box changes.
      this.ro = new ResizeObserver(function () { self.mirror(); if (openInst === self) self.position(); });
      this.ro.observe(sel);
    }

    this.mirror();
    this.sync();
    instances.set(sel, this);
    live.add(this);
  };

  // Re-read the select's own width rules (after a resize crossed a media
  // query, for instance) and hand them to the wrapper again.
  Instance.prototype.measure = function () {
    var wrap = this.wrap;
    wrap.classList.remove('bs--sized');
    SIZE_PROPS.forEach(function (p) { wrap.style.removeProperty(p[0]); });
    this.applySizes(specifiedSizes(this.sel));
  };

  Instance.prototype.applySizes = function (sizes) {
    var wrap = this.wrap;
    var sized = false;
    SIZE_PROPS.forEach(function (p) {
      var v = sizes[p[0]];
      if (v && p[1].indexOf(v) === -1) { wrap.style.setProperty(p[0], v); sized = true; }
    });
    wrap.classList.toggle('bs--sized', sized);
  };

  Instance.prototype.labelTrigger = function () {
    var sel = this.sel;
    var ids = [];
    var labels = sel.labels ? Array.prototype.slice.call(sel.labels) : [];
    labels.forEach(function (l) { ids.push(ensureId(l, 'bs-label-')); });
    var aria = sel.getAttribute('aria-label');
    var labelledby = sel.getAttribute('aria-labelledby');
    if (labelledby) ids = labelledby.split(/\s+/).filter(Boolean).concat(ids);
    if (!ids.length && aria) {
      if (!this.ariaSpan) {
        this.ariaSpan = document.createElement('span');
        this.ariaSpan.className = 'bs-sr';
        this.ariaSpan.id = 'bs-aria-' + this.id;
        this.wrap.appendChild(this.ariaSpan);
      }
      this.ariaSpan.textContent = aria;
      ids.push(this.ariaSpan.id);
    }
    this.labelIds = ids.slice();
    ids.push(this.valueEl.id);
    this.trig.setAttribute('aria-labelledby', ids.join(' '));
    if (sel.required) this.trig.setAttribute('aria-required', 'true');
    else this.trig.removeAttribute('aria-required');
    if (sel.title) this.trig.title = sel.title;
  };

  Instance.prototype.mirror = function () {
    var cs = getComputedStyle(this.sel);
    var st = this.wrap.style;
    for (var i = 0; i < MIRROR.length; i++) {
      var v = cs.getPropertyValue(MIRROR[i][1]);
      if (v) st.setProperty(MIRROR[i][0], v);
    }
    this.wrap.setAttribute('dir', cs.direction === 'rtl' ? 'rtl' : 'ltr');
  };

  Instance.prototype.sync = function () {
    var sel = this.sel;
    if (!this.trig) return;
    var idx = INDEX.get.call(sel);
    var opt = idx >= 0 ? sel.options[idx] : null;
    var text = opt ? optionText(opt) : '';
    var placeholder = !opt || (opt.value === '' && (opt.disabled || opt.hidden || sel.required));
    if (this.valueEl.textContent !== text) this.valueEl.textContent = text || ' ';
    this.wrap.classList.toggle('bs--placeholder', !!placeholder);
    var disabled = sel.disabled || (sel.matches && sel.matches(':disabled'));
    this.trig.disabled = !!disabled;
    this.wrap.classList.toggle('bs--disabled', !!disabled);
    this.wrap.hidden = sel.hidden || sel.style.display === 'none';
    if (disabled && openInst === this) this.close(false);
    if (sel.validity && sel.validity.valid) this.clearInvalid();
  };

  Instance.prototype.clearInvalid = function () {
    if (this.wrap) this.wrap.classList.remove('bs--invalid');
  };

  // ---- keyboard ------------------------------------------------------------
  Instance.prototype.visibleIndexes = function () {
    var out = [];
    var opts = this.sel.options;
    for (var i = 0; i < opts.length; i++) if (!isHiddenOption(opts[i])) out.push(i);
    return out;
  };

  Instance.prototype.step = function (from, dir) {
    var idx = this.visibleIndexes();
    var opts = this.sel.options;
    var pos = idx.indexOf(from);
    if (pos === -1) pos = dir > 0 ? -1 : idx.length;
    for (var p = pos + dir; p >= 0 && p < idx.length; p += dir) {
      if (!isDisabledOption(opts[idx[p]])) return idx[p];
    }
    return from;
  };

  Instance.prototype.edge = function (last) {
    var idx = this.visibleIndexes();
    var opts = this.sel.options;
    if (last) idx.reverse();
    for (var i = 0; i < idx.length; i++) if (!isDisabledOption(opts[idx[i]])) return idx[i];
    return -1;
  };

  Instance.prototype.typeahead = function (ch, from) {
    var now = Date.now();
    this.typed = (now - this.typedAt > 700) ? ch : this.typed + ch;
    this.typedAt = now;
    var q = this.typed.toLocaleLowerCase();
    var opts = this.sel.options;
    var idx = this.visibleIndexes();
    // Repeating the same letter cycles through the options starting with it.
    var cycling = q.length > 1 && q.split('').every(function (c) { return c === q[0]; });
    var needle = cycling ? q[0] : q;
    var start = idx.indexOf(from);
    var offset = (q.length === 1 || cycling) ? 1 : 0;
    for (var n = 0; n < idx.length; n++) {
      var i = idx[(start + offset + n + idx.length) % idx.length];
      if (i === undefined) continue;
      var o = opts[i];
      if (isDisabledOption(o)) continue;
      if (optionText(o).toLocaleLowerCase().indexOf(needle) === 0) return i;
    }
    return -1;
  };

  Instance.prototype.onTriggerKey = function (e) {
    if (this.trig.disabled) return;
    if (openInst === this) { this.onListKey(e); return; }
    var k = e.key;
    if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ' || k === 'Spacebar' || (e.altKey && k === 'ArrowDown')) {
      e.preventDefault();
      this.open();
      return;
    }
    if (k === 'Home' || k === 'End') {
      e.preventDefault();
      this.open();
      this.setActive(this.edge(k === 'End'), true);
      return;
    }
    if (k && k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Type-ahead on the closed control picks directly, as a native select does.
      var i = this.typeahead(k, INDEX.get.call(this.sel));
      if (i >= 0) { e.preventDefault(); this.choose(i, false); }
    }
  };

  Instance.prototype.onListKey = function (e) {
    var k = e.key;
    var a = this.active;
    switch (k) {
      case 'ArrowDown': e.preventDefault(); this.setActive(this.step(a, 1), true); break;
      case 'ArrowUp':
        e.preventDefault();
        if (e.altKey) { this.choose(a, true); break; }
        this.setActive(this.step(a, -1), true); break;
      case 'Home': e.preventDefault(); this.setActive(this.edge(false), true); break;
      case 'End': e.preventDefault(); this.setActive(this.edge(true), true); break;
      case 'PageDown': e.preventDefault(); for (var i = 0; i < 8; i++) a = this.step(a, 1); this.setActive(a, true); break;
      case 'PageUp': e.preventDefault(); for (var j = 0; j < 8; j++) a = this.step(a, -1); this.setActive(a, true); break;
      case 'Enter': e.preventDefault(); this.choose(a, true); break;
      case ' ':
      case 'Spacebar':
        e.preventDefault();
        if (this.typed && Date.now() - this.typedAt < 700) { var t = this.typeahead(' ', a); if (t >= 0) this.setActive(t, true); }
        else this.choose(a, true);
        break;
      case 'Escape':
      case 'Esc':
        e.preventDefault();
        e.stopPropagation(); // don't let an admin modal close as well
        this.close(true);
        break;
      case 'Tab':
        // Close and put focus back on the trigger; the default Tab action then
        // moves on from there, keeping the page's tab order.
        this.close(true);
        break;
      default:
        if (k && k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          var m = this.typeahead(k, a);
          if (m >= 0) { e.preventDefault(); this.setActive(m, true); }
        }
    }
  };

  // ---- popup ---------------------------------------------------------------
  Instance.prototype.open = function () {
    if (openInst === this) return;
    if (openInst) openInst.close(false);
    if (this.trig.disabled || !this.sel.isConnected) return;
    this.sync();
    openInst = this;

    var sheet = isSheet();
    var pop = document.createElement('div');
    pop.className = 'bs-pop' + (sheet ? ' bs-pop--sheet' : '') + (this.wrap.classList.contains('bs--compact') ? ' bs-pop--compact' : '');
    pop.setAttribute('dir', this.wrap.getAttribute('dir') || 'ltr');
    pop.style.setProperty('--bs-src-font', this.wrap.style.getPropertyValue('--bs-src-font'));
    pop.style.setProperty('--bs-src-size', this.wrap.style.getPropertyValue('--bs-src-size'));

    if (sheet) {
      var backdrop = document.createElement('div');
      backdrop.className = 'bs-backdrop';
      backdrop.addEventListener('click', this.close.bind(this, true));
      document.body.appendChild(backdrop);
      this.backdrop = backdrop;
      var labelText = this.labelIds.map(function (id) {
        var el = document.getElementById(id);
        return el ? el.textContent.replace(/\*/g, '').replace(/\s+/g, ' ').trim() : '';
      }).filter(Boolean).join(' ');
      if (labelText) {
        var head = document.createElement('div');
        head.className = 'bs-sheet-head';
        head.textContent = labelText;
        pop.appendChild(head);
      }
    }

    var list = document.createElement('ul');
    list.className = 'bs-list';
    list.id = 'bs-list-' + this.id;
    list.setAttribute('role', 'listbox');
    list.setAttribute('tabindex', '-1');
    if (this.labelIds.length) list.setAttribute('aria-labelledby', this.labelIds.join(' '));
    pop.appendChild(list);

    var self = this;
    list.addEventListener('keydown', function (e) { self.onListKey(e); });
    list.addEventListener('click', function (e) {
      var li = e.target.closest && e.target.closest('[role="option"]');
      if (!li || li.getAttribute('aria-disabled') === 'true') return;
      self.choose(Number(li.getAttribute('data-index')), true);
    });
    list.addEventListener('pointermove', function (e) {
      var li = e.target.closest && e.target.closest('[role="option"]');
      if (li && li.getAttribute('aria-disabled') !== 'true') {
        var i = Number(li.getAttribute('data-index'));
        if (i !== self.active) self.setActive(i, false);
      }
    });
    // Keep focus in the listbox when an option is pressed.
    list.addEventListener('mousedown', function (e) { e.preventDefault(); });

    this.pop = pop;
    this.list = list;
    this.renderList();
    document.body.appendChild(pop);
    this.position();

    this.trig.setAttribute('aria-expanded', 'true');
    this.trig.setAttribute('aria-controls', list.id);
    this.wrap.classList.add('bs--open');

    var sIdx = INDEX.get.call(this.sel);
    var start = (sIdx >= 0 && !isDisabledOption(this.sel.options[sIdx]) && !isHiddenOption(this.sel.options[sIdx])) ? sIdx : this.edge(false);
    this.setActive(start, true, true);
    list.focus({ preventScroll: true });

    requestAnimationFrame(function () { if (self.pop === pop) pop.classList.add('bs-pop--in'); });
  };

  Instance.prototype.renderList = function () {
    var list = this.list;
    if (!list) return;
    var sel = this.sel;
    var opts = sel.options;
    var cur = INDEX.get.call(sel);
    var frag = document.createDocumentFragment();
    var lastGroup = null;
    var groupUl = null;
    for (var i = 0; i < opts.length; i++) {
      var o = opts[i];
      if (isHiddenOption(o)) continue;
      var parent = o.parentNode && o.parentNode.tagName === 'OPTGROUP' ? o.parentNode : null;
      if (parent !== lastGroup) {
        lastGroup = parent;
        if (parent) {
          var g = document.createElement('li');
          g.setAttribute('role', 'group');
          g.className = 'bs-group';
          var gl = document.createElement('div');
          gl.className = 'bs-group-label';
          gl.id = 'bs-g-' + this.id + '-' + i;
          gl.setAttribute('role', 'presentation');
          gl.textContent = parent.label || '';
          g.setAttribute('aria-labelledby', gl.id);
          g.appendChild(gl);
          groupUl = document.createElement('ul');
          groupUl.setAttribute('role', 'presentation');
          g.appendChild(groupUl);
          frag.appendChild(g);
        } else {
          groupUl = null;
        }
      }
      var li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.id = 'bs-opt-' + this.id + '-' + i;
      li.setAttribute('data-index', String(i));
      li.className = 'bs-option';
      var selected = i === cur;
      li.setAttribute('aria-selected', selected ? 'true' : 'false');
      if (isDisabledOption(o)) li.setAttribute('aria-disabled', 'true');
      if (o.value === '' && selected === false && i === 0 && sel.required) li.classList.add('bs-option--placeholder');
      var span = document.createElement('span');
      span.className = 'bs-option-text';
      span.textContent = optionText(o) || ' '; // textContent: option text is never parsed as HTML
      li.appendChild(span);
      var tick = document.createElement('span');
      tick.className = 'bs-check';
      tick.setAttribute('aria-hidden', 'true');
      tick.innerHTML = CHECK;
      li.appendChild(tick);
      (groupUl || frag).appendChild(li);
    }
    list.textContent = '';
    list.appendChild(frag);
    if (this.active >= 0) this.setActive(this.active, false, true);
  };

  Instance.prototype.setActive = function (i, scroll, instant) {
    if (!this.list) return;
    var prev = this.list.querySelector('.bs-option.is-active');
    if (prev) prev.classList.remove('is-active');
    this.active = i;
    var li = i >= 0 ? document.getElementById('bs-opt-' + this.id + '-' + i) : null;
    if (!li) { this.list.removeAttribute('aria-activedescendant'); return; }
    li.classList.add('is-active');
    this.list.setAttribute('aria-activedescendant', li.id);
    if (scroll) {
      var lt = this.list.scrollTop, lh = this.list.clientHeight;
      var top = li.offsetTop, bottom = top + li.offsetHeight;
      if (instant) {
        if (top < lt || bottom > lt + lh) this.list.scrollTop = Math.max(0, top - (lh - li.offsetHeight) / 2);
      } else if (top < lt) this.list.scrollTop = top - 4;
      else if (bottom > lt + lh) this.list.scrollTop = bottom - lh + 4;
    }
  };

  Instance.prototype.position = function () {
    var pop = this.pop;
    if (!pop || pop.classList.contains('bs-pop--sheet')) return;
    var r = this.trig.getBoundingClientRect();
    var vw = document.documentElement.clientWidth || window.innerWidth;
    var vh = window.innerHeight;
    if (r.bottom < 0 || r.top > vh || (r.width === 0 && r.height === 0)) { this.close(false); return; }
    var gap = 6, margin = 8;
    pop.style.minWidth = Math.round(r.width) + 'px';
    pop.style.maxWidth = Math.max(160, vw - margin * 2) + 'px';
    var list = this.list;
    list.style.maxHeight = '';
    var natural = Math.min(list.scrollHeight + 2, 320);
    var below = vh - r.bottom - gap - margin;
    var above = r.top - gap - margin;
    var up = below < Math.min(natural, 180) && above > below;
    var room = Math.max(96, up ? above : below);
    list.style.maxHeight = Math.min(320, room) + 'px';
    pop.classList.toggle('bs-pop--up', up);
    var w = pop.offsetWidth;
    var h = pop.offsetHeight;
    var rtl = pop.getAttribute('dir') === 'rtl';
    var left = rtl ? r.right - w : r.left;
    left = Math.min(Math.max(margin, left), vw - w - margin);
    var top = up ? r.top - gap - h : r.bottom + gap;
    pop.style.left = Math.round(left) + 'px';
    pop.style.top = Math.round(top) + 'px';
  };

  Instance.prototype.choose = function (i, fromPopup) {
    var sel = this.sel;
    var o = sel.options[i];
    if (!o || isDisabledOption(o)) { if (fromPopup) this.close(true); return; }
    var changed = INDEX.get.call(sel) !== i;
    if (fromPopup) this.close(true);
    if (!changed) return;
    INDEX.set.call(sel, i);
    this.sync();
    sel.dispatchEvent(new Event('input', { bubbles: true }));
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  };

  Instance.prototype.close = function (refocus) {
    if (openInst === this) openInst = null;
    var pop = this.pop;
    this.pop = null;
    this.list = null;
    this.active = -1;
    if (pop && pop.parentNode) pop.parentNode.removeChild(pop);
    if (this.backdrop && this.backdrop.parentNode) this.backdrop.parentNode.removeChild(this.backdrop);
    this.backdrop = null;
    if (this.trig) {
      this.trig.setAttribute('aria-expanded', 'false');
      this.trig.removeAttribute('aria-controls');
      this.wrap.classList.remove('bs--open');
      if (refocus && this.trig.isConnected && !this.trig.disabled) this.trig.focus({ preventScroll: true });
    }
  };

  // --------------------------------------------------------------------------
  // Clone cleanup: a select carrying our marker but unknown to us was copied
  // (with our wrapper) through innerHTML/cloneNode. Unwrap it, then enhance.
  // --------------------------------------------------------------------------
  function unwrapClone(sel) {
    var wrap = sel.parentNode;
    if (wrap && wrap.classList && wrap.classList.contains('bs') && wrap.parentNode) {
      var trig = wrap.querySelector('.bs-trigger');
      if (trig) trig.remove();
      var sr = wrap.querySelector('.bs-sr');
      if (sr) sr.remove();
      wrap.parentNode.insertBefore(sel, wrap);
      wrap.remove();
    }
    sel.removeAttribute('data-bs');
    sel.removeAttribute('aria-hidden');
    sel.removeAttribute('tabindex');
    sel.classList.remove('bs-native');
  }

  function enhanceSelect(sel) {
    if (!eligible(sel) || instances.has(sel)) return;
    if (sel.hasAttribute('data-bs')) unwrapClone(sel);
    try { new Instance(sel); } catch (err) { if (window.console) console.warn('BabkeSelect: could not enhance', sel, err); }
  }

  function enhance(root) {
    root = root || document;
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.tagName === 'SELECT') { enhanceSelect(root); return; }
    var sels = root.querySelectorAll('select');
    for (var i = 0; i < sels.length; i++) enhanceSelect(sels[i]);
  }

  function refresh(sel) {
    if (!sel) {
      live.forEach(function (inst) { if (inst.sel.isConnected) { inst.labelTrigger(); inst.mirror(); inst.sync(); } });
      return;
    }
    var inst = instances.get(sel);
    if (!inst) { enhanceSelect(sel); return; }
    inst.labelTrigger();
    inst.mirror();
    inst.sync();
    if (openInst === inst) inst.renderList();
  }

  // --------------------------------------------------------------------------
  // Global wiring
  // --------------------------------------------------------------------------
  function prune() {
    live.forEach(function (inst) { if (!inst.sel.isConnected) live.delete(inst); });
    if (openInst && !openInst.sel.isConnected) openInst.close(false);
  }

  var bodyMo = new MutationObserver(function (records) {
    var removed = false;
    for (var r = 0; r < records.length; r++) {
      var rec = records[r];
      var added = rec.addedNodes;
      for (var i = 0; i < added.length; i++) {
        var n = added[i];
        if (n.nodeType !== 1) continue;
        if (n.tagName === 'SELECT') enhanceSelect(n);
        else if (n.firstElementChild) enhance(n);
      }
      if (rec.removedNodes.length) removed = true;
    }
    if (removed) prune();
  });

  function start() {
    enhance(document);
    bodyMo.observe(document.body, { childList: true, subtree: true });
    // Theme or direction flip (class / dir / data-theme on <html> or <body>,
    // e.g. body.light-theme, body.rtl-active): re-mirror every trigger.
    var themeMo = new MutationObserver(function () { refresh(); });
    var themeAttrs = { attributes: true, attributeFilter: ['class', 'dir', 'data-theme', 'lang'] };
    themeMo.observe(document.documentElement, themeAttrs);
    themeMo.observe(document.body, themeAttrs);
  }

  document.addEventListener('pointerdown', function (e) {
    if (!openInst) return;
    var t = e.target;
    if (openInst.pop && openInst.pop.contains(t)) return;
    if (openInst.trig.contains(t)) return;
    if (openInst.backdrop && openInst.backdrop === t) return;
    openInst.close(false);
  }, true);

  document.addEventListener('reset', function (e) {
    var form = e.target;
    setTimeout(function () {
      if (!form.querySelectorAll) return;
      var sels = form.querySelectorAll('select[data-bs]');
      for (var i = 0; i < sels.length; i++) refresh(sels[i]);
    }, 0);
  }, true);

  window.addEventListener('scroll', function (e) {
    if (!openInst) return;
    if (openInst.pop && e.target && e.target.nodeType === 1 && openInst.pop.contains(e.target)) return;
    openInst.position();
  }, true);
  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      live.forEach(function (inst) { if (inst.sel.isConnected) inst.measure(); });
    }, 150);
    if (!openInst) return;
    // Crossing the phone breakpoint switches between popup and bottom sheet.
    var wantSheet = isSheet();
    var isSheetNow = openInst.pop && openInst.pop.classList.contains('bs-pop--sheet');
    if (wantSheet !== !!isSheetNow) { var inst = openInst; inst.close(false); inst.open(); return; }
    openInst.position();
  });
  window.addEventListener('blur', function () { if (openInst) openInst.close(false); });

  window.BabkeSelect = { enhance: enhance, refresh: refresh };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
