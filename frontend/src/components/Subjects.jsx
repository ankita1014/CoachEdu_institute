import React from "react";
import "./Subjects.css";
import { useNavigate } from "react-router-dom";

const subjectsData = [
  {
    name: "English",
    icon: "📘",
    skills: ["Grammar", "Reading", "Writing", "Sentence"],
  },
  {
    name: "Marathi",
    icon: "📗",
    skills: ["Lekhan", "Reading", "Writing"],
  },
  {
    name: "Maths",
    icon: "📕",
    skills: ["Tables", "Addition", "Subtraction", "Multiplication"],
  },
];

const Subjects = () => {
  const navigate = useNavigate();

  return (
    <div className="subjects-page">
      <h2 className="page-title">Subjects</h2>

      <div className="subjects-grid">
        {subjectsData.map((sub, i) => (
          <div key={i} className="subject-card">
            <div className="subject-icon">{sub.icon}</div>
            <h3>{sub.name}</h3>
            <p>{sub.skills.length} Skills</p>

            <button onClick={() => navigate(`/subjects/${sub.name.toLowerCase()}`)}>
              View Skills →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Subjects;