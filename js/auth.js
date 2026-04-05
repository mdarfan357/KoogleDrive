const API_BASE = window.VITE_API_URL || 'http://localhost:8000';

function getSession()   { try { return JSON.parse(localStorage.getItem('fa_session')); } catch { return null; } }
function setSession(s)  { localStorage.setItem('fa_session', JSON.stringify(s)); }
function clearSession() { localStorage.removeItem('fa_session'); }
function getToken()     { return getSession()?.access_token || null; }
function getUser()      { return getSession()?.user || null; }
function authHeaders()  { const t = getToken(); return t ? { 'Authorization': `Bearer ${t}` } : {}; }

function loginUrl() {
  const depth = location.pathname.includes('/pages/') ? '../' : '';
  return `${depth}login.html`;
}

async function signOut() { clearSession(); location.href = loginUrl(); }

async function requireAuth() {
  const token = getToken(), user = getUser();
  if (!token || !user) { sessionStorage.setItem('redirect_after_login', location.href); location.href = loginUrl(); return null; }
  try {
    const p = JSON.parse(atob(token.split('.')[1]));
    if (p.exp && p.exp * 1000 < Date.now()) { clearSession(); sessionStorage.setItem('redirect_after_login', location.href); location.href = loginUrl(); return null; }
  } catch { clearSession(); location.href = loginUrl(); return null; }
  return user;
}

async function signInWithGoogle() {
  const res = await fetch(`${API_BASE}/auth/google/login`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Could not start sign-in');
  if (data.url) location.href = data.url;
  else throw new Error('No redirect URL');
}

function renderUserBadge(user) {
  const nav = document.querySelector('.nav-links');
  if (!nav || !user) return;
  const d = document.createElement('div');
  d.style.cssText = 'display:flex;align-items:center;gap:8px;margin-left:auto;';
  d.innerHTML = `
    <span class="nav-email">${user.name || user.email}</span>
    <div class="nav-avatar" id="nav-avatar">${(user.name || user.email || 'U')[0].toUpperCase()}</div>
    <button class="nav-signout" onclick="signOut()">Sign out</button>`;
  nav.appendChild(d);
}

function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  const icon = type === 'success'
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  t.innerHTML = icon + msg;
  document.body.appendChild(t);
  t.onclick = () => t.remove();
  setTimeout(() => t.remove(), 3500);
}

function showSpinner(el) {
  el.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div><p style="color:var(--text2);font-size:14px">Loading...</p></div>`;
}

function showEmpty(el, iconSvg, title, sub = '') {
  el.innerHTML = `<div class="empty"><div class="empty-icon">${iconSvg}</div><h3>${title}</h3>${sub ? `<p>${sub}</p>` : ''}</div>`;
}

function imageUrl(id) { return `https://lh3.googleusercontent.com/d/${id}=s1600`; }
function thumbUrl(id)  { return `https://lh3.googleusercontent.com/d/${id}=s400`; }
function initials(n)   { return n ? n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'; }
function getParam(k)   { return new URLSearchParams(location.search).get(k); }

function openLightbox(imgUrl, personName, personId) {
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = `<div class="lightbox-inner">
    <img src="${imgUrl}" alt="photo" />
    <button class="lightbox-close">${Icons.close}</button>
    ${personName ? `<div class="lightbox-person" data-pid="${personId}">${Icons.person} ${personName}</div>` : ''}
  </div>`;
  lb.onclick = e => { if (e.target === lb) lb.remove(); };
  lb.querySelector('.lightbox-close').onclick = () => lb.remove();
  if (personId) {
    lb.querySelector('.lightbox-person')?.addEventListener('click', () => {
      lb.remove();
      const base = location.pathname.includes('/pages/') ? '' : 'pages/';
      location.href = `${base}person.html?id=${personId}`;
    });
  }
  document.body.appendChild(lb);
}

function buildNav(activePage, user) {
  const isPages = location.pathname.includes('/pages/');
  const root = isPages ? '../' : '';
  const links = [
    { page: 'index',   href: `${root}index.html`,        label: 'Find Me',  icon: Icons.search  },
    { page: 'events',  href: `${root}pages/events.html`, label: 'Events',   icon: Icons.events  },
    { page: 'persons', href: `${root}pages/persons.html`,label: 'People',   icon: Icons.people  },
    { page: 'merge',   href: `${root}pages/merge.html`,  label: 'Review',   icon: Icons.review  },
  ];
  const navLinks = document.getElementById('nav-links');
  if (navLinks) {
    navLinks.innerHTML = links.map(l => `
      <button class="nav-link ${activePage === l.page ? 'active' : ''}" onclick="location.href='${l.href}'">
        ${l.icon}<span>${l.label}</span>
      </button>`).join('');
    if (user) {
      navLinks.innerHTML += `
        <div style="flex:1"></div>
        <div class="nav-user">
          <span class="nav-email">${user.name || user.email}</span>
          <div class="nav-avatar">${initials(user.name || user.email)}</div>
          <button class="nav-signout" onclick="signOut()">Sign out</button>
        </div>`;
    }
  }
  const bottomNav = document.getElementById('bottom-nav');
  if (bottomNav) {
    bottomNav.innerHTML = links.map(l => `
      <button class="bottom-nav-item ${activePage === l.page ? 'active' : ''}" onclick="location.href='${l.href}'">
        ${l.icon}<span class="bottom-nav-label">${l.label}</span>
      </button>`).join('');
  }
}
