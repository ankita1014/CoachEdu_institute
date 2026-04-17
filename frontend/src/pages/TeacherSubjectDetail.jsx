import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "../styles/TeacherSubjectDetail.css";
import {
  addChapterAPI,
  addSkillAPI,
  deleteSkillAPI,
  getSubject,
  updateSkillAPI,
  toggleChapterAPI,
} from "../services/api";

const subjectThemeMap = {
  english: { label: "EN", accent: "blue",   grade: "Class 1-5" },
  marathi: { label: "MR", accent: "green",  grade: "Class 1-5" },
  maths:   { label: "MA", accent: "orange", grade: "Class 1-5" },
  hindi:   { label: "HI", accent: "violet", grade: "Class 1-5" },
};

const normalizeSkill = (skill, index) => {
  if (typeof skill === "string") {
    return { name: skill, status: "pending", progress: 0, chapters: [] };
  }
  const chapters = Array.isArray(skill?.chapters) ? skill.chapters : [];
  return {
    ...skill,
    name: skill?.name || `Skill ${index + 1}`,
    status: skill?.status || "pending",
    progress: typeof skill?.progress === "number" ? skill.progress : 0,
    chapters,
  };
};

const toTitleCase = (value = "") =>
  value.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export default function TeacherSubjectDetail() {
  const { name } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [chapterInputs, setChapterInputs] = useState({});
  const [activeTab, setActiveTab] = useState("skills");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // modal state
  const [showModal, setShowModal] = useState(false);
  const [modalSkill, setModalSkill] = useState("");
  const [modalDesc, setModalDesc]   = useState("");
  const [modalError, setModalError] = useState("");
  const [toast, setToast] = useState("");
  // edit skill modal
  const [editModal, setEditModal]   = useState(null); // { index, name }
  const [editName, setEditName]     = useState("");
  const [editError, setEditError]   = useState("");

  const theme = subjectThemeMap[name] || {
    label: name?.slice(0, 2).toUpperCase() || "SB",
    accent: "blue",
    grade: "Class 1-5",
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      try {
        const data = await getSubject(name);
        const nextSkills = Array.isArray(data?.skills)
          ? data.skills.map(normalizeSkill)
          : [];
        setSkills(nextSkills);
      } catch (err) {
        console.error("Error loading subject:", err);
        setSkills([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [name]);

  const filteredSkills = useMemo(() => {
    return skills.filter((skill) => {
      const search = searchTerm.toLowerCase();
      return (
        skill.name.toLowerCase().includes(search) ||
        skill.chapters.some((chapter) =>
          String(typeof chapter === "object" ? chapter.name : chapter)
            .toLowerCase()
            .includes(search)
        )
      );
    });
  }, [searchTerm, skills]);

  const totalChapters = useMemo(
    () => skills.reduce((sum, skill) => sum + (skill.chapters?.length || 0), 0),
    [skills]
  );

  const averageProgress = useMemo(() => {
    if (!skills.length) {
      return 0;
    }

    return Math.round(
      skills.reduce((sum, skill) => sum + (skill.progress || 0), 0) /
        skills.length
    );
  }, [skills]);

  const updateLocalSkill = (index, updater) => {
    setSkills((prev) =>
      prev.map((skill, skillIndex) =>
        skillIndex === index ? updater(skill) : skill
      )
    );
  };

  const openModal = () => { setModalSkill(""); setModalDesc(""); setModalError(""); setShowModal(true); };
  const closeModal = () => setShowModal(false);

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const trimmed = modalSkill.trim();
    if (!trimmed) { setModalError("Skill name is required"); return; }

    // Client-side duplicate check
    if (skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setModalError(`"${trimmed}" already exists`);
      return;
    }

    setSaving(true);
    try {
      const data = await addSkillAPI(name, trimmed, modalDesc.trim());
      if (data.error) { setModalError(data.error); return; }
      setSkills((data.skills || []).map(normalizeSkill));
      setShowModal(false);
      setToast("Skill added successfully");
      setTimeout(() => setToast(""), 3000);
    } catch (err) {
      setModalError("Failed to add skill");
    } finally {
      setSaving(false);
    }
  };

  const addChapter = async (index) => {
    const value = chapterInputs[index]?.trim();
    if (!value) {
      return;
    }

    try {
      const data = await addChapterAPI(name, index, value);
      setSkills((data.skills || []).map(normalizeSkill));
      setChapterInputs((prev) => ({ ...prev, [index]: "" }));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSkill = async (index) => {
    try {
      const data = await deleteSkillAPI(name, index);
      setSkills((data.skills || []).map(normalizeSkill));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleChapter = async (skillIndex, chapterIndex) => {
    try {
      const data = await toggleChapterAPI(name, skillIndex, chapterIndex);
      setSkills((data.skills || []).map(normalizeSkill));
    } catch (err) {
      console.error(err);
    }
  };

  const editSkill = (index) => {
    setEditModal({ index });
    setEditName(skills[index]?.name || "");
    setEditError("");
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const trimmed = editName.trim();
    if (!trimmed) { setEditError("Skill name is required"); return; }
    const idx = editModal.index;
    const currentSkill = skills[idx];
    if (trimmed === currentSkill.name) { setEditModal(null); return; }
    if (skills.some((s, i) => i !== idx && s.name.toLowerCase() === trimmed.toLowerCase())) {
      setEditError(`"${trimmed}" already exists`);
      return;
    }
    const updatedSkill = { ...currentSkill, name: trimmed };
    updateLocalSkill(idx, () => updatedSkill);
    setEditModal(null);
    try {
      await updateSkillAPI(name, idx, updatedSkill);
      setToast("Skill updated");
      setTimeout(() => setToast(""), 3000);
    } catch (err) {
      updateLocalSkill(idx, () => currentSkill);
    }
  };

  const cycleStatus = async (index) => {
    const currentSkill = skills[index];
    const order = ["pending", "inprogress", "active"];
    const currentIndex = order.indexOf(currentSkill.status || "pending");
    const nextStatus = order[(currentIndex + 1) % order.length];
    const updatedSkill = { ...currentSkill, status: nextStatus };

    updateLocalSkill(index, () => updatedSkill);

    try {
      await updateSkillAPI(name, index, updatedSkill);
    } catch (err) {
      console.error(err);
      updateLocalSkill(index, () => currentSkill);
    }
  };

  if (loading) {
    return <div className="teacher-subject-detail loading">Loading subject...</div>;
  }

  return (
    <div className={`teacher-subject-detail accent-${theme.accent}`}>
      <section className="tsd-hero">
        <div className="tsd-hero-copy">
          <button
            className="tsd-back"
            onClick={() =>
              navigate("/teacher-dashboard", { state: { activeTab: "subjects" } })
            }
          >
            Back
          </button>
          <p className="tsd-breadcrumb">Dashboard / Subjects / {toTitleCase(name)}</p>
          <div className="tsd-title-row">
            <div className="tsd-badge">{theme.label}</div>
            <div>
              <h1>{toTitleCase(name)}</h1>
              <p>
                {skills.length} skills across {totalChapters} chapters for{" "}
                {location.state?.grade || theme.grade}
              </p>
            </div>
          </div>
        </div>

        <div className="tsd-hero-stats">
          <div className="tsd-stat">
            <span>Skills</span>
            <strong>{skills.length}</strong>
          </div>
          <div className="tsd-stat">
            <span>Chapters</span>
            <strong>{totalChapters}</strong>
          </div>
          <div className="tsd-stat">
            <span>Progress</span>
            <strong>{averageProgress}%</strong>
          </div>
        </div>
      </section>

      <section className="tsd-toolbar">
        <div className="tsd-tabs">
          {["skills", "chapters", "overview"].map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "active" : ""}
              onClick={() => setActiveTab(tab)}
            >
              {toTitleCase(tab)}
            </button>
          ))}
        </div>

        <div className="tsd-search">
          <input
            type="text"
            placeholder="Search skills or chapters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      {activeTab === "skills" && (
        <>
          <section className="tsd-add-bar">
            <span className="tsd-add-bar-label">{skills.length} skill{skills.length !== 1 ? "s" : ""} in {toTitleCase(name)}</span>
            <button className="tsd-add-skill-btn" onClick={openModal}>
              <i className="fas fa-plus"></i> Add Skill
            </button>
          </section>

          <section className="tsd-grid">
            {filteredSkills.length === 0 ? (
              <div className="tsd-empty-state">
                <i className="fas fa-layer-group"></i>
                <h3>No skills added yet</h3>
                <p>Use the field above to add your first skill for {toTitleCase(name)}.</p>
              </div>
            ) : (
              filteredSkills.map((skill, index) => (
              <article className="tsd-card" key={`${skill.name}-${index}`}>
                <div className="tsd-card-top">
                  <div>
                    <h3>{skill.name}</h3>
                    <p>{skill.chapters?.length || 0} chapters linked</p>
                  </div>
                  <div className="tsd-actions">
                    <button onClick={() => cycleStatus(index)}>Status</button>
                    <button onClick={() => editSkill(index)}>Edit</button>
                    <button className="danger" onClick={() => deleteSkill(index)}>
                      Delete
                    </button>
                  </div>
                </div>

                <button
                  className={`tsd-status ${skill.status || "pending"}`}
                  onClick={() => cycleStatus(index)}
                >
                  {skill.status || "pending"}
                </button>

                <div className="tsd-progress">
                  <div className="tsd-progress-label">
                    <span>Completion</span>
                    <strong>{skill.progress || 0}%</strong>
                  </div>
                  <div className="tsd-progress-track">
                    <div
                      className="tsd-progress-fill"
                      style={{ width: `${skill.progress || 0}%` }}
                    />
                  </div>
                </div>

                <div className="tsd-chapter-list">
                  {skill.chapters?.length ? (
                    skill.chapters.map((chapter, chapterIndex) => {
                      const chName = typeof chapter === "object" ? chapter.name : chapter;
                      const done   = typeof chapter === "object" ? chapter.completed : false;
                      return (
                        <span
                          key={`${skill.name}-${chapterIndex}`}
                          className={`tsd-chapter-chip ${done ? "tsd-chapter-done" : ""}`}
                          onClick={() => toggleChapter(index, chapterIndex)}
                          title={done ? "Mark as incomplete" : "Mark as completed"}
                          style={{ cursor: "pointer" }}
                        >
                          {done ? <i className="fas fa-check-circle" style={{ color: "#16a34a", marginRight: 4 }}></i>
                                : <i className="far fa-circle" style={{ color: "#94a3b8", marginRight: 4 }}></i>}
                          {chName}
                        </span>
                      );
                    })
                  ) : (
                    <span className="empty-pill">No chapters yet</span>
                  )}
                </div>

                <div className="tsd-chapter-add">
                  <input
                    placeholder="Add chapter..."
                    value={chapterInputs[index] || ""}
                    onChange={(e) =>
                      setChapterInputs((prev) => ({
                        ...prev,
                        [index]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addChapter(index);
                      }
                    }}
                  />
                  <button onClick={() => addChapter(index)}>Add</button>
                </div>
              </article>
            ))
            )}
          </section>
        </>
      )}

      {activeTab === "chapters" && (
        <section className="tsd-stack">
          {filteredSkills.map((skill, index) => (
            <article className="tsd-row-card" key={`${skill.name}-chapters-${index}`}>
              <div>
                <h3>{skill.name}</h3>
                <p>{skill.chapters?.length || 0} chapters added</p>
              </div>
              <div className="tsd-chapter-list">
                {skill.chapters?.length ? (
                  skill.chapters.map((chapter, chapterIndex) => (
                    <span key={`${skill.name}-row-${chapterIndex}`}>
                      {typeof chapter === "object" ? chapter.name : chapter}
                    </span>
                  ))
                ) : (
                  <span className="empty-pill">No chapters yet</span>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      {activeTab === "overview" && (
        <section className="tsd-overview-grid">
          <article className="tsd-overview-card">
            <h3>Subject Snapshot</h3>
            <div className="tsd-overview-points">
              <div><span>Subject</span><strong>{toTitleCase(name)}</strong></div>
              <div><span>Teacher View</span><strong>{location.state?.grade || theme.grade}</strong></div>
              <div><span>Average Progress</span><strong>{averageProgress}%</strong></div>
            </div>
          </article>
          <article className="tsd-overview-card">
            <h3>Skill Status Mix</h3>
            <div className="tsd-overview-points">
              <div><span>Active</span><strong>{skills.filter((s) => s.status === "active").length}</strong></div>
              <div><span>In Progress</span><strong>{skills.filter((s) => s.status === "inprogress").length}</strong></div>
              <div><span>Pending</span><strong>{skills.filter((s) => s.status === "pending").length}</strong></div>
            </div>
          </article>
        </section>
      )}

      {/* ── Edit Skill Modal ── */}
      {editModal && (
        <div className="tsd-modal-backdrop" onClick={(e) => e.target === e.currentTarget && setEditModal(null)}>
          <div className="tsd-modal">
            <div className="tsd-modal-head">
              <div><h3>Edit Skill</h3><p>{toTitleCase(name)}</p></div>
              <button className="tsd-modal-close" onClick={() => setEditModal(null)}>×</button>
            </div>
            <form className="tsd-modal-body" onSubmit={handleEditSubmit}>
              <div className="tsd-modal-field">
                <label>Skill Name *</label>
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => { setEditName(e.target.value); setEditError(""); }}
                  placeholder="Skill name"
                />
              </div>
              {editError && <p className="tsd-modal-error">{editError}</p>}
              <div className="tsd-modal-actions">
                <button type="button" className="tsd-modal-cancel" onClick={() => setEditModal(null)}>Cancel</button>
                <button type="submit" className="tsd-modal-submit">
                  <i className="fas fa-check"></i> Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Skill Modal ── */}
      {showModal && (
        <div className="tsd-modal-backdrop" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="tsd-modal">
            <div className="tsd-modal-head">
              <div>
                <h3>Add Skill</h3>
                <p>{toTitleCase(name)}</p>
              </div>
              <button className="tsd-modal-close" onClick={closeModal}>×</button>
            </div>
            <form className="tsd-modal-body" onSubmit={handleModalSubmit}>
              <div className="tsd-modal-field">
                <label>Skill Name *</label>
                <input
                  autoFocus
                  placeholder="e.g. Grammar, Tables, Reading..."
                  value={modalSkill}
                  onChange={(e) => { setModalSkill(e.target.value); setModalError(""); }}
                />
              </div>
              <div className="tsd-modal-field">
                <label>Description (optional)</label>
                <input
                  placeholder="Brief description of this skill"
                  value={modalDesc}
                  onChange={(e) => setModalDesc(e.target.value)}
                />
              </div>
              {modalError && <p className="tsd-modal-error">{modalError}</p>}
              <div className="tsd-modal-actions">
                <button type="button" className="tsd-modal-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="tsd-modal-submit" disabled={saving}>
                  {saving ? "Adding…" : <><i className="fas fa-plus"></i> Add Skill</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="tsd-toast">
          <i className="fas fa-circle-check"></i> {toast}
        </div>
      )}
    </div>
  );
}
