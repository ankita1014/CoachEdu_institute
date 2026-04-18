import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./ParentDashboard.css";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ParentDashboard = () => {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.parentId && !user?.parentid) {
      setLoading(false);
      return;
    }

    let active = true;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const parentId = user.parentId || user.parentid;
        const response = await fetch(`${API_BASE_URL}/parent/dashboard/${parentId}`);
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || "Unable to load parent dashboard");
        }

        if (active) {
          setDashboard(payload.data);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load parent dashboard");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();
    const interval = window.setInterval(fetchDashboard, 30000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [user]);

  const timeline = useMemo(() => {
    if (!dashboard?.fees?.installments?.length) return [];

    return [...dashboard.fees.installments].sort(
      (a, b) => new Date(a.date || 0) - new Date(b.date || 0)
    );
  }, [dashboard]);

  if (user?.role === "teacher") {
    return <Navigate to="/teacher-dashboard" replace />;
  }

  if (user?.role === "student") {
    return <Navigate to="/profile" replace />;
  }

  if (!user) {
    return null;
  }

  const student = dashboard?.student;
  const summary = dashboard?.summary || {};
  const fees = dashboard?.fees;
  const notifications = dashboard?.notifications || [];
  const homework = dashboard?.homework || [];
  const materials = dashboard?.materials || [];
  const tests = dashboard?.tests || [];
  const attendance = dashboard?.attendance || [];

  const recentHomework = homework.slice(0, 3);
  const recentMaterials = materials.slice(0, 3);
  const recentTests = tests.slice(0, 3);

  return (
    <div className="parent-shell">
      <aside className="parent-sidebar">
        <div className="parent-brand-badge">SC</div>
        <div>
          <p className="parent-kicker">Parent Workspace</p>
          <h1>CoachEdu Institute</h1>
          <p className="parent-subcopy">Track your child's attendance, fees, homework, and latest updates in one place.</p>
        </div>

        <div className="parent-summary-list">
          <div className="parent-summary-item">
            <span>Student</span>
            <strong>{student?.name || "Linked student"}</strong>
          </div>
          <div className="parent-summary-item">
            <span>Class</span>
            <strong>{student?.class || "Not assigned"}</strong>
          </div>
          <div className="parent-summary-item">
            <span>Pending fees</span>
            <strong>{fees ? `Rs ${fees.remaining || 0}` : "Loading"}</strong>
          </div>
        </div>
      </aside>

      <main className="parent-main">
        <header className="parent-topbar">
          <div>
            <p className="parent-kicker">Parent Dashboard</p>
            <h2>{student?.name || "Student overview"}</h2>
            <p>{student?.class ? `Class ${student.class}` : "Live academic updates from the teacher dashboard."}</p>
          </div>

          <div className="parent-topbar-actions">
            <div className="parent-avatar-card">
              <div className="parent-avatar">{(user.name || "P").slice(0, 1)}</div>
              <div>
                <strong>{user.name || "Parent"}</strong>
                <span>{user.parentId || user.parentid || "Parent account"}</span>
              </div>
            </div>
            <button type="button" className="parent-logout" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        {loading ? (
          <div className="parent-loading-grid">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="parent-skeleton-card" />
            ))}
          </div>
        ) : error ? (
          <div className="parent-state-card parent-state-error">
            <h3>Unable to load dashboard</h3>
            <p>{error}</p>
          </div>
        ) : !dashboard ? (
          <div className="parent-state-card">
            <h3>No student linked yet</h3>
            <p>This parent account does not have a connected student record.</p>
          </div>
        ) : (
          <>
            <section className="parent-stats-grid">
              <article className="parent-stat-card tone-indigo">
                <span>Attendance</span>
                <strong>{summary.attendancePercentage || 0}%</strong>
                <p>Based on saved daily attendance entries.</p>
              </article>
              <article className="parent-stat-card tone-green">
                <span>Test Performance</span>
                <strong>{summary.performancePercentage || 0}%</strong>
                <p>Average of evaluated tests so far.</p>
              </article>
              <article className="parent-stat-card tone-amber">
                <span>Pending Homework</span>
                <strong>{summary.pendingHomework || 0}</strong>
                <p>Assignments still awaiting submission.</p>
              </article>
              <article className="parent-stat-card tone-rose">
                <span>Fees Remaining</span>
                <strong>Rs {fees?.remaining || 0}</strong>
                <p>{fees?.status || "pending"} payment status.</p>
              </article>
            </section>

            <section className="parent-content-grid">
              <section className="parent-panel parent-panel-large">
                <div className="parent-panel-header">
                  <div>
                    <p className="parent-kicker">Progress Overview</p>
                    <h3>Student snapshot</h3>
                  </div>
                </div>
                <div className="parent-overview-grid">
                  <div className="parent-profile-card">
                    <h4>Student details</h4>
                    <div className="parent-detail-row"><span>Name</span><strong>{student?.name || "-"}</strong></div>
                    <div className="parent-detail-row"><span>Student ID</span><strong>{student?.studentId || "-"}</strong></div>
                    <div className="parent-detail-row"><span>Class</span><strong>{student?.class || "-"}</strong></div>
                    <div className="parent-detail-row"><span>Attendance records</span><strong>{attendance.length}</strong></div>
                  </div>
                  <div className="parent-profile-card">
                    <h4>Fees overview</h4>
                    <div className="parent-detail-row"><span>Total fees</span><strong>Rs {fees?.totalFees || 0}</strong></div>
                    <div className="parent-detail-row"><span>Paid</span><strong>Rs {fees?.paid || 0}</strong></div>
                    <div className="parent-detail-row"><span>Remaining</span><strong>Rs {fees?.remaining || 0}</strong></div>
                    <div className="parent-detail-row"><span>Status</span><strong className={`parent-badge ${fees?.status || "pending"}`}>{fees?.status || "pending"}</strong></div>
                  </div>
                </div>
              </section>

              <section className="parent-panel">
                <div className="parent-panel-header">
                  <div>
                    <p className="parent-kicker">Teacher Alerts</p>
                    <h3>Notifications</h3>
                  </div>
                  <span className="parent-count-pill">{notifications.length}</span>
                </div>
                <div className="parent-stack-list">
                  {notifications.length ? notifications.slice(0, 4).map((item) => (
                    <article key={item._id} className="parent-list-card">
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.message}</p>
                      </div>
                      <span className={`parent-badge ${item.type || "general"}`}>{item.type || "general"}</span>
                    </article>
                  )) : <div className="parent-empty">No notifications yet.</div>}
                </div>
              </section>
            </section>

            <section className="parent-content-grid parent-content-grid-bottom">
              <section className="parent-panel">
                <div className="parent-panel-header">
                  <div>
                    <p className="parent-kicker">Assignments</p>
                    <h3>Homework</h3>
                  </div>
                </div>
                <div className="parent-stack-list">
                  {recentHomework.length ? recentHomework.map((item) => (
                    <article key={item._id} className="parent-list-card compact">
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.subject} � {item.className} � Due {new Date(item.dueDate).toLocaleDateString()}</p>
                      </div>
                      <span className={`parent-badge ${item.studentSubmission?.status || "pending"}`}>{item.studentSubmission?.status || "pending"}</span>
                    </article>
                  )) : <div className="parent-empty">No homework assigned for this class yet.</div>}
                </div>
              </section>

              <section className="parent-panel">
                <div className="parent-panel-header">
                  <div>
                    <p className="parent-kicker">Learning Resources</p>
                    <h3>Materials</h3>
                  </div>
                </div>
                <div className="parent-stack-list">
                  {recentMaterials.length ? recentMaterials.map((item) => (
                    <article key={item._id} className="parent-list-card compact">
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.subject} � {item.fileName}</p>
                      </div>
                      <a className="parent-link-button" href={item.fileUrl} target="_blank" rel="noreferrer">Open</a>
                    </article>
                  )) : <div className="parent-empty">No materials uploaded for this class yet.</div>}
                </div>
              </section>

              <section className="parent-panel">
                <div className="parent-panel-header">
                  <div>
                    <p className="parent-kicker">Assessments</p>
                    <h3>Tests</h3>
                  </div>
                </div>
                <div className="parent-stack-list">
                  {recentTests.length ? recentTests.map((item) => (
                    <article key={item._id} className="parent-list-card compact">
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.subject} � Due {new Date(item.dueDate).toLocaleDateString()}</p>
                      </div>
                      <span className={`parent-badge ${item.studentSubmission?.status || "pending"}`}>
                        {item.studentSubmission?.status === "evaluated"
                          ? `${item.studentSubmission.score} marks`
                          : item.studentSubmission?.status || "pending"}
                      </span>
                    </article>
                  )) : <div className="parent-empty">No tests available yet.</div>}
                </div>
              </section>
            </section>

            <section className="parent-content-grid parent-content-grid-bottom">
              <section className="parent-panel">
                <div className="parent-panel-header">
                  <div>
                    <p className="parent-kicker">Attendance</p>
                    <h3>Recent attendance</h3>
                  </div>
                </div>
                <div className="parent-table-wrap">
                  {attendance.length ? (
                    <table className="parent-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.slice(0, 8).map((item, index) => (
                          <tr key={`${item.date}-${index}`}>
                            <td>{new Date(item.date).toLocaleDateString()}</td>
                            <td>
                              <span className={`parent-badge ${item.status}`}>{item.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="parent-empty">No attendance records available yet.</div>
                  )}
                </div>
              </section>

              <section className="parent-panel">
                <div className="parent-panel-header">
                  <div>
                    <p className="parent-kicker">Installments</p>
                    <h3>Fee timeline</h3>
                  </div>
                </div>
                <div className="parent-stack-list">
                  {timeline.length ? timeline.map((item, index) => (
                    <article key={`${item.date}-${index}`} className="parent-list-card compact">
                      <div>
                        <strong>{item.amount ? `Rs ${item.amount}` : "Upcoming installment"}</strong>
                        <p>{item.date ? new Date(item.date).toLocaleDateString() : "Date pending"}</p>
                      </div>
                      <span className="parent-badge scheduled">scheduled</span>
                    </article>
                  )) : <div className="parent-empty">No installment timeline available yet.</div>}
                </div>
              </section>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default ParentDashboard;
