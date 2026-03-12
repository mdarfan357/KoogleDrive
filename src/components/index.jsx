// src/components/index.jsx
// Shared UI components used across all pages

import { useState } from "react";

// ------------------------------------------------------------
// PhotoCard — single image tile with person name overlay
// ------------------------------------------------------------
export function PhotoCard({ photo, onClick }) {
  const [loaded, setLoaded] = useState(false);
  const [error,  setError]  = useState(false);

  return (
    <div
      className="photo-card"
      onClick={() => onClick?.(photo)}
      title={photo.person_name || "Unknown"}
    >
      {!loaded && !error && <div className="photo-skeleton" />}
      {error
        ? <div className="photo-error">⚠</div>
        : (
          <img
            src={photo.thumbnail_url}
            alt={photo.file_name || "photo"}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            style={{ display: loaded ? "block" : "none" }}
          />
        )
      }
      {photo.person_name && (
        <div className="photo-label">{photo.person_name}</div>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// PersonCard — person avatar tile with name + photo count
// ------------------------------------------------------------
export function PersonCard({ person, onClick }) {
  const initials = person.name
    ? person.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="person-card" onClick={() => onClick?.(person)}>
      <div className="person-avatar">
        {person.cover_image_id
          ? <img src={`https://lh3.googleusercontent.com/d/${person.cover_image_id}=s200`} alt={person.name} />
          : <span className="person-initials">{initials}</span>
        }
      </div>
      <div className="person-info">
        <div className="person-name">{person.name || <em>Unnamed</em>}</div>
        <div className="person-meta">{person.photo_count} photos · {person.event_count} events</div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// EventCard — event tile with photo + person count
// ------------------------------------------------------------
export function EventCard({ event, onClick }) {
  return (
    <div className="event-card" onClick={() => onClick?.(event)}>
      <div className="event-icon">📷</div>
      <div className="event-info">
        <div className="event-name">{event.name}</div>
        <div className="event-meta">
          {event.photo_count} photos · {event.person_count} people
          {event.date && ` · ${new Date(event.date).toLocaleDateString("en-US", { year: "numeric", month: "short" })}`}
        </div>
      </div>
      <div className="event-arrow">›</div>
    </div>
  );
}

// ------------------------------------------------------------
// RenameModal — inline modal to rename a person
// ------------------------------------------------------------
export function RenameModal({ person, onSave, onClose }) {
  const [name, setName] = useState(person.name || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim());
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>Name this person</h3>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSave()}
          placeholder="Enter name..."
          className="modal-input"
        />
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Spinner
// ------------------------------------------------------------
export function Spinner({ text = "Loading..." }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
      <p>{text}</p>
    </div>
  );
}

// ------------------------------------------------------------
// EmptyState
// ------------------------------------------------------------
export function EmptyState({ icon = "📭", title, subtitle }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

// ------------------------------------------------------------
// Toast — simple notification
// ------------------------------------------------------------
export function Toast({ message, type = "success", onClose }) {
  return (
    <div className={`toast toast-${type}`} onClick={onClose}>
      {type === "success" ? "✓" : "⚠"} {message}
    </div>
  );
}
