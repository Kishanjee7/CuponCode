// ============================================
// CuponCode Authentication Logic
// ============================================

const Auth = {
    // ---- LOGIN ----
    async handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');
        const emailOrUsername = form.querySelector('#login-email').value.trim();
        const password = form.querySelector('#login-password').value;

        if (!emailOrUsername || !password) {
            Utils.toast('Please fill in all fields', 'error');
            return;
        }

        Utils.setLoading(btn, true);
        const result = await API.login(emailOrUsername, password);
        Utils.setLoading(btn, false);

        if (result.success) {
            Session.set(result.user);
            Utils.toast('Login successful!', 'success');
            setTimeout(() => {
                const redirect = new URLSearchParams(window.location.search).get('redirect');
                window.location.href = result.user.role === CONFIG.ROLES.ADMIN
                    ? 'admin.html'
                    : (redirect || 'dashboard.html');
            }, 500);
        } else {
            Utils.toast(result.error || 'Invalid credentials', 'error');
        }
    },

    // ---- REGISTER ----
    async handleRegister(e) {
        e.preventDefault();
        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');
        const email = form.querySelector('#reg-email').value.trim();
        const username = form.querySelector('#reg-username').value.trim();
        const password = form.querySelector('#reg-password').value;
        const confirmPassword = form.querySelector('#reg-confirm-password').value;
        const referralCode = form.querySelector('#reg-referral')?.value.trim() || '';

        // Validations
        if (!email || !username || !password || !confirmPassword) {
            Utils.toast('Please fill in all fields', 'error');
            return;
        }
        if (!Utils.isValidEmail(email)) {
            Utils.toast('Please enter a valid email', 'error');
            return;
        }
        if (username.length < 3) {
            Utils.toast('Username must be at least 3 characters', 'error');
            return;
        }
        if (password.length < CONFIG.MIN_PASSWORD_LENGTH) {
            Utils.toast(`Password must be at least ${CONFIG.MIN_PASSWORD_LENGTH} characters`, 'error');
            return;
        }
        if (password !== confirmPassword) {
            Utils.toast('Passwords do not match', 'error');
            return;
        }

        Utils.setLoading(btn, true);
        const result = await API.register(email, username, password, referralCode);
        Utils.setLoading(btn, false);

        if (result.success) {
            Utils.toast('Registration successful! Please verify your email.', 'success');
            this.showOTPModal(email, 'registration');
        } else {
            Utils.toast(result.error || 'Registration failed', 'error');
        }
    },

    // ---- OTP MODAL ----
    showOTPModal(email, type = 'registration') {
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop active';
        backdrop.id = 'otp-modal';
        backdrop.innerHTML = `
      <div class="modal" style="max-width: 420px;">
        <button class="modal-close" onclick="document.getElementById('otp-modal').remove()">✕</button>
        <div class="text-center">
          <div style="font-size: 3rem; margin-bottom: var(--space-4);">📧</div>
          <h3 class="modal-title">Verify Your Email</h3>
          <p style="color: var(--text-secondary); margin-bottom: var(--space-2);">
            We've sent a ${CONFIG.OTP_LENGTH}-digit code to
          </p>
          <p style="color: var(--text-accent); font-weight: 600; margin-bottom: var(--space-6);">
            ${Utils.escapeHtml(email)}
          </p>
        </div>
        <div class="otp-inputs" id="otp-inputs">
          ${Array(CONFIG.OTP_LENGTH).fill(0).map((_, i) =>
            `<input type="text" maxlength="1" data-index="${i}" autocomplete="off">`
        ).join('')}
        </div>
        <button class="btn btn-primary btn-block btn-lg" id="verify-otp-btn" onclick="Auth.verifyOTP('${email}', '${type}')">
          Verify
        </button>
        <div class="text-center mt-4">
          <p style="color: var(--text-tertiary); font-size: var(--fs-sm);">
            Didn't receive the code?
            <button class="btn btn-ghost btn-sm" id="resend-otp-btn" onclick="Auth.resendOTP('${email}', '${type}')">
              Resend OTP
            </button>
          </p>
          <p id="otp-timer" style="color: var(--text-tertiary); font-size: var(--fs-xs); margin-top: var(--space-2);"></p>
        </div>
      </div>
    `;

        document.body.appendChild(backdrop);
        this.initOTPInputs();
        this.startResendTimer();
    },

    initOTPInputs() {
        const inputs = document.querySelectorAll('#otp-inputs input');
        inputs.forEach((input, i) => {
            input.addEventListener('input', (e) => {
                const val = e.target.value;
                if (val && i < inputs.length - 1) inputs[i + 1].focus();
                if (val && i === inputs.length - 1) {
                    // Auto-verify when all digits entered
                    document.getElementById('verify-otp-btn').click();
                }
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !input.value && i > 0) {
                    inputs[i - 1].focus();
                }
            });
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text').trim();
                if (/^\d+$/.test(pastedData)) {
                    pastedData.split('').forEach((char, idx) => {
                        if (inputs[idx]) inputs[idx].value = char;
                    });
                    inputs[Math.min(pastedData.length, inputs.length) - 1].focus();
                }
            });
        });
        inputs[0].focus();
    },

    startResendTimer() {
        const btn = document.getElementById('resend-otp-btn');
        const timer = document.getElementById('otp-timer');
        if (!btn) return;

        let seconds = CONFIG.OTP_RESEND_COOLDOWN;
        btn.disabled = true;

        const interval = setInterval(() => {
            seconds--;
            if (timer) timer.textContent = `Resend available in ${seconds}s`;
            if (seconds <= 0) {
                clearInterval(interval);
                btn.disabled = false;
                if (timer) timer.textContent = '';
            }
        }, 1000);
    },

    async verifyOTP(email, type) {
        const inputs = document.querySelectorAll('#otp-inputs input');
        const otp = Array.from(inputs).map(i => i.value).join('');

        if (otp.length !== CONFIG.OTP_LENGTH) {
            Utils.toast('Please enter the complete OTP', 'error');
            return;
        }

        const btn = document.getElementById('verify-otp-btn');
        Utils.setLoading(btn, true);
        const result = await API.verifyOTP(email, otp, type);
        Utils.setLoading(btn, false);

        if (result.success) {
            document.getElementById('otp-modal')?.remove();
            if (type === 'registration') {
                Utils.toast('Email verified! Please login.', 'success');
                setTimeout(() => window.location.href = 'login.html', 1000);
            } else if (type === 'forgot_password') {
                this.showResetPasswordForm(email, otp);
            }
        } else {
            Utils.toast(result.error || 'Invalid OTP', 'error');
            inputs.forEach(i => { i.value = ''; });
            inputs[0].focus();
        }
    },

    async resendOTP(email, type) {
        const btn = document.getElementById('resend-otp-btn');
        Utils.setLoading(btn, true);
        const result = await API.resendOTP(email, type);
        Utils.setLoading(btn, false);

        if (result.success) {
            Utils.toast('OTP resent successfully!', 'success');
            this.startResendTimer();
        } else {
            Utils.toast(result.error || 'Failed to resend OTP', 'error');
        }
    },

    // ---- FORGOT PASSWORD ----
    async handleForgotPassword(e) {
        e.preventDefault();
        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');
        const email = form.querySelector('#forgot-email').value.trim();

        if (!email || !Utils.isValidEmail(email)) {
            Utils.toast('Please enter a valid email', 'error');
            return;
        }

        Utils.setLoading(btn, true);
        const result = await API.forgotPassword(email);
        Utils.setLoading(btn, false);

        if (result.success) {
            Utils.toast('OTP sent to your email!', 'success');
            this.showOTPModal(email, 'forgot_password');
        } else {
            Utils.toast(result.error || 'Email not found', 'error');
        }
    },

    showResetPasswordForm(email, otp) {
        document.getElementById('otp-modal')?.remove();

        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop active';
        backdrop.id = 'reset-modal';
        backdrop.innerHTML = `
      <div class="modal" style="max-width: 420px;">
        <button class="modal-close" onclick="document.getElementById('reset-modal').remove()">✕</button>
        <div class="text-center" style="margin-bottom: var(--space-6);">
          <div style="font-size: 3rem; margin-bottom: var(--space-4);">🔐</div>
          <h3 class="modal-title">Set New Password</h3>
        </div>
        <form onsubmit="Auth.handleResetPassword(event, '${email}', '${otp}')">
          <div class="input-group">
            <label>New Password</label>
            <input type="password" id="new-password" placeholder="Enter new password" required minlength="${CONFIG.MIN_PASSWORD_LENGTH}">
          </div>
          <div class="input-group">
            <label>Confirm Password</label>
            <input type="password" id="confirm-new-password" placeholder="Confirm new password" required>
          </div>
          <button type="submit" class="btn btn-primary btn-block btn-lg">Reset Password</button>
        </form>
      </div>
    `;

        document.body.appendChild(backdrop);
    },

    async handleResetPassword(e, email, otp) {
        e.preventDefault();
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-new-password').value;

        if (newPassword.length < CONFIG.MIN_PASSWORD_LENGTH) {
            Utils.toast(`Password must be at least ${CONFIG.MIN_PASSWORD_LENGTH} characters`, 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            Utils.toast('Passwords do not match', 'error');
            return;
        }

        const btn = e.target.querySelector('button[type="submit"]');
        Utils.setLoading(btn, true);
        const result = await API.resetPassword(email, otp, newPassword);
        Utils.setLoading(btn, false);

        if (result.success) {
            document.getElementById('reset-modal')?.remove();
            Utils.toast('Password reset successful! Please login.', 'success');
            setTimeout(() => window.location.href = 'login.html', 1000);
        } else {
            Utils.toast(result.error || 'Reset failed', 'error');
        }
    },

    // ---- CHANGE PASSWORD ----
    async handleChangePassword(e) {
        e.preventDefault();
        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');
        const currentPassword = form.querySelector('#current-password').value;
        const newPassword = form.querySelector('#new-password').value;
        const confirmPassword = form.querySelector('#confirm-password').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            Utils.toast('Please fill in all fields', 'error');
            return;
        }
        if (newPassword.length < CONFIG.MIN_PASSWORD_LENGTH) {
            Utils.toast(`Password must be at least ${CONFIG.MIN_PASSWORD_LENGTH} characters`, 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            Utils.toast('New passwords do not match', 'error');
            return;
        }

        Utils.setLoading(btn, true);
        const result = await API.changePassword(currentPassword, newPassword);
        Utils.setLoading(btn, false);

        if (result.success) {
            Utils.toast('Password changed successfully!', 'success');
            form.reset();
        } else {
            Utils.toast(result.error || 'Failed to change password', 'error');
        }
    },

    // ---- PASSWORD STRENGTH UI ----
    initPasswordStrength(inputId, strengthId) {
        const input = document.getElementById(inputId);
        const strength = document.getElementById(strengthId);
        if (!input || !strength) return;

        input.addEventListener('input', () => {
            const level = Utils.getPasswordStrength(input.value);
            strength.className = `password-strength ${input.value ? level : ''}`;
        });
    }
};
