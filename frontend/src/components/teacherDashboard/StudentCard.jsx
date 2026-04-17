const StudentCard = ({ student, status, onToggleStatus }) => {
  const initials = student?.name
    ? student.name
        .split(" ")
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join("")
        .toUpperCase()
    : "ST";

  return (
    <article
      className={[
        "at-student-card",
        status === "present" ? "selected-present" : "",
        status === "absent" ? "selected-absent" : "",
      ]
        .join(" ")
        .trim()}
    >
      <div className="at-card-top">
        <div className="at-student-avatar">{initials}</div>
        <span className={`at-status-pill ${status || "unmarked"}`}>
          {status || "Unmarked"}
        </span>
      </div>

      <div className="at-student-copy">
        <h4>{student.name}</h4>
        <p>
          {student.class || "Class"} • {student.studentId || "ID pending"}
        </p>
      </div>

      <div className="at-toggle-row">
        <button
          className={status === "present" ? "active present" : "present"}
          onClick={() => onToggleStatus(student._id, "present")}
        >
          <i className="fas fa-check"></i>
          Present
        </button>
        <button
          className={status === "absent" ? "active absent" : "absent"}
          onClick={() => onToggleStatus(student._id, "absent")}
        >
          <i className="fas fa-xmark"></i>
          Absent
        </button>
      </div>
    </article>
  );
};

export default StudentCard;
