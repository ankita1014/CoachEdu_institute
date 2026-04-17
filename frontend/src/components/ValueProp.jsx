const bullets = [
  { icon: 'fa-user-check',      text: 'One-on-one attention for every student'          },
  { icon: 'fa-users',           text: 'Small batch size for better interaction'          },
  { icon: 'fa-clipboard-check', text: 'Weekly tests to track progress consistently'      },
  { icon: 'fa-book-open',       text: 'Daily homework support and doubt clearing'        },
];

const ValueProp = () => (
  <section className="value-section">
    <div className="value-inner">
      <div className="value-header">
        <span className="section-eyebrow">Why Choose Us</span>
        <h2 className="value-heading">
          A coaching experience built around{' '}
          <span className="highlight">your child</span>
        </h2>
        <p className="value-sub">
          We believe every child learns differently. Our approach is personal,
          structured, and focused on building confidence alongside academics.
        </p>
      </div>

      <ul className="value-bullets">
        {bullets.map((b, i) => (
          <li key={i} className="value-bullet">
            <span className="bullet-icon">
              <i className={`fas ${b.icon}`}></i>
            </span>
            <span>{b.text}</span>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export default ValueProp;
