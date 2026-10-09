/* ==========================================================================
   OurBank shared UI: nav state, mobile menu, scroll reveals, counters,
   currency formatting, toasts. No scroll listeners; IntersectionObserver only.
   Exposed as window.OB for page scripts.
   ========================================================================== */
(function () {
  'use strict';

  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const OB = {
    get reduced() { return reducedQuery.matches; },
    easeOut: (t) => 1 - Math.pow(1 - t, 4),
  };

  /* ---------- Currency ---------- */
  OB.formatINR = function (amount, decimals = 2) {
    const n = Number(amount) || 0;
    return n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  /* Render a number into digit spans so counters keep a stable width. */
  OB.renderNumber = function (el, value, opts = {}) {
    const decimals = opts.decimals ?? 0;
    const prefix = opts.prefix ?? '';
    const suffix = opts.suffix ?? '';
    const str = OB.formatINR(value, decimals);
    let html = prefix ? `<span class="pre">${prefix}</span>` : '';
    for (const ch of str) {
      html += /\d/.test(ch) ? `<span class="d">${ch}</span>` : `<span class="sep">${ch}</span>`;
    }
    if (suffix) html += `<span class="suf">${suffix}</span>`;
    el.innerHTML = html;
  };

  /* Animate a number from its current value to target. Resolves when done. */
  OB.countTo = function (el, target, opts = {}) {
    const duration = opts.duration ?? 1400;
    const decimals = opts.decimals ?? 0;
    const from = opts.from ?? (parseFloat(el.dataset.value) || 0);
    el.dataset.value = String(target);
    if (OB.reduced || duration <= 0) {
      OB.renderNumber(el, target, opts);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const v = from + (target - from) * OB.easeOut(t);
        OB.renderNumber(el, t < 1 ? v : target, opts);
        if (t < 1) requestAnimationFrame(tick); else resolve();
      };
      requestAnimationFrame(tick);
    });
  };

  /* ---------- Toasts ---------- */
  let stack;
  OB.toast = function (message, tone = 'info', ms = 3600) {
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      stack.setAttribute('role', 'status');
      stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }
    const t = document.createElement('div');
    t.className = 'toast';
    t.dataset.tone = tone;
    t.textContent = message;
    stack.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, ms);
    return t;
  };

  /* ---------- Nav ---------- */
  function initNav() {
    const nav = document.querySelector('[data-nav]');
    if (!nav) return;
    let sentinel = document.querySelector('.nav-sentinel');
    if (!sentinel) {
      sentinel = document.createElement('div');
      sentinel.className = 'nav-sentinel';
      document.body.prepend(sentinel);
    }
    const io = new IntersectionObserver(([entry]) => {
      nav.classList.toggle('is-scrolled', !entry.isIntersecting);
    }, { threshold: 0 });
    io.observe(sentinel);

    // Adopt a dark treatment while a dark block sits under the nav bar.
    const darkBlocks = document.querySelectorAll('.dark, .site-footer, [data-nav-dark]');
    if (darkBlocks.length) {
      const under = new Set();
      const navH = () => nav.getBoundingClientRect().height || 72;
      const io2 = new IntersectionObserver((entries) => {
        entries.forEach((entry) => { if (entry.isIntersecting) under.add(entry.target); else under.delete(entry.target); });
        nav.classList.toggle('over-dark', under.size > 0);
      }, { rootMargin: `0px 0px -${Math.max(0, window.innerHeight - navH())}px 0px`, threshold: 0 });
      darkBlocks.forEach((el) => io2.observe(el));
    }

    const toggle = nav.querySelector('.nav-toggle');
    const menu = document.querySelector('.mobile-menu');
    if (toggle && menu) {
      const setOpen = (open) => {
        document.body.classList.toggle('menu-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        if (open) menu.querySelector('a')?.focus({ preventScroll: true });
      };
      toggle.addEventListener('click', () => setOpen(!document.body.classList.contains('menu-open')));
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { setOpen(false); toggle.focus(); } });
      menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
      window.matchMedia('(min-width: 768px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
    }
  }

  /* ---------- Reveals ---------- */
  function initReveal() {
    const els = document.querySelectorAll('[data-reveal], .lines, .draw');
    if (!els.length) return;
    if (OB.reduced || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (el.dataset.delay) el.style.setProperty('--d', el.dataset.delay + 'ms');
        el.classList.add('in');
        el.dispatchEvent(new CustomEvent('reveal'));
        io.unobserve(el);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    // Elements hugging the page bottom edge never clear the -8% margin; observe them plainly.
    const edge = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        entry.target.dispatchEvent(new CustomEvent('reveal'));
        edge.unobserve(entry.target);
      });
    }, { threshold: 0.05 });
    els.forEach((el) => (el.hasAttribute('data-reveal-edge') ? edge : io).observe(el));
  }

  /* ---------- Counters: [data-count="53500" data-prefix="₹" data-decimals="0" data-suffix="%"] ---------- */
  function initCounters() {
    const els = document.querySelectorAll('[data-count]');
    if (!els.length) return;
    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      const opts = { decimals: parseInt(el.dataset.decimals || '0', 10), prefix: el.dataset.prefix || '', suffix: el.dataset.suffix || '', duration: parseInt(el.dataset.duration || '1600', 10), from: parseFloat(el.dataset.from || '0') };
      OB.countTo(el, target, opts);
    };
    if (OB.reduced || !('IntersectionObserver' in window)) { els.forEach(run); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { run(entry.target); io.unobserve(entry.target); } });
    }, { threshold: 0.5 });
    els.forEach((el) => {
      const opts = { decimals: parseInt(el.dataset.decimals || '0', 10), prefix: el.dataset.prefix || '', suffix: el.dataset.suffix || '' };
      OB.renderNumber(el, parseFloat(el.dataset.from || '0'), opts);
      io.observe(el);
    });
  }

  /* ---------- Play/pause looping animations only while visible ---------- */
  OB.playWhileVisible = function (selector) {
    const els = document.querySelectorAll(selector);
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('playing', entry.isIntersecting));
    }, { threshold: 0.15 });
    els.forEach((el) => io.observe(el));
  };

  /* ---------- Pointer parallax: sets --mx/--my in [-1, 1] on the host ---------- */
  OB.pointerParallax = function (host, opts = {}) {
    if (!host || OB.reduced) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    let raf = 0, x = 0, y = 0;
    const apply = () => {
      raf = 0;
      host.style.setProperty('--mx', x.toFixed(3));
      host.style.setProperty('--my', y.toFixed(3));
    };
    host.addEventListener('pointermove', (e) => {
      const r = host.getBoundingClientRect();
      x = ((e.clientX - r.left) / r.width) * 2 - 1;
      y = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
    host.addEventListener('pointerleave', () => { x = 0; y = 0; if (!raf) raf = requestAnimationFrame(apply); });
    if (opts.onMove) host.addEventListener('pointermove', () => opts.onMove(x, y), { passive: true });
  };

  /* ---------- Session helpers shared by auth + dashboard ---------- */
  OB.session = {
    currentAccount: () => sessionStorage.getItem('loggedInAccNo'),
    getUser: (accno) => { const d = sessionStorage.getItem(accno); return d ? JSON.parse(d) : null; },
  };

  /* ---------- Theme (data-theme on <html>; bootstrap script in <head> sets it pre-paint) ---------- */
  const THEME_KEY = 'ob-theme';
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  OB.getTheme = () => document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  OB.setTheme = function (theme, persist = true) {
    const html = document.documentElement;
    html.classList.add('theme-switching');
    html.setAttribute('data-theme', theme);
    if (persist) { try { localStorage.setItem(THEME_KEY, theme); } catch (_) { /* storage blocked */ } }
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(theme === 'dark'));
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    });
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0d0b18' : '#f3f4fc');
    clearTimeout(OB._themeTimer);
    OB._themeTimer = setTimeout(() => html.classList.remove('theme-switching'), 420);
  };
  function initTheme() {
    let stored = null;
    try { stored = localStorage.getItem(THEME_KEY); } catch (_) { /* storage blocked */ }
    const html = document.documentElement;
    if (!html.hasAttribute('data-theme')) html.setAttribute('data-theme', stored || (darkQuery.matches ? 'dark' : 'light'));
    html.classList.remove('theme-switching');
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(OB.getTheme() === 'dark'));
      btn.setAttribute('aria-label', OB.getTheme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      btn.addEventListener('click', () => OB.setTheme(OB.getTheme() === 'dark' ? 'light' : 'dark'));
    });
    darkQuery.addEventListener('change', (e) => {
      let s = null; try { s = localStorage.getItem(THEME_KEY); } catch (_) {}
      if (!s) OB.setTheme(e.matches ? 'dark' : 'light', false);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNav();
    initReveal();
    initCounters();
    document.documentElement.classList.add('js');
    (document.fonts?.ready || Promise.resolve()).then(() => document.documentElement.classList.add('fonts-ready'));
  });

  window.OB = OB;
})();
