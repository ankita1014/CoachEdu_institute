import { useEffect, useState, useCallback } from "react";

const API = import.meta.env.VITE_API_URL;
const TABS = ["Overview", "Attendance", "Homework", "Tests", "Fees"];

// ── tiny helpers ─────────────────────────────────────────────────────────────
const fmt = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d) ? v : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const Badge = ({ status }) => {
  const map = {
    present: "#dcfce7:#16a34a", absent: "#fee2e2:#dc2626",
    pending: "#fef9c3:#ca8a04", submitted: "#dbeafe:#2563eb",
    evaluated: "#ede9fe:#7c3aed", paid: "#dcfce7:#16a34a",
    partial: "#fef9c3:#ca8a04", active: "#dcfce7:#16a34a",
  };
  const [bg, color] = (map[status] || "#f1f5f9:#64748b").split(":");
  return (
    <span style={{ background: bg, color, padding: "2px 10px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600, textTransform: "capitalize" }}>
      {status || "—"}
    </span>
  );
};

const Empty = ({ msg }) => (
  <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
    <div style={{ fontSize: "2rem", marginBottom: 8 }}>📭</div>
    <p style={{ margin: 0, fontSize: "0.9rem" }}>{msg}</p>
  </div>
);

const Spinner = () => (
  <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
    <i className="fas fa-spinner fa-spin" style={{ fontSize: "1.4rem" }}></i>
  </div>
);

// ── sub-tabs ─────────────────────────────────────────────────────────────────

const OverviewTab = ({ student, onUpdated, onDeleted }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: student.name, class: student.class, parentPhone: student.parentPhone || "" });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/student/students/${student._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { onUpdated({ ...student, ...form }); setEditing(false); }
    } finally { setSaving(false); }
  };

  const doDelete = async () => {
    const res = await fetch(`${API}/student/students/${student._id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) onDeleted(student._id);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* info card */}
      <div style={card}>
        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[["Name", "name"], ["Class", "class"], ["Parent Phone", "parentPhone"]].map(([label, key]) => (
              <div key={key}>
                <label style={lbl}>{label}</label>
                <input value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} style={inp} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button onClick={save} disabled={saving} style={btnPrimary}>{saving ? "Saving…" : "Save Changes"}</button>
              <button onClick={() => setEditing(false)} style={btnGhost}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div style={infoGrid}>
              {[["Name", student.name], ["Student ID", student.studentId], ["Class", student.class], ["Parent Phone", student.parentPhone || "—"], ["Enrolled", fmt(student.createdAt)]].map(([k, v]) => (
                <div key={k}>
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8", display: "block" }}>{k}</span>
                  <strong style={{ fontSize: "0.95rem", color: "#1e293b" }}>{v}</strong>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setEditing(true)} style={btnPrimary}><i className="fas fa-pen" style={{ marginRight: 6 }}></i>Edit</button>
              <button onClick={() => setConfirmDelete(true)} style={btnDanger}><i className="fas fa-trash" style={{ marginRight: 6 }}></i>Delete</button>
            </div>
          </>
        )}
      </div>

      {/* confirm delete */}
      {confirmDelete && (
        <div style={{ ...card, background: "#fff5f5", border: "1.5px solid #fecaca" }}>
          <p style={{ margin: "0 0 12px", color: "#dc2626", fontWeight: 600 }}>Delete {student.name}?</p>
          <p style={{ margin: "0 0 16px", fontSize: "0.85rem", color: "#64748b" }}>This action cannot be undone.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={doDelete} style={btnDanger}>Yes, Delete</button>
            <button onClick={() => setConfirmDelete(false)} style={btnGhost}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

const AttendanceTab = ({ student }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: "", status: "present" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/student/attendance/${student.studentId}`);
      const data = await res.json();
      setRecords(data.data || []);
    } finally { setLoading(false); }
  }, [student.studentId]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.date) return;
    setSaving(true);
    try {
      await fetch(`${API}/teacher/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.studentId, date: form.date, status: form.status }),
      });
      setForm({ date: "", status: "present" });
      load();
    } finally { setSaving(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <form onSubmit={submit} style={{ ...card, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={lbl}>Date</label>
          <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={inp} required />
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <label style={lbl}>Status</label>
          <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={inp}>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
        </div>
        <button type="submit" disabled={saving} style={{ ...btnPrimary, height: 40 }}>{saving ? "Saving…" : "Add"}</button>
      </form>

      {loading ? <Spinner /> : records.length === 0 ? <Empty msg="No attendance records yet." /> : (
        <div style={card}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid #f1f5f9" }}>
                {["Date", "Status"].map(h => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={td}>{r.date}</td>
                  <td style={td}><Badge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const HomeworkTab = ({ student }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/student/homework/${student.studentId}`)
      .then(r => r.json())
      .then(d => setItems(d.data || []))
      .finally(() => setLoading(false));
  }, [student.studentId]);

  if (loading) return <Spinner />;
  if (!items.length) return <Empty msg="No homework assigned for this student's class." />;

  return (
    <div style={card}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
        <thead>
          <tr style={{ borderBottom: "1.5px solid #f1f5f9" }}>
            {["Title", "Subject", "Due Date", "Status"].map(h => <th key={h} style={th}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {items.map((hw) => (
            <tr key={hw._id} style={{ borderBottom: "1px solid #f8fafc" }}>
              <td style={td}>{hw.title}</td>
              <td style={td}>{hw.subject}</td>
              <td style={td}>{fmt(hw.dueDate)}</td>
              <td style={td}><Badge status={hw.studentSubmission?.status || "pending"} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TestsTab = ({ student }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // { testId, subId, score, feedback }
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/student/tests/${student.studentId}`);
      const data = await res.json();
      setItems(data.data || []);
    } finally { setLoading(false); }
  }, [student.studentId]);

  useEffect(() => { load(); }, [load]);

  const saveMarks = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await fetch(`${API}/teacher/tests/${editing.testId}/submissions/${editing.subId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "evaluated", score: Number(editing.score), feedback: editing.feedback }),
      });
      setEditing(null);
      load();
    } finally { setSaving(false); }
  };

  if (loading) return <Spinner />;
  if (!items.length) return <Empty msg="No tests available for this student's class." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {editing && (
        <div style={{ ...card, background: "#f8faff", border: "1.5px solid #c7d2fe" }}>
          <p style={{ margin: "0 0 12px", fontWeight: 600, color: "#1e1b4b" }}>Update Marks</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 100 }}>
              <label style={lbl}>Score</label>
              <input type="number" value={editing.score} onChange={e => setEditing(p => ({ ...p, score: e.target.value }))} style={inp} />
            </div>
            <div style={{ flex: 2, minWidth: 160 }}>
              <label style={lbl}>Feedback</label>
              <input value={editing.feedback} onChange={e => setEditing(p => ({ ...p, feedback: e.target.value }))} style={inp} placeholder="Optional feedback" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button onClick={saveMarks} disabled={saving} style={btnPrimary}>{saving ? "Saving…" : "Save Marks"}</button>
            <button onClick={() => setEditing(null)} style={btnGhost}>Cancel</button>
          </div>
        </div>
      )}

      <div style={card}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
          <thead>
            <tr style={{ borderBottom: "1.5px solid #f1f5f9" }}>
              {["Test", "Subject", "Total", "Score", "Status", ""].map(h => <th key={h} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {items.map((t) => {
              const sub = t.studentSubmission;
              return (
                <tr key={t._id} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={td}>{t.title}</td>
                  <td style={td}>{t.subject}</td>
                  <td style={td}>{t.totalMarks}</td>
                  <td style={td}>{sub?.score ?? "—"}</td>
                  <td style={td}><Badge status={sub?.status || "pending"} /></td>
                  <td style={td}>
                    <button
                      onClick={() => setEditing({ testId: t._id, subId: sub?.id || sub?._id, score: sub?.score || 0, feedback: sub?.feedback || "" })}
                      style={{ ...btnGhost, padding: "4px 10px", fontSize: "0.78rem" }}
                    >
                      {sub?.status === "evaluated" ? "Edit" : "Add Marks"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const FeesTab = ({ student }) => {
  const [fee, setFee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payForm, setPayForm] = useState({ amount: "", note: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/student/fees`);
      const data = await res.json();
      const record = (data.data || []).find(f => f.studentId === student.studentId);
      setFee(record || null);
    } finally { setLoading(false); }
  }, [student.studentId]);

  useEffect(() => { load(); }, [load]);

  const addPayment = async (e) => {
    e.preventDefault();
    const amount = Number(payForm.amount);
    if (!amount || amount <= 0) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/student/fees/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.studentId, amount }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed");
      setPayForm({ amount: "", note: "" });
      load();
    } finally { setSaving(false); }
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[["Total Fees", `₹${fee?.totalFees || 0}`, "#ede9fe", "#6c63ff"],
          ["Paid", `₹${fee?.paid || 0}`, "#dcfce7", "#16a34a"],
          ["Remaining", `₹${fee?.remaining || 0}`, "#fee2e2", "#dc2626"]].map(([label, val, bg, color]) => (
          <div key={label} style={{ background: bg, borderRadius: 12, padding: "14px 16px" }}>
            <span style={{ fontSize: "0.75rem", color, fontWeight: 600, display: "block" }}>{label}</span>
            <strong style={{ fontSize: "1.2rem", color }}>{val}</strong>
          </div>
        ))}
      </div>

      {/* status */}
      {fee && (
        <div style={{ ...card, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Payment Status:</span>
          <Badge status={fee.status} />
        </div>
      )}

      {/* add payment */}
      <form onSubmit={addPayment} style={{ ...card, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: 1, minWidth: 120 }}>
          <label style={lbl}>Payment Amount (₹)</label>
          <input type="number" value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))} style={inp} placeholder="e.g. 400" min="1" required />
        </div>
        <button type="submit" disabled={saving} style={{ ...btnPrimary, height: 40 }}>{saving ? "Saving…" : "Record Payment"}</button>
      </form>

      {/* installment timeline */}
      {fee?.installments?.length > 0 && (
        <div style={card}>
          <p style={{ margin: "0 0 12px", fontWeight: 600, fontSize: "0.88rem", color: "#475569" }}>Payment Timeline</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid #f1f5f9" }}>
                {["Date", "Amount"].map(h => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {fee.installments.map((inst, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={td}>{inst.date || "—"}</td>
                  <td style={td}>{inst.amount ? `₹${inst.amount}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!fee && <Empty msg="No fee record found for this student." />}
    </div>
  );
};

// ── main modal ────────────────────────────────────────────────────────────────
const StudentProfileModal = ({ student: initialStudent, onClose, onDeleted, onUpdated }) => {
  const [activeTab, setActiveTab] = useState("Overview");
  const [student, setStudent] = useState(initialStudent);

  const handleUpdated = (updated) => {
    setStudent(updated);
    onUpdated?.(updated);
  };

  const handleDeleted = (id) => {
    onDeleted?.(id);
    onClose();
  };

  // trap scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div style={backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modalBox}>
        {/* header */}
        <div style={modalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={avatar}>{student.name?.charAt(0)?.toUpperCase()}</div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#1e1b4b" }}>
                Student Profile — <span style={{ color: "#6c63ff" }}>{student.name}</span>
              </h3>
              <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{student.studentId} · Class {student.class}</span>
            </div>
          </div>
          <button onClick={onClose} style={closeBtn} aria-label="Close">×</button>
        </div>

        {/* tabs */}
        <div style={tabBar}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...tabBtn,
                color: activeTab === tab ? "#6c63ff" : "#64748b",
                borderBottom: activeTab === tab ? "2.5px solid #6c63ff" : "2.5px solid transparent",
                fontWeight: activeTab === tab ? 700 : 400,
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* body */}
        <div style={modalBody}>
          {activeTab === "Overview"   && <OverviewTab   student={student} onUpdated={handleUpdated} onDeleted={handleDeleted} />}
          {activeTab === "Attendance" && <AttendanceTab student={student} />}
          {activeTab === "Homework"   && <HomeworkTab   student={student} />}
          {activeTab === "Tests"      && <TestsTab      student={student} />}
          {activeTab === "Fees"       && <FeesTab       student={student} />}
        </div>
      </div>
    </div>
  );
};

// ── shared styles ─────────────────────────────────────────────────────────────
const backdrop = {
  position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 1000, padding: 16,
};
const modalBox = {
  background: "#fff", borderRadius: 20, width: "100%", maxWidth: 760,
  maxHeight: "90vh", display: "flex", flexDirection: "column",
  boxShadow: "0 32px 80px rgba(0,0,0,0.2)", overflow: "hidden",
};
const modalHeader = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "20px 24px", borderBottom: "1px solid #f1f5f9", flexShrink: 0,
};
const tabBar = {
  display: "flex", gap: 0, padding: "0 24px",
  borderBottom: "1px solid #f1f5f9", flexShrink: 0, overflowX: "auto",
};
const tabBtn = {
  background: "none", border: "none", padding: "12px 16px",
  cursor: "pointer", fontSize: "0.88rem", whiteSpace: "nowrap",
  transition: "color 0.15s",
};
const modalBody = {
  padding: "20px 24px 24px", overflowY: "auto", flex: 1,
};
const avatar = {
  width: 44, height: 44, borderRadius: "50%",
  background: "linear-gradient(135deg,#6c63ff,#8f7cff)",
  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: "1.1rem", fontWeight: 700, flexShrink: 0,
};
const closeBtn = {
  background: "none", border: "none", fontSize: "1.6rem",
  cursor: "pointer", color: "#94a3b8", lineHeight: 1, padding: 0,
};
const card = {
  background: "#f8fafc", borderRadius: 12, padding: "16px 18px",
  border: "1px solid #f1f5f9",
};
const infoGrid = {
  display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16,
};
const lbl = { fontSize: "0.75rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 };
const inp = {
  width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #e2e8f0",
  background: "#fff", fontSize: "0.88rem", fontFamily: "inherit",
  outline: "none", boxSizing: "border-box",
};
const th = { textAlign: "left", padding: "8px 12px", color: "#64748b", fontWeight: 600, fontSize: "0.78rem" };
const td = { padding: "10px 12px", color: "#334155", verticalAlign: "middle" };
const btnPrimary = {
  padding: "9px 18px", borderRadius: 9, border: "none",
  background: "linear-gradient(135deg,#6c63ff,#8f7cff)", color: "#fff",
  fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
};
const btnGhost = {
  padding: "9px 18px", borderRadius: 9, border: "1.5px solid #e2e8f0",
  background: "#f8fafc", color: "#475569", fontWeight: 500, fontSize: "0.85rem", cursor: "pointer",
};
const btnDanger = {
  padding: "9px 18px", borderRadius: 9, border: "none",
  background: "#fee2e2", color: "#dc2626", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
};

export default StudentProfileModal;
