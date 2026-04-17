import express from "express";
import nodemailer from "nodemailer";
import Inquiry from "../models/Inquiry.js";

const router = express.Router();

// ── email helper (inline — no dep on existing email.js) ─────────────────────
const sendInquiryEmail = async ({ name, email, phone, type, message }) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const adminEmail = process.env.ADMIN_EMAIL || "dnyanminakshi6@gmail.com";

  if (!user || !pass) {
    console.log("[inquiry] Email not configured — skipping send");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });

  const body = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#6c63ff,#8f7cff);padding:28px 24px;text-align:center;">
        <h2 style="margin:0;color:#fff;font-size:20px;">New Inquiry Received</h2>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">CoachEdu Institute</p>
      </div>
      <div style="padding:28px 24px;background:#f8fafc;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:10px 0;color:#64748b;width:130px;">Name</td><td style="padding:10px 0;color:#1e293b;font-weight:600;">${name}</td></tr>
          <tr style="border-top:1px solid #e2e8f0;"><td style="padding:10px 0;color:#64748b;">Email</td><td style="padding:10px 0;color:#1e293b;">${email}</td></tr>
          <tr style="border-top:1px solid #e2e8f0;"><td style="padding:10px 0;color:#64748b;">Phone</td><td style="padding:10px 0;color:#1e293b;">${phone}</td></tr>
          <tr style="border-top:1px solid #e2e8f0;"><td style="padding:10px 0;color:#64748b;">Inquiry Type</td><td style="padding:10px 0;"><span style="background:#ede9fe;color:#6c63ff;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;">${type}</span></td></tr>
          <tr style="border-top:1px solid #e2e8f0;"><td style="padding:10px 0;color:#64748b;vertical-align:top;">Message</td><td style="padding:10px 0;color:#1e293b;line-height:1.6;">${message}</td></tr>
        </table>
      </div>
      <div style="padding:16px 24px;background:#f1f5f9;text-align:center;">
        <p style="margin:0;color:#94a3b8;font-size:12px;">© 2026 CoachEdu Institute. All rights reserved.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"CoachEdu Institute" <${user}>`,
    to: adminEmail,
    subject: "New Inquiry Received - CoachEdu Institute",
    html: body,
  });
};

// ── POST /api/inquiry ────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, type, message } = req.body;

    // validation
    if (!name?.trim() || !email?.trim() || !phone?.trim() || !type || !message?.trim()) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email address" });
    }
    if (!/^\d{10}$/.test(phone.replace(/\s+/g, ""))) {
      return res.status(400).json({ success: false, message: "Phone must be 10 digits" });
    }

    // save to DB
    const inquiry = await Inquiry.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      type,
      message: message.trim(),
    });

    // send email (non-fatal)
    try {
      await sendInquiryEmail({ name, email, phone, type, message });
    } catch (emailErr) {
      console.error("[inquiry] Email send failed:", emailErr.message);
    }

    res.status(201).json({ success: true, message: "Inquiry submitted successfully", inquiry });
  } catch (err) {
    console.error("INQUIRY_ERROR:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ── GET /api/inquiry (teacher/admin view) ────────────────────────────────────
router.get("/", async (_req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.json({ success: true, inquiries });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
