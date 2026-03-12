// src/pages/EventDetail.jsx
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEvent, getEventPhotos } from "../lib/api";
import { PhotoCard, Spinner, EmptyState } from "../components";

export default function EventDetail() {
  const { eventId } = useParams();
  const navigate    = useNavigate();

  const [event,    setEvent]    = useState(null);
  const [photos,   setPhotos]   = useState([]);
  const [page,     setPage]     = useState(1);
  const [hasMore,  setHasMore]  = useState(true);
  const [loading,  setLoading]  = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState(null); // lightbox

  // Load event metadata
  useEffect(() => {
    getEvent(eventId)
      .then(setEvent)
      .catch(console.error);
  }, [eventId]);

  // Load photos page
  const loadPage = useCallback(async (p) => {
    const data = await getEventPhotos(eventId, p);
    const newPhotos = data.photos || [];
    setPhotos(prev => p === 1 ? newPhotos : [...prev, ...newPhotos]);
    setHasMore(newPhotos.length === 50);
  }, [eventId]);

  useEffect(() => {
    setLoading(true);
    loadPage(1).finally(() => setLoading(false));
  }, [loadPage]);

  async function loadMore() {
    setLoadingMore(true);
    const next = page + 1;
    await loadPage(next);
    setPage(next);
    setLoadingMore(false);
  }

  if (loading) return <Spinner text="Loading photos..." />;

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate("/events")}>← Events</button>
        <h1>{event?.name || eventId}</h1>
        <p className="page-subtitle">
          {event?.photo_count || photos.length} photos · {event?.person_count} people
          {event?.date && ` · ${new Date(event.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`}
        </p>
      </div>

      {photos.length === 0
        ? <EmptyState icon="🖼️" title="No photos yet" subtitle="This event has no processed photos." />
        : (
          <>
            <div className="photo-grid">
              {photos.map((photo, i) => (
                <PhotoCard
                  key={`${photo.drive_file_id}-${i}`}
                  photo={photo}
                  onClick={setSelected}
                />
              ))}
            </div>

            {hasMore && (
              <div className="load-more">
                <button
                  className="btn-secondary"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </>
        )
      }

      {/* Lightbox */}
      {selected && (
        <div className="lightbox" onClick={() => setSelected(null)}>
          <div className="lightbox-inner" onClick={e => e.stopPropagation()}>
            <img src={selected.image_url} alt={selected.file_name} />
            <div className="lightbox-meta">
              {selected.person_name && (
                <span
                  className="lightbox-person"
                  onClick={() => navigate(`/persons/${selected.person_id}`)}
                >
                  👤 {selected.person_name}
                </span>
              )}
              <button className="lightbox-close" onClick={() => setSelected(null)}>✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
