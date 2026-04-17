const AttendanceHeader = ({
  selectedDate,
  onDateChange,
  onSave,
  onMarkAllPresent,
  onMarkAllAbsent,
  hasUnsavedChanges,
  onViewHistory,
}) => {
  const today = new Date().toISOString().split("T")[0];

  return (
    <section className="at-header">
      <div className="at-title-block">
        <div className="at-title-icon">
          <i className="fas fa-calendar-check"></i>
        </div>
        <div>
          <span className="td-eyebrow">Daily Classroom Flow</span>
          <h2>Attendance</h2>
          <p>Mark attendance quickly, review history, and track class participation trends.</p>
        </div>
      </div>

      <div className="at-header-actions">
        <div className="at-date-control">
          <i className="fas fa-calendar-day"></i>
          <input
            type="date"
            value={selectedDate}
            onChange={onDateChange}
            min="2025-06-01"
            max={today}
          />
        </div>

        <button className="at-ghost-btn" onClick={onMarkAllPresent}>
          Mark All Present
        </button>
        <button className="at-ghost-btn danger" onClick={onMarkAllAbsent}>
          Mark All Absent
        </button>
        <button className="at-ghost-btn" onClick={onViewHistory}>
          <i className="fas fa-clock-rotate-left"></i> History
        </button>
        <button
          className="at-primary-btn"
          onClick={onSave}
          disabled={!hasUnsavedChanges}
        >
          <i className="fas fa-floppy-disk"></i>
          Save Attendance
        </button>
      </div>
    </section>
  );
};

export default AttendanceHeader;
