import { useEffect, useState } from "react";

const DashboardStatCard = ({ iconClass, label, value, suffix = "", accent, loading }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = Number(value) || 0;

  useEffect(() => {
    if (loading) {
      setDisplayValue(0);
      return;
    }

    let frame;
    let start;
    const duration = 700;

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setDisplayValue(Math.round(numericValue * progress));
      if (progress < 1) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [loading, numericValue]);

  if (loading) {
    return <div className="td-skeleton td-stat-skeleton"></div>;
  }

  return (
    <article className={`td-stat-card accent-${accent}`}>
      <div className="td-stat-icon">
        <i className={iconClass}></i>
      </div>
      <div className="td-stat-copy">
        <span>{label}</span>
        <strong>
          {displayValue}
          {suffix}
        </strong>
      </div>
    </article>
  );
};

export default DashboardStatCard;
