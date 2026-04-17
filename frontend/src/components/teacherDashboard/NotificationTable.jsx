const formatDate = (value) => {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const NotificationTable = ({
  items,
  currentPage,
  totalPages,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  onRetry,
}) => {
  return (
    <div className="tn-table-wrap">
      <table className="tn-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Audience</th>
            <th>Sent Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td>
                <strong>{item.title}</strong>
                <span>{item.message.slice(0, 90)}</span>
              </td>
              <td>
                <span className={`tn-type-badge tone-${item.type || "general"}`}>
                  {item.type}
                </span>
              </td>
              <td>{item.audience}</td>
              <td>{formatDate(item.sentAt || item.scheduledAt || item.createdAt)}</td>
              <td>
                <span className={`tn-status-badge status-${item.status}`}>
                  {item.status}
                </span>
              </td>
              <td>
                <div className="tn-table-actions">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="tn-pagination">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default NotificationTable;
