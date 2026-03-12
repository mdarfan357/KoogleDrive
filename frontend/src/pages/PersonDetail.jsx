// src/pages/PersonDetail.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPerson, renamePerson, getSuggestions } from "../lib/api";
import { PhotoCard, RenameModal, Spinner, Toast, EmptyState } from "../components";

export default function PersonDetail() {
  const { personId } = useParams();
  const navigate     = useNavigate();

  const [person,      setPerson]      = useState(null);
  const [events,      setEvents]      = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showRename,  setShowRename]  = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [toast,       setToast]       = useState(null);
  const [activeEvent, setActiveEvent] = useState("all");

  useEffect(() => {
    getPerson(personId)
      .then(data => {
        setPerson(data.person);
        setEvents(data.events || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Load name suggestions for unnamed persons
    getSuggestions(personId)
      .then(data => setSuggestions(data.suggestions || []))
      .catch(() => {});
  }, [personId]);

  async function handleRename(name) {
    await renamePerson(personId, name);
    setPerson(prev => ({ ...prev, name }));
    setShowRename(false);
    showToast(`Renamed to "${name}"`);
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const allPhotos = events.flatMap(e => e.photos.map(p => ({ ...p, event_name: e.event_name })));
  const displayPhotos = activeEvent === "all"
    ? allPhotos
    : events.find(e => e.event_id === activeEvent)?.photos || [];

  if (loading) return <Spinner text="Loading person..." />;
  if (!person) return <EmptyState icon="👤" title="Person not found" />;

  return (
    <div className="page">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div className="page-header">
        <button className="back-btn" onClick={() => navigate("/persons")}>← People</button>

        <div className="person-header">
          <div className="person-header-avatar">
            {person.cover_image_id
              ? <img src={`https://lh3.googleusercontent.com/d/${person.cover_image_id}=s200`} alt={person.name} />
              : <span>{person.name ? person.name[0].toUpperCase() : "?"}</span>
            }
          </div>
          <div className="person-header-info">
            <h1>
              {person.name || <em className="unnamed">Unnamed Person</em>}
              <button className="rename-btn" onClick={() => setShowRename(true)}>✏️</button>
            </h1>
            <p className="page-subtitle">{allPhotos.length} photos across {events.length} events</p>
          </div>
        </div>

        {/* Name suggestions for unnamed persons */}
        {!person.name && suggestions.length > 0 && (
          <div className="suggestions-bar">
            <span className="suggestions-label">Suggested:</span>
            {suggestions.map(s => (
              <button
                key={s.person_id}
                className="suggestion-chip"
                onClick={() => navigate(`/persons/${s.person_id}`)}
              >
                {s.person_name} · {s.similarity_pct}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Event tabs */}
      {events.length > 1 && (
        <div className="event-tabs">
          <button
            className={`event-tab ${activeEvent === "all" ? "active" : ""}`}
            onClick={() => setActiveEvent("all")}
          >
            All ({allPhotos.length})
          </button>
          {events.map(e => (
            <button
              key={e.event_id}
              className={`event-tab ${activeEvent === e.event_id ? "active" : ""}`}
              onClick={() => setActiveEvent(e.event_id)}
            >
              {e.event_name} ({e.photos.length})
            </button>
          ))}
        </div>
      )}

      {/* Photo grid */}
      {displayPhotos.length === 0
        ? <EmptyState icon="🖼️" title="No photos" />
        : (
          <div className="photo-grid">
            {displayPhotos.map((photo, i) => (
              <PhotoCard
                key={`${photo.drive_file_id}-${i}`}
                photo={{ ...photo, person_name: photo.event_name }}
                onClick={setSelected}
              />
            ))}
          </div>
        )
      }

      {/* Rename modal */}
      {showRename && (
        <RenameModal
          person={person}
          onSave={handleRename}
          onClose={() => setShowRename(false)}
        />
      )}

      {/* Lightbox */}
      {selected && (
        <div className="lightbox" onClick={() => setSelected(null)}>
          <div className="lightbox-inner" onClick={e => e.stopPropagation()}>
            <img src={selected.image_url} alt={selected.file_name} />
            <div className="lightbox-meta">
              <span>{selected.event_name}</span>
              <button className="lightbox-close" onClick={() => setSelected(null)}>✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
