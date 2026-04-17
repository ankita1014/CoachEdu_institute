const Stats = () => {
  const items = [
    { count: '100%', name: 'Personal Attention', icon: 'fa-user-check',   theme: '#3b82f6' },
    { count: 'Daily', name: 'Homework Support',  icon: 'fa-book-open',    theme: '#10b981' },
    { count: 'Weekly', name: 'Tests & Progress', icon: 'fa-chart-line',   theme: '#8b5cf6' },
    { count: 'Small',  name: 'Batch Size',       icon: 'fa-users',        theme: '#f59e0b' },
  ];

  return (
    <section className="stats-section">
      <div className="container">
        <div className="stats-grid">
          {items.map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-icon-box" style={{ background: `${s.theme}15`, color: s.theme }}>
                <i className={`fas ${s.icon}`}></i>
              </div>
              <h2 className="stat-number">{s.count}</h2>
              <p className="stat-label">{s.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
