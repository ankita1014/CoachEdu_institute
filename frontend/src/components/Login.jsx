import { useState, useEffect } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Toast from "./Toast";
import "../styles/login.css";

const ROLE_HOME = {
  student: "/profile",
  parent:  "/parent-dashboard",
  teacher: "/teacher-dashboard",
};

const ROLE_CONFIG = {
  student: { title: "Student", idLabel: "Student ID", errorLabel: "Student ID" },
  teacher: { title: "Teacher", idLabel: "Teacher ID", errorLabel: "Teacher ID" },
  parent:  { title: "Parent",  idLabel: "Parent ID",  errorLabel: "Parent ID"  },
};

const Login = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login, user, loading } = useAuth();

  const [role, setRole]         = useState("student");
  const [formData, setFormData] = useState({ userId: "", password: "" });
  const [errorToast, setErrorToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params      = new URLSearchParams(location.search);
    const roleFromURL = params.get("role");
    setRole(ROLE_CONFIG[roleFromURL] ? roleFromURL : "student");
    setErrorToast(null);
    setFormData({ userId: "", password: "" });
  }, [location.search]);

  // Already logged in → redirect
  if (!loading && user) {
    const dest = location.state?.from?.pathname || ROLE_HOME[user.role] || "/";
    return <Navigate to={dest} replace />;
  }

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorToast(null);

    if (!formData.userId) {
      setErrorToast(`Please enter your ${ROLE_CONFIG[role].errorLabel}`);
      return;
    }
    if (!formData.password) {
      setErrorToast("Please enter your password");
      return;
    }

    setIsSubmitting(true);
    const res = await login({ studentId: formData.userId, password: formData.password, role });
    setIsSubmitting(false);

    if (res.success) {
      // Welcome toast is queued in AuthContext — it renders in App.jsx after navigation
      const dest = location.state?.from?.pathname || ROLE_HOME[role] || "/";
      navigate(dest, { replace: true });
    } else {
      setErrorToast(res.message || "Invalid credentials. Please try again.");
    }
  };

  const config = ROLE_CONFIG[role];

  return (
    <div className="login-container">
      {/* Error toast — local, shown before navigation */}
      {errorToast && (
        <Toast
          message={errorToast}
          type="error"
          duration={4000}
          onClose={() => setErrorToast(null)}
        />
      )}

      <div className="login-card">
        <h1>
          {config.title} <span style={{ color: "#f59e0b" }}>Login</span>
        </h1>

        <form onSubmit={handleSubmit} noValidate>
          <input
            type="text"
            placeholder={config.idLabel}
            name="userId"
            value={formData.userId}
            onChange={handleChange}
            disabled={isSubmitting}
            autoComplete="username"
          />

          <input
            type="password"
            placeholder="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            disabled={isSubmitting}
            autoComplete="current-password"
          />

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i>Logging in...</>
              : "Login"}
          </button>

          <p className="forgot-link" onClick={() => navigate("/forgot-password")}>
            Forgot Password?
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
