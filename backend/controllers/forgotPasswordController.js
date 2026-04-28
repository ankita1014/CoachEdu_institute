// WARNING: Plain text passwords — demo project only, not for production
import bcrypt from 'bcryptjs';
import mongoose from "mongoose";

// Use loose schemas so we can work with existing collections as-is
const Student = mongoose.model(
  "fp_students",
  new mongoose.Schema({}, { strict: false }),
  "students"
);

const Parent = mongoose.model(
  "fp_parents",
  new mongoose.Schema({}, { strict: false }),
  "parents"
);

// In-memory OTP store: { [id]: { otp, expiry, userType } }
const otpStore = {};

// ─── helpers ────────────────────────────────────────────────────────────────

const findUser = async (id) => {
  // Try Student first
  let user = await Student.findOne({
    $or: [{ studentId: id }, { studentid: id }],
  });
  if (user) return { user, userType: "student" };

  // Then Parent
  user = await Parent.findOne({
    $or: [{ parentId: id }, { parentid: id }],
  });
  if (user) return { user, userType: "parent" };

  return null;
};

const getPhone = (user, userType) => {
  // Student stores parent's phone as parentPhone
  // Parent may store as phone, parentPhone, or mobile
  if (userType === "student") {
    return user.parentPhone || user.phone || user.mobile || null;
  }
  return user.phone || user.parentPhone || user.mobile || null;
};

const maskPhone = (phone) => {
  if (!phone) return "XXXXXX????";
  const str = String(phone);
  return "XXXXXX" + str.slice(-4);
};

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ─── STEP 1: Find user by studentId or parentId ─────────────────────────────
export const forgotFindUser = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || !id.trim()) {
      return res.status(400).json({ success: false, message: "ID is required" });
    }

    const result = await findUser(id.trim());

    if (!result) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const phone = getPhone(result.user, result.userType);

    return res.json({
      success: true,
      userType: result.userType,
      maskedPhone: maskPhone(phone),
    });
  } catch (err) {
    console.error("forgotFindUser error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── STEP 2: Verify phone number ────────────────────────────────────────────
export const forgotVerifyPhone = async (req, res) => {
  try {
    const { id, phone } = req.body;

    if (!id || !phone) {
      return res.status(400).json({ success: false, message: "ID and phone are required" });
    }

    const result = await findUser(id.trim());

    if (!result) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const storedPhone = getPhone(result.user, result.userType);

    if (!storedPhone || String(storedPhone).trim() !== String(phone).trim()) {
      return res.status(400).json({ success: false, message: "Phone number does not match" });
    }

    return res.json({ success: true, message: "Phone verified" });
  } catch (err) {
    console.error("forgotVerifyPhone error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── STEP 3: Send OTP ────────────────────────────────────────────────────────
export const forgotSendOtp = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: "ID is required" });
    }

    const result = await findUser(id.trim());

    if (!result) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Rate limit: prevent spam (1 OTP per 60 seconds)
    const existing = otpStore[id];
    if (existing && existing.expiry - Date.now() > 4 * 60 * 1000) {
      return res.status(429).json({
        success: false,
        message: "OTP already sent. Please wait before requesting again.",
      });
    }

    const otp = generateOTP();
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore[id.trim()] = { otp, expiry, userType: result.userType };

    // Demo mode: log OTP to console
    console.log(`\n🔐 OTP for [${id}]: ${otp} (expires in 5 min)\n`);

    return res.json({
      success: true,
      message: "OTP sent successfully",
      otp, // DEMO ONLY — remove in production
    });
  } catch (err) {
    console.error("forgotSendOtp error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── STEP 4: Verify OTP ──────────────────────────────────────────────────────
export const forgotVerifyOtp = async (req, res) => {
  try {
    const { id, otp } = req.body;

    if (!id || !otp) {
      return res.status(400).json({ success: false, message: "ID and OTP are required" });
    }

    const record = otpStore[id.trim()];

    if (!record) {
      return res.status(400).json({ success: false, message: "OTP not found. Please request a new one." });
    }

    if (Date.now() > record.expiry) {
      delete otpStore[id.trim()];
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    if (record.otp !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Mark OTP as verified (keep in store for reset-password step)
    otpStore[id.trim()].verified = true;

    return res.json({ success: true, message: "OTP verified" });
  } catch (err) {
    console.error("forgotVerifyOtp error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── STEP 5: Reset Password ──────────────────────────────────────────────────
export const forgotResetPassword = async (req, res) => {
  try {
    const { id, newPassword } = req.body;

    if (!id || !newPassword) {
      return res.status(400).json({ success: false, message: "ID and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const record = otpStore[id.trim()];

    if (!record || !record.verified) {
      return res.status(403).json({ success: false, message: "OTP not verified. Please complete verification first." });
    }

    const result = await findUser(id.trim());

    if (!result) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Hash new password before saving
    const hashed = await bcrypt.hash(newPassword, 10);

    if (result.userType === "student") {
      await Student.updateOne(
        { $or: [{ studentId: id.trim() }, { studentid: id.trim() }] },
        { $set: { password: hashed } }
      );
    } else {
      await Parent.updateOne(
        { $or: [{ parentId: id.trim() }, { parentid: id.trim() }] },
        { $set: { password: hashed } }
      );
    }

    // Clean up OTP
    delete otpStore[id.trim()];

    return res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("forgotResetPassword error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
