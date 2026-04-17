import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import GoogleSignInButton from './GoogleSignInButton';
import Toast from './Toast';

const SignUp = () => {
  const navigate = useNavigate();
  const { register, setAuth } = useAuth();

  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    secretKey: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const emailLower = formData.email.toLowerCase();
    const atIndex = emailLower.indexOf('@');
    const hasValidEmail = atIndex > 0 && atIndex < emailLower.length - 1;
    let hasValidDomain = false;
    if (hasValidEmail) {
      const domain = emailLower.slice(atIndex + 1);
      if (
        domain.endsWith('.com') ||
        domain.endsWith('.in') ||
        domain.endsWith('.org') ||
        domain.endsWith('.net') ||
        domain.endsWith('.edu') ||
        domain.endsWith('.gov') ||
        domain.endsWith('.co.in') ||
        domain.endsWith('.ac.in')
      ) {
        hasValidDomain = true;
      }
    }
    if (!hasValidEmail || !hasValidDomain) {
      setError('Please enter a valid email address with proper domain (.com, .in, .org, etc.)');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    let hasUpper = false;
    let hasLower = false;
    let hasDigit = false;
    for (let i = 0; i < formData.password.length; i++) {
      const ch = formData.password[i];
      if (ch >= 'A' && ch <= 'Z') hasUpper = true;
      if (ch >= 'a' && ch <= 'z') hasLower = true;
      if (ch >= '0' && ch <= '9') hasDigit = true;
    }
    if (!hasUpper || !hasLower || !hasDigit) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    setLoading(true);

    try {
      const isAdminSignup = role === 'admin';

      if (isAdminSignup) {
        const adminData = {
          email: formData.email,
          password: formData.password,
          secretKey: formData.secretKey,
        };

        const response = await authAPI.adminRegister(adminData);

        if (response.success) {
          setAuth(response.user, response.token);
          setToast({
            message: 'Account created successfully! Redirecting...',
            type: 'success',
          });
          const redirectPath = response.user.role === 'admin' ? '/admin' : '/';
          setTimeout(() => navigate(redirectPath), 1000);
        } else {
          setError(response.message || 'SignUp failed');
          setToast({
            message: response.message || 'SignUp failed',
            type: 'error',
          });
        }
      } else {
        const { secretKey, ...userData } = formData;
        const result = await register(userData);

        if (result.success) {
          setToast({
            message: 'Account created successfully! Redirecting...',
            type: 'success',
          });
          const redirectPath = result.user.role === 'admin' ? '/admin' : '/';
          setTimeout(() => navigate(redirectPath), 1000);
        } else {
          setError(result.message);
          setToast({ message: result.message, type: 'error' });
        }
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'SignUp failed. Please try again.';
      setError(errorMessage);
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="container">
        <div className="auth-header">
          <h2 className="auth-title">
            {role === 'admin' ? (
              <span style={{ color: '#3949ab' }}>Admin</span>
            ) : (
              'Student'
            )}{' '}
            <span className="highlight">SignUp</span>
          </h2>
          <p className="auth-subtitle">
            {role === 'admin'
              ? 'Create your admin account'
              : 'Create your account to get started'}
          </p>
        </div>

        <div className="auth-card auth-card-lg">
          <div className="role-switcher">
            <button
              onClick={() => setRole('student')}
              className={`role-btn ${role === 'student' ? 'active-student' : ''}`}
            >
              Student
            </button>
            <button
              onClick={() => setRole('admin')}
              className={`role-btn ${role === 'admin' ? 'active-admin' : ''}`}
            >
              Admin
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {error && <div className="form-alert">{error}</div>}

            {role === 'student' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required={role === 'student'}
                  className="form-input"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 8 characters"
                required
                minLength="8"
                className="form-input"
              />
              <p
                className="helper-text"
                style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}
              >
                Must contain uppercase, lowercase, and number
              </p>
            </div>

            {role === 'admin' && (
              <div className="form-group">
                <label className="form-label form-label-admin">
                  Admin Secret Key
                </label>
                <input
                  type="password"
                  name="secretKey"
                  value={formData.secretKey}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required={role === 'admin'}
                  className={`form-input ${!formData.secretKey ? 'form-input-error' : ''}`}
                />
                <p className="helper-text">
                  Contact the administrator to get the secret key
                </p>
              </div>
            )}

            <button
              type="submit"
              className={`btn-primary btn-block ${loading ? 'btn-loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'SignUp'}
            </button>

            <div className="auth-divider">
              <div className="divider-line"></div>
              <span className="divider-text">OR</span>
              <div className="divider-line"></div>
            </div>

            <GoogleSignInButton
              mode="signup"
              isAdmin={role === 'admin'}
              onError={(msg) => setToast({ message: msg, type: 'error' })}
            />

            <div className="auth-footer">
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Login here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default SignUp;
