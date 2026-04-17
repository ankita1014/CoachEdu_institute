import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useEffect } from "react";
import Toast from "./components/Toast";

import Navbar from "./components/Navbar";
import Home from "./components/Home";
import About from "./components/About";
import Courses from "./components/Courses";
import Faculty from "./components/Faculty";
import Enrollment from "./components/Enrollment";
import Profile from "./components/Profile";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminDashboard from "./components/Admin/AdminDashboard";
import QuestionManager from "./components/Admin/QuestionManager";
import StudentManager from "./components/Admin/StudentManager";
import EnrollmentManager from "./components/Admin/EnrollmentManager";
import DemoBooking from "./components/DemoBooking";
import DemoBookingManager from "./components/Admin/DemoBookingManager";
import TeacherDashboard from "./components/TeacherDashboard";
import ParentDashboard from "./components/ParentDashboard";
import TeacherSubjects from "./components/TeacherSubjects";
import TeacherSubjectDetail from "./pages/TeacherSubjectDetail";
import ForgotPassword from "./pages/ForgotPassword";
import InquiryPage from "./pages/InquiryPage";
import TestAttempt from "./pages/TestAttempt";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./index.css";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}


function App() {
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  const AppLayout = () => {
    const location = useLocation();
    const { appToast, clearToast } = useAuth();
    const isWorkspaceRoute =
      location.pathname === "/teacher-dashboard" ||
      location.pathname === "/profile" ||
      location.pathname === "/parent-dashboard";
    const hideFooter = isWorkspaceRoute || location.pathname === "/";
    const hideNavbar = isWorkspaceRoute;

    return (
      <div className="App page-transition">
        {/* Global toast — survives route changes */}
        {appToast && (
          <Toast
            message={appToast.message}
            type={appToast.type}
            duration={appToast.duration}
            onClose={clearToast}
          />
        )}

        {!hideNavbar && <Navbar />}

        <Routes>
          {/* PUBLIC */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/faculty" element={<Faculty />} />
          <Route path="/enroll" element={<Enrollment />} />
          
          {/* AUTH */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* DASHBOARDS */}
          <Route
            path="/teacher-dashboard"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjects"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <TeacherSubjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjects/:name"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <TeacherSubjectDetail />
              </ProtectedRoute>
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/inquiry" element={<InquiryPage />} />
          <Route
            path="/test/:testId/attempt"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <TestAttempt />
              </ProtectedRoute>
            }
          />

          <Route
            path="/parent-dashboard"
            element={
              <ProtectedRoute allowedRoles={["parent"]}>
                <ParentDashboard />
              </ProtectedRoute>
            }
          />

          {/* PROTECTED */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/demo-booking"
            element={
              <ProtectedRoute>
                <DemoBooking />
              </ProtectedRoute>
            }
          />

          {/* ADMIN */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/questions"
            element={
              <AdminRoute>
                <QuestionManager />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/students"
            element={
              <AdminRoute>
                <StudentManager />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/enrollments"
            element={
              <AdminRoute>
                <EnrollmentManager />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/demo-bookings"
            element={
              <AdminRoute>
                <DemoBookingManager />
              </AdminRoute>
            }
          />
        </Routes>

        {!hideFooter && <Footer />}
      </div>
    );
  };

  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <AppLayout />
      </AuthProvider>
    </Router>
  );
}

export default App;
