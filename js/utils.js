// ============================================
// CuponCode Utility Functions
// ============================================

const Utils = {
    /**
     * Show a toast notification
     */
    toast(message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

        container.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    },

    /**
     * Show a confirmation modal
     */
    confirm(title, message, onConfirm, confirmText = 'Confirm', confirmClass = 'btn-primary') {
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop active';
        backdrop.innerHTML = `
      <div class="modal" style="max-width: 400px;">
        <h3 class="modal-title">${title}</h3>
        <p style="color: var(--text-secondary); margin-bottom: var(--space-6);">${message}</p>
        <div class="flex gap-3" style="justify-content: flex-end;">
          <button class="btn btn-secondary" id="confirm-cancel">Cancel</button>
          <button class="btn ${confirmClass}" id="confirm-ok">${confirmText}</button>
        </div>
      </div>
    `;

        document.body.appendChild(backdrop);

        backdrop.querySelector('#confirm-cancel').onclick = () => backdrop.remove();
        backdrop.querySelector('#confirm-ok').onclick = () => {
            backdrop.remove();
            onConfirm();
        };
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) backdrop.remove();
        });
    },

    /**
     * Format date string
     */
    formatDate(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    },

    /**
     * Format date with time
     */
    formatDateTime(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    },

    /**
     * Format relative time
     */
    timeAgo(dateStr) {
        const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
        const intervals = [
            { label: 'year', seconds: 31536000 },
            { label: 'month', seconds: 2592000 },
            { label: 'week', seconds: 604800 },
            { label: 'day', seconds: 86400 },
            { label: 'hour', seconds: 3600 },
            { label: 'minute', seconds: 60 }
        ];
        for (const { label, seconds: s } of intervals) {
            const count = Math.floor(seconds / s);
            if (count >= 1) return `${count} ${label}${count > 1 ? 's' : ''} ago`;
        }
        return 'Just now';
    },

    /**
     * Format coin amount
     */
    formatCoins(amount) {
        return Number(amount).toLocaleString();
    },

    /**
     * Validate email
     */
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    /**
     * Check password strength
     */
    getPasswordStrength(password) {
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        if (score <= 1) return 'weak';
        if (score <= 2) return 'fair';
        if (score <= 3) return 'strong';
        return 'very-strong';
    },

    /**
     * Generate referral code
     */
    generateReferralCode(username) {
        return username.toUpperCase().slice(0, 4) + Math.random().toString(36).substr(2, 4).toUpperCase();
    },

    /**
     * Copy text to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.toast('Copied to clipboard!', 'success');
        } catch {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.toast('Copied to clipboard!', 'success');
        }
    },

    /**
     * Debounce function
     */
    debounce(func, wait = 300) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },

    /**
     * Escape HTML
     */
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Set loading state on button
     */
    setLoading(btn, loading) {
        if (loading) {
            btn.classList.add('loading');
            btn.disabled = true;
            btn._originalText = btn.textContent;
        } else {
            btn.classList.remove('loading');
            btn.disabled = false;
            if (btn._originalText) btn.textContent = btn._originalText;
        }
    },

    /**
     * Create a coin display element
     */
    coinHtml(amount, size = '') {
        const cls = size ? `coin-display coin-${size}` : 'coin-display';
        return `<span class="${cls}"><span class="coin-icon">₵</span>${this.formatCoins(amount)}</span>`;
    },

    /**
     * Get status badge HTML
     */
    statusBadge(status) {
        const map = {
            pending: 'badge-pending',
            approved: 'badge-approved',
            sold: 'badge-sold',
            rejected: 'badge-rejected',
            active: 'badge-active',
            suspended: 'badge-suspended'
        };
        return `<span class="badge ${map[status] || 'badge-pending'}">${status}</span>`;
    },

    /**
     * Get user initial for avatar
     */
    getInitial(name) {
        return (name || '?').charAt(0).toUpperCase();
    },

    /**
     * Render pagination
     */
    renderPagination(currentPage, totalPages, onPageClick) {
        if (totalPages <= 1) return '';

        let html = '<div class="pagination">';
        html += `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="${onPageClick}(${currentPage - 1})">‹</button>`;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="${onPageClick}(${i})">${i}</button>`;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                html += '<span style="color: var(--text-tertiary);">…</span>';
            }
        }

        html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="${onPageClick}(${currentPage + 1})">›</button>`;
        html += '</div>';
        return html;
    },

    /**
     * Initialize sidebar and mobile navigation
     */
    initSidebar() {
        const menuBtn = document.querySelector('.mobile-menu-btn');
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');

        if (menuBtn && sidebar) {
            menuBtn.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                if (overlay) overlay.classList.toggle('open');
            });
        }

        if (overlay) {
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                overlay.classList.remove('open');
            });
        }

        // Set active nav link
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            }
        });

        document.querySelectorAll('.bottom-nav-item').forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            }
        });

        // Update user info in sidebar
        const session = Session.get();
        if (session) {
            const nameEl = document.querySelector('.sidebar-user-name');
            const emailEl = document.querySelector('.sidebar-user-email');
            const avatarEl = document.querySelector('.sidebar-user .avatar');
            const coinEl = document.querySelector('.coin-amount');

            if (nameEl) nameEl.textContent = session.username;
            if (emailEl) emailEl.textContent = session.email;
            if (avatarEl) avatarEl.textContent = this.getInitial(session.username);
            if (coinEl) coinEl.textContent = this.formatCoins(session.coins || 0);
        }
    },

    /**
     * Initialize dropdown menus
     */
    initDropdowns() {
        document.querySelectorAll('.dropdown').forEach(dropdown => {
            const trigger = dropdown.querySelector('[data-dropdown]');
            if (trigger) {
                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.classList.toggle('open');
                });
            }
        });

        document.addEventListener('click', () => {
            document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
        });
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    Utils.initDropdowns();
});
