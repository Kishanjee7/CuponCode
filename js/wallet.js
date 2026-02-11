// ============================================
// CuponCode - Wallet & Transaction Logic
// ============================================

const Wallet = {
    currentPage: 1,
    currentFilter: 'all',

    async load(page = 1, type = 'all') {
        this.currentPage = page;
        this.currentFilter = type;

        // Update active tab
        document.querySelectorAll('.tab-item').forEach(t => {
            t.classList.toggle('active', t.dataset.type === type);
        });

        const container = document.getElementById('transactions-list');
        if (!container) return;
        container.innerHTML = '<div class="skeleton skeleton-text" style="height: 50px;"></div>'.repeat(5);

        const result = await API.getWallet(page, type);

        if (result.success) {
            // Update balance
            const balanceEl = document.getElementById('wallet-balance');
            if (balanceEl) balanceEl.textContent = Utils.formatCoins(result.balance);

            if (result.transactions.length > 0) {
                container.innerHTML = `
          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th style="text-align: right;">Amount</th>
                  <th style="text-align: right;">Balance</th>
                </tr>
              </thead>
              <tbody>
                ${result.transactions.map(t => `
                  <tr>
                    <td>${Utils.formatDate(t.createdAt)}</td>
                    <td>${this.getTypeBadge(t.type)}</td>
                    <td>${Utils.escapeHtml(t.description)}</td>
                    <td style="text-align: right; font-weight: 600; color: ${t.amount > 0 ? 'var(--success)' : 'var(--danger)'};">
                      ${t.amount > 0 ? '+' : ''}${Utils.formatCoins(t.amount)}
                    </td>
                    <td style="text-align: right; color: var(--text-coin);">${Utils.formatCoins(t.balance)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;

                const pagEl = document.getElementById('wallet-pagination');
                if (pagEl) {
                    pagEl.innerHTML = Utils.renderPagination(page, result.totalPages, 'Wallet.loadPage');
                }
            } else {
                container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">💰</div>
            <h3 class="empty-title">No Transactions Yet</h3>
            <p class="empty-text">Your transaction history will appear here.</p>
          </div>
        `;
            }
        }
    },

    loadPage(page) {
        this.load(page, this.currentFilter);
    },

    getTypeBadge(type) {
        const map = {
            signup_bonus: ['🎁', 'Signup Bonus', 'badge-approved'],
            referral_bonus: ['🤝', 'Referral', 'badge-approved'],
            coupon_purchase: ['🛒', 'Purchase', 'badge-sold'],
            coupon_sale: ['💰', 'Sale', 'badge-approved'],
            admin_adjustment: ['⚙️', 'Admin', 'badge-pending']
        };
        const [icon, label, cls] = map[type] || ['📝', type, 'badge-pending'];
        return `<span class="badge ${cls}">${icon} ${label}</span>`;
    }
};
