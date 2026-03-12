// src/pages/MergeCandidates.jsx
import { useState, useEffect } from "react";
import { getMergeCandidates, resolveCandidate } from "../lib/api";
import { Spinner, EmptyState, Toast } from "../components";

export default function MergeCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [resolving,  setResolving]  = useState(null); // candidate id being resolved
  const [toast,      setToast]      = useState(null);

  useEffect(() => {
    getMergeCandidates()
      .then(data => setCandidates(data.candidates || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleResolve(candidate, action) {
    setResolving(candidate.id);
    try {
      await resolveCandidate(candidate.id, action);
      setCandidates(prev => prev.filter(c => c.id !== candidate.id));
      showToast(action === "merge"
        ? `Merged ${candidate.person_a.name || "Person"} into ${candidate.person_b.name || "Person"}`
        : "Marked as different people"
      );
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setResolving(null);
    }
  }

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  if (loading) return <Spinner text="Loading candidates..." />;

  return (
    <div className="page">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header">
        <h1>Review Matches</h1>
        <p className="page-subtitle">
          {candidates.length} pairs need your review — are these the same person?
        </p>
      </div>

      {candidates.length === 0
        ? (
          <EmptyState
            icon="✅"
            title="All caught up!"
            subtitle="No pending merge candidates. Run the pipeline to check for new ones."
          />
        )
        : (
          <div className="candidates-list">
            {candidates.map(c => (
              <div key={c.id} className="candidate-card">
                <div className="candidate-similarity">
                  {Math.round(c.similarity * 100)}% match
                </div>

                <div className="candidate-persons">
                  <PersonSample person={c.person_a} />
                  <div className="candidate-vs">vs</div>
                  <PersonSample person={c.person_b} />
                </div>

                <div className="candidate-actions">
                  <button
                    className="btn-merge"
                    disabled={resolving === c.id}
                    onClick={() => handleResolve(c, "merge")}
                  >
                    {resolving === c.id ? "..." : "✓ Same person — merge"}
                  </button>
                  <button
                    className="btn-reject"
                    disabled={resolving === c.id}
                    onClick={() => handleResolve(c, "reject")}
                  >
                    ✕ Different people
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

function PersonSample({ person }) {
  return (
    <div className="person-sample">
      <div className="person-sample-name">
        {person.name || <em>Unnamed</em>}
      </div>
      <div className="person-sample-thumbs">
        {(person.sample_thumbnails || []).slice(0, 4).map((url, i) => (
          <img key={i} src={url} alt="" className="person-sample-img" />
        ))}
      </div>
    </div>
  );
}
