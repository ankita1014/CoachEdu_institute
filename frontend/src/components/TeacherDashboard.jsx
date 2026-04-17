import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import DashboardActivityItem from "./teacherDashboard/DashboardActivityItem";
import DashboardSidebar from "./teacherDashboard/DashboardSidebar";
import DashboardStatCard from "./teacherDashboard/DashboardStatCard";
import DashboardTopbar from "./teacherDashboard/DashboardTopbar";
import StudentsModule from "./Teacher/StudentsModule";
import AttendanceModule from "./Teacher/AttendanceModule";
import FeesModule from "./Teacher/FeesModule";
import TeacherHomework from "./TeacherHomework";
import TeacherMaterials from "./TeacherMaterials";
import TeacherNotifications from "./TeacherNotifications";
import TeacherSubjects from "./TeacherSubjects";
import TeacherTests from "./TeacherTests";
import "./TeacherDashboard.css";

const API_BASE_URL = "http://localhost:5000/api";

const formatDate = (value) => {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

const toDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().split("T")[0];
};

const createEmptyDashboardState = () => ({
  students: [],
  attendance: [],
  materials: [],
  homework: [],
  tests: [],
  fees: [],
});

const TeacherDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [collapsedSidebar, setCollapsedSidebar] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("teacherDashboardTheme") === "dark"
  );
  const [searchValue, setSearchValue] = useState("");
  const [filterRange, setFilterRange] = useState("Week");
  const [dashboardData, setDashboardData] = useState(createEmptyDashboardState);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  useEffect(() => {
    localStorage.setItem(
      "teacherDashboardTheme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  useEffect(() => {
    if (!user?.role || user.role !== "teacher") {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchDashboardData = async () => {
      setLoading(true);

      try {
        const teacherId = user.teacherId || user.id || user._id || "";

        const requests = [
          fetch(`${API_BASE_URL}/student/students`).then((res) => res.json()),
          fetch(`${API_BASE_URL}/teacher/attendance`).then((res) => res.json()),
          fetch(
            `${API_BASE_URL}/teacher/materials?teacherId=${encodeURIComponent(
              teacherId
            )}`
          ).then((res) => res.json()),
          fetch(
            `${API_BASE_URL}/teacher/homework?teacherId=${encodeURIComponent(
              teacherId
            )}`
          ).then((res) => res.json()),
          fetch(
            `${API_BASE_URL}/teacher/tests?teacherId=${encodeURIComponent(
              teacherId
            )}`
          ).then((res) => res.json()),
          fetch(`${API_BASE_URL}/student/fees`).then((res) => res.json()),
        ];

        const [
          studentsResult,
          attendanceResult,
          materialsResult,
          homeworkResult,
          testsResult,
          feesResult,
        ] = await Promise.allSettled(requests);

        if (cancelled) return;

        setDashboardData({
          students:
            studentsResult.status === "fulfilled"
              ? studentsResult.value.students || []
              : [],
          attendance:
            attendanceResult.status === "fulfilled"
              ? attendanceResult.value.data || []
              : [],
          materials:
            materialsResult.status === "fulfilled"
              ? materialsResult.value.data || []
              : [],
          homework:
            homeworkResult.status === "fulfilled"
              ? homeworkResult.value.data || []
              : [],
          tests:
            testsResult.status === "fulfilled"
              ? testsResult.value.data || []
              : [],
          fees:
            feesResult.status === "fulfilled" ? feesResult.value.data || [] : [],
        });
      } catch (_error) {
        if (!cancelled) {
          setDashboardData(createEmptyDashboardState());
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const menuItems = useMemo(
    () => [
      { key: "dashboard", label: "Dashboard", iconClass: "fas fa-house" },
      {
        key: "students",
        label: "Students",
        iconClass: "fas fa-user-graduate",
      },
      {
        key: "attendance",
        label: "Attendance",
        iconClass: "fas fa-calendar-check",
      },
      { key: "fees", label: "Fees", iconClass: "fas fa-wallet" },
      { key: "subjects", label: "Subjects", iconClass: "fas fa-book-open" },
      {
        key: "materials",
        label: "Materials",
        iconClass: "fas fa-folder-open",
      },
      {
        key: "homework",
        label: "Homework",
        iconClass: "fas fa-pencil-alt",
      },
      { key: "tests", label: "Tests", iconClass: "fas fa-file-lines" },
      {
        key: "notifications",
        label: "Notifications",
        iconClass: "fas fa-bell",
      },
    ],
    []
  );

  const filteredMenuItems = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    if (!query) return menuItems;

    return menuItems.filter((item) =>
      item.label.toLowerCase().includes(query)
    );
  }, [menuItems, searchValue]);

  const rangeDays = filterRange === "Today" ? 1 : filterRange === "Month" ? 30 : 7;

  const filteredAttendance = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - rangeDays + 1);

    return dashboardData.attendance.filter((record) => {
      const recordDate = new Date(record.date);
      return !Number.isNaN(recordDate.getTime()) && recordDate >= cutoff;
    });
  }, [dashboardData.attendance, rangeDays]);

  const attendanceSummary = useMemo(() => {
    if (!filteredAttendance.length) {
      return { presentCount: 0, totalCount: 0, percentage: 0 };
    }

    const presentCount = filteredAttendance.reduce((count, entry) => {
      if (Array.isArray(entry.records)) {
        return (
          count +
          entry.records.filter((record) => record.status === "present").length
        );
      }

      return count + (entry.status === "present" ? 1 : 0);
    }, 0);

    const totalCount = filteredAttendance.reduce((count, entry) => {
      if (Array.isArray(entry.records)) {
        return count + entry.records.length;
      }

      return count + 1;
    }, 0);

    return {
      presentCount,
      totalCount,
      percentage: totalCount ? Math.round((presentCount / totalCount) * 100) : 0,
    };
  }, [filteredAttendance]);

  const attendanceTrendData = useMemo(() => {
    const grouped = filteredAttendance.reduce((accumulator, entry) => {
      const key = toDateKey(entry.date);
      if (!key) return accumulator;

      if (!accumulator[key]) {
        accumulator[key] = { label: formatDate(entry.date), present: 0, total: 0 };
      }

      if (Array.isArray(entry.records)) {
        accumulator[key].total += entry.records.length;
        accumulator[key].present += entry.records.filter(
          (record) => record.status === "present"
        ).length;
      } else {
        accumulator[key].total += 1;
        if (entry.status === "present") {
          accumulator[key].present += 1;
        }
      }

      return accumulator;
    }, {});

    const data = Object.values(grouped).map((item) => ({
      name: item.label,
      attendance: item.total ? Math.round((item.present / item.total) * 100) : 0,
    }));

    return data;
  }, [filteredAttendance]);

  const performanceData = useMemo(() => {
    const grouped = dashboardData.tests.reduce((accumulator, test) => {
      const subject = test.subject || "General";
      const submissions = Array.isArray(test.submissions) ? test.submissions : [];
      const evaluatedScores = submissions
        .map((submission) => submission.score || 0)
        .filter((score) => Number.isFinite(score));

      if (!accumulator[subject]) {
        accumulator[subject] = {
          name: subject,
          totalScore: 0,
          count: 0,
        };
      }

      if (evaluatedScores.length) {
        accumulator[subject].totalScore += evaluatedScores.reduce(
          (sum, score) => sum + score,
          0
        );
        accumulator[subject].count += evaluatedScores.length;
      } else {
        accumulator[subject].totalScore += Number(test.totalMarks) || 0;
        accumulator[subject].count += 1;
      }

      return accumulator;
    }, {});

    const data = Object.values(grouped)
      .slice(0, 6)
      .map((item) => ({
        name: item.name,
        score: item.count ? Math.round(item.totalScore / item.count) : 0,
      }));

    return data;
  }, [dashboardData.tests]);

  const dashboardStats = useMemo(
    () => ({
      students: dashboardData.students.length,
      attendance: attendanceSummary.percentage,
      materials: dashboardData.materials.length,
      tests: dashboardData.tests.length,
    }),
    [attendanceSummary.percentage, dashboardData]
  );

  const recentActivities = useMemo(() => {
    const studentActivities = dashboardData.students.slice(-2).map((student) => ({
      iconClass: "fas fa-user-plus",
      title: `${student.name || "Student"} enrolled`,
      meta: `Student ID ${student.studentId || "--"}`,
      tone: "blue",
      date: student.createdAt || new Date().toISOString(),
    }));

    const homeworkActivities = dashboardData.homework.slice(0, 2).map((item) => ({
      iconClass: "fas fa-book-open-reader",
      title: `${item.title || "Homework"} assigned`,
      meta: `${item.subject || "Subject"} • due ${formatDate(item.dueDate)}`,
      tone: "amber",
      date: item.createdAt || item.updatedAt || new Date().toISOString(),
    }));

    const testActivities = dashboardData.tests.slice(0, 2).map((item) => ({
      iconClass: "fas fa-file-signature",
      title: `${item.title || "Test"} scheduled`,
      meta: `${item.subject || "Subject"} • ${item.className || "Class"}`,
      tone: "violet",
      date: item.createdAt || item.updatedAt || new Date().toISOString(),
    }));

    return [...studentActivities, ...homeworkActivities, ...testActivities]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6);
  }, [dashboardData.homework, dashboardData.students, dashboardData.tests]);

  const upcomingTasks = useMemo(() => {
    const tasks = [
      ...dashboardData.tests.map((test) => ({
        iconClass: "fas fa-stopwatch",
        title: test.title || "Upcoming test",
        meta: `${test.subject || "Subject"} • ${formatDate(test.dueDate)}`,
        tone: "violet",
        date: test.dueDate,
      })),
      ...dashboardData.homework.map((work) => ({
        iconClass: "fas fa-clipboard-check",
        title: work.title || "Homework deadline",
        meta: `${work.className || "Class"} • ${formatDate(work.dueDate)}`,
        tone: "green",
        date: work.dueDate,
      })),
    ]
      .filter((item) => item.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);

    return tasks;
  }, [dashboardData.homework, dashboardData.tests]);

  const notifications = useMemo(() => {
    const items = [];

    if (attendanceSummary.percentage && attendanceSummary.percentage < 75) {
      items.push({
        iconClass: "fas fa-triangle-exclamation",
        title: "Attendance needs attention",
        meta: `${attendanceSummary.percentage}% this ${filterRange.toLowerCase()}`,
        tone: "red",
      });
    }

    const pendingFees = dashboardData.fees.filter(
      (fee) => fee.status !== "paid"
    ).length;
    if (pendingFees) {
      items.push({
        iconClass: "fas fa-wallet",
        title: `${pendingFees} fee records pending`,
        meta: "Follow up with parents for upcoming installments.",
        tone: "amber",
      });
    }

    const newHomeworkSubmissions = dashboardData.homework.reduce(
      (count, item) =>
        count +
        (Array.isArray(item.submissions)
          ? item.submissions.filter((submission) => submission.status !== "pending")
              .length
          : 0),
      0
    );

    if (newHomeworkSubmissions) {
      items.push({
        iconClass: "fas fa-inbox",
        title: `${newHomeworkSubmissions} homework submissions received`,
        meta: "Review feedback and marks for recent work.",
        tone: "green",
      });
    }

    const descriptiveTests = dashboardData.tests.filter((test) =>
      Array.isArray(test.questions)
        ? test.questions.some((question) => question.type === "descriptive")
        : false
    ).length;

    if (descriptiveTests) {
      items.push({
        iconClass: "fas fa-pen-ruler",
        title: `${descriptiveTests} tests need manual review`,
        meta: "Descriptive responses are waiting for evaluation.",
        tone: "blue",
      });
    }

    return items.length
      ? items
      : [
          {
            iconClass: "fas fa-circle-check",
            title: "Everything looks good",
            meta: "No urgent alerts right now.",
            tone: "green",
          },
        ];
  }, [
    attendanceSummary.percentage,
    dashboardData.fees,
    dashboardData.homework,
    dashboardData.tests,
    filterRange,
  ]);

  const handleSearchKeyDown = (event) => {
    if (event.key !== "Enter") return;

    const firstMatch = filteredMenuItems[0];

    if (firstMatch) {
      setActiveTab(firstMatch.key);
      setMobileSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const renderDashboardHome = () => (
    <div className="td-dashboard-home">
      <section className="td-hero-card">
        <div className="td-hero-copy">
          <span className="td-eyebrow">Teacher Dashboard</span>
          <h1>Keep classes, content, and performance in one calm workspace.</h1>
          <p>
            Track attendance, study material delivery, tests, and upcoming
            deadlines with a dashboard designed for daily teaching flow.
          </p>
          <div className="td-hero-tags">
            <span>{dashboardStats.students} students</span>
            <span>{dashboardStats.materials} materials</span>
            <span>{dashboardStats.tests} tests</span>
          </div>
        </div>

        <div className="td-hero-aside">
          <div className="td-highlight-card">
            <span>Quick Focus</span>
            <strong>
              {upcomingTasks[0]?.title || "No urgent task"}
            </strong>
            <p>{upcomingTasks[0]?.meta || "You are all caught up today."}</p>
          </div>
        </div>
      </section>

      <section className="td-stats-grid">
        <DashboardStatCard
          iconClass="fas fa-user-graduate"
          label="Total Students"
          value={dashboardStats.students}
          accent="violet"
          loading={loading}
        />
        <DashboardStatCard
          iconClass="fas fa-calendar-check"
          label="Attendance"
          value={dashboardStats.attendance}
          suffix="%"
          accent="blue"
          loading={loading}
        />
        <DashboardStatCard
          iconClass="fas fa-folder-open"
          label="Total Materials"
          value={dashboardStats.materials}
          accent="green"
          loading={loading}
        />
        <DashboardStatCard
          iconClass="fas fa-file-lines"
          label="Total Tests"
          value={dashboardStats.tests}
          accent="amber"
          loading={loading}
        />
      </section>

      <section className="td-dashboard-grid">
        <article className="td-panel td-chart-panel">
          <div className="td-panel-head">
            <div>
              <span className="td-panel-label">Attendance Trend</span>
              <h3>Daily classroom consistency</h3>
            </div>
            <span className="td-panel-pill">{filterRange}</span>
          </div>
          <div className="td-chart-wrap">
            {loading ? (
              <div className="td-skeleton td-chart-skeleton"></div>
            ) : attendanceTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={attendanceTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="attendance"
                    stroke="#5b5ce2"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#5b5ce2" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="td-empty-chart">
                <span className="td-empty-chart-icon">📊</span>
                <p>No attendance data yet.</p>
                <span>Start marking attendance to view trends.</span>
              </div>
            )}
          </div>
        </article>

        <article className="td-panel td-chart-panel">
          <div className="td-panel-head">
            <div>
              <span className="td-panel-label">Performance Snapshot</span>
              <h3>Subject-wise average score</h3>
            </div>
            <span className="td-panel-pill">Auto insights</span>
          </div>
          <div className="td-chart-wrap">
            {loading ? (
              <div className="td-skeleton td-chart-skeleton"></div>
            ) : performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.18)" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar
                    dataKey="score"
                    radius={[10, 10, 0, 0]}
                    fill="url(#teacherPerformanceGradient)"
                  />
                  <defs>
                    <linearGradient
                      id="teacherPerformanceGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#2dd4bf" />
                      <stop offset="100%" stopColor="#5b5ce2" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="td-empty-chart">
                <span className="td-empty-chart-icon">📈</span>
                <p>No performance data yet.</p>
                <span>Create tests and evaluate students to see insights.</span>
              </div>
            )}
          </div>
        </article>

        <article className="td-panel">
          <div className="td-panel-head">
            <div>
              <span className="td-panel-label">Recent Activity</span>
              <h3>Latest actions</h3>
            </div>
          </div>
          <div className="td-stack">
            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div className="td-skeleton td-list-skeleton" key={index}></div>
                ))
              : recentActivities.map((activity, index) => (
                  <DashboardActivityItem key={`${activity.title}-${index}`} {...activity} />
                ))}
          </div>
        </article>

        <article className="td-panel">
          <div className="td-panel-head">
            <div>
              <span className="td-panel-label">Upcoming Tasks</span>
              <h3>What needs attention next</h3>
            </div>
          </div>
          <div className="td-stack">
            {loading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div className="td-skeleton td-list-skeleton" key={index}></div>
                ))
              : upcomingTasks.map((task, index) => (
                  <DashboardActivityItem key={`${task.title}-${index}`} {...task} />
                ))}
          </div>
        </article>

        <article className="td-panel td-panel-wide">
          <div className="td-panel-head">
            <div>
              <span className="td-panel-label">Notifications</span>
              <h3>Alerts and reminders</h3>
            </div>
          </div>
          <div className="td-notification-grid">
            {loading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div className="td-skeleton td-notification-skeleton" key={index}></div>
                ))
              : notifications.map((item, index) => (
                  <DashboardActivityItem key={`${item.title}-${index}`} {...item} />
                ))}
          </div>
        </article>
      </section>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return renderDashboardHome();
      case "students":
        return <StudentsModule />;
      case "attendance":
        return <AttendanceModule />;
      case "fees":
        return <FeesModule />;
      case "subjects":
        return <TeacherSubjects />;
      case "materials":
        return <TeacherMaterials />;
      case "homework":
        return <TeacherHomework />;
      case "tests":
        return <TeacherTests />;
      case "notifications":
        return <TeacherNotifications />;
      default:
        return renderDashboardHome();
    }
  };

  if (user && user.role !== "teacher") {
    return (
      <div className="td-auth-guard">
        <div className="td-auth-card">
          <h2>Teacher access only</h2>
          <p>This workspace is available only for teacher accounts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`td-wrapper ${darkMode ? "dark" : ""}`}>
      <DashboardSidebar
        instituteName="CoachEdu Institute"
        items={filteredMenuItems.length ? filteredMenuItems : menuItems}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        collapsed={collapsedSidebar}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="td-main-shell">
        <DashboardTopbar
          user={user}
          darkMode={darkMode}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onSearchKeyDown={handleSearchKeyDown}
          filterRange={filterRange}
          onFilterChange={setFilterRange}
          onToggleSidebar={() => {
            if (window.innerWidth <= 1024) {
              setMobileSidebarOpen((current) => !current);
            } else {
              setCollapsedSidebar((current) => !current);
            }
          }}
          onToggleDarkMode={() => setDarkMode((current) => !current)}
          onLogout={handleLogout}
          activeTab={activeTab}
        />

        <main className="td-main">{renderActiveTab()}</main>
      </div>
    </div>
  );
};

export default TeacherDashboard;
