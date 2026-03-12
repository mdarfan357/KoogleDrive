// src/lib/api.js
// Central API client. Set VITE_API_URL in .env

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_KEY  = import.meta.env.VITE_API_KEY  || "";

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

// Events
export const getEvents      = ()         => request("/events");
export const getEvent       = (id)       => request(`/events/${id}`);
export const getEventPhotos = (id, page) => request(`/events/${id}/photos?page=${page}&page_size=50`);

// Persons
export const getPersons     = ()         => request("/persons");
export const getPerson      = (id)       => request(`/persons/${id}`);
export const renamePerson   = (id, name) => request(`/persons/${id}/rename`, {
  method: "PATCH",
  body: JSON.stringify({ name }),
});
export const mergePersons   = (a, b)     => request("/persons/merge", {
  method: "POST",
  body: JSON.stringify({ person_a: a, person_b: b }),
});

// Merge candidates
export const getMergeCandidates  = ()           => request("/merge-candidates");
export const resolveCandidate    = (id, action) => request(`/merge-candidates/${id}/resolve`, {
  method: "POST",
  body: JSON.stringify({ action }),
});

// Search & suggestions
export const getSuggestions = (personId) => request(`/search/person/${personId}/suggestions`);

// Face recognition — multipart upload
export async function recognizeFace(file) {
  const form = new FormData();
  form.append("file", file);

  const headers = API_KEY ? { "X-API-Key": API_KEY } : {};
  const res = await fetch(`${BASE_URL}/recognize`, {
    method: "POST",
    headers,
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Recognition failed");
  }
  return res.json();
}
