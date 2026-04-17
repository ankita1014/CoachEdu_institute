import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./TeacherMaterials.css";

const SUBJECT_OPTIONS = ["English", "Hindi", "Marathi", "Mathematics"];
const CLASS_OPTIONS = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5"];

const initialForm = {
  title: "",
  subject: "English",
  className: "Class 1",
  description: "",
  file: null,
};

const TeacherMaterials = () => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState(initialForm);
  const [materials, setMaterials] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [classFilter, setClassFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const teacherId = user?.teacherId || user?._id || user?.id || "";
  const teacherName = user?.name || "Teacher";
  const apiBase = "http://localhost:5000/api/teacher/materials";

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const loadMaterials = async () => {
    try {
      setError("");
      const params = new URLSearchParams();

      if (teacherId) {
        params.set("teacherId", teacherId);
      }
      if (subjectFilter !== "All") {
        params.set("subject", subjectFilter);
      }
      if (classFilter !== "All") {
        params.set("className", classFilter);
      }

      const res = await fetch(`${apiBase}?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Could not connect to the materials service");
      }

      const data = await res.json();
      setMaterials(data?.data || []);
    } catch (fetchError) {
      console.error(fetchError);
      setError(
        "Failed to fetch materials. Restart backend once so the new materials routes are loaded."
      );
    }
  };

  useEffect(() => {
    loadMaterials();
  }, [subjectFilter, classFilter, teacherId]);

  const subjects = useMemo(() => {
    const values = new Set(["All", ...SUBJECT_OPTIONS]);
    materials.forEach((material) => material.subject && values.add(material.subject));
    return Array.from(values);
  }, [materials]);

  const classes = useMemo(() => {
    const values = new Set(["All", ...CLASS_OPTIONS]);
    materials.forEach((material) => material.className && values.add(material.className));
    return Array.from(values);
  }, [materials]);

  const stats = useMemo(() => {
    return {
      totalFiles: materials.length,
      totalSubjects: new Set(materials.map((item) => item.subject)).size,
      totalClasses: new Set(materials.map((item) => item.className)).size,
      recentUploads: materials.filter((item) => {
        const createdAt = new Date(item.createdAt);
        return Date.now() - createdAt.getTime() < 7 * 24 * 60 * 60 * 1000;
      }).length,
    };
  }, [materials]);

  const groupedMaterials = useMemo(() => {
    return SUBJECT_OPTIONS.reduce((acc, subject) => {
      acc[subject] = materials.filter((material) => material.subject === subject);
      return acc;
    }, {});
  }, [materials]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, file }));
  };

  const startEdit = (material) => {
    setError("");
    setSuccess("");
    setOpenMenuId(null);
    setEditingId(material._id);
    setFormData({
      title: material.title,
      subject: material.subject,
      className: material.className,
      description: material.description || "",
      file: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!teacherId) {
      setError("Teacher session not found. Please log in again.");
      return;
    }

    if (!formData.title || !formData.subject || !formData.className) {
      setError("Please complete title, subject, class, and description details.");
      return;
    }

    if (!formData.description.trim()) {
      setError("Please add a short description for the material.");
      return;
    }

    if (!editingId && !formData.file) {
      setError("Please choose a file to upload.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("subject", formData.subject);
      payload.append("className", formData.className);
      payload.append("description", formData.description);
      payload.append("teacherId", teacherId);
      payload.append("teacherName", teacherName);

      if (formData.file) {
        payload.append("file", formData.file);
      }

      const endpoint = editingId ? `${apiBase}/${editingId}` : apiBase;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        body: payload,
      });

      if (!res.ok) {
        let message = "Material request failed";
        try {
          const errorData = await res.json();
          message = errorData.message || message;
        } catch {
          message = `Server error (${res.status})`;
        }
        throw new Error(message);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Material request failed");
      }

      resetForm();
      setSuccess(editingId ? "Material updated successfully." : "Material uploaded successfully.");
      await loadMaterials();
    } catch (submitError) {
      console.error(submitError);
      setError(submitError.message || "Failed to save material.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setError("");
      setSuccess("");
      setOpenMenuId(null);
      const res = await fetch(`${apiBase}/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Delete failed");
      }

      await loadMaterials();
      if (editingId === id) {
        resetForm();
      }
      setSuccess("Material deleted successfully.");
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError.message || "Failed to delete material.");
    }
  };

  return (
    <div className="teacher-materials-page">
      <section className="tm-hero">
        <div>
          <p className="tm-eyebrow">Content Management</p>
          <h2>Materials Library</h2>
          <p className="tm-subtitle">
            Upload and organize notes, worksheets, PDFs, images, and reference
            files so students always have the right learning resources in one place.
          </p>
        </div>

        <div className="tm-stats">
          <div className="tm-stat-card">
            <span>Total Files</span>
            <strong>{stats.totalFiles}</strong>
          </div>
          <div className="tm-stat-card">
            <span>Subjects</span>
            <strong>{stats.totalSubjects}</strong>
          </div>
          <div className="tm-stat-card">
            <span>Classes</span>
            <strong>{stats.totalClasses}</strong>
          </div>
          <div className="tm-stat-card">
            <span>This Week</span>
            <strong>{stats.recentUploads}</strong>
          </div>
        </div>
      </section>

      <section className="tm-layout">
        <form className="tm-upload-card" onSubmit={handleSubmit}>
          <div className="tm-section-head">
            <h3>{editingId ? "Edit Material" : "Upload Material"}</h3>
            <p>
              {editingId
                ? "Update the selected material and save your changes."
                : "Create a new study resource for your students."}
            </p>
          </div>

          {error && <div className="tm-message error">{error}</div>}
          {success && <div className="tm-message success">{success}</div>}

          <div className="tm-form-grid">
            <label>
              <span>Title</span>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Chapter 1 Worksheet"
              />
            </label>

            <label>
              <span>Subject</span>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
              >
                {SUBJECT_OPTIONS.map((subject) => (
                  <option key={subject}>{subject}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Class</span>
              <select
                name="className"
                value={formData.className}
                onChange={handleInputChange}
              >
                {CLASS_OPTIONS.map((className) => (
                  <option key={className}>{className}</option>
                ))}
              </select>
            </label>

            <label className="tm-file-field">
              <span>{editingId ? "Replace File (Optional)" : "File"}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.ppt,.pptx,.txt"
                onChange={handleFileChange}
              />
              <small>
                {formData.file
                  ? formData.file.name
                  : editingId
                    ? "Leave empty to keep the current file"
                    : "PDF, notes, image or document"}
              </small>
            </label>
          </div>

          <label className="tm-description-field">
            <span>Description</span>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              placeholder="Explain what this material covers and how students should use it."
            />
          </label>

          <div className="tm-form-actions">
            <button className="tm-submit-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? editingId
                  ? "Saving..."
                  : "Uploading..."
                : editingId
                  ? "Save Changes"
                  : "Upload Material"}
            </button>

            {editingId && (
              <button
                className="tm-secondary-btn"
                type="button"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        <div className="tm-library-card">
          <div className="tm-section-head">
            <h3>Uploaded Materials</h3>
            <p>Filter resources and manage them subject wise with full CRUD actions.</p>
          </div>

          <div className="tm-filters">
            <label>
              <span>Subject</span>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
              >
                {subjects.map((subject) => (
                  <option key={subject}>{subject}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Class</span>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
              >
                {classes.map((className) => (
                  <option key={className}>{className}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="tm-subject-groups">
            {SUBJECT_OPTIONS
              .filter((subject) => subjectFilter === "All" || subject === subjectFilter)
              .map((subject) => (
                <section className="tm-subject-group" key={subject}>
                  <div className="tm-group-header">
                    <div>
                      <h4>{subject}</h4>
                      <p>{groupedMaterials[subject]?.length || 0} materials</p>
                    </div>
                  </div>

                  <div className="tm-material-list">
                    {groupedMaterials[subject]?.length ? (
                      groupedMaterials[subject].map((material) => (
                        <article className="tm-material-item" key={material._id}>
                          <div className="tm-material-meta">
                            <div className="tm-file-icon">
                              <i className="fas fa-file-alt"></i>
                            </div>

                            <div>
                              <h4>{material.title}</h4>
                              <div className="tm-pill-row">
                                <span>{material.className}</span>
                                <span>{new Date(material.createdAt).toLocaleDateString()}</span>
                                <span>{material.fileName}</span>
                              </div>
                              <p>{material.description || "No description added."}</p>
                            </div>
                          </div>

                          <div className="tm-material-actions">
                            <button
                              type="button"
                              className="tm-menu-trigger"
                              onClick={() =>
                                setOpenMenuId((prev) =>
                                  prev === material._id ? null : material._id
                                )
                              }
                            >
                              <i className="fas fa-ellipsis-v"></i>
                            </button>

                            {openMenuId === material._id && (
                              <div className="tm-action-menu">
                                <a
                                  href={material.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={() => setOpenMenuId(null)}
                                >
                                  View
                                </a>
                                <a
                                  href={material.fileUrl}
                                  download={material.fileName}
                                  onClick={() => setOpenMenuId(null)}
                                >
                                  Download
                                </a>
                                <button
                                  type="button"
                                  onClick={() => startEdit(material)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="danger"
                                  onClick={() => handleDelete(material._id)}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="tm-mobile-actions">
                            <a href={material.fileUrl} target="_blank" rel="noreferrer">
                              View
                            </a>
                            <a href={material.fileUrl} download={material.fileName}>
                              Download
                            </a>
                            <button type="button" onClick={() => startEdit(material)}>
                              Edit
                            </button>
                            <button type="button" onClick={() => handleDelete(material._id)}>
                              Delete
                            </button>
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="tm-empty-state small">
                        <h4>No {subject} materials yet</h4>
                        <p>Upload a file for this subject to start building the library.</p>
                      </div>
                    )}
                  </div>
                </section>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default TeacherMaterials;
