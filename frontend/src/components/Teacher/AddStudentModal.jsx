import { useState } from "react";

const CLASSES = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5"];

const AddStudentModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: "",
    studentId: "",
    class: "",
    parentPhone: "",
    parentName: "",
    totalFees: "800",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.studentId.trim() || !form.class) {
      setError("Name, Student ID, and Class are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/student/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          studentId: form.studentId.trim(),
          class: form.class,
          parentPhone: form.parentPhone.trim(),
          parentName: form.parentName.trim(),
          totalFees: Number(form.totalFees) || 800,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Failed to add student");
        return;
      }

      onSuccess(data.student, data.parent);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Backdrop
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "#fff", borderRadius: "18px", padding: "32px 28px",
        width: "100%", maxWidth: "460px", boxShadow: "0 24px 60px rgba(0,0,0,0.15)",
        position: "relative",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#1e1b4b" }}>Add New Student</h3>
          <button onClick={onClose} style={{
            background: "none", border: "none", fontSize: "1.4rem",
            cursor: "pointer", color: "#94a3b8", lineHeight: 1,
          }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Name */}
          <div>
            <label style={labelStyle}>Student Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Rahul Sharma"
              style={inputStyle}
            />
          </div>

          {/* Student ID */}
          <div>
            <label style={labelStyle}>Student ID *</label>
            <input
              name="studentId"
              value={form.studentId}
              onChange={handleChange}
              placeholder="e.g. stu014"
              style={inputStyle}
            />
          </div>

          {/* Class */}
          <div>
            <label style={labelStyle}>Class *</label>
            <select
              name="class"
              value={form.class}
              onChange={handleChange}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">Select class</option>
              {CLASSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Phone */}
          <div>
            <label style={labelStyle}>Parent Phone (optional)</label>
            <input
              name="parentPhone"
              value={form.parentPhone}
              onChange={handleChange}
              placeholder="e.g. 9876543210"
              style={inputStyle}
            />
          </div>

          {/* Parent Name */}
          <div>
            <label style={labelStyle}>Parent Name (optional)</label>
            <input
              name="parentName"
              value={form.parentName}
              onChange={handleChange}
              placeholder="e.g. Suresh Sharma"
              style={inputStyle}
            />
          </div>

          {/* Total Fees */}
          <div>
            <label style={labelStyle}>Total Fees (₹) *</label>
            <input
              name="totalFees"
              type="number"
              min="0"
              value={form.totalFees}
              onChange={handleChange}
              placeholder="e.g. 800"
              style={inputStyle}
            />
          </div>

          {/* Error */}
          {error && (
            <p style={{ color: "#dc2626", fontSize: "0.85rem", margin: 0 }}>{error}</p>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: "11px", borderRadius: "10px",
                border: "1.5px solid #e2e8f0", background: "#f8fafc",
                color: "#475569", cursor: "pointer", fontWeight: 500,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2, padding: "11px", borderRadius: "10px",
                border: "none", background: "linear-gradient(135deg, #6c63ff, #8f7cff)",
                color: "#fff", cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 600, opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Adding..." : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const labelStyle = {
  display: "block", fontSize: "0.82rem", fontWeight: 600,
  color: "#475569", marginBottom: "5px",
};

const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: "10px",
  border: "1.5px solid #e2e8f0", background: "#f8fafc",
  fontSize: "0.93rem", outline: "none", boxSizing: "border-box",
  transition: "border-color 0.2s",
};

export default AddStudentModal;
