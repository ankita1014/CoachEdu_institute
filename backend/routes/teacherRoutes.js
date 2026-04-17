import express from "express";
import fs from "fs";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import Material from "../models/Material.js";
import Homework from "../models/Homework.js";
import Notification from "../models/Notification.js";
import Student from "../models/Student.js";
import Test from "../models/Test.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "..", "uploads", "materials");
const homeworkUploadDir = path.join(__dirname, "..", "uploads", "homework");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(homeworkUploadDir)) {
  fs.mkdirSync(homeworkUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const homeworkStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, homeworkUploadDir);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const homeworkUpload = multer({
  storage: homeworkStorage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const normalizeClassVariants = (value) => {
  if (!value) return [];

  const raw = String(value).trim();
  const lower = raw.toLowerCase();
  const variants = new Set([raw]);
  const numberMatch = lower.match(/(\d+)/);

  if (numberMatch) {
    const number = numberMatch[1];
    variants.add(`Class ${number}`);
    variants.add(`class ${number}`);
    variants.add(`${number}th`);
    variants.add(`${number}st`);
    variants.add(`${number}nd`);
    variants.add(`${number}rd`);
    variants.add(number);
  }

  if (lower === "1st - 5th" || lower === "1st-5th") {
    ["1", "2", "3", "4", "5"].forEach((number) => {
      variants.add(`Class ${number}`);
      variants.add(`${number}th`);
      variants.add(number);
    });
  }

  return Array.from(variants);
};

const getStudentsForClass = async (className) => {
  const variants = normalizeClassVariants(className);
  const students = await Student.find({ class: { $in: variants } });
  if (students.length > 0) return students;
  // JS fallback: match by number only
  const all = await Student.find({});
  const num = String(className).match(/(\d+)/)?.[1];
  if (!num) return [];
  return all.filter(s => String(s.class || "").match(/(\d+)/)?.[1] === num);
};

// ── auto-notification helper ─────────────────────────────────────────────────
const createClassNotification = async ({ type, title, message, className, teacherId, teacherName }) => {
  try {
    const students = await getStudentsForClass(className);
    if (!students.length) return;

    const recipients = students.map((s) => ({
      studentId: s.studentId,
      name: s.name,
      className: s.class,
      audience: "students",
      deliveryStatus: "delivered",
    }));

    await Notification.create({
      title,
      message,
      type,
      audience: "students",
      className,
      teacherId: teacherId || "system",
      teacherName: teacherName || "Teacher",
      status: "sent",
      sentAt: new Date(),
      recipients,
      deliverySummary: { delivered: recipients.length, pending: 0, failed: 0 },
    });
  } catch (err) {
    console.error("AUTO_NOTIFICATION_ERROR:", err.message);
    // non-fatal — don't block the main response
  }
};

// connect to "teachers" collection
const Teacher = mongoose.model(
  "teachers",
  new mongoose.Schema({}, { strict: false })
);

// 🔐 TEACHER LOGIN
router.post("/login", async (req, res) => {
  console.log("👉 TEACHER LOGIN HIT");
  console.log("BODY:", req.body);

  const { teacherId, password } = req.body;

  try {
    const user = await Teacher.findOne({ teacherId, password });

    console.log("USER FOUND:", user);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid ID or Password",
      });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("🔥 ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// GET STUDENTS WITH FEES
router.get("/fees", async (req, res) => {
  try {
    const students = await mongoose.connection.db
      .collection("students")
      .find({})
      .toArray();

    const fees = await mongoose.connection.db
      .collection("fees")
      .find({})
      .toArray();

    // 🔥 MERGE DATA
    const result = await Promise.all(
  students.map(async (student) => {
    let fee = fees.find(
      (f) => f.studentId === student.studentId
    );

    // 🔥 AUTO CREATE FEES IF NOT EXISTS
    if (!fee) {
      const newFee = await mongoose.connection.db
        .collection("fees")
        .insertOne({
          studentId: student.studentId,
          totalFees: 800,
          paid: 0,
          remaining: 800,
          status: "pending",
          installments: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      fee = {
        _id: newFee.insertedId,
        studentId: student.studentId,
        totalFees: 800,
        paid: 0,
        remaining: 800,
        status: "pending",
        installments: [],
      };
    }

    return {
      ...student,
      fees: fee,
    };
  })
);

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("FEES ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch fees",
    });
  }
});
// MARK ATTENDANCE
router.post("/attendance", async (req, res) => {
  const { studentId, status, date, records = [] } = req.body;

  try {
    if (date && Array.isArray(records) && records.length) {
      await mongoose.connection.db.collection("attendance").deleteMany({ date });
      await mongoose.connection.db.collection("attendance").insertOne({
        date,
        records,
        createdAt: new Date(),
      });

      return res.json({ success: true });
    }

    await mongoose.connection.db.collection("attendance").insertOne({
      studentId,
      status,
      date,
      createdAt: new Date(),
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error saving attendance" });
  }
});

// GET ATTENDANCE
router.get("/attendance", async (req, res) => {
  try {
    const rawData = await mongoose.connection.db
      .collection("attendance")
      .find({})
      .toArray();

    const grouped = rawData.reduce((accumulator, entry) => {
      if (!entry.date) return accumulator;

      if (!accumulator[entry.date]) {
        accumulator[entry.date] = {
          date: entry.date,
          records: [],
          createdAt: entry.createdAt || new Date(entry.date),
        };
      }

      if (Array.isArray(entry.records)) {
        accumulator[entry.date].records.push(...entry.records);
      } else if (entry.studentId && entry.status) {
        accumulator[entry.date].records.push({
          studentId: entry.studentId,
          status: entry.status,
        });
      }

      return accumulator;
    }, {});

    const data = Object.values(grouped).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    res.json({ success: true, data });
  } catch (err) {
    console.error("ATTENDANCE_LIST_ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance",
    });
  }
});
router.post("/materials", upload.single("file"), async (req, res) => {
  try {
    const { title, subject, className, description, teacherId, teacherName } =
      req.body;

    if (!title || !subject || !className || !teacherId || !req.file) {
      return res.status(400).json({
        success: false,
        message: "Title, subject, class, teacher, and file are required",
      });
    }

    const fileUrl = `${req.protocol}://${req.get(
      "host"
    )}/uploads/materials/${req.file.filename}`;

    const material = await Material.create({
      title,
      subject,
      className,
      description,
      fileUrl,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      teacherId,
      teacherName,
      storageProvider: "local",
    });

    // auto-notify students of this class
    createClassNotification({
      type: "general",
      title: `New Material: ${title}`,
      message: `${subject} study material uploaded by ${teacherName || "your teacher"}.`,
      className,
      teacherId,
      teacherName,
    });

    res.status(201).json({ success: true, material });
  } catch (err) {
    console.error("MATERIAL_UPLOAD_ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to upload material",
    });
  }
});

router.put("/materials/:id", upload.single("file"), async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found",
      });
    }

    const { title, subject, className, description, teacherId, teacherName } =
      req.body;

    if (!title || !subject || !className || !teacherId) {
      return res.status(400).json({
        success: false,
        message: "Title, subject, class, and teacher are required",
      });
    }

    material.title = title;
    material.subject = subject;
    material.className = className;
    material.description = description || "";
    material.teacherId = teacherId;
    material.teacherName = teacherName || material.teacherName;

    if (req.file) {
      const oldPath = path.join(uploadDir, path.basename(material.fileUrl));

      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }

      material.fileUrl = `${req.protocol}://${req.get(
        "host"
      )}/uploads/materials/${req.file.filename}`;
      material.fileName = req.file.originalname;
      material.mimeType = req.file.mimetype;
      material.fileSize = req.file.size;
    }

    await material.save();

    res.json({ success: true, material });
  } catch (err) {
    console.error("MATERIAL_UPDATE_ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to update material",
    });
  }
});

router.get("/materials", async (req, res) => {
  try {
    const { className, subject, teacherId } = req.query;
    const query = {};

    if (className) {
      query.className = className;
    }

    if (subject) {
      query.subject = subject;
    }

    if (teacherId) {
      query.teacherId = teacherId;
    }

    const data = await Material.find(query).sort({ createdAt: -1 });

    res.json({ success: true, data });
  } catch (err) {
    console.error("MATERIAL_LIST_ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch materials",
    });
  }
});

router.delete("/materials/:id", async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found",
      });
    }

    const localPath = path.join(uploadDir, path.basename(material.fileUrl));

    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }

    await Material.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Material deleted" });
  } catch (err) {
    console.error("MATERIAL_DELETE_ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete material",
    });
  }
});

router.post("/homework", homeworkUpload.single("file"), async (req, res) => {
  try {
    const {
      title,
      subject,
      className,
      description,
      dueDate,
      teacherId,
      teacherName,
    } = req.body;

    if (!title || !subject || !className || !description || !dueDate || !teacherId) {
      return res.status(400).json({
        success: false,
        message: "Title, subject, class, description, due date and teacher are required",
      });
    }

    const students = await getStudentsForClass(className);
    const submissions = students.map((student) => ({
      studentId: student.studentId,
      studentName: student.name,
      status: "pending",
      marks: 0,
      feedback: "",
      submittedAt: null,
      fileUrl: "",
    }));

    const homework = await Homework.create({
      title,
      subject,
      className,
      description,
      dueDate,
      teacherId,
      teacherName,
      attachmentUrl: req.file
        ? `${req.protocol}://${req.get("host")}/uploads/homework/${req.file.filename}`
        : "",
      attachmentName: req.file?.originalname || "",
      status: "pending",
      submissions,
    });

    // auto-notify students of this class
    createClassNotification({
      type: "homework",
      title: `New Homework: ${title}`,
      message: `${subject} homework assigned. Due: ${dueDate}`,
      className,
      teacherId,
      teacherName,
    });

    res.status(201).json({ success: true, homework });
  } catch (err) {
    console.error("HOMEWORK_CREATE_ERROR:", err.message);
    res.status(500).json({ success: false, message: "Failed to create homework" });
  }
});

router.get("/homework", async (req, res) => {
  try {
    const { teacherId, subject, className, status } = req.query;
    const query = {};

    if (teacherId) query.teacherId = teacherId;
    if (subject) query.subject = subject;
    if (className) query.className = className;
    if (status) query.status = status;

    const data = await Homework.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) {
    console.error("HOMEWORK_LIST_ERROR:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch homework" });
  }
});

router.put("/homework/:id", homeworkUpload.single("file"), async (req, res) => {
  try {
    const homework = await Homework.findById(req.params.id);

    if (!homework) {
      return res.status(404).json({ success: false, message: "Homework not found" });
    }

    const {
      title,
      subject,
      className,
      description,
      dueDate,
      teacherId,
      teacherName,
      status,
    } = req.body;

    homework.title = title;
    homework.subject = subject;
    homework.className = className;
    homework.description = description;
    homework.dueDate = dueDate;
    homework.teacherId = teacherId;
    homework.teacherName = teacherName || homework.teacherName;
    homework.status = status || homework.status;

    if (req.file) {
      if (homework.attachmentUrl) {
        const oldPath = path.join(homeworkUploadDir, path.basename(homework.attachmentUrl));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      homework.attachmentUrl = `${req.protocol}://${req.get(
        "host"
      )}/uploads/homework/${req.file.filename}`;
      homework.attachmentName = req.file.originalname;
    }

    await homework.save();
    res.json({ success: true, homework });
  } catch (err) {
    console.error("HOMEWORK_UPDATE_ERROR:", err.message);
    res.status(500).json({ success: false, message: "Failed to update homework" });
  }
});

router.delete("/homework/:id", async (req, res) => {
  try {
    const homework = await Homework.findById(req.params.id);

    if (!homework) {
      return res.status(404).json({ success: false, message: "Homework not found" });
    }

    if (homework.attachmentUrl) {
      const filePath = path.join(homeworkUploadDir, path.basename(homework.attachmentUrl));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Homework.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Homework deleted" });
  } catch (err) {
    console.error("HOMEWORK_DELETE_ERROR:", err.message);
    res.status(500).json({ success: false, message: "Failed to delete homework" });
  }
});

router.put("/homework/:id/submissions/:submissionId", async (req, res) => {
  try {
    const { status, marks, feedback } = req.body;
    const homework = await Homework.findById(req.params.id);

    if (!homework) {
      return res.status(404).json({ success: false, message: "Homework not found" });
    }

    const submission = homework.submissions.id(req.params.submissionId);

    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    if (status !== undefined) submission.status = status;
    if (marks !== undefined) submission.marks = Number(marks);
    if (feedback !== undefined) submission.feedback = feedback;

    const total = homework.submissions.length;
    const completed = homework.submissions.filter(
      (item) => item.status === "completed"
    ).length;
    const submitted = homework.submissions.filter(
      (item) => item.status === "submitted" || item.status === "completed"
    ).length;

    if (completed === total && total > 0) {
      homework.status = "completed";
    } else if (submitted > 0) {
      homework.status = "submitted";
    } else {
      homework.status = "pending";
    }

    await homework.save();
    res.json({ success: true, homework });
  } catch (err) {
    console.error("HOMEWORK_REVIEW_ERROR:", err.message);
    res.status(500).json({ success: false, message: "Failed to review submission" });
  }
});

router.post("/tests", async (req, res) => {
  try {
    const {
      title,
      subject,
      className,
      totalMarks,
      duration,
      dueDate,
      teacherId,
      teacherName,
      status,
      questions = [],
    } = req.body;

    if (
      !title ||
      !subject ||
      !className ||
      !totalMarks ||
      !duration ||
      !dueDate ||
      !teacherId ||
      !Array.isArray(questions) ||
      questions.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Title, subject, class, total marks, duration, due date, teacher and questions are required",
      });
    }

    const students = await getStudentsForClass(className);
    const submissions = students.map((student) => ({
      studentId: student.studentId,
      studentName: student.name,
      status: "pending",
      score: 0,
      feedback: "",
      submittedAt: null,
      answers: [],
    }));

    const test = await Test.create({
      title,
      subject,
      className,
      totalMarks: Number(totalMarks),
      duration: Number(duration),
      dueDate,
      teacherId,
      teacherName,
      status: status || "active",
      questions: questions.map((question) => ({
        ...question,
        marks: Number(question.marks || 1),
      })),
      submissions,
    });

    // auto-notify students of this class
    createClassNotification({
      type: "test",
      title: `New Test: ${title}`,
      message: `${subject} test scheduled. Due: ${dueDate}. Total marks: ${totalMarks}.`,
      className,
      teacherId,
      teacherName,
    });

    res.status(201).json({ success: true, test });
  } catch (err) {
    console.error("TEST_CREATE_ERROR:", err.message);
    res.status(500).json({ success: false, message: "Failed to create test" });
  }
});

router.get("/tests", async (req, res) => {
  try {
    const { teacherId, subject, className, status } = req.query;
    const query = {};

    if (teacherId) query.teacherId = teacherId;
    if (subject) query.subject = subject;
    if (className) query.className = className;
    if (status) query.status = status;

    const data = await Test.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) {
    console.error("TEST_LIST_ERROR:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch tests" });
  }
});

router.put("/tests/:id", async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({ success: false, message: "Test not found" });
    }

    const {
      title,
      subject,
      className,
      totalMarks,
      duration,
      dueDate,
      teacherId,
      teacherName,
      status,
      questions = [],
    } = req.body;

    test.title = title;
    test.subject = subject;
    test.className = className;
    test.totalMarks = Number(totalMarks);
    test.duration = Number(duration);
    test.dueDate = dueDate;
    test.teacherId = teacherId;
    test.teacherName = teacherName || test.teacherName;
    test.status = status || test.status;
    test.questions = questions.map((question) => ({
      ...question,
      marks: Number(question.marks || 1),
    }));

    await test.save();
    res.json({ success: true, test });
  } catch (err) {
    console.error("TEST_UPDATE_ERROR:", err.message);
    res.status(500).json({ success: false, message: "Failed to update test" });
  }
});

router.delete("/tests/:id", async (req, res) => {
  try {
    const test = await Test.findByIdAndDelete(req.params.id);

    if (!test) {
      return res.status(404).json({ success: false, message: "Test not found" });
    }

    res.json({ success: true, message: "Test deleted" });
  } catch (err) {
    console.error("TEST_DELETE_ERROR:", err.message);
    res.status(500).json({ success: false, message: "Failed to delete test" });
  }
});

router.put("/tests/:id/submissions/:submissionId", async (req, res) => {
  try {
    const { status, score, feedback } = req.body;
    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({ success: false, message: "Test not found" });
    }

    const submission = test.submissions.id(req.params.submissionId);

    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    if (status !== undefined) submission.status = status;
    if (score !== undefined) submission.score = Number(score);
    if (feedback !== undefined) submission.feedback = feedback;

    await test.save();
    res.json({ success: true, test });
  } catch (err) {
    console.error("TEST_REVIEW_ERROR:", err.message);
    res.status(500).json({ success: false, message: "Failed to review test submission" });
  }
});

// GET STUDENT ATTENDANCE
router.get("/student-attendance/:studentId", async (req, res) => {
  const data = await mongoose.connection.db
    .collection("attendance")
    .find({ studentId: req.params.studentId })
    .toArray();

  res.json({ success: true, data });
});
// ADD STUDENT
router.post("/students", async (req, res) => {
  try {
    const result = await mongoose.connection.db
      .collection("students")
      .insertOne(req.body);

    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// UPDATE STUDENT
router.put("/students/:id", async (req, res) => {
  const { id } = req.params;

  await mongoose.connection.db.collection("students").updateOne(
    { _id: new mongoose.Types.ObjectId(id) },
    { $set: req.body }
  );

  res.json({ success: true });
});

// DELETE STUDENT
router.delete("/students/:id", async (req, res) => {
  const { id } = req.params;

  await mongoose.connection.db.collection("students").deleteOne({
    _id: new mongoose.Types.ObjectId(id),
  });

  res.json({ success: true });
});

router.get("/notifications", async (req, res) => {
  try {
    const { teacherId, type, audience, status, search, date } = req.query;
    const query = {};

    if (teacherId) query.teacherId = teacherId;
    if (type && type !== "all") query.type = type;
    if (audience && audience !== "all") query.audience = audience;
    if (status && status !== "all") query.status = status;

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.$or = [
        { sentAt: { $gte: start, $lte: end } },
        { scheduledAt: { $gte: start, $lte: end } },
        { createdAt: { $gte: start, $lte: end } },
      ];
    }

    if (search) {
      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { message: { $regex: search, $options: "i" } },
          ],
        },
      ];
    }

    const notifications = await Notification.find(query).sort({
      scheduledAt: -1,
      sentAt: -1,
      createdAt: -1,
    });

    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error("NOTIFICATION_LIST_ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
});

router.post("/notifications", async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      audience,
      recipients = [],
      className,
      sendMode = "now",
      scheduledAt,
      channels = {},
      teacherId,
      teacherName,
      action = "send",
    } = req.body;

    if (!title || !message || !teacherId) {
      return res.status(400).json({
        success: false,
        message: "Title, message, and teacher are required",
      });
    }

    const normalizedRecipients = recipients.map((recipient) => ({
      studentId: recipient.studentId || "",
      name: recipient.name || "Recipient",
      className: recipient.className || className || "All Classes",
      audience: recipient.audience || audience || "students",
      deliveryStatus:
        action === "send" && sendMode === "now" ? "delivered" : "pending",
    }));

    const deliverySummary = normalizedRecipients.reduce(
      (summary, recipient) => {
        summary[recipient.deliveryStatus] += 1;
        return summary;
      },
      { delivered: 0, pending: 0, failed: 0 }
    );

    const notification = await Notification.create({
      title,
      message,
      type: type || "general",
      audience: audience || "students",
      recipients: normalizedRecipients,
      className: className || "All Classes",
      channels: {
        sms: Boolean(channels.sms),
        email: Boolean(channels.email),
        app: channels.app !== false,
      },
      status:
        action === "draft"
          ? "draft"
          : sendMode === "later"
          ? "scheduled"
          : "sent",
      scheduledAt: sendMode === "later" ? scheduledAt : null,
      sentAt: action === "draft" || sendMode === "later" ? null : new Date(),
      teacherId,
      teacherName,
      deliverySummary,
    });

    res.status(201).json({ success: true, notification });
  } catch (err) {
    console.error("NOTIFICATION_CREATE_ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to create notification",
    });
  }
});

router.put("/notifications/:id", async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    const {
      title,
      message,
      type,
      audience,
      recipients = [],
      className,
      sendMode = "now",
      scheduledAt,
      channels = {},
      teacherId,
      teacherName,
      action = "send",
      status,
    } = req.body;

    notification.title = title || notification.title;
    notification.message = message || notification.message;
    notification.type = type || notification.type;
    notification.audience = audience || notification.audience;
    notification.className = className || notification.className;
    notification.teacherId = teacherId || notification.teacherId;
    notification.teacherName = teacherName || notification.teacherName;
    notification.channels = {
      sms: Boolean(channels.sms),
      email: Boolean(channels.email),
      app: channels.app !== false,
    };
    notification.recipients = recipients.map((recipient) => ({
      studentId: recipient.studentId || "",
      name: recipient.name || "Recipient",
      className: recipient.className || className || "All Classes",
      audience: recipient.audience || audience || "students",
      deliveryStatus: recipient.deliveryStatus || "pending",
    }));
    notification.deliverySummary = notification.recipients.reduce(
      (summary, recipient) => {
        summary[recipient.deliveryStatus] += 1;
        return summary;
      },
      { delivered: 0, pending: 0, failed: 0 }
    );
    notification.status =
      status ||
      (action === "draft"
        ? "draft"
        : sendMode === "later"
        ? "scheduled"
        : "sent");
    notification.scheduledAt = sendMode === "later" ? scheduledAt : null;
    notification.sentAt =
      action === "draft" || sendMode === "later"
        ? notification.sentAt
        : new Date();

    await notification.save();
    res.json({ success: true, notification });
  } catch (err) {
    console.error("NOTIFICATION_UPDATE_ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to update notification",
    });
  }
});

router.post("/notifications/:id/retry", async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.status = "sent";
    notification.sentAt = new Date();
    notification.recipients = notification.recipients.map((recipient) => ({
      ...recipient.toObject(),
      deliveryStatus: "delivered",
    }));
    notification.deliverySummary = {
      delivered: notification.recipients.length,
      pending: 0,
      failed: 0,
    };

    await notification.save();
    res.json({ success: true, notification });
  } catch (err) {
    console.error("NOTIFICATION_RETRY_ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to retry notification",
    });
  }
});

router.delete("/notifications/:id", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    console.error("NOTIFICATION_DELETE_ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
});

export default router;
