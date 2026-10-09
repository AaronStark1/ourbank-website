/* ==========================================================================
   OurBank dashboard: session, balance statement with step chart, deposit and
   withdraw with a live preview, ledger history.
   State lives in sessionStorage exactly as before:
     'loggedInAccNo' -> account number
     sessionStorage[accno] -> { name, password, balance, history[] }
     history entry -> { timestamp ISO, type 'deposit'|'withdraw', amount, balanceAfter }
   Depends on assets/js/ui.js (window.OB).
   ========================================================================== */
(function () {
  'use strict';
  const OB = window.OB;
  const $ = (id) => document.getElementById(id);

  // Global for the logged-in account number (kept from the original script)
  window.CURRENT_ACCNO = null;

  const LOGIN_REDIRECT_MS = 1500;
  const LOGOUT_REDIRECT_MS = 800;
  const CHART_MAX_POINTS = 30;

  let activeForm = 'deposit';
  let locked = false;

  /* =====================================================================
     Session helpers
     ===================================================================== */
  function lockSession() {
    if (locked) return;
    locked = true;
    window.CURRENT_ACCNO = null;
    const gate = $('sessionGate');
    const dash = $('dash');
    if (dash) dash.hidden = true;
    if (gate) gate.hidden = false;
    document.body.classList.add('is-locked');
    OB.toast('Session expired or you are not logged in.', 'error', LOGIN_REDIRECT_MS);
    setTimeout(() => { window.location.href = './login.html'; }, LOGIN_REDIRECT_MS);
  }

  function getCurrentUserAccount() {
    const accno = sessionStorage.getItem('loggedInAccNo');
    if (!accno) {
      lockSession();
      return null;
    }
    return accno;
  }

  function getUserData(accno) {
    const data = sessionStorage.getItem(accno);
    return data ? JSON.parse(data) : null;
  }

  function saveUserData(accno, data) {
    sessionStorage.setItem(accno, JSON.stringify(data));
  }

  /* Indian grouping, two decimals, no symbol: 124500 -> "1,24,500.00" */
  function formatCurrency(amount) {
    return OB.formatINR(parseFloat(amount) || 0, 2);
  }

  function setAccountLabel(accno) {
    const el = $('accountLabel');
    if (!el) return;
    const s = String(accno);
    const masked = s.length > 4 ? '••••' + s.slice(-4) : s;
    el.textContent = `A/C ${masked}`;
  }

  /* =====================================================================
     Display updates
     ===================================================================== */
  function updateBalanceDisplay(balance, opts = {}) {
    const formatted = formatCurrency(balance);

    // Small "Balance" lines under each form update immediately
    const w = $('currentBalanceDisplayWithdraw');
    if (w) w.textContent = formatted;
    const d = $('currentBalanceDisplayDeposit');
    if (d) d.textContent = formatted;

    const announce = $('balanceAnnounce');
    if (announce) announce.textContent = `Available balance ₹${formatted}`;

    // Large figure counts to the new value (optionally after the flying pill lands)
    const big = $('balanceDisplay');
    if (big) {
      big.style.setProperty('--chars', String(formatted.length + 1));
      const run = () => OB.countTo(big, Number(balance) || 0, {
        from: opts.from ?? (parseFloat(big.dataset.value) || 0),
        decimals: 2,
        prefix: '₹',
        duration: opts.duration ?? 1300,
      });
      if (opts.delay && !OB.reduced) setTimeout(run, opts.delay); else run();
    }

    updatePreviews();
  }

  function updateUserNameDisplay(name) {
    const nameElement = $('userNameDisplay');
    let displayName = name;
    if (!name || name === 'User') {
      const stored = window.CURRENT_ACCNO ? getUserData(window.CURRENT_ACCNO) : null;
      displayName = (stored && stored.name) || 'Guest';
    }
    if (nameElement) nameElement.textContent = displayName;
  }

  function updateLastActivity(history) {
    const el = $('lastActivity');
    if (!el) return;
    if (!history || !history.length) { el.textContent = 'No activity yet'; return; }
    const latest = history.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    const dt = new Date(latest.timestamp);
    el.textContent = `Last entry ${dt.toLocaleDateString('en-GB')}, ${dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  }

  function renderTransactionHistory(history, opts = {}) {
    const container = $('transactionHistoryContainer');
    if (!container) return;

    // Newest first, last 10 entries
    const sortedHistory = history.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const displayHistory = sortedHistory.slice(0, 10);

    const count = $('historyCount');
    if (count) {
      const n = history.length;
      count.textContent = n === 0 ? 'No entries' : n <= 10 ? `${n} ${n === 1 ? 'entry' : 'entries'}` : `Last 10 of ${n} entries`;
    }
    updateLastActivity(history);

    if (displayHistory.length === 0) {
      container.innerHTML =
        '<div class="ledger-empty">' +
          '<p class="ledger-empty-title">No transactions recorded yet.</p>' +
          '<p class="muted">Make your first deposit to get started.</p>' +
        '</div>';
      return;
    }

    let rows = '';
    displayHistory.forEach((tx, i) => {
      const dateObj = new Date(tx.timestamp);
      const dateStr = dateObj.toLocaleDateString('en-GB');
      const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const isCredit = tx.type === 'deposit';
      const typeLabel = tx.type.charAt(0).toUpperCase() + tx.type.slice(1);
      const cls = (isCredit ? 'credit' : 'debit') + (i === 0 && opts.highlightLatest ? ' is-new' : '');
      rows +=
        `<tr class="${cls}">` +
          `<td class="c-date mono">${dateStr}</td>` +
          `<td class="c-time mono">${timeStr}</td>` +
          `<td class="c-type"><span class="type-dot" aria-hidden="true"></span>${typeLabel}</td>` +
          `<td class="c-amt num">${isCredit ? '+' : '-'}₹${formatCurrency(tx.amount)}</td>` +
          `<td class="c-bal num">₹${formatCurrency(tx.balanceAfter)}</td>` +
        '</tr>';
    });

    container.innerHTML =
      '<table class="ledger">' +
        '<thead><tr>' +
          '<th scope="col" class="label">Date</th>' +
          '<th scope="col" class="label">Time</th>' +
          '<th scope="col" class="label">Type</th>' +
          '<th scope="col" class="label c-amt">Amount</th>' +
          '<th scope="col" class="label c-bal">Balance</th>' +
        '</tr></thead>' +
        `<tbody>${rows}</tbody>` +
      '</table>';
  }

  /* =====================================================================
     Step chart: balanceAfter per transaction, oldest to newest.
     Drawn in pixel space (viewBox = rendered size) so strokes stay crisp.
     ===================================================================== */
  const chart = { svg: null, values: [], lastRedrawAnimated: false };

  function chartValues(history, balance) {
    const sorted = (history || []).slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const current = Number(balance) || 0;
    if (!sorted.length) return [current, current];
    const first = sorted[0];
    const before = (Number(first.balanceAfter) || 0) - (first.type === 'deposit' ? Number(first.amount) || 0 : -(Number(first.amount) || 0));
    const values = [before, ...sorted.map((t) => Number(t.balanceAfter) || 0)];
    return values.slice(-CHART_MAX_POINTS);
  }

  function drawChart(opts = {}) {
    const svg = chart.svg;
    if (!svg) return;
    const values = chart.values;
    if (!values.length) return;
    const rect = svg.getBoundingClientRect();
    const w = Math.max(200, Math.round(rect.width));
    const h = Math.max(120, Math.round(rect.height));
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const padL = 6, padR = 14, padT = 26, padB = 12;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    let min = Math.min(...values);
    let max = Math.max(...values);
    const flat = max === min;
    if (flat) {
      const pad = Math.max(1, Math.abs(min) * 0.12);
      min -= pad; max += pad;
    } else {
      const pad = (max - min) * 0.14;
      min -= pad; max += pad;
    }
    const n = values.length;
    const x = (i) => padL + (plotW * i) / (n - 1);
    const y = (v) => padT + ((max - v) / (max - min)) * plotH;

    // Rules: four evenly spaced hairlines
    const rules = svg.querySelector('.chart-rules');
    if (rules) {
      let html = '';
      for (let i = 0; i < 4; i++) {
        const ry = (padT + (plotH * i) / 3).toFixed(1);
        html += `<line x1="${padL}" y1="${ry}" x2="${w - padR}" y2="${ry}"/>`;
      }
      rules.innerHTML = html;
    }

    // Step path
    let d = `M${x(0).toFixed(1)} ${y(values[0]).toFixed(1)}`;
    for (let i = 1; i < n; i++) {
      d += ` H${x(i).toFixed(1)} V${y(values[i]).toFixed(1)}`;
    }
    const line = svg.querySelector('.chart-line');
    const area = svg.querySelector('.chart-area');
    line.setAttribute('d', d);
    area.setAttribute('d', `${d} V${(h - padB).toFixed(1)} H${x(0).toFixed(1)} Z`);

    // High / low labels
    const labels = svg.querySelector('.chart-labels');
    if (labels) {
      const dataMax = Math.max(...values);
      const dataMin = Math.min(...values);
      if (flat) {
        labels.innerHTML = `<text x="${padL}" y="${(y(dataMax) - 10).toFixed(1)}">₹${formatCurrency(dataMax)}</text>`;
      } else {
        const yHigh = y(dataMax) - 10;
        const yLow = Math.min(h - 2, y(dataMin) + 16);
        labels.innerHTML =
          `<text class="is-high" x="${padL}" y="${yHigh.toFixed(1)}">High ₹${formatCurrency(dataMax)}</text>` +
          `<text x="${padL}" y="${yLow.toFixed(1)}">Low ₹${formatCurrency(dataMin)}</text>`;
      }
    }

    // Gold end dot glides to the newest point
    const end = svg.querySelector('.chart-end');
    if (end) end.style.transform = `translate(${x(n - 1).toFixed(1)}px, ${y(values[n - 1]).toFixed(1)}px)`;

    const range = $('chartRange');
    if (range) range.textContent = n <= 2 && flat ? 'Now' : `${n - 1} ${n - 1 === 1 ? 'entry' : 'entries'}`;

    // Animate only the newest segment after a transaction
    if (opts.animateLast && n >= 2 && !OB.reduced) {
      const total = line.getTotalLength();
      const seg = Math.abs(x(n - 1) - x(n - 2)) + Math.abs(y(values[n - 1]) - y(values[n - 2]));
      const fraction = total > 0 ? Math.min(1, seg / total) : 0;
      line.classList.add('is-update');
      svg.querySelector('.chart-dot')?.classList.add('is-update');
      line.style.transition = 'none';
      line.style.strokeDashoffset = String(fraction);
      line.getBoundingClientRect(); // flush
      line.style.transition = '';
      line.style.strokeDashoffset = '0';
    }
  }

  function renderChart(history, balance, opts = {}) {
    chart.values = chartValues(history, balance);
    drawChart(opts);
  }

  function initChart() {
    chart.svg = $('balanceChart');
    if (!chart.svg) return;
    const figure = chart.svg.closest('.statement-chart') || chart.svg;
    if ('ResizeObserver' in window) {
      let raf = 0;
      let first = true;
      const ro = new ResizeObserver(() => {
        if (first) { first = false; return; } // initial layout is drawn by initializeDashboard
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          chart.svg.classList.add('no-anim');
          drawChart();
          chart.svg.getBoundingClientRect();
          chart.svg.classList.remove('no-anim');
        });
      });
      ro.observe(figure);
    }
  }

  /* =====================================================================
     Form helpers
     ===================================================================== */
  const ui = {
    deposit: () => ({
      form: $('b-form'), amount: $('depositAmount'), password: $('depositPassword'),
      status: $('depositStatus'), submit: $('depositSubmit'), preview: $('depositPreview'),
    }),
    withdraw: () => ({
      form: $('a-form'), amount: $('withdrawAmount'), password: $('withdrawPassword'),
      status: $('withdrawStatus'), submit: $('withdrawSubmit'), preview: $('withdrawPreview'),
    }),
  };

  function setStatus(el, message, tone) {
    if (!el) return;
    el.textContent = message || '';
    if (message) el.dataset.tone = tone || 'info'; else delete el.dataset.tone;
  }

  function markInvalid(input, invalid) {
    if (!input) return;
    if (invalid) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  }

  function readForm(type) {
    const f = ui[type]();
    const amount = parseFloat(f.amount.value);
    const password = f.password.value.trim();
    const badAmount = isNaN(amount) || amount < 0.01;
    const badPassword = !password;
    markInvalid(f.amount, badAmount);
    markInvalid(f.password, badPassword);
    if (badAmount || badPassword) {
      const msg = 'Please enter a valid amount (at least ₹0.01) and your password.';
      setStatus(f.status, msg, 'error');
      OB.toast(msg, 'error');
      (badAmount ? f.amount : f.password).focus();
      return null;
    }
    return { amount, password, f };
  }

  /* Live preview strip: reflects the REAL stored balance as the user types */
  function updatePreview(type) {
    const f = ui[type]();
    if (!f.preview || !f.amount) return;
    const user = window.CURRENT_ACCNO ? getUserData(window.CURRENT_ACCNO) : null;
    const balance = user ? Number(user.balance) || 0 : 0;
    const amount = parseFloat(f.amount.value);
    const valid = !isNaN(amount) && amount > 0;
    const amtEl = f.preview.querySelector('.preview-amount');
    const fromEl = f.preview.querySelector('.from');
    const toEl = f.preview.querySelector('.to');
    fromEl.textContent = `₹${formatCurrency(balance)}`;
    f.preview.classList.toggle('is-idle', !valid);
    if (!valid) {
      amtEl.textContent = '₹0.00';
      toEl.textContent = `₹${formatCurrency(balance)}`;
      f.preview.dataset.state = 'idle';
      return;
    }
    amtEl.textContent = `${type === 'deposit' ? '+' : '-'}₹${formatCurrency(amount)}`;
    if (type === 'withdraw' && amount > balance) {
      toEl.textContent = 'Exceeds available balance';
      f.preview.dataset.state = 'exceeds';
      return;
    }
    toEl.textContent = `₹${formatCurrency(type === 'deposit' ? balance + amount : balance - amount)}`;
    f.preview.dataset.state = 'ok';
  }
  function updatePreviews() { updatePreview('deposit'); updatePreview('withdraw'); }

  /* Flying amount pill: form -> balance for deposits, balance -> form for withdrawals.
     Returns the delay (ms) after which the balance should start counting. */
  function flyAmount(type, amount) {
    if (OB.reduced || typeof Element.prototype.animate !== 'function') return 0;
    const big = $('balanceDisplay');
    const btn = ui[type]().submit;
    if (!big || !btn) return 0;
    const a = btn.getBoundingClientRect();
    const b = big.getBoundingClientRect();
    const from = type === 'deposit' ? a : b;
    const to = type === 'deposit' ? b : a;

    const el = document.createElement('span');
    el.className = 'fly num';
    el.dataset.tone = type === 'deposit' ? 'credit' : 'debit';
    el.setAttribute('aria-hidden', 'true');
    el.textContent = `${type === 'deposit' ? '+' : '-'}₹${formatCurrency(amount)}`;
    document.body.appendChild(el);

    const w = el.offsetWidth, h = el.offsetHeight;
    const sx = from.left + from.width / 2 - w / 2;
    const sy = from.top + from.height / 2 - h / 2;
    const dx = (to.left + to.width / 2 - w / 2) - sx;
    const dy = (to.top + to.height / 2 - h / 2) - sy;
    el.style.left = `${sx.toFixed(1)}px`;
    el.style.top = `${sy.toFixed(1)}px`;

    const duration = 780;
    const lift = type === 'deposit' ? -28 : 28;
    const anim = el.animate([
      { transform: 'translate(0, 0) scale(0.85)', opacity: 0 },
      { transform: `translate(${dx * 0.12}px, ${dy * 0.12 + lift}px) scale(1)`, opacity: 1, offset: 0.18 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.72)`, opacity: 0.95, offset: 0.92 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.5)`, opacity: 0 },
    ], { duration, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' });
    anim.onfinish = () => el.remove();
    setTimeout(() => el.remove(), duration + 200);
    return type === 'deposit' ? duration - 140 : 0;
  }

  function flashBalance(type) {
    const fig = document.querySelector('.balance-figure');
    if (!fig || OB.reduced) return;
    const cls = type === 'deposit' ? 'flash-credit' : 'flash-debit';
    fig.classList.remove('flash-credit', 'flash-debit');
    void fig.offsetWidth;
    fig.classList.add(cls);
    fig.querySelector('.balance-flash')?.addEventListener('animationend', () => fig.classList.remove(cls), { once: true });
  }

  /* =====================================================================
     Segmented control (replaces the sliding switch panel)
     ===================================================================== */
  function changeForm(target) {
    let next;
    if (typeof target === 'string') next = target;
    else if (target && target.currentTarget && target.currentTarget.dataset) next = target.currentTarget.dataset.target;
    if (!next) next = activeForm === 'deposit' ? 'withdraw' : 'deposit';
    if (next === activeForm) return;

    activeForm = next;

    const seg = $('switch-cnt');
    if (seg) {
      seg.dataset.active = next;
      seg.style.setProperty('--seg-x', next === 'withdraw' ? '100%' : '0%');
      seg.querySelectorAll('.seg-tab').forEach((tab) => {
        const on = tab.dataset.target === next;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
      });
    }
    document.querySelectorAll('.stage > .panel').forEach((panel) => {
      const on = panel.dataset.panel === next;
      panel.classList.toggle('is-active', on);
      if (on) panel.removeAttribute('inert'); else panel.setAttribute('inert', '');
    });
    updatePreviews();
  }

  function initSegmented() {
    const seg = $('switch-cnt');
    if (!seg) return;
    const tabs = Array.from(seg.querySelectorAll('.seg-tab'));
    tabs.forEach((tab) => {
      tab.addEventListener('click', changeForm);
      tab.addEventListener('keydown', (e) => {
        const i = tabs.indexOf(tab);
        let j = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') j = 0;
        if (e.key === 'End') j = tabs.length - 1;
        if (j === null) return;
        e.preventDefault();
        tabs[j].focus();
        changeForm(tabs[j].dataset.target);
      });
    });
  }

  /* =====================================================================
     Init / logout
     ===================================================================== */
  function initializeDashboard() {
    window.CURRENT_ACCNO = getCurrentUserAccount();
    if (!window.CURRENT_ACCNO) return;

    const userData = getUserData(window.CURRENT_ACCNO);
    if (!userData) { lockSession(); return; }

    // 1. Initialise data if necessary (same defaults as before)
    if (!userData.balance) userData.balance = 0;
    if (!userData.history) userData.history = [];
    if (!userData.username) userData.username = 'User';
    saveUserData(window.CURRENT_ACCNO, userData);

    // 2. Update UI
    setAccountLabel(window.CURRENT_ACCNO);
    updateUserNameDisplay(userData.username);
    renderTransactionHistory(userData.history);
    renderChart(userData.history, userData.balance);

    const big = $('balanceDisplay');
    if (big) OB.renderNumber(big, 0, { decimals: 2, prefix: '₹' });
    const w = $('currentBalanceDisplayWithdraw');
    if (w) w.textContent = formatCurrency(userData.balance);
    const d = $('currentBalanceDisplayDeposit');
    if (d) d.textContent = formatCurrency(userData.balance);
    updatePreviews();

    // 3. Entrance choreography once fonts are in (with a safety net)
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      document.querySelector('.statement')?.classList.add('ready');
      updateBalanceDisplay(userData.balance, { from: 0, duration: 1600 });
      chart.svg?.classList.add('in');
    };
    (document.fonts?.ready || Promise.resolve()).then(start);
    setTimeout(start, 1200);
  }

  function handleLogout() {
    sessionStorage.removeItem('loggedInAccNo');
    window.CURRENT_ACCNO = null;
    const btn = $('logoutBtn');
    if (btn) btn.setAttribute('aria-busy', 'true');
    OB.toast('You have been successfully logged out. Redirecting to home page', 'info', LOGOUT_REDIRECT_MS + 400);
    setTimeout(() => { window.location.href = './index.html'; }, LOGOUT_REDIRECT_MS);
  }

  /* =====================================================================
     Transactions
     ===================================================================== */
  function handleDeposit(event) {
    event.preventDefault();
    const read = readForm('deposit');
    if (!read) return;
    processTransaction(read.amount, read.password, 'deposit');
  }

  function handleWithdrawal(event) {
    event.preventDefault();
    const read = readForm('withdraw');
    if (!read) return;
    processTransaction(read.amount, read.password, 'withdraw');
  }

  function processTransaction(amount, submittedPassword, type) {
    if (!window.CURRENT_ACCNO) {
      initializeDashboard();
      if (!window.CURRENT_ACCNO) return false;
    }
    const f = ui[type]();
    const userData = getUserData(window.CURRENT_ACCNO);
    if (!userData) { lockSession(); return false; }

    // 1. Password verification
    if (userData.password !== submittedPassword) {
      const msg = 'Incorrect password. Transaction failed.';
      setStatus(f.status, msg, 'error');
      OB.toast(msg, 'error');
      markInvalid(f.password, true);
      f.password.value = '';
      f.password.focus();
      return false;
    }

    let currentBalance = userData.balance;
    let message = '';

    if (type === 'deposit') {
      currentBalance += amount;
      message = `Deposit successful. ₹${formatCurrency(amount)} added.`;
    } else if (type === 'withdraw') {
      if (currentBalance < amount) {
        const msg = `Insufficient funds. Current balance: ₹${formatCurrency(currentBalance)}`;
        setStatus(f.status, msg, 'error');
        OB.toast(msg, 'error');
        markInvalid(f.amount, true);
        f.amount.focus();
        return false;
      }
      currentBalance -= amount;
      message = `Withdrawal successful. ₹${formatCurrency(amount)} withdrawn.`;
    }

    // 2. Update and save data
    userData.balance = currentBalance;

    // 3. Record history
    userData.history.push({
      timestamp: new Date().toISOString(),
      type: type,
      amount: amount,
      balanceAfter: currentBalance,
    });
    saveUserData(window.CURRENT_ACCNO, userData);

    // 4. Update UI: clear inputs, confirm, animate money movement, refresh ledger
    f.amount.value = '';
    f.password.value = '';
    markInvalid(f.amount, false);
    markInvalid(f.password, false);
    setStatus(f.status, message, 'success');
    OB.toast(message, 'success');

    const delay = flyAmount(type, amount);
    updateBalanceDisplay(currentBalance, { delay });
    renderTransactionHistory(userData.history, { highlightLatest: true });
    const finish = () => {
      renderChart(userData.history, currentBalance, { animateLast: true });
      flashBalance(type);
    };
    if (delay && !OB.reduced) setTimeout(finish, delay); else finish();
    return true;
  }

  /* =====================================================================
     Wiring
     ===================================================================== */
  function initForms() {
    $('b-form')?.addEventListener('submit', handleDeposit);
    $('a-form')?.addEventListener('submit', handleWithdrawal);
    $('logoutBtn')?.addEventListener('click', handleLogout);

    ['deposit', 'withdraw'].forEach((type) => {
      const f = ui[type]();
      f.amount?.addEventListener('input', () => { markInvalid(f.amount, false); updatePreview(type); });
      f.password?.addEventListener('input', () => markInvalid(f.password, false));
    });

    document.querySelectorAll('[data-toggle-password]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const input = $(btn.dataset.togglePassword);
        if (!input) return;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.textContent = show ? 'Hide' : 'Show';
        btn.setAttribute('aria-pressed', String(show));
        btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
        input.focus({ preventScroll: true });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initChart();
    initSegmented();
    initForms();
    initializeDashboard();
  });

  // Keep the original function names reachable globally
  Object.assign(window, {
    getCurrentUserAccount, getUserData, saveUserData, formatCurrency,
    updateBalanceDisplay, updateUserNameDisplay, renderTransactionHistory,
    initializeDashboard, handleLogout, handleDeposit, handleWithdrawal,
    processTransaction, changeForm,
  });
})();
