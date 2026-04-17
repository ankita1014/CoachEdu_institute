import { useState } from "react";
import { authAPI } from "../services/api";
import "../styles/forgotPassword.css";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [id, setId] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const reset = () => { setError(""); setMessage(""); };

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    reset();
    if (!id.trim()) return setError("Please enter your Student ID or Parent ID");
    setLoading(true);
    try {
      const res = await authAPI.sendOtp(id.trim());
      if (res.success) {
        setDemoOtp(res.otp); // demo: show OTP in UI
        setMessage("OTP sent to your registered number");
        setStep(2);
      } else {
        setError(res.message || "User not found");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "User not found. Check your ID.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    reset();
    if (!otp.trim()) return setError("Please enter the OTP");
    setLoading(true);
    try {
      const res = await authAPI.verifyOtp(id.trim(), otp.trim());
      if (res.success) {
        setStep(3);
      } else {
        setError(res.message || "Invalid OTP");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    reset();
    if (newPassword.length < 6) return setError("Password must be at least 6 characters");
    if (newPassword !== confirmPassword) return setError("Passwords do not match");
    setLoading(true);
    try {
      const res = await authAPI.resetPassword(id.trim(), newPassword);
      if (res.success) {
        setStep(4);
      } else {
        setError(res.message || "Failed to reset password");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    reset();
    setLoading(true);
    try {
      const res = await authAPI.sendOtp(id.trim());
      if (res.success) {
        setDemoOtp(res.otp);
        setMessage("New OTP generated!");
      } else {
        setError(res.message || "Failed to resend OTP");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <h2>Forgot Password</h2>

        <div className="step-indicator">
          {[1, 2, 3].map((s) => (
            <span key={s} className={`step-dot ${step > s ? "done" : step === s ? "active" : ""}`} />
          ))}
        </div>

        {/* Step 1: Enter ID */}
        {step === 1 && (
          <div className="step-content">
            <p className="step-label">Step 1 of 3 — Enter your ID</p>
            <input
              placeholder="Student ID or Parent ID"
              value={id}
              onChange={(e) => setId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
            />
            <button onClick={handleSendOtp} disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </div>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <div className="step-content">
            <p className="step-label">Step 2 of 3 — Verify OTP</p>
            <p className="hint">OTP sent to your registered number</p>

            {/* Demo OTP banner */}
            {demoOtp && (
              <div className="demo-otp-box">
                <span className="demo-label">🔐 Demo OTP</span>
                <span className="demo-code">{demoOtp}</span>
              </div>
            )}

            <input
              placeholder="Enter 6-digit OTP"
              value={otp}
              maxLength={6}
              onChange={(e) => setOtp(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
            />
            <button onClick={handleVerifyOtp} disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button className="btn-link" onClick={handleResendOtp} disabled={loading}>
              Resend OTP
            </button>
          </div>
        )}

        {/* Step 3: Reset Password */}
        {step === 3 && (
          <div className="step-content">
            <p className="step-label">Step 3 of 3 — Set new password</p>
            <input
              type="password"
              placeholder="New Password (min 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
            />
            <button onClick={handleResetPassword} disabled={loading}>
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="step-content">
            <p className="success-big">✅ Password Reset Successful!</p>
            <p className="hint">You can now log in with your new password.</p>
            <a href="/login" className="btn-primary-link">Back to Login</a>
          </div>
        )}

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
};

export default ForgotPassword;
