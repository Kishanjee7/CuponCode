// ============================================
// CuponCode Configuration
// ============================================

const CONFIG = {
  // Google Apps Script Web App URL - UPDATE THIS after deployment
  API_URL: 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL',

  // App Info
  APP_NAME: 'CuponCode',
  APP_VERSION: '1.0.0',

  // Session
  SESSION_KEY: 'cuponcode_session',
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes in ms

  // Coins
  NEW_USER_BONUS: 100,
  REFERRAL_REWARD: 50,

  // OTP
  OTP_LENGTH: 6,
  OTP_EXPIRY: 10 * 60 * 1000, // 10 minutes
  OTP_RESEND_COOLDOWN: 60, // seconds

  // Pagination
  ITEMS_PER_PAGE: 12,

  // Coupon
  MIN_COUPON_PRICE: 1,
  MAX_COUPON_PRICE: 10000,
  MAX_DESCRIPTION_LENGTH: 500,

  // Password
  MIN_PASSWORD_LENGTH: 8,

  // Roles
  ROLES: {
    ADMIN: 'admin',
    USER: 'user'
  },

  // Coupon Statuses
  COUPON_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    SOLD: 'sold'
  },

  // User Statuses
  USER_STATUS: {
    ACTIVE: 'active',
    SUSPENDED: 'suspended'
  },

  // Transaction Types
  TRANSACTION_TYPES: {
    SIGNUP_BONUS: 'signup_bonus',
    REFERRAL_BONUS: 'referral_bonus',
    COUPON_PURCHASE: 'coupon_purchase',
    COUPON_SALE: 'coupon_sale',
    ADMIN_ADJUSTMENT: 'admin_adjustment'
  }
};
