import express from "express";
import fs from "fs";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import Fees from "../models/Fees.js";
import Homework from "../models/Homework.js";
import Material from "../models/Material.js";
import Notification from "../models/Notification.js";
import Student from "../models/Student.js";
import Test from "../models/Test.js";
import { createParentForStudent, deleteParentForStudent } from "../utils/parentSync.js";
import { makePassword } from "../utils/parentSync.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const studentHomeworkDir = path.join(__dirname, "..", "uploads", "student-homework");

if (!fs.existsSync(studentHomeworkDir)) {
  fs.mkdirSync(studentHomeworkDir, { recursive: true });
}

const submissionStorage = multer.diskStorage({
  destination: (_req, _file, cb) => { cb(null, studentHomeworkDir); },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`);
  },
});

const submissionUpload = multer({ storage: submissionStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// ── helpers ──────────────────────────────────────────────────────────────────

const normalizeClassVariants = (value) => {
  if (!value) return [];
  const raw = String(value).trim();
  const lower = raw.toLowerCase();
  const variants = new Set([raw]);
  const m = lower.match(/(\d+)/);
  if (m) {
    const n = m[1];
    variants.add("Class " + n);
    variants.add("class " + n);
    variants.add(n + "th");
    variants.add(n + "st");
    variants.add(n + "nd");
    variants.add(n + "rd");
    variants.add(n);
  }
  return Array.from(variants);
};

// Build a MongoDB query that matches className regardless of format
// e.g. student.class="3rd" matches homework.className="Class 3" and vice versa
const buildClassQuery = (studentClass) => {
  const variants = normalizeClassVariants(studentClass);
  const m = String(studentClass || "").match(/(\d+)/);
  if (!m) return { className: { $in: variants } };
  const n = m[1];
  // case-insensitive regex: matches "Class 3", "class3", "3rd", "3th", "3", etc.
  const regex = new RegExp("^(class\\s*" + n + "|" + n + "(st|nd|rd|th)?)$", "i");
  return { $or: [{ className: { $in: variants } }, { className: regex }] };
};

const getStudentByIdentifier = async (studentId) => {
  if (!studentId) return null;
  // Always query by the custom studentId string — never use _id for student lookup
  return Student.findOne({ studentId: String(studentId) });
};

const buildSubmissionMeta = (submission, parentId) => ({
  id: submission?._id,
  parentId,
  studentId: submission?.studentId || "",
  studentName: submission?.studentName || "",
  status: submission?.status || "pending",
  score: submission?.score ?? submission?.marks ?? 0,
  feedback: submission?.feedback || "",
  submittedAt: submission?.submittedAt || null,
  fileUrl: submission?.fileUrl || "",
});

// ── DEBUG: see exactly what's stored for a student ───────────────────────────
// GET /api/student/debug/:studentId
router.get("/debug/:studentId", async (req, res) => {
  try {
    const student = await getStudentByIdentifier(req.params.studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });

    const classVariants = normalizeClassVariants(student.class);
    const classQuery = buildClassQuery(student.class);

    const [allHw, allMat, allTests] = await Promise.all([
      Homework.find({}, "title className").lean(),
      Material.find({}, "title className").lean(),
      Test.find({}, "title className").lean(),
    ]);

    const matchedHw = await Homework.find(classQuery, "title className").lean();
    const matchedMat = await Material.find(classQuery, "title className").lean();
    const matchedTests = await Test.find(classQuery, "title className").lean();

    res.json({
      student: { studentId: student.studentId, class: student.class, name: student.name },
      classVariants,
      classQuery,
      allHomework: allHw.map(h => ({ title: h.title, className: h.className })),
      matchedHomework: matchedHw.map(h => ({ title: h.title, className: h.className })),
      allMaterials: allMat.map(m => ({ title: m.title, className: m.className })),
      matchedMaterials: matchedMat.map(m => ({ title: m.title, className: m.className })),
      allTests: allTests.map(t => ({ title: t.title, className: t.className })),
      matchedTests: matchedTests.map(t => ({ title: t.title, className: t.className })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── JS-level class match fallback ─────────────────────────────────────────────
// Used when MongoDB query returns 0 — filters in memory by extracting class number
const jsClassMatch = (itemClassName, studentClass) => {
  if (!itemClassName || !studentClass) return false;
  const itemNum = String(itemClassName).match(/(\d+)/)?.[1];
  const stuNum = String(studentClass).match(/(\d+)/)?.[1];
  return itemNum && stuNum && itemNum === stuNum;
};

const fetchWithFallback = async (Model, classQuery, studentClass, sort) => {
  const results = await Model.find(classQuery).sort(sort);
  if (results.length > 0) return results;
  // Fallback: fetch all and filter by number match in JS
  const all = await Model.find({}).sort(sort);
  return all.filter(item => jsClassMatch(item.className, studentClass));
};

router.get("/students", async (_req, res) => {
  try {
    const students = await Student.find();
    res.json({ success: true, students });
  } catch (err) {
    console.error("STUDENTS_LIST_ERROR:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/dashboard", async (req, res) => {
  try {
    const { studentId } = req.query;
    const student = await getStudentByIdentifier(studentId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const classQuery = buildClassQuery(student.class);

    const [homework, materials, tests, rawAttendance] = await Promise.all([
      fetchWithFallback(Homework, classQuery, student.class, { dueDate: 1, createdAt: -1 }),
      fetchWithFallback(Material, classQuery, student.class, { createdAt: -1 }),
      fetchWithFallback(Test, classQuery, student.class, { dueDate: 1, createdAt: -1 }),
      mongoose.connection.db.collection("attendance").find({}).toArray(),
    ]);

    const attendanceRecords = rawAttendance
      .flatMap((entry) => {
        if (Array.isArray(entry.records)) {
          const r = entry.records.find(
            (item) => item.studentId === student.studentId || item.studentId === String(student._id)
          );
          return r ? [{ date: entry.date, status: r.status }] : [];
        }
        if (entry.studentId === student.studentId || entry.studentId === String(student._id)) {
          return [{ date: entry.date, status: entry.status }];
        }
        return [];
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const attendancePercentage = attendanceRecords.length
      ? Math.round((attendanceRecords.filter((r) => r.status === "present").length / attendanceRecords.length) * 100)
      : 0;

    const evaluatedTests = tests
      .map((t) => t.submissions.find((s) => s.studentId === student.studentId))
      .filter((s) => s && s.status === "evaluated");

    const performancePercentage = evaluatedTests.length
      ? Math.round(evaluatedTests.reduce((sum, s) => sum + (s.score || 0), 0) / evaluatedTests.length)
      : 0;

    const pendingHomework = homework.filter((item) => {
      const sub = item.submissions.find((e) => e.studentId === student.studentId);
      return !sub || sub.status === "pending";
    }).length;

    res.json({
      success: true,
      data: {
        student,
        summary: { attendancePercentage, performancePercentage, pendingHomework },
        recentActivity: {
          homework: homework.slice(0, 3),
          materials: materials.slice(0, 3),
          tests: tests.slice(0, 3),
        },
      },
    });
  } catch (err) {
    console.error("STUDENT_DASHBOARD_ERROR:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/homework/:studentId", async (req, res) => {
  try {
    const student = await getStudentByIdentifier(req.params.studentId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const classQuery = buildClassQuery(student.class);
    const homework = await fetchWithFallback(Homework, classQuery, student.class, { dueDate: 1, createdAt: -1 });

    const data = homework.map((item) => {
      const submission = item.submissions.find((e) => e.studentId === student.studentId);
      return {
        ...item.toObject(),
        studentSubmission: submission ? buildSubmissionMeta(submission, item._id) : null,
      };
    });

    res.json({ success: true, data, student });
  } catch (err) {
    console.error("STUDENT_HOMEWORK_ERROR:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/homework/submit", submissionUpload.single("file"), async (req, res) => {
  try {
    const { homeworkId, studentId } = req.body;
    if (!homeworkId || !studentId) {
      return res.status(400).json({ success: false, message: "Homework and student are required" });
    }

    const homework = await Homework.findById(homeworkId);
    const student = await getStudentByIdentifier(studentId);
    if (!homework || !student) {
      return res.status(404).json({ success: false, message: "Homework or student not found" });
    }

    let submission = homework.submissions.find((e) => e.studentId === student.studentId);

    // If student was added after homework was created, add their submission entry
    if (!submission) {
      homework.submissions.push({
        studentId: student.studentId,
        studentName: student.name,
        status: "pending",
        marks: 0,
        feedback: "",
        submittedAt: null,
        fileUrl: "",
      });
      await homework.save();
      submission = homework.submissions[homework.submissions.length - 1];
    }

    if (submission.fileUrl) {
      const oldFilePath = path.join(studentHomeworkDir, path.basename(submission.fileUrl));
      if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
    }

    submission.fileUrl = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/student-homework/${req.file.filename}`
      : submission.fileUrl;
    submission.status = "submitted";
    submission.submittedAt = new Date();

    const submittedCount = homework.submissions.filter(
      (e) => e.status === "submitted" || e.status === "completed"
    ).length;
    homework.status = submittedCount > 0 ? "submitted" : "pending";

    await homework.save();
    res.json({ success: true, submission: buildSubmissionMeta(submission, homework._id), homework });
  } catch (err) {
    console.error("HOMEWORK_SUBMIT_ERROR:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/materials/:studentId", async (req, res) => {
  try {
    const student = await getStudentByIdentifier(req.params.studentId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const classQuery = buildClassQuery(student.class);
    const data = await fetchWithFallback(Material, classQuery, student.class, { createdAt: -1 });

    res.json({ success: true, data, student });
  } catch (err) {
    console.error("STUDENT_MATERIALS_ERROR:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/tests/:studentId", async (req, res) => {
  try {
    const student = await getStudentByIdentifier(req.params.studentId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const classQuery = buildClassQuery(student.class);
    const tests = await fetchWithFallback(Test, classQuery, student.class, { dueDate: 1, createdAt: -1 });

    const data = tests.map((item) => {
      const submission = item.submissions.find((e) => e.studentId === student.studentId);
      return {
        ...item.toObject(),
        studentSubmission: submission ? buildSubmissionMeta(submission, item._id) : null,
      };
    });

    res.json({ success: true, data, student });
  } catch (err) {
    console.error("STUDENT_TESTS_ERROR:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/attendance/:studentId", async (req, res) => {
  try {
    const student = await getStudentByIdentifier(req.params.studentId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const rawData = await mongoose.connection.db.collection("attendance").find({}).toArray();

    const data = rawData
      .flatMap((entry) => {
        if (Array.isArray(entry.records)) {
          const r = entry.records.find(
            (item) => item.studentId === student.studentId || item.studentId === String(student._id)
          );
          return r ? [{ date: entry.date, status: r.status }] : [];
        }
        if (entry.studentId === student.studentId || entry.studentId === String(student._id)) {
          return [{ date: entry.date, status: entry.status }];
        }
        return [];
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const percentage = data.length
      ? Math.round((data.filter((r) => r.status === "present").length / data.length) * 100)
      : 0;

    res.json({ success: true, data, percentage, student });
  } catch (err) {
    console.error("STUDENT_ATTENDANCE_ERROR:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/notifications/:studentId", async (req, res) => {
  try {
    const student = await getStudentByIdentifier(req.params.studentId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const classVariants = normalizeClassVariants(student.class);
    const data = await Notification.find({
      $or: [
        { "recipients.studentId": student.studentId },
        { className: { $in: [...classVariants, "All Classes"] } },
      ],
    }).sort({ sentAt: -1, scheduledAt: -1, createdAt: -1 });

    res.json({ success: true, data, student });
  } catch (err) {
    console.error("STUDENT_NOTIFICATIONS_ERROR:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/fees", async (_req, res) => {
  try {
    const students = await Student.find();
    for (const student of students) {
      const existing = await Fees.findOne({ studentId: student.studentId });
      if (!existing) {
        const random = Math.random();
        let paid = 0, status = "pending";
        if (random > 0.7) { paid = 800; status = "paid"; }
        else if (random > 0.3) { paid = 400; status = "partial"; }
        await Fees.create({ studentId: student.studentId, totalFees: 800, paid, remaining: 800 - paid, status, installments: [] });
      }
    }
    const allFees = await Fees.find();
    res.json({ success: true, data: allFees });
  } catch (err) {
    console.error("FEES_ERROR:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/installment", async (req, res) => {
  const { studentId, nextDate, amount } = req.body;
  let record = await Fees.findOne({ studentId });
  if (!record) {
    record = await Fees.create({ studentId, totalFees: 800, paid: 0, remaining: 800, status: "pending", installments: [] });
  }
  record.installments.push({ date: nextDate, amount: amount || 0 });
  await record.save();
  res.json({ success: true });
});

// ── RECORD PAYMENT — updates paid/remaining/status ────────────────────────────
router.post("/fees/payment", async (req, res) => {
  try {
    const { studentId, amount } = req.body;
    const paid = Number(amount);
    if (!studentId || !paid || paid <= 0) {
      return res.status(400).json({ success: false, message: "studentId and a positive amount are required" });
    }

    let record = await Fees.findOne({ studentId });
    if (!record) {
      return res.status(404).json({ success: false, message: "Fee record not found" });
    }

    const newPaid      = Math.min(record.paid + paid, record.totalFees);
    const newRemaining = Math.max(record.totalFees - newPaid, 0);
    const newStatus    = newRemaining === 0 ? "paid" : newPaid > 0 ? "partial" : "pending";

    record.paid      = newPaid;
    record.remaining = newRemaining;
    record.status    = newStatus;
    record.installments.push({ date: new Date().toISOString().split("T")[0], amount: paid });
    await record.save();

    res.json({ success: true, fees: record });
  } catch (err) {
    console.error("PAYMENT_ERROR:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/send-reminder", async (req, res) => {
  const { studentId } = req.body;
  await Notification.create({
    title: "Fee Reminder",
    message: "Fees pending. Please pay remaining amount.",
    type: "fees",
    audience: "parents",
    teacherId: "system",
    teacherName: "System",
    status: "sent",
    sentAt: new Date(),
    recipients: [{ studentId, name: "Parent", className: "All Classes", audience: "parents", deliveryStatus: "delivered" }],
    deliverySummary: { delivered: 1, pending: 0, failed: 0 },
  });
  res.json({ success: true });
});

router.post("/add", async (req, res) => {
  try {
    const { name, studentId, class: studentClass, parentPhone, parentName, password, totalFees } = req.body;
    if (!name || !studentId || !studentClass) {
      return res.status(400).json({ success: false, message: "Name, Student ID, and Class are required" });
    }
    const existing = await Student.findOne({ studentId });
    if (existing) {
      return res.status(409).json({ success: false, message: `Student ID "${studentId}" already exists` });
    }
    const studentPassword = makePassword(name);
    const student = await Student.create({
      name, studentId, class: studentClass,
      parentPhone: parentPhone || "", password: studentPassword, role: "student",
    });

    // Auto-create linked parent — pass parentName so the parent record uses it
    const parent = await createParentForStudent({ ...student.toObject(), parentName: parentName || "" });

    await Fees.create({ studentId, totalFees: Number(totalFees) || 800, paid: 0, remaining: Number(totalFees) || 800, status: "pending", installments: [] });

    // Auto-add submission entries to existing homework and tests for this class
    const classQuery = buildClassQuery(studentClass);
    const [existingHomework, existingTests] = await Promise.all([
      Homework.find(classQuery),
      Test.find(classQuery),
    ]);
    for (const hw of existingHomework) {
      const already = hw.submissions.find((s) => s.studentId === studentId);
      if (!already) {
        hw.submissions.push({ studentId, studentName: name, status: "pending", marks: 0, feedback: "", submittedAt: null, fileUrl: "" });
        await hw.save();
      }
    }
    for (const test of existingTests) {
      const already = test.submissions.find((s) => s.studentId === studentId);
      if (!already) {
        test.submissions.push({ studentId, studentName: name, status: "pending", score: 0, feedback: "", submittedAt: null, answers: [] });
        await test.save();
      }
    }
    res.status(201).json({
      success: true,
      message: "Student added successfully",
      student,
      parent: { parentId: parent.parentId, password: parent.password },
    });
  } catch (err) {
    console.error("ADD_STUDENT_ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET single test for attempt (questions visible, no correct answers) ──────
router.get("/test-attempt/:testId", async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    if (!test) return res.status(404).json({ success: false, message: "Test not found" });

    // Strip correct answers before sending to student
    const safeQuestions = test.questions.map((q) => ({
      _id: q._id,
      type: q.type,
      question: q.question,
      options: q.options,
      marks: q.marks,
      // correctAnswer intentionally omitted
    }));

    res.json({
      success: true,
      test: {
        _id: test._id,
        title: test.title,
        subject: test.subject,
        className: test.className,
        totalMarks: test.totalMarks,
        duration: test.duration,
        dueDate: test.dueDate,
        questions: safeQuestions,
      },
    });
  } catch (err) {
    console.error("TEST_ATTEMPT_FETCH_ERROR:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ── POST submit test attempt ──────────────────────────────────────────────────
router.post("/test-attempt/submit", async (req, res) => {
  try {
    const { testId, studentId, answers } = req.body;
    if (!testId || !studentId) {
      return res.status(400).json({ success: false, message: "testId and studentId are required" });
    }

    const test = await Test.findById(testId);
    const student = await getStudentByIdentifier(studentId);
    if (!test || !student) {
      return res.status(404).json({ success: false, message: "Test or student not found" });
    }

    // Prevent duplicate submission
    let submission = test.submissions.find((s) => s.studentId === student.studentId);
    if (submission && submission.status !== "pending") {
      return res.status(409).json({ success: false, message: "Test already submitted" });
    }

    // Auto-grade MCQ answers
    const gradedAnswers = (answers || []).map((a) => {
      const question = test.questions.find((q) => String(q._id) === String(a.questionId));
      const isCorrect = question?.type === "mcq"
        ? question.correctAnswer === a.answer
        : null; // descriptive — teacher grades manually
      return { questionId: a.questionId, answer: a.answer, isCorrect };
    });

    const autoScore = gradedAnswers.reduce((sum, a) => {
      if (a.isCorrect === true) {
        const q = test.questions.find((q) => String(q._id) === String(a.questionId));
        return sum + (q?.marks || 0);
      }
      return sum;
    }, 0);

    const hasDescriptive = test.questions.some((q) => q.type === "descriptive");

    if (submission) {
      // Update existing pending entry
      submission.answers = gradedAnswers;
      submission.status = "submitted";
      submission.submittedAt = new Date();
      submission.score = autoScore;
    } else {
      // Create new submission entry
      test.submissions.push({
        studentId: student.studentId,
        studentName: student.name,
        answers: gradedAnswers,
        status: "submitted",
        submittedAt: new Date(),
        score: autoScore,
        feedback: "",
      });
    }

    await test.save();

    res.json({
      success: true,
      message: "Test submitted successfully",
      autoScore,
      hasDescriptive,
      totalMarks: test.totalMarks,
    });
  } catch (err) {
    console.error("TEST_SUBMIT_ERROR:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.put("/students/:id", async (req, res) => {
  try {
    const { name, class: studentClass, parentPhone } = req.body;
    const update = {};
    if (name) update.name = name;
    if (studentClass) update.class = studentClass;
    if (parentPhone !== undefined) update.parentPhone = parentPhone;
    const student = await Student.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/students/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    // Delete linked parent account (if not shared)
    await deleteParentForStudent(student.studentId);

    await Student.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Student deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
