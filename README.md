# 🏦 Our Bank – Interactive Banking Dashboard UI

## 📌 Introduction
**Our Bank** is a front-end banking dashboard project built to strengthen my **JavaScript fundamentals** and UI/UX design skills.  
The application simulates essential banking operations such as deposits and withdrawals using **HTML, CSS, and Vanilla JavaScript**, with a focus on **clean interaction flow**, **neumorphic design**, and **real-time updates**.

This project demonstrates how core JavaScript logic, browser storage, and thoughtful UI design can work together to create a smooth, interactive user experience—without relying on a backend.

---

## 🌐 Live Demo
👉 **Live Website:** [https://aaronstark1.github.io/ourbank-website/](https://aaronstark1.github.io/ourbank-website/)

---

## 🗂️ Table of Contents
- Introduction  
- Live Demo  
- Features & UI/UX Highlights  
- Technologies Used  
- Project Structure  
- Data Handling  
- Future Improvements  
- License  

---

## ✨ Features & UI/UX Highlights

### 🔹 Dynamic Form Switching
- Smooth **CSS-animated transitions** allow users to switch between **Deposit** and **Withdrawal** forms.
- Improves user flow and keeps the interface intuitive and clutter-free.

### 🔹 Real-Time Balance Display
- Account balance is fetched from **`sessionStorage`** on page load.
- Balance updates instantly after every successful transaction.

### 🔹 Robust Transaction Logic
- JavaScript validation ensures:
  - Only **positive numeric values** are accepted.
  - Password verification matches stored user credentials.
- Prevents invalid or unauthorized transactions.

### 🔹 Data Persistence (Client-Side)
- User data, balance, and transaction updates are stored using **`sessionStorage`**.
- Simulates a real banking environment without a backend server.

### 🔹 Neumorphic Light-Theme Design
- Clean, modern UI with a **light-themed neumorphic aesthetic**.
- Reusable design components for registration and transaction forms.
- Ensures visual consistency across the application.

---

## 🛠️ Technologies Used
- **HTML5** – Structure and layout  
- **CSS3** – Styling, animations, and neumorphic UI  
- **Vanilla JavaScript (ES6)** – Business logic and DOM manipulation  
- **Session Storage API** – Client-side data persistence  

---

## 📁 Project Structure

```text
ourbank-website/
│
├── index.html
├── login.html
├── registration.html
├── dashboard.html
│
├── css/
│   ├── index.css
│   ├── registration.css
│   ├── dashboard.css
│
├── js/
│   └── dashboard.js
│
└── images/
