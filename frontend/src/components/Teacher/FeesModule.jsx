import { useEffect, useState, useCallback } from "react";
import Toast from "../Toast";
import "./FeesModule.css";

const API = import.meta.env.VITE_API_URL;
const TODAY = new Date().toISOString().split("T")[0];

// ── Progress bar ──────────────────────────────────────────────────────────────
const ProgressBar = ({ paid, total }) => {
  const pct = total > 0 ? Math.min(Math.round((paid / total) * 100), 100) : 0;
  const color = pct === 100 ? "#16a34a" : pct > 0 ? "#f59e0b" : "#ef4444";
  return (
    <div className="fm-progress-track">
      <div className="fm-progress-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
};

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => (
  <span className={`fm-badge fm-badge-${status || "pending"}`}>
    {status === "paid" ? "✔ Paid" : status === "partial" ? "⏳ Partial" : "● Pending"}
  </span>
);

// ── Record Payment modal ──────────────────────────────────────────────────────
const PaymentModal = ({ student, fee, onClose, onSaved }) => {
  const remaining = fee?.remaining || 0;
  const [amount, setAmount] = useState("");
  const [saving, setSaving]  = useState(false);
  const [error, setError]    = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = Number(amount);
    if (!val || val <= 0)          { setError("Enter a valid amount"); return; }
    if (val > remaining)           { setError(`Amount cannot exceed remaining ₹${remaining}`); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API}/student/fees/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.studentId, amount: val }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed");
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fm-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fm-modal">
        <div className="fm-modal-header">
          <div className="fm-modal-icon"><i className="fas fa-indian-rupee-sign"></i></div>
          <div>
            <h3 className="fm-modal-title">Record Payment</h3>
            <p className="fm-modal-sub">{student.name} · Remaining: ₹{remaining}</p>
          </div>
          <button className="fm-modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="fm-modal-body">
          <div className="fm-field">
            <label>Payment Amount (₹) *</label>
            <div className="fm-input-wrap">
              <span className="fm-input-prefix">₹</span>
              <input
                type="number" min="1" max={remaining}
                placeholder={`Max ₹${remaining}`}
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(""); }}
                autoFocus
              />
            </div>
          </div>
          {/* quick-fill buttons */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[remaining, Math.round(remaining / 2), 400, 200].filter((v, i, a) => v > 0 && a.indexOf(v) === i).slice(0, 3).map((v) => (
              <button key={v} type="button"
                style={{ padding: "5px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: "0.78rem", cursor: "pointer" }}
                onClick={() => setAmount(String(v))}>
                ₹{v}
              </button>
            ))}
          </div>
          {error && <p className="fm-error">{error}</p>}
          <div className="fm-modal-actions">
            <button type="button" className="fm-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="fm-btn-primary" disabled={saving}>
              {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving…</> : <><i className="fas fa-check"></i> Record Payment</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Installment modal ─────────────────────────────────────────────────────────
const InstallmentModal = ({ student, fee, onClose, onSaved }) => {
  const currentTotal = fee?.totalFees || 0;
  const [totalAmount, setTotalAmount]       = useState(String(currentTotal || ""));
  const [inst2Amount, setInst2Amount]       = useState("");
  const [inst2Date, setInst2Date]           = useState("");
  const [saving, setSaving]                 = useState(false);
  const [error, setError]                   = useState("");

  const inst1Amount = Math.max((Number(totalAmount) || 0) - (Number(inst2Amount) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const total = Number(totalAmount);
    const inst2 = Number(inst2Amount) || 0;
    if (!total || total <= 0)          { setError("Enter a valid total amount"); return; }
    if (inst2 < 0 || inst2 > total)    { setError("2nd installment cannot exceed total"); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API}/student/fees/installment/${student.studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalAmount: total, installment2Amount: inst2, installment2Date: inst2Date }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed");
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fm-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fm-modal">
        <div className="fm-modal-header">
          <div className="fm-modal-icon" style={{ background: "linear-gradient(135deg,#0ea5e9,#38bdf8)" }}>
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div>
            <h3 className="fm-modal-title">Set Installment Plan</h3>
            <p className="fm-modal-sub">{student.name} · {student.studentId}</p>
          </div>
          <button className="fm-modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="fm-modal-body">
          <div className="fm-field">
            <label>Total Fees (₹) *</label>
            <div className="fm-input-wrap">
              <span className="fm-input-prefix">₹</span>
              <input
                type="number" min="1"
                placeholder="e.g. 800"
                value={totalAmount}
                onChange={(e) => { setTotalAmount(e.target.value); setError(""); }}
                autoFocus
              />
            </div>
          </div>
          <div className="fm-field">
            <label>2nd Installment Amount (₹)</label>
            <div className="fm-input-wrap">
              <span className="fm-input-prefix">₹</span>
              <input
                type="number" min="0" max={totalAmount || undefined}
                placeholder="e.g. 400"
                value={inst2Amount}
                onChange={(e) => { setInst2Amount(e.target.value); setError(""); }}
              />
            </div>
          </div>
          {inst2Amount && Number(inst2Amount) > 0 && (
            <div className="fm-field">
              <label>2nd Installment Due Date</label>
              <input
                type="date"
                value={inst2Date}
                onChange={(e) => setInst2Date(e.target.value)}
                style={{ padding: "10px 13px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: "0.9rem", outline: "none" }}
              />
            </div>
          )}
          {Number(totalAmount) > 0 && (
            <div style={{ background: "#f0f9ff", borderRadius: 10, padding: "12px 14px", fontSize: "0.82rem", color: "#0369a1", display: "flex", flexDirection: "column", gap: 4 }}>
              <span><strong>1st Installment:</strong> ₹{inst1Amount}</span>
              {Number(inst2Amount) > 0 && <span><strong>2nd Installment:</strong> ₹{inst2Amount}{inst2Date ? ` · Due ${inst2Date}` : ""}</span>}
            </div>
          )}
          {error && <p className="fm-error">{error}</p>}
          <div className="fm-modal-actions">
            <button type="button" className="fm-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="fm-btn-primary" disabled={saving}>
              {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving…</> : <><i className="fas fa-check"></i> Save Plan</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
const ReminderConfirm = ({ student, onClose, onConfirm, sending }) => (
  <div className="fm-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className="fm-modal fm-modal-sm">
      <div className="fm-modal-header">
        <div className="fm-modal-icon fm-icon-orange"><i className="fas fa-bell"></i></div>
        <div>
          <h3 className="fm-modal-title">Send Reminder?</h3>
          <p className="fm-modal-sub">This will notify the parent</p>
        </div>
        <button className="fm-modal-close" onClick={onClose}>×</button>
      </div>
      <div className="fm-modal-body">
        <p className="fm-confirm-text">
          Send a payment reminder to <strong>{student.name}</strong>'s parent?
        </p>
        <div className="fm-modal-actions">
          <button className="fm-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="fm-btn-orange" onClick={onConfirm} disabled={sending}>
            {sending ? <><i className="fas fa-spinner fa-spin"></i> Sending…</> : <><i className="fas fa-paper-plane"></i> Yes, Send</>}
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const FeesModule = () => {
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [installmentTarget, setInstallmentTarget] = useState(null);
  const [reminderTarget, setReminderTarget] = useState(null);
  const [setInstTarget, setSetInstTarget] = useState(null);
  const [markingAllPaid, setMarkingAllPaid] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchFees = useCallback(async () => {
    try {
      const res = await fetch(`${API}/student/fees`);
      const data = await res.json();
      setFees(data.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/student/students`);
        const data = await res.json();
        setStudents(data.students || []);
      } finally { setLoading(false); }
    };
    load();
    fetchFees();
  }, [fetchFees]);

  const getFee = (studentId) => fees.find((f) => f.studentId === studentId);

  const handleInstallmentSaved = () => {
    setInstallmentTarget(null);
    fetchFees();
    setToast({ message: "Payment recorded successfully.", type: "success" });
  };

  const handleInstPlanSaved = () => {
    setSetInstTarget(null);
    fetchFees();
    setToast({ message: "Installment plan saved successfully.", type: "success" });
  };

  const handleMarkAllPaid = async () => {
    if (!window.confirm("Mark ALL students as fully paid? This will set paid = total fees and remaining = ₹0 for every student.")) return;
    setMarkingAllPaid(true);
    try {
      const res = await fetch(`${API}/student/fees/mark-all-paid`, { method: "PUT" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed");
      fetchFees();
      setToast({ message: `All students marked as paid (${data.updated} records updated).`, type: "success" });
    } catch (err) {
      setToast({ message: err.message || "Failed to mark all paid.", type: "error" });
    } finally {
      setMarkingAllPaid(false);
    }
  };

  const handleSendReminder = async () => {
    if (!reminderTarget) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/student/send-reminder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: reminderTarget.studentId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed");
      setToast({ message: "Reminder sent successfully.", type: "success" });
    } catch (err) {
      setToast({ message: err.message || "Failed to send reminder.", type: "error" });
    } finally {
      setSending(false);
      setReminderTarget(null);
    }
  };

  return (
    <div className="fm-wrapper">
      {/* header */}
      <div className="fm-header">
        <div>
          <h2 className="fm-title">Fees Management</h2>
          <p className="fm-subtitle">Track payments, set installments, and send reminders.</p>
        </div>
        <div className="fm-header-right">
          <div className="fm-header-stats">
            <div className="fm-stat">
              <span>{students.length}</span>
              <label>Students</label>
            </div>
            <div className="fm-stat">
              <span>{fees.filter(f => f.status === "paid").length}</span>
              <label>Paid</label>
            </div>
            <div className="fm-stat fm-stat-warn">
              <span>{fees.filter(f => f.status !== "paid").length}</span>
              <label>Pending</label>
            </div>
          </div>
          <button
            className="fm-btn-mark-all-paid"
            onClick={handleMarkAllPaid}
            disabled={markingAllPaid}
            title="Mark all students as fully paid (End of Year)"
          >
            {markingAllPaid
              ? <><i className="fas fa-spinner fa-spin"></i> Updating…</>
              : <><i className="fas fa-check-double"></i> Mark All as Paid (End Year)</>}
          </button>
        </div>
      </div>

      {/* grid */}
      {loading ? (
        <div className="fm-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="fm-skeleton" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="fm-empty">
          <i className="fas fa-wallet"></i>
          <p>No students found. Add students to manage fees.</p>
        </div>
      ) : (
        <div className="fm-grid">
          {students.map((s) => {
            const fee = getFee(s.studentId);
            const paid = fee?.paid || 0;
            const total = fee?.totalFees || 0;
            const remaining = fee?.remaining || 0;
            const status = fee?.status || "pending";
            const hasPending = remaining > 0;

            return (
              <div className={`fm-card ${hasPending && status !== "paid" ? "fm-card-pending" : ""}`} key={s._id}>
                {/* card top */}
                <div className="fm-card-top">
                  <div className="fm-avatar">{s.name?.charAt(0)?.toUpperCase()}</div>
                  <div className="fm-card-info">
                    <h4>{s.name}</h4>
                    <span>{s.studentId} · Class {s.class}</span>
                  </div>
                  <StatusBadge status={status} />
                </div>

                {/* amounts */}
                <div className="fm-amounts">
                  <div className="fm-amount-row">
                    <span><i className="fas fa-indian-rupee-sign"></i> Total</span>
                    <strong>₹{total}</strong>
                  </div>
                  <div className="fm-amount-row">
                    <span><i className="fas fa-circle-check" style={{ color: "#16a34a" }}></i> Paid</span>
                    <strong style={{ color: "#16a34a" }}>₹{paid}</strong>
                  </div>
                  <div className="fm-amount-row">
                    <span><i className="fas fa-clock" style={{ color: "#f59e0b" }}></i> Remaining</span>
                    <strong style={{ color: remaining > 0 ? "#ef4444" : "#16a34a" }}>₹{remaining}</strong>
                  </div>
                </div>

                {/* progress */}
                <div className="fm-progress-section">
                  <div className="fm-progress-label">
                    <span>Payment progress</span>
                    <span>{total > 0 ? Math.round((paid / total) * 100) : 0}%</span>
                  </div>
                  <ProgressBar paid={paid} total={total} />
                </div>

                {/* installments */}
                {fee?.installments?.length > 0 && (
                  <div className="fm-installments">
                    {fee.installments.slice(-2).map((inst, i) => (
                      <span key={i} className="fm-inst-chip">
                        <i className="fas fa-calendar-day"></i> {inst.date}
                        {inst.amount ? ` · ₹${inst.amount}` : ""}
                      </span>
                    ))}
                  </div>
                )}

                {/* actions */}
                <div className="fm-card-actions">
                  {hasPending && (
                    <button className="fm-btn-install" onClick={() => setInstallmentTarget(s)}>
                      <i className="fas fa-indian-rupee-sign"></i> Record Payment
                    </button>
                  )}
                  <button className="fm-btn-set-inst" onClick={() => setSetInstTarget(s)}>
                    <i className="fas fa-calendar-alt"></i> Set Installment
                  </button>
                  {hasPending && (
                    <button className="fm-btn-remind" onClick={() => setReminderTarget(s)}>
                      <i className="fas fa-bell"></i> Remind
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* modals */}
      {installmentTarget && (
        <PaymentModal
          student={installmentTarget}
          fee={getFee(installmentTarget.studentId)}
          onClose={() => setInstallmentTarget(null)}
          onSaved={handleInstallmentSaved}
        />
      )}

      {setInstTarget && (
        <InstallmentModal
          student={setInstTarget}
          fee={getFee(setInstTarget.studentId)}
          onClose={() => setSetInstTarget(null)}
          onSaved={handleInstPlanSaved}
        />
      )}

      {reminderTarget && (
        <ReminderConfirm
          student={reminderTarget}
          onClose={() => setReminderTarget(null)}
          onConfirm={handleSendReminder}
          sending={sending}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default FeesModule;
