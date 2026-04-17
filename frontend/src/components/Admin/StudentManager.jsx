import { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';

const StudentManager = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [performance, setPerformance] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await authAPI.getAllStudents();
      setStudents(res.students);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleViewStats = async (student) => {
    setSelectedStudent(student);
    setPerformance([
      { chapter: 'Real Numbers', score: 8, total: 10, date: '2023-10-20' },
      { chapter: 'Polynomials', score: 7, total: 10, date: '2023-10-22' },
    ]);
  };

  if (loading)
    return <div className="admin-container">Loading students...</div>;

  return (
    <div className="admin-container">
      <h2 className="admin-header-title">Student Manager</h2>

      <div
        className="admin-manager-layout"
        style={{ gridTemplateColumns: selectedStudent ? '1fr 1fr' : '1fr' }}
      >
        <div className="admin-card">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id}>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    <td>
                      <button
                        onClick={() => handleViewStats(student)}
                        className="btn-action btn-view"
                      >
                        View Performance
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedStudent && (
          <div className="admin-card fade-in">
            <div className="details-panel-header">
              <h3>{selectedStudent.name}'s Performance</h3>
              <button
                onClick={() => setSelectedStudent(null)}
                className="close-btn"
              >
                Close
              </button>
            </div>
            <div style={{ display: 'grid', gap: '15px' }}>
              {performance.map((p, i) => (
                <div
                  key={i}
                  className="info-display-card"
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <div>
                    <h5 style={{ margin: 0 }}>{p.chapter}</h5>
                    <small style={{ color: '#666' }}>{p.date}</small>
                  </div>
                  <div style={{ color: '#1a237e', fontWeight: 'bold' }}>
                    {p.score} / {p.total} (
                    {Math.round((p.score / p.total) * 100)}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentManager;
