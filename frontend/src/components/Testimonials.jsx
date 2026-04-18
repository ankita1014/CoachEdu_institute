import { useEffect, useState } from 'react';

const STATIC_FALLBACK = [
  { name: 'Priya Deshmukh', review: "My child's confidence improved a lot after joining this coaching." },
  { name: 'Rajesh Patil',   review: 'Very supportive teacher and great teaching methods.' },
  { name: 'Sneha Kulkarni', review: 'Excellent teaching approach for primary students.' },
  { name: 'Anita Sharma',   review: 'Best coaching for building strong basics.' },
];

const Stars = () => (
  <div className="review-stars">
    {Array.from({ length: 5 }).map((_, i) => (
      <i key={i} className="fas fa-star"></i>
    ))}
  </div>
);

const Testimonials = () => {
  const [reviews, setReviews] = useState(STATIC_FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('import.meta.env.VITE_API_URL/parent/reviews')
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
                  <Stars />
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
