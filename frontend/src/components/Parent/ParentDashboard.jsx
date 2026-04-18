import { useEffect, useState } from "react";
import "./ParentDashboard.css";

const ParentDashboard = () => {
  const [fees, setFees] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const studentId = localStorage.getItem("studentId"); // 👈 parent ka student

  useEffect(() => {
    fetch(`import.meta.env.VITE_API_URL/student/fees`)
      .then(res => res.json())
      .then(data => {
        const record = data.data.find(f => f.studentId === studentId);
        setFees(record);
      });

    fetch(`import.meta.env.VITE_API_URL/student/notifications/${studentId}`)
      .then(res => res.json())
      .then(data => setNotifications(data.data || []));
  }, []);

  return (
    <div className="parent-dashboard">

      <h2>👨‍👩‍👧 Parent Dashboard</h2>

      {/* 💰 FEES */}
      {fees && (
        <div className="fee-box">
          <h3>Fees Status</h3>

          <p>Total: ₹{fees.totalFees}</p>
          <p>Paid: ₹{fees.paid}</p>
          <p>Remaining: ₹{fees.remaining}</p>

          <span className={`status ${fees.status}`}>
            {fees.status}
          </span>
        </div>
      )}

      {/* 📅 INSTALLMENTS */}
      <div className="timeline">
        <h3>Installment Timeline</h3>

        {fees?.installments?.length ? (
          fees.installments.map((i, idx) => (
            <div key={idx} className="timeline-item">
              📅 {i.date}
            </div>
          ))
        ) : (
          <p>No installments set</p>
        )}
      </div>

      {/* 🔔 NOTIFICATIONS */}
      <div className="notifications">
        <h3>Notifications</h3>

        {notifications.length ? (
          notifications.map((n, idx) => (
            <div key={idx} className="notification">
              ⚠️ {n.message}
            </div>
          ))
        ) : (
          <p>No notifications</p>
        )}
      </div>

    </div>
  );
};

export default ParentDashboard;