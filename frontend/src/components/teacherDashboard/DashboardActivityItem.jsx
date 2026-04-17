const DashboardActivityItem = ({ iconClass, title, meta, tone = "blue" }) => {
  return (
    <div className={`td-activity-item tone-${tone}`}>
      <div className="td-activity-icon">
        <i className={iconClass}></i>
      </div>
      <div>
        <h5>{title}</h5>
        <p>{meta}</p>
      </div>
    </div>
  );
};

export default DashboardActivityItem;
