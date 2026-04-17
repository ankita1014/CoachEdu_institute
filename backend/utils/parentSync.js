/**
 * parentSync.js
 * Strict schema: { name, parentId, password, phone, studentId, role }
 * Password format: FirstName@1234  (e.g. "Ankita@1234")
 */

import mongoose from "mongoose";

const Parent = mongoose.model(
  "sync_parents",
  new mongoose.Schema({}, { strict: false }),
  "parents"
);

// ── Password helper ───────────────────────────────────────────────────────────
// "Ankita Kiran Swami" → "Ankita@1234"
// "" or null           → "1234"
export const makePassword = (name) => {
  if (!name || !name.trim()) return "1234";
  const first = name.trim().split(/\s+/)[0];
  if (!first) return "1234";
  const normalized = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  return `${normalized}@1234`;
};

// ── ID mapping: "stu014" → "par014" ──────────────────────────────────────────
export const deriveParentId = (studentId) => {
  const match = String(studentId).match(/(\d+)$/);
  if (match) return "par" + match[1].padStart(3, "0");
  return "par" + Date.now();
};

// ── Build a clean parent document ─────────────────────────────────────────────
const buildParentDoc = (student) => {
  const name = student.parentName && student.parentName.trim()
    ? student.parentName.trim()
    : "Parent";

  return {
    name,
    parentId: deriveParentId(student.studentId),
    password: makePassword(name),
    phone: student.parentPhone || "",
    studentId: student.studentId,
    role: "parent",
  };
};

// ── Create parent for a student (idempotent) ──────────────────────────────────
export const createParentForStudent = async (student) => {
  const parentId = deriveParentId(student.studentId);

  const existing = await Parent.findOne({
    $or: [{ parentId }, { studentId: student.studentId }],
  });
  if (existing) return existing;

  const doc = buildParentDoc(student);
  const parent = await Parent.create(doc);
  console.log(`[parentSync] Created ${parentId} (${doc.password}) for student ${student.studentId}`);
  return parent;
};

// ── Delete parent when student is deleted ─────────────────────────────────────
export const deleteParentForStudent = async (studentId) => {
  const parent = await Parent.findOne({ studentId });
  if (!parent) return;
  await Parent.deleteOne({ _id: parent._id });
  console.log(`[parentSync] Deleted ${parent.parentId} (linked to ${studentId})`);
};

// ── Fix any existing parent records that have extra/wrong fields ──────────────
const cleanExistingParents = async () => {
  const dirtyParents = await Parent.find({
    $or: [
      { email: { $exists: true } },
      { linkedStudentId: { $exists: true } },
    ],
  });

  for (const p of dirtyParents) {
    await Parent.updateOne(
      { _id: p._id },
      { $unset: { email: "", linkedStudentId: "", createdAt: "" } }
    );
    console.log(`[parentSync] Cleaned extra fields from ${p.parentId}`);
  }
};

// ── Update all existing student + parent passwords to FirstName@1234 ──────────
export const syncPasswordFormat = async () => {
  try {
    const Student = mongoose.model("Student");
    const students = await Student.find({});
    let stuUpdated = 0;

    for (const s of students) {
      const newPwd = makePassword(s.name);
      if (s.password !== newPwd) {
        await Student.updateOne({ _id: s._id }, { $set: { password: newPwd } });
        stuUpdated++;
      }
    }

    const parents = await Parent.find({});
    let parUpdated = 0;

    for (const p of parents) {
      const newPwd = makePassword(p.name);
      if (p.password !== newPwd) {
        await Parent.updateOne({ _id: p._id }, { $set: { password: newPwd } });
        parUpdated++;
      }
    }

    console.log(`[passwordSync] Updated ${stuUpdated} student(s) and ${parUpdated} parent(s) to FirstName@1234 format`);
  } catch (err) {
    console.error("[passwordSync] Failed:", err.message);
  }
};

// ── Sync all students → create missing parents, clean dirty ones ──────────────
export const syncAllParents = async () => {
  try {
    const Student = mongoose.model("Student");
    const students = await Student.find({});
    let created = 0;

    // 1. Clean up extra fields
    await cleanExistingParents();

    // 2. Create missing parent accounts
    for (const student of students) {
      const parentId = deriveParentId(student.studentId);
      const exists = await Parent.findOne({
        $or: [{ parentId }, { studentId: student.studentId }],
      });
      if (!exists) {
        await createParentForStudent(student);
        created++;
      }
    }

    if (created > 0) {
      console.log(`[parentSync] Sync complete — created ${created} missing parent(s)`);
    } else {
      console.log("[parentSync] Sync complete — all parents already exist");
    }
  } catch (err) {
    console.error("[parentSync] Sync failed:", err.message);
  }
};
