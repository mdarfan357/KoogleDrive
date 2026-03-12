// src/pages/Persons.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPersons } from "../lib/api";
import { PersonCard, Spinner, EmptyState } from "../components";

export default function Persons() {
  const [persons,    setPersons]    = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [showNamed,  setShowNamed]  = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getPersons()
      .then(data => {
        setPersons(data.persons || []);
        setFiltered(data.persons || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = persons;
    if (showNamed)  result = result.filter(p => p.name);
    if (search)     result = result.filter(p =>
      p.name?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, showNamed, persons]);

  const named   = persons.filter(p => p.name).length;
  const unnamed = persons.length - named;

  if (loading) return <Spinner text="Loading people..." />;

  return (
    <div className="page">
      <div className="page-header">
        <h1>People</h1>
        <p className="page-subtitle">
          {named} named · {unnamed} unnamed · {persons.length} total
        </p>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={showNamed}
            onChange={e => setShowNamed(e.target.checked)}
          />
          Named only
        </label>
      </div>

      {filtered.length === 0
        ? <EmptyState icon="👤" title="No people found" subtitle="Try adjusting your filters." />
        : (
          <div className="persons-grid">
            {filtered.map(person => (
              <PersonCard
                key={person.id}
                person={person}
                onClick={() => navigate(`/persons/${person.id}`)}
              />
            ))}
          </div>
        )
      }
    </div>
  );
}
