import React from 'react';

const Faculty = () => {
  return (
    <section className="faculty-page">
      <div className="container">

        {/* HEADER */}
        <div className="section-header text-center">
          <h2 className="section-title">
            About <span className="highlight">Teacher</span>
          </h2>
        </div>

        {/* CARD */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            className="faculty-card"
            style={{
              maxWidth: '800px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              padding: '30px',
              borderRadius: '16px',
            }}
          >

            {/* DETAILS */}
            <h3 style={{ color: '#4f46e5', marginBottom: '10px' }}>
              Mrs. Minakshi
            </h3>

            <p><strong>Qualification:</strong> HSC D.Ed</p>
            <p><strong>Experience:</strong> 15+ Years</p>
            <p><strong>Subjects:</strong> Maths, English, Marathi</p>

            <p style={{ marginTop: '15px', maxWidth: '600px', lineHeight: '1.6' }}>
              Mrs. Minakshi is a dedicated educator with over 15 years
              of teaching experience. She focuses on building strong academic
              foundations for primary students by simplifying concepts and
              providing personal attention. Her goal is to help every child
              develop confidence and a love for learning.
            </p>

          </div>
        </div>

      </div>
    </section>
  );
};

export default Faculty;
