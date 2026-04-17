import React, { useEffect, useRef } from 'react';

const About = () => {
  const listContainerRef = useRef(null);

  const featureHighlights = [
    {
      icon: 'fa-user-check',
      title: 'Personal Attention',
      text: 'Each student gets individual focus to ensure strong understanding of concepts.',
      delay: '0s',
    },
    {
      icon: 'fa-users',
      title: 'Small Batch Size',
      text: 'Limited students per batch for better interaction and doubt solving.',
      delay: '0.1s',
    },
    {
      icon: 'fa-book',
      title: 'Strong Basics',
      text: 'We focus on Maths, English and Marathi fundamentals from the root level.',
      delay: '0.2s',
    },
    {
      icon: 'fa-chart-line',
      title: 'Regular Tests',
      text: 'Weekly tests and performance tracking to improve student progress.',
      delay: '0.3s',
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('scroll-visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const cards = listContainerRef.current.querySelectorAll('.feature-card');
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <section className="about-page" ref={listContainerRef}>
      <div className="container">
        {/* 🔹 HEADER */}
        <div className="section-header text-center">
          <h2>
            About <span style={{ color: '#1a237e' }}>CoachEdu</span>{' '}
            <span className="highlight">Institute</span>
          </h2>
          <p style={{ maxWidth: '700px', margin: '0 auto' }}>
            We provide quality offline coaching for primary students (Class 1st
            to 5th). Our goal is to build strong academic foundations with
            personal attention and simple teaching methods.
          </p>
        </div>

        {/* 🔹 FEATURES */}
        <div className="feature-grid">
          {featureHighlights.map((item, index) => (
            <div
              key={index}
              className="feature-card scroll-hidden"
              style={{ transitionDelay: item.delay }}
            >
              <div className="icon-box">
                <i className={`fas ${item.icon}`}></i>
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>

        {/* 🔹 VISION & MISSION */}
        <div className="row vision-mission-row">
          <div className="col-md-6 mb-4">
            <div className="vision-card">
              <h3 className="vision-title">Our Vision</h3>
              <p className="card-text">
                To become a trusted coaching institute that helps primary
                students build strong basics and confidence in academics.
              </p>
            </div>
          </div>

          <div className="col-md-6 mb-4">
            <div className="mission-card">
              <h3 className="mission-title">Our Mission</h3>
              <p className="card-text">
                To guide students with personalized teaching, regular practice,
                and simple explanations so that every child can perform their
                best.
              </p>
            </div>
          </div>
        </div>

        {/* 🔹 NOTE / ACHIEVEMENT */}
        <div className="achievement-note">
          <div className="note-icon">
            <i className="fas fa-certificate"></i>
          </div>
          <div className="note-content">
            <h4>Our Commitment</h4>
            <p>
              We focus on real learning and genuine progress of students. Our
              teaching is based on concept clarity, regular practice, and
              personal attention. We believe every child can improve with the
              right guidance and support.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;