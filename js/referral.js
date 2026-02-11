// ============================================
// CuponCode - Referral System Logic
// ============================================

const Referral = {
    async load() {
        const result = await API.getReferralInfo();

        if (result.success) {
            // Referral Code
            const codeEl = document.getElementById('referral-code');
            if (codeEl) codeEl.textContent = result.referralCode;

            // Referral Link
            const linkEl = document.getElementById('referral-link');
            const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
            const referralLink = `${baseUrl}register.html?ref=${result.referralCode}`;
            if (linkEl) linkEl.value = referralLink;

            // Stats
            const totalEl = document.getElementById('total-referrals');
            const coinsEl = document.getElementById('referral-coins');
            if (totalEl) totalEl.textContent = result.totalReferrals || 0;
            if (coinsEl) coinsEl.textContent = Utils.formatCoins(result.totalEarned || 0);

            // Referred Users List
            const listEl = document.getElementById('referred-users');
            if (listEl && result.referredUsers) {
                if (result.referredUsers.length > 0) {
                    listEl.innerHTML = result.referredUsers.map(u => `
            <div class="flex items-center gap-4" style="padding: var(--space-3) 0; border-bottom: 1px solid var(--border-subtle);">
              <div class="avatar avatar-sm">${Utils.getInitial(u.username)}</div>
              <div style="flex: 1;">
                <div style="font-weight: var(--fw-medium); font-size: var(--fs-sm);">${Utils.escapeHtml(u.username)}</div>
                <div style="font-size: var(--fs-xs); color: var(--text-tertiary);">Joined ${Utils.timeAgo(u.createdAt)}</div>
              </div>
              <span class="coin-display">${Utils.coinHtml(CONFIG.REFERRAL_REWARD)}</span>
            </div>
          `).join('');
                } else {
                    listEl.innerHTML = `
            <div class="empty-state" style="padding: var(--space-8);">
              <div class="empty-icon">👥</div>
              <h3 class="empty-title">No Referrals Yet</h3>
              <p class="empty-text">Share your code and earn ${CONFIG.REFERRAL_REWARD} coins per signup!</p>
            </div>
          `;
                }
            }
        }
    },

    copyCode() {
        const code = document.getElementById('referral-code')?.textContent;
        if (code) Utils.copyToClipboard(code);
    },

    copyLink() {
        const link = document.getElementById('referral-link')?.value;
        if (link) Utils.copyToClipboard(link);
    },

    shareLink() {
        const link = document.getElementById('referral-link')?.value;
        const text = `Join CuponCode and get ${CONFIG.NEW_USER_BONUS} bonus coins! Use my referral code.`;
        if (navigator.share) {
            navigator.share({ title: 'Join CuponCode', text, url: link });
        } else {
            Utils.copyToClipboard(link);
        }
    }
};
