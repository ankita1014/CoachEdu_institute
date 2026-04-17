const cards = [
  {
    icon: 'fa-user-check',
    title: 'Personal Attention',
    desc: 'Each student gets individual focus to ensure strong understanding of every concept.',
    tint: '#eff6ff',
    color: '#3b82f6',
  },
  {
    icon: 'fa-users',
    title: 'Small Batch Size',
    desc: 'Limited students per batch for better interaction, doubt-solving, and engagement.',
    tint: '#f0fdf4',
    color: '#10b981',
  },
  {
    icon: 'fa-book',
    title: 'Strong Basics',
    desc: 'We focus on Maths, English and Marathi fundamentals from the root level up.',
    tint: '#faf5ff',
    color: '#8b5cf6',
  },
  {
    icon: 'fa-chart-line',
    title: 'Regular Tests',
    desc: 'Weekly tests and performance tracking to continuously improve student progress.',
    tint: '#fffbeb',
    color: '#f59e0b',
  },
];

const Features = () => (
  <section className="features-section">
    <div className="container">
      <div className="section-header">
        <span className="section-eyebrow">What We Offer</span>
        <h2>Everything a student needs to <span className="highlight">excel</span></h2>
        <p>Our teaching model is built on four pillars that make a real difference.</p>
      </div>

      <div className="features-grid">
        {cards.map((c, i) => (
          <div key={i} className="feature-card-new" style={{ '--card-tint': c.tint, '--card-color': c.color }}>
            <div className="feature-icon-wrap">
              <i className={`fas ${c.icon}`}></i>
            </div>
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Features;
