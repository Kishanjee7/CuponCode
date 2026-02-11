// ============================================
// CuponCode Session Management
// ============================================

const Session = {
    /**
     * Store session data
     */
    set(userData) {
        const session = {
            ...userData,
            token: userData.token || this.generateToken(),
            lastActivity: Date.now()
        };
        localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(session));
        this.startActivityMonitor();
    },

    /**
     * Get current session
     */
    get() {
        try {
            const data = localStorage.getItem(CONFIG.SESSION_KEY);
            if (!data) return null;

            const session = JSON.parse(data);

            // Check timeout
            if (Date.now() - session.lastActivity > CONFIG.SESSION_TIMEOUT) {
                this.clear();
                return null;
            }

            return session;
        } catch {
            this.clear();
            return null;
        }
    },

    /**
     * Update session data (e.g., coin balance)
     */
    update(updates) {
        const session = this.get();
        if (session) {
            this.set({ ...session, ...updates });
        }
    },

    /**
     * Update last activity timestamp
     */
    touch() {
        const session = this.get();
        if (session) {
            session.lastActivity = Date.now();
            localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(session));
        }
    },

    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        return this.get() !== null;
    },

    /**
     * Check if user is admin
     */
    isAdmin() {
        const session = this.get();
        return session && session.role === CONFIG.ROLES.ADMIN;
    },

    /**
     * Clear session (logout)
     */
    clear() {
        localStorage.removeItem(CONFIG.SESSION_KEY);
        if (this._activityInterval) {
            clearInterval(this._activityInterval);
        }
    },

    /**
     * Logout and redirect
     */
    logout() {
        this.clear();
        window.location.href = 'login.html';
    },

    /**
     * Require authentication - redirect to login if not authenticated
     */
    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
            return false;
        }
        this.touch();
        return true;
    },

    /**
     * Require admin role
     */
    requireAdmin() {
        if (!this.requireAuth()) return false;
        if (!this.isAdmin()) {
            window.location.href = 'dashboard.html';
            return false;
        }
        return true;
    },

    /**
     * Generate a simple session token
     */
    generateToken() {
        return 'tk_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 12);
    },

    /**
     * Monitor user activity for session timeout
     */
    startActivityMonitor() {
        // Clear existing
        if (this._activityInterval) clearInterval(this._activityInterval);

        // Update on user interaction
        const events = ['click', 'keypress', 'scroll', 'mousemove'];
        let debounceTimer;

        const updateActivity = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => this.touch(), 1000);
        };

        events.forEach(evt => document.addEventListener(evt, updateActivity, { passive: true }));

        // Check timeout periodically
        this._activityInterval = setInterval(() => {
            if (!this.isLoggedIn()) {
                this.clear();
                window.location.href = 'login.html?expired=1';
            }
        }, 60000); // Check every minute
    }
};
