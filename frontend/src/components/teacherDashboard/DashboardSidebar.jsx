const DashboardSidebar = ({
  instituteName,
  items,
  activeTab,
  onChangeTab,
  collapsed,
  mobileOpen,
  onCloseMobile,
}) => {
  return (
    <>
      {mobileOpen && <div className="td-overlay" onClick={onCloseMobile}></div>}

      <aside
        className={[
          "td-sidebar",
          collapsed ? "collapsed" : "",
          mobileOpen ? "open" : "",
        ]
          .join(" ")
          .trim()}
      >
        <div className="td-sidebar-brand">
          <div className="td-brand-badge">SC</div>
          {!collapsed && (
            <div>
              <span className="td-brand-eyebrow">Teacher Workspace</span>
              <h2>{instituteName}</h2>
            </div>
          )}
        </div>

        <div className="td-sidebar-group">
          {!collapsed && <span className="td-sidebar-label">Modules</span>}
          <div className="td-sidebar-menu">
            {items.map((item) => (
              <button
                key={item.key}
                className={activeTab === item.key ? "active" : ""}
                onClick={() => {
                  onChangeTab(item.key);
                  onCloseMobile();
                }}
                title={item.label}
              >
                <span className="menu-icon">
                  <i className={item.iconClass}></i>
                </span>
                {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;
