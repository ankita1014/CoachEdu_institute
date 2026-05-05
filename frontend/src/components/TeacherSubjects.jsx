import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TeacherSubjects.css";

const SUBJECTS = [
  { name: "English", shortLabel: "EN", category: "Languages", accent: "blue",   grade: "Class 1-5" },
  { name: "Marathi", shortLabel: "MR", category: "Languages", accent: "green",  grade: "Class 1-5" },
  { name: "Maths",   shortLabel: "MA", category: "Mathematics", accent: "orange", grade: "Class 1-5" },
  { name: "Hindi",   shortLabel: "HI", category: "Languages", accent: "violet", grade: "Class 1-5" },
];

const FILTERS = ["All Subjects", "Languages", "Mathematics"];

const API = `${import.meta.env.VITE_API_URL}/subjects`;

// ── Add Topic Modal ───────────────────────────────────────────────────────────
const AddTopicModal = ({ subject, existingTopics, onClose, onSaved }) => {
  const [name, setName]     = useState("");
  const [desc, setDesc]     = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError("Topic name is required"); return; }
    if (existingTopics.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" already exists in ${subject.name}`);
      return;
    }
    setSaving(true);
    try {
      const res  = await fetch(`${API}/${subject.name.toLowerCase()}/skill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, description: desc.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to add topic");
      onSaved(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tsd-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="tsd-modal">
        <div className="tsd-modal-head">
          <div>
            <h3>Add Topic</h3>
            <p>{subject.name}</p>
          </div>
          <button className="tsd-modal-close" onClick={onClose}>×</button>
        </div>
        <form className="tsd-modal-body" onSubmit={handleSubmit}>
          <div className="tsd-modal-field">
            <label>Topic Name *</label>
            <input
              autoFocus
              placeholder="e.g. Grammar, Tables, Reading…"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
            />
          </div>
          <div className="tsd-modal-field">
            <label>Description (optional)</label>
            <textarea
              placeholder="Brief description of this topic"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              style={{
                padding: "10px 13px", borderRadius: 9,
                border: "1.5px solid #e2e8f0", background: "#f8fafc",
                fontSize: "0.9rem", fontFamily: "inherit", outline: "none",
                resize: "vertical", width: "100%", boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#4f6df5")}
              onBlur={(e)  => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>
          {error && <p className="tsd-modal-error">{error}</p>}
          <div className="tsd-modal-actions">
            <button type="button" className="tsd-modal-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="tsd-modal-submit" disabled={saving}>
              {saving ? "Adding…" : <><i className="fas fa-plus"></i> Add Topic</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const TeacherSubjects = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm]     = useState("");
  const [activeFilter, setActiveFilter] = useState("All Subjects");
  const [subjectData, setSubjectData]   = useState({});
  const [loading, setLoading]           = useState(true);
  const [modalSubject, setModalSubject] = useState(null);
  const [toast, setToast]               = useState("");

  const fetchAll = async () => {
    setLoading(true);
    const results = await Promise.allSettled(
      SUBJECTS.map((s) =>
        fetch(`${API}/${s.name.toLowerCase()}`)
          .then((r) => r.json())
          .then((d) => ({ key: s.name.toLowerCase(), data: d }))
      )
    );
    const map = {};
    results.forEach((r) => {
      if (r.status === "fulfilled" && r.value?.data) {
        map[r.value.key] = r.value.data;
      }
    });
    setSubjectData(map);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const enriched = useMemo(() =>
    SUBJECTS.map((s) => {
      const db     = subjectData[s.name.toLowerCase()];
      const skills = Array.isArray(db?.skills) ? db.skills : [];
      return { ...s, skills };
    }),
  [subjectData]);

  const filtered = useMemo(() =>
    enriched.filter((s) => {
      const matchFilter = activeFilter === "All Subjects" || s.category === activeFilter;
      const q = searchTerm.toLowerCase();
      const matchSearch = !q ||
        s.name.toLowerCase().includes(q) ||
        s.skills.some((sk) => sk.name?.toLowerCase().includes(q));
      return matchFilter && matchSearch;
    }),
  [enriched, activeFilter, searchTerm]);

  const totals = useMemo(() => ({
    subjects: enriched.length,
    topics:   enriched.reduce((n, s) => n + s.skills.length, 0),
  }), [enriched]);

  const handleTopicSaved = (updatedSubject) => {
    const key = updatedSubject.name?.toLowerCase();
    if (key) setSubjectData((prev) => ({ ...prev, [key]: updatedSubject }));
    setModalSubject(null);
    setToast("Topic added successfully");
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <div className="teacher-subjects-page">
      {/* ── hero ── */}
      <section className="teacher-subjects-hero">
        <div>
          <p className="teacher-subjects-eyebrow">Academic Workspace</p>
          <h2>Subjects</h2>
          <p className="teacher-subjects-subtitle">
            Manage syllabus flow, keep every topic organized, and move from
            subject planning to topic-level updates in one place.
          </p>
        </div>
        <div className="teacher-subjects-summary">
          <div className="teacher-summary-card"><span>Total Subjects</span><strong>{totals.subjects}</strong></div>
          <div className="teacher-summary-card"><span>Total Topics</span><strong>{totals.topics}</strong></div>
        </div>
      </section>

      {/* ── toolbar ── */}
      <section className="teacher-subjects-toolbar">
        <div className="teacher-subjects-search">
          <label htmlFor="subject-search">Search</label>
          <input
            id="subject-search"
            type="text"
            placeholder="Search subjects or topics…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="teacher-subjects-filters">
          {FILTERS.map((f) => (
            <button key={f} className={activeFilter === f ? "active" : ""} onClick={() => setActiveFilter(f)}>
              {f}
            </button>
          ))}
        </div>
      </section>

      {/* ── grid ── */}
      {loading ? (
        <section className="teacher-subjects-grid">
          {SUBJECTS.map((s) => <div key={s.name} className="teacher-subject-card-skeleton" />)}
        </section>
      ) : (
        <section className="teacher-subjects-grid">
          {filtered.map((subject) => (
            <article key={subject.name} className={`teacher-subject-card accent-${subject.accent}`}>
              <div className="teacher-subject-card-top">
                <div className="teacher-subject-badge">{subject.shortLabel}</div>
                <span className="teacher-subject-grade">{subject.grade}</span>
              </div>

              <h3>{subject.name}</h3>

              {/* Topic tags — no skills/chapters count badges */}
              {subject.skills.length > 0 ? (
                <div className="teacher-subject-tags">
                  {subject.skills.slice(0, 3).map((sk) => (
                    <span key={sk.name || sk}>{sk.name || sk}</span>
                  ))}
                  {subject.skills.length > 3 && (
                    <span>+{subject.skills.length - 3} more</span>
                  )}
                </div>
              ) : (
                <p className="teacher-subject-no-skills">No topics added yet</p>
              )}

              <button
                className="teacher-subject-action"
                onClick={() => setModalSubject(subject)}
              >
                <i className="fas fa-plus" style={{ marginRight: 6 }}></i>
                Add Topic
              </button>
            </article>
          ))}
        </section>
      )}

      {!loading && filtered.length === 0 && (
        <div className="teacher-subjects-empty">
          <h3>No matching subjects found</h3>
          <p>Try another keyword or switch the filter above.</p>
        </div>
      )}

      {/* ── Add Topic Modal ── */}
      {modalSubject && (
        <AddTopicModal
          subject={modalSubject}
          existingTopics={
            (subjectData[modalSubject.name.toLowerCase()]?.skills || []).map((s) => s.name)
          }
          onClose={() => setModalSubject(null)}
          onSaved={handleTopicSaved}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="tsd-toast">
          <i className="fas fa-circle-check"></i> {toast}
        </div>
      )}
    </div>
  );
};

export default TeacherSubjects;
