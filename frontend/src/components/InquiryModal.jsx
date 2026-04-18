import { useState } from "react";

const INQUIRY_TYPES = ["Admission", "Course Details", "Fees", "General Query"];

const empty = { name: "", email: "", phone: "", type: "", message: "" };

const InquiryModal = ({ onClose }) => {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (!form.phone.trim()) e.phone = "Phone is required";
    else if (!/^\d{10}$/.test(form.phone.replace(/\s+/g, ""))) e.phone = "Enter a valid 10-digit number";
    if (!form.type) e.type = "Please select an inquiry type";
    if (!form.message.trim()) e.message = "Message is required";
    return e;
  };

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Submission failed");
      setSuccess(true);
      setForm(empty);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        {/* header */}
        <div style={styles.header}>
          <div>
            <h3 style={styles.title}>Make an Inquiry</h3>
            <p style={styles.subtitle}>We'll get back to you within 24 hours</p>
          </div>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close">×</button>
        </div>

        {success ? (
          <div style={styles.successBox}>
            <div style={styles.successIcon}>✓</div>
            <h4 style={{ margin: "0 0 8px", color: "#16a34a" }}>Inquiry Submitted!</h4>
            <p style={{ margin: "0 0 20px", color: "#475569", fontSize: "0.9rem" }}>
              Thank you! We've received your inquiry and will contact you soon.
            </p>
            <button onClick={onClose} style={styles.btnPrimary}>Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate style={styles.form}>
            <div style={styles.row}>
              <Field label="Full Name" error={errors.name}>
                <input name="name" value={form.name} onChange={handleChange}
                  placeholder="e.g. Rahul Sharma" style={fieldStyle(errors.name)} />
              </Field>
              <Field label="Email Address" error={errors.email}>
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="e.g. rahul@email.com" style={fieldStyle(errors.email)} />
              </Field>
            </div>

            <div style={styles.row}>
              <Field label="Phone Number" error={errors.phone}>
                <input name="phone" value={form.phone} onChange={handleChange}
                  placeholder="10-digit number" maxLength={10} style={fieldStyle(errors.phone)} />
              </Field>
              <Field label="Inquiry Type" error={errors.type}>
                <select name="type" value={form.type} onChange={handleChange}
                  style={{ ...fieldStyle(errors.type), cursor: "pointer" }}>
                  <option value="">Select type</option>
                  {INQUIRY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Message" error={errors.message}>
              <textarea name="message" value={form.message} onChange={handleChange}
                placeholder="Tell us what you'd like to know..."
                rows={4} style={{ ...fieldStyle(errors.message), resize: "vertical" }} />
            </Field>

            {errors.submit && (
              <p style={{ color: "#dc2626", fontSize: "0.85rem", margin: "0 0 8px" }}>{errors.submit}</p>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <button type="button" onClick={onClose} style={styles.btnSecondary}>Cancel</button>
              <button type="submit" disabled={loading} style={{ ...styles.btnPrimary, flex: 2, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Submitting..." : "Submit Inquiry"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, error, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: 1 }}>
    <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>{label}</label>
    {children}
    {error && <span style={{ fontSize: "0.75rem", color: "#dc2626" }}>{error}</span>}
  </div>
);

const fieldStyle = (hasError) => ({
  width: "100%", padding: "10px 13px", borderRadius: "9px", fontSize: "0.9rem",
  border: `1.5px solid ${hasError ? "#dc2626" : "#e2e8f0"}`,
  background: "#f8fafc", outline: "none", boxSizing: "border-box",
  fontFamily: "inherit",
});

const styles = {
  backdrop: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000, padding: "16px",
  },
  modal: {
    background: "#fff", borderRadius: "18px", width: "100%", maxWidth: "560px",
    boxShadow: "0 24px 60px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    padding: "24px 24px 0",
  },
  title: { margin: 0, fontSize: "1.2rem", color: "#1e1b4b" },
  subtitle: { margin: "4px 0 0", fontSize: "0.82rem", color: "#94a3b8" },
  closeBtn: {
    background: "none", border: "none", fontSize: "1.5rem",
    cursor: "pointer", color: "#94a3b8", lineHeight: 1, padding: "0 0 0 8px",
  },
  form: { padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: "14px" },
  row: { display: "flex", gap: "12px", flexWrap: "wrap" },
  btnPrimary: {
    flex: 1, padding: "11px 20px", borderRadius: "10px", border: "none",
    background: "linear-gradient(135deg,#6c63ff,#8f7cff)", color: "#fff",
    fontWeight: 600, fontSize: "0.95rem", cursor: "pointer",
  },
  btnSecondary: {
    flex: 1, padding: "11px 20px", borderRadius: "10px",
    border: "1.5px solid #e2e8f0", background: "#f8fafc",
    color: "#475569", fontWeight: 500, fontSize: "0.95rem", cursor: "pointer",
  },
  successBox: {
    padding: "32px 24px", textAlign: "center",
    display: "flex", flexDirection: "column", alignItems: "center",
  },
  successIcon: {
    width: "56px", height: "56px", borderRadius: "50%",
    background: "#dcfce7", color: "#16a34a", fontSize: "1.6rem",
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: "16px", fontWeight: 700,
  },
};

export default InquiryModal;
