import React from 'react';
import { Link } from 'react-router-dom';

const Courses = () => {
  const subjects = [
    {
      name: 'Mathematics',
      desc: ['Strong Basics', 'Problem Solving'],
      icon: 'fa-calculator',
      theme: '#e3f2fd',
      accent: '#1a237e',
    },
    {
      name: 'English',
      desc: ['Grammar', 'Reading & Writing'],
      icon: 'fa-book',
      theme: '#e0f7fa',
      accent: '#006064',
    },
    {
      name: 'Marathi',
      desc: ['Reading Skills', 'Writing Practice'],
      icon: 'fa-language',
      theme: '#f3e5f5',
      accent: '#6a1b9a',
    },
    {
      name: 'Hindi',
      desc: ['Grammar', 'Literature Basics'],
      icon: 'fa-pen',
      theme: '#fff3e0',
      accent: '#ef6c00',
    },
  ];

  return (
    <section id="programs" className="programs-page">
      <div className="container">

        <div className="section-header">
          <h2>
            Our <span className="highlight">Courses</span>
          </h2>
          <p>Coaching for primary students (Class 1st to 5th).</p>
        </div>

        <div className="program-grid">
          {subjects.map((item) => (
            <Link
              key={item.name}
              to="/enroll"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="category-card">

                <div className="category-content">
                  <h3 className="category-title">{item.name}</h3>

                  <div className="skill-tags">
                    {item.desc.map((d, i) => (
                      <span key={i} className="skill-tag">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="enroll-action">
                  <span className="enroll-text">Enroll Now</span>
                  <div className="enroll-icon">
                    <i className="fas fa-arrow-right enroll-arrow"></i>
                  </div>
                </div>

                <div
                  className="category-bg-icon"
                  style={{ background: item.theme }}
                >
                  <i
                    className={`fas ${item.icon} bg-icon-large`}
                    style={{ color: item.accent }}
                  />
                </div>

              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Courses;