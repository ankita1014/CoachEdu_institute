import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TeacherSubjects.css";

// Fixed subjects — replace Science with Hindi
const SUBJECTS = [
  { name: "English", shortLabel: "EN", category: "Languages", accent: "blue",   grade: "Class 1-5" },
  { name: "Marathi", shortLabel: "MR", category: "Languages", accent: "green",  grade: "Class 1-5" },
  { name: "Maths",   shortLabel: "MA", category: "Mathematics", accent: "orange", grade: "Class 1-5" },
  { name: "Hindi",   shortLabel: "HI", category: "Languages", accent: "violet", grade: "Class 1-5" },
];

const FILTERS = ["All Subjects", "Languages", "Mathematics"];

const API = "http://localhost:5000/api/subjects";

const TeacherSubjects = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm]   = useState("");
  const [activeFilter, setActiveFilter] = useState("All Subjects");
  // subjectData: { [name.toLowerCase()]: { skills: [...] } }
  const [subjectData, setSubjectData] = useState({});
  const [loading, setLoading]         = useState(true);

  // Fetch all subjects from DB in parallel
  useEffect(() => {
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
    fetchAll();
  }, []);

  const enriched = useMemo(() =>
    SUBJECTS.map((s) => {
      const db = subjectData[s.name.toLowerCase()];
      const skills = Array.isArray(db?.skills) ? db.skills : [];
      const totalChapters = skills.reduce((n, sk) => n + (sk.chapters?.length || 0), 0);
      // Only show progress if there are chapters with status data
      const completedChapters = skills.reduce((n, sk) =>
        n + (sk.chapters?.filter((c) => c.status === "completed").length || 0), 0);
      const progress = totalChapters > 0
        ? Math.round((completedChapters / totalChapters) * 100)
        : null; // null = no data, don't show bar
      return { ...s, skills, totalChapters, progress };
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
    skills:   enriched.reduce((n, s) => n + s.skills.length, 0),
    chapters: enriched.reduce((n, s) => n + s.totalChapters, 0),
  }), [enriched]);

  return (
    <div className="teacher-subjects-page">
      <section className="teacher-subjects-hero">
        <div>
          <p className="teacher-subjects-eyebrow">Academic Workspace</p>
          <h2>Subjects</h2>
          <p className="teacher-subjects-subtitle">
            Manage syllabus flow, keep every topic organized, and move from
            subject planning to skill-level updates in one place.
          </p>
        </div>
        <div className="teacher-subjects-summary">
          <div className="teacher-summary-card"><span>Total Subjects</span><strong>{totals.subjects}</strong></div>
          <div className="teacher-summary-card"><span>Total Skills</span><strong>{totals.skills}</strong></div>
          <div className="teacher-summary-card"><span>Total Chapters</span><strong>{totals.chapters}</strong></div>
        </div>
      </section>

      <section className="teacher-subjects-toolbar">
        <div className="teacher-subjects-search">
          <label htmlFor="subject-search">Search</label>
          <input
            id="subject-search"
            type="text"
            placeholder="Search subjects or skills..."
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

      {loading ? (
        <section className="teacher-subjects-grid">
          {SUBJECTS.map((s) => (
            <div key={s.name} className="teacher-subject-card-skeleton" />
          ))}
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

              <div className="teacher-subject-meta">
                <span>{subject.skills.length} skill{subject.skills.length !== 1 ? "s" : ""}</span>
                <span>{subject.totalChapters} chapter{subject.totalChapters !== 1 ? "s" : ""}</span>
              </div>

              {/* Progress bar — only shown when real data exists */}
              {subject.progress !== null && (
                <div className="teacher-subject-progress">
                  <div className="teacher-progress-label">
                    <span>Chapter progress</span>
                    <strong>{subject.progress}%</strong>
                  </div>
                  <div className="teacher-progress-track">
                    <div className="teacher-progress-fill" style={{ width: `${subject.progress}%` }} />
                  </div>
                </div>
              )}

              {/* Skill preview tags */}
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
                <p className="teacher-subject-no-skills">No skills added yet</p>
              )}

              <button
                className="teacher-subject-action"
                onClick={() => navigate(`/subjects/${subject.name.toLowerCase()}`, { state: subject })}
              >
                {subject.skills.length > 0 ? "Manage Skills" : "Add First Skill"}
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
    </div>
  );
};

export default TeacherSubjects;
