import { useEffect, useState } from 'react';

const TrustBar = () => {
  const [studentCount, setStudentCount] = useState('13');

  useEffect(() => {
    fetch('import.meta.env.VITE_API_URL/student/students')
      .then((r) => r.json())
      .then((d) => { if (d.success && Array.isArray(d.students)) setStudentCount(String(d.students.length)); })
      .catch(() => {});
  }, []);

  const items = [
    { value: studentCount, label: 'Students Enrolled' },
    { value: '4',          label: 'Courses Offered'   },
    { value: '95%',        label: 'Success Rate'       },
    { value: 'Class 1–5',  label: 'Age Group'          },
  ];

  return (
    <div className="trust-bar">
      <div className="container trust-bar-inner">
        {items.map((item, i) => (
          <div key={i} className="trust-item">
            <span className="trust-value">{item.value}</span>
            <span className="trust-label">{item.label}</span>
            {i < items.length - 1 && <span className="trust-divider" aria-hidden="true" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrustBar;
