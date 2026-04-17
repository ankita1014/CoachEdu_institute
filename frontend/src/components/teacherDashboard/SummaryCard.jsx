import { useEffect, useState } from "react";

const SummaryCard = ({ iconClass, label, value, suffix = "", tone = "violet" }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frame;
    let start;
    const target = Number(value) || 0;
    const duration = 500;

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setDisplayValue(Math.round(target * progress));
      if (progress < 1) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return (
    <article className={`at-summary-card tone-${tone}`}>
      <div className="at-summary-icon">
        <i className={iconClass}></i>
      </div>
      <div>
        <span>{label}</span>
        <strong>
          {displayValue}
          {suffix}
        </strong>
      </div>
    </article>
  );
};

export default SummaryCard;
