/* ==========================================================================
   OurBank auth: login and registration.
   Preserves the original behaviour exactly (sessionStorage keys and
   shapes, validation outcomes, redirects). alert() replaced with inline
   .form-status feedback; the dark panel mirrors form state via
   [data-state]. login() and addUser() stay global.
   ========================================================================== */
(function () {
  'use strict';
  const OB = window.OB || { reduced: false };
  const $ = (sel, root = document) => root.querySelector(sel);

  /* ---------- Shared helpers ---------- */
  function setStatus(region, message, tone) {
    if (!region) return;
    let box = region.querySelector('.form-status');
    if (!box) {
      box = document.createElement('div');
      box.className = 'form-status';
      region.appendChild(box);
    }
    if (!message) { box.textContent = ''; box.removeAttribute('data-tone'); return; }
    // Re-insert so the entrance animation replays and the live region re-announces.
    box.remove();
    box.textContent = message;
    box.dataset.tone = tone;
    region.appendChild(box);
  }

  function setInvalid(input, invalid) {
    if (!input) return;
    if (invalid) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  function focusFirstInvalid(form) {
    const el = form.querySelector('[aria-invalid="true"]');
    if (el) el.focus({ preventScroll: false });
  }

  function setPanelState(panel, state) {
    if (panel) panel.dataset.state = state;
  }

  function setBusy(btn, busy) {
    if (!btn) return;
    btn.setAttribute('aria-busy', String(busy));
    if (busy) btn.setAttribute('disabled', ''); else btn.removeAttribute('disabled');
  }

  /* Show / hide password. type=button so it never submits. */
  function initPasswordToggles() {
    document.querySelectorAll('[data-toggle-password]').forEach((btn) => {
      const input = document.getElementById(btn.getAttribute('aria-controls'));
      if (!input) return;
      btn.addEventListener('click', () => {
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.setAttribute('aria-pressed', String(show));
        btn.textContent = show ? 'Hide' : 'Show';
        input.focus({ preventScroll: true });
      });
    });
  }

  /* Clear invalid state once the user edits a field */
  function clearOnInput(form) {
    form.querySelectorAll('.input').forEach((input) => {
      input.addEventListener('input', () => setInvalid(input, false));
    });
  }

  /* ==========================================================================
     LOGIN
     ========================================================================== */
  let loginBusy = false;

  function login(e) {
    const ev = e || window.event;
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
    if (loginBusy) return;

    const form = document.getElementById('b-form');
    const accEl = document.getElementById('accno');
    const pwEl = document.getElementById('password');
    const region = $('#login-status-region');
    const panel = $('#login-panel');
    const statusText = $('#login-status-label');
    const submit = form ? form.querySelector('[type="submit"]') : null;

    const accno = accEl.value.trim();
    const password = pwEl.value.trim();

    setInvalid(accEl, false);
    setInvalid(pwEl, false);

    const fail = (message, badInput, flash) => {
      setInvalid(badInput, true);
      setStatus(region, message, 'error');
      focusFirstInvalid(form);
      if (flash && panel) {
        setPanelState(panel, 'error');
        if (statusText) statusText.textContent = 'Unverified';
        setTimeout(() => {
          if (panel.dataset.state === 'error') setPanelState(panel, 'idle');
        }, OB.reduced ? 0 : 700);
      }
    };

    if (!accno || !password) {
      if (!accno) setInvalid(accEl, true);
      if (!password) setInvalid(pwEl, true);
      setStatus(region, 'Please enter your account number and password.', 'error');
      focusFirstInvalid(form);
      return;
    }

    let userData = null;
    try { userData = JSON.parse(sessionStorage.getItem(accno)); } catch (_) { userData = null; }

    if (!userData) {
      fail('Account Number does not exist. Please register.', accEl, true);
      return;
    }

    if (String(userData.password) === password) {
      sessionStorage.setItem('loggedInAccNo', accno);
      loginBusy = true;
      setBusy(submit, true);
      setStatus(region, 'Login successful. Taking you to your dashboard.', 'success');

      const go = () => { window.location.href = './dashboard.html'; };
      if (OB.reduced || !panel) {
        setPanelState(panel, 'secure');
        if (statusText) statusText.textContent = 'Secure';
        setTimeout(go, 350);
        return;
      }
      // Line draws (verifying), then locks (secure), then redirect. Total under 900ms.
      setPanelState(panel, 'verifying');
      if (statusText) statusText.textContent = 'Verifying';
      setTimeout(() => {
        setPanelState(panel, 'secure');
        if (statusText) statusText.textContent = 'Secure';
      }, 300);
      setTimeout(go, 880);
    } else {
      fail('Incorrect password.', pwEl, true);
    }
  }

  function initLogin() {
    const form = document.getElementById('b-form');
    if (!form) return;
    form.addEventListener('submit', login);
    clearOnInput(form);
    const panel = $('#login-panel');
    if (panel) {
      setPanelState(panel, 'idle');
      OB.pointerParallax && OB.pointerParallax(panel);
    }
  }

  /* ==========================================================================
     REGISTRATION
     ========================================================================== */
  let registerBusy = false;

  function addUser(e) {
    const ev = e || window.event;
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
    if (registerBusy) return;

    const form = document.getElementById('a-form');
    const nameEl = document.getElementById('name');
    const accEl = document.getElementById('accno');
    const pwEl = document.getElementById('password');
    const region = $('#register-status-region');
    const panel = $('#register-panel');
    const statusText = $('#register-status-label');
    const submit = form ? form.querySelector('[type="submit"]') : null;

    const name = nameEl.value.trim();
    const accno = accEl.value.trim();
    const password = pwEl.value.trim();

    [nameEl, accEl, pwEl].forEach((el) => setInvalid(el, false));
    if (panel) panel.querySelectorAll('.is-error').forEach((el) => el.classList.remove('is-error'));

    if (!name || !accno || !password) {
      if (!name) setInvalid(nameEl, true);
      if (!accno) setInvalid(accEl, true);
      if (!password) setInvalid(pwEl, true);
      setStatus(region, 'Please fill in all fields.', 'error');
      focusFirstInvalid(form);
      return;
    }

    const userDetails = {
      name: name,
      password: password,
      balance: 0
    };

    if (sessionStorage.getItem(accno)) {
      setInvalid(accEl, true);
      setStatus(region, 'Account Number already registered. Please sign in.', 'error');
      focusFirstInvalid(form);
      if (panel) {
        panel.querySelector('[data-node="accno"]')?.classList.add('is-error');
        panel.querySelector('[data-node-label="accno"]')?.classList.add('is-error');
        setPanelState(panel, 'error');
        setTimeout(() => {
          if (panel.dataset.state !== 'error') return;
          setPanelState(panel, 'idle');
          panel.querySelectorAll('.is-error').forEach((el) => el.classList.remove('is-error'));
        }, OB.reduced ? 0 : 900);
      }
      return;
    }

    sessionStorage.setItem(accno, JSON.stringify(userDetails));
    registerBusy = true;
    setBusy(submit, true);
    setStatus(region, 'User registered successfully! You can now sign in.', 'success');
    setPanelState(panel, 'success');
    if (statusText) statusText.textContent = 'Registered';

    const go = () => { window.location.href = './login.html'; };
    setTimeout(go, OB.reduced ? 350 : 860);
  }

  function initRegister() {
    const form = document.getElementById('a-form');
    if (!form) return;
    form.addEventListener('submit', addUser);
    clearOnInput(form);

    const panel = $('#register-panel');
    if (!panel) return;
    setPanelState(panel, 'idle');
    OB.pointerParallax && OB.pointerParallax(panel);

    const fields = ['name', 'accno', 'password'];
    const statusText = $('#register-status-label');
    const nodeFor = (key) => panel.querySelector(`[data-node="${key}"]`);
    const labelFor = (key) => panel.querySelector(`[data-node-label="${key}"]`);
    const segFor = (a, b) => panel.querySelector(`[data-seg="${a}-${b}"]`);

    const sync = () => {
      const done = {};
      fields.forEach((key) => {
        const el = document.getElementById(key);
        done[key] = !!(el && el.value.trim());
        nodeFor(key)?.classList.toggle('is-done', done[key]);
        labelFor(key)?.classList.toggle('is-done', done[key]);
      });
      // A segment joins two completed nodes
      segFor('name', 'accno')?.classList.toggle('is-on', done.name && done.accno);
      segFor('accno', 'password')?.classList.toggle('is-on', done.accno && done.password);
      const count = fields.filter((k) => done[k]).length;
      if (statusText && panel.dataset.state !== 'success') {
        statusText.textContent = count === 3 ? 'Ready to open' : `${count} of 3 complete`;
        // Progress reads green once anything is filled; the ready state is strong green
        statusText.classList.toggle('is-progress', count > 0 && count < 3);
        statusText.classList.toggle('is-ready', count === 3);
      }
    };

    fields.forEach((key) => {
      const el = document.getElementById(key);
      el?.addEventListener('input', sync);
      el?.addEventListener('change', sync);
    });
    sync();
    // Autofill can land after load without an input event
    window.addEventListener('pageshow', sync);
    setTimeout(sync, 400);
  }

  /* ---------- Boot ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    initPasswordToggles();
    initLogin();
    initRegister();
  });

  window.login = login;
  window.addUser = addUser;
})();
