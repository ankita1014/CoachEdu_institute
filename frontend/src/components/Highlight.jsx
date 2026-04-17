import { Link } from 'react-router-dom';

const Highlight = () => (
  <section className="highlight-section">
    <div className="container highlight-inner">
      <p className="highlight-eyebrow">Our Mission</p>
      <h2 className="highlight-heading">
        Building strong academic foundations<br />
        from an early stage.
      </h2>
      <p className="highlight-sub">
        The right guidance at the right age makes all the difference.
        Join CoachEdu and give your child the head start they deserve.
      </p>
      <Link to="/inquiry" className="highlight-btn">
        Get Started Today
        <i className="fas fa-arrow-right" style={{ marginLeft: 10 }}></i>
      </Link>
    </div>
  </section>
);

export default Highlight;
