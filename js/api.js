const BASE_URL = window.VITE_API_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...authHeaders(), ...options.headers };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (res.status === 401) { clearSession(); location.href = loginUrl(); return; }
  if (!res.ok) { const e = await res.json().catch(() => ({ detail: res.statusText })); throw new Error(e.detail || 'Request failed'); }
  return res.json();
}

const api = {
  getEvents:          ()         => request('/events'),
  getEvent:           (id)       => request(`/events/${id}`),
  getEventPhotos:     (id, page) => request(`/events/${id}/photos?page=${page}&page_size=50`),
  setEventCover:      (id, fid)  => request(`/events/${id}/cover`, { method: 'PATCH', body: JSON.stringify({ cover_image_id: fid }) }),
  getPersons:         ()         => request('/persons'),
  getPerson:          (id)       => request(`/persons/${id}`),
  renamePerson:       (id, name) => request(`/persons/${id}/rename`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  setPersonThumbnail: (id, fid)  => request(`/persons/${id}/thumbnail`, { method: 'PATCH', body: JSON.stringify({ cover_image_id: fid }) }),
  mergePersons:       (a, b)     => request('/persons/merge', { method: 'POST', body: JSON.stringify({ person_a: a, person_b: b }) }),
  getMergeCandidates: ()         => request('/merge-candidates'),
  resolveCandidate:   (id, act)  => request(`/merge-candidates/${id}/resolve`, { method: 'POST', body: JSON.stringify({ action: act }) }),
  getSuggestions:     (pid)      => request(`/search/person/${pid}/suggestions`),
  recognizeFace: async (file) => {
    const form = new FormData(); form.append('file', file);
    const res = await fetch(`${BASE_URL}/recognize`, { method: 'POST', body: form });
    if (!res.ok) { const e = await res.json().catch(() => ({ detail: res.statusText })); throw new Error(e.detail || 'Recognition failed'); }
    return res.json();
  },
};
