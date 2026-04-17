const DashboardTopbar = ({
  user,
  darkMode,
  searchValue,
  onSearchChange,
  onSearchKeyDown,
  filterRange,
  onFilterChange,
  onToggleSidebar,
  onToggleDarkMode,
  onLogout,
  activeTab,          // used to hide irrelevant controls on certain tabs
}) => {
  // These controls are only meaningful on the main dashboard tab
  const showDateControls = !activeTab || activeTab === "dashboard";

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
      </div>

      <div className="td-topbar-right">
        {showDateControls && (
          <div className="td-filter-chips">
            {["Today", "Week", "Month"].map((item) => (
              <button
                key={item}
                className={filterRange === item ? "active" : ""}
                onClick={() => onFilterChange(item)}
              >
                {item}
              </button>
            ))}
          </div>
        )}

        {showDateControls && (
          <button className="td-icon-btn" onClick={onToggleDarkMode}>
            <i className={darkMode ? "fas fa-sun" : "fas fa-moon"}></i>
          </button>
        )}

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
