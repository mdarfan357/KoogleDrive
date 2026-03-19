// js/auth.js
// All auth goes through YOUR backend — no Supabase keys in frontend.

const API_BASE = window.VITE_API_URL || 'http://localhost:8000';

// ── Session storage (localStorage) ──────────────────────────
function getSession()  { try { return JSON.parse(localStorage.getItem('fa_session')); } catch { return null; } }
function setSession(s) { localStorage.setItem('fa_session', JSON.stringify(s)); }
function clearSession(){ localStorage.removeItem('fa_session'); }

function getToken()    { return getSession()?.access_token || null; }
function getUser()     { return getSession()?.user || null; }

// ── Auth header for API requests ────────────────────────────
function authHeaders() {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// ── Send magic link ──────────────────────────────────────────
async function sendMagicLink(email) {
  const res = await fetch(`${API_BASE}/auth/send-magic-link`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to send magic link');
  return data;
}

// ── Verify token from magic link URL ────────────────────────
async function verifyMagicLink(token, type = 'magiclink') {
  const res = await fetch(`${API_BASE}/auth/verify`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ token, type }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Verification failed');
  setSession(data);
  return data;
}

// ── Sign out ─────────────────────────────────────────────────
async function signOut() {
  clearSession();
  location.href = loginUrl();
}

function loginUrl() {
  const depth = location.pathname.includes('/pages/') ? '../' : '';
  return `${depth}login.html`;
}

// ── Auth guard ───────────────────────────────────────────────
// Call at top of every protected page.
// Returns user object or redirects to login.
async function requireAuth() {
  const token = getToken();
  const user  = getUser();

  if (!token || !user) {
    sessionStorage.setItem('redirect_after_login', location.href);
    location.href = loginUrl();
    return null;
  }

  // Check if token is expired (JWT exp claim)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      clearSession();
      sessionStorage.setItem('redirect_after_login', location.href);
      location.href = loginUrl();
      return null;
    }
  } catch(e) {
    clearSession();
    location.href = loginUrl();
    return null;
  }

  return user;
}

// ── Render user badge in nav ─────────────────────────────────
function renderUserBadge(user) {
  const nav = document.querySelector('.nav-links');
  if (!nav || !user) return;
  const badge = document.createElement('div');
  badge.style.cssText = 'display:flex;align-items:center;gap:8px;margin-left:auto;';
  badge.innerHTML = `
    <span style="font-size:12px;color:var(--text3);">${user.name || user.email}</span>
    <button onclick="signOut()" style="padding:5px 12px;border-radius:20px;border:1px solid var(--border2);background:var(--bg2);color:var(--text2);font-size:12px;cursor:pointer;">
      Sign out
    </button>`;
  nav.appendChild(badge);
}
