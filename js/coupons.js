// ============================================
// CuponCode - Coupon & Dashboard Logic
// ============================================

const Coupons = {
    // ---- LOAD COUPONS (Marketplace) ----
    async loadMarketplace(page = 1) {
        const category = document.getElementById('category-filter')?.value || '';
        const sort = document.getElementById('sort-filter')?.value || 'newest';
        const search = document.getElementById('search-input')?.value || '';

        const grid = document.getElementById('coupons-grid');
        if (!grid) return;
        grid.innerHTML = '<div class="skeleton skeleton-card"></div>'.repeat(6);

        const result = await API.getCoupons(page, category, sort, search);

        if (result.success) {
            if (result.coupons.length === 0) {
                grid.innerHTML = `
          <div class="empty-state" style="grid-column: 1/-1;">
            <div class="empty-icon">🎟️</div>
            <h3 class="empty-title">No Coupons Found</h3>
            <p class="empty-text">Try adjusting your filters or check back later.</p>
          </div>
        `;
            } else {
                grid.innerHTML = result.coupons.map(c => this.renderCouponCard(c)).join('');
            }

            const pagEl = document.getElementById('pagination');
            if (pagEl) {
                pagEl.innerHTML = Utils.renderPagination(page, result.totalPages, 'Coupons.loadMarketplace');
            }
        } else {
            grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-icon">⚠️</div>
        <h3 class="empty-title">Error Loading Coupons</h3>
        <p class="empty-text">${result.error || 'Please try again later.'}</p>
      </div>`;
        }
    },

    renderCouponCard(coupon) {
        return `
      <div class="coupon-card animate-fadeInUp">
        <div class="coupon-header">
          <span class="coupon-category">${Utils.escapeHtml(coupon.category)}</span>
          ${coupon.status ? Utils.statusBadge(coupon.status) : ''}
        </div>
        <div class="coupon-body">
          <h4 class="coupon-title">${Utils.escapeHtml(coupon.description)}</h4>
          <p class="coupon-desc">By ${Utils.escapeHtml(coupon.uploaderName || 'Anonymous')} · ${Utils.timeAgo(coupon.createdAt)}</p>
        </div>
        <div class="coupon-footer">
          <div class="coupon-price">
            <span class="coin-sm">₵</span>
            ${Utils.formatCoins(coupon.price)}
          </div>
          <button class="btn btn-primary btn-sm" onclick="Coupons.buyConfirm('${coupon.id}', '${Utils.escapeHtml(coupon.description)}', ${coupon.price})">
            Buy Now
          </button>
        </div>
      </div>
    `;
    },

    // ---- BUY COUPON ----
    buyConfirm(couponId, description, price) {
        if (!Session.isLoggedIn()) {
            Utils.toast('Please login to purchase coupons', 'warning');
            window.location.href = 'login.html';
            return;
        }
        const session = Session.get();
        if (session.coins < price) {
            Utils.toast('Insufficient coins! You need ' + price + ' coins.', 'error');
            return;
        }
        Utils.confirm(
            'Confirm Purchase',
            `Are you sure you want to buy "<strong>${description}</strong>" for <strong>${Utils.formatCoins(price)}</strong> coins?`,
            () => this.executePurchase(couponId),
            'Buy Now',
            'btn-coin'
        );
    },

    async executePurchase(couponId) {
        const result = await API.buyCoupon(couponId);
        if (result.success) {
            Session.update({ coins: result.newBalance });
            const coinEl = document.querySelector('.coin-amount');
            if (coinEl) coinEl.textContent = Utils.formatCoins(result.newBalance);
            Utils.toast('Coupon purchased successfully! Check your vault.', 'success');
            this.loadMarketplace();
        } else {
            Utils.toast(result.error || 'Purchase failed', 'error');
        }
    },

    // ---- UPLOAD COUPON ----
    async handleUpload(e) {
        e.preventDefault();
        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');
        const category = form.querySelector('#coupon-category').value;
        const code = form.querySelector('#coupon-code').value.trim();
        const description = form.querySelector('#coupon-description').value.trim();
        const price = parseInt(form.querySelector('#coupon-price').value, 10);

        if (!category) { Utils.toast('Please select a category', 'error'); return; }
        if (!code) { Utils.toast('Please enter the coupon code', 'error'); return; }
        if (!description) { Utils.toast('Please enter a description', 'error'); return; }
        if (!price || price < CONFIG.MIN_COUPON_PRICE || price > CONFIG.MAX_COUPON_PRICE) {
            Utils.toast(`Price must be between ${CONFIG.MIN_COUPON_PRICE} and ${CONFIG.MAX_COUPON_PRICE} coins`, 'error');
            return;
        }

        Utils.setLoading(btn, true);
        const result = await API.uploadCoupon(category, code, description, price);
        Utils.setLoading(btn, false);

        if (result.success) {
            Utils.toast('Coupon submitted for review! Admin will verify it soon.', 'success');
            form.reset();
        } else {
            Utils.toast(result.error || 'Upload failed', 'error');
        }
    },

    // ---- MY COUPONS ----
    async loadMyCoupons(status = 'all') {
        const grid = document.getElementById('my-coupons-grid');
        if (!grid) return;
        grid.innerHTML = '<div class="skeleton skeleton-card"></div>'.repeat(4);

        // Update active tab
        document.querySelectorAll('.tab-item').forEach(t => {
            t.classList.toggle('active', t.dataset.status === status);
        });

        const result = await API.getMyCoupons(status);

        if (result.success && result.coupons.length > 0) {
            grid.innerHTML = result.coupons.map(c => `
        <div class="coupon-card">
          <div class="coupon-header">
            <span class="coupon-category">${Utils.escapeHtml(c.category)}</span>
            ${Utils.statusBadge(c.status)}
          </div>
          <div class="coupon-body">
            <h4 class="coupon-title">${Utils.escapeHtml(c.description)}</h4>
            <p class="coupon-desc" style="font-family: var(--font-mono); color: var(--text-accent);">
              ${c.status === 'sold' ? '••••••••' : Utils.escapeHtml(c.code)}
            </p>
          </div>
          <div class="coupon-footer">
            <div class="coupon-price">
              <span class="coin-sm">₵</span>
              ${Utils.formatCoins(c.price)}
            </div>
            <span style="font-size: var(--fs-xs); color: var(--text-tertiary);">${Utils.formatDate(c.createdAt)}</span>
          </div>
        </div>
      `).join('');
        } else {
            grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <div class="empty-icon">📭</div>
          <h3 class="empty-title">No Coupons Yet</h3>
          <p class="empty-text">${status === 'all' ? 'You haven\'t uploaded any coupons yet.' : 'No coupons with this status.'}</p>
          <a href="upload-coupon.html" class="btn btn-primary">Upload Your First Coupon</a>
        </div>
      `;
        }
    },

    // ---- MY VAULT ----
    async loadVault() {
        const grid = document.getElementById('vault-grid');
        if (!grid) return;
        grid.innerHTML = '<div class="skeleton skeleton-card"></div>'.repeat(4);

        const result = await API.getMyVault();

        if (result.success && result.coupons.length > 0) {
            grid.innerHTML = result.coupons.map(c => `
        <div class="coupon-card" style="border-color: var(--border-accent);">
          <div class="coupon-header">
            <span class="coupon-category">${Utils.escapeHtml(c.category)}</span>
            <span class="badge badge-sold">Purchased</span>
          </div>
          <div class="coupon-body">
            <h4 class="coupon-title">${Utils.escapeHtml(c.description)}</h4>
            <div style="margin-top: var(--space-3); padding: var(--space-3); background: var(--bg-glass); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between;">
              <code id="code-${c.id}" style="font-family: var(--font-mono); color: var(--text-accent); font-size: var(--fs-base); letter-spacing: 0.1em;">
                ${Utils.escapeHtml(c.code)}
              </code>
              <button class="btn btn-ghost btn-sm" onclick="Utils.copyToClipboard('${Utils.escapeHtml(c.code)}')">📋 Copy</button>
            </div>
          </div>
          <div class="coupon-footer">
            <div class="coupon-price">
              <span class="coin-sm">₵</span>
              ${Utils.formatCoins(c.price)}
            </div>
            <span style="font-size: var(--fs-xs); color: var(--text-tertiary);">Bought ${Utils.timeAgo(c.soldAt)}</span>
          </div>
        </div>
      `).join('');
        } else {
            grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <div class="empty-icon">🔐</div>
          <h3 class="empty-title">Your Vault is Empty</h3>
          <p class="empty-text">Coupons you purchase will appear here.</p>
          <a href="index.html" class="btn btn-primary">Browse Marketplace</a>
        </div>
      `;
        }
    },

    // ---- LOAD CATEGORIES INTO SELECT ----
    async loadCategoryOptions(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;

        const result = await API.getCategories();
        if (result.success) {
            select.innerHTML = '<option value="">Select Category</option>' +
                result.categories.map(c => `<option value="${Utils.escapeHtml(c.name)}">${Utils.escapeHtml(c.name)}</option>`).join('');
        }
    }
};
