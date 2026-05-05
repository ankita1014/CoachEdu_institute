import { useNavigate } from "react-router-dom";
import { useAcademicYear } from "../../context/AcademicYearContext";

const DashboardTopbar = ({
  user,
  searchValue,
  onSearchChange,
  onSearchKeyDown,
  onToggleSidebar,
  onLogout,
}) => {
  const navigate = useNavigate();
  const { selectedYear } = useAcademicYear();

  return (
    <header className="td-topbar">
      <div className="td-topbar-left">
        <button className="td-icon-btn" onClick={onToggleSidebar}>
          <i className="fas fa-bars"></i>
        </button>

        <div className="td-search">
          <i className="fas fa-search"></i>
          <input
            type="text"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="Search module or jump to a section..."
          />
        </div>

        {selectedYear && (
          <span className="td-ay-indicator">
            <i className="fas fa-calendar-alt"></i>
            AY {selectedYear.name}
          </span>
        )}
      </div>

      <div className="td-topbar-right">
        <button
          className="td-switch-year-btn"
          onClick={() => navigate("/select-academic-year")}
          title="Switch Academic Year"
        >
          <i className="fas fa-rotate"></i>
          <span>Switch Year</span>
        </button>

        <div className="td-user-chip">
          <div className="td-user-avatar">{user?.name?.charAt(0) || "T"}</div>
          <div className="td-user-copy">
            <strong>{user?.name || "Teacher"}</strong>
            <span>Teacher</span>
          </div>
        </div>

        <button className="td-logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default DashboardTopbar;
