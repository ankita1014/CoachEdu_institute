import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/TestAttempt.css";

const API = "import.meta.env.VITE_API_URL/student";

// ── Result screen shown after submission ──────────────────────────────────────
const ResultScreen = ({ result, test, onBack }) => {
  const pct = test?.totalMarks > 0
    ? Math.round((result.autoScore / test.totalMarks) * 100)
    : 0;
  const grade = pct >= 80 ? "Excellent" : pct >= 60 ? "Good" : pct >= 40 ? "Average" : "Needs Improvement";
  const gradeColor = pct >= 80 ? "#16a34a" : pct >= 60 ? "#2563eb" : pct >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="ta-result-page">
      <div className="ta-result-card">
        <div className="ta-result-icon" style={{ background: `${gradeColor}18`, color: gradeColor }}>
          <i className={`fas ${pct >= 60 ? "fa-circle-check" : "fa-circle-xmark"}`}></i>
        </div>
        <h2 className="ta-result-title">Test Submitted</h2>
        <p className="ta-result-sub">{test?.title}</p>

        <div className="ta-result-score">
          <span className="ta-result-num" style={{ color: gradeColor }}>
            {result.autoScore}
          </span>
          <span className="ta-result-denom">/ {test?.totalMarks}</span>
        </div>

        <div className="ta-result-grade" style={{ background: `${gradeColor}18`, color: gradeColor }}>
          {grade}
        </div>

        {result.hasDescriptive && (
          <p className="ta-result-note">
            <i className="fas fa-info-circle"></i>
            Descriptive answers will be reviewed by your teacher.
            Final marks may change after evaluation.
          </p>
        )}

        <div className="ta-result-meta">
          <div><span>Subject</span><strong>{test?.subject}</strong></div>
          <div><span>Total Marks</span><strong>{test?.totalMarks}</strong></div>
          <div><span>Status</span><strong>Submitted</strong></div>
        </div>

        <button className="ta-btn-submit" onClick={onBack} style={{ marginTop: 24, width: "100%" }}>
          <i className="fas fa-arrow-left"></i> Back to Dashboard
        </button>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const TestAttempt = () => {
  const { testId } = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();

  const [test, setTest]           = useState(null);
  const [answers, setAnswers]     = useState({});
  const [timeLeft, setTimeLeft]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState("");
  const [activeQ, setActiveQ]     = useState(0);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(null); // holds existing submission data

  const studentId  = user?.studentId || "";
  const storageKey = `test_answers_${testId}_${studentId}`;

  // Use refs so timer callback always has latest values (fixes stale closure)
  const testRef       = useRef(null);
  const answersRef    = useRef({});
  const submittingRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { testRef.current = test; }, [test]);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  // ── Load test + check if already submitted + restore saved answers ──────────
  useEffect(() => {
    if (!testId || !studentId) return;

    // First check if already submitted
    fetch(`${API}/tests/${studentId}`)
      .then((r) => r.json())
      .then((d) => {
        const existing = (d.data || []).find((t) => t._id === testId);
        if (existing?.studentSubmission && existing.studentSubmission.status !== "pending") {
          setAlreadySubmitted(existing.studentSubmission);
          setTest(existing);
          setLoading(false);
          return;
        }
        // Not submitted — load attempt
        return fetch(`${API}/test-attempt/${testId}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.success) {
              setTest(d.test);
              testRef.current = d.test;
              setTimeLeft(d.test.duration * 60);
              try {
                const saved = sessionStorage.getItem(storageKey);
                if (saved) { const p = JSON.parse(saved); setAnswers(p); answersRef.current = p; }
              } catch { /* ignore */ }
            } else {
              setError(d.message || "Test not found");
            }
          });
      })
      .catch(() => setError("Failed to load test"))
      .finally(() => setLoading(false));
  }, [testId, studentId]);

  // ── Save answers to sessionStorage on every change ─────────────────────────
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      sessionStorage.setItem(storageKey, JSON.stringify(answers));
    }
  }, [answers, storageKey]);

  // ── Submit function using refs (no stale closure) ──────────────────────────
  const doSubmit = useCallback(async () => {
    if (submittingRef.current) return;
    const currentTest    = testRef.current;
    const currentAnswers = answersRef.current;
    if (!currentTest) return;

    submittingRef.current = true;
    setSubmitting(true);

    try {
      const payload = currentTest.questions.map((q) => ({
        questionId: q._id,
        answer: currentAnswers[q._id] || "",
      }));
      const res = await fetch(`${API}/test-attempt/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId, studentId, answers: payload }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Submission failed");

      // Clear saved answers
      sessionStorage.removeItem(storageKey);
      setResult(data);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Submission failed. Please try again.");
      submittingRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [testId, studentId, storageKey]);

  // ── Timer countdown — uses doSubmit via ref, no stale closure ──────────────
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitted) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          doSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted, doSubmit]);

  const handleAnswer = (qId, val) => {
    setAnswers((p) => ({ ...p, [qId]: val }));
  };

  // ── Show already-submitted screen ─────────────────────────────────────────
  if (!loading && alreadySubmitted) {
    return (
      <div className="ta-result-page">
        <div className="ta-result-card">
          <div className="ta-result-icon" style={{ background: "#dbeafe", color: "#2563eb" }}>
            <i className="fas fa-circle-check"></i>
          </div>
          <h2 className="ta-result-title">Already Submitted</h2>
          <p className="ta-result-sub">{test?.title}</p>
          <div className="ta-result-score">
            <span className="ta-result-num" style={{ color: "#2563eb" }}>{alreadySubmitted.score ?? "—"}</span>
            <span className="ta-result-denom">/ {test?.totalMarks}</span>
          </div>
          <div className="ta-result-grade" style={{ background: "#dbeafe", color: "#2563eb" }}>
            {alreadySubmitted.status === "evaluated" ? "Evaluated" : "Awaiting Evaluation"}
          </div>
          {alreadySubmitted.feedback && (
            <p style={{ fontSize: "0.88rem", color: "#475569", background: "#f8fafc", borderRadius: 10, padding: "12px 14px", marginTop: 12, textAlign: "left" }}>
              <strong>Feedback:</strong> {alreadySubmitted.feedback}
            </p>
          )}
          <button className="ta-btn-submit" onClick={() => navigate("/profile")} style={{ marginTop: 24, width: "100%" }}>
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Show result screen after submission ────────────────────────────────────
  if (submitted && result) {
    return <ResultScreen result={result} test={test} onBack={() => navigate("/profile")} />;
  }

  if (loading) return <div className="ta-loading"><i className="fas fa-spinner fa-spin"></i> Loading test...</div>;
  if (error)   return (
    <div className="ta-error-page">
      <i className="fas fa-circle-exclamation"></i>
      <p>{error}</p>
      <button className="ta-btn-submit" onClick={() => navigate("/profile")}>Back to Dashboard</button>
    </div>
  );
  if (!test)   return null;

  const mins = Math.floor((timeLeft || 0) / 60);
  const secs  = (timeLeft || 0) % 60;
  const timerWarning = timeLeft !== null && timeLeft <= 60;
  const attempted = Object.keys(answers).filter((k) => answers[k]).length;

  return (
    <div className="ta-page">
      {/* sticky header */}
      <div className="ta-header">
        <div>
          <h1>{test.title}</h1>
          <p>{test.subject} · {test.totalMarks} marks · {test.duration} min</p>
        </div>
        <div className={`ta-timer ${timerWarning ? "ta-timer-warn" : ""}`}>
          <i className="fas fa-clock"></i>
          {mins}:{secs < 10 ? `0${secs}` : secs}
        </div>
      </div>

      <div className="ta-body">
        {/* question navigation panel */}
        <div className="ta-nav-panel">
          <p className="ta-nav-label">Questions</p>
          <div className="ta-nav-grid">
            {test.questions.map((q, i) => (
              <button
                key={q._id}
                className={`ta-nav-btn ${activeQ === i ? "active" : ""} ${answers[q._id] ? "answered" : ""}`}
                onClick={() => setActiveQ(i)}
                title={`Q${i + 1}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="ta-nav-legend">
            <span className="ta-legend-answered"></span> Answered ({attempted})
            <span className="ta-legend-unanswered"></span> Pending ({test.questions.length - attempted})
          </div>
        </div>

        {/* questions list */}
        <div className="ta-questions">
          {test.questions.map((q, i) => (
            <div
              key={q._id}
              id={`q-${i}`}
              className={`ta-q-card ${activeQ === i ? "ta-q-active" : ""}`}
              onClick={() => setActiveQ(i)}
            >
              <div className="ta-q-head">
                <span className="ta-q-num">Q{i + 1}</span>
                <span className="ta-q-marks">{q.marks} {q.marks === 1 ? "mark" : "marks"}</span>
                {answers[q._id] && <span className="ta-q-done"><i className="fas fa-check"></i></span>}
              </div>
              <p className="ta-q-text">{q.question}</p>

              {q.type === "mcq" ? (
                <div className="ta-options">
                  {q.options.map((opt, oi) => (
                    <label key={oi} className={`ta-option ${answers[q._id] === opt ? "ta-option-selected" : ""}`}>
                      <input
                        type="radio"
                        name={`q-${q._id}`}
                        value={opt}
                        checked={answers[q._id] === opt}
                        onChange={() => handleAnswer(q._id, opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  className="ta-textarea"
                  rows={4}
                  placeholder="Write your answer..."
                  value={answers[q._id] || ""}
                  onChange={(e) => handleAnswer(q._id, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* sticky footer */}
      <div className="ta-footer">
        <div className="ta-footer-info">
          <span>{attempted}/{test.questions.length} answered</span>
        </div>
        <button className="ta-btn-cancel" onClick={() => navigate("/profile")} disabled={submitting}>
          Cancel
        </button>
        <button className="ta-btn-submit" onClick={() => setConfirmSubmit(true)} disabled={submitting}>
          {submitting ? <><i className="fas fa-spinner fa-spin"></i> Submitting...</> : "Submit Test"}
        </button>
      </div>

      {/* confirm submit dialog */}
      {confirmSubmit && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 18, padding: "28px 28px 24px", maxWidth: 380, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,0.18)", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>📝</div>
            <h3 style={{ margin: "0 0 8px", color: "#1e2a78" }}>Submit Test?</h3>
            <p style={{ margin: "0 0 8px", fontSize: "0.9rem", color: "#64748b" }}>
              You have answered <strong>{attempted}</strong> of <strong>{test.questions.length}</strong> questions.
            </p>
            {attempted < test.questions.length && (
              <p style={{ margin: "0 0 20px", fontSize: "0.82rem", color: "#f59e0b", background: "#fffbeb", borderRadius: 8, padding: "8px 12px" }}>
                <i className="fas fa-triangle-exclamation"></i> {test.questions.length - attempted} question(s) unanswered.
              </p>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setConfirmSubmit(false)} style={{ flex: 1, padding: "10px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", cursor: "pointer", fontWeight: 500 }}>
                Go Back
              </button>
              <button onClick={() => { setConfirmSubmit(false); doSubmit(); }} style={{ flex: 2, padding: "10px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#4f6df5,#7c3aed)", color: "#fff", cursor: "pointer", fontWeight: 700 }}>
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestAttempt;
