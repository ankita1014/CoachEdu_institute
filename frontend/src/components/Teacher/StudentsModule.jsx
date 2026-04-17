import { useEffect, useState, useCallback } from "react";
import AddStudentModal from "./AddStudentModal";
import StudentProfileModal from "./StudentProfileModal";
import Toast from "../Toast";
import "./StudentsModule.css";

const API = "http://localhost:5000/api/student";

const StudentModule = () => {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [toast, setToast] = useState(null); // { message, type }
  const [loading, setLoading] = useState(true);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/students`);
      const data = await res.json();
      setStudents(data.students || []);
    } catch {
      showToast("Failed to load students", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const handleStudentAdded = (newStudent, parent) => {
    setStudents((prev) => [...prev, newStudent]);
    setShowModal(false);
    const msg = parent
      ? `Student added. Parent ID: ${parent.parentId} · Password: ${parent.password}`
      : "Student added successfully";
    showToast(msg);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student?")) return;
    try {
      const res = await fetch(`${API}/students/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setStudents((prev) => prev.filter((s) => s._id !== id));
        showToast("Student deleted");
      } else {
        showToast(data.message || "Delete failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    }
  };

  const filtered = students.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.studentId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="student-wrapper">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Profile Modal */}
      {viewingStudent && (
        <StudentProfileModal
          student={viewingStudent}
          onClose={() => setViewingStudent(null)}
          onDeleted={(id) => {
            setStudents((prev) => prev.filter((s) => s._id !== id));
            setViewingStudent(null);
            showToast("Student deleted");
          }}
          onUpdated={(updated) => {
            setStudents((prev) => prev.map((s) => s._id === updated._id ? updated : s));
            showToast("Student updated");
          }}
        />
      )}

      {/* Add Modal */}
      {showModal && (
        <AddStudentModal
          onClose={() => setShowModal(false)}
          onSuccess={handleStudentAdded}
        />
      )}

      {/* Header */}
      <div className="student-header">
        <div>
          <h2>👨‍🎓 Students</h2>
          <p>Manage all your students here</p>
        </div>
        <button className="add-btn" onClick={() => setShowModal(true)}>
          + Add Student
        </button>
      </div>

      {/* Search */}
      <input
        className="search-bar"
        placeholder="Search students..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* List */}
      {loading ? (
        <p style={{ color: "#94a3b8", textAlign: "center", marginTop: "40px" }}>
          Loading students...
        </p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "#94a3b8", textAlign: "center", marginTop: "40px" }}>
          No students found.
        </p>
      ) : (
        <div className="student-grid">
          {filtered.map((s) => (
            <div className="student-card" key={s._id}>
              <div className="avatar">{s.name?.charAt(0)?.toUpperCase()}</div>
              <div className="info">
                <h4>{s.name}</h4>
                <p>{s.studentId}</p>
                <span className="class-tag">{s.class}</span>
              </div>
              <div className="actions">
                <button className="view" onClick={() => setViewingStudent(s)}>View</button>
                <button className="delete" onClick={() => handleDelete(s._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentModule;
