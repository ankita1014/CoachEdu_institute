import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/InquiryPage.css';

const INQUIRY_TYPES = ['Admission', 'Course Details', 'Fees', 'General Query'];
const empty = { name: '', email: '', phone: '', type: '', message: '' };

const InquiryPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(form.phone.replace(/\s+/g, ''))) e.phone = 'Enter a valid 10-digit number';
    if (!form.type) e.type = 'Please select an inquiry type';
    if (!form.message.trim()) e.message = 'Message is required';
    return e;
  };

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await fetch('import.meta.env.VITE_API_URL/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Submission failed');
      setSuccess(true);
      setForm(empty);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="iq-page">
      {/* ── breadcrumb nav ── */}
      <div className="iq-nav">
        <div className="iq-nav-inner">
          <Link to="/" className="iq-nav-back">
            <i className="fas fa-arrow-left"></i> Back to Home
          </Link>
          <span className="iq-nav-crumb">
            <Link to="/">Home</Link>
            <i className="fas fa-chevron-right"></i>
            <span>Inquiry</span>
          </span>
        </div>
      </div>

      <div className="iq-container">
        {/* ── left info panel ── */}
        <aside className="iq-info">
          <span className="iq-badge">Get in Touch</span>
          <h1 className="iq-heading">
            Have a question? <br />
            <span className="iq-highlight">We're here to help.</span>
          </h1>
          <p className="iq-desc">
            Fill out the form and our team will get back to you within 24 hours.
          </p>

          <div className="iq-contact-list">
            <div className="iq-contact-item">
              <div className="iq-contact-icon"><i className="fas fa-envelope"></i></div>
              <div>
                <span>Email us at</span>
                <strong>dnyanminakshi6@gmail.com</strong>
              </div>
            </div>
            <div className="iq-contact-item">
              <div className="iq-contact-icon"><i className="fas fa-phone"></i></div>
              <div>
                <span>Call us at</span>
                <strong>+91 7875275740</strong>
              </div>
            </div>
            <div className="iq-contact-item">
              <div className="iq-contact-icon"><i className="fas fa-location-dot"></i></div>
              <div>
                <span>Visit us at</span>
                <strong>Nashik, India</strong>
              </div>
            </div>
          </div>

          <Link to="/" className="iq-home-btn">
            <i className="fas fa-house"></i> Go to Home Page
          </Link>
        </aside>

        {/* ── form card ── */}
        <div className="iq-card">
          {success ? (
            <div className="iq-success">
              <div className="iq-success-icon">
                <i className="fas fa-circle-check"></i>
              </div>
              <h2>Inquiry Submitted!</h2>
              <p>
                Thank you for reaching out. We've received your inquiry and will
                contact you at <strong>{form.email || 'your email'}</strong> within 24 hours.
              </p>
              <div className="iq-success-actions">
                <button className="iq-btn-primary" onClick={() => setSuccess(false)}>
                  Submit Another
                </button>
                <Link to="/" className="iq-btn-secondary">
                  <i className="fas fa-house"></i> Back to Home
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="iq-card-header">
                <h2>Make an Inquiry</h2>
                <p>All fields marked with * are required</p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="iq-form">
                <div className="iq-row">
                  <div className="iq-field">
                    <label>Full Name *</label>
                    <input
                      name="name" value={form.name} onChange={handleChange}
                      placeholder="e.g. Rahul Sharma"
                      className={errors.name ? 'error' : ''}
                    />
                    {errors.name && <span className="iq-error">{errors.name}</span>}
                  </div>
                  <div className="iq-field">
                    <label>Email Address *</label>
                    <input
                      name="email" type="email" value={form.email} onChange={handleChange}
                      placeholder="e.g. rahul@email.com"
                      className={errors.email ? 'error' : ''}
                    />
                    {errors.email && <span className="iq-error">{errors.email}</span>}
                  </div>
                </div>

                <div className="iq-row">
                  <div className="iq-field">
                    <label>Phone Number *</label>
                    <input
                      name="phone" value={form.phone} onChange={handleChange}
                      placeholder="10-digit number" maxLength={10}
                      className={errors.phone ? 'error' : ''}
                    />
                    {errors.phone && <span className="iq-error">{errors.phone}</span>}
                  </div>
                  <div className="iq-field">
                    <label>Inquiry Type *</label>
                    <select
                      name="type" value={form.type} onChange={handleChange}
                      className={errors.type ? 'error' : ''}
                    >
                      <option value="">Select type</option>
                      {INQUIRY_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    {errors.type && <span className="iq-error">{errors.type}</span>}
                  </div>
                </div>

                <div className="iq-field">
                  <label>Message *</label>
                  <textarea
                    name="message" value={form.message} onChange={handleChange}
                    placeholder="Tell us what you'd like to know..."
                    rows={5}
                    className={errors.message ? 'error' : ''}
                  />
                  {errors.message && <span className="iq-error">{errors.message}</span>}
                </div>

                {errors.submit && (
                  <p className="iq-error" style={{ marginTop: 0 }}>{errors.submit}</p>
                )}

                <div className="iq-form-actions">
                  <button
                    type="button" className="iq-btn-secondary"
                    onClick={() => navigate('/')}
                  >
                    <i className="fas fa-arrow-left"></i> Cancel
                  </button>
                  <button
                    type="submit" className="iq-btn-primary"
                    disabled={loading}
                  >
                    {loading
                      ? <><i className="fas fa-spinner fa-spin"></i> Submitting...</>
                      : <><i className="fas fa-paper-plane"></i> Submit Inquiry</>}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InquiryPage;
