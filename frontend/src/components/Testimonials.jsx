import { useEffect, useState } from 'react';

const STATIC_FALLBACK = [
  { name: 'Ashutosh Singh',   review: "Very satisfied with my child's progress at this institute." },
  { name: 'Satish Tiwari',    review: 'The teachers are very supportive and the teaching methods are excellent.' },
  { name: 'Shashikant Rawat', review: "My child's confidence has improved a lot after joining this coaching." },
  { name: 'Ramesh Nishad',    review: 'Best coaching for building strong academic basics.' },
];

const Stars = ({ count = 5 }) => (
  <div className="review-stars">
    {Array.from({ length: 5 }).map((_, i) => (
      <i key={i} className="fas fa-star" style={{ color: i < count ? "#f59e0b" : "#e2e8f0" }}></i>
    ))}
  </div>
);

const Testimonials = () => {
  const [reviews, setReviews] = useState(STATIC_FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/parent/reviews`)
      .then((r) => r.json())
      .then((d) => { if (d.success && d.reviews?.length) setReviews(d.reviews.slice(0, 4)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="testimonials-section">
      <div className="container">
        <div className="testimonials-header">
          <h2 className="testimonials-title">
            Parent <span className="highlight">Reviews</span>
          </h2>
          <p className="testimonials-subtitle">
            What parents say about their children's progress.
          </p>
        </div>

        <div className="testimonials-grid">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="testimonial-card testimonial-skeleton" />
              ))
            : reviews.map((item, i) => (
                <div key={i} className="testimonial-card">
                  <Stars count={item.rating || 5} />
                  <p className="testimonial-text">"{item.review}"</p>
                  <div className="testimonial-author">
                    <div className="testimonial-avatar">
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                    <h4 className="testimonial-user">{item.name}</h4>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
