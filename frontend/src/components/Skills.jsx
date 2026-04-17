import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Skills.css";

const Skills = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const subject = location.state;

  if (!subject) {
    return (
      <div className="skills-page">
        <h2>No Data Found</h2>
        <button onClick={() => navigate("/subjects")}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="skills-page">

      {/* TOP BAR */}
      <div className="skills-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <h2>{subject.name} Skills</h2>
      </div>

      {/* GRID */}
      <div className="skills-grid">
        {subject.skills.map((skill, index) => (
          <div key={index} className="skill-card">
            <h4>{skill}</h4>
            <button>View Activities</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Skills;