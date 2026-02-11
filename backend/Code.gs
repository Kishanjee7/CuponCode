// ============================================================
// CuponCode - Google Apps Script Backend
// Deploy as Web App: Execute as Me, Access: Anyone
// ============================================================

// ---- CONFIGURATION ----
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
const ADMIN_EMAIL = 'admin@cuponcode.com';
const ADMIN_PASSWORD = 'admin123'; // Change this! Used for initial seed only
const OTP_EXPIRY_MINUTES = 10;

// ---- SHEET NAMES ----
const SHEETS = {
  USERS: 'Users',
  COUPONS: 'Coupons',
  TRANSACTIONS: 'Transactions',
  CATEGORIES: 'Categories',
  OTP: 'OTP',
  REFERRALS: 'Referrals'
};

// ---- HELPERS ----
function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    initSheet(sheet, name);
  }
  return sheet;
}

function initSheet(sheet, name) {
  const headers = {
    [SHEETS.USERS]: ['id', 'email', 'username', 'passwordHash', 'role', 'coins', 'referralCode', 'referredBy', 'status', 'createdAt'],
    [SHEETS.COUPONS]: ['id', 'uploaderId', 'category', 'code', 'description', 'price', 'status', 'buyerId', 'createdAt', 'verifiedAt', 'soldAt'],
    [SHEETS.TRANSACTIONS]: ['id', 'userId', 'type', 'amount', 'balance', 'relatedId', 'description', 'createdAt'],
    [SHEETS.CATEGORIES]: ['id', 'name', 'icon', 'status', 'createdAt'],
    [SHEETS.OTP]: ['id', 'email', 'code', 'type', 'expiresAt', 'used'],
    [SHEETS.REFERRALS]: ['id', 'referrerId', 'referredUserId', 'reward', 'createdAt']
  };
  if (headers[name]) {
    sheet.getRange(1, 1, 1, headers[name].length).setValues([headers[name]]);
    sheet.setFrozenRows(1);
  }
}

function generateId() {
  return Utilities.getUuid();
}

function hashPassword(password) {
  const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + 'cuponcode_salt');
  return raw.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

function getSheetData(sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function appendRow(sheetName, rowObj) {
  const sheet = getSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => rowObj[h] || '');
  sheet.appendRow(row);
}

function updateRow(sheetName, id, updates) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('id');
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === id) {
      for (const [key, value] of Object.entries(updates)) {
        const col = headers.indexOf(key);
        if (col !== -1) {
          sheet.getRange(i + 1, col + 1).setValue(value);
        }
      }
      return true;
    }
  }
  return false;
}

function deleteRow(sheetName, id) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const idCol = data[0].indexOf('id');
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][idCol] === id) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function findUser(emailOrUsername) {
  const users = getSheetData(SHEETS.USERS);
  return users.find(u =>
    u.email.toString().toLowerCase() === emailOrUsername.toLowerCase() ||
    u.username.toString().toLowerCase() === emailOrUsername.toLowerCase()
  );
}

function findUserById(id) {
  return getSheetData(SHEETS.USERS).find(u => u.id === id);
}

function now() {
  return new Date().toISOString();
}

// ---- SEED ADMIN ----
function seedAdmin() {
  const users = getSheetData(SHEETS.USERS);
  if (!users.find(u => u.role === 'admin')) {
    appendRow(SHEETS.USERS, {
      id: generateId(),
      email: ADMIN_EMAIL,
      username: 'admin',
      passwordHash: hashPassword(ADMIN_PASSWORD),
      role: 'admin',
      coins: 0,
      referralCode: 'ADMIN',
      referredBy: '',
      status: 'active',
      createdAt: now()
    });
  }
  // Seed default categories
  const cats = getSheetData(SHEETS.CATEGORIES);
  if (cats.length === 0) {
    const defaults = [
      { name: 'Food & Dining', icon: '🍔' },
      { name: 'Shopping', icon: '🛍️' },
      { name: 'Travel', icon: '✈️' },
      { name: 'Entertainment', icon: '🎬' },
      { name: 'Technology', icon: '💻' },
      { name: 'Health & Beauty', icon: '💊' },
      { name: 'Education', icon: '📚' },
      { name: 'Other', icon: '📦' }
    ];
    defaults.forEach(c => appendRow(SHEETS.CATEGORIES, {
      id: generateId(), name: c.name, icon: c.icon, status: 'active', createdAt: now()
    }));
  }
}

// ---- OTP ----
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function sendOTP(email, otp, type) {
  // Invalidate old OTPs
  const otps = getSheetData(SHEETS.OTP);
  otps.forEach(o => {
    if (o.email === email && o.type === type && o.used !== 'true') {
      updateRow(SHEETS.OTP, o.id, { used: 'true' });
    }
  });

  const id = generateId();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
  appendRow(SHEETS.OTP, { id, email, code: otp, type, expiresAt, used: 'false' });

  const isRegistration = type === 'registration';
  const subject = isRegistration
    ? '🎟️ CuponCode - Verify Your Email'
    : '🔑 CuponCode - Password Reset Code';
  
  const heading = isRegistration ? 'Verify Your Email' : 'Reset Your Password';
  const intro = isRegistration
    ? 'Welcome to CuponCode! Please verify your email address to get started.'
    : 'We received a request to reset your password. Use the code below.';

  const htmlBody = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0a0a1a; color: #e0e0ff; border-radius: 16px; overflow: hidden; border: 1px solid #2a2a4a;">
      <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center;">
        <div style="font-size: 36px; margin-bottom: 8px;">🎟️</div>
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">CuponCode</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px;">Secure Coupon Marketplace</p>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #e0e0ff; font-size: 20px; margin: 0 0 12px;">${heading}</h2>
        <p style="color: #a0a0c0; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">${intro}</p>
        <div style="background: rgba(99,102,241,0.1); border: 2px dashed #6366f1; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #a0a0c0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">Verification Code</p>
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #8b5cf6; font-family: 'Courier New', monospace;">${otp}</div>
        </div>
        <p style="color: #a0a0c0; font-size: 13px; line-height: 1.5; margin: 0;">
          ⏱️ This code expires in <strong style="color: #f59e0b;">${OTP_EXPIRY_MINUTES} minutes</strong>.<br>
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
      <div style="padding: 16px 32px; border-top: 1px solid #2a2a4a; text-align: center;">
        <p style="color: #666680; font-size: 11px; margin: 0;">© 2026 CuponCode. All rights reserved.</p>
      </div>
    </div>
  `;

  const plainBody = `Your CuponCode verification code is: ${otp}\n\nThis code expires in ${OTP_EXPIRY_MINUTES} minutes.\n\nIf you didn't request this, please ignore this email.`;

  try {
    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: plainBody,
      htmlBody: htmlBody
    });
    return true;
  } catch (e) {
    Logger.log('Email error: ' + e.toString());
    return false;
  }
}

function verifyOTPCode(email, code, type) {
  const otps = getSheetData(SHEETS.OTP);
  const valid = otps.find(o =>
    o.email === email &&
    o.code.toString() === code.toString() &&
    o.type === type &&
    o.used.toString() !== 'true' &&
    new Date(o.expiresAt) > new Date()
  );
  if (valid) {
    updateRow(SHEETS.OTP, valid.id, { used: 'true' });
    return true;
  }
  return false;
}

// ---- TRANSACTION HELPER ----
function recordTransaction(userId, type, amount, relatedId, description) {
  const user = findUserById(userId);
  const newBalance = Number(user.coins) + Number(amount);
  updateRow(SHEETS.USERS, userId, { coins: newBalance });

  appendRow(SHEETS.TRANSACTIONS, {
    id: generateId(),
    userId,
    type,
    amount,
    balance: newBalance,
    relatedId: relatedId || '',
    description,
    createdAt: now()
  });

  return newBalance;
}

// ---- MAIN ROUTER ----
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    // Ensure admin seed
    seedAdmin();

    // Auth check for protected routes
    const protectedActions = [
      'changePassword', 'uploadCoupon', 'buyCoupon', 'getMyCoupons', 'getMyVault',
      'getWallet', 'getReferralInfo', 'getDashboard',
      'adminGetStats', 'adminGetPendingCoupons', 'adminVerifyCoupon', 'adminGetAllCoupons',
      'adminManageCategory', 'adminGetUsers', 'adminManageUser', 'adminAdjustCoins', 'adminGetTransactions'
    ];

    if (protectedActions.includes(action)) {
      if (!data.userId) {
        return jsonResponse({ success: false, error: 'SESSION_EXPIRED' });
      }
      const user = findUserById(data.userId);
      if (!user || user.status !== 'active') {
        return jsonResponse({ success: false, error: 'SESSION_EXPIRED' });
      }

      // Admin check
      if (action.startsWith('admin') && user.role !== 'admin') {
        return jsonResponse({ success: false, error: 'Unauthorized' });
      }
    }

    switch (action) {
      case 'register': return handleRegister(data);
      case 'verifyOTP': return handleVerifyOTP(data);
      case 'resendOTP': return handleResendOTP(data);
      case 'login': return handleLogin(data);
      case 'forgotPassword': return handleForgotPassword(data);
      case 'resetPassword': return handleResetPassword(data);
      case 'changePassword': return handleChangePassword(data);
      case 'getCategories': return handleGetCategories();
      case 'getCoupons': return handleGetCoupons(data);
      case 'uploadCoupon': return handleUploadCoupon(data);
      case 'buyCoupon': return handleBuyCoupon(data);
      case 'getMyCoupons': return handleGetMyCoupons(data);
      case 'getMyVault': return handleGetMyVault(data);
      case 'getWallet': return handleGetWallet(data);
      case 'getReferralInfo': return handleGetReferralInfo(data);
      case 'getDashboard': return handleGetDashboard(data);
      case 'adminGetStats': return handleAdminGetStats();
      case 'adminGetAllCoupons': return handleAdminGetAllCoupons(data);
      case 'adminVerifyCoupon': return handleAdminVerifyCoupon(data);
      case 'adminManageCategory': return handleAdminManageCategory(data);
      case 'adminGetUsers': return handleAdminGetUsers(data);
      case 'adminManageUser': return handleAdminManageUser(data);
      case 'adminAdjustCoins': return handleAdminAdjustCoins(data);
      case 'adminGetTransactions': return handleAdminGetTransactions(data);
      default: return jsonResponse({ success: false, error: 'Unknown action' });
    }
  } catch (err) {
    Logger.log('Error: ' + err.toString());
    return jsonResponse({ success: false, error: 'Server error: ' + err.message });
  }
}

function doGet(e) {
  seedAdmin();
  const users = getSheetData(SHEETS.USERS).length;
  const coupons = getSheetData(SHEETS.COUPONS).length;
  const cats = getSheetData(SHEETS.CATEGORIES).length;
  
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>CuponCode API</title>
    <style>
      body { font-family: 'Segoe UI', sans-serif; background: #0a0a1a; color: #e0e0ff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
      .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 40px; max-width: 400px; text-align: center; }
      h1 { font-size: 28px; margin: 12px 0 4px; }
      .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: rgba(34,197,94,0.15); color: #22c55e; margin: 8px 0 24px; }
      .stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-top: 20px; }
      .stat { background: rgba(255,255,255,0.03); border-radius: 12px; padding: 16px 8px; }
      .stat-val { font-size: 24px; font-weight: 700; color: #8b5cf6; }
      .stat-lbl { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
      p { color: #666; font-size: 13px; margin-top: 24px; }
    </style></head>
    <body><div class="card">
      <div style="font-size: 48px;">🎟️</div>
      <h1>CuponCode API</h1>
      <div class="badge">✅ Online</div>
      <div class="stats">
        <div class="stat"><div class="stat-val">${users}</div><div class="stat-lbl">Users</div></div>
        <div class="stat"><div class="stat-val">${coupons}</div><div class="stat-lbl">Coupons</div></div>
        <div class="stat"><div class="stat-val">${cats}</div><div class="stat-lbl">Categories</div></div>
      </div>
      <p>API is running. Use POST requests from the frontend.</p>
    </div></body></html>`;

  return HtmlService.createHtmlOutput(html)
    .setTitle('CuponCode API')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- AUTH HANDLERS ----

function handleRegister(data) {
  const { email, username, password, referralCode } = data;

  if (!email || !username || !password) {
    return jsonResponse({ success: false, error: 'All fields are required' });
  }

  const users = getSheetData(SHEETS.USERS);
  if (users.find(u => u.email.toString().toLowerCase() === email.toLowerCase())) {
    return jsonResponse({ success: false, error: 'Email already registered' });
  }
  if (users.find(u => u.username.toString().toLowerCase() === username.toLowerCase())) {
    return jsonResponse({ success: false, error: 'Username already taken' });
  }

  const id = generateId();
  const refCode = username.toUpperCase().slice(0, 4) + Math.random().toString(36).substr(2, 4).toUpperCase();

  appendRow(SHEETS.USERS, {
    id,
    email,
    username,
    passwordHash: hashPassword(password),
    role: 'user',
    coins: 0, // Will add bonus after OTP verification
    referralCode: refCode,
    referredBy: referralCode || '',
    status: 'pending',
    createdAt: now()
  });

  const otp = generateOTP();
  sendOTP(email, otp, 'registration');

  return jsonResponse({ success: true, message: 'Registration successful. Verify your email.' });
}

function handleVerifyOTP(data) {
  const { email, otp, type } = data;

  if (!verifyOTPCode(email, otp, type)) {
    return jsonResponse({ success: false, error: 'Invalid or expired OTP' });
  }

  if (type === 'registration') {
    const users = getSheetData(SHEETS.USERS);
    const user = users.find(u => u.email.toString().toLowerCase() === email.toLowerCase());
    if (!user) return jsonResponse({ success: false, error: 'User not found' });

    updateRow(SHEETS.USERS, user.id, { status: 'active' });

    // Signup bonus
    const bonus = 100;
    recordTransaction(user.id, 'signup_bonus', bonus, '', 'Welcome bonus for signing up');

    // Referral reward
    if (user.referredBy) {
      const referrer = users.find(u => u.referralCode === user.referredBy);
      if (referrer) {
        recordTransaction(referrer.id, 'referral_bonus', 50, user.id, `Referral reward for inviting ${user.username}`);
        appendRow(SHEETS.REFERRALS, {
          id: generateId(),
          referrerId: referrer.id,
          referredUserId: user.id,
          reward: 50,
          createdAt: now()
        });
      }
    }

    return jsonResponse({ success: true, message: 'Email verified' });
  }

  return jsonResponse({ success: true, message: 'OTP verified' });
}

function handleResendOTP(data) {
  const { email, type } = data;
  const otp = generateOTP();
  sendOTP(email, otp, type);
  return jsonResponse({ success: true });
}

function handleLogin(data) {
  const { emailOrUsername, password } = data;
  const user = findUser(emailOrUsername);

  if (!user) {
    return jsonResponse({ success: false, error: 'User not found' });
  }
  if (user.status === 'pending') {
    return jsonResponse({ success: false, error: 'Please verify your email first' });
  }
  if (user.status === 'suspended') {
    return jsonResponse({ success: false, error: 'Account suspended. Contact admin.' });
  }
  if (user.passwordHash !== hashPassword(password)) {
    return jsonResponse({ success: false, error: 'Invalid password' });
  }

  return jsonResponse({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      coins: Number(user.coins),
      referralCode: user.referralCode,
      token: 'tk_' + generateId()
    }
  });
}

function handleForgotPassword(data) {
  const user = findUser(data.email);
  if (!user) return jsonResponse({ success: false, error: 'Email not found' });

  const otp = generateOTP();
  sendOTP(data.email, otp, 'forgot_password');
  return jsonResponse({ success: true });
}

function handleResetPassword(data) {
  const { email, otp, newPassword } = data;
  if (!verifyOTPCode(email, otp, 'forgot_password')) {
    return jsonResponse({ success: false, error: 'Invalid or expired OTP' });
  }

  const users = getSheetData(SHEETS.USERS);
  const user = users.find(u => u.email.toString().toLowerCase() === email.toLowerCase());
  if (!user) return jsonResponse({ success: false, error: 'User not found' });

  updateRow(SHEETS.USERS, user.id, { passwordHash: hashPassword(newPassword) });
  return jsonResponse({ success: true, message: 'Password reset successful' });
}

function handleChangePassword(data) {
  const user = findUserById(data.userId);
  if (user.passwordHash !== hashPassword(data.currentPassword)) {
    return jsonResponse({ success: false, error: 'Current password is incorrect' });
  }
  updateRow(SHEETS.USERS, user.id, { passwordHash: hashPassword(data.newPassword) });
  return jsonResponse({ success: true });
}

// ---- COUPON HANDLERS ----

function handleGetCategories() {
  const cats = getSheetData(SHEETS.CATEGORIES).filter(c => c.status === 'active');
  return jsonResponse({ success: true, categories: cats });
}

function handleGetCoupons(data) {
  const { page = 1, category, sort, search } = data;
  let coupons = getSheetData(SHEETS.COUPONS).filter(c => c.status === 'approved');
  const users = getSheetData(SHEETS.USERS);

  if (category) coupons = coupons.filter(c => c.category === category);
  if (search) {
    const q = search.toLowerCase();
    coupons = coupons.filter(c => c.description.toString().toLowerCase().includes(q) || c.category.toString().toLowerCase().includes(q));
  }

  // Add uploader name
  coupons = coupons.map(c => {
    const u = users.find(u => u.id === c.uploaderId);
    return { ...c, uploaderName: u ? u.username : 'Anonymous' };
  });

  // Sort
  if (sort === 'price_low') coupons.sort((a, b) => Number(a.price) - Number(b.price));
  else if (sort === 'price_high') coupons.sort((a, b) => Number(b.price) - Number(a.price));
  else coupons.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const perPage = 12;
  const totalPages = Math.ceil(coupons.length / perPage);
  const pageData = coupons.slice((page - 1) * perPage, page * perPage);

  return jsonResponse({ success: true, coupons: pageData, totalPages, total: coupons.length });
}

function handleUploadCoupon(data) {
  const { userId, category, code, description, price } = data;

  // Check for duplicate code
  const existing = getSheetData(SHEETS.COUPONS).find(c => c.code.toString() === code && c.status !== 'rejected');
  if (existing) {
    return jsonResponse({ success: false, error: 'This coupon code already exists' });
  }

  appendRow(SHEETS.COUPONS, {
    id: generateId(),
    uploaderId: userId,
    category,
    code,
    description,
    price: Number(price),
    status: 'pending',
    buyerId: '',
    createdAt: now(),
    verifiedAt: '',
    soldAt: ''
  });

  return jsonResponse({ success: true, message: 'Coupon submitted for review' });
}

function handleBuyCoupon(data) {
  const { userId, couponId } = data;

  const coupons = getSheetData(SHEETS.COUPONS);
  const coupon = coupons.find(c => c.id === couponId);

  if (!coupon || coupon.status !== 'approved') {
    return jsonResponse({ success: false, error: 'Coupon not available' });
  }

  const buyer = findUserById(userId);
  const price = Number(coupon.price);

  if (coupon.uploaderId === userId) {
    return jsonResponse({ success: false, error: 'You cannot buy your own coupon' });
  }

  if (Number(buyer.coins) < price) {
    return jsonResponse({ success: false, error: 'Insufficient coins' });
  }

  // Update coupon status
  updateRow(SHEETS.COUPONS, couponId, { status: 'sold', buyerId: userId, soldAt: now() });

  // Deduct from buyer
  const newBalance = recordTransaction(userId, 'coupon_purchase', -price, couponId, `Purchased coupon: ${coupon.description}`);

  // Credit to seller
  recordTransaction(coupon.uploaderId, 'coupon_sale', price, couponId, `Sold coupon: ${coupon.description}`);

  return jsonResponse({ success: true, newBalance });
}

function handleGetMyCoupons(data) {
  const { userId, status } = data;
  let coupons = getSheetData(SHEETS.COUPONS).filter(c => c.uploaderId === userId);
  if (status && status !== 'all') coupons = coupons.filter(c => c.status === status);
  coupons.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return jsonResponse({ success: true, coupons });
}

function handleGetMyVault(data) {
  const coupons = getSheetData(SHEETS.COUPONS)
    .filter(c => c.buyerId === data.userId && c.status === 'sold')
    .sort((a, b) => new Date(b.soldAt) - new Date(a.soldAt));
  return jsonResponse({ success: true, coupons });
}

function handleGetWallet(data) {
  const { userId, page = 1, type } = data;
  const user = findUserById(userId);
  let transactions = getSheetData(SHEETS.TRANSACTIONS).filter(t => t.userId === userId);

  if (type && type !== 'all') transactions = transactions.filter(t => t.type === type);
  transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const perPage = 15;
  const totalPages = Math.ceil(transactions.length / perPage);
  const pageData = transactions.slice((page - 1) * perPage, page * perPage);

  return jsonResponse({
    success: true,
    balance: Number(user.coins),
    transactions: pageData,
    totalPages
  });
}

function handleGetReferralInfo(data) {
  const user = findUserById(data.userId);
  const referrals = getSheetData(SHEETS.REFERRALS).filter(r => r.referrerId === data.userId);
  const users = getSheetData(SHEETS.USERS);

  const referredUsers = referrals.map(r => {
    const u = users.find(u => u.id === r.referredUserId);
    return u ? { username: u.username, createdAt: r.createdAt } : null;
  }).filter(Boolean);

  return jsonResponse({
    success: true,
    referralCode: user.referralCode,
    totalReferrals: referrals.length,
    totalEarned: referrals.reduce((sum, r) => sum + Number(r.reward), 0),
    referredUsers
  });
}

function handleGetDashboard(data) {
  const userId = data.userId;
  const coupons = getSheetData(SHEETS.COUPONS);
  const transactions = getSheetData(SHEETS.TRANSACTIONS)
    .filter(t => t.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  const myCoupons = coupons.filter(c => c.uploaderId === userId);

  const recentActivity = transactions.map(t => ({
    icon: { signup_bonus: '🎁', referral_bonus: '🤝', coupon_purchase: '🛒', coupon_sale: '💰', admin_adjustment: '⚙️' }[t.type] || '📝',
    description: t.description,
    amount: Number(t.amount),
    createdAt: t.createdAt
  }));

  return jsonResponse({
    success: true,
    stats: {
      uploaded: myCoupons.length,
      approved: myCoupons.filter(c => c.status === 'approved').length,
      sold: myCoupons.filter(c => c.status === 'sold').length,
      purchased: coupons.filter(c => c.buyerId === userId).length
    },
    recentActivity
  });
}

// ---- ADMIN HANDLERS ----

function handleAdminGetStats() {
  const users = getSheetData(SHEETS.USERS).filter(u => u.role !== 'admin');
  const coupons = getSheetData(SHEETS.COUPONS);
  const transactions = getSheetData(SHEETS.TRANSACTIONS);

  return jsonResponse({
    success: true,
    stats: {
      totalUsers: users.length,
      totalCoupons: coupons.length,
      pendingCoupons: coupons.filter(c => c.status === 'pending').length,
      totalTransactions: transactions.length,
      coinsCirculating: users.reduce((sum, u) => sum + Number(u.coins || 0), 0)
    }
  });
}

function handleAdminGetAllCoupons(data) {
  const { page = 1, status } = data;
  let coupons = getSheetData(SHEETS.COUPONS);
  const users = getSheetData(SHEETS.USERS);

  if (status && status !== 'all') coupons = coupons.filter(c => c.status === status);

  coupons = coupons.map(c => {
    const u = users.find(u => u.id === c.uploaderId);
    return { ...c, uploaderName: u ? u.username : 'Unknown' };
  });

  coupons.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const perPage = 20;
  const totalPages = Math.ceil(coupons.length / perPage);
  const pageData = coupons.slice((page - 1) * perPage, page * perPage);

  return jsonResponse({ success: true, coupons: pageData, totalPages });
}

function handleAdminVerifyCoupon(data) {
  const { couponId, status } = data;
  updateRow(SHEETS.COUPONS, couponId, { status, verifiedAt: now() });
  return jsonResponse({ success: true });
}

function handleAdminManageCategory(data) {
  const { categoryAction, id, name, icon } = data;

  if (categoryAction === 'create') {
    appendRow(SHEETS.CATEGORIES, {
      id: generateId(), name, icon: icon || '📁', status: 'active', createdAt: now()
    });
  } else if (categoryAction === 'update') {
    updateRow(SHEETS.CATEGORIES, id, { name, icon });
  } else if (categoryAction === 'delete') {
    deleteRow(SHEETS.CATEGORIES, id);
  }

  return jsonResponse({ success: true });
}

function handleAdminGetUsers(data) {
  const { page = 1, search } = data;
  let users = getSheetData(SHEETS.USERS);

  if (search) {
    const q = search.toLowerCase();
    users = users.filter(u =>
      u.username.toString().toLowerCase().includes(q) ||
      u.email.toString().toLowerCase().includes(q)
    );
  }

  users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const perPage = 20;
  const totalPages = Math.ceil(users.length / perPage);
  const pageData = users.slice((page - 1) * perPage, page * perPage).map(u => ({
    id: u.id, email: u.email, username: u.username, role: u.role,
    coins: Number(u.coins), status: u.status, createdAt: u.createdAt
  }));

  return jsonResponse({ success: true, users: pageData, totalPages });
}

function handleAdminManageUser(data) {
  const { targetUserId, userAction } = data;
  if (userAction === 'suspend') updateRow(SHEETS.USERS, targetUserId, { status: 'suspended' });
  else if (userAction === 'activate') updateRow(SHEETS.USERS, targetUserId, { status: 'active' });
  else if (userAction === 'delete') deleteRow(SHEETS.USERS, targetUserId);
  return jsonResponse({ success: true });
}

function handleAdminAdjustCoins(data) {
  const { targetUserId, amount, reason } = data;
  recordTransaction(targetUserId, 'admin_adjustment', Number(amount), '', `Admin adjustment: ${reason}`);
  return jsonResponse({ success: true });
}

function handleAdminGetTransactions(data) {
  const { page = 1, type } = data;
  let transactions = getSheetData(SHEETS.TRANSACTIONS);
  const users = getSheetData(SHEETS.USERS);

  if (type && type !== 'all') transactions = transactions.filter(t => t.type === type);
  transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const perPage = 20;
  const totalPages = Math.ceil(transactions.length / perPage);
  const pageData = transactions.slice((page - 1) * perPage, page * perPage).map(t => {
    const u = users.find(u => u.id === t.userId);
    return { ...t, username: u ? u.username : 'Unknown' };
  });

  return jsonResponse({ success: true, transactions: pageData, totalPages });
}
