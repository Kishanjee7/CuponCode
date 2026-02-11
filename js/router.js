// ============================================
// CuponCode - Page Router / Template Helpers
// ============================================

const Router = {
    /**
     * Generate sidebar HTML for user pages
     */
    userSidebar() {
        return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <a href="index.html" class="sidebar-logo">
          <div class="logo-icon">🎟️</div>
          <span class="logo-text">CuponCode</span>
        </a>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title">Main</div>
          <a href="dashboard.html" class="nav-link"><span class="nav-icon">📊</span> Dashboard</a>
          <a href="index.html" class="nav-link"><span class="nav-icon">🏪</span> Marketplace</a>
        </div>
        <div class="nav-section">
          <div class="nav-section-title">Coupons</div>
          <a href="upload-coupon.html" class="nav-link"><span class="nav-icon">📤</span> Upload Coupon</a>
          <a href="my-coupons.html" class="nav-link"><span class="nav-icon">🎫</span> My Coupons</a>
          <a href="my-vault.html" class="nav-link"><span class="nav-icon">🔐</span> My Vault</a>
        </div>
        <div class="nav-section">
          <div class="nav-section-title">Account</div>
          <a href="wallet.html" class="nav-link"><span class="nav-icon">💰</span> Wallet</a>
          <a href="referral.html" class="nav-link"><span class="nav-icon">🤝</span> Referrals</a>
        </div>
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user" onclick="document.getElementById('user-dropdown').classList.toggle('open')">
          <div class="avatar">U</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">User</div>
            <div class="sidebar-user-email">user@email.com</div>
          </div>
          <span style="color: var(--text-tertiary);">⋮</span>
        </div>
        <div class="dropdown" id="user-dropdown">
          <div class="dropdown-menu" style="bottom: 100%; top: auto; left: 0; right: 0;">
            <button class="dropdown-item" onclick="Router.showChangePassword()">🔑 Change Password</button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" onclick="Session.logout()" style="color: var(--danger);">🚪 Logout</button>
          </div>
        </div>
      </div>
    </aside>
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
    `;
    },

    /**
     * Generate sidebar HTML for admin pages
     */
    adminSidebar() {
        return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <a href="admin.html" class="sidebar-logo">
          <div class="logo-icon">🛡️</div>
          <span class="logo-text">Admin Panel</span>
        </a>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title">Admin</div>
          <a href="admin.html" class="nav-link"><span class="nav-icon">📊</span> Dashboard</a>
          <a href="admin-coupons.html" class="nav-link"><span class="nav-icon">🎫</span> Coupons</a>
          <a href="admin-categories.html" class="nav-link"><span class="nav-icon">📁</span> Categories</a>
          <a href="admin-users.html" class="nav-link"><span class="nav-icon">👥</span> Users</a>
          <a href="admin-transactions.html" class="nav-link"><span class="nav-icon">💳</span> Transactions</a>
        </div>
        <div class="nav-section">
          <div class="nav-section-title">Quick Links</div>
          <a href="index.html" class="nav-link"><span class="nav-icon">🏪</span> View Marketplace</a>
        </div>
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="avatar" style="background: linear-gradient(135deg, #ef4444, #f59e0b);">A</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">Admin</div>
            <div class="sidebar-user-email">admin@cuponcode.com</div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm btn-block mt-2" onclick="Session.logout()" style="color: var(--danger);">🚪 Logout</button>
      </div>
    </aside>
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
    `;
    },

    /**
     * Generate top header
     */
    topHeader(title) {
        return `
    <header class="top-header">
      <div class="header-left">
        <button class="mobile-menu-btn" onclick="document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebar-overlay').classList.toggle('open');">☰</button>
        <h2 class="page-title">${title}</h2>
      </div>
      <div class="header-right">
        <a href="wallet.html" class="header-coins" title="Your coin balance">
          <span class="coin-icon-sm">₵</span>
          <span class="coin-amount">0</span>
        </a>
        <div class="avatar" style="cursor: pointer;" onclick="window.location.href='dashboard.html'"></div>
      </div>
    </header>
    `;
    },

    /**
     * Generate mobile bottom nav
     */
    mobileNav() {
        return `
    <nav class="mobile-bottom-nav">
      <div class="bottom-nav-items">
        <a href="index.html" class="bottom-nav-item"><span class="nav-item-icon">🏪</span>Market</a>
        <a href="my-coupons.html" class="bottom-nav-item"><span class="nav-item-icon">🎫</span>Coupons</a>
        <a href="upload-coupon.html" class="bottom-nav-item"><span class="nav-item-icon">➕</span>Upload</a>
        <a href="wallet.html" class="bottom-nav-item"><span class="nav-item-icon">💰</span>Wallet</a>
        <a href="dashboard.html" class="bottom-nav-item"><span class="nav-item-icon">👤</span>Profile</a>
      </div>
    </nav>
    `;
    },

    /**
     * Show Change Password Modal
     */
    showChangePassword() {
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop active';
        backdrop.id = 'change-pwd-modal';
        backdrop.innerHTML = `
      <div class="modal">
        <button class="modal-close" onclick="document.getElementById('change-pwd-modal').remove()">✕</button>
        <h3 class="modal-title">Change Password</h3>
        <form onsubmit="Auth.handleChangePassword(event); return false;">
          <div class="input-group">
            <label>Current Password</label>
            <input type="password" id="current-password" placeholder="Enter current password" required>
          </div>
          <div class="input-group">
            <label>New Password</label>
            <input type="password" id="new-password" placeholder="Enter new password" required minlength="${CONFIG.MIN_PASSWORD_LENGTH}">
          </div>
          <div class="input-group">
            <label>Confirm New Password</label>
            <input type="password" id="confirm-password" placeholder="Confirm new password" required>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Update Password</button>
        </form>
      </div>
    `;
        document.body.appendChild(backdrop);
        backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.remove(); });
    }
};
