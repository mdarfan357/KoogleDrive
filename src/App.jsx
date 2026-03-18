// src/App.jsx
import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import Events        from "./pages/Events";
import EventDetail   from "./pages/EventDetail";
import Persons       from "./pages/Persons";
import PersonDetail  from "./pages/PersonDetail";
import MergeCandidates from "./pages/MergeCandidates";
import Recognize     from "./pages/Recognize";
import "./styles.css";

function Nav() {
  const location = useLocation();
  const isDetail = location.pathname.split("/").length > 2;

  return (
    <nav className="nav">
      <div className="nav-brand">
        <span className="nav-logo">📸</span>
        <span className="nav-title">FaceAlbum</span>
      </div>
      <div className="nav-links">
        <NavLink to="/recognize" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
          Find Me
        </NavLink>
        <NavLink to="/events" className={({ isActive }) => `nav-link ${isActive || isDetail ? "active" : ""}`}>
          Events
        </NavLink>
        <NavLink to="/persons" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
          People
        </NavLink>
        <NavLink to="/merge" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
          Review
        </NavLink>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Nav />
        <main className="main">
          <Routes>
            <Route path="/"                  element={<Recognize />} />
            <Route path="/recognize"         element={<Recognize />} />
            <Route path="/events"            element={<Events />} />
            <Route path="/events/:eventId"   element={<EventDetail />} />
            <Route path="/persons"           element={<Persons />} />
            <Route path="/persons/:personId" element={<PersonDetail />} />
            <Route path="/merge"             element={<MergeCandidates />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
