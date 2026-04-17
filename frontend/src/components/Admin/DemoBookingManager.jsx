import { useState, useEffect, useRef } from 'react';
import { demoBookingsAPI } from '../../services/api';
import ConfirmDialog from '../ConfirmDialog';
import Toast from '../Toast';

const DemoBookingManager = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
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
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await demoBookingsAPI.getAll();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Failed to fetch demo bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.phone.includes(searchTerm);
    const matchesStatus =
      statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = async (id, newStatus, remarks = '') => {
    try {
      await demoBookingsAPI.updateStatus(id, {
        status: newStatus,
        adminRemarks: remarks,
      });
      fetchBookings();
      setSelectedBooking((prev) => ({
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

  const handleDelete = async (id, name) => {
    setDeleteDialog({ isOpen: true, id, name });
  };

  const confirmDelete = async () => {
    const { id, name } = deleteDialog;
    try {
      await demoBookingsAPI.delete(id);
      if (selectedBooking?._id === id) {
        setSelectedBooking(null);
      }
      setBookings((prev) => prev.filter((b) => b._id !== id));
      setToast({
        message: 'Demo booking deleted successfully!',
        type: 'success',
      });
    } catch (error) {
      console.error('Delete failed:', error);
      setToast({
        message: 'Failed to delete booking. Please try again.',
        type: 'error',
      });
    } finally {
      setDeleteDialog({ isOpen: false, id: null, name: '' });
    }
  };

  const cancelDelete = () => {
    setDeleteDialog({ isOpen: false, id: null, name: '' });
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
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
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading)
    return (
      <div className="admin-container">
        <h2 className="admin-header-title">Demo Booking Manager</h2>
        <div
          className="admin-card"
          style={{ textAlign: 'center', padding: '60px 20px' }}
        >
          <div
            className="loading-spinner"
            style={{ margin: '0 auto 20px' }}
          ></div>
          <p style={{ color: '#64748b' }}>Loading demo bookings...</p>
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

      <h2 className="admin-header-title">Demo Booking Manager</h2>

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
            placeholder="Search By Name or Phone"
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
            <option value="contacted">Contacted</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div
            style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}
          >
            {filteredBookings.length} results
          </div>
        </div>
      </div>

      <div
        className="admin-manager-layout"
        style={{ gridTemplateColumns: selectedBooking ? '1fr 1.2fr' : '1fr' }}
      >
        <div className="admin-card">
          <h4 style={{ marginBottom: '20px' }}>All Demo Bookings</h4>

          {filteredBookings.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#64748b',
              }}
            >
              <i
                className="fas fa-calendar-times"
                style={{ fontSize: '3rem', marginBottom: '20px', opacity: 0.3 }}
              ></i>
              <p
                style={{
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  marginBottom: '10px',
                }}
              >
                No demo bookings found
              </p>
              <p style={{ fontSize: '0.9rem' }}>
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Demo bookings will appear here once submitted'}
              </p>
            </div>
          ) : (
            <>
              <div className="enrollment-list-mobile">
                {filteredBookings.map((booking) => (
                  <div key={booking._id} className="enrollment-card-mobile">
                    <div className="enrollment-card-header">
                      <div>
                        <div className="enrollment-student-name">
                          {booking.name}
                        </div>
                        <div className="enrollment-date">
                          {formatDate(booking.createdAt)}
                        </div>
                      </div>
                      <span className={`status-badge ${booking.status}`}>
                        {booking.status.toUpperCase()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleViewDetails(booking)}
                      className="btn-action btn-view"
                      style={{ width: '100%', marginTop: '10px' }}
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleDelete(booking._id, booking.name)}
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
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking) => (
                      <tr key={booking._id}>
                        <td>{formatDate(booking.createdAt)}</td>
                        <td style={{ fontWeight: '600' }}>{booking.name}</td>
                        <td>{booking.user?.email || 'N/A'}</td>
                        <td>
                          <span className={`status-badge ${booking.status}`}>
                            {booking.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleViewDetails(booking)}
                            className="btn-action btn-view"
                            style={{ marginRight: '10px' }}
                          >
                            View
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(booking._id, booking.name)
                            }
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

        {selectedBooking && (
          <div
            ref={detailsPanelRef}
            className="admin-card fade-in enrollment-details-panel"
          >
            <div className="details-panel-header">
              <h3 style={{ margin: 0, color: '#1a237e' }}>
                Demo Booking Details
              </h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="close-btn"
              >
                &times;
              </button>
            </div>

            <div className="enrollment-details-top">
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
                  className="fas fa-calendar-check"
                  style={{ fontSize: '3rem', color: '#667eea' }}
                ></i>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '15px' }}>
                  <label className="detail-label">Status</label>
                  <select
                    value={selectedBooking.status}
                    onChange={(e) =>
                      handleStatusUpdate(
                        selectedBooking._id,
                        e.target.value,
                        selectedBooking.adminRemarks
                      )
                    }
                    className="form-input"
                  >
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="detail-label">Feedback</label>
                  <textarea
                    value={selectedBooking.adminRemarks || ''}
                    onChange={(e) =>
                      setSelectedBooking({
                        ...selectedBooking,
                        adminRemarks: e.target.value,
                      })
                    }
                    placeholder="Add notes or remarks about this booking"
                    className="form-input"
                    style={{ minHeight: '80px' }}
                  />
                  <button
                    onClick={() =>
                      handleStatusUpdate(
                        selectedBooking._id,
                        selectedBooking.status,
                        selectedBooking.adminRemarks
                      )
                    }
                    className="btn-primary w-100 mt-2"
                  >
                    Update Status & Remarks
                  </button>
                </div>
              </div>
            </div>

            <div className="details-grid">
              <div>
                <label className="detail-label">Student Name</label>
                <p className="info-value">{selectedBooking.name}</p>
              </div>
              <div>
                <label className="detail-label">Email</label>
                <p className="info-value">
                  {selectedBooking.user?.email || 'N/A'}
                </p>
              </div>
              <div>
                <label className="detail-label">Phone Number</label>
                <p className="info-value">
                  <a
                    href={`tel:${selectedBooking.phone}`}
                    style={{ color: '#667eea', textDecoration: 'none' }}
                  >
                    <i className="fas fa-phone"></i> {selectedBooking.phone}
                  </a>
                </p>
              </div>
              <div>
                <label className="detail-label">Preferred Date</label>
                <p className="info-value">
                  {formatDate(selectedBooking.preferredDate)}
                </p>
              </div>
              <div>
                <label className="detail-label">Preferred Time</label>
                <p className="info-value">{selectedBooking.preferredTime}</p>
              </div>
              <div>
                <label className="detail-label">Booking Date</label>
                <p className="info-value">
                  {formatDate(selectedBooking.createdAt)}
                </p>
              </div>
              <div>
                <label className="detail-label">Current Status</label>
                <p className="info-value">
                  <span className={`status-badge ${selectedBooking.status}`}>
                    {selectedBooking.status.toUpperCase()}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Demo Booking"
        message={`Are you sure you want to delete ${deleteDialog.name}'s demo booking? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};

export default DemoBookingManager;
