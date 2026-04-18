import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Toast from "./Toast";
import { useAuth } from "../context/AuthContext";
import "./StudentDashboard.css";

const API_BASE_URL = "import.meta.env.VITE_API_URL/student";
const POLL_INTERVAL = 30000;

const formatDate = (value) => {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const StudentSidebarItem = ({ iconClass, label, active, onClick }) => (
  <button className={active ? "active" : ""} onClick={onClick}>
    <i className={iconClass}></i>
    <span>{label}</span>
  </button>
);

const StudentSummaryCard = ({ iconClass, label, value, accent }) => (
  <article className={`sd-summary-card accent-${accent}`}>
    <div className="sd-summary-icon">
      <i className={iconClass}></i>
    </div>
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  </article>
);

const EmptyState = ({ title, message, iconClass = "fas fa-folder-open" }) => (
  <div className="sd-empty-state">
    <i className={iconClass}></i>
    <h3>{title}</h3>
    <p>{message}</p>
  </div>
);

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRefs = useRef({});

  const [view, setView] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState(null);
  const [homework, setHomework] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [tests, setTests] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [attendancePercentage, setAttendancePercentage] = useState(0);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [noticeTypeFilter, setNoticeTypeFilter] = useState("all");
  const [uploadingHomeworkId, setUploadingHomeworkId] = useState("");
  const [selectedFiles, setSelectedFiles] = useState({});

  const studentId = user?.studentId || user?._id || user?.id || "";
  const studentName = user?.name || "Student";
  const studentClass = user?.class || dashboardData?.student?.class || "Class not set";

  useEffect(() => {
    if (!studentId || user?.role !== "student") return;

    let active = true;

    const loadAll = async () => {
      try {
        if (active) setLoading(true);

        const [dashboardRes, homeworkRes, materialsRes, testsRes, attendanceRes, noticesRes] =
          await Promise.all([
            fetch(`${API_BASE_URL}/dashboard?studentId=${encodeURIComponent(studentId)}`),
            fetch(`${API_BASE_URL}/homework/${encodeURIComponent(studentId)}`),
            fetch(`${API_BASE_URL}/materials/${encodeURIComponent(studentId)}`),
            fetch(`${API_BASE_URL}/tests/${encodeURIComponent(studentId)}`),
            fetch(`${API_BASE_URL}/attendance/${encodeURIComponent(studentId)}`),
            fetch(`${API_BASE_URL}/notifications/${encodeURIComponent(studentId)}`),
          ]);

        const [dashboardJson, homeworkJson, materialsJson, testsJson, attendanceJson, noticesJson] =
          await Promise.all([
            dashboardRes.json(),
            homeworkRes.json(),
            materialsRes.json(),
            testsRes.json(),
            attendanceRes.json(),
            noticesRes.json(),
          ]);

        if (!active) return;

        setDashboardData(dashboardJson.data || null);
        setHomework(homeworkJson.data || []);
        setMaterials(materialsJson.data || []);
        setTests(testsJson.data || []);
        setAttendance(attendanceJson.data || []);
        setAttendancePercentage(attendanceJson.percentage || 0);
        setNotices(noticesJson.data || []);
      } catch (error) {
        console.error(error);
        if (active) {
          setToast({
            message: "Failed to load student dashboard data.",
            type: "error",
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadAll();
    const interval = setInterval(loadAll, POLL_INTERVAL);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [studentId, user?.role]);

  const filteredHomework = useMemo(() => {
    return homework.filter((item) => {
      const query = search.trim().toLowerCase();
      if (!query) return true;
      return `${item.title} ${item.subject}`.toLowerCase().includes(query);
    });
  }, [homework, search]);

  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      const query = search.trim().toLowerCase();
      if (!query) return true;
      return `${item.title} ${item.subject}`.toLowerCase().includes(query);
    });
  }, [materials, search]);

  const filteredTests = useMemo(() => {
    return tests.filter((item) => {
      const query = search.trim().toLowerCase();
      if (!query) return true;
      return `${item.title} ${item.subject}`.toLowerCase().includes(query);
    });
  }, [tests, search]);

  const filteredNotices = useMemo(() => {
    return notices.filter((item) => {
      const query = search.trim().toLowerCase();
      const matchesSearch = query
        ? `${item.title} ${item.message}`.toLowerCase().includes(query)
        : true;
      const matchesType = noticeTypeFilter === "all" ? true : item.type === noticeTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [noticeTypeFilter, notices, search]);

  const pendingHomeworkCount = useMemo(
    () =>
      homework.filter(
        (item) => !item.studentSubmission || item.studentSubmission.status === "pending"
      ).length,
    [homework]
  );

  const performancePercentage = dashboardData?.summary?.performancePercentage || 0;

  const recentActivity = dashboardData?.recentActivity || {
    homework: [],
    materials: [],
    tests: [],
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleFileSelection = (homeworkId, file) => {
    setSelectedFiles((prev) => ({
      ...prev,
      [homeworkId]: file,
    }));
  };

  const handleHomeworkSubmit = async (homeworkId) => {
    const file = selectedFiles[homeworkId];

    if (!file) {
      setToast({ message: "Choose a file before submitting homework.", type: "error" });
      return;
    }

    setUploadingHomeworkId(homeworkId);

    try {
      const formData = new FormData();
      formData.append("homeworkId", homeworkId);
      formData.append("studentId", studentId);
      formData.append("file", file);

      const res = await fetch(`${API_BASE_URL}/homework/submit`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit homework");
      }

      setToast({ message: "Homework submitted successfully.", type: "success" });
      setSelectedFiles((prev) => {
        const next = { ...prev };
        delete next[homeworkId];
        return next;
      });
      if (fileInputRefs.current[homeworkId]) {
        fileInputRefs.current[homeworkId].value = "";
      }

      const refreshed = await fetch(`${API_BASE_URL}/homework/${encodeURIComponent(studentId)}`);
      const refreshedJson = await refreshed.json();
      setHomework(refreshedJson.data || []);
    } catch (error) {
      console.error(error);
      setToast({ message: error.message || "Homework submission failed.", type: "error" });
    } finally {
      setUploadingHomeworkId("");
    }
  };

  const dashboardCards = [
    {
      iconClass: "fas fa-calendar-check",
      label: "Attendance",
      value: `${attendancePercentage}%`,
      accent: "violet",
    },
    {
      iconClass: "fas fa-chart-column",
      label: "Test Performance",
      value: `${performancePercentage}%`,
      accent: "blue",
    },
    {
      iconClass: "fas fa-book-open-reader",
      label: "Pending Homework",
      value: pendingHomeworkCount,
      accent: "amber",
    },
  ];

  const sidebarItems = [
    { key: "dashboard", label: "Dashboard", iconClass: "fas fa-house" },
    { key: "homework", label: "Homework", iconClass: "fas fa-book-open-reader" },
    { key: "materials", label: "Materials", iconClass: "fas fa-folder-open" },
    { key: "tests", label: "Tests", iconClass: "fas fa-file-lines" },
    { key: "attendance", label: "Attendance", iconClass: "fas fa-calendar-days" },
    { key: "notices", label: "Notices", iconClass: "fas fa-bell" },
    { key: "profile", label: "Profile", iconClass: "fas fa-user" },
  ];

  if (user?.role === "teacher") {
    return <Navigate to="/teacher-dashboard" replace />;
  }

  if (user?.role === "parent") {
    return <Navigate to="/parent-dashboard" replace />;
  }

  const renderDashboardHome = () => (
    <div className="sd-home-grid">
      <section className="sd-welcome-card">
        <div>
          <span className="sd-eyebrow">Student Workspace</span>
          <h1>Welcome back, {studentName.split(" ")[0]}</h1>
          <p>
            Stay on top of homework, materials, tests, and notices shared by your teachers.
          </p>
        </div>
        <div className="sd-class-pill">{studentClass}</div>
      </section>

      <section className="sd-summary-grid">
        {dashboardCards.map((card) => (
          <StudentSummaryCard key={card.label} {...card} />
        ))}
      </section>

      <section className="sd-panel">
        <div className="sd-panel-head">
          <div>
            <span className="sd-eyebrow">Recent Activity</span>
            <h3>Latest from your teachers</h3>
          </div>
        </div>
        <div className="sd-activity-list">
          {recentActivity.homework.map((item) => (
            <div key={`homework-${item._id}`} className="sd-activity-item">
              <i className="fas fa-book-open-reader"></i>
              <div>
                <strong>{item.title}</strong>
                <p>{item.subject} � Due {formatDate(item.dueDate)}</p>
              </div>
            </div>
          ))}
          {recentActivity.materials.map((item) => (
            <div key={`material-${item._id}`} className="sd-activity-item">
              <i className="fas fa-folder-open"></i>
              <div>
                <strong>{item.title}</strong>
                <p>{item.subject} � Added {formatDate(item.createdAt)}</p>
              </div>
            </div>
          ))}
          {recentActivity.tests.map((item) => (
            <div key={`test-${item._id}`} className="sd-activity-item">
              <i className="fas fa-file-signature"></i>
              <div>
                <strong>{item.title}</strong>
                <p>{item.subject} � Scheduled {formatDate(item.dueDate)}</p>
              </div>
            </div>
          ))}
          {!recentActivity.homework.length &&
            !recentActivity.materials.length &&
            !recentActivity.tests.length && (
              <EmptyState
                title="No recent activity"
                message="New homework, tests, and materials from teachers will show up here."
                iconClass="fas fa-sparkles"
              />
            )}
        </div>
      </section>
    </div>
  );

  const renderHomework = () => (
    <div className="sd-section-stack">
      <div className="sd-section-head">
        <div>
          <span className="sd-eyebrow">Homework</span>
          <h2>Assignments</h2>
        </div>
      </div>
      <div className="sd-search-row">
        <input
          type="text"
          placeholder="Search homework..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      {filteredHomework.length ? (
        <div className="sd-card-grid">
          {filteredHomework.map((item) => {
            const submission = item.studentSubmission;
            const isSubmitted = submission && submission.status !== "pending";
            return (
              <article key={item._id} className="sd-card">
                <div className="sd-card-head">
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.subject}</p>
                  </div>
                  <span className={`sd-status ${isSubmitted ? "submitted" : "pending"}`}>
                    {isSubmitted ? "Submitted" : "Pending"}
                  </span>
                </div>
                <p className="sd-card-text">{item.description}</p>
                <div className="sd-card-meta">
                  <span>Due {formatDate(item.dueDate)}</span>
                  {submission?.feedback ? <span>Feedback: {submission.feedback}</span> : null}
                </div>
                <div className="sd-upload-box">
                  <input
                    ref={(node) => {
                      fileInputRefs.current[item._id] = node;
                    }}
                    type="file"
                    onChange={(event) => handleFileSelection(item._id, event.target.files?.[0])}
                  />
                  <button
                    onClick={() => handleHomeworkSubmit(item._id)}
                    disabled={uploadingHomeworkId === item._id}
                  >
                    {uploadingHomeworkId === item._id ? "Submitting..." : "Upload Submission"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No homework assigned"
          message="Homework from your teachers will appear here automatically."
          iconClass="fas fa-book"
        />
      )}
    </div>
  );

  const renderMaterials = () => (
    <div className="sd-section-stack">
      <div className="sd-section-head">
        <div>
          <span className="sd-eyebrow">Materials</span>
          <h2>Study Resources</h2>
        </div>
      </div>
      <div className="sd-search-row">
        <input
          type="text"
          placeholder="Search materials..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      {filteredMaterials.length ? (
        <div className="sd-card-grid">
          {filteredMaterials.map((item) => (
            <article key={item._id} className="sd-card">
              <div className="sd-card-head">
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.subject}</p>
                </div>
                <span className="sd-status info">{item.className}</span>
              </div>
              <p className="sd-card-text">{item.description || "Teacher uploaded a new study resource."}</p>
              <div className="sd-card-meta">
                <span>{item.fileName}</span>
                <span>{formatDate(item.createdAt)}</span>
              </div>
              <div className="sd-card-actions">
                <a href={item.fileUrl} target="_blank" rel="noreferrer">
                  View
                </a>
                <a href={item.fileUrl} download>
                  Download
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No materials yet"
          message="Study materials uploaded by teachers will show here automatically."
          iconClass="fas fa-file-arrow-down"
        />
      )}
    </div>
  );

  const renderTests = () => {
    const today = new Date();
    return (
      <div className="sd-section-stack">
        <div className="sd-section-head">
          <div>
            <span className="sd-eyebrow">Tests</span>
            <h2>Assessments</h2>
          </div>
        </div>
        <div className="sd-search-row">
          <input
            type="text"
            placeholder="Search tests..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        {filteredTests.length ? (
          <div className="sd-card-grid">
            {filteredTests.map((item) => {
              const sub = item.studentSubmission;
              const isPast = item.dueDate && new Date(item.dueDate) < today;
              const subStatus = sub?.status || "pending";

              // Determine display status
              let displayStatus = subStatus;
              if (subStatus === "pending" && isPast) displayStatus = "missed";

              const statusLabel = {
                pending:   "Pending",
                submitted: "Submitted",
                evaluated: "Evaluated",
                missed:    "Missed",
              }[displayStatus] || displayStatus;

              const statusClass = {
                pending:   "pending",
                submitted: "submitted",
                evaluated: "submitted",
                missed:    "pending",
              }[displayStatus] || "pending";

              const canAttempt = subStatus === "pending" && !isPast;

              return (
                <article key={item._id} className="sd-card">
                  <div className="sd-card-head">
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.subject}</p>
                    </div>
                    <span className={`sd-status ${statusClass}`}>{statusLabel}</span>
                  </div>
                  <div className="sd-card-meta">
                    <span>Due {formatDate(item.dueDate)}</span>
                    <span>Total {item.totalMarks} marks</span>
                    <span>Duration {item.duration} mins</span>
                  </div>
                  {subStatus === "evaluated" && (
                    <div className="sd-test-score">
                      <strong>{sub?.score ?? "--"}</strong>
                      <span>/ {item.totalMarks} marks</span>
                      {sub?.feedback && <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "4px 0 0" }}>Feedback: {sub.feedback}</p>}
                    </div>
                  )}
                  {subStatus === "submitted" && (
                    <p style={{ fontSize: "0.82rem", color: "#2563eb", margin: "8px 0 0" }}>
                      <i className="fas fa-check-circle"></i> Submitted — awaiting evaluation
                    </p>
                  )}
                  {canAttempt && (
                    <button
                      className="sd-attempt-btn"
                      onClick={() => navigate(`/test/${item._id}/attempt`)}
                    >
                      <i className="fas fa-play"></i> Start Test
                    </button>
                  )}
                  {displayStatus === "missed" && (
                    <p style={{ fontSize: "0.82rem", color: "#ef4444", margin: "8px 0 0" }}>
                      <i className="fas fa-clock"></i> Due date passed
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No tests assigned"
            message="Tests scheduled by teachers will appear here automatically."
            iconClass="fas fa-file-circle-check"
          />
        )}
      </div>
    );
  };

  const renderAttendance = () => (
    <div className="sd-section-stack">
      <div className="sd-section-head">
        <div>
          <span className="sd-eyebrow">Attendance</span>
          <h2>Attendance Overview</h2>
        </div>
      </div>
      <div className="sd-attendance-hero">
        <strong>{attendancePercentage}%</strong>
        <span>Overall Attendance</span>
      </div>
      {attendance.length ? (
        <div className="sd-table-wrap">
          <table className="sd-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((item) => (
                <tr key={`${item.date}-${item.status}`}>
                  <td>{item.date}</td>
                  <td>
                    <span className={`sd-status ${item.status === "present" ? "submitted" : "pending"}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No attendance records"
          message="Attendance will appear once your teacher marks the class."
          iconClass="fas fa-calendar-xmark"
        />
      )}
    </div>
  );

  const renderNotices = () => (
    <div className="sd-section-stack">
      <div className="sd-section-head">
        <div>
          <span className="sd-eyebrow">Notices</span>
          <h2>Announcements & Reminders</h2>
        </div>
      </div>
      <div className="sd-search-row notices">
        <input
          type="text"
          placeholder="Search notices..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select value={noticeTypeFilter} onChange={(event) => setNoticeTypeFilter(event.target.value)}>
          <option value="all">All Types</option>
          <option value="fees">Fees</option>
          <option value="homework">Homework</option>
          <option value="test">Test</option>
          <option value="general">General</option>
        </select>
      </div>
      {filteredNotices.length ? (
        <div className="sd-notice-list">
          {filteredNotices.map((item) => (
            <article key={item._id} className="sd-notice-card">
              <div className="sd-card-head">
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.message}</p>
                </div>
                <span className="sd-status info">{item.type}</span>
              </div>
              <div className="sd-card-meta">
                <span>{item.audience}</span>
                <span>{formatDate(item.sentAt || item.createdAt)}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No notices right now"
          message="Teacher announcements and reminders will appear here automatically."
          iconClass="fas fa-bell-slash"
        />
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="sd-section-stack">
      <div className="sd-section-head">
        <div>
          <span className="sd-eyebrow">Profile</span>
          <h2>Your Details</h2>
        </div>
      </div>
      <div className="sd-profile-card">
        <div className="sd-profile-avatar">{studentName.charAt(0).toUpperCase()}</div>
        <div className="sd-profile-grid">
          <div>
            <span>Name</span>
            <strong>{studentName}</strong>
          </div>
          <div>
            <span>Student ID</span>
            <strong>{user?.studentId || "--"}</strong>
          </div>
          <div>
            <span>Class</span>
            <strong>{studentClass}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{user?.email || "Not available"}</strong>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActiveView = () => {
    if (loading) {
      return (
        <div className="sd-loading-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="td-skeleton sd-loading-card"></div>
          ))}
        </div>
      );
    }

    switch (view) {
      case "dashboard":
        return renderDashboardHome();
      case "homework":
        return renderHomework();
      case "materials":
        return renderMaterials();
      case "tests":
        return renderTests();
      case "attendance":
        return renderAttendance();
      case "notices":
        return renderNotices();
      case "profile":
        return renderProfile();
      default:
        return renderDashboardHome();
    }
  };

  return (
    <div className="student-dashboard-shell">
      <aside className="student-dashboard-sidebar">
        <div className="sd-brand">
          <div className="sd-brand-badge">SC</div>
          <div>
            <span className="sd-eyebrow">Student Workspace</span>
            <h2>CoachEdu Institute</h2>
          </div>
        </div>

        <div className="sd-sidebar-menu">
          {sidebarItems.map((item) => (
            <StudentSidebarItem
              key={item.key}
              iconClass={item.iconClass}
              label={item.label}
              active={view === item.key}
              onClick={() => {
                setView(item.key);
                setSearch("");
              }}
            />
          ))}
        </div>
      </aside>

      <main className="student-dashboard-main">
        <header className="student-dashboard-topbar">
          <div className="sd-student-chip">
            <div className="sd-avatar">{studentName.charAt(0).toUpperCase()}</div>
            <div>
              <strong>{studentName}</strong>
              <span>{studentClass}</span>
            </div>
          </div>

          <div className="sd-topbar-actions">
            <button className="sd-icon-button" onClick={() => setView("notices")}>
              <i className="fas fa-bell"></i>
              {notices.length ? <span>{notices.length}</span> : null}
            </button>
            <button className="sd-logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {renderActiveView()}
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Profile;
