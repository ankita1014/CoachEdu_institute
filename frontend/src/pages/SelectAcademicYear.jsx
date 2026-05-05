import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAcademicYear } from "../context/AcademicYearContext";
import "./SelectAcademicYear.css";

const YEAR_ICONS = ["📘", "📗", "📕", "📙"];

const SelectAcademicYear = () => {
  const navigate = useNavigate();
  const { years, loadingYears, selectedYear, selectYear, fetchYears } = useAcademicYear();

  useEffect(() => { fetchYears(); }, [fetchYears]);

  const handleSelect = (year) => {
    selectYear(year);
    navigate("/teacher-dashboard");
  };

  return (
    <div className="say-wrapper">
      <div className="say-card">
        {/* Header */}
        <div className="say-header">
          <div className="say-logo-badge">SC</div>
          <div>
            <p className="say-eyebrow">CoachEdu Institute</p>
            <h1 className="say-title">Select Academic Year</h1>
            <p className="say-subtitle">
              Choose the academic year you want to work in. You can switch at any time from the dashboard.
            </p>
          </div>
        </div>

        {/* Year cards */}
        {loadingYears ? (
          <div className="say-grid">
            {[1, 2, 3].map((i) => <div key={i} className="say-year-skeleton" />)}
          </div>
        ) : (
          <div className="say-grid">
            {years.map((year, i) => {
              const isSelected = selectedYear?._id === year._id;
              return (
                <button
                  key={year._id}
                  className={`say-year-card ${isSelected ? "say-year-card--active" : ""} ${year.isActive ? "say-year-card--current" : ""}`}
                  onClick={() => handleSelect(year)}
                >
                  <span className="say-year-icon">{YEAR_ICONS[i % YEAR_ICONS.length]}</span>
                  <div className="say-year-info">
                    <strong className="say-year-name">{year.name}</strong>
                    {year.isActive && <span className="say-current-badge">Current</span>}
                    {isSelected && !year.isActive && <span className="say-selected-badge">Selected</span>}
                    {year.startDate && year.endDate && (
                      <span className="say-year-range">
                        {new Date(year.startDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                        {" – "}
                        {new Date(year.endDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                  <span className="say-enter-arrow">
                    {isSelected ? <i className="fas fa-check-circle"></i> : <i className="fas fa-arrow-right"></i>}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <p className="say-footer-note">
          <i className="fas fa-info-circle"></i>
          {" "}Data is shared across years. Switching year only changes your active workspace context.
        </p>
      </div>
    </div>
  );
};

export default SelectAcademicYear;
