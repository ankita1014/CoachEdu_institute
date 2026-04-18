import { useEffect, useMemo, useState, useCallback } from "react";
import Toast from "../Toast";
import AttendanceHeader from "../teacherDashboard/AttendanceHeader";
import StudentCard from "../teacherDashboard/StudentCard";
import SummaryCard from "../teacherDashboard/SummaryCard";
import "./AttendanceModule.css";

const API = import.meta.env.VITE_API_URL;
const TODAY = new Date().toISOString().split("T")[0];

const AttendanceModule = () => {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});   // { studentId(string) → "present"|"absent" }
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyDetails, setHistoryDetails] = useState(null);
  const [initialSnapshot, setInitialSnapshot] = useState("{}");

  // ── load students + full history once ──────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, aRes] = await Promise.all([
        fetch(`${API}/student/students`),
        fetch(`${API}/teacher/attendance`),
      ]);
      const [sData, aData] = await Promise.all([sRes.json(), aRes.json()]);
      setStudents(sData.students || []);
      setHistory(aData.data || []);
    } catch {
      setToast({ message: "Failed to load data. Please refresh.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── when date or history changes, load that day's records ──────────────────
  useEffect(() => {
    const record = history.find((r) => r.date === selectedDate);
    const next = {};
    if (record?.records?.length) {
      record.records.forEach((r) => {
        // records are stored with studentId (string like "stu001")
        next[r.studentId] = r.status;
      });
    }
    setAttendance(next);
    setInitialSnapshot(JSON.stringify(next));
  }, [selectedDate, history]);

  // ── unsaved-changes guard ──────────────────────────────────────────────────
  useEffect(() => {
    const guard = (e) => {
      if (JSON.stringify(attendance) === initialSnapshot) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [attendance, initialSnapshot]);

  // ── actions ────────────────────────────────────────────────────────────────
  const toggleStatus = (id, status) =>
    setAttendance((prev) => ({ ...prev, [id]: status }));

  const markAll = (status) => {
    const next = {};
    students.forEach((s) => { next[s.studentId] = status; });
    setAttendance(next);
  };

  const handleSave = async () => {
    // Build records using studentId (string), NOT _id (ObjectId)
    const records = students.map((s) => ({
      studentId: s.studentId,
      status: attendance[s.studentId] || "absent",
    }));

    setIsSaving(true);
    try {
      const res = await fetch(`${API}/teacher/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, records }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Save failed");
      setToast({ message: "Attendance saved successfully.", type: "success" });
      await loadAll();
    } catch (err) {
      setToast({ message: err.message || "Failed to save attendance.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // ── derived values ─────────────────────────────────────────────────────────
  const filteredStudents = useMemo(() =>
    students.filter((s) => {
      const matchSearch = s.name?.toLowerCase().includes(search.trim().toLowerCase());
      const status = attendance[s.studentId];
      const matchFilter = statusFilter === "all" ? true : status === statusFilter;
      return matchSearch && matchFilter;
    }),
  [students, attendance, search, statusFilter]);

  const presentCount = useMemo(
    () => students.filter((s) => attendance[s.studentId] === "present").length,
    [students, attendance]
  );
  const absentCount = useMemo(
    () => students.filter((s) => attendance[s.studentId] === "absent").length,
    [students, attendance]
  );
  const markedCount = presentCount + absentCount;
  const percentage = students.length
    ? Math.round((presentCount / students.length) * 100) : 0;
  const hasUnsavedChanges = JSON.stringify(attendance) !== initialSnapshot;

  const historyRows = useMemo(() =>
    history.map((r) => {
      const total = r.records?.length || 0;
      const present = r.records?.filter((x) => x.status === "present").length || 0;
      return { ...r, total, present, absent: total - present, percent: total ? Math.round((present / total) * 100) : 0 };
    }),
  [history]);

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="attendance-wrapper">
      <AttendanceHeader
        selectedDate={selectedDate}
        onDateChange={(e) => setSelectedDate(e.target.value)}
        onSave={handleSave}
        onMarkAllPresent={() => markAll("present")}
        onMarkAllAbsent={() => markAll("absent")}
        hasUnsavedChanges={hasUnsavedChanges && !isSaving}
        onViewHistory={() => setShowHistory(true)}
      />

      {/* summary cards — current date only */}
      <div className="summary-cards">
        <SummaryCard iconClass="fas fa-circle-check" label="Present Count" value={presentCount} tone="present" />
        <SummaryCard iconClass="fas fa-circle-xmark" label="Absent Count" value={absentCount} tone="absent" />
        <SummaryCard iconClass="fas fa-chart-line" label="Attendance %" value={percentage} suffix="%" tone="attendance" />
      </div>

      {/* toolbar */}
      <section className="attendance-toolbar">
        <div className="attendance-search">
          <i className="fas fa-search"></i>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student by name..."
          />
        </div>
        <div className="attendance-filter-tabs">
          {[{ value: "all", label: "All" }, { value: "present", label: "Present" }, { value: "absent", label: "Absent" }].map((o) => (
            <button key={o.value} className={statusFilter === o.value ? "active" : ""} onClick={() => setStatusFilter(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
        <div className="attendance-meta-chip">
          <i className="fas fa-user-check"></i>
          {markedCount}/{students.length} marked
        </div>
      </section>

      {/* student grid */}
      {loading ? (
        <div className="attendance-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="td-skeleton attendance-skeleton" />
          ))}
        </div>
      ) : filteredStudents.length ? (
        <div className="attendance-grid">
          {filteredStudents.map((s) => (
            <StudentCard
              key={s._id}
              student={s}
              status={attendance[s.studentId]}
              onToggleStatus={(id, status) => toggleStatus(s.studentId, status)}
            />
          ))}
        </div>
      ) : (
        <div className="attendance-empty">
          <i className="fas fa-user-slash"></i>
          <h3>
            {students.length === 0
              ? "No students found"
              : markedCount === 0
              ? `No attendance marked for ${selectedDate}`
              : "No students match this filter"}
          </h3>
          <p>
            {students.length === 0
              ? "Add students first to mark attendance."
              : "Try a different filter or search term."}
          </p>
        </div>
      )}

      {/* ── History Modal ── */}
      {showHistory && (
        <div className="attendance-modal-overlay" onClick={() => { setShowHistory(false); setHistoryDetails(null); }}>
          <div className="attendance-modal" onClick={(e) => e.stopPropagation()}>
            <div className="attendance-modal-head">
              <div>
                <span className="td-eyebrow">Attendance History</span>
                <h3>{historyDetails ? historyDetails.date : "All Records"}</h3>
              </div>
              <button onClick={() => { if (historyDetails) setHistoryDetails(null); else setShowHistory(false); }}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {historyDetails ? (
              /* detail view */
              <div>
                <button
                  onClick={() => setHistoryDetails(null)}
                  style={{ marginBottom: 16, background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontWeight: 600, padding: 0 }}
                >
                  ← Back to history
                </button>
                <div className="attendance-modal-grid">
                  {historyDetails.records.map((r, i) => {
                    const student = students.find((s) => s.studentId === r.studentId || s._id === r.studentId);
                    return (
                      <div key={i} className="attendance-detail-card">
                        <strong>{student?.name || r.studentId}</strong>
                        <span className={r.status}>{r.status}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : historyRows.length ? (
              /* history table */
              <div style={{ overflowX: "auto", marginTop: 16 }}>
                <table className="attendance-history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Present</th>
                      <th>Absent</th>
                      <th>Attendance %</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyRows.map((r) => (
                      <tr key={r.date}>
                        <td>{r.date}</td>
                        <td>{r.present}</td>
                        <td>{r.absent}</td>
                        <td>{r.percent}%</td>
                        <td>
                          <button onClick={() => setHistoryDetails(r)}>View Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="attendance-empty history" style={{ marginTop: 24 }}>
                <i className="fas fa-calendar-xmark"></i>
                <h3>No attendance records available</h3>
                <p>Start marking attendance to build history.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AttendanceModule;
