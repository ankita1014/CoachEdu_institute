import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import Toast from "./Toast";
import FilterTabs from "./teacherDashboard/FilterTabs";
import NotificationCard from "./teacherDashboard/NotificationCard";
import NotificationFormModal from "./teacherDashboard/NotificationFormModal";
import NotificationTable from "./teacherDashboard/NotificationTable";
import { useAuth } from "../context/AuthContext";
import "./TeacherNotifications.css";

const API_BASE_URL = "http://localhost:5000/api";
const PAGE_SIZE = 5;

const initialForm = {
  title: "",
  message: "",
  type: "general",
  audience: "students",
  className: "All Classes",
  recipients: [],
  sendMode: "now",
  scheduleDate: "",
  scheduleTime: "",
  sendSms: false,
  sendEmail: false,
  sendApp: true,
};

const tabOptions = [
  { value: "all", label: "All" },
  { value: "sent", label: "Sent" },
  { value: "scheduled", label: "Scheduled" },
  { value: "draft", label: "Drafts" },
];

const formatStatusLabel = (value) =>
  value.charAt(0).toUpperCase() + value.slice(1);

const TeacherNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [homework, setHomework] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewingNotification, setViewingNotification] = useState(null);

  const teacherId = user?.teacherId || user?._id || user?.id || "";
  const teacherName = user?.name || "Teacher";
  const classOptions = useMemo(
    () =>
      Array.from(
        new Set(students.map((student) => student.class).filter(Boolean))
      ),
    [students]
  );

  const loadAll = async () => {
    setLoading(true);

    try {
      const [
        notificationsRes,
        studentsRes,
        feesRes,
        homeworkRes,
        testsRes,
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/teacher/notifications?teacherId=${teacherId}`),
        fetch(`${API_BASE_URL}/student/students`),
        fetch(`${API_BASE_URL}/student/fees`),
        fetch(`${API_BASE_URL}/teacher/homework?teacherId=${teacherId}`),
        fetch(`${API_BASE_URL}/teacher/tests?teacherId=${teacherId}`),
      ]);

      const [notificationsData, studentsData, feesData, homeworkData, testsData] =
        await Promise.all([
          notificationsRes.json(),
          studentsRes.json(),
          feesRes.json(),
          homeworkRes.json(),
          testsRes.json(),
        ]);

      setNotifications(notificationsData.data || []);
      setStudents(studentsData.students || []);
      setFees(feesData.data || []);
      setHomework(homeworkData.data || []);
      setTests(testsData.data || []);
    } catch (error) {
      console.error(error);
      setToast({
        message: "Failed to load notifications. Please refresh and try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!teacherId) {
      setLoading(false);
      return;
    }
    loadAll();
  }, [teacherId]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const matchesTab = activeTab === "all" ? true : item.status === activeTab;
      const matchesType = typeFilter === "all" ? true : item.type === typeFilter;
      const matchesAudience =
        audienceFilter === "all" ? true : item.audience === audienceFilter;
      const matchesDate = dateFilter
        ? [item.sentAt, item.scheduledAt, item.createdAt]
            .filter(Boolean)
            .some((value) => String(value).slice(0, 10) === dateFilter)
        : true;
      const query = search.trim().toLowerCase();
      const matchesSearch = query
        ? `${item.title} ${item.message}`.toLowerCase().includes(query)
        : true;

      return (
        matchesTab &&
        matchesType &&
        matchesAudience &&
        matchesDate &&
        matchesSearch
      );
    });
  }, [activeTab, audienceFilter, dateFilter, notifications, search, typeFilter]);

  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredNotifications.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredNotifications]);

  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, typeFilter, audienceFilter, dateFilter]);

  const stats = useMemo(
    () => ({
      total: notifications.length,
      sent: notifications.filter((item) => item.status === "sent").length,
      scheduled: notifications.filter((item) => item.status === "scheduled").length,
      failed: notifications.filter((item) => item.status === "failed").length,
    }),
    [notifications]
  );

  const autoReminders = useMemo(() => {
    const pendingFeesCount = fees.filter((item) => item.status !== "paid").length;
    const upcomingHomework = homework
      .filter((item) => item.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
    const upcomingTest = tests
      .filter((item) => item.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

    return [
      {
        key: "fees",
        title: "Fee Due Reminder",
        message: `${pendingFeesCount} fee records need follow-up with parents.`,
        type: "fees",
        audience: "parents",
      },
      {
        key: "homework",
        title: "Homework Deadline Alert",
        message: upcomingHomework
          ? `${upcomingHomework.title} is due soon for ${upcomingHomework.className}.`
          : "Create an automatic reminder for upcoming homework deadlines.",
        type: "homework",
        audience: "students",
      },
      {
        key: "test",
        title: "Test Alert",
        message: upcomingTest
          ? `${upcomingTest.title} is scheduled for ${upcomingTest.className}.`
          : "Send timely test alerts to prepare students and parents.",
        type: "test",
        audience: "both",
      },
    ];
  }, [fees, homework, tests]);

  const openCreateModal = (prefill = {}) => {
    setEditingNotification(null);
    setViewingNotification(null);
    setFormData({
      ...initialForm,
      ...prefill,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingNotification(item);
    setViewingNotification(null);

    const scheduledDate = item.scheduledAt ? String(item.scheduledAt).slice(0, 10) : "";
    const scheduledTime = item.scheduledAt
      ? new Date(item.scheduledAt).toISOString().slice(11, 16)
      : "";

    setFormData({
      title: item.title || "",
      message: item.message || "",
      type: item.type || "general",
      audience: item.audience || "students",
      className: item.className || "All Classes",
      recipients: (item.recipients || []).map((recipient) => recipient.studentId),
      sendMode: item.status === "scheduled" ? "later" : "now",
      scheduleDate: scheduledDate,
      scheduleTime: scheduledTime,
      sendSms: Boolean(item.channels?.sms),
      sendEmail: Boolean(item.channels?.email),
      sendApp: item.channels?.app !== false,
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleToggleRecipient = (studentId) => {
    setFormData((prev) => ({
      ...prev,
      recipients: prev.recipients.includes(studentId)
        ? prev.recipients.filter((id) => id !== studentId)
        : [...prev.recipients, studentId],
    }));
  };

  const buildRecipients = () => {
    const filteredStudents = students.filter((student) =>
      formData.className === "All Classes" ? true : student.class === formData.className
    );

    const selectedStudents = formData.recipients.length
      ? filteredStudents.filter((student) =>
          formData.recipients.includes(student.studentId)
        )
      : filteredStudents;

    return selectedStudents.map((student) => ({
      studentId: student.studentId,
      name: student.name,
      className: student.class,
      audience: formData.audience,
    }));
  };

  const submitNotification = async (action = "send") => {
    if (!formData.title.trim() || !formData.message.trim()) {
      setToast({ message: "Please add a title and message.", type: "error" });
      return;
    }

    if (formData.sendMode === "later" && (!formData.scheduleDate || !formData.scheduleTime)) {
      setToast({
        message: "Please choose schedule date and time.",
        type: "error",
      });
      return;
    }

    const recipients = buildRecipients();

    if (!recipients.length) {
      setToast({
        message: "Please select at least one student or class recipient.",
        type: "error",
      });
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        audience: formData.audience,
        className: formData.className,
        recipients,
        sendMode: formData.sendMode,
        scheduledAt:
          formData.sendMode === "later"
            ? `${formData.scheduleDate}T${formData.scheduleTime}:00`
            : null,
        channels: {
          sms: formData.sendSms,
          email: formData.sendEmail,
          app: formData.sendApp,
        },
        teacherId,
        teacherName,
        action,
      };

      const url = editingNotification
        ? `${API_BASE_URL}/teacher/notifications/${editingNotification._id}`
        : `${API_BASE_URL}/teacher/notifications`;
      const method = editingNotification ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Notification request failed");
      }

      setToast({
        message:
          action === "draft"
            ? "Notification saved as draft."
            : editingNotification
            ? "Notification updated successfully."
            : "Notification sent successfully.",
        type: "success",
      });
      setIsModalOpen(false);
      setEditingNotification(null);
      setFormData(initialForm);
      await loadAll();
    } catch (error) {
      console.error(error);
      setToast({
        message: error.message || "Failed to save notification.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/teacher/notifications/${confirmDelete._id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Delete failed");
      }
      setToast({ message: "Notification deleted.", type: "success" });
      setConfirmDelete(null);
      await loadAll();
    } catch (error) {
      console.error(error);
      setToast({ message: error.message || "Delete failed.", type: "error" });
    }
  };

  const handleRetry = async (item) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/teacher/notifications/${item._id}/retry`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Retry failed");
      }
      setToast({ message: "Notification retried successfully.", type: "success" });
      await loadAll();
    } catch (error) {
      console.error(error);
      setToast({ message: error.message || "Retry failed.", type: "error" });
    }
  };

  return (
    <div className="teacher-notifications-page">
      <section className="tn-header">
        <div className="tn-header-copy">
          <span className="td-eyebrow">Communication Hub</span>
          <div className="tn-header-icon">
            <i className="fas fa-bell"></i>
          </div>
          <h2>Notifications & Reminders</h2>
          <p>
            Send fee reminders, homework alerts, test notices, and important
            announcements to students and parents from one organized center.
          </p>
        </div>

        <button className="tn-primary-btn" onClick={() => openCreateModal()}>
          <i className="fas fa-plus"></i> Create Notification
        </button>
      </section>

      <section className="tn-stats-grid">
        <div className="tn-stat-card">
          <span>Total Notifications</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="tn-stat-card">
          <span>Sent</span>
          <strong>{stats.sent}</strong>
        </div>
        <div className="tn-stat-card">
          <span>Scheduled</span>
          <strong>{stats.scheduled}</strong>
        </div>
        <div className="tn-stat-card">
          <span>Failed</span>
          <strong>{stats.failed}</strong>
        </div>
      </section>

      <section className="tn-filter-bar">
        <FilterTabs
          options={tabOptions}
          value={activeTab}
          onChange={setActiveTab}
        />

        <div className="tn-filter-row">
          <input
            type="text"
            placeholder="Search title or message..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="all">All Types</option>
            <option value="fees">Fees</option>
            <option value="homework">Homework</option>
            <option value="test">Test</option>
            <option value="general">General</option>
          </select>
          <select
            value={audienceFilter}
            onChange={(event) => setAudienceFilter(event.target.value)}
          >
            <option value="all">All Audience</option>
            <option value="students">Students</option>
            <option value="parents">Parents</option>
            <option value="both">Both</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
          />
        </div>
      </section>

      <section className="tn-auto-grid">
        {autoReminders.map((item) => (
          <article key={item.key} className="tn-auto-card">
            <div className="tn-auto-card-header">
              <h4>{item.title}</h4>
              <span className={`tn-type-badge tone-${item.type}`}>{item.type}</span>
            </div>
            <p>{item.message}</p>
            <button
              onClick={() =>
                openCreateModal({
                  title: item.title,
                  message: item.message,
                  type: item.type,
                  audience: item.audience,
                })
              }
            >
              Use Auto Reminder
            </button>
          </article>
        ))}
      </section>

      {loading ? (
        <section className="tn-loading-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="td-skeleton tn-loading-card"></div>
          ))}
        </section>
      ) : filteredNotifications.length ? (
        <>
          <section className="tn-card-grid">
            {filteredNotifications.slice(0, 4).map((item) => (
              <NotificationCard
                key={item._id}
                item={item}
                onView={setViewingNotification}
                onEdit={openEditModal}
                onDelete={setConfirmDelete}
                onRetry={handleRetry}
              />
            ))}
          </section>

          <section className="tn-table-wrap">
            <div className="td-panel-head">
              <div>
                <span className="td-panel-label">History</span>
                <h3>Notification History</h3>
              </div>
            </div>
            <NotificationTable
              items={paginatedNotifications}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onView={setViewingNotification}
              onEdit={openEditModal}
              onDelete={setConfirmDelete}
              onRetry={handleRetry}
            />
          </section>
        </>
      ) : (
        <section className="tn-empty">
          <i className="fas fa-bell-slash"></i>
          <h3>No notifications yet</h3>
          <p>Create your first reminder to start communicating with students and parents.</p>
        </section>
      )}

      <NotificationFormModal
        isOpen={isModalOpen}
        formData={formData}
        students={students.filter((student) =>
          formData.className === "All Classes" ? true : student.class === formData.className
        )}
        classOptions={classOptions}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNotification(null);
          setFormData(initialForm);
        }}
        onChange={handleFormChange}
        onToggleRecipient={handleToggleRecipient}
        onSubmit={() => submitNotification("send")}
        onSaveDraft={() => submitNotification("draft")}
        editing={Boolean(editingNotification)}
        loading={submitting}
      />

      <NotificationFormModal
        isOpen={Boolean(viewingNotification) && !isModalOpen}
        formData={{
          title: viewingNotification?.title || "",
          message: viewingNotification?.message || "",
          type: viewingNotification?.type || "general",
          audience: viewingNotification?.audience || "students",
          className: viewingNotification?.className || "All Classes",
          recipients: (viewingNotification?.recipients || []).map(
            (recipient) => recipient.studentId
          ),
          sendMode: viewingNotification?.status === "scheduled" ? "later" : "now",
          scheduleDate: viewingNotification?.scheduledAt
            ? String(viewingNotification.scheduledAt).slice(0, 10)
            : "",
          scheduleTime: viewingNotification?.scheduledAt
            ? new Date(viewingNotification.scheduledAt).toISOString().slice(11, 16)
            : "",
          sendSms: Boolean(viewingNotification?.channels?.sms),
          sendEmail: Boolean(viewingNotification?.channels?.email),
          sendApp: viewingNotification?.channels?.app !== false,
        }}
        students={students}
        classOptions={classOptions}
        onClose={() => setViewingNotification(null)}
        onChange={() => {}}
        onToggleRecipient={() => {}}
        onSubmit={() => setViewingNotification(null)}
        onSaveDraft={() => setViewingNotification(null)}
        editing={false}
        loading={false}
        readOnly
      />

      <ConfirmDialog
        isOpen={Boolean(confirmDelete)}
        title="Delete notification?"
        message="This will permanently remove the selected notification from the history."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

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

export default TeacherNotifications;
