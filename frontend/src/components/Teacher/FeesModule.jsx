import { useEffect, useState, useCallback } from "react";
import Toast from "../Toast";
import "./FeesModule.css";

const API   = import.meta.env.VITE_API_URL;
const TODAY = new Date().toISOString().split("T")[0];

// ── helpers ───────────────────────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

// ── Progress bar ──────────────────────────────────────────────────────────────
const ProgressBar = ({ paid, total }) => {
  const pct   = total > 0 ? Math.min(Math.round((paid / total) * 100), 100) : 0;
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
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = Number(amount);
    if (!val || val <= 0)  { setError("Enter a valid amount"); return; }
    if (val > remaining)   { setError(`Amount cannot exceed remaining ₹${remaining}`); return; }
    setSaving(true);
    try {
      const res  = await fetch(`${API}/student/fees/payment`, {
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
            {[remaining, Math.round(remaining / 2), 400, 200]
              .filter((v, i, a) => v > 0 && a.indexOf(v) === i)
              .slice(0, 3)
              .map((v) => (
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

// ── Set Installment modal ─────────────────────────────────────────────────────
const InstallmentModal = ({ student, fee, onClose, onSaved }) => {
  const [totalAmount, setTotalAmount] = useState(String(fee?.totalFees || ""));
  const [inst2Amount, setInst2Amount] = useState(
    String(fee?.installmentPlan?.secondInstallmentAmount || "")
  );
  const [inst2Date, setInst2Date] = useState(
    fee?.installmentPlan?.secondInstallmentDueDate || ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const inst1Amount = Math.max((Number(totalAmount) || 0) - (Number(inst2Amount) || 0), 0);
  const hasInst2    = Number(inst2Amount) > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const total = Number(totalAmount);
    const inst2 = Number(inst2Amount) || 0;

    if (!total || total <= 0)       { setError("Enter a valid total amount"); return; }
    if (inst2 < 0 || inst2 > total) { setError("2nd installment cannot exceed total fees"); return; }
    if (inst2 > 0 && !inst2Date)    { setError("Please set a due date for the 2nd installment"); return; }
    if (inst2 > 0 && inst2Date < TODAY) {
      setError("Due date must be today or a future date"); return;
    }

    setSaving(true);
    try {
      const res  = await fetch(`${API}/student/fees/installment/${student.studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalAmount: total,
          installment2Amount: inst2,
          installment2Date: inst2Date,
        }),
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
          {/* Total fees */}
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

          {/* 2nd installment amount */}
          <div className="fm-field">
            <label>2nd Installment Amount (₹)</label>
            <div className="fm-input-wrap">
              <span className="fm-input-prefix">₹</span>
              <input
                type="number" min="0" max={totalAmount || undefined}
                placeholder="e.g. 400  (leave 0 for single payment)"
                value={inst2Amount}
                onChange={(e) => { setInst2Amount(e.target.value); setError(""); }}
              />
            </div>
          </div>

          {/* 2nd installment due date — required when amount > 0 */}
          {hasInst2 && (
            <div className="fm-field">
              <label>2nd Installment Due Date *</label>
              <input
                type="date"
                min={TODAY}
                value={inst2Date}
                onChange={(e) => { setInst2Date(e.target.value); setError(""); }}
                className="fm-date-input"
              />
            </div>
          )}

          {/* Live preview */}
          {Number(totalAmount) > 0 && (
            <div className="fm-inst-preview">
              <span><strong>1st Installment:</strong> ₹{inst1Amount}</span>
              {hasInst2 && (
                <span>
                  <strong>2nd Installment:</strong> ₹{inst2Amount}
                  {inst2Date ? ` · Due ${formatDate(inst2Date)}` : ""}
                </span>
              )}
            </div>
          )}

          {error && <p className="fm-error">{error}</p>}
          <div className="fm-modal-actions">
            <button type="button" className="fm-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="fm-btn-primary" disabled={saving}>
              {saving
                ? <><i className="fas fa-spinner fa-spin"></i> Saving…</>
                : <><i className="fas fa-check"></i> Save Plan</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Reminder confirm modal ────────────────────────────────────────────────────
const ReminderConfirm = ({ student, fee, onClose, onConfirm, sending }) => {
  const dueDate   = fee?.installmentPlan?.secondInstallmentDueDate;
  const remaining = fee?.remaining || 0;
  return (
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
          {remaining > 0 && (
            <div className="fm-reminder-preview">
              <i className="fas fa-indian-rupee-sign"></i> ₹{remaining} pending
              {dueDate && <> · <i className="fas fa-calendar-day"></i> Due {formatDate(dueDate)}</>}
            </div>
          )}
          <div className="fm-modal-actions">
            <button className="fm-btn-ghost" onClick={onClose}>Cancel</button>
            <button className="fm-btn-orange" onClick={onConfirm} disabled={sending}>
              {sending
                ? <><i className="fas fa-spinner fa-spin"></i> Sending…</>
                : <><i className="fas fa-paper-plane"></i> Yes, Send</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const FeesModule = () => {
  const [students, setStudents]             = useState([]);
  const [fees, setFees]                     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [paymentTarget, setPaymentTarget]   = useState(null);
  const [instTarget, setInstTarget]         = useState(null);
  const [reminderTarget, setReminderTarget] = useState(null);
  const [sending, setSending]               = useState(false);
  const [toast, setToast]                   = useState(null);

  const fetchFees = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/student/fees`);
      const data = await res.json();
      setFees(data.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res  = await fetch(`${API}/student/students`);
        const data = await res.json();
        setStudents(data.students || []);
      } finally { setLoading(false); }
    };
    load();
    fetchFees();
  }, [fetchFees]);

  const getFee = (studentId) => fees.find((f) => f.studentId === studentId);

  const handlePaymentSaved = () => {
    setPaymentTarget(null);
    fetchFees();
    setToast({ message: "Payment recorded successfully.", type: "success" });
  };

  const handleInstPlanSaved = () => {
    setInstTarget(null);
    fetchFees();
    setToast({ message: "Installment plan saved successfully.", type: "success" });
  };

  const handleSendReminder = async () => {
    if (!reminderTarget) return;
    setSending(true);
    try {
      const res  = await fetch(`${API}/student/send-reminder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: reminderTarget.studentId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed");
      setToast({ message: "Reminder sent to parent successfully.", type: "success" });
    } catch (err) {
      setToast({ message: err.message || "Failed to send reminder.", type: "error" });
    } finally {
      setSending(false);
      setReminderTarget(null);
    }
  };

  return (
    <div className="fm-wrapper">
      {/* ── header ── */}
      <div className="fm-header">
        <div>
          <h2 className="fm-title">Fees Management</h2>
          <p className="fm-subtitle">Track payments, set installments, and send reminders.</p>
        </div>
        <div className="fm-header-stats">
          <div className="fm-stat">
            <span>{students.length}</span>
            <label>Students</label>
          </div>
          <div className="fm-stat">
            <span>{students.filter(s => getFee(s.studentId)?.remaining === 0 && getFee(s.studentId)?.paid > 0).length}</span>
            <label>Paid</label>
          </div>
          <div className="fm-stat fm-stat-warn">
            <span>{students.filter(s => (getFee(s.studentId)?.remaining ?? 1) > 0).length}</span>
            <label>Pending</label>
          </div>
        </div>
      </div>

      {/* ── grid ── */}
      {loading ? (
        <div className="fm-grid">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="fm-skeleton" />)}
        </div>
      ) : students.length === 0 ? (
        <div className="fm-empty">
          <i className="fas fa-wallet"></i>
          <p>No students found. Add students to manage fees.</p>
        </div>
      ) : (
        <div className="fm-grid">
          {students.map((s) => {
            const fee       = getFee(s.studentId);
            const paid      = fee?.paid      || 0;
            const total     = fee?.totalFees || 0;
            const remaining = fee?.remaining || 0;
            const status    = fee?.status    || "pending";
            const hasPending = remaining > 0;
            const dueDate   = fee?.installmentPlan?.secondInstallmentDueDate;
            const showDue   = hasPending && dueDate;

            return (
              <div
                className={`fm-card ${hasPending && status !== "paid" ? "fm-card-pending" : ""}`}
                key={s._id}
              >
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

                {/* due date — only when there's a pending 2nd installment */}
                {showDue && (
                  <div className="fm-due-date">
                    <i className="fas fa-calendar-day"></i>
                    Due: {formatDate(dueDate)}
                  </div>
                )}

                {/* progress */}
                <div className="fm-progress-section">
                  <div className="fm-progress-label">
                    <span>Payment progress</span>
                    <span>{total > 0 ? Math.round((paid / total) * 100) : 0}%</span>
                  </div>
                  <ProgressBar paid={paid} total={total} />
                </div>

                {/* installment chips */}
                {fee?.installments?.length > 0 && (
                  <div className="fm-installments">
                    {fee.installments.slice(-2).map((inst, i) => (
                      <span key={i} className="fm-inst-chip">
                        <i className="fas fa-calendar-day"></i>
                        {inst.date ? ` ${formatDate(inst.date)}` : ""}
                        {inst.amount ? ` · ₹${inst.amount}` : ""}
                      </span>
                    ))}
                  </div>
                )}

                {/* actions */}
                <div className="fm-card-actions">
                  {hasPending && (
                    <button className="fm-btn-install" onClick={() => setPaymentTarget(s)}>
                      <i className="fas fa-indian-rupee-sign"></i> Record Payment
                    </button>
                  )}
                  <button className="fm-btn-set-inst" onClick={() => setInstTarget(s)}>
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

      {/* ── modals ── */}
      {paymentTarget && (
        <PaymentModal
          student={paymentTarget}
          fee={getFee(paymentTarget.studentId)}
          onClose={() => setPaymentTarget(null)}
          onSaved={handlePaymentSaved}
        />
      )}

      {instTarget && (
        <InstallmentModal
          student={instTarget}
          fee={getFee(instTarget.studentId)}
          onClose={() => setInstTarget(null)}
          onSaved={handleInstPlanSaved}
        />
      )}

      {reminderTarget && (
        <ReminderConfirm
          student={reminderTarget}
          fee={getFee(reminderTarget.studentId)}
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
