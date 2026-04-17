import AdmissionForm from './AdmissionForm';

const Enrollment = () => {
  return (
    <section className="enrollment-page">
      <div className="container">
        <div
          className="section-header text-center"
          style={{ marginBottom: '30px' }}
        >
          <h2 className="section-title">
            Admission <span className="highlight">Form</span>
          </h2>
          <p className="section-subtitle">
            Take the first step towards your success.
          </p>
        </div>
        <div className="enrollment-box">
          <AdmissionForm />
        </div>
      </div>
    </section>
  );
};

export default Enrollment;
