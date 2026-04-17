import React, { useState } from 'react';

const FAQ = () => {
  const [selectedId, setSelectedId] = useState(null);

  const questionsList = [
    {
      title: 'How can I enroll in a course?',
      content:
        "You can enroll by visiting our center directly or by filling out the online admission form on our website. Click on 'Enroll Now' to get started.",
    },
    {
      title: 'Do you provide study material?',
      content:
        'Yes, we provide comprehensive printed study material, including theory notes, practice questions, and previous year papers, all included in the course fee.',
    },
    {
      title: 'Is there a demo class available?',
      content:
        'Absolutely! We offer 3 days of free demo classes so you can experience our teaching methodology before making a decision.',
    },
    {
      title: 'What is the batch size?',
      content:
        'We maintain a small batch size of 30-40 students to ensure personal attention and effective doubt clearing for every student.',
    },
  ];

  const toggleAccordion = (id) => {
    setSelectedId(selectedId === id ? null : id);
  };

  return (
    <section className="faq-section">
      <div className="container">
        <div className="faq-wrapper">
          <div
            className="section-header text-center"
            style={{ marginBottom: '40px' }}
          >
            <h2 className="section-title">
              Frequently Asked <span className="highlight">Questions</span>
            </h2>
          </div>

          <div className="faq-list">
            {questionsList.map((item, index) => (
              <div
                key={index}
                className={`faq-item ${selectedId === index ? 'active' : ''}`}
              >
                <button
                  onClick={() => toggleAccordion(index)}
                  className="faq-button"
                >
                  <span className="faq-question">{item.title}</span>
                  <i className="fas fa-chevron-down faq-toggle-icon"></i>
                </button>

                {selectedId === index && (
                  <div className="faq-body">{item.content}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
