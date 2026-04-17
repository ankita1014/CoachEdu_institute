import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  questionsAPI,
  enrollmentsAPI,
  demoBookingsAPI,
  contestsAPI,
} from '../../services/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalEnrolled: 0,
    totalDemoBookings: 0,
    totalContests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const enrollmentId = searchParams.get('id');
    const action = searchParams.get('action');

    if (enrollmentId && action) {
      navigate(`/admin/enrollments?id=${enrollmentId}&action=${action}`);
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        const [questions, enrollments, demoBookings, contests, videos] =
          await Promise.all([
            questionsAPI.getStats(),
            enrollmentsAPI.getStats(),
            demoBookingsAPI.getAll(),
            contestsAPI.getAll(),
          ]);
        setStats({
          totalQuestions: questions.count || 0,
          totalEnrolled: enrollments.count || 0,
          totalDemoBookings: demoBookings.count || 0,
          totalContests: contests.contests?.length || 0,
        });
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="admin-container">
      <h2 className="admin-header-title">Admin Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h1 className="stat-number" style={{ color: '#1a237e' }}>
            {loading ? '...' : stats.totalQuestions}
          </h1>
          <p className="stat-label">Total Questions</p>
          <Link to="/admin/questions" className="btn-primary">
            Manage Questions
          </Link>
        </div>
        <div className="stat-card">
          <h1 className="stat-number" style={{ color: '#4caf50' }}>
            {loading ? '...' : stats.totalEnrolled}
          </h1>
          <p className="stat-label">Student Enrollments</p>
          <Link to="/admin/enrollments" className="btn-primary">
            Manage Enrollments
          </Link>
        </div>
        <div className="stat-card">
          <h1 className="stat-number" style={{ color: '#ff6b6b' }}>
            {loading ? '...' : stats.totalDemoBookings}
          </h1>
          <p className="stat-label">Demo Bookings</p>
          <Link to="/admin/demo-bookings" className="btn-primary">
            Manage Demo Bookings
          </Link>
        </div>
        <div className="stat-card">
          <h1 className="stat-number" style={{ color: '#9c27b0' }}>
            {loading ? '...' : stats.totalContests}
          </h1>
          <p className="stat-label">Contests</p>
          <Link to="/admin/contests" className="btn-primary">
            Manage Contests
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
