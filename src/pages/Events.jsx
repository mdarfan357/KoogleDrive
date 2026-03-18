// src/pages/Events.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getEvents } from "../lib/api";
import { EventCard, Spinner, EmptyState } from "../components";

export default function Events() {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getEvents()
      .then(data => setEvents(data.events || []))
      .catch(e  => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner text="Loading events..." />;
  if (error)   return <div className="error-msg">Failed to load events: {error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Events</h1>
        <p className="page-subtitle">Browse photos by occasion</p>
      </div>

      {events.length === 0
        ? <EmptyState icon="📷" title="No events yet" subtitle="Run the pipeline to process your first event." />
        : (
          <div className="events-list">
            {events.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => navigate(`/events/${event.id}`)}
              />
            ))}
          </div>
        )
      }
    </div>
  );
}
