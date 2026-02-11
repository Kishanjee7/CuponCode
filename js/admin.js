// ============================================
// CuponCode - Admin Panel Logic
// ============================================

const Admin = {
    // ---- DASHBOARD STATS ----
    async loadStats() {
        const result = await API.adminGetStats();
        if (result.success) {
            const s = result.stats;
            document.getElementById('stat-users').textContent = s.totalUsers || 0;
            document.getElementById('stat-coupons').textContent = s.totalCoupons || 0;
            document.getElementById('stat-pending').textContent = s.pendingCoupons || 0;
            document.getElementById('stat-transactions').textContent = s.totalTransactions || 0;
            document.getElementById('stat-coins-circulating').textContent = Utils.formatCoins(s.coinsCirculating || 0);
        }
    },

    // ---- COUPON MANAGEMENT ----
    async loadAllCoupons(page = 1, status = 'all') {
        document.querySelectorAll('.tab-item').forEach(t => {
            t.classList.toggle('active', t.dataset.status === status);
        });

        const container = document.getElementById('admin-coupons-list');
        if (!container) return;
        container.innerHTML = '<div class="skeleton skeleton-text" style="height: 50px;"></div>'.repeat(5);

        const result = await API.adminGetAllCoupons(page, status);

        if (result.success && result.coupons.length > 0) {
            container.innerHTML = `
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Category</th>
                <th>Description</th>
                <th>Code</th>
                <th>Price</th>
                <th>Uploader</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${result.coupons.map(c => `
                <tr>
                  <td style="font-family: var(--font-mono); font-size: var(--fs-xs);">${c.id.slice(-6)}</td>
                  <td>${Utils.escapeHtml(c.category)}</td>
                  <td style="max-width: 200px; white-space: normal;">${Utils.escapeHtml(c.description)}</td>
                  <td style="font-family: var(--font-mono);">${Utils.escapeHtml(c.code)}</td>
                  <td>${Utils.coinHtml(c.price)}</td>
                  <td>${Utils.escapeHtml(c.uploaderName || 'N/A')}</td>
                  <td>${Utils.statusBadge(c.status)}</td>
                  <td>${Utils.formatDate(c.createdAt)}</td>
                  <td>
                    <div class="flex gap-2">
                      ${c.status === 'pending' ? `
                        <button class="btn btn-success btn-sm" onclick="Admin.verifyCoupon('${c.id}', 'approved')">✓</button>
                        <button class="btn btn-danger btn-sm" onclick="Admin.verifyCoupon('${c.id}', 'rejected')">✕</button>
                      ` : '—'}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
        } else {
            container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h3 class="empty-title">No Coupons Found</h3>
          <p class="empty-text">No coupons match the current filter.</p>
        </div>
      `;
        }
    },

    async verifyCoupon(couponId, status) {
        const action = status === 'approved' ? 'approve' : 'reject';
        Utils.confirm(
            `${action.charAt(0).toUpperCase() + action.slice(1)} Coupon?`,
            `Are you sure you want to ${action} this coupon?`,
            async () => {
                const result = await API.adminVerifyCoupon(couponId, status);
                if (result.success) {
                    Utils.toast(`Coupon ${status} successfully!`, 'success');
                    this.loadAllCoupons();
                } else {
                    Utils.toast(result.error || `Failed to ${action}`, 'error');
                }
            },
            action.charAt(0).toUpperCase() + action.slice(1),
            status === 'approved' ? 'btn-success' : 'btn-danger'
        );
    },

    // ---- CATEGORY MANAGEMENT ----
    async loadCategories() {
        const container = document.getElementById('categories-list');
        if (!container) return;

        const result = await API.getCategories();
        if (result.success && result.categories.length > 0) {
            container.innerHTML = result.categories.map(c => `
        <div class="flex items-center justify-between" style="padding: var(--space-4); border-bottom: 1px solid var(--border-subtle);">
          <div class="flex items-center gap-3">
            <span style="font-size: 1.5rem;">${c.icon || '📁'}</span>
            <div>
              <div style="font-weight: var(--fw-semibold);">${Utils.escapeHtml(c.name)}</div>
              <div style="font-size: var(--fs-xs); color: var(--text-tertiary);">ID: ${c.id}</div>
            </div>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-ghost btn-sm" onclick="Admin.editCategory('${c.id}', '${Utils.escapeHtml(c.name)}', '${c.icon || '📁'}')">✏️</button>
            <button class="btn btn-ghost btn-sm" style="color: var(--danger);" onclick="Admin.deleteCategory('${c.id}', '${Utils.escapeHtml(c.name)}')">🗑️</button>
          </div>
        </div>
      `).join('');
        } else {
            container.innerHTML = '<div class="empty-state"><p class="empty-text">No categories created yet.</p></div>';
        }
    },

    showAddCategory() {
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop active';
        backdrop.id = 'category-modal';
        backdrop.innerHTML = `
      <div class="modal">
        <button class="modal-close" onclick="document.getElementById('category-modal').remove()">✕</button>
        <h3 class="modal-title">Add Category</h3>
        <form onsubmit="Admin.saveCategory(event)">
          <div class="input-group">
            <label>Category Name</label>
            <input type="text" id="cat-name" placeholder="e.g., Food & Dining" required>
          </div>
          <div class="input-group">
            <label>Icon (emoji)</label>
            <input type="text" id="cat-icon" placeholder="e.g., 🍔" value="📁">
          </div>
          <button type="submit" class="btn btn-primary btn-block">Add Category</button>
        </form>
      </div>
    `;
        document.body.appendChild(backdrop);
        backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.remove(); });
    },

    editCategory(id, name, icon) {
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop active';
        backdrop.id = 'category-modal';
        backdrop.innerHTML = `
      <div class="modal">
        <button class="modal-close" onclick="document.getElementById('category-modal').remove()">✕</button>
        <h3 class="modal-title">Edit Category</h3>
        <form onsubmit="Admin.updateCategory(event, '${id}')">
          <div class="input-group">
            <label>Category Name</label>
            <input type="text" id="cat-name" value="${name}" required>
          </div>
          <div class="input-group">
            <label>Icon (emoji)</label>
            <input type="text" id="cat-icon" value="${icon}">
          </div>
          <button type="submit" class="btn btn-primary btn-block">Update</button>
        </form>
      </div>
    `;
        document.body.appendChild(backdrop);
        backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.remove(); });
    },

    async saveCategory(e) {
        e.preventDefault();
        const name = document.getElementById('cat-name').value.trim();
        const icon = document.getElementById('cat-icon').value.trim();
        const result = await API.adminManageCategory('create', { name, icon });
        if (result.success) {
            document.getElementById('category-modal')?.remove();
            Utils.toast('Category added!', 'success');
            this.loadCategories();
        } else {
            Utils.toast(result.error || 'Failed', 'error');
        }
    },

    async updateCategory(e, id) {
        e.preventDefault();
        const name = document.getElementById('cat-name').value.trim();
        const icon = document.getElementById('cat-icon').value.trim();
        const result = await API.adminManageCategory('update', { id, name, icon });
        if (result.success) {
            document.getElementById('category-modal')?.remove();
            Utils.toast('Category updated!', 'success');
            this.loadCategories();
        } else {
            Utils.toast(result.error || 'Failed', 'error');
        }
    },

    async deleteCategory(id, name) {
        Utils.confirm('Delete Category?', `Delete "${name}"? This cannot be undone.`, async () => {
            const result = await API.adminManageCategory('delete', { id });
            if (result.success) {
                Utils.toast('Category deleted!', 'success');
                this.loadCategories();
            } else {
                Utils.toast(result.error || 'Failed', 'error');
            }
        }, 'Delete', 'btn-danger');
    },

    // ---- USER MANAGEMENT ----
    async loadUsers(page = 1, search = '') {
        const container = document.getElementById('users-list');
        if (!container) return;
        container.innerHTML = '<div class="skeleton skeleton-text" style="height: 50px;"></div>'.repeat(5);

        const result = await API.adminGetUsers(page, search);
        if (result.success && result.users.length > 0) {
            container.innerHTML = `
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Coins</th>
                <th>Status</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${result.users.map(u => `
                <tr>
                  <td>
                    <div class="flex items-center gap-2">
                      <div class="avatar avatar-sm">${Utils.getInitial(u.username)}</div>
                      ${Utils.escapeHtml(u.username)}
                    </div>
                  </td>
                  <td>${Utils.escapeHtml(u.email)}</td>
                  <td>${Utils.coinHtml(u.coins)}</td>
                  <td>${Utils.statusBadge(u.status)}</td>
                  <td><span class="badge ${u.role === 'admin' ? 'badge-pending' : 'badge-approved'}">${u.role}</span></td>
                  <td>${Utils.formatDate(u.createdAt)}</td>
                  <td>
                    <div class="flex gap-1">
                      ${u.status === 'active'
                    ? `<button class="btn btn-ghost btn-sm" onclick="Admin.manageUser('${u.id}', 'suspend')" title="Suspend">⛔</button>`
                    : `<button class="btn btn-ghost btn-sm" onclick="Admin.manageUser('${u.id}', 'activate')" title="Activate">✅</button>`
                }
                      <button class="btn btn-ghost btn-sm" onclick="Admin.showAdjustCoins('${u.id}', '${Utils.escapeHtml(u.username)}', ${u.coins})" title="Adjust Coins">🪙</button>
                      <button class="btn btn-ghost btn-sm" style="color: var(--danger);" onclick="Admin.manageUser('${u.id}', 'delete')" title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
        } else {
            container.innerHTML = '<div class="empty-state"><p class="empty-text">No users found.</p></div>';
        }
    },

    async manageUser(userId, action) {
        const labels = { suspend: 'Suspend', activate: 'Activate', delete: 'Delete' };
        Utils.confirm(
            `${labels[action]} User?`,
            `Are you sure you want to ${action} this user?`,
            async () => {
                const result = await API.adminManageUser(userId, action);
                if (result.success) {
                    Utils.toast(`User ${action}d successfully!`, 'success');
                    this.loadUsers();
                } else {
                    Utils.toast(result.error || 'Failed', 'error');
                }
            },
            labels[action],
            action === 'delete' ? 'btn-danger' : 'btn-primary'
        );
    },

    showAdjustCoins(userId, username, currentCoins) {
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop active';
        backdrop.id = 'adjust-modal';
        backdrop.innerHTML = `
      <div class="modal">
        <button class="modal-close" onclick="document.getElementById('adjust-modal').remove()">✕</button>
        <h3 class="modal-title">Adjust Coins</h3>
        <p style="color: var(--text-secondary); margin-bottom: var(--space-4);">
          User: <strong>${username}</strong> | Current: ${Utils.coinHtml(currentCoins)}
        </p>
        <form onsubmit="Admin.executeAdjustCoins(event, '${userId}')">
          <div class="input-group">
            <label>Amount (positive to add, negative to deduct)</label>
            <input type="number" id="adjust-amount" placeholder="e.g., 50 or -20" required>
          </div>
          <div class="input-group">
            <label>Reason</label>
            <input type="text" id="adjust-reason" placeholder="Reason for adjustment" required>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Adjust Coins</button>
        </form>
      </div>
    `;
        document.body.appendChild(backdrop);
        backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.remove(); });
    },

    async executeAdjustCoins(e, userId) {
        e.preventDefault();
        const amount = parseInt(document.getElementById('adjust-amount').value, 10);
        const reason = document.getElementById('adjust-reason').value.trim();
        if (!amount || !reason) { Utils.toast('Please fill all fields', 'error'); return; }

        const result = await API.adminAdjustCoins(userId, amount, reason);
        if (result.success) {
            document.getElementById('adjust-modal')?.remove();
            Utils.toast('Coins adjusted successfully!', 'success');
            this.loadUsers();
        } else {
            Utils.toast(result.error || 'Failed', 'error');
        }
    },

    // ---- TRANSACTIONS ----
    async loadTransactions(page = 1, type = 'all') {
        document.querySelectorAll('.tab-item').forEach(t => {
            t.classList.toggle('active', t.dataset.type === type);
        });

        const container = document.getElementById('admin-transactions-list');
        if (!container) return;
        container.innerHTML = '<div class="skeleton skeleton-text" style="height: 50px;"></div>'.repeat(5);

        const result = await API.adminGetTransactions(page, type);
        if (result.success && result.transactions.length > 0) {
            container.innerHTML = `
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>User</th>
                <th>Type</th>
                <th>Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${result.transactions.map(t => `
                <tr>
                  <td>${Utils.formatDateTime(t.createdAt)}</td>
                  <td>${Utils.escapeHtml(t.username || 'N/A')}</td>
                  <td>${Wallet.getTypeBadge ? Wallet.getTypeBadge(t.type) : t.type}</td>
                  <td>${Utils.escapeHtml(t.description)}</td>
                  <td style="text-align: right; font-weight: 600; color: ${t.amount > 0 ? 'var(--success)' : 'var(--danger)'};">
                    ${t.amount > 0 ? '+' : ''}${Utils.formatCoins(t.amount)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
        } else {
            container.innerHTML = '<div class="empty-state"><p class="empty-text">No transactions found.</p></div>';
        }
    }
};
