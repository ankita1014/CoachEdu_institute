import express from "express";
import mongoose from "mongoose";
import { syncAllParents } from "../utils/parentSync.js";

import Fees from "../models/Fees.js";
import Homework from "../models/Homework.js";
import Material from "../models/Material.js";
import Notification from "../models/Notification.js";
import Student from "../models/Student.js";
import Test from "../models/Test.js";

const router = express.Router();

// ================= PARENT MODEL =================
const Parent = mongoose.model(
  "parents",
  new mongoose.Schema({}, { strict: false })
);

// ================= HELPERS =================
// Plain text comparison — academic project, no hashing
const comparePassword = (entered, stored) => {
  if (!stored) return false;
  return String(entered) === String(stored);
};

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  const { parentId, password } = req.body;

  try {
    const user = await Parent.findOne({
      $or: [{ parentId }, { parentid: parentId }],
    });

    if (!user) {
      return res.status(401).json({ success: false });
    }

    const isMatch = comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// ── class normalizer (mirrors studentRoutes logic) ──────────────────────────
const normalizeClassVariants = (value) => {
  if (!value) return [];
  const raw = String(value).trim();
  const lower = raw.toLowerCase();
  const variants = new Set([raw]);
  const numberMatch = lower.match(/(\d+)/);
  if (numberMatch) {
    const n = numberMatch[1];
    variants.add(`Class ${n}`);
    variants.add(`class ${n}`);
    variants.add(`${n}th`);
    variants.add(`${n}st`);
    variants.add(`${n}nd`);
    variants.add(`${n}rd`);
    variants.add(n);
  }
  return Array.from(variants);
};

// ================= DASHBOARD =================
router.get("/dashboard/:parentId", async (req, res) => {
  try {
    const parent = await Parent.findOne({
      $or: [
        { parentId: req.params.parentId },
        { parentid: req.params.parentId },
      ],
    });

    if (!parent) {
      return res.status(404).json({ success: false, message: "Parent not found" });
    }

    const student = await Student.findOne({ studentId: parent.studentId });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const classVariants = normalizeClassVariants(student.class);

    // Fees — auto-create if missing
    let feeRecord = await Fees.findOne({ studentId: student.studentId });
    if (!feeRecord) {
      feeRecord = await Fees.create({
        studentId: student.studentId,
        totalFees: 800,
        paid: 0,
        remaining: 800,
        status: "pending",
        installments: [],
      });
    }

    // Homework, materials, tests — use class variants for cross-format matching
    const [homework, materials, tests, notifications] = await Promise.all([
      Homework.find({ className: { $in: classVariants } }).sort({ dueDate: 1 }),
      Material.find({ className: { $in: classVariants } }).sort({ createdAt: -1 }),
      Test.find({ className: { $in: classVariants } }).sort({ dueDate: 1 }),
      Notification.find({
        $or: [
          { className: { $in: [...classVariants, "All Classes"] } },
          { "recipients.studentId": student.studentId },
        ],
      }).sort({ createdAt: -1 }),
    ]);

    // Attendance from raw collection
    const rawAttendance = await mongoose.connection.db
      .collection("attendance")
      .find({})
      .toArray();

    const attendance = rawAttendance
      .flatMap((entry) => {
        if (Array.isArray(entry.records)) {
          const record = entry.records.find(
            (r) => r.studentId === student.studentId || r.studentId === String(student._id)
          );
          return record ? [{ date: entry.date, status: record.status }] : [];
        }
        if (entry.studentId === student.studentId || entry.studentId === String(student._id)) {
          return [{ date: entry.date, status: entry.status }];
        }
        return [];
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    // Summary stats (same logic as studentRoutes)
    const attendancePercentage = attendance.length
      ? Math.round(
          (attendance.filter((r) => r.status === "present").length / attendance.length) * 100
        )
      : 0;

    const evaluatedTests = tests
      .map((t) => t.submissions?.find((s) => s.studentId === student.studentId))
      .filter((s) => s && s.status === "evaluated");

    const performancePercentage = evaluatedTests.length
      ? Math.round(
          evaluatedTests.reduce((sum, s) => sum + (s.score || 0), 0) / evaluatedTests.length
        )
      : 0;

    const pendingHomework = homework.filter((item) => {
      const sub = item.submissions?.find((s) => s.studentId === student.studentId);
      return !sub || sub.status === "pending";
    }).length;

    // Attach student's own submission to each homework/test for parent view
    const homeworkWithSub = homework.map((item) => ({
      ...item.toObject(),
      studentSubmission: item.submissions?.find((s) => s.studentId === student.studentId) || null,
    }));

    const testsWithSub = tests.map((item) => ({
      ...item.toObject(),
      studentSubmission: item.submissions?.find((s) => s.studentId === student.studentId) || null,
    }));

    res.json({
      success: true,
      data: {
        student,
        fees: feeRecord,
        homework: homeworkWithSub,
        materials,
        tests: testsWithSub,
        notifications,
        attendance,
        summary: {
          attendancePercentage,
          performancePercentage,
          pendingHomework,
        },
      },
    });
  } catch (err) {
    console.error("PARENT_DASHBOARD_ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ================= PUBLIC REVIEWS =================
router.get("/reviews", async (req, res) => {
  try {
    const parents = await Parent.find({}, "name review childName studentId").limit(20);

    const fallbackReviews = [
      "Very satisfied with my child's progress at this institute.",
      "The teachers are very supportive and the teaching methods are excellent.",
      "My child's confidence has improved a lot after joining this coaching.",
      "Best coaching for building strong academic basics.",
    ];

    const staticNames = ["Priya Deshmukh", "Rajesh Patil", "Sneha Kulkarni", "Anita Sharma"];

    const reviews = parents
      .filter((p) => p.name)
      .slice(0, 4)
      .map((p, i) => ({
        name: p.name,
        review: p.review || fallbackReviews[i % fallbackReviews.length],
      }));

    if (reviews.length === 0) {
      return res.json({
        success: true,
        reviews: staticNames.map((name, i) => ({ name, review: fallbackReviews[i] })),
      });
    }

    res.json({ success: true, reviews });
  } catch (err) {
    console.error("REVIEWS_ERROR:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ================= SYNC (manual trigger) =================
router.post("/sync", async (_req, res) => {
  try {
    await syncAllParents();
    res.json({ success: true, message: "Parent sync completed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= LIST ALL PARENTS =================
router.get("/list", async (_req, res) => {
  try {
    const parents = await Parent.find({}, "-password").sort({ createdAt: -1 });
    res.json({ success: true, parents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;