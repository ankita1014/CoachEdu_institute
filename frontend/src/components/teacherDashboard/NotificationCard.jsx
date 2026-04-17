const typeMeta = {
  fees: { label: "Fees", iconClass: "fas fa-wallet", tone: "fees" },
  homework: {
    label: "Homework",
    iconClass: "fas fa-book-open-reader",
    tone: "homework",
  },
  test: { label: "Test", iconClass: "fas fa-file-signature", tone: "test" },
  general: { label: "General", iconClass: "fas fa-bell", tone: "general" },
};

const statusIcons = {
  sent: "fas fa-circle-check",
  scheduled: "fas fa-clock",
  draft: "fas fa-file-pen",
  failed: "fas fa-circle-exclamation",
};

const formatDate = (value) => {
  if (!value) return "Not sent yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not sent yet";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
};

const NotificationCard = ({ item, onView, onEdit, onDelete, onRetry }) => {
  const type = typeMeta[item.type] || typeMeta.general;

  return (
    <article className={`tn-card tone-${type.tone}`}>
      <div className="tn-card-icon">
        <i className={type.iconClass}></i>
      </div>

      <div className="tn-card-content">
        <div className="tn-card-header">
          <div>
            <h4>{item.title}</h4>
            <p>{item.message}</p>
          </div>

          <div className="tn-card-badges">
            <span className={`tn-type-badge tone-${type.tone}`}>{type.label}</span>
            <span className={`tn-status-badge status-${item.status}`}>
              <i className={statusIcons[item.status] || "fas fa-bell"}></i>
              {item.status}
            </span>
          </div>
        </div>

        <div className="tn-card-meta">
          <span>
            <i className="fas fa-users"></i>
            {item.audience}
          </span>
          <span>
            <i className="fas fa-calendar"></i>
            {formatDate(item.sentAt || item.scheduledAt || item.createdAt)}
          </span>
          <span>
            <i className="fas fa-paper-plane"></i>
            {item.deliverySummary?.delivered || 0} delivered
          </span>
        </div>

        <div className="tn-card-actions">
          <button onClick={() => onView(item)}>View</button>
          <button onClick={() => onEdit(item)}>Edit</button>
          {item.status === "failed" && (
            <button onClick={() => onRetry(item)} className="accent">
              Retry
            </button>
          )}
          <button onClick={() => onDelete(item)} className="danger">
            Delete
          </button>
        </div>
      </div>
    </article>
  );
};

export default NotificationCard;
