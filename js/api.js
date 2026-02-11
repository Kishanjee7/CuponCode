// ============================================
// CuponCode API Client
// ============================================

const API = {
    /**
     * Make a request to the Google Apps Script backend.
     * GAS redirects 302 which converts POST→GET in browsers,
     * so we pass the payload as a URL parameter instead.
     */
    async post(action, data = {}) {
        try {
            const session = Session.get();
            const payload = {
                action,
                ...data,
                ...(session ? { userId: session.id, sessionToken: session.token } : {})
            };

            const encodedPayload = encodeURIComponent(JSON.stringify(payload));
            const url = `${CONFIG.API_URL}?payload=${encodedPayload}`;

            const response = await fetch(url, {
                method: 'GET',
                redirect: 'follow'
            });

            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse API response:', text.substring(0, 200));
                return { success: false, error: 'Invalid server response. Please try again.' };
            }

            if (result.error === 'SESSION_EXPIRED') {
                Session.clear();
                window.location.href = 'login.html?expired=1';
                return { success: false, error: 'Session expired' };
            }

            return result;
        } catch (error) {
            console.error(`API Error [${action}]:`, error);
            return { success: false, error: 'Network error. Please try again.' };
        }
    },

    // ---- Auth ----
    async register(email, username, password, referralCode = '') {
        return this.post('register', { email, username, password, referralCode });
    },

    async verifyOTP(email, otp, type = 'registration') {
        return this.post('verifyOTP', { email, otp, type });
    },

    async resendOTP(email, type = 'registration') {
        return this.post('resendOTP', { email, type });
    },

    async login(emailOrUsername, password) {
        return this.post('login', { emailOrUsername, password });
    },

    async forgotPassword(email) {
        return this.post('forgotPassword', { email });
    },

    async resetPassword(email, otp, newPassword) {
        return this.post('resetPassword', { email, otp, newPassword });
    },

    async changePassword(currentPassword, newPassword) {
        return this.post('changePassword', { currentPassword, newPassword });
    },

    // ---- Coupons ----
    async getCoupons(page = 1, category = '', sort = 'newest', search = '') {
        return this.post('getCoupons', { page, category, sort, search });
    },

    async uploadCoupon(category, code, description, price) {
        return this.post('uploadCoupon', { category, code, description, price });
    },

    async buyCoupon(couponId) {
        return this.post('buyCoupon', { couponId });
    },

    async getMyCoupons(status = 'all') {
        return this.post('getMyCoupons', { status });
    },

    async getMyVault() {
        return this.post('getMyVault');
    },

    // ---- Wallet ----
    async getWallet(page = 1, type = 'all') {
        return this.post('getWallet', { page, type });
    },

    // ---- Referral ----
    async getReferralInfo() {
        return this.post('getReferralInfo');
    },

    // ---- Categories ----
    async getCategories() {
        return this.post('getCategories');
    },

    // ---- Admin ----
    async adminGetStats() {
        return this.post('adminGetStats');
    },

    async adminGetPendingCoupons() {
        return this.post('adminGetPendingCoupons');
    },

    async adminVerifyCoupon(couponId, status) {
        return this.post('adminVerifyCoupon', { couponId, status });
    },

    async adminGetAllCoupons(page = 1, status = 'all') {
        return this.post('adminGetAllCoupons', { page, status });
    },

    async adminManageCategory(action, categoryData) {
        return this.post('adminManageCategory', { categoryAction: action, ...categoryData });
    },

    async adminGetUsers(page = 1, search = '') {
        return this.post('adminGetUsers', { page, search });
    },

    async adminManageUser(targetUserId, userAction) {
        return this.post('adminManageUser', { targetUserId, userAction });
    },

    async adminAdjustCoins(targetUserId, amount, reason) {
        return this.post('adminAdjustCoins', { targetUserId, amount, reason });
    },

    async adminGetTransactions(page = 1, type = 'all') {
        return this.post('adminGetTransactions', { page, type });
    }
};
