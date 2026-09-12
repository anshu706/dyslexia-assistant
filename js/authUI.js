// ══════════════════════════════════════════
//  AUTH UI CONTROLLER  ·  Dyslexia Assistant
//  Manages overlay, profile page, header state
// ══════════════════════════════════════════

class AuthUI {
  constructor(authManager) {
    this.auth = authManager;
    this._guestMode = false;
    this._bindKeyboardEnter();
    this._bindPasswordStrength();
    this._bindDropdown();
    this._bindProfileActions();
  }

  // ── Bootstrap ────────────────────────────

  /** Call on app ready to decide what to show */
  init() {
    if (this.auth.isLoggedIn()) {
      this._hideOverlay();
      this._updateHeader(this.auth.getUser());
      this._showProfileTab(true);
    } else {
      // Show overlay (auth required)
      this._showOverlay();
    }
  }

  // ── Overlay Control ───────────────────────

  _showOverlay() {
    document.getElementById('authOverlay').classList.remove('hidden');
  }
  _hideOverlay() {
    document.getElementById('authOverlay').classList.add('hidden');
  }

  // ── Auth Tab Switching ────────────────────

  showPanel(panel) {
    const isLogin = panel === 'login';
    document.getElementById('authTabLogin').classList.toggle('active', isLogin);
    document.getElementById('authTabSignup').classList.toggle('active', !isLogin);
    document.getElementById('authPanelLogin').classList.toggle('active', isLogin);
    document.getElementById('authPanelSignup').classList.toggle('active', !isLogin);
    this._clearErrors();
  }

  // ── Handlers ──────────────────────────────

  handleLogin() {
    const email    = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    this._setLoading('loginBtn', true, 'Signing in…');
    // Simulate slight delay for UX polish
    setTimeout(() => {
      const result = this.auth.login({ email, password });
      this._setLoading('loginBtn', false, 'Sign In');
      if (result.ok) {
        this._onAuthSuccess(result.user);
      } else {
        this._showError('loginError', result.error);
      }
    }, 500);
  }

  handleSignup() {
    const name     = document.getElementById('signupName').value;
    const email    = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirm  = document.getElementById('signupConfirm').value;

    if (password !== confirm) {
      this._showError('signupError', 'Passwords do not match.');
      return;
    }

    this._setLoading('signupBtn', true, 'Creating account…');
    setTimeout(() => {
      const result = this.auth.register({ name, email, password });
      this._setLoading('signupBtn', false, 'Create Account');
      if (result.ok) {
        this._onAuthSuccess(result.user);
      } else {
        this._showError('signupError', result.error);
      }
    }, 600);
  }

  continueAsGuest() {
    this._guestMode = true;
    this._hideOverlay();
    this._updateHeader(null);
    this._showProfileTab(false);
  }

  _onAuthSuccess(user) {
    this._hideOverlay();
    this._updateHeader(user);
    this._showProfileTab(true);
    if (window.app) window.app.showToast('Welcome, ' + user.name.split(' ')[0] + '! 👋', 'success');
  }

  // ── Header State ──────────────────────────

  _updateHeader(user) {
    const signInBtn  = document.getElementById('headerSignInBtn');
    const userBtn    = document.getElementById('headerUserBtn');
    const avatarEl   = document.getElementById('headerUserAvatar');
    const nameEl     = document.getElementById('headerUserName');

    if (user) {
      signInBtn.style.display = 'none';
      userBtn.style.display   = 'flex';
      avatarEl.textContent    = user.initials || '?';
      avatarEl.style.background = user.avatarColor || 'var(--accent)';
      nameEl.textContent      = user.name.split(' ')[0];
    } else {
      // Guest mode — show sign-in button
      signInBtn.style.display = 'flex';
      userBtn.style.display   = 'none';
    }
  }

  _showProfileTab(show) {
    const tab = document.getElementById('profileNavTab');
    if (tab) tab.style.display = show ? '' : 'none';
  }

  // ── Dropdown ──────────────────────────────

  _bindDropdown() {
    const btn      = document.getElementById('headerUserBtn');
    const dropdown = document.getElementById('userDropdown');
    const signInBtn = document.getElementById('headerSignInBtn');

    btn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen);
    });

    signInBtn?.addEventListener('click', () => {
      this._showOverlay();
      this.showPanel('login');
    });

    document.getElementById('dropdownProfile')?.addEventListener('click', () => {
      dropdown.classList.remove('open');
      if (window.app) window.app.switchPage('profile');
    });

    document.getElementById('dropdownLogout')?.addEventListener('click', () => {
      dropdown.classList.remove('open');
      this._logout();
    });

    // Close on outside click
    document.addEventListener('click', () => dropdown?.classList.remove('open'));
  }

  _logout() {
    this.auth.logout();
    this._updateHeader(null);
    this._showProfileTab(false);
    // Go back to home
    if (window.app) { window.app.switchPage('home'); window.app.showToast('Signed out successfully', 'info'); }
    // Show overlay again
    setTimeout(() => this._showOverlay(), 400);
  }

  // ── Profile Page ──────────────────────────

  populateProfile() {
    const user = this.auth.getUser();
    if (!user) return;

    // Avatar
    const av = document.getElementById('profileAvatar');
    if (av) { av.textContent = user.initials || '?'; av.style.background = user.avatarColor || 'var(--accent)'; }

    document.getElementById('profileHeroName').textContent  = user.name  || '—';
    document.getElementById('profileHeroEmail').textContent = user.email || '—';

    // Joined date
    if (user.joinedAt) {
      const d = new Date(user.joinedAt);
      document.getElementById('profileJoinedChip').textContent =
        '📅 Joined ' + d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    // Location chip
    const locChip = document.getElementById('profileLocationChip');
    const locText = document.getElementById('profileLocationText');
    if (user.location) {
      locChip.style.display = 'flex';
      locText.textContent   = user.location;
    } else {
      locChip.style.display = 'none';
    }

    // Form fields
    document.getElementById('profileNameInput').value     = user.name     || '';
    document.getElementById('profileEmailDisplay').value  = user.email    || '';
    document.getElementById('profileLocationInput').value = user.location || '';
    document.getElementById('profileWebsiteInput').value  = user.website  || '';
    document.getElementById('profileBioInput').value      = user.bio      || '';

    // Stats (from app if available)
    const stats = this._gatherStats(user);
    document.getElementById('profileStatDocs').textContent     = stats.totalDocs     || 0;
    document.getElementById('profileStatWords').textContent    = this._fmt(stats.totalWords    || 0);
    document.getElementById('profileStatSessions').textContent = stats.totalSessions || 0;
  }

  _gatherStats(user) {
    if (window.app) {
      const docs = window.app.storage ? window.app.storage.getAllDocuments().length : 0;
      const s    = window.app.stats   ? window.app.stats.getTotalStats() : null;
      return {
        totalDocs:     docs,
        totalWords:    s ? s.totalWordsRead : 0,
        totalSessions: s ? s.totalSessions  : 0,
      };
    }
    return user.stats || {};
  }

  _fmt(n) { return n > 999 ? (n / 1000).toFixed(1) + 'k' : n; }

  _bindProfileActions() {
    // Save personal info
    document.getElementById('profileInfoSave')?.addEventListener('click', () => {
      const result = this.auth.updateProfile({
        name:     document.getElementById('profileNameInput').value.trim(),
        location: document.getElementById('profileLocationInput').value.trim(),
        website:  document.getElementById('profileWebsiteInput').value.trim(),
        bio:      document.getElementById('profileBioInput').value.trim(),
      });
      if (result.ok) {
        this._updateHeader(result.user);
        this.populateProfile();
        const err = document.getElementById('profileInfoError');
        err.className = 'profile-form-error';
        if (window.app) window.app.showToast('Profile updated!', 'success');
      } else {
        this._showInlineError('profileInfoError', result.error);
      }
    });

    // Reset info form
    document.getElementById('profileInfoReset')?.addEventListener('click', () => {
      const user = this.auth.getUser();
      if (!user) return;
      document.getElementById('profileNameInput').value     = user.name     || '';
      document.getElementById('profileLocationInput').value = user.location || '';
      document.getElementById('profileWebsiteInput').value  = user.website  || '';
      document.getElementById('profileBioInput').value      = user.bio      || '';
    });

    // Change password
    document.getElementById('profilePwSave')?.addEventListener('click', () => {
      const curr    = document.getElementById('profileCurrentPw').value;
      const nw      = document.getElementById('profileNewPw').value;
      const confirm = document.getElementById('profileConfirmPw').value;
      if (nw !== confirm) { this._showInlineError('profilePwError', 'New passwords do not match.'); return; }
      const result = this.auth.changePassword({ currentPassword: curr, newPassword: nw });
      if (result.ok) {
        document.getElementById('profileCurrentPw').value = '';
        document.getElementById('profileNewPw').value     = '';
        document.getElementById('profileConfirmPw').value = '';
        document.getElementById('profilePwError').className = 'profile-form-error';
        if (window.app) window.app.showToast('Password changed!', 'success');
      } else {
        this._showInlineError('profilePwError', result.error);
      }
    });

    // Profile logout btn
    document.getElementById('profileLogoutBtn')?.addEventListener('click', () => this._logout());
  }

  // ── Helpers ───────────────────────────────

  _bindKeyboardEnter() {
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      if (document.getElementById('authPanelLogin')?.classList.contains('active') &&
          !document.getElementById('authOverlay')?.classList.contains('hidden')) {
        this.handleLogin();
      } else if (document.getElementById('authPanelSignup')?.classList.contains('active') &&
                 !document.getElementById('authOverlay')?.classList.contains('hidden')) {
        this.handleSignup();
      }
    });
  }

  _bindPasswordStrength() {
    document.getElementById('signupPassword')?.addEventListener('input', (e) => {
      const pw = e.target.value;
      const score = this._strengthScore(pw);
      const bars  = ['pwBar1','pwBar2','pwBar3','pwBar4'];
      const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
      const classes = ['', 'filled-weak', 'filled-fair', 'filled-good', 'filled-strong'];
      bars.forEach((id, i) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.className = 'pw-strength-bar' + (i < score ? ' ' + classes[score] : '');
      });
      const lbl = document.getElementById('pwStrengthLabel');
      if (lbl) { lbl.textContent = pw ? labels[score] : ''; lbl.style.color = ['','#ef4444','#f59e0b','#3b82f6','#10b981'][score]; }
    });
  }

  _strengthScore(pw) {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 6)  score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++;
    return Math.min(score, 4);
  }

  togglePw(inputId, btn) {
    const inp = document.getElementById(inputId);
    if (!inp) return;
    const isText = inp.type === 'text';
    inp.type = isText ? 'password' : 'text';
    btn.textContent = isText ? '👁' : '🙈';
  }

  _showError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.className = 'auth-error visible';
    // Re-trigger shake animation
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = '';
  }

  _showInlineError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.className = 'profile-form-error visible';
  }

  _clearErrors() {
    ['loginError','signupError'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.className = 'auth-error';
    });
  }

  _setLoading(btnId, loading, text) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    btn.innerHTML = loading
      ? `<span class="spinner"></span>${text}`
      : text;
  }
}
