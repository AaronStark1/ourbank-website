<div align="center">

<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='72' height='72'%3E%3Ccircle cx='16' cy='16' r='13' fill='none' stroke='%234b70e2' stroke-width='2.4'/%3E%3Cpolyline points='8.5,20.5 13.5,14.5 17.5,17.5 23.5,9.5' fill='none' stroke='%2310b981' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='23.5' cy='9.5' r='2.2' fill='%235ec29a'/%3E%3C/svg%3E" alt="OurBank mark" width="72" height="72">

# 🏦 Our Bank – Modern Interactive Banking UI

**A premium, art-directed digital banking experience built with plain HTML, CSS and JavaScript.**
Registration, login, deposits, withdrawals and a live transaction ledger, wrapped in a token-driven design system with a vibrant violet and emerald light theme and a deep obsidian dark theme.

[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![HTML5](https://img.shields.io/badge/HTML5-semantic-E34F26?logo=html5&logoColor=white)](#tech-stack--architecture)
[![CSS3](https://img.shields.io/badge/CSS3-custom%20properties-1572B6?logo=css3&logoColor=white)](#tech-stack--architecture)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?logo=javascript&logoColor=000)](#tech-stack--architecture)
[![Dark Mode](https://img.shields.io/badge/Dark%20Mode-supported-0d0b18?logo=darkreader&logoColor=34d399)](#-dual-theme-engine)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981)](#license)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-4b70e2)](#contributing)

[**Live Demo**](https://aaronstark1.github.io/ourbank-website/) · [**Quick Start**](#-quick-start) · [**Features**](#-key-features) · [**Architecture**](#tech-stack--architecture)

</div>

---

## 📸 Preview

<table>
  <tr>
    <th width="50%">Light theme</th>
    <th width="50%">Dark theme</th>
  </tr>
  <tr>
    <td><img src="assets/screenshots/landing-light.png" alt="OurBank landing page in the light theme: violet gradient call to action, emerald headline accent and the animated deposit-to-growth curve"></td>
    <td><img src="assets/screenshots/landing-dark.png" alt="OurBank landing page in the dark theme: obsidian background with violet glow and luminous mint accents"></td>
  </tr>
  <tr>
    <th>Dashboard, withdraw preview (dark)</th>
    <th>Dashboard, balance and ledger chart (light)</th>
  </tr>
  <tr>
    <td><img src="assets/screenshots/dashboard-preview.png" alt="Dashboard in dark mode showing the gradient balance figure, balance-per-transaction chart, the withdraw tab with a live preview of the new balance, and the transaction history"></td>
    <td><img src="assets/screenshots/dashboard-light.png" alt="Dashboard in light mode showing the available balance and the step chart drawn from transaction history"></td>
  </tr>
  <tr>
    <th>Login</th>
    <th>Registration</th>
  </tr>
  <tr>
    <td><img src="assets/screenshots/login-preview.png" alt="Login page with the secure-connection visual that completes when credentials are verified"></td>
    <td><img src="assets/screenshots/registration-preview.png" alt="Registration page in dark mode with the account-opening steps lighting up as fields are completed"></td>
  </tr>
</table>

<details>
<summary><strong>More views</strong>: full homepage, mobile, theme toggle</summary>
<br>
<table>
  <tr>
    <td width="34%" valign="top"><img src="assets/screenshots/mobile-preview.png" alt="Homepage on a 390px mobile viewport in dark mode"></td>
    <td width="33%" valign="top"><img src="assets/screenshots/mobile-dashboard.png" alt="Dashboard on a 390px mobile viewport in dark mode"></td>
    <td width="33%" valign="top"><img src="assets/screenshots/theme-toggle.png" alt="Homepage right after pressing the sun and moon theme toggle"></td>
  </tr>
</table>
<img src="assets/screenshots/landing-full-dark.png" alt="Full-length homepage in dark mode: hero, money movement track, why choose OurBank, services strips and footer">
</details>

---

## ✨ Key Features

### 🌓 Dual Theme Engine
Instant, flicker-free switching between the vibrant violet and green light theme and the deep obsidian dark theme. A tiny bootstrap script sets `data-theme` on `<html>` before first paint, the choice persists in `localStorage`, and `prefers-color-scheme` is respected until the user picks a side. Every colour comes from one token file, so the sun / moon toggle changes nothing but variables.

### 💸 Real-Time Financial Operations
Deposit and withdraw from a segmented control that slides between forms. A live preview strip reads the real balance as you type (`₹85,000.00 → ₹82,500.00`), every transaction is confirmed with the account password, insufficient funds are rejected, and a successful transaction animates a pill from the form into the balance, counts the figure up or down, redraws the balance chart and slides the new ledger row in.

### 🌿 Fintech Typography
Bricolage Grotesque display type, Instrument Sans body text and Geist Mono for ledger data, with Indian-rupee grouping (`₹1,24,500.00`). Emerald and mint gradients carry the headline keywords, the balance figure and the growth metrics; currency signs, positive transactions and eyebrow badges use forest green on light surfaces and luminous mint on dark ones, all at WCAG AA contrast.

### 🔒 Client-Side State Persistence
A complete simulation of profiles and sessions with no backend. Accounts live in `sessionStorage` keyed by account number, the active session is a single `loggedInAccNo` flag, every transaction is appended to the account's history, and the theme choice lives in `localStorage`.

### Also in the box
- Choreographed motion: masked headline reveals, SVG path drawing, pointer parallax in the hero, scroll-driven exits, counters, all honouring `prefers-reduced-motion`.
- One continuous "ledger line" motif: the growth curve in the hero, the transfer track, the services visuals, the secure-connection line on login, the account-opening steps on registration and the balance chart on the dashboard.
- Accessible by default: semantic landmarks, labelled inputs, visible focus states, keyboard-operable service strips and tabs, a skip link, and no horizontal overflow from 390px up.

---

## Tech Stack & Architecture

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3%20Custom%20Properties-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/Vanilla%20ES6%2B-F7DF1E?style=for-the-badge&logo=javascript&logoColor=000)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

</div>

No framework, no build step required to run: Vite is used only as a fast dev server. All state is client-side and all styling flows through CSS custom properties.

```mermaid
flowchart LR
  subgraph Theme["Theme controller (assets/js/ui.js)"]
    B[Head bootstrap script] -->|reads ob-theme or prefers-color-scheme| H[html data-theme]
    T[Sun / Moon toggle] -->|OB.setTheme| H
    H --> V[tokens.css variables]
    V --> UI[Every component]
    OS[OS theme change] -->|only when no stored choice| H
  end

  subgraph State["Client-side state machine"]
    R[registration.html<br/>addUser] -->|sessionStorage account = name, password, balance 0| L[login.html<br/>login]
    L -->|password matches| S{{loggedInAccNo}}
    S --> D[dashboard.html<br/>initializeDashboard]
    D --> P[processTransaction]
    P -->|deposit| P1[balance += amount]
    P -->|withdraw, funds available| P2[balance -= amount]
    P1 --> HIST[history.push timestamp, type, amount, balanceAfter]
    P2 --> HIST
    HIST --> UI2[countTo balance, redraw chart, render ledger]
    D -->|handleLogout| X[remove loggedInAccNo -> index.html]
  end
```

---

## 📁 Project Structure

```text
ourbank-website/
├── index.html              Landing: hero, money movement, why OurBank, services, footer
├── login.html              Sign in with the secure-connection visual
├── registration.html       Open an account with the account-opening steps
├── dashboard.html          Balance, deposit / withdraw, transaction history
├── assets/
│   ├── css/
│   │   ├── tokens.css      Design tokens: light + dark palettes, type scale, motion
│   │   ├── base.css        Reset, typography, buttons, forms, nav, footer, reveals, toggle
│   │   ├── home.css        Homepage sections and financial visualisations
│   │   ├── auth.css        Login and registration layouts and panels
│   │   └── dashboard.css   Dashboard ledger, actions and history
│   ├── js/
│   │   ├── ui.js           Shared: theme engine, nav, reveals, counters, toasts
│   │   ├── home.js         Hero choreography and services interactions
│   │   ├── auth.js         login() and addUser() with inline feedback
│   │   └── dashboard.js    Banking logic, balance chart, transaction feedback
│   └── screenshots/        README previews
├── package.json            Vite dev server scripts
└── images/, index.css, footer/   Legacy assets from the previous design (unreferenced)
```

---

## 🚀 Quick Start

```bash
git clone https://github.com/AaronStark1/ourbank-website.git
cd ourbank-website
npm install
npm run dev        # http://localhost:5173
```

No Node at hand? The site is static, so any server works:

```bash
python3 -m http.server 5173
```

Then open `index.html`, register an account, log in and start moving money. Data lives in the browser tab and is cleared when it closes.

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Produce a static build in `dist/` |
| `npm run preview` | Serve the production build locally |

---

## 🎨 Design System at a Glance

| Token family | Light | Dark | Used for |
| --- | --- | --- | --- |
| `--violet-*` | `#4b70e2`, `#8186d5` | neon `#8aa2ff` | Primary actions, focus rings, glows |
| `--text-green` | `#047857` / `#065f46` | `#34d399` / `#6ee7b7` | Headline keywords, metrics, badges |
| `--teal-*`, `--mint-*` | `#2a9d8f`, `#c0dece` | same | Growth lines, value highlights |
| `--coral-*` | `#cf5a3d` | `#ff8a6a` | Debits and errors |
| `--paper`, `--surface` | `#f3f4fc`, `#fbfbfe` | `#0d0b18`, `#151330` | Page and elevated surfaces |

Shape rules: pill buttons, 8px inputs, 12px surfaces, hairlines over boxes.

---

## 🌐 Browser Support

Latest two versions of Chrome, Edge, Firefox and Safari. The UI relies on `color-mix()`, container queries, `clip-path` and CSS scroll-driven animations; the last two degrade gracefully where unsupported.

## 🤝 Contributing

Issues and pull requests are welcome.

1. Fork the repository and create a branch from `main`.
2. Keep colours in `assets/css/tokens.css` and prefer semantic tokens (`--fg`, `--stroke`, `--surface`) over raw hex values so both themes stay in sync.
3. Preserve the `sessionStorage` data shapes documented above.
4. Test register → login → deposit → withdraw → logout in both themes at desktop and mobile widths before opening a PR.

## 👤 Author

**Aaron Correya** · [GitHub](https://github.com/AaronStark1)

## License

MIT
