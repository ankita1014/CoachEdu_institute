import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./TeacherHomework.css";

const SUBJECT_OPTIONS = ["English", "Hindi", "Marathi", "Mathematics"];
const CLASS_OPTIONS = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5"];

const initialForm = {
  title: "", subject: "English", className: "Class 1",
  description: "", dueDate: "", file: null,
};

const StatusBadge = ({ status }) => {
  const map = {
    pending:   { label: "Pending",   cls: "th-badge-pending" },
    submitted: { label: "Submitted", cls: "th-badge-submitted" },
    completed: { label: "Completed", cls: "th-badge-completed" },
  };
  const { label, cls } = map[status] || map.pending;
  return <span className={`th-badge ${cls}`}>{label}</span>;
};

// ── Review modal ──────────────────────────────────────────────────────────────
const ReviewModal = ({ homework, submission, onClose, onSave }) => {
  const [marks, setMarks]       = useState(submission.marks || 0);
  const [feedback, setFeedback] = useState(submission.feedback || "");
  const [saving, setSaving]     = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(homework._id, submission._id, {
      status: "completed",
      marks: Number(marks),
      feedback,
    });
    setSaving(false);
    onClose();
  };

  const isImage = (url) => /\.(png|jpe?g|gif|webp)$/i.test(url || "");
  const isPdf   = (url) => /\.pdf$/i.test(url || "");

  return (
    <div className="th-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="th-modal">
        <div className="th-modal-head">
          <div>
            <h3>Review Submission</h3>
            <p>{submission.studentName || submission.studentId} · {homework.title}</p>
          </div>
          <button className="th-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="th-modal-body">
          {/* file preview */}
          {submission.fileUrl ? (
            <div className="th-file-preview">
              {isImage(submission.fileUrl) ? (
                <img src={submission.fileUrl} alt="submission" />
              ) : isPdf(submission.fileUrl) ? (
                <iframe src={submission.fileUrl} title="submission" />
              ) : (
                <a href={submission.fileUrl} target="_blank" rel="noreferrer" className="th-download-link">
                  <i className="fas fa-file-arrow-down"></i> Download Submission
                </a>
              )}
            </div>
          ) : (
            <div className="th-no-file">No file uploaded by student.</div>
          )}

          <div className="th-review-meta">
            <span><i className="fas fa-clock"></i> Submitted: {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString("en-IN") : "—"}</span>
          </div>

          <div className="th-review-fields">
            <div className="th-field">
              <label>Marks (out of {homework.totalMarks || 100})</label>
              <input
                type="number" min="0" max={homework.totalMarks || 100}
                value={marks} onChange={(e) => setMarks(e.target.value)}
              />
            </div>
            <div className="th-field">
              <label>Feedback</label>
              <textarea
                rows={3} placeholder="Write feedback for the student..."
                value={feedback} onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="th-modal-footer">
          <button className="th-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="th-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : <><i className="fas fa-circle-check"></i> Mark as Reviewed</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Submissions panel (tabbed) ────────────────────────────────────────────────
const SubmissionsPanel = ({ homework, onUpdateSubmission }) => {
  const [tab, setTab]           = useState("submitted");
  const [reviewing, setReviewing] = useState(null); // submission object

  const pending   = (homework.submissions || []).filter((s) => s.status === "pending");
  const submitted = (homework.submissions || []).filter((s) => s.status === "submitted");
  const completed = (homework.submissions || []).filter((s) => s.status === "completed");

  const rows = tab === "pending" ? pending : tab === "submitted" ? submitted : completed;

  return (
    <div className="th-sub-panel">
      {/* tab bar */}
      <div className="th-sub-tabs">
        {[
          { key: "pending",   label: `Pending (${pending.length})` },
          { key: "submitted", label: `Submitted (${submitted.length})` },
          { key: "completed", label: `Reviewed (${completed.length})` },
        ].map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? "active" : ""}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="th-sub-empty">
          {tab === "pending"   && "All students have submitted."}
          {tab === "submitted" && "No new submissions yet."}
          {tab === "completed" && "No reviewed submissions yet."}
        </div>
      ) : (
        <table className="th-sub-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Status</th>
              {tab !== "pending" && <th>Submission</th>}
              {tab === "completed" && <><th>Marks</th><th>Feedback</th></>}
              {tab === "submitted" && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((sub) => (
              <tr key={sub._id}>
                <td>{sub.studentName || sub.studentId}</td>
                <td><StatusBadge status={sub.status} /></td>

                {tab !== "pending" && (
                  <td>
                    {sub.fileUrl
                      ? <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="th-view-link">
                          <i className="fas fa-eye"></i> View
                        </a>
                      : <span className="th-muted">No file</span>}
                  </td>
                )}

                {tab === "completed" && (
                  <>
                    <td><strong>{sub.marks ?? "—"}</strong></td>
                    <td className="th-muted">{sub.feedback || "—"}</td>
                  </>
                )}

                {tab === "submitted" && (
                  <td>
                    <button
                      className="th-btn-review"
                      onClick={() => setReviewing(sub)}
                    >
                      <i className="fas fa-pen-to-square"></i> Review
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {reviewing && (
        <ReviewModal
          homework={homework}
          submission={reviewing}
          onClose={() => setReviewing(null)}
          onSave={onUpdateSubmission}
        />
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const TeacherHomework = () => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [formData, setFormData]           = useState(initialForm);
  const [homeworkList, setHomeworkList]   = useState([]);
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [classFilter, setClassFilter]     = useState("All");
  const [expandedId, setExpandedId]       = useState(null);
  const [editingId, setEditingId]         = useState(null);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [error, setError]                 = useState("");
  const [success, setSuccess]             = useState("");

  const teacherId   = user?.teacherId || user?._id || user?.id || "";
  const teacherName = user?.name || "Teacher";
  const apiBase     = `${import.meta.env.VITE_API_URL}/teacher/homework`;

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const loadHomework = async () => {
    try {
      setError("");
      const params = new URLSearchParams();
      if (teacherId) params.set("teacherId", teacherId);
      if (subjectFilter !== "All") params.set("subject", subjectFilter);
      if (classFilter !== "All") params.set("className", classFilter);
      const res = await fetch(`${apiBase}?${params.toString()}`);
      if (!res.ok) throw new Error("Could not connect to homework service");
      const data = await res.json();
      setHomeworkList(data?.data || []);
    } catch (err) {
      setError("Failed to fetch homework. Please refresh.");
    }
  };

  useEffect(() => { loadHomework(); }, [teacherId, subjectFilter, classFilter]);

  const stats = useMemo(() => {
    const total     = homeworkList.length;
    const submitted = homeworkList.reduce((n, hw) =>
      n + (hw.submissions?.filter((s) => s.status === "submitted").length || 0), 0);
    const completed = homeworkList.reduce((n, hw) =>
      n + (hw.submissions?.filter((s) => s.status === "completed").length || 0), 0);
    const pending   = homeworkList.reduce((n, hw) =>
      n + (hw.submissions?.filter((s) => s.status === "pending").length || 0), 0);
    return { total, submitted, completed, pending };
  }, [homeworkList]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!teacherId) { setError("Teacher session not found."); return; }
    if (!formData.title || !formData.description || !formData.dueDate) {
      setError("Please fill title, description, and due date."); return;
    }
    setIsSubmitting(true);
    try {
      const payload = new FormData();
      ["title","subject","className","description","dueDate"].forEach((k) => payload.append(k, formData[k]));
      payload.append("teacherId", teacherId);
      payload.append("teacherName", teacherName);
      if (formData.file) payload.append("file", formData.file);

      const res = await fetch(editingId ? `${apiBase}/${editingId}` : apiBase, {
        method: editingId ? "PUT" : "POST",
        body: payload,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Request failed");
      resetForm();
      setSuccess(editingId ? "Homework updated." : "Homework created.");
      await loadHomework();
    } catch (err) {
      setError(err.message || "Failed to save homework.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (hw) => {
    setEditingId(hw._id);
    setFormData({
      title: hw.title, subject: hw.subject, className: hw.className,
      description: hw.description, dueDate: hw.dueDate?.slice(0, 10) || "", file: null,
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this homework?")) return;
    try {
      const res = await fetch(`${apiBase}/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      if (editingId === id) resetForm();
      setSuccess("Homework deleted.");
      await loadHomework();
    } catch (err) {
      setError(err.message || "Delete failed.");
    }
  };

  const updateSubmission = async (homeworkId, submissionId, updates) => {
    try {
      const res = await fetch(`${apiBase}/${homeworkId}/submissions/${submissionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      await loadHomework();
    } catch (err) {
      setError(err.message || "Failed to save review.");
    }
  };

  return (
    <div className="teacher-homework-page">
      {/* hero */}
      <section className="th-hero">
        <div>
          <p className="th-eyebrow">Assignment Center</p>
          <h2>Homework Manager</h2>
          <p className="th-subtitle">Create assignments, track submissions, and review student work.</p>
        </div>
        <div className="th-stats">
          {[
            { label: "Total", value: stats.total },
            { label: "Pending", value: stats.pending },
            { label: "Submitted", value: stats.submitted },
            { label: "Reviewed", value: stats.completed },
          ].map((s) => (
            <div className="th-stat-card" key={s.label}>
              <span>{s.label}</span>
              <strong>{s.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="th-layout">
        {/* create / edit form */}
        <form className="th-form-card" onSubmit={handleSubmit}>
          <div className="th-section-head">
            <h3>{editingId ? "Edit Homework" : "Create Homework"}</h3>
          </div>

          {error   && <div className="th-message error">{error}</div>}
          {success && <div className="th-message success">{success}</div>}

          <div className="th-form-grid">
            <label><span>Title</span>
              <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. Grammar worksheet" />
            </label>
            <label><span>Subject</span>
              <select name="subject" value={formData.subject} onChange={handleInputChange}>
                {SUBJECT_OPTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label><span>Class</span>
              <select name="className" value={formData.className} onChange={handleInputChange}>
                {CLASS_OPTIONS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label><span>Due Date</span>
              <input type="date" name="dueDate" value={formData.dueDate} onChange={handleInputChange} />
            </label>
            <label className="th-file-field"><span>Attachment (optional)</span>
              <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={(e) => setFormData((p) => ({ ...p, file: e.target.files?.[0] || null }))} />
              <small>{formData.file ? formData.file.name : editingId ? "Leave empty to keep current" : "PDF or image"}</small>
            </label>
          </div>

          <label className="th-description-field"><span>Description</span>
            <textarea name="description" value={formData.description} onChange={handleInputChange}
              rows={4} placeholder="Instructions for students..." />
          </label>

          <div className="th-form-actions">
            <button className="th-submit-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (editingId ? "Saving…" : "Creating…") : (editingId ? "Save Changes" : "Create Homework")}
            </button>
            {editingId && <button className="th-secondary-btn" type="button" onClick={resetForm}>Cancel</button>}
          </div>
        </form>

        {/* homework list */}
        <div className="th-list-card">
          <div className="th-section-head">
            <h3>Assignments</h3>
          </div>

          {/* filters */}
          <div className="th-filters">
            <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
              <option>All</option>
              {SUBJECT_OPTIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
              <option>All</option>
              {CLASS_OPTIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="th-homework-list">
            {homeworkList.length === 0 ? (
              <div className="th-empty-state">
                <h4>No homework yet</h4>
                <p>Create the first assignment and it will appear here.</p>
              </div>
            ) : homeworkList.map((hw) => {
              const submittedCount = hw.submissions?.filter((s) => s.status !== "pending").length || 0;
              const total          = hw.submissions?.length || 0;
              const isExpanded     = expandedId === hw._id;

              return (
                <article className="th-homework-item" key={hw._id}>
                  <div className="th-homework-top">
                    <div className="th-hw-info">
                      <h4>{hw.title}</h4>
                      <div className="th-pill-row">
                        <span>{hw.subject}</span>
                        <span>{hw.className}</span>
                        <span>Due {new Date(hw.dueDate).toLocaleDateString("en-IN")}</span>
                        <StatusBadge status={hw.status} />
                      </div>
                      <p className="th-hw-desc">{hw.description}</p>
                    </div>
                    <div className="th-homework-actions">
                      <button type="button" onClick={() => startEdit(hw)}>
                        <i className="fas fa-pen"></i> Edit
                      </button>
                      <button type="button" className="danger" onClick={() => handleDelete(hw._id)}>
                        <i className="fas fa-trash"></i> Delete
                      </button>
                    </div>
                  </div>

                  {/* submission summary bar */}
                  <div className="th-hw-summary">
                    <span><i className="fas fa-users"></i> {submittedCount}/{total} submitted</span>
                    {hw.attachmentUrl && (
                      <a href={hw.attachmentUrl} target="_blank" rel="noreferrer" className="th-view-link">
                        <i className="fas fa-paperclip"></i> Attachment
                      </a>
                    )}
                    <button
                      className="th-expand-btn"
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : hw._id)}
                    >
                      {isExpanded ? "Hide" : "Review Submissions"}
                      <i className={`fas fa-chevron-${isExpanded ? "up" : "down"}`}></i>
                    </button>
                  </div>

                  {isExpanded && (
                    <SubmissionsPanel
                      homework={hw}
                      onUpdateSubmission={updateSubmission}
                    />
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default TeacherHomework;
