import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { demoBookingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Toast from './Toast';

const DemoBooking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    preferredDate: '',
    preferredTime: '',
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await demoBookingsAPI.create(formData);
      setToast({
        message: 'Demo booked successfully! Our team will contact you soon.',
        type: 'success',
      });
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      console.error('Demo booking failed:', error);
      setToast({
        message:
          error.response?.data?.message || 'Booking failed. Please try again.',
        type: 'error',
      });
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="demo-success-container">
        <div className="success-card">
          <div className="success-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <h2>Demo Booked Successfully!</h2>
          <p>
            Our team will connect with you within 24 hours to confirm your demo
            session.
          </p>
          <p className="contact-info">
            You can also reach us at:{' '}
            <strong>mysuccessmantrainstitute@gmail.com</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="demo-booking-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="demo-container">
        <div className="demo-header">
          <h1>Book Your Free Demo</h1>
          <p>
            Experience our teaching methodology firsthand. Schedule a free demo
            class today!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="demo-form">
          <div className="form-field">
            <label className="modern-label">
              Full Name <span className="required">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              className="modern-input"
            />
          </div>

          <div className="form-field">
            <label className="modern-label">
              Phone Number <span className="required">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter 10-digit mobile number"
              pattern="[0-9]{10}"
              maxLength="10"
              required
              className="modern-input"
            />
          </div>

          <div className="form-field">
            <label className="modern-label">
              Preferred Date <span className="required">*</span>
            </label>
            <input
              type="date"
              name="preferredDate"
              value={formData.preferredDate}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              required
              className="modern-input"
            />
          </div>

          <div className="form-field">
            <label className="modern-label">
              Preferred Time <span className="required">*</span>
            </label>
            <select
              name="preferredTime"
              value={formData.preferredTime}
              onChange={handleChange}
              required
              className="modern-input"
            >
              <option value="">Select Time</option>
              <option value="09:00 AM">09:00 AM</option>
              <option value="10:00 AM">10:00 AM</option>
              <option value="11:00 AM">11:00 AM</option>
              <option value="12:00 PM">12:00 PM</option>
              <option value="02:00 PM">02:00 PM</option>
              <option value="03:00 PM">03:00 PM</option>
              <option value="04:00 PM">04:00 PM</option>
              <option value="05:00 PM">05:00 PM</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn-primary submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Booking...' : 'Book Demo'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DemoBooking;
