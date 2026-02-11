# 🎟️ CuponCode — Secure Coupon Marketplace

Link:- https://kishanjee7.github.io/CuponCode/

A modern, fully-featured coupon marketplace web application where users can buy and sell verified discount coupons using a virtual coin system.

![Platform](https://img.shields.io/badge/platform-web-blue)
![Backend](https://img.shields.io/badge/backend-Google%20Apps%20Script-green)
![Database](https://img.shields.io/badge/database-Google%20Sheets-orange)

---

## ✨ Features

### For Users
- 🔐 **OTP-based Authentication** — Email verification for registration and password recovery
- 🏪 **Marketplace** — Browse, search, filter, and sort verified coupons
- 📤 **Upload Coupons** — Submit coupons with live preview card
- 🔒 **My Vault** — Access purchased coupon codes securely
- 💰 **Coin Wallet** — Track balance with full transaction history
- 🤝 **Referral Program** — Earn 50 coins per friend invited

### For Admins
- 🛡️ **Coupon Verification** — Approve/reject coupon submissions
- 📁 **Category Management** — CRUD operations with emoji icons
- 👥 **User Management** — Suspend, activate, delete users
- 🪙 **Coin Adjustment** — Add/deduct coins with reason logging
- 💳 **Transaction Monitoring** — View all platform transactions

### Platform
- 🌑 **Dark Glassmorphism UI** — Premium dark theme with glass effects
- 📱 **Fully Responsive** — Mobile-first with bottom navigation
- 🎬 **Smooth Animations** — Fade, slide, scale, skeleton loading
- 🎫 **Single Ownership** — Each coupon can only be sold once
- 💸 **Zero Commission** — Full price goes to the seller

---

## 🏗️ Architecture

```
┌──────────────────────┐     ┌──────────────────────┐
│   Frontend (Static)  │────▶│  Google Apps Script   │
│   HTML / CSS / JS    │◀────│  (Web App Backend)    │
└──────────────────────┘     └──────────┬───────────┘
                                        │
                             ┌──────────▼───────────┐
                             │    Google Sheets      │
                             │    (Database)         │
                             │  ┌─────────────────┐  │
                             │  │ Users           │  │
                             │  │ Coupons         │  │
                             │  │ Transactions    │  │
                             │  │ Categories      │  │
                             │  │ OTP             │  │
                             │  │ Referrals       │  │
                             │  └─────────────────┘  │
                             └───────────────────────┘
```

---

## 🚀 Quick Setup

### Prerequisites
- A Google account
- A web browser
- A static file host (or open locally)

### Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a **new blank spreadsheet**
2. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/COPY_THIS_ID/edit
   ```

### Step 2: Set Up Apps Script Backend

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete the default `function myFunction(){}` code
3. Create two files in the Apps Script editor:
   - `Code.gs` — paste the contents of [`backend/Code.gs`](backend/Code.gs)
   - `Setup.gs` — paste the contents of [`backend/Setup.gs`](backend/Setup.gs)
4. In `Code.gs`, update the configuration:
   ```javascript
   const SPREADSHEET_ID = 'your_spreadsheet_id_here';
   const ADMIN_EMAIL = 'your-admin@email.com';
   const ADMIN_PASSWORD = 'your_secure_password';
   ```
5. **Save** all files (Ctrl+S)

### Step 3: Initialize Database

1. In the Apps Script editor, select `setupDatabase` from the function dropdown
2. Click **▶ Run**
3. **Authorize** the script when prompted (review & allow)
4. Check the execution log — you should see "✅ Setup complete!"

This automatically creates:
- 6 sheets with proper headers and formatting
- Data validation rules
- Admin user account
- 8 default coupon categories

### Step 4: Deploy as Web App

1. Click **Deploy → New Deployment**
2. Click the gear icon ⚙️ → Select **Web App**
3. Configure:
   - **Description**: `CuponCode API v1`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
4. Click **Deploy**
5. **Copy the Web App URL** (looks like `https://script.google.com/macros/s/.../exec`)

### Step 5: Configure Frontend

1. Open `js/config.js` in your editor
2. Replace the API URL:
   ```javascript
   API_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
   ```
3. Save the file

### Step 6: Launch

- **Local**: Open `index.html` in your browser
- **Hosted**: Upload all files to GitHub Pages, Netlify, Vercel, or any static host

### Step 7: Login

Use your admin credentials (from Step 2) to log in at the login page.

---

## 📂 Project Structure

```
CuponCode/
├── css/
│   ├── variables.css      # 🎨 Design tokens (colors, fonts, spacing)
│   ├── base.css           # 📄 Reset & base element styles
│   ├── components.css     # 🧩 UI components (buttons, cards, forms...)
│   ├── layout.css         # 📐 App layout & responsive breakpoints
│   └── animations.css     # ✨ Keyframes & animation classes
├── js/
│   ├── config.js          # ⚙️ Application constants
│   ├── api.js             # 🌐 API client (18 endpoints)
│   ├── session.js         # 🔑 Session & route guards
│   ├── utils.js           # 🛠️ Toasts, modals, formatting, validation
│   ├── auth.js            # 🔐 Login, register, OTP handlers
│   ├── coupons.js         # 🎫 Marketplace & coupon operations
│   ├── wallet.js          # 💰 Wallet & transaction display
│   ├── referral.js        # 🤝 Referral system
│   ├── router.js          # 🧭 Template helpers (sidebar, nav)
│   └── admin.js           # 🛡️ Admin panel logic
├── backend/
│   ├── Code.gs            # 📡 Google Apps Script API
│   └── Setup.gs           # 🔧 Database setup & test utilities
├── index.html             # 🏪 Landing / Marketplace
├── login.html             # 🔐 Login
├── register.html          # 📝 Registration
├── forgot-password.html   # 🔑 Password recovery
├── dashboard.html         # 📊 User dashboard
├── upload-coupon.html     # 📤 Upload coupon
├── my-coupons.html        # 🎫 My coupons
├── my-vault.html          # 🔒 Purchased coupons
├── wallet.html            # 💰 Wallet
├── referral.html          # 🤝 Referrals
├── admin.html             # 🛡️ Admin dashboard
├── admin-coupons.html     # 🎫 Admin coupon management
├── admin-categories.html  # 📁 Admin categories
├── admin-users.html       # 👥 Admin user management
├── admin-transactions.html# 💳 Admin transactions
├── 404.html               # ❌ Page not found
└── README.md              # 📖 This file
```

---

## 💰 Coin Economy

| Action | Coins |
|--------|-------|
| New user signup bonus | +100 |
| Referrer reward | +50 |
| Sell a coupon | +price |
| Buy a coupon | -price |
| Admin adjustment | ±amount |

---

## 🔒 Security

- **Password Hashing**: SHA-256 with salt (server-side)
- **OTP Verification**: 6-digit codes with 10-minute expiry
- **Session Management**: Client-side with activity timeout
- **Role-Based Access**: User/Admin route guards
- **Input Validation**: Client-side and server-side
- **HTML Escaping**: Prevents XSS on all user inputs

> **Note**: Google Sheets is suitable for small/medium projects. For production at scale, consider migrating to a dedicated database (Firebase, Supabase, etc.)

---

## ⚠️ Known Limitations

- **Google Apps Script** cold starts may cause 10-20 second delays on first request
- **Gmail** free accounts have a daily email sending limit of ~100 emails
- **Google Sheets** may slow down with 10,000+ rows per sheet
- **No real-time updates** — data refreshes on page load/action



---

<img width="1587" height="2245" alt="CuponCode Poster" src="https://github.com/user-attachments/assets/c8c58687-a64f-4b2a-85aa-6281a93680ff" />



---

<p align="center">Built with ❤️ using vanilla HTML, CSS, JS + Google Apps Script</p>
