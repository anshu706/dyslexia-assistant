// ══════════════════════════════════════════
//  AUTH MANAGER  ·  Dyslexia Assistant
//  Local-storage-based auth simulation
// ══════════════════════════════════════════

class AuthManager {
  constructor() {
    this.usersKey    = 'dyslexia_users';
    this.sessionKey  = 'dyslexia_session';
    this.currentUser = null;
    this._loadSession();
  }

  // ── Internal Helpers ──────────────────────

  _loadSession() {
    try {
      const raw = localStorage.getItem(this.sessionKey);
      if (raw) this.currentUser = JSON.parse(raw);
    } catch { this.currentUser = null; }
  }

  _getUsers() {
    try {
      const raw = localStorage.getItem(this.usersKey);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  _saveUsers(users) {
    localStorage.setItem(this.usersKey, JSON.stringify(users));
  }

  _hashish(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) + h) ^ str.charCodeAt(i);
    }
    return (h >>> 0).toString(36);
  }

  _avatarInitials(name) {
    return name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  // ── Public API ───────────────────────────

  /** Register a new user. Returns { ok, error } */
  register({ name, email, password }) {
    const users = this._getUsers();
    if (!name || !email || !password)
      return { ok: false, error: 'All fields are required.' };
    if (password.length < 6)
      return { ok: false, error: 'Password must be at least 6 characters.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return { ok: false, error: 'Please enter a valid email address.' };
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
      return { ok: false, error: 'An account with this email already exists.' };

    const user = {
      id:          'u_' + Date.now(),
      name:        name.trim(),
      email:       email.toLowerCase().trim(),
      password:    this._hashish(password),
      initials:    this._avatarInitials(name),
      avatarColor: this._pickColor(email),
      bio:         '',
      location:    '',
      website:     '',
      joinedAt:    new Date().toISOString(),
      stats:       { totalDocs: 0, totalWords: 0, totalSessions: 0 }
    };

    users.push(user);
    this._saveUsers(users);
    this._setSession(user);
    return { ok: true, user };
  }

  /** Login. Returns { ok, error } */
  login({ email, password }) {
    if (!email || !password)
      return { ok: false, error: 'Email and password are required.' };

    const users = this._getUsers();
    const user  = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user || user.password !== this._hashish(password))
      return { ok: false, error: 'Incorrect email or password.' };

    this._setSession(user);
    return { ok: true, user };
  }

  /** Logout */
  logout() {
    this.currentUser = null;
    localStorage.removeItem(this.sessionKey);
  }

  /** Update profile */
  updateProfile(updates) {
    if (!this.currentUser) return { ok: false, error: 'Not logged in.' };
    const users = this._getUsers();
    const idx   = users.findIndex(u => u.id === this.currentUser.id);
    if (idx === -1) return { ok: false, error: 'User not found.' };

    if (updates.name) updates.initials = this._avatarInitials(updates.name);
    delete updates.email; delete updates.password; delete updates.id;

    users[idx] = { ...users[idx], ...updates };
    this._saveUsers(users);
    this._setSession(users[idx]);
    return { ok: true, user: users[idx] };
  }

  /** Change password */
  changePassword({ currentPassword, newPassword }) {
    if (!this.currentUser) return { ok: false, error: 'Not logged in.' };
    const users = this._getUsers();
    const idx   = users.findIndex(u => u.id === this.currentUser.id);
    if (idx === -1 || users[idx].password !== this._hashish(currentPassword))
      return { ok: false, error: 'Current password is incorrect.' };
    if (newPassword.length < 6)
      return { ok: false, error: 'New password must be at least 6 characters.' };

    users[idx].password = this._hashish(newPassword);
    this._saveUsers(users);
    return { ok: true };
  }

  /** Sync stats from app into user record */
  syncStats(stats) {
    if (!this.currentUser) return;
    const users = this._getUsers();
    const idx   = users.findIndex(u => u.id === this.currentUser.id);
    if (idx === -1) return;
    users[idx].stats = { ...users[idx].stats, ...stats };
    this._saveUsers(users);
    this.currentUser.stats = users[idx].stats;
    localStorage.setItem(this.sessionKey, JSON.stringify(this.currentUser));
  }

  isLoggedIn() { return !!this.currentUser; }
  getUser()    { return this.currentUser; }

  // ── Private ──────────────────────────────

  _setSession(user) {
    const sessionUser = { ...user };
    delete sessionUser.password;
    this.currentUser = sessionUser;
    localStorage.setItem(this.sessionKey, JSON.stringify(sessionUser));
  }

  _pickColor(seed) {
    const palette = [
      '#6366F1','#8B5CF6','#EC4899','#14B8A6',
      '#F59E0B','#10B981','#3B82F6','#EF4444'
    ];
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
    return palette[Math.abs(h) % palette.length];
  }
}
