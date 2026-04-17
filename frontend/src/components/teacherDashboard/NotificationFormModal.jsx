const TYPE_OPTIONS = [
  { value: "fees", label: "Fees" },
  { value: "homework", label: "Homework" },
  { value: "test", label: "Test" },
  { value: "general", label: "General" },
];

const AUDIENCE_OPTIONS = [
  { value: "students", label: "Students" },
  { value: "parents", label: "Parents" },
  { value: "both", label: "Both" },
];

const NotificationFormModal = ({
  isOpen,
  formData,
  students,
  classOptions,
  onClose,
  onChange,
  onToggleRecipient,
  onSubmit,
  onSaveDraft,
  editing,
  loading,
  readOnly = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="tn-modal-overlay" onClick={onClose}>
      <div className="tn-modal" onClick={(event) => event.stopPropagation()}>
        <div className="tn-modal-header">
          <div>
            <p className="tn-eyebrow">Notification Composer</p>
            <h3>{editing ? "Edit Notification" : "Create Notification"}</h3>
          </div>
          <button onClick={onClose} className="tn-close-btn">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="tn-modal-grid">
          <label>
            <span>Title</span>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={onChange}
              placeholder="Fee Reminder"
              disabled={readOnly}
            />
          </label>

          <label>
            <span>Type</span>
            <select
              name="type"
              value={formData.type}
              onChange={onChange}
              disabled={readOnly}
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="full">
            <span>Message</span>
            <textarea
              name="message"
              value={formData.message}
              onChange={onChange}
              rows={5}
              placeholder="Write the reminder or announcement for your recipients."
              disabled={readOnly}
            ></textarea>
          </label>

          <label>
            <span>Audience</span>
            <select
              name="audience"
              value={formData.audience}
              onChange={onChange}
              disabled={readOnly}
            >
              {AUDIENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Class / Batch</span>
            <select
              name="className"
              value={formData.className}
              onChange={onChange}
              disabled={readOnly}
            >
              <option value="All Classes">All Classes</option>
              {classOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <div className="tn-radio-group full">
            <span>Send option</span>
            <div className="tn-inline-options">
              <label>
                <input
                  type="radio"
                  name="sendMode"
                  value="now"
                  checked={formData.sendMode === "now"}
                  onChange={onChange}
                  disabled={readOnly}
                />
                Send now
              </label>
              <label>
                <input
                  type="radio"
                  name="sendMode"
                  value="later"
                  checked={formData.sendMode === "later"}
                  onChange={onChange}
                  disabled={readOnly}
                />
                Schedule for later
              </label>
            </div>
          </div>

          {formData.sendMode === "later" && (
            <>
              <label>
                <span>Schedule date</span>
                <input
                  type="date"
                  name="scheduleDate"
                  value={formData.scheduleDate}
                  onChange={onChange}
                  disabled={readOnly}
                />
              </label>

              <label>
                <span>Schedule time</span>
                <input
                  type="time"
                  name="scheduleTime"
                  value={formData.scheduleTime}
                  onChange={onChange}
                  disabled={readOnly}
                />
              </label>
            </>
          )}

          <div className="tn-channel-group full">
            <span>Delivery channels</span>
            <div className="tn-inline-options">
              <label>
                <input
                  type="checkbox"
                  name="sendSms"
                  checked={formData.sendSms}
                  onChange={onChange}
                  disabled={readOnly}
                />
                Send SMS
              </label>
              <label>
                <input
                  type="checkbox"
                  name="sendEmail"
                  checked={formData.sendEmail}
                  onChange={onChange}
                  disabled={readOnly}
                />
                Send Email
              </label>
              <label>
                <input
                  type="checkbox"
                  name="sendApp"
                  checked={formData.sendApp}
                  onChange={onChange}
                  disabled={readOnly}
                />
                Send App Notification
              </label>
            </div>
          </div>

          <div className="tn-recipient-picker full">
            <div className="tn-recipient-head">
              <span>Select Students</span>
              <span>{formData.recipients.length} selected</span>
            </div>
            <div className="tn-recipient-list">
              {students.map((student) => {
                const checked = formData.recipients.includes(student.studentId);
                return (
                  <label key={student._id}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleRecipient(student.studentId)}
                      disabled={readOnly}
                    />
                    <span>
                      {student.name} • {student.class}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="tn-modal-actions">
          {readOnly ? (
            <button onClick={onClose} className="primary">
              Close
            </button>
          ) : (
            <>
              <button onClick={onSaveDraft} className="secondary" disabled={loading}>
                Save as Draft
              </button>
              <button onClick={onSubmit} className="primary" disabled={loading}>
                {loading ? "Sending..." : editing ? "Update Notification" : "Send"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationFormModal;
