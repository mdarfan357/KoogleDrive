// js/auth.js
// Google OAuth auth — all server-side, no keys in frontend.

const API_BASE = window.VITE_API_URL || 'https://mdarfan-faceapp-backend.hf.space';

function getSession()   { try { return JSON.parse(localStorage.getItem('fa_session')); } catch { return null; } }
function setSession(s)  { localStorage.setItem('fa_session', JSON.stringify(s)); }
function clearSession() { localStorage.removeItem('fa_session'); }
function getToken()     { return getSession()?.access_token || null; }
function getUser()      { return getSession()?.user || null; }

function authHeaders() {
  const t = getToken();
  return t ? { 'Authorization': `Bearer ${t}` } : {};
}

function loginUrl() {
  const depth = location.pathname.includes('/pages/') ? '../' : '';
  return `${depth}login.html`;
}

async function signOut() {
  clearSession();
  location.href = loginUrl();
}

async function requireAuth() {
  const token = getToken();
  const user  = getUser();
  if (!token || !user) {
    sessionStorage.setItem('redirect_after_login', location.href);
    location.href = loginUrl();
    return null;
  }
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

async function signInWithGoogle() {
  const res  = await fetch(`${API_BASE}/auth/google/login`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Could not start sign-in');
  if (data.url) location.href = data.url;
  else throw new Error('No redirect URL returned');
}

function renderUserBadge(user) {
  const nav = document.querySelector('.nav-links');
  if (!nav || !user) return;
  const d = document.createElement('div');
  d.style.cssText = 'display:flex;align-items:center;gap:8px;margin-left:auto;';
  d.innerHTML = `<span class="nav-user">${user.name || user.email}</span>
    <button class="nav-signout" onclick="signOut()">Sign out</button>`;
  nav.appendChild(d);
}

function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = (type === 'success' ? '✓ ' : '⚠ ') + msg;
  document.body.appendChild(t);
  t.onclick = () => t.remove();
  setTimeout(() => t.remove(), 3000);
}

function showSpinner(el) {
  el.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div><p>Loading...</p></div>`;
}

function showEmpty(el, icon, title, sub = '') {
  el.innerHTML = `<div class="empty"><div class="empty-icon">${icon}</div><h3>${title}</h3>${sub?`<p>${sub}</p>`:''}</div>`;
}

function imageUrl(id) { return `https://lh3.googleusercontent.com/d/${id}=s1600`; }
function thumbUrl(id)  { return `https://lh3.googleusercontent.com/d/${id}=s400`; }
function initials(n)   { return n ? n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : '?'; }
function getParam(k)   { return new URLSearchParams(location.search).get(k); }

function openLightbox(imgUrl, personName, personId) {
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = `<div class="lightbox-inner">
    <img src="${imgUrl}" alt="photo" />
    <button class="lightbox-close">✕</button>
    ${personName ? `<div class="lightbox-person" data-pid="${personId}">👤 ${personName}</div>` : ''}
  </div>`;
  lb.onclick = e => { if (e.target === lb) lb.remove(); };
  lb.querySelector('.lightbox-close').onclick = () => lb.remove();
  if (personId) {
    lb.querySelector('.lightbox-person')?.addEventListener('click', () => {
      lb.remove();
      location.href = (location.pathname.includes('/pages/') ? '' : 'pages/') + `person.html?id=${personId}`;
    });
  }
  document.body.appendChild(lb);
}
