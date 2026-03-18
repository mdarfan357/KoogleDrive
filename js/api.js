// js/api.js — central API client, shared across all pages

const BASE_URL = window.VITE_API_URL || 'http://localhost:8000';
const API_KEY  = window.VITE_API_KEY  || '';

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
    ...options.headers,
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

// Events
const api = {
  getEvents:      ()         => request('/events'),
  getEvent:       (id)       => request(`/events/${id}`),
  getEventPhotos: (id, page) => request(`/events/${id}/photos?page=${page}&page_size=50`),

  // Persons
  getPersons:   ()         => request('/persons'),
  getPerson:    (id)       => request(`/persons/${id}`),
  renamePerson: (id, name) => request(`/persons/${id}/rename`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  }),
  mergePersons: (a, b) => request('/persons/merge', {
    method: 'POST',
    body: JSON.stringify({ person_a: a, person_b: b }),
  }),

  // Merge candidates
  getMergeCandidates: ()           => request('/merge-candidates'),
  resolveCandidate:   (id, action) => request(`/merge-candidates/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  }),

  // Search
  getSuggestions: (personId) => request(`/search/person/${personId}/suggestions`),

  // Recognize — multipart
  recognizeFace: async (file) => {
    const form = new FormData();
    form.append('file', file);
    const headers = API_KEY ? { 'X-API-Key': API_KEY } : {};
    const res = await fetch(`${BASE_URL}/recognize`, { method: 'POST', headers, body: form });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Recognition failed');
    }
    return res.json();
  },
};

// Utility helpers
function imageUrl(fileId)     { return `https://lh3.googleusercontent.com/d/${fileId}=s1600`; }
function thumbUrl(fileId)     { return `https://lh3.googleusercontent.com/d/${fileId}=s400`; }
function initials(name)       { return name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'; }
function navigate(page, params) {
  const url = new URL(`/${page}`, location.origin);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  location.href = url.href;
}
function getParam(key) { return new URLSearchParams(location.search).get(key); }

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

function openLightbox(imageUrl, personName, personId) {
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = `
    <div class="lightbox-inner">
      <img src="${imageUrl}" alt="photo" />
      <button class="lightbox-close">✕</button>
      ${personName ? `<div class="lightbox-person" data-pid="${personId}">👤 ${personName}</div>` : ''}
    </div>`;
  lb.onclick = (e) => { if (e.target === lb) lb.remove(); };
  lb.querySelector('.lightbox-close').onclick = () => lb.remove();
  if (personId) {
    lb.querySelector('.lightbox-person')?.addEventListener('click', () => {
      lb.remove();
      navigate('pages/person.html', { id: personId });
    });
  }
  document.body.appendChild(lb);
}

function setActiveNav() {
  const path = location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', path.includes(link.dataset.page));
  });
}
