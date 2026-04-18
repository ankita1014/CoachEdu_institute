import { createContext, useState, useContext, useEffect, useCallback } from "react";

const AuthContext = createContext();
const API_BASE_URL = "import.meta.env.VITE_API_URL";

export const useAuth = () => useContext(AuthContext);

// Extract first name: "Ankita Kiran Swami" → "Ankita"
const getFirstName = (name) => {
  if (!name || !name.trim()) return null;
  return name.trim().split(/\s+/)[0];
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);
  // Global toast — lives at root level so it survives route changes
  const [appToast, setAppToast] = useState(null);

  const showToast = useCallback((message, type = "success", duration = 3000) => {
    setAppToast({ message, type, duration });
  }, []);

  const clearToast = useCallback(() => setAppToast(null), []);

  // ── Restore session from token on mount ──────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }

    fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser({ ...data.user, role: data.user?.role });
        } else {
          localStorage.removeItem("token");
          setUser(null);
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async ({ studentId, password, role }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: studentId, password, role }),
      });

      let data = {};
      try { data = await res.json(); } catch { data = {}; }

      if (!res.ok || !data.success) {
        return { success: false, message: data.message || "Invalid credentials" };
      }

      const userData = { ...data.user, role: data.user?.role || role };
      setUser(userData);
      localStorage.setItem("token", data.token);

      // Queue the welcome toast — it will render in App.jsx after navigation
      const firstName = getFirstName(userData.name);
      const welcomeMsg = firstName
        ? `Welcome back, ${firstName}! 👋`
        : `Welcome, ${role.charAt(0).toUpperCase() + role.slice(1)}!`;
      showToast(welcomeMsg, "success", 3000);

      return { success: true, user: userData };
    } catch (err) {
      console.error("LOGIN_ERROR:", err);
      return { success: false, message: "Unable to connect to server" };
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    window.history.replaceState(null, "", "/");
  }, []);

  const isAuthenticated = () => !!user;

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout, isAuthenticated,
      appToast, clearToast,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
