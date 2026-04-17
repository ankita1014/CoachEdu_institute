import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { enrollmentsAPI } from '../../services/api';
import ConfirmDialog from '../ConfirmDialog';
import Toast from '../Toast';

const EnrollmentManager = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    id: null,
    name: '',
  });
  const [toast, setToast] = useState(null);
  const detailsPanelRef = useRef(null);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  useEffect(() => {
    const enrollmentId = searchParams.get('id');
    const action = searchParams.get('action');

    if (enrollmentId && action && enrollments.length > 0) {
      const enrollment = enrollments.find((e) => e._id === enrollmentId);
      if (enrollment) {
        setSelectedEnrollment(enrollment);
        if (action === 'approve' || action === 'cancel') {
          const newStatus = action === 'approve' ? 'active' : 'cancelled';
          handleQuickAction(enrollmentId, newStatus, action);
          setSearchParams({});
        }
      }
    }
  }, [enrollments, searchParams]);

  const handleQuickAction = async (id, newStatus, action) => {
    try {
      await enrollmentsAPI.updateStatus(id, {
        status: newStatus,
        adminRemarks: '',
      });
      fetchEnrollments();
      setSelectedEnrollment((prev) => ({
        ...prev,
        status: newStatus,
        adminRemarks: '',
      }));
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDelete = async (id, studentName) => {
    setDeleteDialog({ isOpen: true, id, name: studentName });
  };

  const confirmDelete = async () => {
    const { id, name } = deleteDialog;
    try {
      await enrollmentsAPI.delete(id);
      if (selectedEnrollment?._id === id) {
        setSelectedEnrollment(null);
      }
      setEnrollments((prev) => prev.filter((en) => en._id !== id));
      setToast({
        message: 'Enrollment deleted successfully!',
        type: 'success',
      });
    } catch (error) {
      console.error('Delete failed:', error);
      setToast({
        message: 'Failed to delete enrollment. Please try again.',
        type: 'error',
      });
    } finally {
      setDeleteDialog({ isOpen: false, id: null, name: '' });
    }
  };

  const cancelDelete = () => {
    setDeleteDialog({ isOpen: false, id: null, name: '' });
  };

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const res = await enrollmentsAPI.getAll();
      setEnrollments(res.enrollments || []);
    } catch (error) {
      console.error('Failed to fetch enrollments:', error);
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEnrollments = enrollments.filter((en) => {
    const matchesSearch =
      en.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      en.fatherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      en.mobileNumber.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || en.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = async (id, newStatus, remarks = '') => {
    try {
      await enrollmentsAPI.updateStatus(id, {
        status: newStatus,
        adminRemarks: remarks,
      });
      fetchEnrollments();
      setSelectedEnrollment((prev) => ({
        ...prev,
        status: newStatus,
        adminRemarks: remarks,
      }));
      setToast({ message: 'Status updated successfully!', type: 'success' });
    } catch (error) {
      console.error('Failed to update status:', error);
      setToast({
        message: 'Failed to update status. Please try again.',
        type: 'error',
      });
    }
  };

  const handleViewDetails = async (enrollment) => {
    try {
      const { enrollment: fullDetails } = await enrollmentsAPI.getById(
        enrollment._id
      );
      setSelectedEnrollment(fullDetails);
      setTimeout(() => {
        if (detailsPanelRef.current) {
          const headerHeight = 80;
          const elementPosition =
            detailsPanelRef.current.getBoundingClientRect().top;
          const offsetPosition =
            elementPosition + window.pageYOffset - headerHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
        }
      }, 100);
    } catch (error) {
      console.error('Failed to load enrollment details:', error);
      setSelectedEnrollment(enrollment);
      setTimeout(() => {
        if (detailsPanelRef.current) {
          const headerHeight = 80;
          const elementPosition =
            detailsPanelRef.current.getBoundingClientRect().top;
          const offsetPosition =
            elementPosition + window.pageYOffset - headerHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
        }
      }, 100);
    }
  };

  if (loading)
    return (
      <div className="admin-container">
        <h2 className="admin-header-title">Enrollment Manager</h2>
        <div
          className="admin-card"
          style={{ textAlign: 'center', padding: '60px 20px' }}
        >
          <div
            className="loading-spinner"
            style={{ margin: '0 auto 20px' }}
          ></div>
          <p style={{ color: '#64748b' }}>Loading enrollments...</p>
        </div>
      </div>
    );

  return (
    <div className="admin-container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <h2 className="admin-header-title">Enrollment Manager</h2>

      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'flex',
            gap: '15px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            placeholder="Search By Students Details"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: '1',
              minWidth: '200px',
              padding: '10px 15px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 15px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div style={{ color: '#666', fontSize: '14px', fontWeight: '500' }}>
            {filteredEnrollments.length} results
          </div>
        </div>
      </div>

      <div
        className="admin-manager-layout"
        style={{
          gridTemplateColumns: selectedEnrollment ? '1fr 1.2fr' : '1fr',
        }}
      >
        <div className="admin-card">
          <h4 style={{ marginBottom: '20px' }}>All Submissions</h4>

          {filteredEnrollments.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#64748b',
              }}
            >
              <i
                className="fas fa-inbox"
                style={{ fontSize: '3rem', marginBottom: '20px', opacity: 0.3 }}
              ></i>
              <p
                style={{
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  marginBottom: '10px',
                }}
              >
                No enrollments found
              </p>
              <p style={{ fontSize: '0.9rem' }}>
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter'
                  : 'No students have submitted enrollment forms yet'}
              </p>
            </div>
          ) : (
            <>
              <div className="enrollment-list-mobile">
                {filteredEnrollments.map((en) => (
                  <div key={en._id} className="enrollment-card-mobile">
                    <div className="enrollment-card-header">
                      <div>
                        <div className="enrollment-student-name">
                          {en.studentName}
                        </div>
                        <div className="enrollment-date">
                          {new Date(en.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span className={`status-badge ${en.status}`}>
                        {en.status === 'completed'
                          ? 'COMPLETED'
                          : en.status.toUpperCase()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleViewDetails(en)}
                      className="btn-action btn-view"
                      style={{ width: '100%', marginTop: '10px' }}
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleDelete(en._id, en.studentName)}
                      className="btn-action"
                      style={{
                        width: '100%',
                        marginTop: '10px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>

              <div className="admin-table-wrapper enrollment-table-desktop">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Student Name</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEnrollments.map((en) => (
                      <tr key={en._id}>
                        <td>{new Date(en.createdAt).toLocaleDateString()}</td>
                        <td style={{ fontWeight: '600' }}>{en.studentName}</td>
                        <td>
                          <span className={`status-badge ${en.status}`}>
                            {en.status === 'completed'
                              ? 'ADMISSION COMPLETED'
                              : en.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleViewDetails(en)}
                            className="btn-action btn-view"
                            style={{ marginRight: '10px' }}
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleDelete(en._id, en.studentName)}
                            className="btn-action"
                            style={{
                              backgroundColor: '#dc3545',
                              color: 'white',
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {selectedEnrollment && (
          <div
            ref={detailsPanelRef}
            className="admin-card fade-in enrollment-details-panel"
          >
            <div className="details-panel-header">
              <h3 style={{ margin: 0, color: '#1a237e' }}>Admission Details</h3>
              <button
                onClick={() => setSelectedEnrollment(null)}
                className="close-btn"
              >
                &times;
              </button>
            </div>

            <div className="enrollment-details-top">
              {selectedEnrollment.photo ? (
                <img
                  src={selectedEnrollment.photo}
                  alt="Student"
                  className="student-photo-preview-large"
                />
              ) : (
                <div
                  className="student-photo-preview-large"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f8fafc',
                  }}
                >
                  <i
                    className="fas fa-user-circle"
                    style={{ fontSize: '3rem', color: '#cbd5e1' }}
                  ></i>
                </div>
              )}
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 10px 0', fontWeight: '800' }}>
                  {selectedEnrollment.studentName}
                </h4>
                <p
                  style={{
                    color: '#64748b',
                    marginBottom: '15px',
                    wordBreak: 'break-all',
                  }}
                >
                  Application ID: <br />
                  <small>{selectedEnrollment._id}</small>
                </p>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px',
                  }}
                >
                  <div>
                    <label className="detail-label">Status</label>
                    <select
                      value={selectedEnrollment.status}
                      onChange={(e) =>
                        setSelectedEnrollment({
                          ...selectedEnrollment,
                          status: e.target.value,
                        })
                      }
                      className="form-input"
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active (Approve)</option>
                      <option value="cancelled">Cancel (Reject)</option>
                    </select>
                  </div>

                  <div>
                    <label className="detail-label">Feedback / Reason</label>
                    <textarea
                      value={selectedEnrollment.adminRemarks || ''}
                      onChange={(e) =>
                        setSelectedEnrollment({
                          ...selectedEnrollment,
                          adminRemarks: e.target.value,
                        })
                      }
                      placeholder="e.g. Please upload a clearer photo or fix Aadhar number"
                      className="form-input"
                      style={{ minHeight: '80px' }}
                    />
                    <button
                      onClick={() =>
                        handleStatusUpdate(
                          selectedEnrollment._id,
                          selectedEnrollment.status,
                          selectedEnrollment.adminRemarks
                        )
                      }
                      className="btn-primary w-100 mt-2"
                    >
                      Update Status & Remarks
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="details-grid">
              <div>
                <label className="detail-label">Father's Name</label>
                <p className="info-value">{selectedEnrollment.fatherName}</p>
              </div>
              <div>
                <label className="detail-label">Mother's Name</label>
                <p className="info-value">{selectedEnrollment.motherName}</p>
              </div>
              <div>
                <label className="detail-label">Date of Birth</label>
                <p className="info-value">
                  {selectedEnrollment.dateOfBirth.day}/
                  {selectedEnrollment.dateOfBirth.month}/
                  {selectedEnrollment.dateOfBirth.year}
                </p>
              </div>
              <div>
                <label className="detail-label">Gender</label>
                <p
                  className="info-value"
                  style={{ textTransform: 'capitalize' }}
                >
                  {selectedEnrollment.gender}
                </p>
              </div>
              <div className="details-grid-full">
                <label className="detail-label">Aadhar Number</label>
                <p className="info-value" style={{ letterSpacing: '1px' }}>
                  {selectedEnrollment.aadharNumber}
                </p>
              </div>
              <div>
                <label className="detail-label">Mobile Number</label>
                <p className="info-value">{selectedEnrollment.mobileNumber}</p>
              </div>
              <div className="details-grid-full">
                <label className="detail-label">Address</label>
                <p className="info-value">{selectedEnrollment.address}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Enrollment"
        message={`Are you sure you want to delete ${deleteDialog.name}'s enrollment? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};

export default EnrollmentManager;
