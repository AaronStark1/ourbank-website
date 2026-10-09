/* ==========================================================================
   OurBank homepage: hero choreography, pointer parallax, looping money
   movement (only while visible), service strip interactions.
   ========================================================================== */
(function () {
  'use strict';
  const OB = window.OB;

  function initHero() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const title = hero.querySelector('.lines');
    const big = document.getElementById('hero-big');
    const delta = document.getElementById('hero-delta');

    const start = () => {
      hero.classList.add('ready');
      title?.classList.add('in');
      if (!big) return;
      if (OB.reduced) {
        OB.renderNumber(big, 53500, { prefix: '₹' });
        delta?.classList.add('show');
        return;
      }
      OB.renderNumber(big, 50000, { prefix: '₹' });
      setTimeout(() => {
        OB.countTo(big, 53500, { from: 50000, prefix: '₹', duration: 1500 }).then(() => delta?.classList.add('show'));
      }, 1600);
    };

    // Wait for fonts so the masked line reveal does not jump on font swap.
    const ready = document.fonts?.ready || Promise.resolve();
    let started = false;
    const go = () => { if (!started) { started = true; start(); } };
    ready.then(go);
    setTimeout(go, 700); // safety net if fonts are slow

    OB.pointerParallax(hero.querySelector('.hero-viz') ? hero : null);

    // Pause the SMIL particle loop while the hero is offscreen.
    const svg = hero.querySelector('.viz-path svg');
    if (svg && 'IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        try { e.isIntersecting ? svg.unpauseAnimations() : svg.pauseAnimations(); } catch (_) { /* older engines */ }
      }, { threshold: 0 }).observe(hero);
    }
  }

  function initServiceStrips() {
    const services = Array.from(document.querySelectorAll('.service'));
    if (!services.length) return;
    const setActive = (svc, active) => {
      svc.classList.toggle('is-active', active);
      svc.querySelector('.service-toggle')?.setAttribute('aria-expanded', String(active));
    };
    services.forEach((svc) => {
      const toggle = svc.querySelector('.service-toggle');
      toggle?.addEventListener('click', () => {
        const willOpen = !svc.classList.contains('is-active');
        services.forEach((s) => setActive(s, false));
        setActive(svc, willOpen);
      });
      // Keyboard users: focus expands via :focus-within; sync aria state.
      toggle?.addEventListener('focus', () => toggle.setAttribute('aria-expanded', 'true'));
      toggle?.addEventListener('blur', () => { if (!svc.classList.contains('is-active')) toggle.setAttribute('aria-expanded', 'false'); });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') services.forEach((s) => setActive(s, false));
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initHero();
    initServiceStrips();
    OB.playWhileVisible('[data-loop]');
    document.querySelectorAll('.footer-wordmark').forEach((el) => el.addEventListener('reveal', () => el.classList.add('in')));
  });
})();
