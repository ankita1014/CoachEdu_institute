import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Role → their correct dashboard path
const ROLE_HOME = {
  student: "/profile",
  parent:  "/parent-dashboard",
  teacher: "/teacher-dashboard",
};

/**
 * ProtectedRoute
 *
 * Props:
 *   allowedRoles  – array of roles that may access this route, e.g. ["teacher"]
 *                   omit (or pass undefined) to allow any authenticated user
 *   children      – the page component to render
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // While the token is being verified, render nothing (avoids flash-redirect)
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        color: "#94a3b8", fontSize: "0.9rem",
      }}>
        Loading…
      </div>
    );
  }

  // Not logged in → send to login, remember where they were going
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Wrong role → redirect to their own dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const home = ROLE_HOME[user.role] || "/";
    return <Navigate to={home} replace />;
  }

  return children;
};

export default ProtectedRoute;
