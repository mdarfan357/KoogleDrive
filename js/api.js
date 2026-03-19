// js/api.js
// All requests include Authorization header from session token.
// No Supabase or API keys in this file.

const BASE_URL = window.VITE_API_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders(),   // from auth.js — adds Bearer token
    ...options.headers,
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (res.status === 401) {
    clearSession();
    location.href = loginUrl();
    return;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

const api = {
  getEvents:      ()         => request('/events'),
  getEvent:       (id)       => request(`/events/${id}`),
  getEventPhotos: (id, page) => request(`/events/${id}/photos?page=${page}&page_size=50`),
  getPersons:     ()         => request('/persons'),
  getPerson:      (id)       => request(`/persons/${id}`),
  renamePerson:   (id, name) => request(`/persons/${id}/rename`, {
    method: 'PATCH', body: JSON.stringify({ name }),
  }),
  mergePersons: (a, b) => request('/persons/merge', {
    method: 'POST', body: JSON.stringify({ person_a: a, person_b: b }),
  }),
  getMergeCandidates: ()           => request('/merge-candidates'),
  resolveCandidate:   (id, action) => request(`/merge-candidates/${id}/resolve`, {
    method: 'POST', body: JSON.stringify({ action }),
  }),
  getSuggestions: (personId) => request(`/search/person/${personId}/suggestions`),

  // Recognize is public — no auth header needed
  recognizeFace: async (file) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${BASE_URL}/recognize`, { method: 'POST', body: form });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Recognition failed');
    }
    return res.json();
  },
};

function imageUrl(fileId) { return `https://lh3.googleusercontent.com/d/${fileId}=s1600`; }
function thumbUrl(fileId)  { return `https://lh3.googleusercontent.com/d/${fileId}=s400`; }
function initials(name)    { return name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'; }
function getParam(key)     { return new URLSearchParams(location.search).get(key); }

function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = (type === 'success' ? '✓ ' : '⚠ ') + msg;
  document.body.appendChild(t);
  t.onclick = () => t.remove();
  setTimeout(() => t.remove(), 3000);
}

function showSpinner(container) {
  container.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div><p>Loading...</p></div>`;
}

function showEmpty(container, icon, title, subtitle = '') {
  container.innerHTML = `<div class="empty"><div class="empty-icon">${icon}</div><h3>${title}</h3>${subtitle ? `<p>${subtitle}</p>` : ''}</div>`;
}

function openLightbox(imgUrl, personName, personId) {
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = `
    <div class="lightbox-inner">
      <img src="${imgUrl}" alt="photo" />
      <button class="lightbox-close">✕</button>
      ${personName ? `<div class="lightbox-person" data-pid="${personId}">👤 ${personName}</div>` : ''}
    </div>`;
  lb.onclick = (e) => { if (e.target === lb) lb.remove(); };
  lb.querySelector('.lightbox-close').onclick = () => lb.remove();
  if (personId) {
    lb.querySelector('.lightbox-person')?.addEventListener('click', () => {
      lb.remove();
      location.href = `person.html?id=${personId}`;
    });
  }
  document.body.appendChild(lb);
}
