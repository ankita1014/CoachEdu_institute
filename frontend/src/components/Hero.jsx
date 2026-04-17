import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import heroIllustration from '../assets/hero-education.jpg';

const Hero = () => {
  const [studentCount, setStudentCount] = useState('13');

  useEffect(() => {
    fetch('http://localhost:5000/api/student/students')
      .then(r => r.json())
      .then(d => { if (d.success && Array.isArray(d.students)) setStudentCount(String(d.students.length)); })
      .catch(() => {});
  }, []);

  const stats = [
    { value: studentCount, label: 'Students' },
    { value: '4',          label: 'Courses'  },
    { value: '95%',        label: 'Success'  },
  ];

  return (
    <section className="hp-hero-wrap">
      <div className="hp-hero-body">
        <div className="hp-hero-text fade-in-up">
          <span className="hp-badge">Admissions Open 2026-27</span>

          <h1 className="hp-hero-h1">
            Smart Coaching for<br />
            <span className="hp-gradient-text">Primary Students</span>
          </h1>

          <p className="hp-hero-desc">
            Offline coaching for Class 1–5 with a focus on strong basics in
            Maths, English and Marathi — guided by{' '}
            <strong>Mrs. Minakshi Swami</strong>.
          </p>

          <div className="hp-hero-btns">
            <Link to="/inquiry" className="hp-btn-primary">
              Make an Inquiry <i className="fas fa-arrow-right"></i>
            </Link>
            <Link to="/courses" className="hp-btn-outline">
              Explore Courses
            </Link>
          </div>

          <div className="hp-hero-stats">
            {stats.map((s, i) => (
              <div key={i} className="hp-hero-stat">
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hp-hero-img fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="hp-img-blob" aria-hidden="true" />
          <img src={heroIllustration} alt="Education illustration" className="hp-illustration" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
