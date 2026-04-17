import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./TeacherTests.css";

const SUBJECT_OPTIONS = ["English", "Hindi", "Marathi", "Mathematics"];
const CLASS_OPTIONS   = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5"];

const blankQuestion = () => ({
  _key: Date.now() + Math.random(),
  type: "mcq",
  question: "",
  options: ["", "", "", ""],
  correctAnswer: "",
  marks: 1,
});

const blankDetails = {
  title: "", subject: "English", className: "Class 1",
  duration: 30, dueDate: "", status: "active",
};

// ── small helpers ─────────────────────────────────────────────────────────────
const StatusPill = ({ status }) => {
  const map = { active: "#dcfce7:#16a34a", inactive: "#fee2e2:#dc2626", evaluated: "#ede9fe:#7c3aed", submitted: "#dbeafe:#2563eb", pending: "#fef9c3:#ca8a04" };
  const [bg, color] = (map[status] || "#f1f5f9:#64748b").split(":");
  return <span style={{ background: bg, color, padding: "2px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700 }}>{status}</span>;
};

// ── Question form (left panel) ────────────────────────────────────────────────
const QuestionForm = ({ q, idx, onChange, onRemove, total }) => {
  const set = (field, val) => onChange(idx, field, val);
  const setOpt = (oi, val) => {
    const opts = [...q.options];
    opts[oi] = val;
    // if correct answer was this option text, clear it
    onChange(idx, "options", opts);
    if (q.correctAnswer === q.options[oi]) onChange(idx, "correctAnswer", "");
  };

  return (
    <div className="tt-qform">
      <div className="tt-qform-head">
        <span className="tt-qnum">Q{idx + 1}</span>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <select value={q.type} onChange={(e) => set("type", e.target.value)} className="tt-mini-select">
            <option value="mcq">MCQ</option>
            <option value="descriptive">Descriptive</option>
          </select>
          <input type="number" min="1" value={q.marks} onChange={(e) => set("marks", e.target.value)}
            className="tt-marks-input" title="Marks" placeholder="Marks" />
          {total > 1 && (
            <button type="button" className="tt-remove-btn" onClick={() => onRemove(idx)} title="Remove question">
              <i className="fas fa-trash"></i>
            </button>
          )}
        </div>
      </div>

      <textarea
        className="tt-q-textarea"
        rows={3}
        placeholder="Enter question text…"
        value={q.question}
        onChange={(e) => set("question", e.target.value)}
      />

      {q.type === "mcq" && (
        <div className="tt-options-list">
          <p className="tt-options-label">Options — select correct answer with radio button</p>
          {q.options.map((opt, oi) => (
            <div key={oi} className="tt-option-row">
              <input
                type="radio"
                name={`correct-${idx}`}
                checked={q.correctAnswer === opt && opt !== ""}
                onChange={() => opt && set("correctAnswer", opt)}
                title="Mark as correct"
              />
              <input
                type="text"
                className={`tt-opt-input ${q.correctAnswer === opt && opt ? "tt-opt-correct" : ""}`}
                placeholder={`Option ${oi + 1}`}
                value={opt}
                onChange={(e) => setOpt(oi, e.target.value)}
              />
            </div>
          ))}
          {!q.correctAnswer && <p className="tt-hint">Select the correct option using the radio button.</p>}
        </div>
      )}
    </div>
  );
};

// ── Question preview card (right panel) ───────────────────────────────────────
const QuestionCard = ({ q, idx, onEdit, onDelete, onDuplicate }) => (
  <div className="tt-qcard">
    <div className="tt-qcard-head">
      <span className="tt-qnum">Q{idx + 1}</span>
      <span className="tt-qtype">{q.type === "mcq" ? "MCQ" : "Descriptive"}</span>
      <span className="tt-qmarks">{q.marks} {q.marks === 1 ? "mark" : "marks"}</span>
      <div className="tt-qcard-actions">
        <button type="button" onClick={() => onDuplicate(idx)} title="Duplicate"><i className="fas fa-copy"></i></button>
        <button type="button" onClick={() => onEdit(idx)} title="Edit"><i className="fas fa-pen"></i></button>
        <button type="button" className="danger" onClick={() => onDelete(idx)} title="Delete"><i className="fas fa-trash"></i></button>
      </div>
    </div>
    <p className="tt-qcard-text">{q.question || <em style={{ color: "#94a3b8" }}>No question text yet</em>}</p>
    {q.type === "mcq" && q.options.some(Boolean) && (
      <ul className="tt-qcard-opts">
        {q.options.map((opt, oi) => opt ? (
          <li key={oi} className={q.correctAnswer === opt ? "correct" : ""}>
            {q.correctAnswer === opt && <i className="fas fa-circle-check"></i>} {opt}
          </li>
        ) : null)}
      </ul>
    )}
  </div>
);

// ── Results panel for a test ──────────────────────────────────────────────────
const ResultsPanel = ({ test, onUpdateSubmission }) => {
  const [reviewTarget, setReviewTarget] = useState(null);
  const [score, setScore]     = useState(0);
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving]   = useState(false);

  const submitted  = test.submissions?.filter((s) => s.status === "submitted")  || [];
  const evaluated  = test.submissions?.filter((s) => s.status === "evaluated")  || [];
  const pending    = test.submissions?.filter((s) => s.status === "pending")    || [];

  const openReview = (sub) => { setReviewTarget(sub); setScore(sub.score || 0); setFeedback(sub.feedback || ""); };

  const saveReview = async () => {
    setSaving(true);
    await onUpdateSubmission(test._id, reviewTarget._id, { status: "evaluated", score: Number(score), feedback });
    setSaving(false);
    setReviewTarget(null);
  };

  return (
    <div className="tt-results">
      <div className="tt-results-summary">
        <span>Pending: <strong>{pending.length}</strong></span>
        <span>Submitted: <strong>{submitted.length}</strong></span>
        <span>Evaluated: <strong>{evaluated.length}</strong></span>
      </div>

      {test.submissions?.length ? (
        <table className="tt-results-table">
          <thead>
            <tr><th>Student</th><th>Status</th><th>Score</th><th>Action</th></tr>
          </thead>
          <tbody>
            {test.submissions.map((sub) => (
              <tr key={sub._id}>
                <td>{sub.studentName || sub.studentId}</td>
                <td><StatusPill status={sub.status} /></td>
                <td>{sub.status === "evaluated" ? <strong>{sub.score}</strong> : "—"}</td>
                <td>
                  {sub.status === "submitted" && (
                    <button className="tt-btn-review" onClick={() => openReview(sub)}>
                      <i className="fas fa-pen-to-square"></i> Evaluate
                    </button>
                  )}
                  {sub.status === "evaluated" && (
                    <button className="tt-btn-ghost-sm" onClick={() => openReview(sub)}>Edit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="tt-empty-sm">No students mapped yet.</p>
      )}

      {reviewTarget && (
        <div className="tt-modal-backdrop" onClick={(e) => e.target === e.currentTarget && setReviewTarget(null)}>
          <div className="tt-modal">
            <div className="tt-modal-head">
              <div>
                <h3>Evaluate Submission</h3>
                <p>{reviewTarget.studentName || reviewTarget.studentId} · {test.title}</p>
              </div>
              <button className="tt-modal-close" onClick={() => setReviewTarget(null)}>×</button>
            </div>
            <div className="tt-modal-body">
              <div className="tt-field">
                <label>Score (out of {test.totalMarks})</label>
                <input type="number" min="0" max={test.totalMarks} value={score} onChange={(e) => setScore(e.target.value)} />
              </div>
              <div className="tt-field">
                <label>Feedback</label>
                <textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Optional feedback…" />
              </div>
            </div>
            <div className="tt-modal-footer">
              <button className="tt-btn-ghost" onClick={() => setReviewTarget(null)}>Cancel</button>
              <button className="tt-btn-primary" onClick={saveReview} disabled={saving}>
                {saving ? "Saving…" : <><i className="fas fa-circle-check"></i> Save Evaluation</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const TeacherTests = () => {
  const { user } = useAuth();

  // test details
  const [details, setDetails]     = useState(blankDetails);
  // questions array
  const [questions, setQuestions] = useState([blankQuestion()]);
  // which question index is being edited in the left panel (null = hidden)
  const [editingQIdx, setEditingQIdx] = useState(null);

  const [tests, setTests]             = useState([]);
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [classFilter, setClassFilter]     = useState("All");
  const [expandedTestId, setExpandedTestId] = useState(null);
  const [editingTestId, setEditingTestId]   = useState(null);
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [error, setError]   = useState("");
  const [success, setSuccess] = useState("");

  const teacherId   = user?.teacherId || user?._id || user?.id || "";
  const teacherName = user?.name || "Teacher";
  const apiBase     = "http://localhost:5000/api/teacher/tests";

  const resetBuilder = () => {
    setDetails(blankDetails);
    setQuestions([]);
    setEditingQIdx(null);
    setEditingTestId(null);
    setError(""); setSuccess("");
  };

  const loadTests = async () => {
    try {
      const params = new URLSearchParams();
      if (teacherId) params.set("teacherId", teacherId);
      if (subjectFilter !== "All") params.set("subject", subjectFilter);
      if (classFilter !== "All") params.set("className", classFilter);
      const res = await fetch(`${apiBase}?${params.toString()}`);
      const data = await res.json();
      setTests(data?.data || []);
    } catch { /* silent */ }
  };

  useEffect(() => { loadTests(); }, [teacherId, subjectFilter, classFilter]);

  const stats = useMemo(() => ({
    total: tests.length,
    active: tests.filter((t) => t.status === "active").length,
    submissions: tests.reduce((n, t) => n + (t.submissions?.filter((s) => s.status !== "pending").length || 0), 0),
  }), [tests]);

  // auto-calc total marks from questions
  const totalMarks = useMemo(() => questions.reduce((s, q) => s + Number(q.marks || 0), 0), [questions]);

  // ── question CRUD ──
  const addQuestion = () => {
    const nq = blankQuestion();
    setQuestions((p) => [...p, nq]);
    setEditingQIdx(questions.length); // open form for the new question
  };

  const updateQuestion = (idx, field, val) => {
    setQuestions((p) => p.map((q, i) => i === idx ? { ...q, [field]: val } : q));
  };

  const removeQuestion = (idx) => {
    if (questions.length === 1) {
      setQuestions([]);
      setEditingQIdx(null);
      return;
    }
    setQuestions((p) => p.filter((_, i) => i !== idx));
    setEditingQIdx(null); // close form after delete
  };

  const duplicateQuestion = (idx) => {
    const copy = { ...questions[idx], _key: Date.now() + Math.random() };
    const next = [...questions];
    next.splice(idx + 1, 0, copy);
    setQuestions(next);
    setEditingQIdx(idx + 1); // open the duplicate for editing
  };

  // save the current question being edited and close the form
  const saveQuestion = () => {
    setEditingQIdx(null);
  };

  // ── validate ──
  const validate = () => {
    if (!details.title.trim()) return "Test title is required.";
    if (!details.dueDate) return "Due date is required.";
    if (questions.length === 0) return "Add at least one question.";
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) return `Q${i + 1}: Question text is required.`;
      if (!q.marks || Number(q.marks) < 1) return `Q${i + 1}: Marks must be at least 1.`;
      if (q.type === "mcq") {
        if (q.options.some((o) => !o.trim())) return `Q${i + 1}: All 4 options are required.`;
        if (!q.correctAnswer) return `Q${i + 1}: Select the correct answer.`;
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    const err = validate();
    if (err) { setError(err); return; }
    setIsSubmitting(true);
    try {
      const payload = {
        ...details,
        totalMarks,
        teacherId,
        teacherName,
        questions: questions.map((q) => ({
          type: q.type,
          question: q.question.trim(),
          options: q.type === "mcq" ? q.options.map((o) => o.trim()) : [],
          correctAnswer: q.type === "mcq" ? q.correctAnswer.trim() : "",
          marks: Number(q.marks),
        })),
      };
      const res = await fetch(editingTestId ? `${apiBase}/${editingTestId}` : apiBase, {
        method: editingTestId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed");
      setSuccess(editingTestId ? "Test updated." : "Test created.");
      resetBuilder();
      await loadTests();
    } catch (err) {
      setError(err.message || "Failed to save test.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (test) => {
    setEditingTestId(test._id);
    setDetails({
      title: test.title, subject: test.subject, className: test.className,
      duration: test.duration, dueDate: test.dueDate?.slice(0, 10) || "",
      status: test.status || "active",
    });
    setQuestions(test.questions?.length
      ? test.questions.map((q) => ({
          _key: Date.now() + Math.random(),
          type: q.type || "mcq",
          question: q.question || "",
          options: q.type === "mcq" ? [...(q.options || []), "", "", "", ""].slice(0, 4) : ["", "", "", ""],
          correctAnswer: q.correctAnswer || "",
          marks: q.marks || 1,
        }))
      : [blankQuestion()]);
    setEditingQIdx(null); // don't auto-open form; let teacher click a card
    setError(""); setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this test?")) return;
    try {
      const res = await fetch(`${apiBase}/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      if (editingTestId === id) resetBuilder();
      setSuccess("Test deleted.");
      await loadTests();
    } catch (err) {
      setError(err.message || "Delete failed.");
    }
  };

  const updateSubmission = async (testId, subId, updates) => {
    try {
      const res = await fetch(`${apiBase}/${testId}/submissions/${subId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      await loadTests();
    } catch (err) {
      setError(err.message || "Failed to save evaluation.");
    }
  };

  const activeQ = editingQIdx !== null ? questions[editingQIdx] : null;

  return (
    <div className="teacher-tests-page">
      {/* hero */}
      <section className="tt-hero">
        <div>
          <p className="tt-eyebrow">Assessment Studio</p>
          <h2>Question Builder</h2>
          <p className="tt-subtitle">Build structured tests with MCQ and descriptive questions.</p>
        </div>
        <div className="tt-stats">
          {[{ label: "Total Tests", value: stats.total }, { label: "Active", value: stats.active }, { label: "Submissions", value: stats.submissions }].map((s) => (
            <div className="tt-stat-card" key={s.label}><span>{s.label}</span><strong>{s.value}</strong></div>
          ))}
        </div>
      </section>

      {/* ── BUILDER (split screen) ── */}
      <section className="tt-builder">

        {/* LEFT: test details + active question form */}
        <div className="tt-builder-left">
          <form onSubmit={handleSubmit}>
            {/* test details */}
            <div className="tt-panel">
              <div className="tt-panel-head">
                <h3>{editingTestId ? "Edit Test" : "Test Details"}</h3>
              </div>

              {error   && <div className="tt-message error">{error}</div>}
              {success && <div className="tt-message success">{success}</div>}

              <div className="tt-details-grid">
                <label><span>Title</span>
                  <input type="text" value={details.title} onChange={(e) => setDetails((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Weekly English Test" />
                </label>
                <label><span>Subject</span>
                  <select value={details.subject} onChange={(e) => setDetails((p) => ({ ...p, subject: e.target.value }))}>
                    {SUBJECT_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </label>
                <label><span>Class</span>
                  <select value={details.className} onChange={(e) => setDetails((p) => ({ ...p, className: e.target.value }))}>
                    {CLASS_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label><span>Duration (min)</span>
                  <input type="number" min="1" value={details.duration} onChange={(e) => setDetails((p) => ({ ...p, duration: e.target.value }))} />
                </label>
                <label><span>Due Date</span>
                  <input type="date" value={details.dueDate} onChange={(e) => setDetails((p) => ({ ...p, dueDate: e.target.value }))} />
                </label>
                <label><span>Status</span>
                  <select value={details.status} onChange={(e) => setDetails((p) => ({ ...p, status: e.target.value }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </div>
            </div>

            {/* question form — only shown when adding/editing */}
            {activeQ && (
              <div className="tt-panel tt-panel-question">
                <div className="tt-panel-head">
                  <h3>
                    {editingQIdx === questions.length - 1 && !questions[editingQIdx]?.question
                      ? "Add Question"
                      : "Edit Question"}
                  </h3>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="tt-panel-sub">Q{editingQIdx + 1} of {questions.length}</span>
                    <button type="button" className="tt-done-btn" onClick={saveQuestion}>
                      <i className="fas fa-check"></i> Done
                    </button>
                  </div>
                </div>
                <QuestionForm
                  q={activeQ}
                  idx={editingQIdx}
                  onChange={updateQuestion}
                  onRemove={removeQuestion}
                  total={questions.length}
                />
              </div>
            )}

            {/* sticky footer */}
            <div className="tt-builder-footer">
              <button type="button" className="tt-add-q-btn" onClick={addQuestion}>
                <i className="fas fa-plus"></i> Add Question
              </button>
              <button type="submit" className="tt-submit-btn" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : editingTestId ? "Save Changes" : "Create Test"}
              </button>
              {editingTestId && (
                <button type="button" className="tt-secondary-btn" onClick={resetBuilder}>Cancel</button>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT: question preview list */}
        <div className="tt-builder-right">
          {/* summary bar */}
          <div className="tt-preview-summary">
            <span><i className="fas fa-list-ol"></i> {questions.length} Questions</span>
            <span><i className="fas fa-star"></i> {totalMarks} Total Marks</span>
            <span><i className="fas fa-clock"></i> {details.duration} min</span>
          </div>

          {questions.length === 0 ? (
            <div className="tt-preview-empty">
              <i className="fas fa-circle-question"></i>
              <p>No questions added yet.</p>
              <button type="button" className="tt-add-q-btn" style={{ margin: "12px auto 0", maxWidth: 200 }} onClick={addQuestion}>
                <i className="fas fa-plus"></i> Add Question
              </button>
            </div>
          ) : (
            <div className="tt-qcard-list">
              {questions.map((q, idx) => (
                <div
                  key={q._key}
                  className={editingQIdx === idx ? "tt-qcard-wrap active" : "tt-qcard-wrap"}
                  onClick={() => setEditingQIdx(idx)}
                >
                  <QuestionCard
                    q={q} idx={idx}
                    onEdit={(i) => setEditingQIdx(i)}
                    onDelete={removeQuestion}
                    onDuplicate={duplicateQuestion}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── TESTS LIST ── */}
      <section className="tt-list-section">
        <div className="tt-section-head">
          <h3>Created Tests</h3>
          <div className="tt-filters">
            <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
              <option>All</option>
              {SUBJECT_OPTIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
              <option>All</option>
              {CLASS_OPTIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {tests.length === 0 ? (
          <div className="tt-empty-state"><h4>No tests yet</h4><p>Create your first test above.</p></div>
        ) : (
          <div className="tt-test-list">
            {tests.map((test) => {
              const submitted = test.submissions?.filter((s) => s.status !== "pending").length || 0;
              const total     = test.submissions?.length || 0;
              const expanded  = expandedTestId === test._id;
              return (
                <article className="tt-test-item" key={test._id}>
                  <div className="tt-test-top">
                    <div className="tt-test-info">
                      <h4>{test.title}</h4>
                      <div className="tt-pill-row">
                        <span>{test.subject}</span>
                        <span>{test.className}</span>
                        <span>{test.totalMarks} marks</span>
                        <span>{test.duration} min</span>
                        <span>{new Date(test.dueDate).toLocaleDateString("en-IN")}</span>
                        <StatusPill status={test.status} />
                      </div>
                    </div>
                    <div className="tt-test-actions">
                      <button type="button" onClick={() => startEdit(test)}><i className="fas fa-pen"></i> Edit</button>
                      <button type="button" className="danger" onClick={() => handleDelete(test._id)}><i className="fas fa-trash"></i> Delete</button>
                    </div>
                  </div>

                  <div className="tt-metrics">
                    <span><i className="fas fa-circle-question"></i> {test.questions?.length || 0} questions</span>
                    <span><i className="fas fa-users"></i> {submitted}/{total} attempted</span>
                  </div>

                  <button className="tt-expand-btn" type="button" onClick={() => setExpandedTestId(expanded ? null : test._id)}>
                    {expanded ? "Hide Results" : "View Results"} <i className={`fas fa-chevron-${expanded ? "up" : "down"}`}></i>
                  </button>

                  {expanded && <ResultsPanel test={test} onUpdateSubmission={updateSubmission} />}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default TeacherTests;
