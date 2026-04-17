import { Link, useLocation } from "react-router-dom";
import "./DashboardLayout.css";

export default function DashboardLayout({ children }) {
  const location = useLocation();

  const menu = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Students", path: "/students" },
    { name: "Subjects", path: "/subjects/english" },
    { name: "Fees", path: "/fees" },
  ];

  return (
    <div className="layout">

      {/* SIDEBAR */}
      <div className="sidebar">
        <h2 className="logo">Coaching</h2>

        {menu.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`nav-item ${
              location.pathname === item.path ? "active" : ""
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content">{children}</div>
    </div>
  );
}